import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LinkButton } from '@/components/Button';
import { Card, Chip, Note } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { RulePending } from '@/features/wallet/RulePending';
import { errorMessage, useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import { digitsOnly, vnd } from '@/utils/format';
import { feeOf, maskAccount, netOf, PLATFORM_FEE_LABEL } from '@/utils/wallet';

const QUICK = [500_000, 1_000_000, 2_000_000, 5_000_000];

/** 6.3 (and 6.6 when there is no bank account yet) */
export default function WithdrawPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const summary = useAsync(() => services.wallet.summary(), []);
  const [raw, setRaw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = summary.data;

  if (summary.error) return <Page title="Rút tiền"><ErrorState message={summary.error} onRetry={summary.reload} /></Page>;
  if (!s) return <Page title="Rút tiền"><Loading /></Page>;

  // 6.6: the wallet can be viewed, only the withdrawal needs the bank account.
  if (!s.bank) {
    return (
      <Page title="Chưa thể rút tiền" sub="Thiếu tài khoản ngân hàng nhận tiền">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
          <div className="cd" style={{ maxWidth: 520, width: '100%', padding: 26, textAlign: 'center' }}>
            <span className="big-ico warn"><Icon name="warn" size={27} /></span>
            <h2 style={{ fontSize: 19, marginBottom: 7 }}>Cần tài khoản ngân hàng trước khi rút</h2>
            <p className="mu" style={{ margin: '0 0 18px', fontSize: 13 }}>Ví vẫn xem được số dư và lịch sử bình thường. Chỉ thao tác rút tiền mới cần tài khoản nhận.</p>
            <div className="cd pd" style={{ background: 'var(--soft)', textAlign: 'left', marginBottom: 18 }}>
              {['Ngân hàng', 'Số tài khoản', 'Tên chủ tài khoản'].map((k) => (
                <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--amb)', display: 'grid' }}><Icon name="warn" size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>{k}</span>
                  <span className="bg2 tone-a">Chưa điền</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <LinkButton variant="ghost" to="/wallet">Để sau</LinkButton>
              <LinkButton to="/profile/bank?returnTo=/wallet/withdraw"><Icon name="bank" size={16} />Khai tài khoản ngân hàng</LinkButton>
            </div>
            <p className="mu" style={{ margin: '14px 0 0', fontSize: 11.5 }}>Cùng cách xử lý với hồ sơ nhà hàng: không chặn ở cửa vào, chỉ chặn đúng thao tác cần thông tin.</p>
          </div>
        </div>
      </Page>
    );
  }

  const amount = Number(raw) || 0;
  const error = amount <= 0 ? 'Nhập số tiền muốn rút' : amount > s.available ? 'Số tiền vượt quá số dư khả dụng' : undefined;
  const setAmount = (n: number) => { setRaw(String(n)); setShow(false); };

  const next = async () => {
    setShow(true);
    if (error) return;
    setBusy(true);
    try {
      const w = await services.wallet.startWithdrawal(amount);
      navigate(`/wallet/withdraw/${w.code}/verify`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Page title="Rút tiền" sub="Chuyển tiền từ ví về tài khoản ngân hàng đã đăng ký" actions={<LinkButton variant="ghost" to="/wallet"><Icon name="back" size={16} />Về ví</LinkButton>}>
      <div className="row">
        <Card title="Số tiền muốn rút" grow="999 1 400px">
          <div className="stack" style={{ gap: 15 }}>
            <div>
              <label className="sr-only" htmlFor="w-amount">Số tiền muốn rút (đồng)</label>
              <div className={`ip amount ${show && error ? 'err' : ''}`}>
                <input id="w-amount" inputMode="numeric" autoComplete="off" placeholder="0" value={raw ? Number(raw).toLocaleString('vi-VN') : ''} onChange={(e) => { setRaw(digitsOnly(e.target.value).slice(0, 10)); setShow(false); }} aria-invalid={show && !!error} aria-describedby="w-amount-msg" />
                <span>đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 7, fontSize: 12 }}>
                <span className="mu">Khả dụng {vnd(s.available)}</span>
                <button type="button" className="linkbtn" disabled={s.available <= 0} onClick={() => setAmount(s.available)}>Rút toàn bộ</button>
              </div>
              {show && error ? (
                <p className="field-err" id="w-amount-msg" role="alert"><Icon name="warn" size={14} />{error}</p>
              ) : (
                <p id="w-amount-msg" style={{ margin: '7px 0 0', fontSize: 12, color: 'var(--amb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="warn" size={13} />Đây là số trừ khỏi ví. Sau chiết khấu {PLATFORM_FEE_LABEL}, ngân hàng nhận {vnd(netOf(amount))}.
                </p>
              )}
            </div>
            <div className="chips" role="group" aria-label="Chọn nhanh số tiền">
              {QUICK.map((q) => (
                <Chip key={q} active={amount === q} onClick={() => (q <= s.available ? setAmount(q) : toast.info('Số tiền này vượt quá số dư khả dụng'))}>{vnd(q)}</Chip>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--ln)', paddingTop: 14 }}>
              <span className="lb">Tài khoản nhận</span>
              <div className="cd pd" style={{ background: 'var(--soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="big-ico sm"><Icon name="bank" size={19} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 13.5 }}>{s.bank.bankName}</b>
                  <span className="mu num">{maskAccount(s.bank.accountNumber)} · {s.bank.accountHolder}</span>
                </span>
                <LinkButton small variant="ghost" to="/profile/bank?returnTo=/wallet/withdraw">Đổi</LinkButton>
              </div>
              <p className="mu" style={{ margin: '7px 0 0', fontSize: 11.5 }}>Chỉ rút được về tài khoản đã khai ở hồ sơ. Muốn đổi thì sửa ở màn tài khoản ngân hàng rồi quay lại.</p>
            </div>
            {services.demo && <Note tone="err">Đây là chế độ demo. Không gọi ngân hàng, không chuyển tiền. Đừng nhập số tài khoản thật.</Note>}
          </div>
        </Card>

        <Card title="Bạn thực nhận bao nhiêu" grow="1 1 310px">
          <div className="rowline"><span className="mu">Trừ khỏi ví</span><b className="num">{vnd(amount)}</b></div>
          <div className="rowline">
            <span className="mu">Chiết khấu nền tảng <span className="bg2 sm tone-r">{PLATFORM_FEE_LABEL}</span></span>
            <b className="num" style={{ color: 'var(--red)' }}>−{vnd(feeOf(amount))}</b>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 0 4px' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>Về tài khoản ngân hàng</span>
            <b className="num" style={{ fontSize: 21, color: 'var(--g7)' }}>{vnd(netOf(amount))}</b>
          </div>
          <div className="mt" style={{ margin: '10px 0 6px' }}><i style={{ width: `${(1 - 0.1) * 100}%` }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--ink3)' }}><span>Bạn nhận 90%</span><span>EcoBite giữ {PLATFORM_FEE_LABEL}</span></div>
          <div className="rowline" style={{ marginTop: 8, borderTop: '1px solid var(--ln)', alignItems: 'center' }}><span className="mu">Thời gian xử lý</span><span><RulePending /></span></div>
          <Button block loading={busy} onClick={() => void next()} style={{ marginTop: 4, height: 42 }}>Tiếp tục</Button>
          <p className="mu" style={{ margin: '9px 0 0', fontSize: 11.5, textAlign: 'center' }}>Bước sau cần mã xác thực gửi về số điện thoại của chủ quán.</p>
        </Card>
      </div>
    </Page>
  );
}
