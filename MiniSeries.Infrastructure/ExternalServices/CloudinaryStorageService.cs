using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace MiniSeries.Infrastructure.ExternalServices;

public sealed class CloudinaryStorageService : IStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly CloudinaryOptions _options;

    public CloudinaryStorageService(IOptions<CloudinaryOptions> options)
    {
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

        var publicId = $"{_options.Folder}/{SanitizePublicId(fileName)}";
        var isVideo = fileName.Contains("vid", StringComparison.OrdinalIgnoreCase)
                      || sourceUrl.Contains("/video/", StringComparison.OrdinalIgnoreCase)
                      || sourceUrl.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase);

        if (isVideo)
        {
            var upload = new VideoUploadParams
            {
                File = new FileDescription(fileName, sourceUrl),
                PublicId = publicId,
                Overwrite = true
            };

            var result = await _cloudinary.UploadAsync(upload);
            ThrowIfFailed(result);
            return result.SecureUrl?.ToString()
                   ?? throw new InvalidOperationException("Cloudinary did not return a video URL.");
        }

        var imageUpload = new ImageUploadParams
        {
            File = new FileDescription(fileName, sourceUrl),
            PublicId = publicId,
            Overwrite = true
        };

        var imageResult = await _cloudinary.UploadAsync(imageUpload);
        ThrowIfFailed(imageResult);
        return imageResult.SecureUrl?.ToString()
               ?? throw new InvalidOperationException("Cloudinary did not return an image URL.");
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

    private static void ThrowIfFailed(RawUploadResult result)
    {
        if (result.Error is not null)
        {
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
        }
    }
}
