import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { PasswordField, PhoneField } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Feedback';
import { nextVerificationStep, useAuth } from '@/features/auth/AuthContext';
import { OtpPanel } from '@/features/auth/OtpPanel';
import { errorMessage } from '@/hooks/useAsync';
import { AuthLayout } from '@/layouts/AuthLayout';
import { demoHints, services } from '@/services';
import { formatPhone, normalizePhone, safeReturnTo } from '@/utils/format';

type Mode = 'password' | 'otp-phone' | 'otp-code';

/** 1.1 — phone number + password, or a code sent by SMS. There is no email sign-in. */
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password');
  const { setAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = safeReturnTo((location.state as { from?: string } | null)?.from) ?? '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const phoneErr = touched && !normalizePhone(phone) ? 'Nhập số điện thoại di động hợp lệ' : undefined;
  const pwErr = touched && !password ? 'Nhập mật khẩu' : undefined;

  const finish = (a: Parameters<typeof nextVerificationStep>[0]) => {
    setAccount(a);
    if (nextVerificationStep(a)) toast.info('Số điện thoại của bạn chưa được xác thực.');
    navigate(from, { replace: true });
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!normalizePhone(phone) || !password) return;
    setBusy(true);
    try {
      finish(await services.auth.login(phone, password));
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!normalizePhone(phone)) return;
    setBusy(true);
    try {
      await services.auth.requestPhoneLoginCode(phone);
      setMode('otp-code');
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setTouched(false);
    setFormError(null);
  };

  const error = formError && (
    <p className="field-err" role="alert" style={{ margin: 0 }}>
      <Icon name="warn" size={14} />
      {formError}
    </p>
  );

  return (
    <AuthLayout>
      <h1 className="t">Đăng nhập</h1>
      <p className="mu" style={{ margin: '0 0 20px' }}>Số điện thoại là tài khoản của quán trên EcoBite.</p>

      {mode === 'password' && (
        <form onSubmit={submitPassword} noValidate className="stack" style={{ gap: 14 }}>
          <PhoneField label="Số điện thoại" required value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneErr} />
          <PasswordField label="Mật khẩu" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={pwErr} />
          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/forgot-password" style={{ fontSize: 12.5 }}>Quên mật khẩu?</Link>
          </div>
          {error}
          <Button type="submit" block loading={busy}>Đăng nhập</Button>
          <div className="or-line" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--ln)' }} />
            <span className="mu">hoặc</span>
            <span style={{ flex: 1, height: 1, background: 'var(--ln)' }} />
          </div>
          <Button type="button" variant="ghost" block onClick={() => switchMode('otp-phone')}><Icon name="msg" size={16} />Đăng nhập bằng mã OTP</Button>
          {demoHints && (
            <div className="note warn">
              <b>Chế độ demo.</b> Tài khoản mẫu: <b>{formatPhone(demoHints.phone)}</b> / <b>{demoHints.password}</b>
            </div>
          )}
        </form>
      )}

      {mode === 'otp-phone' && (
        <form onSubmit={requestOtp} noValidate className="stack" style={{ gap: 14 }}>
          <PhoneField label="Số điện thoại" required value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneErr ?? formError ?? undefined} hint="Chúng tôi gửi mã sáu số qua tin nhắn." />
          <Button type="submit" block loading={busy}>Nhận mã đăng nhập</Button>
          <Button type="button" variant="ghost" block onClick={() => switchMode('password')}>Dùng mật khẩu</Button>
          {demoHints && <div className="note warn"><b>Chế độ demo.</b> Không có tin nhắn nào được gửi. Dùng số {formatPhone(demoHints.phone)}.</div>}
        </form>
      )}

      {mode === 'otp-code' && (
        <div>
          <p className="mu" style={{ marginBottom: 14 }}>
            Nhập mã sáu số gửi tới <b style={{ color: 'var(--ink)' }}>+84 {formatPhone(normalizePhone(phone) ?? phone).slice(1)}</b>{' '}
            <button type="button" className="bt gh sm" onClick={() => switchMode('otp-phone')}>Đổi số</button>
          </p>
          <OtpPanel
            autoSend={false}
            initialCountdown={30}
            submitLabel="Đăng nhập"
            send={async () => services.auth.requestPhoneLoginCode(phone)}
            verify={async (code) => finish(await services.auth.loginWithPhoneCode(phone, code))}
          />
        </div>
      )}

      <p style={{ textAlign: 'center', margin: '18px 0 0', fontSize: 13, color: 'var(--ink2)' }}>
        Chưa có gian hàng? <Link to="/register">Đăng ký ngay</Link>
      </p>
    </AuthLayout>
  );
}
