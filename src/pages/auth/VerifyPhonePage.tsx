import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { TextField } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Feedback';
import { useAccount, useAuth } from '@/features/auth/AuthContext';
import { OtpPanel } from '@/features/auth/OtpPanel';
import { errorMessage } from '@/hooks/useAsync';
import { AuthLayout } from '@/layouts/AuthLayout';
import { services } from '@/services';
import { formatPhone, normalizePhone, safeReturnTo } from '@/utils/format';

export default function VerifyPhonePage() {
  const account = useAccount();
  const { setAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo')) ?? '/';
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(account.phone);
  const [error, setError] = useState<string | null>(null);
  const [sendKey, setSendKey] = useState(0);

  if (account.phoneVerified) {
    return (
      <AuthLayout step={1} head="Ba bước để mở gian hàng">
        <span className="icobox"><Icon name="chk" size={22} /></span>
        <h1 className="t">Số điện thoại đã được xác thực</h1>
        <p className="mu" style={{ margin: '4px 0 18px' }}>{formatPhone(account.phone)}</p>
        <Link className="bt block" to={returnTo}>Tiếp tục</Link>
      </AuthLayout>
    );
  }

  const changePhone = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const local = normalizePhone(phone);
    if (!local) return setError('Nhập số điện thoại di động hợp lệ');
    try {
      await services.auth.sendPhoneCode(local);
      setAccount({ ...account, phone: local, phoneVerified: false });
      setEditing(false);
      setSendKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthLayout step={1} head="Ba bước để mở gian hàng">
      <span className="icobox"><Icon name="phone" size={22} /></span>
      <h1 className="t">Xác thực số điện thoại</h1>
      {editing ? (
        <form onSubmit={changePhone} noValidate className="stack" style={{ marginTop: 14 }}>
          <TextField label="Số điện thoại mới" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error ?? undefined} />
          <Button type="submit" block>Gửi mã tới số này</Button>
        </form>
      ) : (
        <>
          <p className="mu">Mã sáu chữ số gửi qua tin nhắn tới</p>
          <p style={{ margin: '0 0 18px', fontWeight: 700 }}>
            +84 {formatPhone(account.phone).slice(1)}{' '}
            <button type="button" className="bt gh sm" style={{ marginLeft: 6 }} onClick={() => setEditing(true)}>Đổi số</button>
          </p>
          <OtpPanel
            key={sendKey}
            submitLabel="Xác minh và tiếp tục"
            send={() => services.auth.sendPhoneCode()}
            verify={async (code) => {
              setAccount(await services.auth.verifyPhoneCode(code));
              toast.success('Đã xác thực số điện thoại');
              navigate(returnTo, { replace: true });
            }}
          />
        </>
      )}
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5 }}>
        <Link to={returnTo}>Để sau, vào Dashboard</Link>
      </p>
    </AuthLayout>
  );
}
