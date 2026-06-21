using System;

namespace MiniSeries.WebAPI.Helpers
{
    public static class EmailTemplateHelper
    {
        private const string CommonLayout = @"
<div style=""background-color: #09090b; padding: 40px 20px; font-family: 'Lexend', system-ui, -apple-system, sans-serif; color: #f8fafc; text-align: center; min-height: 100%;"">
    <div style=""max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 16px; padding: 32px; text-align: left; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);"">
        <!-- Header / Logo -->
        <div style=""text-align: center; margin-bottom: 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 20px;"">
            <span style=""font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #c084fc;"">
                <span style=""color: #00f2fe;"">M</span>ini<span style=""color: #00f2fe;"">S</span>eries<span style=""color: #00f2fe;"">L</span>earning
            </span>
            <p style=""color: #94a3b8; font-size: 11px; margin: 6px 0 0 0; letter-spacing: 0.5px;"">Hệ thống bài học chuyển đổi tự động bằng Video & Manga</p>
        </div>

        <!-- Body Content -->
        <div style=""font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 28px;"">
            {EMAIL_BODY}
        </div>

        <!-- Footer -->
        <div style=""text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; font-size: 11px; color: #4b5563;"">
            <p style=""margin: 0 0 4px 0;"">Đây là email tự động từ hệ thống MiniSeriesLearning.</p>
            <p style=""margin: 0;"">© 2026 MiniSeries. All rights reserved.</p>
        </div>
    </div>
</div>";

        public static string BuildActivationOtp(string fullName, string otpCode, string email)
        {
            var body = $@"
            <h3 style=""color: #00f2fe; margin-top: 0; font-size: 18px;"">Kích Hoạt Tài Khoản</h3>
            <p>Chào bạn <b>{fullName}</b>,</p>
            <p>Mã OTP để hoàn tất đăng ký tài khoản của bạn là:</p>
            <div style=""background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; color: #c084fc; letter-spacing: 4px; margin: 20px 0;"">
                {otpCode}
            </div>
            <p style=""font-size: 13px; color: #94a3b8;"">Mã này áp dụng cho Email: <b>{email}</b>. Vui lòng hoàn tất xác minh sớm.</p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildResetPasswordOtp(string email, string otpCode)
        {
            var body = $@"
            <h3 style=""color: #c084fc; margin-top: 0; font-size: 18px;"">Khôi Phục Mật Khẩu</h3>
            <p>Chào bạn,</p>
            <p>Mã OTP để đặt lại mật khẩu cho tài khoản của bạn là:</p>
            <div style=""background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; color: #c084fc; letter-spacing: 4px; margin: 20px 0;"">
                {otpCode}
            </div>
            <p style=""font-size: 13px; color: #94a3b8;"">Áp dụng cho Email: <b>{email}</b>. Vui lòng không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn.</p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildSupportTicketReply(string ticketContent, string ticketReply, string senderName)
        {
            var body = $@"
            <h3 style=""color: #00f2fe; margin-top: 0; font-size: 18px;"">Phản Hồi Yêu Cầu Tư Vấn</h3>
            <p>Chào bạn,</p>
            <p>Yêu cầu hỗ trợ của bạn với nội dung:</p>
            <div style=""background: rgba(255, 255, 255, 0.03); border-left: 3px solid #00f2fe; padding: 12px 16px; margin: 12px 0; font-style: italic; color: #94a3b8; border-radius: 0 8px 8px 0;"">
                ""{ticketContent}""
            </div>
            <p>Đã được ban quản trị phản hồi:</p>
            <div style=""background: rgba(168, 85, 247, 0.05); border-left: 3px solid #c084fc; padding: 12px 16px; margin: 12px 0; font-weight: 500; color: #f8fafc; border-radius: 0 8px 8px 0; white-space: pre-wrap;"">
                {ticketReply}
            </div>
            <p style=""margin-top: 20px;"">Trân trọng,<br/>Đội ngũ hỗ trợ {senderName}.</p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }

        public static string BuildCskhMessage(string cskhContent, string senderName)
        {
            var body = $@"
            <h3 style=""color: #00f2fe; margin-top: 0; font-size: 18px;"">Thông Tin Từ Chăm Sóc Khách Hàng</h3>
            <p>Chào bạn,</p>
            <div style=""white-space: pre-wrap; color: #e2e8f0; font-size: 15px; margin: 16px 0; line-height: 1.6;"">
                {cskhContent}
            </div>
            <p style=""margin-top: 20px;"">Trân trọng,<br/>Ban quản trị {senderName}.</p>";

            return CommonLayout.Replace("{EMAIL_BODY}", body);
        }
    }
}
