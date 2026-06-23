namespace MiniSeries.Infrastructure.Options;

public sealed class AzureFluxOptions
{
    public const string SectionName = "AzureFlux";

    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://miniseries-resource.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview";
}
