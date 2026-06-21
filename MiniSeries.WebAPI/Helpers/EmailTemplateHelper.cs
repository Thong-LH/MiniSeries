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
</head>
<body style=""margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #24292f; -webkit-font-smoothing: antialiased;"">
    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #ffffff; table-layout: fixed; width: 100%;"">
        <tr>
            <td align=""center"" style=""padding: 40px 16px 64px 16px;"">
                <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 520px; background-color: #ffffff; border: 1px solid #d0d7de; border-radius: 6px; border-collapse: separate; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);"">
                    <tr>
                        <td align=""center"" style=""padding: 32px 32px 0 32px;"">
                            <span style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: #24292f; text-decoration: none;"">
                                <span style=""color: #6366f1;"">M</span>ini<span style=""color: #a855f7;"">S</span>eries<span style=""color: #0969da;"">L</span>earning
                            </span>
                            <div style=""color: #57606a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;"">
                                Idea to Animation & Manga
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding: 24px 32px 32px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #24292f;"">
                            {EMAIL_BODY}
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding: 0 32px 32px 32px;"">
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-top: 1px solid #d0d7de; padding-top: 20px;"">
                                <tr>
                                    <td align=""center"" style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #57606a; line-height: 1.5;"">
                                        <p style=""margin: 0 0 4px 0; color: #57606a;"">Đây là thư được gửi tự động từ hệ thống MiniSeriesLearning.</p>
                                        <p style=""margin: 0; color: #8c959f;"">© 2026 MiniSeries. All rights reserved.</p>
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
            <h2 style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #24292f; margin-top: 0; margin-bottom: 16px; line-height: 1.4;"">Kích Hoạt Tài Khoản</h2>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Chào bạn <strong>{fullName}</strong>,</p>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Mã xác thực OTP để hoàn tất đăng ký tài khoản của bạn là:</p>

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 20px 0;"">
                <tr>
                    <td align=""center"">
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;"">
                            <tr>
                                <td align=""center"" style=""padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; font-size: 26px; font-weight: 700; color: #0969da; letter-spacing: 6px;"">{otpCode}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style=""font-size: 12px; color: #57606a; margin-top: 20px; margin-bottom: 0; border-top: 1px dashed #d0d7de; padding-top: 12px;"">
                Mã xác nhận này được áp dụng riêng cho tài khoản đăng ký: <span style=""color: #24292f; font-weight: 600;"">{email}</span>. Vui lòng hoàn tất xác minh sớm để bắt đầu sử dụng dịch vụ.
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildResetPasswordOtp(string email, string otpCode)
        {
            var body = $@"
            <h2 style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #24292f; margin-top: 0; margin-bottom: 16px; line-height: 1.4;"">Khôi Phục Mật Khẩu</h2>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Chào bạn,</p>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Mã OTP xác thực là:</p>

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 20px 0;"">
                <tr>
                    <td align=""center"">
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;"">
                            <tr>
                                <td align=""center"" style=""padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; font-size: 26px; font-weight: 700; color: #0969da; letter-spacing: 6px;"">{otpCode}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style=""font-size: 12px; color: #57606a; margin-top: 20px; margin-bottom: 0; border-top: 1px dashed #d0d7de; padding-top: 12px;"">
                Áp dụng cho tài khoản: <span style=""color: #24292f; font-weight: 600;"">{email}</span>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua thư này để đảm bảo an toàn cho tài khoản.
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildSupportTicketReply(string ticketContent, string ticketReply, string senderName)
        {
            var body = $@"
            <h2 style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #24292f; margin-top: 0; margin-bottom: 16px; line-height: 1.4;"">Phản Hồi Yêu Cầu Hỗ Trợ</h2>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Chào bạn,</p>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Ban quản trị đã phản hồi yêu cầu hỗ trợ của bạn:</p>

            <div style=""margin-top: 16px; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #57606a; font-weight: 700; letter-spacing: 0.5px;"">Yêu cầu của bạn:</div>
            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 16px;"">
                <tr>
                    <td style=""background-color: #f6f8fa; border-left: 3px solid #8c959f; border-radius: 0 4px 4px 0; padding: 12px 16px; color: #57606a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13.5px; font-style: italic; line-height: 1.5;"">""{ticketContent}""</td>
                </tr>
            </table>

            <div style=""margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #57606a; font-weight: 700; letter-spacing: 0.5px;"">Phản hồi từ hỗ trợ:</div>
            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 20px;"">
                <tr>
                    <td style=""background-color: #fafcfb; border: 1px solid #d0d7de; border-left: 4px solid #1a7f37; border-radius: 6px; padding: 14px 18px; color: #24292f; font-size: 14px; line-height: 1.5; white-space: pre-wrap;"">{ticketReply}</td>
                </tr>
            </table>

            <p style=""margin-top: 20px; margin-bottom: 0; color: #57606a;"">
                Trân trọng,<br/>
                <strong style=""color: #24292f;"">Đội ngũ hỗ trợ {senderName}</strong>
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildCskhMessage(string cskhContent, string senderName)
        {
            var body = $@"
            <h2 style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #24292f; margin-top: 0; margin-bottom: 16px; line-height: 1.4;"">Thông Tin Chăm Sóc Khách Hàng</h2>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Chào bạn,</p>

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top: 12px; margin-bottom: 20px;"">
                <tr>
                    <td style=""background-color: #f6f8fa; border: 1px solid #d0d7de; border-left: 4px solid #0969da; border-radius: 6px; padding: 16px; color: #24292f; font-size: 14px; line-height: 1.5; white-space: pre-wrap;"">{cskhContent}</td>
                </tr>
            </table>

            <p style=""margin-top: 20px; margin-bottom: 0; color: #57606a;"">
                Trân trọng,<br/>
                <strong style=""color: #24292f;"">Ban quản trị {senderName}</strong>
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }
    }
}
