import { useEffect, useState } from 'react';
import { Button, LinkButton } from '@/components/Button';
import { Card, Chip, Note } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { SelectField, TextArea, TextField, Toggle } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { useReturnFlow } from '@/features/profile/useReturnFlow';
import { RulePending } from '@/features/wallet/RulePending';
import { errorMessage, useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import { http } from '@/services/http';
import type { BankAccount, OpeningDay, RestaurantProfile } from '@/types';
import { WEEKDAYS } from '@/utils/bags';
import { minutesOf, normalizePhone, vnd } from '@/utils/format';
import { PLATFORM_FEE_LABEL, WALLET_STATUS } from '@/utils/wallet';
import type { Errors } from '@/utils/validation';

const BUSINESS_TYPES = ['Nhà hàng', 'Quán cà phê', 'Tiệm bánh', 'Cửa hàng thực phẩm', 'Căng tin', 'Khác'];
const DAY_NAMES = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
const BANKS = ['Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'Techcombank', 'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'HDBank', 'VIB', 'SHB', 'OCB', 'MSB'];

/** Loads the profile once into a local, editable copy. */
function useDraft() {
  const q = useAsync(() => services.profile.get(), []);
  const [draft, setDraft] = useState<RestaurantProfile | null>(null);
  useEffect(() => { if (q.data && !draft) setDraft(q.data); }, [q.data, draft]);
  return { q, draft, setDraft };
}

/** 5.2 */
export function ProfileEditPage() {
  const { q, draft, setDraft } = useDraft();
  const { afterSave, cancelTo } = useReturnFlow('/profile');
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  if (q.error) return <Page title="Chỉnh sửa thông tin nhà hàng"><ErrorState message={q.error} onRetry={q.reload} /></Page>;
  if (!draft) return <Page title="Chỉnh sửa thông tin nhà hàng"><Loading /></Page>;

  const errors: Errors<'name' | 'businessType' | 'hours'> = {
    name: draft.name.trim().length < 2 ? 'Nhập tên nhà hàng' : undefined,
    businessType: !draft.businessType ? 'Chọn loại hình kinh doanh' : undefined,
    hours: draft.openingHours.some((o) => o.open && (!o.start || !o.end || minutesOf(o.end) <= minutesOf(o.start))) ? 'Giờ đóng cửa phải sau giờ mở cửa' : undefined,
  };
  const bad = Object.values(errors).some(Boolean);
  const setDay = (i: number, p: Partial<OpeningDay>) => setDraft({ ...draft, openingHours: draft.openingHours.map((o, j) => (j === i ? { ...o, ...p } : o)) });

  const save = async () => {
    setShow(true);
    if (bad) return toast.error('Kiểm tra lại các ô báo đỏ');
    setBusy(true);
    try {
      await services.profile.update({ name: draft.name.trim(), businessType: draft.businessType, description: draft.description.trim(), openingHours: draft.openingHours });
      await afterSave('Đã lưu thông tin nhà hàng');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Chỉnh sửa thông tin nhà hàng" sub="Phần khách nhìn thấy khi mở trang quán" actions={<><LinkButton variant="ghost" to={cancelTo}>Huỷ</LinkButton><Button loading={busy} onClick={() => void save()}>Lưu thay đổi</Button></>}>
      <div className="row">
        <Card title="Thông tin cơ bản" grow="999 1 400px">
          <div className="stack">
            <TextField label="Tên nhà hàng" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={show ? errors.name : undefined} maxLength={80} />
            <div>
              <span className="lb" id="bt-label">Loại hình kinh doanh <span className="rq">*</span></span>
              <div className="chips" role="group" aria-labelledby="bt-label">
                {BUSINESS_TYPES.map((t) => <Chip key={t} active={draft.businessType === t} onClick={() => setDraft({ ...draft, businessType: t })}>{t}</Chip>)}
              </div>
              {show && errors.businessType && <p className="field-err" role="alert"><Icon name="warn" size={14} />{errors.businessType}</p>}
            </div>
            <TextArea label="Giới thiệu ngắn" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={300} hint={`Khách đọc khi mở trang quán. ${draft.description.length}/300`} />
            <Note>Luồng này không yêu cầu ảnh logo hay ảnh bìa nhà hàng. Ảnh chỉ cần cho từng sản phẩm.</Note>
          </div>
        </Card>
        <Card title="Giờ mở cửa" grow="1 1 300px">
          {draft.openingHours.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: '1px solid var(--ln)' }}>
              <Toggle checked={o.open} label={`${DAY_NAMES[i]} mở cửa`} onChange={(v) => setDay(i, v ? { open: true, start: o.start || '07:00', end: o.end || '21:00' } : { open: false })} />
              <span style={{ flex: '0 0 62px', fontSize: 12.5, fontWeight: 600, color: o.open ? undefined : 'var(--ink3)' }}>{DAY_NAMES[i]}</span>
              {o.open ? (
                <>
                  <input className="ip num" type="time" aria-label={`${DAY_NAMES[i]}: giờ mở`} style={{ flex: 1, height: 32, fontSize: 12 }} value={o.start} onChange={(e) => setDay(i, { start: e.target.value })} />
                  <span className="mu">–</span>
                  <input className="ip num" type="time" aria-label={`${DAY_NAMES[i]}: giờ đóng`} style={{ flex: 1, height: 32, fontSize: 12 }} value={o.end} onChange={(e) => setDay(i, { end: e.target.value })} />
                </>
              ) : <span className="bg2 tone-x">Nghỉ</span>}
            </div>
          ))}
          {show && errors.hours && <p className="field-err" role="alert"><Icon name="warn" size={14} />{errors.hours}</p>}
          <p className="mu" style={{ marginTop: 8 }}>Ngày trong tuần: {WEEKDAYS.join(', ')}.</p>
        </Card>
      </div>
    </Page>
  );
}

