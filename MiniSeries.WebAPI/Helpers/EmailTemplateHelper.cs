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
<body style=""margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #24292f; -webkit-font-smoothing: antialiased;"">
    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #F5F4F0; table-layout: fixed; width: 100%;"">
        <tr>
            <td align=""center"" style=""padding: 40px 16px 64px 16px;"">
                <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 520px; background-color: #FAF9F5; border: 1px solid #e4e2db; border-radius: 8px; border-collapse: separate; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);"">
                    <tr>
                        <td align=""center"" style=""padding: 32px 32px 0 32px;"">
                            <span style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: #24292f; text-decoration: none;"">
                                <span style=""color: #6366f1;"">M</span>ini<span style=""color: #a855f7;"">S</span>eries<span style=""color: #6366f1;"">L</span>earning
                            </span>
                            <div style=""color: #8c8a82; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;"">
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
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-top: 1px solid #e4e2db; padding-top: 20px;"">
                                <tr>
                                    <td align=""center"" style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #8c8a82; line-height: 1.5;"">
                                        <p style=""margin: 0 0 4px 0; color: #8c8a82;"">Đây là thư được gửi tự động từ hệ thống MiniSeriesLearning.</p>
                                        <p style=""margin: 0; color: #a19f96;"">© 2026 MiniSeries. All rights reserved.</p>
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
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #ffffff; border: 1px solid #e4e2db; border-radius: 6px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);"">
                            <tr>
                                <td align=""center"" style=""padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; font-size: 26px; font-weight: 700; color: #6366f1; letter-spacing: 6px;"">{otpCode}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style=""font-size: 12px; color: #8c8a82; margin-top: 20px; margin-bottom: 0; border-top: 1px dashed #e4e2db; padding-top: 12px;"">
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
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #ffffff; border: 1px solid #e4e2db; border-radius: 6px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);"">
                            <tr>
                                <td align=""center"" style=""padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; font-size: 26px; font-weight: 700; color: #6366f1; letter-spacing: 6px;"">{otpCode}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style=""font-size: 12px; color: #8c8a82; margin-top: 20px; margin-bottom: 0; border-top: 1px dashed #e4e2db; padding-top: 12px;"">
                Áp dụng cho tài khoản: <span style=""color: #24292f; font-weight: 600;"">{email}</span>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua thư này để đảm bảo an toàn cho tài khoản.
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildSupportTicketReply(string ticketContent, string ticketReply, string senderName)
        {
            var body = $@"
            <h2 style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #24292f; margin-top: 0; margin-bottom: 16px; line-height: 1.4;"">Phản Hồi Yêu Cầu Hỗ Trợ</h2>
            <p style=""margin-top: 0; margin-bottom: 12px;"">Chào bạn,</p>
            <p style=""margin-top: 0; margin-bottom: 16px;"">Ban quản trị đã phản hồi yêu cầu hỗ trợ của bạn:</p>

            <div style=""margin-top: 16px; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #8c8a82; font-weight: 700; letter-spacing: 0.5px;"">Yêu cầu của bạn:</div>
            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 20px;"">
                <tr>
                    <td style=""background-color: #fcfbf9; border: 1px solid #e4e2db; border-left: 3px solid #6366f1; border-radius: 4px; padding: 12px 16px; color: #57606a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13.5px; font-style: italic; line-height: 1.5;"">""{ticketContent}""</td>
                </tr>
            </table>

            <div style=""margin-bottom: 6px; font-size: 11px; text-transform: uppercase; color: #8c8a82; font-weight: 700; letter-spacing: 0.5px;"">Phản hồi từ hỗ trợ:</div>
            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 24px; background-color: #ffffff; border: 1px solid #e4e2db; border-radius: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);"">
                <tr>
                    <td style=""padding: 16px 20px;"">
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 10px; border-bottom: 1px solid #f0eee8; padding-bottom: 6px;"">
                            <tr>
                                <td style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 700; color: #6366f1;"">BAN QUẢN TRỊ MINISERIES</td>
                                <td align=""right"" style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: #8c8a82; font-weight: 500;"">Phản hồi chính thức</td>
                            </tr>
                        </table>
                        <div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #24292f; white-space: pre-wrap;"">{ticketReply}</div>
                    </td>
                </tr>
            </table>

            <p style=""margin-top: 20px; margin-bottom: 0; color: #8c8a82;"">
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

            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top: 16px; margin-bottom: 24px; background-color: #ffffff; border: 1px solid #e4e2db; border-radius: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);"">
                <tr>
                    <td style=""padding: 16px 20px;"">
                        <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 10px; border-bottom: 1px solid #f0eee8; padding-bottom: 6px;"">
                            <tr>
                                <td style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 700; color: #a855f7;"">THÔNG BÁO CHĂM SÓC KHÁCH HÀNG</td>
                                <td align=""right"" style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: #8c8a82; font-weight: 500;"">Chính thức</td>
                            </tr>
                        </table>
                        <div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #24292f; white-space: pre-wrap;"">{cskhContent}</div>
                    </td>
                </tr>
            </table>

            <p style=""margin-top: 20px; margin-bottom: 0; color: #8c8a82;"">
                Trân trọng,<br/>
                <strong style=""color: #24292f;"">Ban quản trị {senderName}</strong>
            </p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }
    }
}
