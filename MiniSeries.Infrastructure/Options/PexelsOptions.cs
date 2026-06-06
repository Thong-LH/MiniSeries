namespace MiniSeries.Infrastructure.Options;

public sealed class PexelsOptions
{
    public const string SectionName = "Pexels";

    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.pexels.com";
}
