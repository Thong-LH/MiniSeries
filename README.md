# MiniSeries

MiniSeries is an AI-assisted educational content generator that turns lesson material into a reviewed story script, then generates manga-style pages or short video assets after approval.

## Tech Stack

- .NET 8 Web API
- Minimal APIs
- MediatR
- Entity Framework Core
- Supabase PostgreSQL
- Groq for LLM generation
- Pollinations for image/video generation
- Cloudinary for optional media persistence

## Project Structure

```text
MiniSeries.Domain          Domain entities and enums
MiniSeries.Application     Commands, interfaces, and application models
MiniSeries.Infrastructure  EF Core persistence and external service clients
MiniSeries.WebAPI          API endpoints and static frontend
```

## Run Locally

```powershell
dotnet restore .\MiniSeries.sln
dotnet build .\MiniSeries.sln
dotnet run --project .\MiniSeries.WebAPI\MiniSeries.WebAPI.csproj
```

Default local URL:

```text
http://localhost:5137
```

## Main Flow

1. Create a lesson draft script.
2. Review or revise the script.
3. Approve the script.
4. Generate chapters and media.
5. Retrieve the generated lesson.

## API Endpoints

```text
POST /api/lessons/drafts
POST /api/lessons/{lessonId}/review
POST /api/lessons/{lessonId}/approve
GET  /api/lessons/{lessonId}
```

## Configuration

The app reads configuration from `appsettings.json`, user-secrets, or environment variables.

Important keys:

```text
ConnectionStrings__MiniSeries
Groq__ApiKey
Pollinations__ApiKey
Cloudinary__CloudName
Cloudinary__ApiKey
Cloudinary__ApiSecret
Cloudinary__Folder
```

If no database connection string is configured, the app falls back to in-memory storage. If Cloudinary is not configured, generated media URLs are kept as Pollinations URLs.

## Database

The current persistence layer uses Supabase PostgreSQL through EF Core migrations.

```powershell
dotnet ef database update --project .\MiniSeries.Infrastructure\MiniSeries.Infrastructure.csproj --startup-project .\MiniSeries.WebAPI\MiniSeries.WebAPI.csproj
```
