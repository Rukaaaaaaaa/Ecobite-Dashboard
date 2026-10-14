import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, Note } from '@/components/Controls';
import { Modal, useToast } from '@/components/Feedback';
import { PasswordField, Toggle } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { useAccount, useAuth } from '@/features/auth/AuthContext';
import { errorMessage } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import { formatPhone } from '@/utils/format';
import { passwordError } from '@/utils/validation';

const PREFS_KEY = 'ecobite-dashboard:notification-prefs';
const PREFS = [
  ['newOrder', 'Có đơn mới'],
  ['cancelled', 'Khách huỷ đơn'],
  ['expiring', 'Sản phẩm sắp hết giờ bán'],
  ['weekly', 'Báo cáo doanh thu hằng tuần'],
] as const;
type Prefs = Record<(typeof PREFS)[number][0], boolean>;
const DEFAULT_PREFS: Prefs = { newOrder: true, cancelled: true, expiring: true, weekly: false };

/** Notification choices are a per-browser convenience (not sensitive); they do not reach a server yet. */
const loadPrefs = (): Prefs => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
};

/** 5.5 */
export default function SettingsPage() {
  const account = useAccount();
  const { logout, setAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [changingPw, setChangingPw] = useState(false);
  const [togglingOtp, setTogglingOtp] = useState(false);

  const setPref = (k: keyof Prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* storage unavailable: keep the in-memory value */ }
  };

  const toggleOtp = async () => {
    setTogglingOtp(true);
    try {
      const next = await services.auth.setOtpLogin(!account.otpLogin);
      setAccount(next);
      toast.success(next.otpLogin ? 'Đã bật đăng nhập bằng mã OTP' : 'Đã tắt đăng nhập bằng mã OTP');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTogglingOtp(false);
    }
  };

  const signOut = async () => {
    await logout();
    toast.info('Đã đăng xuất');
    navigate('/login', { replace: true });
  };

  return (
    <Page title="Cài đặt tài khoản" sub="Đăng nhập, thông báo và người dùng của quán">
      <div className="row">
        <Card title="Đăng nhập và bảo mật" grow="999 1 380px">
          <SettingRow title="Số điện thoại đăng nhập" value={<>{formatPhone(account.phone)} <Badge tone={account.phoneVerified ? 'g' : 'a'} small>{account.phoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}</Badge></>}
            action={<Link className={`bt sm ${account.phoneVerified ? 'gh' : ''}`} to="/verify-phone?returnTo=%2Fsettings">{account.phoneVerified ? 'Đổi số' : 'Xác thực'}</Link>} />
          <SettingRow title="Mật khẩu" value="Đổi mật khẩu định kỳ để an toàn hơn" action={<Button small variant="ghost" onClick={() => setChangingPw(true)}>Đổi mật khẩu</Button>} />
          <SettingRow title="Đăng nhập bằng mã OTP" value={account.otpLogin ? 'Đang bật' : 'Đang tắt'}
            action={<Button small variant="ghost" loading={togglingOtp} onClick={() => void toggleOtp()}>{account.otpLogin ? 'Tắt' : 'Bật'}</Button>} />
          <h3 className="ttl" style={{ margin: '16px 0 4px' }}>Thông báo</h3>
          {PREFS.map(([k, label]) => (
            <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--ln)' }}>
              <span style={{ flex: 1, fontSize: 12.5 }}>{label}</span>
              <Toggle checked={prefs[k]} label={label} onChange={(v) => setPref(k, v)} />
            </div>
          ))}
          <p className="mu" style={{ marginTop: 8 }}>Lựa chọn được lưu trên trình duyệt này. Thông báo đẩy chưa được kết nối, nên hiện chưa có thông báo nào được gửi.</p>
        </Card>
        <div style={{ flex: '1 1 280px', minWidth: 0 }} className="stack">
          <Card title="Người dùng của quán" action={<Button small variant="ghost" disabled title="Chưa hỗ trợ nhân viên"><Icon name="plus" size={13} />Thêm</Button>}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0' }}>
              <img src="/images/ava.jpg" alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 12.5 }}>{account.fullName}</b><span className="mu">Chủ nhà hàng · toàn quyền</span></span>
            </div>
            <p className="mu" style={{ marginTop: 6 }}>Hiện chỉ có tài khoản chủ nhà hàng. Thêm nhân viên và phân quyền chưa được hỗ trợ.</p>
          </Card>
          <Card title="Khác">
            <div className="stack" style={{ gap: 9 }}>
              <span className="mu">Ngôn ngữ: Tiếng Việt</span>
              <Button variant="danger" onClick={() => void signOut()}><Icon name="logout" size={16} />Đăng xuất khỏi thiết bị này</Button>
            </div>
          </Card>
        </div>
      </div>
      {changingPw && <ChangePasswordModal onClose={() => setChangingPw(false)} />}
    </Page>
  );
}

function SettingRow({ title, value, action }: { title: string; value: React.ReactNode; action: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--ln)', flexWrap: 'wrap' }}>
      <span style={{ flex: '1 1 200px', minWidth: 0 }}><b style={{ display: 'block', fontSize: 12.5 }}>{title}</b><span className="mu">{value}</span></span>
      {action}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const nextErr = touched ? passwordError(next) ?? (next === cur ? 'Mật khẩu mới phải khác mật khẩu cũ' : undefined) : undefined;
  const confirmErr = touched && confirm !== next ? 'Hai mật khẩu chưa khớp nhau' : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!cur || passwordError(next) || next === cur || confirm !== next) return;
    setBusy(true);
    try {
      await services.auth.changePassword(cur, next);
      toast.success('Đã đổi mật khẩu');
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Đổi mật khẩu" onClose={onClose}>
      <form onSubmit={submit} noValidate className="stack">
        <PasswordField label="Mật khẩu hiện tại" required autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} error={touched && !cur ? 'Nhập mật khẩu hiện tại' : serverError ?? undefined} />
        <PasswordField label="Mật khẩu mới" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={nextErr} />
        <PasswordField label="Nhập lại mật khẩu mới" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={confirmErr} />
        <Note>Ở chế độ demo, mật khẩu chỉ đổi trong bộ nhớ trình duyệt.</Note>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button type="submit" loading={busy}>Đổi mật khẩu</Button>
        </div>
      </form>
    </Modal>
  );
}
