using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;

namespace MiniSeries.WebAPI.Security;

public static class SupabaseJwksKeyResolver
{
    private sealed record CachedKeys(DateTimeOffset ExpiresAt, IReadOnlyCollection<SecurityKey> Keys);

    private static readonly ConcurrentDictionary<string, CachedKeys> Cache = new();
    private static readonly HttpClient HttpClient = new();

    public static IEnumerable<SecurityKey> ResolveSigningKeys(string jwksUrl, string? keyId)
    {
        if (string.IsNullOrWhiteSpace(jwksUrl))
        {
            return [];
        }

        var keys = GetSigningKeys(jwksUrl);
        return string.IsNullOrWhiteSpace(keyId)
            ? keys
            : keys.Where(key => string.Equals(key.KeyId, keyId, StringComparison.Ordinal));
    }

    private static IReadOnlyCollection<SecurityKey> GetSigningKeys(string jwksUrl)
    {
        if (Cache.TryGetValue(jwksUrl, out var cached) && cached.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return cached.Keys;
        }

        var json = HttpClient.GetStringAsync(jwksUrl).GetAwaiter().GetResult();
        var keys = new JsonWebKeySet(json).GetSigningKeys().ToArray();
        Cache[jwksUrl] = new CachedKeys(DateTimeOffset.UtcNow.AddMinutes(30), keys);
        return keys;
    }
}
