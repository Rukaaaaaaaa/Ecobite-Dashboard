import { useMemo, useState } from 'react';
import { Button, LinkButton } from '@/components/Button';
import { Card, Chip, Kpi, Note } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { SubNav, WALLET_NAV } from '@/components/SubNav';
import { RulePending } from '@/features/wallet/RulePending';
import { TxnTable, txnTime } from '@/features/wallet/TxnTable';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import type { WalletTxn } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { vnd } from '@/utils/format';
import { feeOf, netOf, PLATFORM_FEE_LABEL, WALLET_STATUS } from '@/utils/wallet';

type Filter = 'all' | 'in' | 'out' | 'hold' | 'fail';

const FILTERS: { value: Filter; label: string; match: (t: WalletTxn) => boolean }[] = [
  { value: 'all', label: 'Tất cả', match: () => true },
  { value: 'in', label: 'Tiền vào', match: (t) => t.kind === 'in' },
  { value: 'out', label: 'Rút ra', match: (t) => t.kind === 'out' },
  { value: 'hold', label: 'Đang chờ', match: (t) => t.status === 'hold' || t.status === 'outp' },
  { value: 'fail', label: 'Không thành công', match: (t) => t.status === 'fail' },
];

/** 6.2 */
export default function WalletHistoryPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const summary = useAsync(() => services.wallet.summary(), []);
  const txns = useAsync(() => services.wallet.transactions(), []);

  const all = txns.data ?? [];
  const rows = useMemo(() => all.filter(FILTERS.find((f) => f.value === filter)!.match), [all, filter]);
  const p = summary.data?.period;
  const failedCode = all.find((t) => t.status === 'fail')?.code;

  const exportCsv = () => {
    downloadCsv(
      'lich-su-vi.csv',
      ['Thời gian', 'Nội dung', 'Mã', 'Trừ khỏi ví', `Chiết khấu ${PLATFORM_FEE_LABEL}`, 'Về ngân hàng', 'Trạng thái'],
      rows.map((t) => {
        const out = t.kind === 'out';
        return [txnTime(t.at), t.title, t.code, `${out ? '-' : '+'}${t.amount}`, out ? -feeOf(t.amount) : 0, out ? netOf(t.amount) : 0, WALLET_STATUS[t.status].label];
      }),
    );
    toast.success(`Đã xuất ${rows.length} dòng`);
  };

  return (
    <Page
      title="Lịch sử giao dịch"
      sub="Tiền vào, tiền rút và trạng thái từng dòng"
      actions={
        <>
          <span className="ip" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon name="clock" size={15} />{p ? `${p.from} – ${p.to}` : '…'}
          </span>
          <Button variant="ghost" onClick={exportCsv} disabled={rows.length === 0}><Icon name="doc" size={16} />Xuất CSV</Button>
          <LinkButton variant="ghost" to="/wallet"><Icon name="back" size={16} />Về ví</LinkButton>
        </>
      }
    >
      <SubNav label="Mục con" items={WALLET_NAV} />
      {txns.error || summary.error ? (
        <ErrorState message={(txns.error ?? summary.error)!} onRetry={() => { txns.reload(); summary.reload(); }} />
      ) : !txns.data || !p ? (
        <Loading />
      ) : (
        <>
          <div className="row">
            <Kpi icon="dn" label="Tiền vào trong kỳ" value={vnd(p.moneyIn)} delta="từ đơn đã hoàn thành" />
            <Kpi icon="out" label="Đã rút trong kỳ" value={vnd(p.moneyOut)} delta={`${p.withdrawals} lệnh thành công`} />
            <Kpi icon="money" amber label="Chiết khấu đã trừ" value={vnd(p.fee)} delta={`${PLATFORM_FEE_LABEL} của số đã rút`} />
            <Kpi icon="clock" amber label="Chờ đơn kết thúc" value={vnd(summary.data!.holding)} delta="đơn chưa tới giờ nhận" />
          </div>
          <Card>
            <div className="chips" role="group" aria-label="Lọc giao dịch">
              {FILTERS.map((f) => (
                <Chip key={f.value} active={filter === f.value} count={all.filter(f.match).length} onClick={() => setFilter(f.value)}>{f.label}</Chip>
              ))}
              <span className="mu" style={{ marginLeft: 'auto', alignSelf: 'center' }}>Sắp theo: mới nhất</span>
            </div>
          </Card>
          <Card>
            {rows.length === 0 ? (
              <EmptyState icon="wallet" title="Không có giao dịch">{all.length === 0 ? 'Ví chưa có giao dịch nào.' : 'Thử đổi bộ lọc.'}</EmptyState>
            ) : (
              <TxnTable rows={rows} withFee />
            )}
          </Card>
          <Note>
            Lệnh rút trừ khỏi ví trọn số tiền, chiết khấu {PLATFORM_FEE_LABEL} giữ lại, phần còn lại mới về ngân hàng.
            {failedCode && <> Riêng lệnh không thành công {failedCode}: chưa chốt tiền và chiết khấu có quay lại ví hay không, nên bảng để nguyên số, không tự diễn giải. </>}
            <RulePending />
          </Note>
          <Note tone="warn">Số liệu trong kỳ là dữ liệu mẫu cố định, không tính từ danh sách bên trên.</Note>
        </>
      )}
    </Page>
  );
}
