import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Controls';
import { useToast } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { errorMessage, useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, ORDER_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { Order } from '@/types';
import { businessTime, windowLabel } from '@/utils/format';

/** 3.4 — manual code entry. Camera scanning is not built (see README). */
export default function VerifyPickupPage() {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [found, setFound] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);
  const recent = useAsync(() => services.orders.recentDeliveries(), []);

  const check = async (e: FormEvent) => {
    e.preventDefault();
    setFound(null);
    setError(null);
    setChecking(true);
    try {
      setFound(await services.orders.lookupPickupCode(code));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const deliver = async () => {
    if (!found) return;
    setDelivering(true);
    try {
      await services.orders.completePickup(found.id);
      toast.success(`Đã giao túi cho ${found.customer}`);
      setFound(null);
      setCode('');
      recent.reload();
    } catch (err) {
      setError(errorMessage(err));
      setFound(null);
    } finally {
      setDelivering(false);
    }
  };

  return (
    <Page title="Xác minh mã nhận hàng" sub="Khách đưa mã, quán nhập mã để giao đúng đơn">
      <SubNav label="Mục con" items={ORDER_NAV} />
      <div className="row">
        <Card title="Mã của khách" grow="1 1 300px" style={{ textAlign: 'center' }}>
          <div aria-hidden="true" style={{ width: 190, height: 190, margin: '4px auto 14px', border: '2px dashed var(--ln2)', borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--soft)', color: 'var(--ink3)' }}>
            <Icon name="qr" size={74} />
          </div>
          <p className="mu" style={{ margin: '0 0 13px' }}>Quét bằng camera chưa được hỗ trợ. Hãy nhập mã hiển thị trên điện thoại của khách.</p>
          <form onSubmit={check} noValidate>
            <input className="ip" value={code} onChange={(e) => { setCode(e.target.value); setError(null); setFound(null); }} placeholder="ECO-XXXX" aria-label="Mã nhận hàng" autoComplete="off" autoCapitalize="characters" spellCheck={false} style={{ textAlign: 'center', fontWeight: 700, letterSpacing: '.1em' }} />
            <div style={{ marginTop: 10 }}><Button type="submit" block loading={checking} disabled={!code.trim()}>Kiểm tra mã</Button></div>
          </form>
        </Card>

        <div style={{ flex: '999 1 380px', minWidth: 0 }} className="stack">
          {found && (
            <section className="cd pd" style={{ borderColor: 'var(--ok-ln)', background: 'var(--g05)' }} role="status">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--g7)', color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="chk" size={22} /></span>
                <span style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 14.5, color: 'var(--g9)' }}>Mã hợp lệ · đơn #{found.id}</b>
                  <span className="mu">{found.customer} · {found.bagName} · {found.quantity} suất · giờ nhận {windowLabel(found.pickupWindow)}</span>
                </span>
                <Button loading={delivering} onClick={() => void deliver()}>Giao túi cho khách</Button>
              </div>
            </section>
          )}
          {error && (
            <section className="cd pd" style={{ borderColor: 'var(--red-ln)', background: 'var(--red-bg)' }} role="alert">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="warn" size={21} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 14.5, color: 'var(--red)' }}>Mã không dùng được</b>
                  <span className="mu">{error}</span>
                </span>
              </div>
            </section>
          )}
          <Card title="Đã giao gần đây">
            {recent.error ? <ErrorState message={recent.error} onRetry={recent.reload} /> : !recent.data ? <Loading /> : recent.data.length === 0 ? (
              <EmptyState icon="bag" title="Chưa giao túi nào">Các lượt giao sẽ hiện ở đây. <Link to="/orders/pending">Xem đơn cần xử lý</Link></EmptyState>
            ) : (
              <div className="tbl-wrap">
                <table className="tb">
                  <thead><tr><th>Giờ giao</th><th>Mã đơn</th><th>Khách hàng</th><th>Túi</th><th>Người giao</th></tr></thead>
                  <tbody>
                    {recent.data.map((o) => (
                      <tr key={o.id}>
                        <td className="num">{o.deliveredAt ? businessTime(o.deliveredAt) : '—'}</td>
                        <td className="num">#{o.id}</td><td>{o.customer}</td><td>{o.bagName}</td><td>{o.deliveredBy ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
