import { Link } from 'react-router-dom';
import { LinkButton } from '@/components/Button';
import { Card, Note } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { DemoTag, EmptyState, ErrorState, Loading } from '@/components/States';
import { SubNav, WALLET_NAV } from '@/components/SubNav';
import { RulePending } from '@/features/wallet/RulePending';
import { TxnTable } from '@/features/wallet/TxnTable';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import { vnd } from '@/utils/format';
import { maskAccount, netOf, PLATFORM_FEE_LABEL } from '@/utils/wallet';

const WAITING_STEPS: [string, boolean][] = [
  ['Chờ xác nhận', false],
  ['Đã xác nhận', false],
  ['Chờ khách lấy', false],
  ['Hoàn thành', true],
  ['Khách không lấy', true],
];

/** 6.1 */
export default function WalletPage() {
  const summary = useAsync(() => services.wallet.summary(), []);
  const txns = useAsync(() => services.wallet.transactions(), []);
  const s = summary.data;

  return (
    <Page
      title="Ví của quán"
      sub="Tiền bán hàng vào đây, rút về ngân hàng khi cần"
      actions={
        <>
          <LinkButton variant="ghost" to="/wallet/history"><Icon name="doc" size={16} />Lịch sử giao dịch</LinkButton>
          <LinkButton to="/wallet/withdraw"><Icon name="out" size={16} />Rút tiền</LinkButton>
        </>
      }
    >
      <SubNav label="Mục con" items={WALLET_NAV} />
      {summary.error ? (
        <ErrorState message={summary.error} onRetry={summary.reload} />
      ) : !s ? (
        <Loading label="Đang tải ví…" />
      ) : (
        <div className="row" style={{ alignItems: 'stretch' }}>
          <div style={{ flex: '999 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="wal-hero">
              <span className="lbl">Số dư khả dụng</span>
              <b className="num big">{vnd(s.available)}</b>
              <div className="stats">
                <span><span className="lbl">Chờ đơn kết thúc</span><b className="num">{vnd(s.holding)}</b></span>
                <span><span className="lbl">Rút hết thì nhận về</span><b className="num">{vnd(netOf(s.available))}</b></span>
                <span>
                  <span className="lbl">Tài khoản nhận</span>
                  <b>{s.bank ? `${s.bank.bankName} ${maskAccount(s.bank.accountNumber)}` : 'Chưa khai'}</b>
                </span>
                <Link className="bt wh" to="/wallet/withdraw" style={{ marginLeft: 'auto' }}><Icon name="out" size={16} />Rút tiền</Link>
              </div>
              <div className="foot"><Icon name="warn" size={14} />Số dư là tiền chưa trừ chiết khấu. Mỗi lệnh rút bị trừ {PLATFORM_FEE_LABEL} chiết khấu nền tảng.</div>
            </div>

            <Card
              title="Giao dịch gần đây"
              icon="doc"
              action={<Link to="/wallet/history" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Xem tất cả <Icon name="chev" size={13} /></Link>}
            >
              {txns.error ? (
                <ErrorState message={txns.error} onRetry={txns.reload} />
              ) : !txns.data ? (
                <Loading />
              ) : txns.data.length === 0 ? (
                <EmptyState icon="wallet" title="Chưa có giao dịch">Tiền từ các đơn đã hoàn thành sẽ vào ví và hiện ở đây.</EmptyState>
              ) : (
                <TxnTable rows={txns.data.slice(0, 5)} />
              )}
            </Card>
          </div>

          <div style={{ flex: '1 1 268px', maxWidth: 300, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Vì sao có tiền đang chờ" icon="clock" tone="warn">
              <p style={{ margin: '0 0 11px', fontSize: 12.5, lineHeight: 1.6 }}>
                Khách đã trả tiền nhưng đơn chưa kết thúc. Đơn kết thúc thì tiền sang khả dụng ngay, không chờ thêm ngày nào.
              </p>
              {WAITING_STEPS.map(([label, done]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
                  <span style={{ color: done ? 'var(--g7)' : 'var(--amb)', display: 'grid' }}><Icon name={done ? 'chk' : 'clock'} size={13} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
                  <b style={{ fontWeight: 600, color: done ? 'var(--g7)' : 'var(--amb)' }}>{done ? 'Khả dụng' : 'Đang chờ'}</b>
                </div>
              ))}
              <p style={{ margin: '9px 0 0', fontSize: 11.5, lineHeight: 1.55 }}>
                Khách không lấy vẫn được tính vì tiền đã thu, giống cách ghi nhận doanh thu ở màn lịch sử đơn hàng.
              </p>
            </Card>

            <Card title="Quy tắc rút tiền">
              <div className="rowline"><span className="mu">Chiết khấu nền tảng</span><b style={{ color: 'var(--g7)' }}>{PLATFORM_FEE_LABEL} mỗi lệnh rút</b></div>
              <div className="rowline"><span className="mu">Trừ vào lúc</span><b>Khi tạo lệnh rút</b></div>
              <div className="rowline"><span className="mu">Tiền vào khả dụng</span><b>Khi đơn kết thúc</b></div>
              <div className="rowline"><span className="mu">Số tiền tối thiểu</span><span><RulePending /></span></div>
              <div className="rowline"><span className="mu">Hạn mức mỗi ngày</span><span><RulePending /></span></div>
              <div className="rowline"><span className="mu">Thời gian xử lý</span><span><RulePending /></span></div>
              <div style={{ marginTop: 11 }}><Note tone="ok">Ví dụ: rút 1.000.000đ thì bị trừ 100.000đ, về tài khoản 900.000đ.</Note></div>
            </Card>

            <Card title="Tài khoản nhận tiền" icon="bank">
              {s.bank ? (
                <>
                  <b style={{ display: 'block', fontSize: 14 }}>{s.bank.bankName}</b>
                  <span className="num mu" style={{ display: 'block', margin: '2px 0 1px' }}>{maskAccount(s.bank.accountNumber)}</span>
                  <span className="mu">{s.bank.accountHolder}</span>
                </>
              ) : (
                <p className="mu">Chưa khai tài khoản ngân hàng. Ví vẫn xem được số dư và lịch sử, chỉ rút tiền mới cần.</p>
              )}
              <LinkButton block variant="ghost" to="/profile/bank?returnTo=/wallet" style={{ marginTop: 12 }}>{s.bank ? 'Đổi tài khoản nhận' : 'Khai tài khoản ngân hàng'}</LinkButton>
            </Card>

            {services.demo && (
              <Note tone="err">
                <DemoTag /> Đây là bản thiết kế. Không có ví thật, không kết nối ngân hàng, không có đồng tiền nào được chuyển.
              </Note>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
