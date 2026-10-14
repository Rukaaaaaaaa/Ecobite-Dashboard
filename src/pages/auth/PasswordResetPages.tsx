import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { PasswordField, PhoneField } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Feedback';
import { OtpPanel } from '@/features/auth/OtpPanel';
import { errorMessage } from '@/hooks/useAsync';
import { AuthLayout } from '@/layouts/AuthLayout';
import { demoHints, services } from '@/services';
import { formatPhone, normalizePhone } from '@/utils/format';
import { passwordError } from '@/utils/validation';

type Phase = 'phone' | 'code' | 'password';

/**
 * 1.4 + 1.5 — reset a forgotten password with the phone number: enter the number, enter the SMS code,
 * choose a new password. One route, three phases; the one-time token never goes into the URL.
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>('phone');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const local = normalizePhone(phone);
  const shown = `+84 ${formatPhone(local ?? phone).slice(1)}`;

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    if (!local) return setPhoneError('Nhập số điện thoại di động hợp lệ');
    setBusy(true);
    try {
      await services.auth.requestPasswordReset(local);
      setPhase('code');
    } catch (err) {
      setPhoneError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const pwErr = touched ? passwordError(pw) : undefined;
  const confirmErr = touched && confirm !== pw ? 'Hai mật khẩu chưa khớp nhau' : undefined;

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (passwordError(pw) || confirm !== pw) return;
    setBusy(true);
    try {
      await services.auth.resetPassword(token, pw);
      toast.success('Đã đặt mật khẩu mới. Hãy đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'phone')
    return (
      <AuthLayout step={0} head="Lấy lại quyền truy cập">
        <span className="icobox"><Icon name="phone" size={22} /></span>
        <h1 className="t">Quên mật khẩu</h1>
        <form onSubmit={requestCode} noValidate className="stack" style={{ marginTop: 6 }}>
          <p className="mu">Nhập số điện thoại đã dùng để mở gian hàng. Chúng tôi gửi mã xác thực qua tin nhắn.</p>
          <PhoneField label="Số điện thoại" required value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError ?? undefined} />
          <Button type="submit" block loading={busy}>Gửi mã xác thực</Button>
          <Link className="bt gh block" to="/login">Quay lại đăng nhập</Link>
          <div className="note">Không còn dùng số này nữa? Liên hệ hỗ trợ EcoBite để xác minh chủ gian hàng bằng cách khác.</div>
          {demoHints && <div className="note warn"><b>Chế độ demo.</b> Không có tin nhắn nào được gửi. Dùng số {formatPhone(demoHints.phone)}.</div>}
        </form>
      </AuthLayout>
    );

  if (phase === 'code')
    return (
      <AuthLayout step={1} head="Lấy lại quyền truy cập">
        <span className="icobox"><Icon name="msg" size={22} /></span>
        <h1 className="t">Nhập mã xác thực</h1>
        <p className="mu" style={{ margin: '0 0 2px' }}>Mã sáu chữ số đã gửi qua tin nhắn tới</p>
        <p style={{ margin: '0 0 18px', fontWeight: 700 }}>
          {shown}{' '}
          <button type="button" className="bt gh sm" style={{ marginLeft: 6 }} onClick={() => setPhase('phone')}>Đổi số</button>
        </p>
        <OtpPanel
          autoSend={false}
          initialCountdown={30}
          submitLabel="Xác thực và tiếp tục"
          send={() => services.auth.requestPasswordReset(phone)}
          verify={async (code) => {
            const r = await services.auth.verifyPasswordResetCode(phone, code);
            setToken(r.token);
            setPhase('password');
          }}
        />
      </AuthLayout>
    );

  return (
    <AuthLayout step={1} head="Lấy lại quyền truy cập">
      <span className="icobox"><Icon name="lock" size={22} /></span>
      <h1 className="t">Đặt mật khẩu mới</h1>
      <p className="mu" style={{ margin: '0 0 6px' }}>Mã xác thực đúng. Đặt mật khẩu mới cho số <b style={{ color: 'var(--ink)' }}>{shown}</b>.</p>
      <form onSubmit={submitPassword} noValidate className="stack" style={{ marginTop: 14, gap: 13 }}>
        <PasswordField label="Mật khẩu mới" required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={pwErr} />
        <PasswordField label="Nhập lại mật khẩu mới" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={confirmErr} ok={confirm && confirm === pw && !passwordError(pw) ? 'Hai mật khẩu khớp nhau' : undefined} />
        <div className="note">Đổi mật khẩu xong, bạn cần đăng nhập lại.</div>
        {serverError && <p className="field-err" role="alert" style={{ margin: 0 }}><Icon name="warn" size={14} />{serverError}</p>}
        <Button type="submit" block loading={busy}>Đặt mật khẩu mới</Button>
      </form>
    </AuthLayout>
  );
}
