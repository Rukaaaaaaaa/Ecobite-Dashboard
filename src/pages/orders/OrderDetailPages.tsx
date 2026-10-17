import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ORDER_STATUS, OrderStatusBadge } from '@/components/Badge';
import { Button, LinkButton } from '@/components/Button';
import { Card, Note } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { Icon, type IconName } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { errorMessage, useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import type { Order } from '@/types';
import { PRODUCT_KIND_LABEL } from '@/utils/bags';
import { businessTime, shortDate, vnd, windowLabel } from '@/utils/format';

const Row = ({ k, children }: { k: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 12, fontSize: 12.5, padding: '4px 0' }}>
    <span className="mu" style={{ flex: '0 0 118px' }}>{k}</span>
    <b style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{children}</b>
  </div>
);

const stamp = (iso: string | null) => (iso ? `${businessTime(iso)} · ${shortDate(iso)}` : '—');

function useOrder() {
  const { id = '' } = useParams();
  return { id, ...useAsync(() => services.orders.get(id), [id], services.demo ? 0 : 3000) };
}

/** 3.2 */
export function OrderDetailPage() {
  const { id, data: o, error, reload } = useOrder();
  return (
    <Page title={`Đơn #${o?.orderCode ?? id}`} sub={o ? `${o.customer} · đặt lúc ${stamp(o.placedAt)}` : undefined} actions={<LinkButton variant="ghost" to="/orders"><Icon name="back" size={16} />Về danh sách</LinkButton>}>
      {error ? <ErrorState message={error} onRetry={reload} /> : !o ? <Loading /> : <Detail o={o} />}
    </Page>
  );
}

