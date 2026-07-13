namespace MiniSeries.Infrastructure.ExternalServices;

internal static class SupabaseAuthErrorLocalizer
{
    public static string Localize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "Đăng nhập thất bại. Vui lòng thử lại.";
        }

        var message = raw.Trim();

        if (Contains(message, "invalid login credentials"))
        {
            return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
        }

        if (Contains(message, "email not confirmed"))
        {
            return "Email chưa được xác thực. Vui lòng kiểm tra hộp thư (kể cả thư rác).";
        }

        if (Contains(message, "user already registered") || Contains(message, "already been registered"))
        {
            return "Email này đã được đăng ký trên hệ thống.";
        }

        if (Contains(message, "invalid email"))
        {
            return "Email không hợp lệ. Vui lòng nhập đúng định dạng email.";
        }

        if (Contains(message, "password should be at least") || Contains(message, "password is too short"))
        {
            return "Mật khẩu phải có ít nhất 6 ký tự.";
        }

        if (Contains(message, "rate limit") || Contains(message, "too many requests"))
        {
            return "Bạn thao tác quá nhanh. Vui lòng đợi vài phút rồi thử lại.";
        }

        if (Contains(message, "user not found"))
        {
            return "Không tìm thấy tài khoản với email này.";
        }

        if (Contains(message, "invalid refresh token") || Contains(message, "token is expired"))
        {
            return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        }

        return message;
    }

    private static bool Contains(string message, string fragment) =>
        message.Contains(fragment, StringComparison.OrdinalIgnoreCase);
}
