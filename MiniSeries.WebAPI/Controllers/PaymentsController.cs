using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;
using Npgsql;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/payment")]
public sealed class PaymentsController(
    SupabaseRestService supabaseDb,
    MiniSeriesDbContext dbContext,
    UserPlanQuotaService quotaService) : ControllerBase
{
    [Authorize(Policy = "AuthenticatedUser")]
    [HttpPost("create-invoice")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest req)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        string resolvedUserId = currentUserId.Value.ToString();
        string userEmail;

        try
        {
            var profile = await supabaseDb.GetUserProfileByIdAsync(currentUserId.Value);
            userEmail = profile?.Email ?? AuthUser.GetCurrentUserEmail(User) ?? string.Empty;
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                return BadRequest(new { message = "Khong tim thay email cua tai khoan dang dang nhap." });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        if (req.Amount <= 0)
        {
            return BadRequest(new { message = "amount phai lon hon 0." });
        }

        string cleanId = resolvedUserId.Replace("-", "", StringComparison.Ordinal);
        if (cleanId.Length < 4)
        {
            return BadRequest(new { message = "Ma nguoi dung qua ngan hoac khong hop le." });
        }

        var oldOrders = await dbContext.PaymentOrders
            .Where(o => o.UserId == resolvedUserId && !o.IsCompleted)
            .ToListAsync();
        dbContext.PaymentOrders.RemoveRange(oldOrders);

        var safeCode = await GeneratePaymentCodeAsync(cleanId[^4..].ToUpperInvariant());
        var plan = UserPlanQuotaService.ResolvePlan(req.PlanName);
        var order = new PaymentOrder
        {
            UserId = resolvedUserId,
            UserEmail = userEmail,
            PlanName = plan.Name,
            PaymentCode = safeCode,
            MoneyAmount = req.Amount,
            TokensAmount = plan.MonthlyGenerationLimit,
            Status = "Pending",
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.PaymentOrders.Add(order);
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            orderId = order.Id,
            paymentCode = order.PaymentCode,
            userId = order.UserId,
            userEmail = order.UserEmail,
            planName = order.PlanName,
            mangaMonthlyLimit = plan.MangaMonthlyLimit,
            videoMonthlyLimit = plan.VideoMonthlyLimit,
            monthlyGenerationLimit = order.TokensAmount,
            status = order.Status
        });
    }

    [Authorize(Policy = "AuthenticatedUser")]
    [HttpGet("webhook-gateway")]
    public async Task<IActionResult> GetWebhookGateway()
    {
        try
        {
            using var client = new HttpClient();
            var url = "https://webhook.site/token/ee7acda5-ed3d-42df-bade-39d0ce0cb17a/requests?sorting=newest";
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (.NET Proxy)");

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode);
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            return Content(jsonString, "application/json");
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }

    [HttpPost("bank-webhook")]
    public async Task<IActionResult> BankWebhook([FromBody] BankWebhookModel bankData)
    {
        string content = bankData.Content ?? "";
        string contentUpper = content.ToUpperInvariant();
        var amount = bankData.TransferAmount > 0 ? bankData.TransferAmount : bankData.Amount;

        var recentOrders = await dbContext.PaymentOrders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        var matched = recentOrders
            .FirstOrDefault(o => contentUpper.Contains(o.PaymentCode, StringComparison.OrdinalIgnoreCase));

        if (matched is null)
        {
            return BadRequest(new { message = "No matching pending invoice." });
        }

        if (matched.IsCompleted)
        {
            var existingHistory = await EnsurePaymentHistoryAsync(matched, amount, content);
            if (dbContext.Entry(existingHistory).State == EntityState.Added)
            {
                await dbContext.SaveChangesAsync();
            }

            return Ok(new
            {
                success = true,
                message = "Payment already processed.",
                orderId = matched.Id,
                historyId = existingHistory.Id,
                paymentCode = matched.PaymentCode,
                status = matched.Status,
                planName = matched.PlanName,
                paidAt = matched.PaidAt
            });
        }

        try
        {
            matched.IsCompleted = true;
            matched.Status = "Paid";
            matched.PaidAt = DateTime.UtcNow;
            var history = await EnsurePaymentHistoryAsync(matched, amount, content);

            var quota = await quotaService.ApplyPaidPlanAsync(Guid.Parse(matched.UserId), matched.PlanName);

            try
            {
                await supabaseDb.InsertPaymentHistoryAsync(
                    matched.UserEmail,
                    amount,
                    matched.PaymentCode,
                    content);
            }
            catch
            {
                // EF PaymentHistories is the primary history source. Keep the old
                // Supabase REST table best-effort for existing admin/demo screens.
            }

            return Ok(new
            {
                success = true,
                message = "Payment history saved.",
                orderId = matched.Id,
                historyId = history.Id,
                paymentCode = matched.PaymentCode,
                status = matched.Status,
                planName = quota.PlanName,
                mangaMonthlyLimit = quota.MangaMonthlyLimit,
                remainingMangaCount = quota.RemainingMangaCount,
                videoMonthlyLimit = quota.VideoMonthlyLimit,
                remainingVideoCount = quota.RemainingVideoCount,
                monthlyGenerationLimit = quota.MonthlyGenerationLimit,
                remainingGenerationCount = quota.RemainingGenerationCount
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AuthenticatedUser")]
    [HttpGet("my-history")]
    public async Task<IActionResult> GetMyPaymentHistory()
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var userId = currentUserId.Value.ToString();
        var orders = await dbContext.PaymentOrders
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        List<PaymentHistory> histories;
        try
        {
            histories = await dbContext.PaymentHistories
                .AsNoTracking()
                .Where(h => h.UserId == userId)
                .ToListAsync();
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            histories = [];
        }

        var historyByOrderId = histories
            .Where(h => h.PaymentOrderId.HasValue)
            .ToDictionary(h => h.PaymentOrderId!.Value);
        var historyByCode = histories
            .GroupBy(h => h.PaymentCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var result = orders.Select(order =>
        {
            historyByOrderId.TryGetValue(order.Id, out var history);
            history ??= historyByCode.GetValueOrDefault(order.PaymentCode);

            return new
            {
                historyId = history?.Id,
                orderId = order.Id,
                paymentCode = order.PaymentCode,
                userEmail = order.UserEmail,
                planName = history?.PlanName ?? order.PlanName,
                amount = history?.Amount ?? order.MoneyAmount,
                tokensReceived = history?.TokensReceived ?? order.TokensAmount,
                status = history?.Status ?? order.Status,
                isCompleted = order.IsCompleted,
                content = history?.Content ?? string.Empty,
                createdAt = order.CreatedAt,
                paidAt = history?.PaidAt ?? order.PaidAt
            };
        });

        return Ok(result);
    }

    [Authorize(Policy = "AuthenticatedUser")]
    [HttpGet("check-status")]
    public async Task<IActionResult> CheckStatus([FromQuery] string? userId, [FromQuery] string code)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var resolvedUserId = currentUserId.Value.ToString();
        if (string.IsNullOrWhiteSpace(code))
        {
            return Ok(new { isPaid = false });
        }

        var order = await dbContext.PaymentOrders
            .FirstOrDefaultAsync(o => o.UserId == resolvedUserId && o.PaymentCode == code);
        if (order is not null)
        {
            if (order.IsCompleted)
            {
                var plan = UserPlanQuotaService.ResolvePlan(order.PlanName);
                return Ok(new
                {
                    isPaid = true,
                    orderId = order.Id,
                    status = order.Status,
                    planName = order.PlanName,
                    mangaMonthlyLimit = plan.MangaMonthlyLimit,
                    videoMonthlyLimit = plan.VideoMonthlyLimit,
                    monthlyGenerationLimit = order.TokensAmount,
                    paidAt = order.PaidAt
                });
            }

            return Ok(new
            {
                isPaid = false,
                orderId = order.Id,
                status = order.Status
            });
        }

        try
        {
            var historyList = await supabaseDb.ListPaymentHistoryAsync();
            var hasPaidOnCloud = historyList.Any(h =>
                h.TransactionCode == code ||
                (h.Content != null && h.Content.Contains(code, StringComparison.OrdinalIgnoreCase)));

            return Ok(new { isPaid = hasPaidOnCloud, status = hasPaidOnCloud ? "Paid" : "NotFound" });
        }
        catch
        {
            return Ok(new { isPaid = false, status = "NotFound" });
        }
    }

    private async Task<string> GeneratePaymentCodeAsync(string userSuffix)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var randomPart = Random.Shared.Next(1000, 9999).ToString();
            var code = $"MGX{userSuffix}{randomPart}";
            var exists = await dbContext.PaymentOrders.AnyAsync(o => o.PaymentCode == code);
            if (!exists)
            {
                return code;
            }
        }

        return $"MGX{userSuffix}{Guid.NewGuid():N}"[..18].ToUpperInvariant();
    }

    private async Task<PaymentHistory> EnsurePaymentHistoryAsync(
        PaymentOrder order,
        decimal amount,
        string content)
    {
        var existing = await dbContext.PaymentHistories
            .FirstOrDefaultAsync(x => x.PaymentCode == order.PaymentCode);
        if (existing is not null)
        {
            return existing;
        }

        var history = new PaymentHistory
        {
            PaymentOrderId = order.Id,
            UserId = order.UserId,
            UserEmail = order.UserEmail,
            PaymentCode = order.PaymentCode,
            Amount = amount > 0 ? amount : order.MoneyAmount,
            PlanName = order.PlanName,
            TokensReceived = order.TokensAmount,
            Status = "Paid",
            Content = content,
            CreatedAt = DateTime.UtcNow,
            PaidAt = order.PaidAt ?? DateTime.UtcNow
        };

        dbContext.PaymentHistories.Add(history);
        return history;
    }
}
