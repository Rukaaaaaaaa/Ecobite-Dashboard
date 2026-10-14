import { normalizePhone } from '@/utils/format';
import { passwordError } from '@/utils/validation';
import { ApiError, type AuthService } from '../types';
import { delay, demoDb } from './db';
import { DEMO_CODE } from './fixtures';

const MAX_ATTEMPTS = 3;
const RESEND_SECONDS = 30;
/** A code stops working this long after it was issued (the UI then asks for a new one). */
const CODE_TTL_MS = 120_000;

/**
 * Demo auth. NO SMS is ever sent: the one-time code is the constant DEMO_CODE.
 * Passwords and codes live only in memory (never in localStorage).
 */
const attempts: Record<string, number> = {};
const issuedAt: Record<string, number> = {};
const resetTokens = new Map<string, string>(); // token -> account id
let phoneLoginTarget: string | null = null;

/** "Send" a code for `scope`: restarts the attempt counter and the expiry clock. Nothing leaves the browser. */
const issueCode = (scope: string): void => {
  attempts[scope] = 0;
  issuedAt[scope] = Date.now();
};

const checkCode = (scope: string, code: string): void => {
  const at = issuedAt[scope];
  if (at === undefined || Date.now() - at > CODE_TTL_MS) {
    delete issuedAt[scope];
    throw new ApiError('code_expired', 'Mã đã hết hạn. Hãy bấm “Gửi lại mã” để nhận mã mới.');
  }
  const used = attempts[scope] ?? 0;
  if (used >= MAX_ATTEMPTS) throw new ApiError('too_many_attempts', 'Nhập sai quá nhiều lần. Hãy yêu cầu mã mới.', { attemptsLeft: 0 });
  if (code !== DEMO_CODE) {
    attempts[scope] = used + 1;
    const left = MAX_ATTEMPTS - attempts[scope];
    throw new ApiError('code_invalid', left > 0 ? `Mã không đúng. Còn ${left} lần thử.` : 'Nhập sai quá nhiều lần. Hãy yêu cầu mã mới.', { attemptsLeft: left });
  }
  attempts[scope] = 0;
  delete issuedAt[scope];
};

export const demoAuth: AuthService = {
  getSession() {
    const a = demoDb.session();
    return a ? demoDb.publicAccount(a) : null;
  },

  async login(phone, password) {
    await delay();
    const local = normalizePhone(phone);
    const a = local ? demoDb.findByPhone(local) : undefined;
    if (!a || a.password !== password) throw new ApiError('invalid_credentials', 'Số điện thoại hoặc mật khẩu không đúng');
    demoDb.setSession(a.id);
    return demoDb.publicAccount(a);
  },

  async requestPhoneLoginCode(phone) {
    await delay();
    const local = normalizePhone(phone);
    const a = local ? demoDb.findByPhone(local) : undefined;
    if (!a) throw new ApiError('account_not_found', 'Số điện thoại này chưa đăng ký tài khoản');
    if (!a.otpLogin) throw new ApiError('otp_login_off', 'Tài khoản này đã tắt đăng nhập bằng mã OTP. Hãy đăng nhập bằng mật khẩu.');
    phoneLoginTarget = a.id;
    issueCode('login-phone');
    return { resendAfterSeconds: RESEND_SECONDS };
  },

  async loginWithPhoneCode(phone, code) {
    await delay();
    const local = normalizePhone(phone);
    const a = local ? demoDb.findByPhone(local) : undefined;
    if (!a || phoneLoginTarget !== a.id) throw new ApiError('code_expired', 'Hãy yêu cầu mã mới trước khi đăng nhập');
    checkCode('login-phone', code);
    demoDb.setSession(a.id);
    return demoDb.publicAccount(a);
  },

  async register({ fullName, phone, password }) {
    await delay();
    const local = normalizePhone(phone);
    if (fullName.trim().length < 2) throw new ApiError('invalid_name', 'Nhập họ và tên');
    if (!local) throw new ApiError('invalid_phone', 'Số điện thoại không hợp lệ');
    const pwErr = passwordError(password);
    if (pwErr) throw new ApiError('weak_password', pwErr);
    if (demoDb.findByPhone(local)) throw new ApiError('phone_taken', 'Số điện thoại này đã được đăng ký');
    const account = {
      id: demoDb.nextId('acc'), fullName: fullName.trim(), phone: local,
      phoneVerified: false, otpLogin: true, role: 'owner' as const, password,
    };
    demoDb.accounts.push(account);
    demoDb.setSession(account.id);
    return demoDb.publicAccount(account);
  },

  async sendPhoneCode(phone) {
    await delay();
    const a = demoDb.requireSession();
    if (phone !== undefined) {
      const local = normalizePhone(phone);
      if (!local) throw new ApiError('invalid_phone', 'Số điện thoại không hợp lệ');
      const other = demoDb.findByPhone(local);
      if (other && other.id !== a.id) throw new ApiError('phone_taken', 'Số điện thoại này đã được đăng ký');
      if (local !== a.phone) {
        a.phone = local;
        a.phoneVerified = false;
      }
    }
    issueCode('phone');
    return { resendAfterSeconds: RESEND_SECONDS };
  },

  async verifyPhoneCode(code) {
    await delay();
    const a = demoDb.requireSession();
    checkCode('phone', code);
    a.phoneVerified = true;
    return demoDb.publicAccount(a);
  },

  async requestPasswordReset(phone) {
    await delay();
    const local = normalizePhone(phone);
    if (!local) throw new ApiError('invalid_phone', 'Nhập số điện thoại di động hợp lệ');
    // Same answer whether or not the account exists (no account enumeration).
    if (demoDb.findByPhone(local)) issueCode(`reset:${local}`);
    return { resendAfterSeconds: RESEND_SECONDS };
  },

  async verifyPasswordResetCode(phone, code) {
    await delay();
    const local = normalizePhone(phone);
    if (!local) throw new ApiError('invalid_phone', 'Nhập số điện thoại di động hợp lệ');
    checkCode(`reset:${local}`, code);
    const a = demoDb.findByPhone(local);
    if (!a) throw new ApiError('code_expired', 'Mã đã hết hạn. Hãy bấm “Gửi lại mã” để nhận mã mới.');
    const token = `demo-${demoDb.nextId('rst')}`;
    resetTokens.set(token, a.id);
    return { token };
  },

  async resetPassword(token, password) {
    await delay();
    const id = resetTokens.get(token);
    const a = id ? demoDb.accounts.find((x) => x.id === id) : undefined;
    if (!a) throw new ApiError('invalid_token', 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy nhập lại số điện thoại.');
    const pwErr = passwordError(password);
    if (pwErr) throw new ApiError('weak_password', pwErr);
    a.password = password;
    resetTokens.delete(token);
  },

  async changePassword(current, next) {
    await delay();
    const a = demoDb.requireSession();
    if (a.password !== current) throw new ApiError('invalid_credentials', 'Mật khẩu hiện tại không đúng');
    const pwErr = passwordError(next);
    if (pwErr) throw new ApiError('weak_password', pwErr);
    a.password = next;
  },

  async setOtpLogin(enabled) {
    await delay(120);
    const a = demoDb.requireSession();
    a.otpLogin = enabled;
    return demoDb.publicAccount(a);
  },

  async logout() {
    await delay(80);
    demoDb.setSession(null);
    phoneLoginTarget = null;
  },
};
