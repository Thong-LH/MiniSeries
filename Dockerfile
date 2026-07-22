# Sử dụng .NET SDK 8.0 làm build env
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy các tệp project và restore các dependencies
COPY MiniSeries.Domain/MiniSeries.Domain.csproj MiniSeries.Domain/
COPY MiniSeries.Application/MiniSeries.Application.csproj MiniSeries.Application/
COPY MiniSeries.Infrastructure/MiniSeries.Infrastructure.csproj MiniSeries.Infrastructure/
COPY MiniSeries.WebAPI/MiniSeries.WebAPI.csproj MiniSeries.WebAPI/
RUN dotnet restore MiniSeries.WebAPI/MiniSeries.WebAPI.csproj

# Copy toàn bộ mã nguồn và biên dịch Release
COPY . ./
RUN dotnet publish MiniSeries.WebAPI/MiniSeries.WebAPI.csproj -c Release -o out

# Sử dụng ASP.NET Runtime 8.0 làm runtime env
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

# Cấu hình cổng chạy mặc định. Render sẽ tự động chuyển hướng traffic.
# Mặc định .NET 8.0 chạy cổng 8080. ta cấu hình ASPNETCORE_HTTP_PORTS=8080.
ENV ASPNETCORE_HTTP_PORTS=8080
ENV DOTNET_ServerGarbageCollection=0
ENV DOTNET_GCHeapHardLimit=0x18000000
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
EXPOSE 8080

ENTRYPOINT ["dotnet", "MiniSeries.WebAPI.dll"]
