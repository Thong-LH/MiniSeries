const AUTH_ERROR_MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'],
  [/email not confirmed/i, 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư (kể cả thư rác).'],
  [/user already registered|already been registered/i, 'Email này đã được đăng ký trên hệ thống.'],
  [/invalid email/i, 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.'],
  [/password should be at least|password is too short/i, 'Mật khẩu phải có ít nhất 6 ký tự.'],
  [/rate limit|too many requests/i, 'Bạn thao tác quá nhanh. Vui lòng đợi vài phút rồi thử lại.'],
  [/user not found/i, 'Không tìm thấy tài khoản với email này.'],
  [/token is expired|invalid refresh token/i, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
];

export function formatAuthErrorMessage(
  message?: string | null,
  fallback = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
): string {
  if (!message?.trim()) {
    return fallback;
  }

  const normalized = message.trim();
  for (const [pattern, vietnamese] of AUTH_ERROR_MAP) {
    if (pattern.test(normalized)) {
      return vietnamese;
    }
  }

  return normalized;
}
