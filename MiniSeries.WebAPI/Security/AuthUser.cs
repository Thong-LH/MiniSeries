using System.Security.Claims;

namespace MiniSeries.WebAPI.Security;

public static class AuthUser
{
    public static string NormalizeRole(string? role)
    {
        return (role ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "admin" => "Admin",
            "staff" => "Staff",
            _ => "Customer"
        };
    }

    public static Guid? GetCurrentUserId(ClaimsPrincipal user)
    {
        var subject = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return Guid.TryParse(subject, out var userId) ? userId : null;
    }

    public static string? GetCurrentUserEmail(ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");

    public static string? GetCurrentUserName(ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Name);
}
