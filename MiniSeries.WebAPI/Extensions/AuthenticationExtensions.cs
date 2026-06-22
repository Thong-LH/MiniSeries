using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Options;
using MiniSeries.WebAPI.Security;
using System.Security.Claims;

namespace MiniSeries.WebAPI.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddSupabaseJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddMemoryCache();
        var supabaseOptions = configuration.GetSection(SupabaseOptions.SectionName).Get<SupabaseOptions>() ?? new();
        var supabaseAuthIssuer = string.IsNullOrWhiteSpace(supabaseOptions.Url)
            ? string.Empty
            : $"{supabaseOptions.Url.TrimEnd('/')}/auth/v1";
        var supabaseJwksUrl = string.IsNullOrWhiteSpace(supabaseAuthIssuer)
            ? string.Empty
            : $"{supabaseAuthIssuer}/.well-known/jwks.json";

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKeyResolver = (_, _, kid, _) =>
                        SupabaseJwksKeyResolver.ResolveSigningKeys(supabaseJwksUrl, kid),
                    ValidateIssuer = true,
                    ValidIssuer = supabaseAuthIssuer,
                    ValidateAudience = true,
                    ValidAudience = "authenticated",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(2),
                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var principal = context.Principal;
                        var subject = principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? principal?.FindFirstValue("sub");

                        if (!Guid.TryParse(subject, out var userId))
                        {
                            context.Fail("Supabase token does not contain a valid user id.");
                            return;
                        }

                        var memoryCache = context.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
                        var cacheKey = $"user-profile-{userId}";

                        if (!memoryCache.TryGetValue(cacheKey, out UserProfile? profile))
                        {
                            var dbContext = context.HttpContext.RequestServices.GetRequiredService<MiniSeriesDbContext>();
                            profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.Id == userId);
                            if (profile is null)
                            {
                                context.Fail("Authenticated user does not have a UserProfiles record.");
                                return;
                            }
                            // Cache the profile for 2 minutes to prevent spamming queries
                            memoryCache.Set(cacheKey, profile, TimeSpan.FromMinutes(2));
                        }

                        if (profile is not null && principal?.Identity is ClaimsIdentity identity)
                        {
                            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
                            identity.AddClaim(new Claim(ClaimTypes.Email, profile.Email ?? string.Empty));
                            identity.AddClaim(new Claim(ClaimTypes.Name, profile.FullName ?? string.Empty));
                            identity.AddClaim(new Claim(ClaimTypes.Role, AuthUser.NormalizeRole(profile.Role)));
                        }
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AuthenticatedUser", policy => policy.RequireAuthenticatedUser());
            options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
            options.AddPolicy("StaffOnly", policy => policy.RequireRole("Staff"));
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
            options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Staff", "Admin"));
        });

        return services;
    }
}
