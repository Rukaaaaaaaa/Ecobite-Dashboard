import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BAG_STATUS } from '@/components/Badge';
import { Button, LinkButton } from '@/components/Button';
import { Card, Chip, Note } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { TextArea, TextField } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { ProductKindBadge } from '@/components/Badge';
import { ErrorState, Loading } from '@/components/States';
import { ProfileGateModal } from '@/features/bags/ProfileGate';
import { errorMessage, useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { ApiError, services } from '@/services';
import { BAG_IMAGE_LIBRARY } from '@/features/bags/image-library';
import type { Bag, BagInput, BagStatus, BagWindow, ProductKind, RestaurantProfile } from '@/types';
import { FOOD_CATEGORIES, PRODUCT_KIND_LABEL, totalSeats, WEEKDAYS } from '@/utils/bags';
import { discountPct, minutesOf, vnd } from '@/utils/format';
import { hasErrors, validateBag, type BagField, type Errors } from '@/utils/validation';

type Step = 'info' | 'pricing' | 'schedule' | 'preview';
const STEPS: { key: Step; label: string }[] = [
  { key: 'info', label: '1. Thông tin' },
  { key: 'pricing', label: '2. Giá và số lượng' },
  { key: 'schedule', label: '3. Khung giờ' },
  { key: 'preview', label: '4. Xem trước' },
];
const STEP_OF: Record<BagField, Step> = { name: 'info', category: 'info', image: 'info', originalPrice: 'pricing', price: 'pricing', quantity: 'pricing', perCustomerLimit: 'pricing', windows: 'schedule', repeatDays: 'schedule' };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const makeEmpty = (kind: ProductKind): BagInput => ({
  kind, category: '', contents: [],
  name: '', description: '', image: '', originalPrice: 0, price: 0, quantity: 10, perCustomerLimit: null, status: 'draft',
  windows: kind === 'bag' ? [{ start: '20:00', end: '21:30', quantity: 10 }] : [{ start: '10:00', end: '12:00', quantity: 10 }], repeatDays: [0, 1, 2, 3, 4, 5],
});

/** The two kinds keep their own fields: a dish has a group, a Mystery Bag has an internal contents list. */
const normalize = (f: BagInput): BagInput => (f.kind === 'food' ? { ...f, contents: [] } : { ...f, category: '' });

const toInput = (b: Bag): BagInput => ({
  kind: b.kind, category: b.category, contents: [...b.contents],
  name: b.name, description: b.description, image: b.image, originalPrice: b.originalPrice, price: b.price, quantity: b.quantity,
  perCustomerLimit: b.perCustomerLimit, status: b.status, windows: b.windows.map((w) => ({ ...w })), repeatDays: [...b.repeatDays],
});

/** 4.3 – 4.8: create or edit one product (dish or Mystery Bag). State is one object; each step edits part of it. */
export default function BagEditorPage({ kind: initialKind }: { kind?: ProductKind }) {
  const { id } = useParams();
  const editing = !!id;
  const [params, setParams] = useSearchParams();
  const step: Step = STEPS.some((s) => s.key === params.get('step')) ? (params.get('step') as Step) : 'info';
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const existing = useAsync(() => (id ? services.bags.get(id) : Promise.resolve(null)), [id]);
  const profile = useAsync(() => services.profile.get(), []);
  const [form, setForm] = useState<BagInput>(() => makeEmpty(initialKind ?? 'food'));
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState<null | 'draft' | 'save' | 'publish'>(null);
  const [gate, setGate] = useState<{ returnTo: string } | null>(null);

  // A new bag saved as a draft moves from /bags/new to /bags/:id/edit with `state.gate`; React reuses this
  // component for both routes, so react to the navigation itself (not to mount) and consume the flag once.
  useEffect(() => {
    if (id && (location.state as { gate?: boolean } | null)?.gate) {
      setGate({ returnTo: `/products/${id}/edit?step=preview` });
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [id, location.key, location.state, location.pathname, location.search, navigate]);

  // The dish and Mystery Bag routes share this component: opening the other one starts a fresh form.
  useEffect(() => {
    if (!id && initialKind) {
      setForm(makeEmpty(initialKind));
      setShowErrors(false);
    }
  }, [id, initialKind]);

  useEffect(() => {
    if (existing.data && loadedFor !== existing.data.id) {
      setForm(toInput(existing.data));
      setLoadedFor(existing.data.id);
    }
  }, [existing.data, loadedFor]);

  const patch = (p: Partial<BagInput>) => setForm((f) => ({ ...f, ...p }));
  const liveErrors = useMemo(() => validateBag(form), [form]);
  const err = (k: BagField) => (showErrors ? liveErrors[k] : undefined);
  const goStep = (s: Step) => setParams((p) => { const n = new URLSearchParams(p); n.set('step', s); return n; }, { replace: true });

  /** Saves and returns the stored bag; a new bag moves to its edit URL so the user can come back to it. */
  const persist = async (status: BagStatus, then: 'stay' | 'list', state?: { gate: true }): Promise<Bag | null> => {
    const input = normalize({ ...form, status });
    try {
      const saved = id ? await services.bags.update(id, input) : await services.bags.create(input);
      setForm(toInput(saved));
      setLoadedFor(saved.id);
      if (then === 'list') navigate('/products');
      else if (!id) navigate(`/products/${saved.id}/edit?step=${step}`, { replace: true, state });
      return saved;
    } catch (e) {
      if (e instanceof ApiError && e.code === 'profile_incomplete') throw e;
      toast.error(errorMessage(e));
      return null;
    }
  };

  const saveDraft = async () => {
    if (form.name.trim().length < 2) { setShowErrors(true); goStep('info'); return toast.error('Nhập tên sản phẩm để lưu nháp'); }
    setBusy('draft');
    const saved = await persist('draft', 'list');
    setBusy(null);
    if (saved) toast.success('Đã lưu nháp');
  };

  const publish = async (status: 'live') => {
    setShowErrors(true);
    const bad = Object.keys(liveErrors).find((k) => liveErrors[k as BagField]) as BagField | undefined;
    if (bad) { goStep(STEP_OF[bad]); return toast.error('Một số thông tin chưa hợp lệ. Kiểm tra các ô báo đỏ.'); }
    setBusy('publish');
    try {
      const completeness = await services.profile.completeness();
      if (!completeness.canPublish) {
        // Keep the work: store a draft, then explain what is missing and send the user to fix it.
        const saved = await persist(form.status === 'live' ? 'draft' : form.status, 'stay', { gate: true });
        // A new bag moves to its edit URL (the page remounts and reads `state.gate`); an existing one just opens the dialog.
        if (saved && id) setGate({ returnTo: `/products/${id}/edit?step=preview` });
        return;
      }
      const saved = await persist(status, 'list');
      if (saved) toast.success(`Đã đăng bán “${saved.name}”`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'profile_incomplete') setGate({ returnTo: `/products/${id ?? ''}/edit?step=preview` });
      else toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const saveChanges = async () => {
    if (form.status === 'live') return publish('live');
    setShowErrors(true);
    if (form.name.trim().length < 2) { goStep('info'); return; }
    setBusy('save');
    const saved = await persist(form.status, 'list');
    setBusy(null);
    if (saved) toast.success('Đã lưu thay đổi');
  };

  if (editing && existing.error) return <Page title="Sửa sản phẩm"><ErrorState message={existing.error} onRetry={existing.reload} /></Page>;
  if (editing && !existing.data && existing.loading) return <Page title="Sửa sản phẩm"><Loading /></Page>;

  const canSaveEdit = editing;
  return (
    <Page
      title={editing ? 'Sửa sản phẩm' : form.kind === 'bag' ? 'Tạo Mystery Bag' : 'Tạo đồ ăn mới'}
      sub={editing ? `${existing.data?.name ?? ''} · ${PRODUCT_KIND_LABEL[existing.data?.kind ?? form.kind].toLowerCase()} · ${BAG_STATUS[existing.data?.status ?? 'draft'].label.toLowerCase()}` : form.kind === 'bag' ? 'Túi bất ngờ, khách không biết trước món' : 'Món cụ thể, khách thấy rõ tên và ảnh'}
      actions={
        <>
          <LinkButton variant="ghost" to={editing ? '/products' : '/products/new'}>Huỷ</LinkButton>
          <Button variant="ghost" loading={busy === 'draft'} onClick={() => void saveDraft()}>Lưu nháp</Button>
          {canSaveEdit && form.status !== 'live' && <Button variant="ghost" loading={busy === 'save'} onClick={() => void saveChanges()}>Lưu thay đổi</Button>}
          <Button loading={busy === 'publish'} onClick={() => void (canSaveEdit && form.status === 'live' ? saveChanges() : publish('live'))}>{canSaveEdit && form.status === 'live' ? 'Lưu thay đổi' : 'Đăng bán'}</Button>
        </>
      }
    >
      <div className="step-tabs" role="tablist" aria-label="Các bước">
        {STEPS.map((s) => (
          <button key={s.key} type="button" role="tab" aria-current={step === s.key ? 'step' : undefined} onClick={() => goStep(s.key)}>{s.label}</button>
        ))}
      </div>

      {editing && existing.data && existing.data.status === 'live' && (
        <Note tone="warn">Sản phẩm đang bán. Đơn đã đặt giữ nguyên tên và giá lúc khách mua, thay đổi chỉ áp dụng cho đơn mới.</Note>
      )}

      {step === 'info' && <InfoStep form={form} patch={patch} err={err} />}
      {step === 'pricing' && <PricingStep form={form} patch={patch} err={err} restaurant={profile.data?.name} />}
      {step === 'schedule' && <ScheduleStep form={form} patch={patch} err={err} profile={profile.data} />}
      {step === 'preview' && <PreviewStep form={form} errors={liveErrors} profile={profile.data} restaurant={profile.data?.name} onEdit={() => goStep('info')} onPublish={() => void publish('live')} publishing={busy === 'publish'} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <Button variant="ghost" disabled={step === 'info'} onClick={() => goStep(STEPS[STEPS.findIndex((s) => s.key === step) - 1].key)}><Icon name="back" size={16} />Bước trước</Button>
        <Button variant="ghost" disabled={step === 'preview'} onClick={() => goStep(STEPS[STEPS.findIndex((s) => s.key === step) + 1].key)}>Bước sau<Icon name="chev" size={16} /></Button>
      </div>

      {gate && <ProfileGateModal returnTo={gate.returnTo} savedAsDraft onClose={() => setGate(null)} />}
    </Page>
  );
}

interface StepProps {
  form: BagInput;
  patch: (p: Partial<BagInput>) => void;
  err: (k: BagField) => string | undefined;
}

/** Mystery Bag only: the dishes that may go into the bag. Internal, customers never see it. */
function ContentsEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v.length > 0 && !items.some((i) => i.toLowerCase() === v.toLowerCase())) onChange([...items, v]);
    setDraft('');
  };
  return (
    <div>
      <span className="lb">Món có thể nằm trong túi</span>
      <div className="chips" style={{ marginBottom: 8 }}>
        {items.map((i) => (
          <span key={i} className="chp" aria-pressed="true" style={{ gap: 6 }}>
            {i}
            <button type="button" aria-label={`Bỏ ${i}`} onClick={() => onChange(items.filter((x) => x !== i))} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', display: 'grid', cursor: 'pointer' }}><Icon name="x" size={12} /></button>
          </span>
        ))}
        {items.length === 0 && <span className="mu">Chưa có món nào.</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="ip" aria-label="Thêm món vào danh sách" value={draft} maxLength={60} placeholder="vd: Bánh mì thịt nướng" style={{ flex: 1, minWidth: 0 }} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button variant="ghost" onClick={add}><Icon name="plus" size={14} />Thêm món</Button>
      </div>
      <p className="mu" style={{ margin: '7px 0 0' }}>Khách không thấy danh sách này. Dùng để quán soạn túi cho nhanh.</p>
    </div>
  );
}

function InfoStep({ form, patch, err }: StepProps) {
  const toast = useToast();
  const isBag = form.kind === 'bag';
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Ảnh tối đa 2 MB');
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && patch({ image: reader.result });
    reader.onerror = () => toast.error('Không đọc được ảnh này');
    reader.readAsDataURL(file);
  };

  return (
    <div className="row">
      <Card title="Thông tin" grow="999 1 400px">
        <div className="stack">
          <div>
            <span className="lb">Loại sản phẩm</span>
            <div className="chips" role="group" aria-label="Loại sản phẩm">
              <Chip active={!isBag} onClick={() => patch({ kind: 'food' })}><Icon name="dish" size={15} />Đồ ăn</Chip>
              <Chip active={isBag} onClick={() => patch({ kind: 'bag' })}><Icon name="gift" size={15} />Mystery Bag</Chip>
            </div>
          </div>
          <TextField label={isBag ? 'Tên túi' : 'Tên món'} required value={form.name} onChange={(e) => patch({ name: e.target.value })} error={err('name')} placeholder={isBag ? 'vd: Túi bất ngờ cuối ngày' : 'vd: Cơm gà xối mỡ'} maxLength={80} />
          <TextArea label="Mô tả cho khách" value={form.description} onChange={(e) => patch({ description: e.target.value })} placeholder={isBag ? 'Nói về số lượng món và loại món, không nói chính xác là món gì.' : 'Khách đọc để biết món gồm những gì.'} maxLength={300} hint={`${form.description.length}/300`} />
          {isBag ? (
            <ContentsEditor items={form.contents} onChange={(contents) => patch({ contents })} />
          ) : (
            <div>
              <span className="lb">Nhóm món <span className="rq">*</span></span>
              <div className="chips" role="group" aria-label="Nhóm món">
                {FOOD_CATEGORIES.map((c) => <Chip key={c} active={form.category === c} onClick={() => patch({ category: c })}>{c}</Chip>)}
              </div>
              {err('category') ? <p className="field-err" role="alert"><Icon name="warn" size={14} />{err('category')}</p> : <p className="mu" style={{ marginTop: 7 }}>Giúp khách lọc đúng món khi tìm.</p>}
            </div>
          )}
          <div>
            <span className="lb">Ảnh sản phẩm <span className="rq">*</span></span>
            <div style={{ display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 108, height: 80, borderRadius: 10, overflow: 'hidden', background: 'var(--soft2)', border: err('image') ? '1px solid var(--red)' : '1px solid var(--ln)', display: 'grid', placeItems: 'center', color: 'var(--ink3)', flex: '0 0 auto' }}>
                {form.image ? <img src={form.image} alt="Ảnh túi đã chọn" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="bag" size={26} />}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
                  {BAG_IMAGE_LIBRARY.map((src) => (
                    <button key={src} type="button" onClick={() => patch({ image: src })} aria-label="Chọn ảnh mẫu" aria-pressed={form.image === src} style={{ width: 46, height: 38, borderRadius: 8, overflow: 'hidden', padding: 0, border: form.image === src ? '2px solid var(--g6)' : '1px solid var(--ln2)', background: 'none' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Tải ảnh lên" style={{ width: 46, height: 38, borderRadius: 8, border: '1px dashed var(--ln2)', background: 'none', display: 'grid', placeItems: 'center', color: 'var(--ink3)' }}>
                    <Icon name="upload" size={15} />
                  </button>
                  <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
                </div>
                <p className="mu">Ảnh riêng của sản phẩm (JPG, PNG, WebP, tối đa 2 MB). Không cần ảnh logo hay ảnh bìa nhà hàng. Ở chế độ demo ảnh tải lên chỉ nằm trong trình duyệt.</p>
              </div>
            </div>
            {err('image') && <p className="field-err" role="alert"><Icon name="warn" size={14} />{err('image')}</p>}
          </div>
        </div>
      </Card>
      <Card title="Trạng thái" grow="1 1 290px">
        <div className="chips" role="group" aria-label="Trạng thái sản phẩm">
          {(['draft', 'live', 'paused'] as BagStatus[]).map((s) => (
            <Chip key={s} active={form.status === s} onClick={() => patch({ status: s })}>{BAG_STATUS[s].label}</Chip>
          ))}
        </div>
        <p className="mu" style={{ marginTop: 10 }}>Nháp chỉ mình bạn thấy. Tạm dừng thì sản phẩm vẫn còn nhưng ẩn khỏi ứng dụng khách. Đăng bán cần hồ sơ nhà hàng đủ thông tin.</p>
      </Card>
    </div>
  );
}

const digits = (s: string): number => Number(s.replace(/\D/g, '')) || 0;

function PricingStep({ form, patch, err, restaurant }: StepProps & { restaurant?: string }) {
  const pct = discountPct(form.originalPrice, form.price);
  const suggest = (p: number) => Math.round((form.originalPrice * (1 - p / 100)) / 1000) * 1000;
  return (
    <div className="row">
      <Card grow="999 1 400px">
        <h3 className="ttl"><span className="gro">Giá</span></h3>
        <div className="grid2" style={{ marginBottom: 14 }}>
          <TextField label={form.kind === 'bag' ? 'Giá trị ước tính của túi' : 'Giá gốc của phần ăn'} required inputMode="numeric" value={form.originalPrice ? form.originalPrice.toLocaleString('vi-VN') : ''} onChange={(e) => patch({ originalPrice: digits(e.target.value) })} error={err('originalPrice')} hint="Giá quán bán bình thường trong ngày (đồng)." placeholder="0" />
          <TextField label="Giá bán trên EcoBite" required inputMode="numeric" value={form.price ? form.price.toLocaleString('vi-VN') : ''} onChange={(e) => patch({ price: digits(e.target.value) })} error={err('price')} hint="Nên để quanh một nửa giá gốc." placeholder="0" />
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <span className="mu">Gợi ý nhanh:</span>
          {[40, 50, 60].map((p) => (
            <Chip key={p} active={form.originalPrice > 0 && form.price === suggest(p)} onClick={() => form.originalPrice > 0 && patch({ price: suggest(p) })}>
              -{p}% · {form.originalPrice > 0 ? vnd(suggest(p)) : '—'}
            </Chip>
          ))}
        </div>
        <h3 className="ttl"><span className="gro">Số lượng</span></h3>
        <div className="grid2">
          <TextField label="Số suất mỗi khung giờ (mặc định)" required inputMode="numeric" value={String(form.quantity || '')} onChange={(e) => patch({ quantity: digits(e.target.value) })} error={err('quantity')} hint="Mỗi khung giờ ở bước 3 có thể đặt số suất riêng." />
          <TextField label="Giới hạn mỗi khách" inputMode="numeric" value={form.perCustomerLimit === null ? '' : String(form.perCustomerLimit)} onChange={(e) => patch({ perCustomerLimit: e.target.value.trim() === '' ? null : digits(e.target.value) })} error={err('perCustomerLimit')} placeholder="Không giới hạn" />
        </div>
        <div style={{ marginTop: 14 }}><Note>Hết suất thì sản phẩm tự ẩn khỏi ứng dụng khách cho tới khung giờ sau. Số suất còn lại luôn do máy chủ kiểm soát để không bán quá.</Note></div>
        {form.kind === 'bag' && <div style={{ marginTop: 11 }}><Note>Mystery Bag thường giảm sâu hơn đồ ăn lẻ, vì khách chấp nhận không biết trước món.</Note></div>}
      </Card>
      <Card title="Khách sẽ thấy" grow="1 1 280px">
        <BagPreviewCard form={form} restaurant={restaurant} />
        <p className="mu" style={{ marginTop: 11 }}>Đây là thẻ trong ứng dụng khách. Giá và số suất đổi ở bên trái sẽ đổi theo.</p>
        {form.price > 0 && form.price < form.originalPrice && <div style={{ marginTop: 11 }}><Note tone="ok">Khách thấy giảm <b>{pct}%</b>. Mỗi suất quán thu về <b>{vnd(form.price)}</b>.</Note></div>}
      </Card>
    </div>
  );
}

function BagPreviewCard({ form, restaurant, large }: { form: BagInput; restaurant?: string; large?: boolean }) {
  const w = form.windows[0];
  const seats = totalSeats(form) || form.quantity;
  return (
    <div style={{ border: '1px solid var(--ln)', borderRadius: 12, overflow: 'hidden', maxWidth: large ? 320 : undefined }}>
      <div style={{ position: 'relative', height: large ? 132 : 112, background: 'var(--g1)' }}>
        {form.image && <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <span style={{ position: 'absolute', left: 9, top: 9 }}><ProductKindBadge kind={form.kind} /></span>
      </div>
      <div style={{ padding: '12px 13px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <b style={{ fontSize: large ? 15 : 14 }}>{form.name || (form.kind === 'bag' ? 'Tên túi' : 'Tên món')}</b>
          {form.price > 0 && form.price < form.originalPrice && <span className="bg2 tone-g" style={{ marginLeft: 'auto' }}>-{discountPct(form.originalPrice, form.price)}%</span>}
        </div>
        <span className="mu" style={{ display: 'block', margin: '0 0 6px' }}>{restaurant || 'Nhà hàng của bạn'}</span>
        {large && form.description && <p className="mu" style={{ margin: '0 0 8px' }}>{form.description}</p>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <b className="num" style={{ fontSize: large ? 20 : 19, color: 'var(--g7)' }}>{vnd(form.price)}</b>
          {form.originalPrice > 0 && <s className="mu num">{vnd(form.originalPrice)}</s>}
        </div>
        <div className="mu num" style={{ marginTop: 7 }}>Nhận {w ? `${w.start} – ${w.end}` : '—'} · {seats} suất</div>
        {large && <div className="bt block" style={{ marginTop: 11, opacity: 0.85, pointerEvents: 'none' }}>{form.kind === 'bag' ? 'Đặt túi này' : 'Đặt món này'}</div>}
      </div>
    </div>
  );
}

function ScheduleStep({ form, patch, err, profile }: StepProps & { profile?: RestaurantProfile | null }) {
  const upd = (i: number, p: Partial<BagWindow>) => patch({ windows: form.windows.map((w, j) => (j === i ? { ...w, ...p } : w)) });
  const add = () => {
    const last = form.windows[form.windows.length - 1];
    const start = last ? last.end : '17:00';
    const h = Math.min(Number(start.slice(0, 2)) + 2, 23);
    patch({ windows: [...form.windows, { start, end: `${String(h).padStart(2, '0')}:${start.slice(3)}`, quantity: form.quantity || 1 }] });
  };
  const toggleDay = (d: number) => patch({ repeatDays: form.repeatDays.includes(d) ? form.repeatDays.filter((x) => x !== d) : [...form.repeatDays, d].sort() });
  const outside = form.windows.some((w) => !withinOpening(profile, form.repeatDays, w));

  return (
    <div className="row">
      <Card title="Các khung giờ" grow="999 1 400px" action={<Button small variant="ghost" onClick={add}><Icon name="plus" size={14} />Thêm khung</Button>}>
        {form.windows.length === 0 && <p className="mu">Chưa có khung giờ nào. Bấm “Thêm khung”.</p>}
        {form.windows.map((w, i) => (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: 12, border: '1px solid var(--ln)', borderRadius: 10, background: 'var(--soft)', marginBottom: 9 }}>
            <b style={{ flex: '0 0 auto', fontSize: 12.5, color: 'var(--ink2)' }}>Khung {i + 1}</b>
            <input className="ip num" type="time" aria-label={`Khung ${i + 1}: giờ bắt đầu`} style={{ flex: '1 1 92px', height: 34 }} value={w.start} onChange={(e) => upd(i, { start: e.target.value })} />
            <span className="mu">đến</span>
            <input className="ip num" type="time" aria-label={`Khung ${i + 1}: giờ kết thúc`} style={{ flex: '1 1 92px', height: 34 }} value={w.end} onChange={(e) => upd(i, { end: e.target.value })} />
            <input className="ip num" type="number" min={1} aria-label={`Khung ${i + 1}: số suất`} style={{ flex: '1 1 76px', height: 34 }} value={w.quantity || ''} onChange={(e) => upd(i, { quantity: Number(e.target.value) })} />
            <span className="mu">suất</span>
            <button type="button" className="icon-btn" aria-label={`Xoá khung ${i + 1}`} onClick={() => patch({ windows: form.windows.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        {err('windows') && <p className="field-err" role="alert"><Icon name="warn" size={14} />{err('windows')}</p>}
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <span className="mu">Lặp lại:</span>
          {WEEKDAYS.map((d, i) => <Chip key={d} active={form.repeatDays.includes(i)} onClick={() => toggleDay(i)}>{d}</Chip>)}
        </div>
        {err('repeatDays') && <p className="field-err" role="alert"><Icon name="warn" size={14} />{err('repeatDays')}</p>}
      </Card>
      <Card title="Trong ngày" grow="1 1 280px">
        <DayTimeline windows={form.windows} />
        <p className="mu" style={{ marginTop: 11 }}>Khách chỉ thấy túi trong khung giờ đang mở. Ngoài khung thì túi ẩn đi. Giờ bán và giờ nhận hàng dùng chung một khung.</p>
        {outside && <div style={{ marginTop: 11 }}><Note tone="warn">Có khung giờ nằm ngoài giờ mở cửa trong hồ sơ. Nếu không, khách tới sẽ không có ai giao. <Link to="/profile/edit?returnTo=%2Fproducts">Sửa giờ mở cửa</Link></Note></div>}
      </Card>
    </div>
  );
}

/** True when the window fits the opening hours of every day the bag repeats on (unknown profile = no complaint). */
function withinOpening(profile: RestaurantProfile | null | undefined, days: number[], w: BagWindow): boolean {
  if (!profile) return true;
  return days.every((d) => {
    const o = profile.openingHours[d];
    return !o || (o.open && o.start && o.end && minutesOf(w.start) >= minutesOf(o.start) && minutesOf(w.end) <= minutesOf(o.end));
  });
}

function DayTimeline({ windows }: { windows: BagWindow[] }) {
  const pct = (hhmm: string) => Math.min(100, Math.max(0, ((minutesOf(hhmm) - 360) / (16 * 60)) * 100));
  return (
    <div className="timeline" role="img" aria-label="Các khung giờ bán trong ngày">
      {[6, 10, 14, 18, 22].map((h) => (
        <span key={h}>
          <span style={{ position: 'absolute', left: `${((h - 6) / 16) * 100}%`, top: 0, bottom: 16, width: 1, background: 'var(--ln)' }} />
          <span style={{ position: 'absolute', left: `${((h - 6) / 16) * 100}%`, bottom: 3, transform: 'translateX(-50%)', fontSize: 9.5, color: 'var(--ink3)' }}>{String(h).padStart(2, '0')}:00</span>
        </span>
      ))}
      {windows.filter((w) => /^\d{2}:\d{2}$/.test(w.start) && /^\d{2}:\d{2}$/.test(w.end) && w.end > w.start).map((w, i) => (
        <span key={i} style={{ position: 'absolute', left: `${pct(w.start)}%`, width: `${Math.max(pct(w.end) - pct(w.start), 2)}%`, top: 11, height: 22, borderRadius: 5, background: i % 2 ? 'var(--g6)' : 'var(--g7)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{i + 1}</span>
      ))}
    </div>
  );
}

function PreviewStep({ form, errors, profile, restaurant, onEdit, onPublish, publishing }: { form: BagInput; errors: Errors<BagField>; profile?: RestaurantProfile | null; restaurant?: string; onEdit: () => void; onPublish: () => void; publishing: boolean }) {
  const completeness = useAsync(() => services.profile.completeness(), []);
  const checks: [string, boolean][] = [
    [form.kind === 'food' ? 'Đã chọn loại sản phẩm và nhóm món' : 'Đã chọn loại sản phẩm', !errors.category],
    ['Có ảnh riêng cho sản phẩm', !errors.image],
    ['Tên và mô tả đã điền', form.name.trim().length >= 2 && form.description.trim().length > 0],
    ['Giá bán thấp hơn giá gốc', !errors.price && !errors.originalPrice],
    ['Ít nhất một khung giờ bán hợp lệ', !errors.windows && !errors.repeatDays],
    ['Khung giờ nằm trong giờ mở cửa', form.windows.length > 0 && form.windows.every((w) => withinOpening(profile, form.repeatDays, w))],
    ['Hồ sơ nhà hàng đã đủ thông tin', completeness.data?.canPublish ?? false],
  ];
  const missing = completeness.data?.missing ?? [];
  return (
    <div className="row">
      <Card title="Thẻ trong ứng dụng khách" grow="1 1 300px"><BagPreviewCard form={form} restaurant={restaurant} large /></Card>
      <Card title="Kiểm tra trước khi đăng" grow="999 1 380px">
        {checks.map(([t, ok]) => (
          <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--ln)' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: '0 0 auto', background: ok ? 'var(--g1)' : 'var(--amb-bg)', color: ok ? 'var(--g7)' : 'var(--amb)' }}><Icon name={ok ? 'chk' : 'warn'} size={13} /></span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>{t}</span>
            <span className={`bg2 ${ok ? 'tone-g' : 'tone-a'}`}>{ok ? 'Đạt' : 'Còn thiếu'}</span>
          </div>
        ))}
        {missing.length > 0 && <div style={{ marginTop: 13 }}><Note tone="warn">Hồ sơ nhà hàng còn thiếu: {missing.map((m) => m.label.toLowerCase()).join(', ')}. Bấm đăng bán sẽ lưu nháp, hiện thông báo và dẫn tới trang hồ sơ.</Note></div>}
        {hasErrors(errors) && <div style={{ marginTop: 10 }}><Note tone="err">Còn thông tin chưa hợp lệ, hãy quay lại các bước trước để sửa.</Note></div>}
        <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onEdit}><Icon name="back" size={16} />Về sửa</Button>
          <Button loading={publishing} onClick={onPublish}>Đăng bán</Button>
        </div>
      </Card>
    </div>
  );
}