function Detail({ o }: { o: Order }) {
  const steps: [string, string | null][] = [
    ['Khách đặt', o.placedAt],
    ['Quán xác nhận', o.confirmedAt],
    ['Soạn xong', o.readyAt],
    ['Khách lấy', o.deliveredAt],
  ];
  const closed = o.status === 'cancel' || o.status === 'miss';
  return (
    <>
      <div className="row">
        <Card title="Nội dung đơn" action={<OrderStatusBadge status={o.status} />} grow="999 1 400px">
          {o.items && <div className="stack" style={{ marginBottom: 14 }}>{o.items.map((item, index) => <Row key={`${item.foodBagId}-${index}`} k={`${item.quantity} × ${item.name}`}><span>{vnd(item.unitPrice)} / suất{item.ownBox ? ' · khách mang hộp' : ''}</span></Row>)}</div>}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 13, borderBottom: '1px solid var(--ln)' }}>
            <img className="thb" src={o.image} alt="" width={64} height={54} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: 14 }}>{o.bagName}</b>
              <span className="mu">{PRODUCT_KIND_LABEL[o.productKind]} · {o.quantity} suất{o.items && o.items.length > 1 ? '' : ` · ${vnd(o.unitPrice)}/suất`}</span>
            </span>
            <b className="num">{vnd(o.total)}</b>
          </div>
          <div className="flex-between" style={{ paddingTop: 13, alignItems: 'baseline' }}>
            <b style={{ fontSize: 13.5 }}>{o.paymentMethod === 'cash' ? (o.paymentStatus === 'success' ? 'Tiền mặt · đã thu' : 'Tiền mặt · cần thu tại quán') : o.paymentStatus && o.paymentStatus !== 'success' ? 'Chờ thanh toán' : 'Khách đã thanh toán'}</b>
            <b className="num" style={{ fontSize: 19, color: 'var(--g7)' }}>{vnd(o.total)}</b>
          </div>
          {o.money && <div style={{ marginTop: 12 }}><Row k="Tiền sản phẩm">{vnd(o.money.subtotal)}</Row><Row k="Giảm mã ưu đãi">−{vnd(o.money.promoDiscount)}</Row><Row k="Mang hộp riêng">−{vnd(o.money.ownBoxDiscount)}</Row></div>}
          <div style={{ marginTop: 12 }}><Note>{services.demo ? 'Thanh toán qua ứng dụng EcoBite. Tiền về tài khoản quán theo kỳ đối soát.' : o.paymentMethod === 'cash' ? 'Thu tiền mặt khi giao túi. Khách xác nhận nhận đủ túi trên ứng dụng để hoàn tất đơn.' : 'Trạng thái thanh toán được cập nhật từ máy chủ EcoBite.'}</Note></div>
        </Card>
        <Card title="Khách hàng" grow="1 1 280px">
          <Row k="Họ tên">{o.customer}</Row>
          <Row k="Số điện thoại"><span className="num">{o.phoneMasked}</span></Row>
          <Row k="Giờ nhận"><span className="num">{windowLabel(o.pickupWindow)}</span></Row>
          <Row k="Mã nhận hàng"><span className="num">{services.demo ? (o.status === 'done' ? o.pickupCode : 'ECO-••••') : 'Khách cung cấp khi nhận túi'}</span></Row>
          {services.demo && <Row k="Số đơn đã mua"><span className="num">{o.customerOrderCount} đơn</span></Row>}
          <div style={{ marginTop: 12 }}><Note tone="ok">Số điện thoại được che bớt. Khách đưa mã nhận hàng bảo mật trên ứng dụng khi tới lấy.</Note></div>
        </Card>
      </div>
      <Card title="Tiến trình">
        <div className="stp" role="list">
          {steps.map(([label, at], i) => (
            <span key={label} style={{ display: 'contents' }}>
              <span role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 9, flex: '0 0 auto' }}>
                <span className={`n ${at ? 'on' : ''}`}>{at ? <Icon name="chk" size={12} /> : i + 1}</span>
                <span><b style={{ display: 'block', fontSize: 12.5 }}>{label}</b><span className="mu num">{at ? stamp(at) : '—'}</span></span>
              </span>
              {i < steps.length - 1 && <span className={`l ${steps[i + 1][1] ? 'on' : ''}`} />}
            </span>
          ))}
        </div>
        {closed && <div style={{ marginTop: 12 }}><Note tone="warn">{o.status === 'cancel' ? 'Khách đã huỷ đơn này.' : 'Khách không tới lấy túi. Đơn vẫn ghi nhận doanh thu vì khách đã trả tiền.'}</Note></div>}
        {(o.status === 'wait' || o.status === 'conf' || o.status === 'ready') && (
          <div style={{ marginTop: 14 }}><LinkButton to={`/orders/${o.id}/process`}>Xử lý đơn này</LinkButton></div>
        )}
      </Card>
    </>
  );
}

interface Option { key: string; icon: IconName; title: string; desc: string; enabled: boolean; label: string; action?: 'advance' | 'verify' }

