namespace MiniSeries.Infrastructure.Options;

public sealed class SupabaseOptions
{
    public const string SectionName = "Supabase";

    public string Url { get; init; } = string.Empty;
    public string AnonKey { get; init; } = string.Empty;
    /// <summary>Chỉ dùng server-side (Admin Auth API). Không expose ra client.</summary>
    public string ServiceRoleKey { get; init; } = string.Empty;
}
