import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ORDER_STATUS, ORDER_STATUS_ORDER } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, Chip, Pager } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { OrdersTable } from '@/features/orders/OrdersTable';
import { errorMessage, useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, ORDER_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { OrderStatus } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { businessDate, businessTime } from '@/utils/format';

const isStatus = (s: string | null): s is OrderStatus => !!s && s in ORDER_STATUS;

/** 3.1 — filter state lives in the URL so a refresh or a shared link keeps it. */
export default function OrdersListPage() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const status = isStatus(params.get('status')) ? (params.get('status') as OrderStatus) : 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const [exporting, setExporting] = useState(false);

  const update = (patch: Record<string, string | null>) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k));
      return n;
    }, { replace: true });

  useEffect(() => {
    const t = setTimeout(() => text !== q && update({ q: text.trim() || null, page: null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const list = useAsync(() => services.orders.list({ search: q, status, page, pageSize: 8 }), [q, status, page]);
  const d = list.data;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await services.orders.list({ search: q, status, pageSize: 5000 });
      downloadCsv(`don-hang-${businessDate()}.csv`, ['Mã đơn', 'Khách hàng', 'Túi đồ ăn', 'Số lượng', 'Tổng tiền', 'Đặt lúc', 'Giờ nhận', 'Trạng thái'],
        all.items.map((o) => [o.id, o.customer, o.bagName, o.quantity, o.total, `${o.placedAt.slice(0, 10)} ${businessTime(o.placedAt)}`, `${o.pickupWindow.start}-${o.pickupWindow.end}`, ORDER_STATUS[o.status].label]));
      toast.success(`Đã xuất ${all.items.length} đơn`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Page
      title="Đơn hàng"
      sub="Toàn bộ đơn của nhà hàng"
      actions={
        <>
          <div className="ip-wrap" style={{ width: 230 }}>
            <span className="lead"><Icon name="srch" size={15} /></span>
            <input className="ip" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tìm mã đơn, tên khách…" aria-label="Tìm đơn hàng" />
          </div>
          <Button variant="ghost" loading={exporting} onClick={() => void exportCsv()}><Icon name="doc" size={16} />Xuất CSV</Button>
        </>
      }
    >
      <SubNav label="Mục con" items={ORDER_NAV} />
      <Card>
        <div className="chips" role="group" aria-label="Lọc theo trạng thái">
          <Chip active={status === 'all'} count={d?.counts.all} onClick={() => update({ status: null, page: null })}>Tất cả</Chip>
          {ORDER_STATUS_ORDER.map((s) => (
            <Chip key={s} active={status === s} count={d?.counts[s]} onClick={() => update({ status: s, page: null })}>{ORDER_STATUS[s].label}</Chip>
          ))}
        </div>
      </Card>
      <Card>
        {list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !d ? (
          <Loading label="Đang tải đơn hàng…" />
        ) : d.items.length === 0 ? (
          <EmptyState icon="doc" title={q || status !== 'all' ? 'Không có đơn phù hợp' : 'Chưa có đơn hàng'} action={q || status !== 'all' ? <Button small variant="ghost" onClick={() => { setText(''); update({ q: null, status: null, page: null }); }}>Xoá bộ lọc</Button> : undefined}>
            {q || status !== 'all' ? 'Thử đổi từ khoá hoặc bỏ lọc trạng thái.' : 'Khi khách đặt sản phẩm của bạn, đơn sẽ hiện ở đây.'}
          </EmptyState>
        ) : (
          <>
            <OrdersTable orders={d.items} variant="list" />
            <Pager page={d.page} pages={Math.max(1, Math.ceil(d.total / d.pageSize))} total={d.total} shown={d.items.length} onPage={(p) => update({ page: String(p) })} />
          </>
        )}
      </Card>
    </Page>
  );
}