/** 3.3 — only actions that already have a backend rule are open. */
export function OrderProcessPage() {
  const { id, data, error, reload, setData } = useOrder();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const o = data;

  const advance = async () => {
    setBusy(true);
    try {
      const next = await services.orders.advance(id, o?.backendStatus);
      setData(next);
      toast.success(next.status === 'conf' ? 'Đã xác nhận đơn. Khách được báo.' : 'Đã soạn xong. Chờ khách tới lấy.');
    } catch (e) {
      toast.error(errorMessage(e));
      reload();
    } finally {
      setBusy(false);
    }
  };

  const options: Option[] = o ? [
    { key: 'confirm', icon: 'chk', title: 'Xác nhận đơn', desc: 'Quán nhận soạn túi này. Khách được báo ngay.', enabled: o.status === 'wait', label: 'Chọn', action: 'advance' },
    { key: 'ready', icon: 'bag', title: 'Đánh dấu đã soạn xong', desc: 'Chuyển sang chờ khách tới lấy. Làm sau khi đã xác nhận.', enabled: o.status === 'conf', label: 'Chọn', action: 'advance' },
    { key: 'verify', icon: 'qr', title: 'Giao túi cho khách', desc: 'Khi khách tới, nhập hoặc quét mã nhận hàng để xác minh.', enabled: o.status === 'ready', label: 'Xác minh mã', action: 'verify' },
  ] : [];

  return (
    <Page title={`Xử lý đơn #${id}`} sub={o ? `${o.customer} · ${o.status === 'wait' ? 'chờ xác nhận' : 'cập nhật trạng thái'}` : undefined} actions={<LinkButton variant="ghost" to="/orders"><Icon name="back" size={16} />Về danh sách</LinkButton>}>
      {error ? <ErrorState message={error} onRetry={reload} /> : !o ? <Loading /> : (
        <div className="row">
          <Card title="Chọn trạng thái tiếp theo" action={<OrderStatusBadge status={o.status} />} grow="999 1 400px">
            <div className="stack" style={{ gap: 9 }}>
              {options.map((opt) => (
                <div key={opt.key} className={`pick-opt ${opt.enabled ? 'on' : ''}`}>
                  <span className="ic"><Icon name={opt.icon} size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 13 }}>{opt.title}</b><span className="mu">{opt.desc}</span></span>
                  {opt.action === 'verify' ? (
                    <LinkButton small variant={opt.enabled ? 'primary' : 'ghost'} to="/orders/verify" aria-disabled={!opt.enabled} tabIndex={opt.enabled ? 0 : -1} onClick={(e) => !opt.enabled && e.preventDefault()}>{opt.label}</LinkButton>
                  ) : (
                    <Button small variant={opt.enabled ? 'primary' : 'ghost'} disabled={!opt.enabled} loading={busy && opt.enabled} onClick={() => void advance()}>{opt.label}</Button>
                  )}
                </div>
              ))}
              <div className="pick-opt off">
                <span className="ic"><Icon name="warn" size={15} /></span>
                <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 13, color: 'var(--ink2)' }}>Từ chối đơn, hoàn tiền cho khách</b><span className="mu">Chưa mở. Cần quy tắc nghiệp vụ về hoàn tiền đơn đã thanh toán.</span></span>
                <span className="bg2 tone-x">Chờ xác nhận quy tắc</span>
              </div>
            </div>
            <div style={{ marginTop: 13 }}>
              <Note tone="warn">Quán chưa thể từ chối đơn trên hệ thống. Kiểm tra hình thức thanh toán trước khi giao túi.</Note>
            </div>
            {!options.some((x) => x.enabled) && (
              <div style={{ marginTop: 10 }}><Note>{o.status === 'verified' ? 'Đã xác minh mã. Chờ khách xác nhận đã nhận đủ túi trên ứng dụng.' : `Đơn ở trạng thái “${ORDER_STATUS[o.status].label}” không có thao tác từ quán.`} <Link to={`/orders/${o.id}`}>Xem chi tiết đơn</Link></Note></div>
            )}
          </Card>
          <Card title="Thông tin đơn" grow="1 1 270px">
            <div style={{ display: 'flex', gap: 11, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--ln)' }}>
              <img className="thb" src={o.image} alt="" width={52} height={46} />
              <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 13 }}>{o.bagName}</b><span className="mu">{o.quantity} suất · {vnd(o.total)}</span></span>
            </div>
            <div style={{ marginTop: 12 }}>
              <Row k="Khách">{o.customer}</Row>
              <Row k="Giờ nhận"><span className="num">{windowLabel(o.pickupWindow)}</span></Row>
              <Row k="Đặt lúc"><span className="num">{businessTime(o.placedAt)}</span></Row>
              <Row k="Thanh toán">{o.paymentMethod === 'cash' ? 'Tiền mặt tại quán' : o.paymentStatus && o.paymentStatus !== 'success' ? 'Chưa thanh toán' : 'Đã trả qua ứng dụng'}</Row>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
