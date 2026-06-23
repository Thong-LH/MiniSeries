using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace MiniSeries.Infrastructure.ExternalServices;

public sealed class CloudinaryStorageService : IStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly CloudinaryOptions _options;

    public CloudinaryStorageService(
        IOptions<CloudinaryOptions> options,
        IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        EnsureConfigured();

        _cloudinary = new Cloudinary(new Account(
            _options.CloudName,
            _options.ApiKey,
            _options.ApiSecret));
    }

    public async Task<string> UploadAsync(string sourceUrl, string fileName)
    {
        EnsureConfigured();

        var publicId = SanitizePublicId(fileName);
        var isVideo = fileName.Contains("vid", StringComparison.OrdinalIgnoreCase)
                      || sourceUrl.Contains("/video/", StringComparison.OrdinalIgnoreCase)
                      || sourceUrl.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase);

        if (isVideo)
        {
            try
            {
                var upload = new VideoUploadParams
                {
                    File = new FileDescription(fileName, sourceUrl),
                    PublicId = publicId,
                    AssetFolder = _options.Folder,
                    UseAssetFolderAsPublicIdPrefix = true,
                    Overwrite = true
                };

                var result = await _cloudinary.UploadAsync(upload);
                if (result.Error is not null)
                {
                    try
                    {
                        await using var sourceStream = await DownloadSourceAsync(sourceUrl);
                        upload.File = new FileDescription(fileName, sourceStream);
                        result = await _cloudinary.UploadAsync(upload);
                    }
                    catch
                    {
                        return sourceUrl;
                    }
                }
                
                if (result.Error is not null)
                {
                    return sourceUrl;
                }
                
                return result.SecureUrl?.ToString() ?? sourceUrl;
            }
            catch
            {
                return sourceUrl;
            }
        }

        try
        {
            var imageUpload = new ImageUploadParams
            {
                File = new FileDescription(fileName, sourceUrl),
                PublicId = publicId,
                AssetFolder = _options.Folder,
                UseAssetFolderAsPublicIdPrefix = true,
                Overwrite = true
            };

            var imageResult = await _cloudinary.UploadAsync(imageUpload);
            if (imageResult.Error is not null)
            {
                try
                {
                    await using var sourceStream = await DownloadSourceAsync(sourceUrl);
                    imageUpload.File = new FileDescription(fileName, sourceStream);
                    imageResult = await _cloudinary.UploadAsync(imageUpload);
                }
                catch
                {
                    return sourceUrl;
                }
            }

            if (imageResult.Error is not null)
            {
                return sourceUrl;
            }
            
            return imageResult.SecureUrl?.ToString() ?? sourceUrl;
        }
        catch
        {
            return sourceUrl;
        }
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.CloudName) ||
            string.IsNullOrWhiteSpace(_options.ApiKey) ||
            string.IsNullOrWhiteSpace(_options.ApiSecret))
        {
            throw new InvalidOperationException(
                "Cloudinary is not configured. Set Cloudinary:CloudName, Cloudinary:ApiKey and Cloudinary:ApiSecret.");
        }
    }

    private static string SanitizePublicId(string value)
    {
        return string.Join("_", value.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
    }

    private static bool IsRemoteFetchFailure(string? message)
    {
        return message?.Contains("Timed out", StringComparison.OrdinalIgnoreCase) == true
               || message?.Contains("Error in loading", StringComparison.OrdinalIgnoreCase) == true;
    }

    private async Task<Stream> DownloadSourceAsync(string sourceUrl)
    {
        if (sourceUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            var commaIndex = sourceUrl.IndexOf(',');
            if (commaIndex >= 0)
            {
                var base64Part = sourceUrl.Substring(commaIndex + 1);
                var bytes = Convert.FromBase64String(base64Part);
                return new MemoryStream(bytes);
            }
        }

        var httpClient = _httpClientFactory.CreateClient();
        int maxRetries = 4;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(25));
            try
            {
                var response = await httpClient.GetAsync(sourceUrl, cts.Token);
                if (response.IsSuccessStatusCode)
                {
                    var stream = new MemoryStream();
                    await response.Content.CopyToAsync(stream);
                    stream.Position = 0;
                    return stream;
                }
            }
            catch (Exception)
            {
            }
            
            if (attempt < maxRetries)
            {
                await Task.Delay(1500);
            }
        }
        
        throw new InvalidOperationException("Source media download failed after 4 attempts.");
    }

    private static void ThrowIfFailed(RawUploadResult result)
    {
        if (result.Error is not null)
        {
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
        }
    }
}
