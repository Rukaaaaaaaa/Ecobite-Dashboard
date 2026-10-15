import { Navigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Button, LinkButton } from '@/components/Button';
import { Card, Note } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { RulePending } from '@/features/wallet/RulePending';
import { txnTime } from '@/features/wallet/TxnTable';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import type { Withdrawal, WithdrawalStatus } from '@/types';
import { businessTime, shortDate, vnd } from '@/utils/format';
import { maskAccount, PLATFORM_FEE_LABEL, WALLET_STATUS } from '@/utils/wallet';

type StepState = 'done' | 'now' | 'todo' | 'bad';

const BADGE: Record<Exclude<WithdrawalStatus, 'awaiting_otp'>, keyof typeof WALLET_STATUS> = { processing: 'outp', done: 'outd', failed: 'fail' };
const at = (iso: string | null): string => (iso ? `${businessTime(iso)} · ${shortDate(iso)}` : 'Chưa có');

function stepsOf(w: Withdrawal): { label: string; time: string; state: StepState }[] {
  const base = [
    { label: 'Đã tạo lệnh', time: at(w.createdAt), state: 'done' as const },
    { label: 'Đã xác thực bằng mã OTP', time: at(w.verifiedAt), state: 'done' as const },
  ];
  if (w.status === 'done') return [...base, { label: 'Đã chuyển tới ngân hàng', time: 'Đã hoàn tất', state: 'done' }, { label: 'Ngân hàng báo nhận', time: 'Đã hoàn tất', state: 'done' }];
  if (w.status === 'failed') return [...base, { label: 'Không thành công', time: 'Ngân hàng không nhận lệnh', state: 'bad' }];
  return [...base, { label: 'Đang chuyển tới ngân hàng', time: at(w.verifiedAt), state: 'now' }, { label: 'Ngân hàng báo nhận', time: 'Chưa có', state: 'todo' }];
}

const DOT: Record<StepState, { bg: string; color: string }> = {
  done: { bg: 'var(--g7)', color: '#fff' },
  now: { bg: 'var(--blu)', color: '#fff' },
  bad: { bg: 'var(--red)', color: '#fff' },
  todo: { bg: 'var(--ln)', color: 'var(--ink3)' },
};

/** 6.5 */
export default function WithdrawalDetailPage() {
  const { code = '' } = useParams();
  const q = useAsync(() => services.wallet.getWithdrawal(code), [code]);
  const w = q.data;

  if (q.error) return <Page title="Chi tiết lệnh rút"><ErrorState message={q.error} onRetry={q.reload} /><div style={{ marginTop: 12 }}><LinkButton variant="ghost" to="/wallet">Về ví</LinkButton></div></Page>;
  if (!w) return <Page title="Chi tiết lệnh rút"><Loading /></Page>;
  if (w.status === 'awaiting_otp') return <Navigate to={`/wallet/withdraw/${w.code}/verify`} replace />;

  const steps = stepsOf(w);
  const badge = WALLET_STATUS[BADGE[w.status]];
  const failed = w.status === 'failed';

  return (
    <Page
      title="Chi tiết lệnh rút"
      sub={`${w.code} · tạo lúc ${businessTime(w.createdAt)} ngày ${txnTime(w.createdAt).split(' ')[0]}`}
      actions={
        <>
          <LinkButton variant="ghost" to="/wallet"><Icon name="back" size={16} />Về ví</LinkButton>
          <Button variant="ghost" disabled title="Biên lai chưa có ở chế độ demo">Tải biên lai</Button>
        </>
      }
    >
      <div className="row">
        <Card title="Tiến trình" grow="999 1 380px" action={<Badge tone={badge.tone}>{badge.label}</Badge>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', alignSelf: 'stretch' }}>
                  <span className="step-dot" style={{ background: DOT[s.state].bg, color: DOT[s.state].color }}>
                    {s.state === 'done' ? <Icon name="chk" size={12} /> : s.state === 'now' ? <Icon name="clock" size={13} /> : s.state === 'bad' ? <Icon name="x" size={12} /> : i + 1}
                  </span>
                  {i < steps.length - 1 && <span style={{ flex: 1, width: 2, minHeight: 22, background: s.state === 'done' ? 'var(--g7)' : 'var(--ln)' }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0, paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
                  <b style={{ display: 'block', fontSize: 13, color: s.state === 'todo' ? 'var(--ink3)' : 'var(--ink)' }}>{s.label}</b>
                  <span className="mu num">{s.time}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Note tone="warn">
              {failed ? 'Chưa chốt tiền và chiết khấu của lệnh không thành công có quay lại ví hay không, nên màn này không tự diễn giải. ' : 'Chưa chốt thời gian tối đa cho bước ngân hàng báo nhận, nên màn không hứa mốc nào. '}
              <RulePending />
            </Note>
          </div>
        </Card>

        <div style={{ flex: '1 1 290px', maxWidth: 330, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card title="Nội dung lệnh">
            <div className="rowline"><span className="mu">Mã lệnh</span><b>{w.code}</b></div>
            <div className="rowline"><span className="mu">Trừ khỏi ví</span><b className="num">{vnd(w.amount)}</b></div>
            <div className="rowline"><span className="mu">Chiết khấu {PLATFORM_FEE_LABEL}</span><b className="num" style={{ color: 'var(--red)' }}>−{vnd(w.fee)}</b></div>
            <div className="rowline"><span className="mu">Về ngân hàng</span><b className="num" style={{ color: 'var(--g7)', fontSize: 14 }}>{vnd(w.net)}</b></div>
            <div className="rowline"><span className="mu">Ngân hàng</span><b>{w.bank.bankName}</b></div>
            <div className="rowline"><span className="mu">Số tài khoản</span><b>{maskAccount(w.bank.accountNumber)}</b></div>
            <div className="rowline"><span className="mu">Chủ tài khoản</span><b>{w.bank.accountHolder}</b></div>
          </Card>
          <Card title="Số dư sau lệnh">
            <div className="rowline"><span className="mu">Trước khi rút</span><b className="num">{vnd(w.balanceBefore)}</b></div>
            <div className="rowline"><span className="mu">Trừ khỏi ví</span><b className="num">−{vnd(w.amount)}</b></div>
            <div className="rowline"><span className="mu">Còn lại</span><b className="num">{vnd(w.balanceBefore - w.amount)}</b></div>
          </Card>
          {w.status === 'processing' && (
            <>
              <Button variant="danger" block disabled title="Chưa có quy tắc huỷ lệnh đang chuyển">Huỷ lệnh rút</Button>
              <p className="mu" style={{ margin: 0, fontSize: 11.5 }}>Chưa có quy tắc cho việc huỷ lệnh đang chuyển, nên nút này để đó chờ xác nhận.</p>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
