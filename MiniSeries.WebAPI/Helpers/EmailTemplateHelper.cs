using System;

namespace MiniSeries.WebAPI.Helpers
{
    public static class EmailTemplateHelper
    {
        private const string CommonLayout = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>MiniSeriesLearning</title>
    <link href=""https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,700;1,400&display=swap"" rel=""stylesheet"">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #09090b;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #d4d4d8;
            -webkit-font-smoothing: antialiased;
        }
        
        .email-card {
            border: 1px solid #27272a !important;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .email-card:hover {
            border-color: #6366f1 !important;
            box-shadow: 0 15px 35px rgba(99, 102, 241, 0.15) !important;
        }
        
        .otp-display {
            border: 1px solid #3f3f46 !important;
            transition: all 0.3s ease;
        }
        .otp-display:hover {
            border-color: #38bdf8 !important;
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.15) !important;
        }
    </style>
</head>
<body style=""margin: 0; padding: 0; background-color: #09090b; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #d4d4d8;"">
    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #09090b; table-layout: fixed; width: 100%;"">
        <tr>
            <td align=""center"" style=""padding: 48px 16px 64px 16px;"">
                <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" class=""email-card"" style=""max-width: 520px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; border-collapse: separate; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5); overflow: hidden;"">
                    <tr>
                        <td height=""4"" style=""font-size: 0; line-height: 0; background: #6366f1; background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #38bdf8 100%);""></td>
                    </tr>
                    <tr>
                        <td style=""padding: 40px 32px 32px 32px;"">
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                                <tr>
                                    <td align=""center"" style=""padding-bottom: 32px; border-bottom: 1px solid #27272a;"">
                                        <span style=""font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: #ffffff; text-decoration: none;"">
                                            <span style=""color: #6366f1;"">M</span>ini<span style=""color: #a855f7;"">S</span>eries<span style=""color: #38bdf8;"">L</span>earning
                                        </span>
                                        <div style=""color: #71717a; font-family: 'Outfit', sans-serif; font-size: 10px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;"">
                                            Hệ thống bài học chuyển đổi tự động bằng Video & Manga
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding: 0 32px 32px 32px;"">
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                                <tr>
                                    <td style=""font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.7; color: #d4d4d8;"">
                                        {EMAIL_BODY}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding: 0 32px 40px 32px;"">
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-top: 1px solid #27272a; padding-top: 24px;"">
                                <tr>
                                    <td align=""center"" style=""font-family: 'Outfit', -apple-system, sans-serif; font-size: 11px; color: #52525b; line-height: 1.6;"">
                                        <p style=""margin: 0 0 4px 0; color: #71717a;"">Đây là thư được gửi tự động từ hệ thống MiniSeriesLearning.</p>
                                        <p style=""margin: 0; color: #52525b;"">© 2026 MiniSeries. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

        public static string BuildActivationOtp(string fullName, string otpCode, string email)
        {
            var body = $@"
            <h2 style=""font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 500; color: #fb923c; margin-top: 0; margin-bottom: 20px; line-height: 1.4;"">Kích Hoạt Tài Khoản</h2>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Chào bạn <strong>{fullName}</strong>,</p>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Mã xác thực OTP để hoàn tất đăng ký tài khoản của bạn là:</p>

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 24px 0;"">
                <tr>
                    <td align=""center"">
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" class=""otp-display"" style=""background-color: #09090b; border: 1px solid #3f3f46; border-radius: 8px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);"">
                            <tr>
                                <td align=""center"" style=""padding: 20px 40px; font-family: 'Outfit', 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #38bdf8; letter-spacing: 8px;"">
                                    {otpCode}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style=""font-size: 13px; color: #71717a; margin-top: 24px; margin-bottom: 0; border-top: 1px dashed #27272a; padding-top: 16px;"">
                Mã xác nhận này được áp dụng riêng cho tài khoản đăng ký: <span style=""color: #a1a1aa; font-weight: 600;"">{email}</span>. Vui lòng hoàn tất quá trình xác minh sớm để bắt đầu trải nghiệm dịch vụ.
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildResetPasswordOtp(string email, string otpCode)
        {
            var body = $@"
            <h2 style=""font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 500; color: #fb923c; margin-top: 0; margin-bottom: 20px; line-height: 1.4;"">Khôi Phục Mật Khẩu</h2>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Chào bạn,</p>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Mã OTP xác thực là:</p>

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 24px 0;"">
                <tr>
                    <td align=""center"">
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" class=""otp-display"" style=""background-color: #09090b; border: 1px solid #3f3f46; border-radius: 8px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);"">
                            <tr>
                                <td align=""center"" style=""padding: 20px 40px; font-family: 'Outfit', 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #38bdf8; letter-spacing: 8px;"">
                                    {otpCode}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style=""font-size: 13px; color: #71717a; margin-top: 24px; margin-bottom: 0; border-top: 1px dashed #27272a; padding-top: 16px;"">
                Áp dụng cho tài khoản: <span style=""color: #a1a1aa; font-weight: 600;"">{email}</span>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận hỗ trợ của chúng tôi để đảm bảo an toàn cho tài khoản.
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildSupportTicketReply(string ticketContent, string ticketReply, string senderName)
        {
            var body = $@"
            <h2 style=""font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 500; color: #fb923c; margin-top: 0; margin-bottom: 20px; line-height: 1.4;"">Phản Hồi Yêu Cầu Hỗ Trợ</h2>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Chào bạn,</p>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Yêu cầu hỗ trợ của bạn đã nhận được phản hồi từ Ban quản trị:</p>

            <div style=""margin-top: 20px; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 700; letter-spacing: 1px;"">Yêu cầu của bạn:</div>
            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 20px;"">
                <tr>
                    <td style=""background-color: #09090b; border-left: 3px solid #38bdf8; border-radius: 0 6px 6px 0; padding: 14px 18px; color: #a1a1aa; font-family: 'Lora', Georgia, serif; font-size: 14px; font-style: italic; line-height: 1.6;"">
                        ""{ticketContent}""
                    </td>
                </tr>
            </table>

            <div style=""margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 700; letter-spacing: 1px;"">Phản hồi từ hỗ trợ:</div>
            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 24px;"">
                <tr>
                    <td style=""background-color: #1c1917; border-left: 3px solid #fb923c; border-radius: 0 6px 6px 0; padding: 16px 20px; color: #fafafa; font-size: 14.5px; line-height: 1.6; white-space: pre-wrap;"">
                        {ticketReply}
                    </td>
                </tr>
            </table>

            <p style=""margin-top: 24px; margin-bottom: 0; color: #71717a;"">
                Trân trọng,<br/>
                <strong style=""color: #a1a1aa;"">Đội ngũ hỗ trợ {senderName}</strong>
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildCskhMessage(string cskhContent, string senderName)
        {
            var body = $@"
            <h2 style=""font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 500; color: #fb923c; margin-top: 0; margin-bottom: 20px; line-height: 1.4;"">Thông Tin Chăm Sóc Khách Hàng</h2>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Chào bạn,</p>

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top: 16px; margin-bottom: 24px;"">
                <tr>
                    <td style=""background-color: #121214; border: 1px solid #27272a; border-left: 4px solid #a855f7; border-radius: 6px; padding: 20px; color: #e4e4e7; font-size: 15px; line-height: 1.7; white-space: pre-wrap;"">
                        {cskhContent}
                    </td>
                </tr>
            </table>

            <p style=""margin-top: 24px; margin-bottom: 0; color: #71717a;"">
                Trân trọng,<br/>
                <strong style=""color: #a1a1aa;"">Ban quản trị {senderName}</strong>
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }
    }
}
