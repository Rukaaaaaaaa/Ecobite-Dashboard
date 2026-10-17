import { LinkButton } from '@/components/Button';
import { Card, Kpi, Note } from '@/components/Controls';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { OrdersTable } from '@/features/orders/OrdersTable';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';

export default function LiveOverviewPage() {
  const list = useAsync(() => services.orders.list({ pageSize: 8 }), [], 3000);
  const d = list.data;
  return (
    <Page title="Tổng quan nhà hàng" sub="Đơn hàng từ ứng dụng EcoBite · tự cập nhật mỗi 3 giây"
      actions={<LinkButton to="/orders/pending">Xử lý đơn hàng</LinkButton>}>
      <Note>Quán xác nhận đơn, soạn túi và xác minh mã nhận hàng bảo mật. Sau khi nhận túi, khách xác nhận trên ứng dụng để hoàn tất đơn. Đơn tiền mặt cần thu tiền tại quán.</Note>
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : !d ? <Loading /> : <>
        <div className="row">
          <Kpi icon="clock" label="Chờ xác nhận" value={d.counts.wait} />
          <Kpi icon="bag" label="Đang soạn" value={d.counts.conf} />
          <Kpi icon="doc" label="Chờ khách lấy" value={d.counts.ready} />
          <Kpi icon="chk" label="Hoàn thành" value={d.counts.done} />
        </div>
        <Card title="Đơn hàng gần đây">
          {d.items.length ? <OrdersTable orders={d.items} variant="recent" onChanged={list.reload} /> :
            <EmptyState icon="doc" title="Chưa có đơn hàng">Đơn khách đặt tại nhà hàng của bạn sẽ tự xuất hiện ở đây.</EmptyState>}
        </Card>
      </>}
    </Page>
  );
}
