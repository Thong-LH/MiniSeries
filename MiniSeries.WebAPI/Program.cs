using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Options;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Repositories;
using MiniSeries.WebAPI.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient<GroqService>();
builder.Services.AddHttpClient<PollinationsService>();
builder.Services.Configure<CloudinaryOptions>(builder.Configuration.GetSection(CloudinaryOptions.SectionName));

builder.Services.AddScoped<ILLMService, GroqService>();
builder.Services.AddScoped<IImageGenerationService>(sp => sp.GetRequiredService<PollinationsService>());
builder.Services.AddScoped<IMangaService>(sp => sp.GetRequiredService<PollinationsService>());
builder.Services.AddScoped<IVideoService>(sp => sp.GetRequiredService<PollinationsService>());
builder.Services.AddScoped<PollinationsService>();

var databaseConnectionString = builder.Configuration.GetConnectionString("MiniSeries");
if (string.IsNullOrWhiteSpace(databaseConnectionString))
{
    builder.Services.AddSingleton<ILessonRepository, InMemoryLessonRepository>();
}
else
{
    builder.Services.AddDbContext<MiniSeriesDbContext>(options =>
        options.UseNpgsql(databaseConnectionString));
    builder.Services.AddScoped<ILessonRepository, LessonRepository>();
}

var cloudinary = builder.Configuration.GetSection(CloudinaryOptions.SectionName).Get<CloudinaryOptions>();
if (cloudinary is not null &&
    !string.IsNullOrWhiteSpace(cloudinary.CloudName) &&
    !string.IsNullOrWhiteSpace(cloudinary.ApiKey) &&
    !string.IsNullOrWhiteSpace(cloudinary.ApiSecret))
{
    builder.Services.AddScoped<IStorageService, CloudinaryStorageService>();
}
else
{
    builder.Services.AddScoped<IStorageService>(sp => sp.GetRequiredService<PollinationsService>());
}

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(CreateLessonDraftCommand).Assembly));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();

app.Run();
