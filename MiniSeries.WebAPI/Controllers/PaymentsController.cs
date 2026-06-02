using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;

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

        var pendingOrders = await dbContext.PaymentOrders
            .Where(o => !o.IsCompleted)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        var matched = pendingOrders
            .FirstOrDefault(o => contentUpper.Contains(o.PaymentCode, StringComparison.OrdinalIgnoreCase));

        if (matched is null)
        {
            return BadRequest(new { message = "No matching pending invoice." });
        }

        try
        {
            await supabaseDb.InsertPaymentHistoryAsync(
                matched.UserEmail,
                amount,
                matched.PaymentCode,
                content);

            matched.IsCompleted = true;
            matched.Status = "Paid";
            matched.PaidAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();

            var quota = await quotaService.ApplyPaidPlanAsync(Guid.Parse(matched.UserId), matched.PlanName);

            return Ok(new
            {
                success = true,
                message = "Payment history saved.",
                orderId = matched.Id,
                paymentCode = matched.PaymentCode,
                status = matched.Status,
                planName = quota.PlanName,
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
                return Ok(new
                {
                    isPaid = true,
                    orderId = order.Id,
                    status = order.Status,
                    planName = order.PlanName,
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
}
