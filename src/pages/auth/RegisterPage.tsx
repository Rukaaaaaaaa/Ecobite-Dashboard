import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Checkbox, PasswordField, PasswordStrengthBar, PhoneField, TextField } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth/AuthContext';
import { errorMessage } from '@/hooks/useAsync';
import { AuthLayout } from '@/layouts/AuthLayout';
import { services } from '@/services';
import { normalizePhone } from '@/utils/format';
import { hasErrors, passwordError, passwordStrength, type Errors } from '@/utils/validation';

type F = 'fullName' | 'phone' | 'password' | 'confirm' | 'terms';

export default function RegisterPage() {
  const { setAccount } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState({ fullName: '', phone: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<F, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors: Errors<F> = {
    fullName: v.fullName.trim().length < 2 ? 'Nhập họ và tên' : undefined,
    phone: !normalizePhone(v.phone) ? 'Nhập số điện thoại di động hợp lệ' : undefined,
    password: passwordError(v.password),
    confirm: v.confirm !== v.password ? 'Hai mật khẩu chưa khớp nhau' : undefined,
    terms: !terms ? 'Bạn cần đồng ý điều khoản để tiếp tục' : undefined,
  };
  const valid = !hasErrors(errors);
  const show = (k: F) => (touched[k] ? errors[k] : undefined);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const blur = (k: F) => () => setTouched((t) => ({ ...t, [k]: true }));
  const strength = passwordStrength(v.password);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, phone: true, password: true, confirm: true, terms: true });
    setServerError(null);
    if (!valid) return;
    setBusy(true);
    try {
      setAccount(await services.auth.register(v));
      navigate('/verify-phone', { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout step={0} head="Ba bước để mở gian hàng">
      <h1 className="t">Đăng ký gian hàng</h1>
      <p className="mu" style={{ margin: '0 0 18px' }}>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      <form onSubmit={submit} noValidate className="stack" style={{ gap: 13 }}>
        <TextField label="Họ và tên chủ tài khoản" required autoComplete="name" value={v.fullName} onChange={set('fullName')} onBlur={blur('fullName')} error={show('fullName')} />
        <PhoneField label="Số điện thoại" required value={v.phone} onChange={set('phone')} onBlur={blur('phone')} error={show('phone')} hint="Mã xác thực sẽ gửi qua tin nhắn tới số này." />
        <div>
          <PasswordField label="Mật khẩu" required autoComplete="new-password" value={v.password} onChange={set('password')} onBlur={blur('password')} error={show('password')} />
          {v.password && !show('password') && <PasswordStrengthBar score={strength.score} label={strength.label} />}
        </div>
        <PasswordField label="Nhập lại mật khẩu" required autoComplete="new-password" value={v.confirm} onChange={set('confirm')} onBlur={blur('confirm')} error={show('confirm')} ok={v.confirm && !errors.confirm ? 'Hai mật khẩu khớp nhau' : undefined} />
        <div>
          <Checkbox checked={terms} onChange={(e) => { setTerms(e.target.checked); setTouched((t) => ({ ...t, terms: true })); }}>
            Tôi đồng ý với điều khoản sử dụng và chính sách riêng tư dành cho đối tác nhà hàng.
          </Checkbox>
          {show('terms') && <p className="field-err" role="alert"><Icon name="warn" size={14} />{errors.terms}</p>}
        </div>
        {serverError && <p className="field-err" role="alert" style={{ margin: 0 }}><Icon name="warn" size={14} />{serverError}</p>}
        <Button type="submit" block loading={busy}>Gửi mã xác thực</Button>
      </form>
    </AuthLayout>
  );
}
