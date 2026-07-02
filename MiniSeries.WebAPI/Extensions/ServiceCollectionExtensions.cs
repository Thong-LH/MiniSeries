using Microsoft.EntityFrameworkCore;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Options;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Repositories;
using MiniSeries.Infrastructure.Services;

namespace MiniSeries.WebAPI.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddMiniSeriesServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddControllers();
        services.AddHttpClient<GroqService>(client => client.Timeout = TimeSpan.FromSeconds(300));
        services.AddHttpClient<PollinationsService>(client => client.Timeout = TimeSpan.FromSeconds(300));
        services.AddHttpClient<PexelsVideoService>(client => client.Timeout = TimeSpan.FromSeconds(300));
        services.AddHttpClient<AzureFluxService>(client => client.Timeout = TimeSpan.FromSeconds(300));
        services.Configure<CloudinaryOptions>(configuration.GetSection(CloudinaryOptions.SectionName));
        services.Configure<SupabaseOptions>(configuration.GetSection(SupabaseOptions.SectionName));
        services.Configure<PexelsOptions>(configuration.GetSection(PexelsOptions.SectionName));
        services.Configure<AzureFluxOptions>(configuration.GetSection(AzureFluxOptions.SectionName));
        services.AddHttpClient<SupabaseAuthService>();
        services.AddHttpClient<SupabaseAdminAuthService>();

        services.AddSupabaseJwtAuthentication(configuration);

        services.AddScoped<ILLMService>(sp => sp.GetRequiredService<GroqService>());
        services.AddScoped<IImageGenerationService>(sp =>
        {
            var azureFlux = configuration.GetSection(AzureFluxOptions.SectionName).Get<AzureFluxOptions>();
            if (azureFlux is null || string.IsNullOrWhiteSpace(azureFlux.ApiKey))
            {
                throw new InvalidOperationException("AzureFlux:ApiKey is missing in configuration. Pollinations fallback is disabled.");
            }
            return sp.GetRequiredService<AzureFluxService>();
        });
        services.AddScoped<IMangaService>(sp =>
        {
            var azureFlux = configuration.GetSection(AzureFluxOptions.SectionName).Get<AzureFluxOptions>();
            if (azureFlux is null || string.IsNullOrWhiteSpace(azureFlux.ApiKey))
            {
                throw new InvalidOperationException("AzureFlux:ApiKey is missing in configuration. Pollinations fallback is disabled.");
            }
            return sp.GetRequiredService<AzureFluxService>();
        });
        services.AddScoped<IVideoService>(sp =>
        {
            var pexels = configuration.GetSection(PexelsOptions.SectionName).Get<PexelsOptions>();
            if (pexels is null || string.IsNullOrWhiteSpace(pexels.ApiKey))
            {
                throw new InvalidOperationException("Pexels:ApiKey is missing in configuration. Pollinations fallback is disabled.");
            }
            return sp.GetRequiredService<PexelsVideoService>();
        });

       var databaseConnectionString = configuration.GetConnectionString("MiniSeries") 
                                       ?? configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(databaseConnectionString))
        {
            // Nếu hoàn toàn không cấu hình connection string nào, ép buộc nổ lỗi rõ ràng để bạn biết
            throw new InvalidOperationException("Database Connection String không tìm thấy trong appsettings.json! Hãy kiểm tra lại key 'MiniSeries' hoặc 'DefaultConnection'.");
        }
        else
        {
            services.AddDbContext<MiniSeriesDbContext>(options =>
                options.UseNpgsql(databaseConnectionString, o => o.EnableRetryOnFailure()));
            services.AddScoped<ILessonRepository, LessonRepository>();
            services.AddScoped<UserPlanQuotaService>();
        }

        var cloudinary = configuration.GetSection(CloudinaryOptions.SectionName).Get<CloudinaryOptions>();
        if (cloudinary is not null &&
            !string.IsNullOrWhiteSpace(cloudinary.CloudName) &&
            !string.IsNullOrWhiteSpace(cloudinary.ApiKey) &&
            !string.IsNullOrWhiteSpace(cloudinary.ApiSecret))
        {
            services.AddScoped<IStorageService, CloudinaryStorageService>();
        }
        else
        {
            throw new InvalidOperationException("Cloudinary is not configured correctly. Pollinations fallback is disabled.");
        }

        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(CreateLessonDraftCommand).Assembly));

        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNameCaseInsensitive = true;
        });

        return services;
    }
}
