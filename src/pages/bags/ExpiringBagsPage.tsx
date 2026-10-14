import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Kpi, Note, Segmented } from '@/components/Controls';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, BAG_NAV } from '@/components/SubNav';
import { services } from '@/services';
import { bagTiming, durationLabel, expiringBags, totalSeats } from '@/utils/bags';
import { vnd, windowLabel } from '@/utils/format';
import { BagStatusBadge } from '@/components/Badge';

/** 2.5 — bags about to stop selling or almost out of seats. */
export default function ExpiringBagsPage() {
  const [scope, setScope] = useState<'expiring' | 'all'>('expiring');
  const q = useAsync(() => services.bags.list(), []);
  const bags = q.data ?? [];
  const rows = scope === 'expiring' ? expiringBags(bags) : bags.map((bag) => ({ bag, timing: bagTiming(bag) }));
  const exp = expiringBags(bags);
  const low = bags.filter((b) => b.status === 'live' && b.left > 0 && b.left < 3).length;
  const value = exp.reduce((s, { bag }) => s + bag.left * bag.price, 0);

  return (
    <Page title="Sản phẩm sắp hết" sub="Theo dõi sản phẩm sắp hết giờ bán hoặc sắp hết suất" actions={<Segmented label="Phạm vi" value={scope} onChange={setScope} options={[{ value: 'expiring', label: 'Sắp hết' }, { value: 'all', label: 'Tất cả sản phẩm' }]} />}>
      <SubNav label="Mục con" items={BAG_NAV} />
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !q.data ? <Loading /> : (
        <>
          <div className="row">
            <Kpi icon="clock" amber label="Sắp hết giờ bán" value={exp.length} delta={exp[0]?.timing.minutesLeft != null ? `Gần nhất còn ${durationLabel(exp[0].timing.minutesLeft)}` : 'Không có sản phẩm nào'} />
            <Kpi icon="bag" amber label="Còn dưới 3 suất" value={low} delta="Nên bổ sung hoặc hạ giá" />
            <Kpi icon="money" amber label="Giá trị còn tồn" value={vnd(value)} delta="Nếu không bán hết sẽ bỏ đi" />
          </div>
          <Card title="Sản phẩm đang bán" action={<span className="mu">Sắp theo thời gian còn lại</span>}>
            {rows.length === 0 ? (
              <EmptyState icon="bag" title={scope === 'expiring' ? 'Chưa có sản phẩm nào sắp hết' : 'Chưa có sản phẩm'} action={<Link className="bt sm" to="/products/new">Tạo sản phẩm</Link>}>
                {scope === 'expiring' ? 'Sản phẩm đang bán còn nhiều suất và nhiều thời gian sẽ không hiện ở đây.' : 'Tạo sản phẩm đầu tiên để bắt đầu cứu thức ăn dư.'}
              </EmptyState>
            ) : (
              <div className="tbl-wrap">
                <table className="tb">
                  <thead><tr><th>Sản phẩm</th><th>Khung giờ bán</th><th>Còn lại</th><th>Tiến độ bán</th><th>Giá bán</th><th>Thời gian còn</th><th>Trạng thái</th><th /></tr></thead>
                  <tbody>
                    {rows.map(({ bag, timing }) => {
                      const seats = totalSeats(bag) || bag.quantity;
                      const low2 = bag.left <= 2;
                      return (
                        <tr key={bag.id}>
                          <td><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><img className="thb" src={bag.image} alt="" width={34} height={30} /><b>{bag.name}</b></span></td>
                          <td className="num">{timing.window ? windowLabel(timing.window) : '—'}</td>
                          <td><span className={`bg2 ${low2 ? 'tone-r' : 'tone-a'}`}>{bag.left}/{seats} suất</span></td>
                          <td style={{ minWidth: 120 }}><div className="mt" style={{ width: 120 }}><i style={{ width: `${Math.round((1 - bag.left / seats) * 100)}%` }} /></div></td>
                          <td className="num"><b>{vnd(bag.price)}</b></td>
                          <td className="num" style={{ color: low2 ? 'var(--red)' : undefined, fontWeight: 600 }}>{timing.minutesLeft != null ? durationLabel(timing.minutesLeft) : timing.window ? 'chưa tới giờ' : 'ngoài giờ bán'}</td>
                          <td><BagStatusBadge status={bag.status} /></td>
                          <td className="act"><Link className="bt gh sm" to={`/products/${bag.id}/edit`}>Sửa</Link></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Note tone="ok">Sản phẩm còn tồn tới sát giờ đóng cửa là phần dễ bị bỏ đi nhất. Tính năng tự hạ giá hoặc mở rộng bán kính thông báo chưa có quy tắc, mới chỉ là đề xuất.</Note>
        </>
      )}
    </Page>
  );
}
