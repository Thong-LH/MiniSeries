# Base image for running the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK image for building the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy all project files first for caching restore
COPY ["MiniSeries.sln", "./"]
COPY ["MiniSeries.WebAPI/MiniSeries.WebAPI.csproj", "MiniSeries.WebAPI/"]
COPY ["MiniSeries.Application/MiniSeries.Application.csproj", "MiniSeries.Application/"]
COPY ["MiniSeries.Domain/MiniSeries.Domain.csproj", "MiniSeries.Domain/"]
COPY ["MiniSeries.Infrastructure/MiniSeries.Infrastructure.csproj", "MiniSeries.Infrastructure/"]

# Restore dependencies
RUN dotnet restore

# Copy all source files
COPY . .

# Build and publish
WORKDIR "/src/MiniSeries.WebAPI"
RUN dotnet publish "MiniSeries.WebAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MiniSeries.WebAPI.dll"]
