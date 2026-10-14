import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatusBadge, ProductKindBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Feedback';
import { errorMessage } from '@/hooks/useAsync';
import { services } from '@/services';
import type { Order } from '@/types';
import { businessTime, vnd, windowLabel } from '@/utils/format';

export type OrdersTableVariant = 'recent' | 'list' | 'pending' | 'history';

const ADVANCE_LABEL: Partial<Record<Order['status'], string>> = { wait: 'Xác nhận', conf: 'Đã soạn xong' };

/** One table, four column sets (overview "recent", full list, pending queue, history). */
export function OrdersTable({ orders, variant, onChanged }: { orders: Order[]; variant: OrdersTableVariant; onChanged?: () => void }) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const advance = async (o: Order) => {
    setBusyId(o.id);
    const wasWaiting = o.status === 'wait';
    try {
      await services.orders.advance(o.id);
      toast.success(wasWaiting ? `Đã xác nhận đơn #${o.id}` : `Đơn #${o.id} đã soạn xong, chờ khách tới lấy`);
      onChanged?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const bagCell = (o: Order) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img className="thb" src={o.image} alt="" width={30} height={26} />
      {o.bagName}
      <ProductKindBadge kind={o.productKind} />
    </span>
  );
  const view = (o: Order) => (
    <Link to={`/orders/${o.id}`} className="bt gh sm" aria-label={`Xem đơn ${o.id}`}>
      Xem
    </Link>
  );

  return (
    <div className="tbl-wrap">
      <table className="tb">
        <thead>
          {variant === 'recent' && <tr><th>Mã đơn</th><th>Khách hàng</th><th>Số lượng</th><th>Tổng tiền</th><th>Đặt lúc</th><th>Giờ nhận</th><th>Trạng thái</th><th /></tr>}
          {variant === 'list' && <tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>SL</th><th>Tổng tiền</th><th>Đặt lúc</th><th>Giờ nhận</th><th>Trạng thái</th><th /></tr>}
          {variant === 'pending' && <tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>SL</th><th>Tổng tiền</th><th>Giờ nhận</th><th>Trạng thái</th><th /></tr>}
          {variant === 'history' && <tr><th>Ngày</th><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>SL</th><th>Tổng tiền</th><th>Kết thúc</th><th>Ghi nhận doanh thu</th><th /></tr>}
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              {variant === 'history' && <td className="num">{o.placedAt.slice(8, 10)}/{o.placedAt.slice(5, 7)}</td>}
              <td className="num">#{o.id}</td>
              <td>{o.customer}</td>
              {variant === 'recent' ? <td className="num">{o.quantity}</td> : <><td>{bagCell(o)}</td><td className="num">{o.quantity}</td></>}
              <td className="num">{variant === 'recent' ? vnd(o.total) : <b>{vnd(o.total)}</b>}</td>
              {(variant === 'recent' || variant === 'list') && <td className="num">{businessTime(o.placedAt)}</td>}
              {variant !== 'history' && <td className="num">{windowLabel(o.pickupWindow).replace(' – ', ' - ')}</td>}
              <td><OrderStatusBadge status={o.status} /></td>
              {variant === 'history' && (
                <td>
                  <span className={`bg2 ${o.revenueRecognised ? 'tone-g' : 'tone-x'}`}>{o.revenueRecognised ? 'Có' : 'Không'}</span>
                </td>
              )}
              <td className="act">
                {variant === 'pending' && ADVANCE_LABEL[o.status] ? (
                  <Button small variant={o.status === 'wait' ? 'primary' : 'ghost'} loading={busyId === o.id} onClick={() => void advance(o)}>
                    {ADVANCE_LABEL[o.status]}
                  </Button>
                ) : (
                  view(o)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
