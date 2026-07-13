using Microsoft.AspNetCore.SignalR;

namespace MiniSeries.WebAPI.Hubs;

public class PaymentHub : Hub
{
    public async Task WatchPayment(string paymentCode)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"payment-{paymentCode.ToUpperInvariant()}");
    }

    public async Task JoinPaymentGroup(string paymentCode)
    {
        await WatchPayment(paymentCode);
    }

    public async Task UnwatchPayment(string paymentCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"payment-{paymentCode.ToUpperInvariant()}");
    }

    public async Task LeavePaymentGroup(string paymentCode)
    {
        await UnwatchPayment(paymentCode);
    }
}
