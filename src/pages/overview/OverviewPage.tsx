import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Donut } from '@/components/charts';
import { LinkButton } from '@/components/Button';
import { Card, Kpi, Segmented } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { DemoTag, EmptyState, ErrorState, Loading } from '@/components/States';
import { OrdersTable } from '@/features/orders/OrdersTable';
import { useAccount } from '@/features/auth/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, OVERVIEW_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { StatsRange } from '@/types';
import { durationLabel, expiringBags } from '@/utils/bags';
import { longDate, million, vnd } from '@/utils/format';
import { maskAccount, netOf, PLATFORM_FEE_LABEL } from '@/utils/wallet';

const RANGES: { value: StatsRange; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
];
const RANGE_TEXT: Record<StatsRange, string> = { today: 'hôm qua', '7d': '7 ngày trước', '30d': '30 ngày trước' };

export default function OverviewPage() {
  return <DashboardOverviewPage />;
}

function DashboardOverviewPage() {
  const account = useAccount();
  const [range, setRange] = useState<StatsRange>('today');
  const stats = useAsync(() => services.stats.overview(range), [range], services.demo ? undefined : 3000);
  const orders = useAsync(() => services.orders.list({ page: 1, pageSize: 5 }), [], services.demo ? undefined : 3000);
  const bags = useAsync(() => services.bags.list(), []);
  const profile = useAsync(() => services.profile.get(), []);
  const wallet = useAsync(() => services.wallet.summary(), []);

  const expiring = bags.data ? expiringBags(bags.data) : [];
  const s = stats.data;
  const delta = (d: number | null) => (d === null ? undefined : `${Math.abs(d)}%`);

  return (
    <Page
      title="Tổng quan"
      sub={`${profile.data?.name || 'Nhà hàng của bạn'} · hôm nay, ${longDate()}`}
      actions={<Segmented label="Khoảng thời gian" value={range} options={RANGES} onChange={setRange} />}
    >
      <SubNav label="Mục con" items={OVERVIEW_NAV} />
      <div className="row" style={{ alignItems: 'stretch' }}>
        <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderRadius: 13, overflow: 'hidden', background: 'linear-gradient(100deg,#E7F4EA 0%,#DCF0E2 55%,#CFE9D8 100%)', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, minHeight: 118, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <h2 style={{ fontSize: 22, color: 'var(--g9)', marginBottom: 5 }}>Xin chào, {account.fullName}!</h2>
              <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 8 }}>Cùng EcoBite lan tỏa giá trị bền vững và mang đến những bữa ăn ngon.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink2)' }}>
                <Icon name="pin" size={14} />
                {profile.data?.name || 'Chưa đặt tên nhà hàng'}
              </span>
            </div>
            <img src="/images/hero.jpg" alt="Món ăn của quán" style={{ width: 272, maxWidth: '100%', height: 'auto', borderRadius: 11, objectFit: 'cover' }} />
          </div>

          {stats.error ? (
            <ErrorState message={stats.error} onRetry={stats.reload} />
          ) : !s ? (
            <Loading label="Đang tải số liệu…" />
          ) : (
            <>
              <div className="row" style={{ gap: 12 }}>
                <Kpi icon="money" label="Doanh thu" value={vnd(s.revenue.value)} delta={delta(s.revenue.deltaPct)} deltaSuffix={s.revenue.deltaPct === null ? undefined : ` so với ${RANGE_TEXT[range]}`} />
                <Kpi icon="doc" label="Đơn hàng" value={s.orders.value.toLocaleString('vi-VN')} delta={delta(s.orders.deltaPct)} deltaSuffix={s.orders.deltaPct === null ? undefined : ` so với ${RANGE_TEXT[range]}`} />
                <Kpi icon="bag" label="Sản phẩm đã bán" value={s.bagsSold.value.toLocaleString('vi-VN')} delta={delta(s.bagsSold.deltaPct)} deltaSuffix={s.bagsSold.deltaPct === null ? undefined : ` so với ${RANGE_TEXT[range]}`} />
                <Kpi icon="clock" label="Sắp hết giờ bán" amber value={bags.data ? expiring.length : '…'} delta={expiring.length ? 'Cần kiểm tra sớm' : 'Chưa có sản phẩm nào'} />
              </div>
              <div className="row">
                <Card title={range === 'today' ? 'Doanh thu theo giờ' : 'Doanh thu theo ngày'} icon="money" grow="999 1 330px" action={<DemoTag />}>
                  <div>
                    <BarChart data={s.series} labelEvery={range === 'today' ? 3 : range === '30d' ? 5 : 1} highlight={s.series.length ? Math.max(...s.series.map((p) => p.value)) * 0.7 : undefined} ariaLabel="Biểu đồ doanh thu" />
                    <p className="mu" style={{ marginTop: 6 }}>Đơn vị triệu đồng ({million(1)} = 1.000.000đ).</p>
                  </div>
                </Card>
                <Card title="Tỷ lệ trạng thái đơn hàng" grow="1 1 236px" action={<DemoTag />}>
                  <Donut rows={s.statusShare} total={s.statusTotal} unit="đơn hàng" />
                </Card>
              </div>
            </>
          )}

          <Card
            title="Đơn hàng gần đây"
            icon="doc"
            action={<Link to="/orders" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Xem tất cả <Icon name="chev" size={13} /></Link>}
          >
            {orders.error ? (
              <ErrorState message={orders.error} onRetry={orders.reload} />
            ) : !orders.data ? (
              <Loading />
            ) : orders.data.items.length === 0 ? (
              <EmptyState icon="doc" title="Chưa có đơn hàng">Đơn của khách sẽ hiện ở đây ngay khi có người đặt sản phẩm của bạn.</EmptyState>
            ) : (
              <OrdersTable orders={orders.data.items} variant="recent" onChanged={orders.reload} />
            )}
          </Card>
        </div>

        <div style={{ flex: '1 1 262px', maxWidth: 290, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card title="Tạo nhanh" icon="leaf" tone="ok">
            <div className="stack" style={{ gap: 9 }}>
              <LinkButton block to="/products/new"><Icon name="plus" size={16} />Tạo sản phẩm</LinkButton>
              <LinkButton block variant="ghost" to="/orders"><Icon name="doc" size={16} />Xem đơn hàng</LinkButton>
            </div>
          </Card>

          <Card title="Ví của quán" icon="wallet" action={<Link to="/wallet" style={{ fontSize: 11.5 }}>Mở ví</Link>}>
            {wallet.error ? (
              <ErrorState message={wallet.error} onRetry={wallet.reload} />
            ) : !wallet.data ? (
              <Loading />
            ) : (
              <>
                <span className="mu">Số dư khả dụng</span>
                <b className="num" style={{ display: 'block', fontSize: 24, color: 'var(--g9)', lineHeight: 1.2, marginTop: 2 }}>{vnd(wallet.data.available)}</b>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '7px 0 12px', fontSize: 11.5, color: 'var(--amb)', fontWeight: 600 }}>
                  <Icon name="clock" size={13} />{vnd(wallet.data.holding)} chờ đơn kết thúc
                </div>
                <LinkButton block to="/wallet/withdraw"><Icon name="out" size={16} />Rút tiền</LinkButton>
                <p className="mu" style={{ margin: '9px 0 0', fontSize: 11.5 }}>
                  {wallet.data.bank
                    ? `Rút bị trừ ${PLATFORM_FEE_LABEL} chiết khấu. Rút hết thì ${wallet.data.bank.bankName} ${maskAccount(wallet.data.bank.accountNumber)} nhận ${vnd(netOf(wallet.data.available))}.`
                    : `Rút bị trừ ${PLATFORM_FEE_LABEL} chiết khấu. Cần khai tài khoản ngân hàng trước khi rút.`}
                </p>
              </>
            )}
          </Card>

          <Card title="Sản phẩm sắp hết giờ bán" action={<Link to="/products/expiring" style={{ fontSize: 11.5 }}>Xem tất cả</Link>}>
            {bags.error ? (
              <ErrorState message={bags.error} onRetry={bags.reload} />
            ) : !bags.data ? (
              <Loading />
            ) : expiring.length === 0 ? (
              <p className="mu">Chưa có sản phẩm nào sắp hết giờ bán hoặc sắp hết suất.</p>
            ) : (
              expiring.slice(0, 3).map(({ bag, timing }) => (
                <div key={bag.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--ln)' }}>
                  <img className="thb" src={bag.image} alt="" width={48} height={42} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bag.name}</b>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '1px 0 2px' }}>
                      <span className="mu num">còn {durationLabel(timing.minutesLeft ?? 0)}</span>
                      <span className={`bg2 sm ${bag.left <= 2 ? 'tone-r' : 'tone-a'}`} style={{ marginLeft: 'auto' }}>Còn {bag.left} suất</span>
                    </span>
                    <b className="num" style={{ color: 'var(--g7)', fontSize: 13 }}>{vnd(bag.price)}</b>{' '}
                    <s className="mu num">{vnd(bag.originalPrice)}</s>
                  </span>
                </div>
              ))
            )}
          </Card>

          {s && (
            <Card title="Tác động môi trường" icon="leaf" tone="ok" action={<DemoTag />}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <span style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                  <span style={{ color: 'var(--g7)' }}><Icon name="bag" size={18} /></span>
                  <span><b className="num" style={{ display: 'block', fontSize: 20, color: 'var(--g9)', lineHeight: 1.1 }}>{s.rescuedBags.toLocaleString('vi-VN')}</b><span className="mu">Phần đồ ăn được giải cứu</span></span>
                </span>
                <span style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                  <span style={{ color: 'var(--g7)' }}><Icon name="leaf" size={18} /></span>
                  <span><b className="num" style={{ display: 'block', fontSize: 20, color: 'var(--g9)', lineHeight: 1.1 }}>{services.demo ? `${s.rescuedKg.toLocaleString('vi-VN')} kg` : 'Chưa đo'}</b><span className="mu">Thực phẩm tránh lãng phí</span></span>
                </span>
              </div>
              <div style={{ marginTop: 12, background: 'var(--g1)', borderRadius: 10, padding: '11px 13px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--g9)', lineHeight: 1.5, flex: 1 }}>Mỗi phần đồ ăn được bán là một hành động xanh!</span>
                <img src="/images/earth.jpg" alt="" style={{ width: 92, height: 60, objectFit: 'contain', mixBlendMode: 'multiply' }} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
