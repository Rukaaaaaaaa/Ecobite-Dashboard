import { useMemo, useState } from 'react';
import { ORDER_STATUS } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, Chip, Kpi, Note, Pager } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { OrdersTable } from '@/features/orders/OrdersTable';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, ORDER_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { OrderStatus } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { businessDate, vnd } from '@/utils/format';

type Filter = 'all' | Extract<OrderStatus, 'done' | 'cancel' | 'miss' | 'expired'>;
const PAGE = 10;
const daysAgo = (n: number) => businessDate(new Date(Date.now() - n * 86400000));

/** 3.5 — finished orders, used for reconciliation. */
export default function OrderHistoryPage() {
  const toast = useToast();
  const [from, setFrom] = useState(daysAgo(10));
  const [to, setTo] = useState(businessDate());
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const rangeBad = from > to;
  const q = useAsync(() => services.orders.list({ finishedOnly: true, fromDate: from, toDate: to, pageSize: 5000 }), [from, to], services.demo ? 0 : 3000);

  const all = q.data?.items ?? [];
  const rows = useMemo(() => (filter === 'all' ? all : all.filter((o) => o.status === filter)), [all, filter]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE, current * PAGE);
  const revenue = all.filter((o) => o.revenueRecognised).reduce((s, o) => s + o.total, 0);
  const failed = all.filter((o) => o.status !== 'done').length;
  const count = (s: OrderStatus) => all.filter((o) => o.status === s).length;
  const pick = (f: Filter) => { setFilter(f); setPage(1); };

  const exportCsv = () => {
    downloadCsv(`lich-su-don-${from}_${to}.csv`, ['Ngày', 'Mã đơn', 'Khách hàng', 'Túi đồ ăn', 'Số lượng', 'Tổng tiền', 'Kết thúc', 'Ghi nhận doanh thu'],
      rows.map((o) => [o.placedAt.slice(0, 10), o.id, o.customer, o.bagName, o.quantity, o.total, ORDER_STATUS[o.status].label, o.revenueRecognised ? 'Có' : 'Không']));
    toast.success(`Đã xuất ${rows.length} đơn`);
  };

  return (
    <Page
      title="Lịch sử đơn hàng"
      sub="Đơn đã kết thúc, dùng để đối soát"
      actions={
        <>
          <label className="sr-only" htmlFor="h-from">Từ ngày</label>
          <input id="h-from" className="ip" type="date" style={{ width: 150 }} value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <span className="mu">–</span>
          <label className="sr-only" htmlFor="h-to">Đến ngày</label>
          <input id="h-to" className="ip" type="date" style={{ width: 150 }} value={to} min={from} max={businessDate()} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          <Button variant="ghost" onClick={exportCsv} disabled={rows.length === 0}><Icon name="doc" size={16} />Xuất CSV</Button>
        </>
      }
    >
      <SubNav label="Mục con" items={ORDER_NAV} />
      {rangeBad ? (
        <Note tone="warn">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</Note>
      ) : q.error ? (
        <ErrorState message={q.error} onRetry={q.reload} />
      ) : !q.data ? (
        <Loading />
      ) : (
        <>
          <div className="row">
            <Kpi icon="doc" label="Đơn đã kết thúc" value={all.length} delta="trong kỳ đã chọn" />
            <Kpi icon="money" label="Doanh thu ghi nhận" value={vnd(revenue)} delta="đã trừ đơn huỷ" />
            <Kpi icon="warn" amber label="Đơn không thành" value={failed} delta={all.length ? `${Math.round((failed / all.length) * 1000) / 10}% tổng đơn` : '—'} />
          </div>
          <Card>
            <div className="chips" role="group" aria-label="Lọc theo kết thúc">
              <Chip active={filter === 'all'} count={all.length} onClick={() => pick('all')}>Tất cả</Chip>
              <Chip active={filter === 'done'} count={count('done')} onClick={() => pick('done')}>Hoàn thành</Chip>
              <Chip active={filter === 'cancel'} count={count('cancel')} onClick={() => pick('cancel')}>Khách đã huỷ</Chip>
              {services.demo ? <Chip active={filter === 'miss'} count={count('miss')} onClick={() => pick('miss')}>Khách không lấy</Chip> : <Chip active={filter === 'expired'} count={count('expired')} onClick={() => pick('expired')}>Hết hạn thanh toán</Chip>}
            </div>
          </Card>
          <Card>
            {shown.length === 0 ? (
              <EmptyState icon="doc" title="Không có đơn trong kỳ này">Thử mở rộng khoảng ngày hoặc đổi bộ lọc.</EmptyState>
            ) : (
              <>
                <OrdersTable orders={shown} variant="history" />
                <Pager page={current} pages={pages} total={rows.length} shown={shown.length} onPage={setPage} />
              </>
            )}
          </Card>
          <Note>{services.demo ? 'Đơn khách không tới lấy vẫn ghi nhận doanh thu vì khách đã trả tiền. Cách xử lý phần thức ăn còn lại cần quy tắc riêng, chưa chốt.' : 'Doanh thu ghi nhận từ trạng thái thanh toán trên máy chủ. Đơn tiền mặt chỉ được đánh dấu đã thanh toán sau khi khách xác nhận nhận túi.'}</Note>
        </>
      )}
    </Page>
  );
}
