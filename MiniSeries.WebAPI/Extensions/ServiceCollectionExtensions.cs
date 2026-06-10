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
        services.AddHttpClient<GroqService>();
        services.AddHttpClient<PollinationsService>();
        services.AddHttpClient<PexelsVideoService>();
        services.Configure<CloudinaryOptions>(configuration.GetSection(CloudinaryOptions.SectionName));
        services.Configure<SupabaseOptions>(configuration.GetSection(SupabaseOptions.SectionName));
        services.Configure<PexelsOptions>(configuration.GetSection(PexelsOptions.SectionName));
        services.AddHttpClient<SupabaseRestService>();
        services.AddHttpClient<SupabaseAuthService>();

        services.AddSupabaseJwtAuthentication(configuration);

        services.AddScoped<ILLMService, GroqService>();
        services.AddScoped<IImageGenerationService>(sp => sp.GetRequiredService<PollinationsService>());
        services.AddScoped<IMangaService>(sp => sp.GetRequiredService<PollinationsService>());
        services.AddScoped<PollinationsService>();
        services.AddScoped<IVideoService>(sp =>
        {
            var pexels = configuration.GetSection(PexelsOptions.SectionName).Get<PexelsOptions>();
            return pexels is not null && !string.IsNullOrWhiteSpace(pexels.ApiKey)
                ? sp.GetRequiredService<PexelsVideoService>()
                : sp.GetRequiredService<PollinationsService>();
        });

        var databaseConnectionString = configuration.GetConnectionString("MiniSeries");
        if (string.IsNullOrWhiteSpace(databaseConnectionString))
        {
            services.AddSingleton<ILessonRepository, InMemoryLessonRepository>();
        }
        else
        {
            services.AddDbContext<MiniSeriesDbContext>(options =>
                options.UseNpgsql(databaseConnectionString));
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
            services.AddScoped<IStorageService>(sp => sp.GetRequiredService<PollinationsService>());
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
