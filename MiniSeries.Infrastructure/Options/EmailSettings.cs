namespace MiniSeries.Infrastructure.Options
{
    public class EmailSettings
    {
        public string SenderEmail { get; set; } = "";
        public string Port { get; set; } = "";
        public string SenderName { get; set; } = "";
        public string SmtpServer { get; set; } = "";
        public string AppPassword { get; set; } = "";
        public string ApiKey { get; set; } = "";
    }
}