/** 5.3 */
export function ProfileContactPage() {
  const { q, draft, setDraft } = useDraft();
  const { afterSave, cancelTo } = useReturnFlow('/profile');
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [locating, setLocating] = useState(false);
  const [matches, setMatches] = useState<{ label: string; point: { latitude: number; longitude: number } }[]>([]);

  if (q.error) return <Page title="Liên hệ và địa chỉ"><ErrorState message={q.error} onRetry={q.reload} /></Page>;
  if (!draft) return <Page title="Liên hệ và địa chỉ"><Loading /></Page>;

  const errors: Errors<'street' | 'ward' | 'city' | 'phone' | 'zalo' | 'lat' | 'lng'> = {
    street: !draft.street.trim() ? 'Nhập số nhà và tên đường' : undefined,
    ward: !draft.ward.trim() ? 'Nhập phường, xã' : undefined,
    city: !draft.city.trim() ? 'Nhập tỉnh, thành phố' : undefined,
    phone: !normalizePhone(draft.phone) ? 'Nhập số điện thoại hợp lệ' : undefined,
    zalo: draft.zalo.trim() && !normalizePhone(draft.zalo) ? 'Số Zalo không hợp lệ' : undefined,
    lat: draft.lat !== null && (draft.lat < -90 || draft.lat > 90) ? 'Vĩ độ từ -90 đến 90' : undefined,
    lng: draft.lng !== null && (draft.lng < -180 || draft.lng > 180) ? 'Kinh độ từ -180 đến 180' : undefined,
  };
  const bad = Object.values(errors).some(Boolean);
  const set = (p: Partial<RestaurantProfile>) => setDraft({ ...draft, ...p });
  const setAddress = (p: Partial<RestaurantProfile>) => { set({ ...p, lat: null, lng: null }); setMatches([]); };
  const lookup = async () => {
    setLocating(true); setMatches([]);
    try {
      const address = [draft.street, draft.ward, draft.district, draft.city, 'Việt Nam'].filter(Boolean).join(', ');
      const rows = await http<typeof matches>('/location/search', { method: 'POST', body: { address } });
      setMatches(rows);
      if (!rows.length) toast.error('Không tìm thấy địa chỉ. Thêm thông tin hoặc nhập tọa độ.');
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLocating(false); }
  };
  const err = <K extends keyof typeof errors>(k: K) => (show ? errors[k] : undefined);
  const num = (s: string): number | null => (s.trim() === '' || Number.isNaN(Number(s)) ? null : Number(s));

  const save = async () => {
    setShow(true);
    if (bad) return toast.error('Kiểm tra lại các ô báo đỏ');
    setBusy(true);
    try {
      await services.profile.update({ street: draft.street.trim(), ward: draft.ward.trim(), district: draft.district.trim(), city: draft.city.trim(), directions: draft.directions.trim(), phone: draft.phone, zalo: draft.zalo.trim(), lat: draft.lat, lng: draft.lng });
      await afterSave('Đã lưu liên hệ và địa chỉ');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Liên hệ và địa chỉ" sub="Nơi khách tới lấy hàng và cách EcoBite gọi khi cần" actions={<><LinkButton variant="ghost" to={cancelTo}>Huỷ</LinkButton><Button loading={busy} disabled={locating} onClick={() => void save()}>Lưu thay đổi</Button></>}>
      <div className="row">
        <Card title="Địa chỉ nhận hàng" grow="999 1 400px">
          <div className="stack">
            <TextField label="Số nhà và tên đường" required disabled={locating} value={draft.street} onChange={(e) => setAddress({ street: e.target.value })} error={err('street')} />
            <div className="grid3">
              <TextField label="Phường, xã" required disabled={locating} value={draft.ward} onChange={(e) => setAddress({ ward: e.target.value })} error={err('ward')} />
              <TextField label="Quận, huyện" disabled={locating} value={draft.district} onChange={(e) => setAddress({ district: e.target.value })} />
              <TextField label="Tỉnh, thành phố" required disabled={locating} value={draft.city} onChange={(e) => setAddress({ city: e.target.value })} error={err('city')} />
            </div>
            <TextField label="Chỉ dẫn thêm" value={draft.directions} onChange={(e) => set({ directions: e.target.value })} placeholder="vd: trong ngõ, cổng màu xanh bên tay phải" />
            <h3 className="ttl" style={{ marginTop: 4, marginBottom: 0 }}>Liên hệ</h3>
            <div className="grid2">
              <TextField label="Số điện thoại nhà hàng" required icon="phone" type="tel" inputMode="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} error={err('phone')} hint="Số liên hệ khách thấy. Số đăng nhập đổi ở Cài đặt." />
              <TextField label="Zalo" icon="msg" type="tel" inputMode="tel" value={draft.zalo} onChange={(e) => set({ zalo: e.target.value })} error={err('zalo')} placeholder="Không bắt buộc" />
            </div>
          </div>
        </Card>
        <Card title="Vị trí trên bản đồ" grow="1 1 280px">
          {!services.demo && <div className="stack" style={{ marginBottom: 12 }}>
            <Button loading={locating} disabled={!draft.street.trim() || !draft.city.trim()} onClick={() => void lookup()}>Tìm vị trí từ địa chỉ</Button>
            {matches.map((match, i) => <button type="button" className="bt gh" key={i} onClick={() => { set({ lat: match.point.latitude, lng: match.point.longitude }); setMatches([]); }}>{match.label}</button>)}
            {draft.lat === null || draft.lng === null ? <p className="mu">Chọn kết quả tra cứu hoặc nhập tọa độ để khách tính khoảng cách đến quán.</p> : <iframe title="Vị trí nhà hàng" height={210} style={{ width: '100%', border: '1px solid var(--ln)', borderRadius: 10 }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${draft.lng - 0.005},${draft.lat - 0.003},${draft.lng + 0.005},${draft.lat + 0.003}&layer=mapnik&marker=${draft.lat},${draft.lng}`} />}
          </div>}
          {services.demo && <div style={{ position: 'relative', height: 190, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--ln)' }} role="img" aria-label="Bản đồ minh hoạ vị trí quán">
            <svg viewBox="0 0 400 190" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
              <rect width="400" height="190" fill="#E9F0EB" />
              <path d="M0 58h400M0 130h400M110 0v190M250 0v190" stroke="#D5E2D9" strokeWidth="9" fill="none" />
              <path d="M0 94h400" stroke="#C7D8CC" strokeWidth="14" fill="none" />
              <rect x="18" y="12" width="76" height="34" rx="4" fill="#DCE8E0" /><rect x="128" y="12" width="104" height="34" rx="4" fill="#DCE8E0" /><rect x="268" y="142" width="110" height="34" rx="4" fill="#DCE8E0" />
            </svg>
            <span style={{ position: 'absolute', left: '50%', top: '48%', transform: 'translate(-50%,-100%)', color: 'var(--g7)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="#fff" strokeWidth="1.5"><path d="M12 22s7-6.3 7-12A7 7 0 0 0 5 10c0 5.7 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none" /></svg>
            </span>
          </div>}
          <div className="grid2" style={{ marginTop: 12 }}>
            <TextField label="Vĩ độ" inputMode="decimal" value={draft.lat === null ? '' : String(draft.lat)} onChange={(e) => set({ lat: num(e.target.value) })} error={err('lat')} />
            <TextField label="Kinh độ" inputMode="decimal" value={draft.lng === null ? '' : String(draft.lng)} onChange={(e) => set({ lng: num(e.target.value) })} error={err('lng')} />
          </div>
          <div style={{ marginTop: 11 }}><Note tone="warn">{services.demo ? 'Bản đồ minh hoạ.' : 'Kiểm tra ghim đúng cửa ra vào rồi lưu thay đổi. Khách dùng GPS hoặc vị trí tài khoản để tính khoảng cách đường thẳng. Tra cứu: Photon · © OpenStreetMap contributors.'}</Note></div>
        </Card>
      </div>
    </Page>
  );
}

/** 5.4 */
export function ProfileBankPage() {
  const { q, draft, setDraft } = useDraft();
  const wallet = useAsync(() => services.wallet.summary(), []);
  const { afterSave, cancelTo } = useReturnFlow('/profile');
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  if (q.error) return <Page title="Tài khoản ngân hàng liên kết"><ErrorState message={q.error} onRetry={q.reload} /></Page>;
  if (!draft) return <Page title="Tài khoản ngân hàng liên kết"><Loading /></Page>;
  const bank = draft.bank;
  const setBank = (p: Partial<BankAccount>) => setDraft({ ...draft, bank: { ...bank, ...p } });
  const errors: Errors<'bankName' | 'accountNumber' | 'accountHolder'> = {
    bankName: !bank.bankName ? 'Chọn ngân hàng' : undefined,
    accountNumber: !bank.accountNumber ? 'Chưa điền' : !/^\d{6,20}$/.test(bank.accountNumber) ? 'Chỉ gồm 6 đến 20 chữ số' : undefined,
    accountHolder: !bank.accountHolder.trim() ? 'Nhập tên chủ tài khoản' : !/^[A-Z ]{3,}$/.test(bank.accountHolder.trim()) ? 'Viết in hoa, không dấu' : undefined,
  };
  const bad = Object.values(errors).some(Boolean);

  const save = async () => {
    setShow(true);
    if (bad) return toast.error('Kiểm tra lại các ô báo đỏ');
    setBusy(true);
    try {
      await services.profile.updateBank({ bankName: bank.bankName, accountNumber: bank.accountNumber, accountHolder: bank.accountHolder.trim().replace(/\s+/g, ' ') });
      await afterSave('Đã lưu tài khoản ngân hàng');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Tài khoản ngân hàng liên kết" sub="Nơi tiền trong ví được rút về" actions={<><LinkButton variant="ghost" to={cancelTo}>Huỷ</LinkButton><Button loading={busy} onClick={() => void save()}>Lưu tài khoản</Button></>}>
      <Note tone="ok">Tiền bán hàng vào ví của quán, không tự chuyển theo kỳ. Quán chủ động bấm rút ở màn Ví, tiền về đúng tài khoản khai ở đây.</Note>
      <div className="row">
        <Card title="Thông tin tài khoản" grow="999 1 380px">
          <div className="stack">
            <SelectField label="Ngân hàng" required value={bank.bankName} placeholder="Chọn ngân hàng" options={BANKS} onChange={(e) => setBank({ bankName: e.target.value })} error={show ? errors.bankName : undefined} />
            <TextField label="Số tài khoản" required inputMode="numeric" autoComplete="off" value={bank.accountNumber} onChange={(e) => setBank({ accountNumber: e.target.value.replace(/\D/g, '') })} placeholder="Chỉ gồm chữ số" error={show ? errors.accountNumber : undefined} maxLength={20} />
            <TextField label="Tên chủ tài khoản" required autoComplete="off" value={bank.accountHolder} onChange={(e) => setBank({ accountHolder: e.target.value.toUpperCase() })} placeholder="Viết in hoa, không dấu" hint="Phải trùng tên đăng ký tại ngân hàng." error={show ? errors.accountHolder : undefined} />
            {services.demo && <Note tone="err">Đây là chế độ demo. Không kiểm tra tài khoản ngân hàng và không chuyển tiền. Đừng nhập số tài khoản thật.</Note>}
          </div>
        </Card>
        <Card title="Liên kết với ví" icon="wallet" grow="1 1 280px">
          {wallet.data ? (
            <>
              <div className="rowline"><span className="mu">Số dư khả dụng</span><b className="num">{vnd(wallet.data.available)}</b></div>
              <div className="rowline"><span className="mu">Chờ đơn kết thúc</span><b className="num">{vnd(wallet.data.holding)}</b></div>
              <div className="rowline"><span className="mu">Lệnh rút gần nhất</span><b>{wallet.data.lastWithdrawal ? `${wallet.data.lastWithdrawal.code} · ${WALLET_STATUS[wallet.data.lastWithdrawal.status].label.toLowerCase()}` : 'Chưa có'}</b></div>
              <div className="rowline"><span className="mu">Chiết khấu khi rút</span><b style={{ color: 'var(--g7)' }}>{PLATFORM_FEE_LABEL} mỗi lệnh</b></div>
              <div className="rowline"><span className="mu">Thời gian xử lý</span><span><RulePending /></span></div>
            </>
          ) : wallet.error ? (
            <p className="mu">{wallet.error}</p>
          ) : (
            <Loading />
          )}
          <LinkButton block variant="ghost" to="/wallet" style={{ marginTop: 12 }}><Icon name="wallet" size={16} />Mở ví của quán</LinkButton>
          <div style={{ marginTop: 12 }}><Note>Phí rút và thời gian xử lý chưa chốt. Khi nhóm thống nhất quy tắc, số cụ thể sẽ hiện ở đây và ở màn rút tiền.</Note></div>
        </Card>
      </div>
    </Page>
  );
}
