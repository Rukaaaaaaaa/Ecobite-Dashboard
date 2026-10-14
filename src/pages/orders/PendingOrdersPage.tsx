import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Kpi, Note, Segmented } from '@/components/Controls';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { OrdersTable } from '@/features/orders/OrdersTable';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, ORDER_NAV } from '@/components/SubNav';
import { services } from '@/services';
import { timeAgoMinutes } from '@/utils/format';

/** 2.4 — orders waiting for an action from the restaurant. */
export default function PendingOrdersPage() {
  const [scope, setScope] = useState<'pending' | 'all'>('pending');
  const q = useAsync(() => services.orders.list({ actionableOnly: scope === 'pending', pageSize: 50 }), [scope]);
  const items = q.data?.items ?? [];
  const waiting = items.filter((o) => o.status === 'wait');
  const oldest = waiting.length ? Math.max(...waiting.map((o) => timeAgoMinutes(o.placedAt))) : 0;
  const count = (s: string) => items.filter((o) => o.status === s).length;
  const sorted = [...items].sort((a, b) => a.pickupWindow.start.localeCompare(b.pickupWindow.start));
  const oldestOrder = waiting.find((o) => timeAgoMinutes(o.placedAt) === oldest);

  return (
    <Page title="Đơn cần xử lý" sub="Lọc sẵn những đơn đang chờ thao tác từ quán" actions={<Segmented label="Phạm vi" value={scope} onChange={setScope} options={[{ value: 'pending', label: 'Cần xử lý' }, { value: 'all', label: 'Tất cả đơn' }]} />}>
      <SubNav label="Mục con" items={ORDER_NAV} />
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !q.data ? <Loading /> : (
        <>
          <div className="row">
            <Kpi icon="clock" amber label="Chờ xác nhận" value={count('wait')} delta={count('wait') ? `Cũ nhất đã chờ ${oldest} phút` : 'Không có đơn chờ'} />
            <Kpi icon="chk" label="Đã xác nhận, đang soạn" value={count('conf')} delta="Soạn xong rồi bấm “Đã soạn xong”" />
            <Kpi icon="bag" label="Chờ khách tới lấy" value={count('ready')} delta="Quét hoặc nhập mã khi khách tới" />
          </div>
          <Card title="Danh sách chờ thao tác" action={<span className="mu">Sắp theo giờ nhận gần nhất</span>}>
            {sorted.length === 0 ? (
              <EmptyState icon="chk" title="Không có đơn nào cần xử lý">Khi khách đặt túi, đơn sẽ hiện ở đây. <Link to="/orders">Xem toàn bộ đơn hàng</Link></EmptyState>
            ) : (
              <OrdersTable orders={sorted} variant="pending" onChanged={q.reload} />
            )}
          </Card>
          {oldestOrder && oldest >= 5 && (
            <Card tone="warn">
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <p style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                  <b>Đơn #{oldestOrder.id} đã chờ xác nhận {oldest} phút.</b> Khách thấy quán phản hồi chậm thì dễ huỷ. Quy tắc tự huỷ sau bao lâu thì chưa chốt, cần xác nhận nghiệp vụ.
                </p>
              </div>
            </Card>
          )}
          <Note>Xác nhận đơn cho khách biết quán nhận soạn túi. Việc từ chối đơn đã thanh toán và hoàn tiền chưa mở vì chưa có quy tắc nghiệp vụ.</Note>
        </>
      )}
    </Page>
  );
}
