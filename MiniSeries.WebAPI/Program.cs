using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Commands.ApproveLessonScript;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Application.Lessons.Commands.GenerateLesson;
using MiniSeries.Application.Lessons.Commands.ReviewLessonScript;
using MiniSeries.Domain.Enums;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Options;
using MiniSeries.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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
    builder.Services.AddSingleton<ILessonStore, InMemoryLessonStore>();
}
else
{
    builder.Services.AddDbContext<MiniSeriesDbContext>(options =>
        options.UseNpgsql(databaseConnectionString));
    builder.Services.AddScoped<ILessonStore, EfLessonStore>();
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
    cfg.RegisterServicesFromAssembly(typeof(GenerateLessonCommand).Assembly));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

// Legacy one-shot endpoint: draft + auto approve + media generation in one request.
app.MapPost("/api/lessons/generate", async (GenerateLessonCommand command, IMediator mediator) =>
{
    var result = await mediator.Send(command);
    return Results.Ok(result);
})
.WithName("GenerateLesson");

app.MapPost("/api/lessons/drafts", async (CreateLessonDraftRequest request, IMediator mediator) =>
{
    var result = await mediator.Send(new CreateLessonDraftCommand(
        request.RawContent,
        request.Title,
        request.GenerateVideo,
        request.CreativeMode,
        request.CreativeBrief));
    return Results.Ok(result);
})
.WithName("CreateLessonDraft");

app.MapPost("/api/lessons/{lessonId:guid}/review", async (
    Guid lessonId,
    ReviewLessonScriptRequest request,
    IMediator mediator) =>
{
    var result = await mediator.Send(new ReviewLessonScriptCommand(lessonId, request.Feedback));
    return Results.Ok(result);
})
.WithName("ReviewLessonScript");

app.MapPost("/api/lessons/{lessonId:guid}/approve", async (
    Guid lessonId,
    IMediator mediator) =>
{
    var result = await mediator.Send(new ApproveLessonScriptCommand(lessonId));
    return Results.Ok(result);
})
.WithName("ApproveLessonScript");

app.MapGet("/api/lessons/{lessonId:guid}", async (
    Guid lessonId,
    ILessonStore lessonStore) =>
{
    var lesson = await lessonStore.GetByIdAsync(lessonId);
    return lesson is null ? Results.NotFound() : Results.Ok(lesson);
})
.WithName("GetLesson");

app.Run();

public sealed record CreateLessonDraftRequest(
    string RawContent,
    string Title,
    bool GenerateVideo,
    CreativeMode CreativeMode,
    string? CreativeBrief);

public sealed record ReviewLessonScriptRequest(string Feedback);
