import { useState } from 'react';
import { BarChart, Donut, HBars, LineChart } from '@/components/charts';
import { Card, Kpi, Note, Segmented } from '@/components/Controls';
import { DemoTag, EmptyState, ErrorState, Loading } from '@/components/States';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, OVERVIEW_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { OrderAnalytics, RevenueAnalytics } from '@/types';
import { formatDuration, vnd } from '@/utils/format';

const pct = (n: number) => `${n}%`;

/** 2.2 */
export function RevenueAnalyticsPage() {
  const [range, setRange] = useState<RevenueAnalytics['range']>('30d');
  const q = useAsync(() => services.stats.revenue(range), [range]);
  const d = q.data;
  const label = range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : 'quý';
  return (
    <Page
      title="Phân tích doanh thu"
      sub="So sánh theo ngày, khung giờ và từng loại túi"
      actions={<><DemoTag /><Segmented label="Kỳ phân tích" value={range} onChange={setRange} options={[{ value: '7d', label: '7 ngày' }, { value: '30d', label: '30 ngày' }, { value: 'quarter', label: 'Quý' }]} /></>}
    >
      <SubNav label="Phân tích" items={OVERVIEW_NAV} />
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !d ? <Loading /> : d.total === 0 ? (
        <Card><EmptyState icon="money" title="Chưa có doanh thu">Khi có đơn hàng hoàn thành, doanh thu sẽ được phân tích ở đây.</EmptyState></Card>
      ) : (
        <>
          <div className="row">
            <Kpi icon="money" label={`Doanh thu ${label}`} value={vnd(d.total)} delta={pct(d.totalDeltaPct)} deltaSuffix=" so với kỳ trước" />
            <Kpi icon="doc" label="Giá trị đơn trung bình" value={vnd(d.avgOrder)} delta={pct(d.avgDeltaPct)} deltaSuffix=" so với kỳ trước" />
            <Kpi icon="bag" label="Túi bán được" value={d.bagsSold.toLocaleString('vi-VN')} delta={pct(d.bagsDeltaPct)} deltaSuffix=" so với kỳ trước" />
          </div>
          <div className="row">
            <Card title="Doanh thu bảy ngày gần nhất" action={<span className="mu">đơn vị triệu đồng</span>} grow="999 1 420px">
              <LineChart data={d.weekSeries} ariaLabel="Doanh thu bảy ngày gần nhất" />
            </Card>
            <Card title="Doanh thu theo loại túi" grow="1 1 260px">
              <HBars rows={d.byBag} />
              <p className="mu" style={{ marginTop: 12 }}>Đơn vị triệu đồng, tính trong {label}.</p>
            </Card>
          </div>
          <Card title="Khung giờ bán chạy" action={<span className="mu">Tỷ trọng doanh thu theo khung giờ</span>}>
            <HBars rows={d.byHour} />
            <p className="mu" style={{ marginTop: 12 }}>Đơn vị phần trăm.</p>
          </Card>
        </>
      )}
    </Page>
  );
}

/** 2.3 */
export function OrderAnalyticsPage() {
  const [range, setRange] = useState<OrderAnalytics['range']>('30d');
  const q = useAsync(() => services.stats.orders(range), [range]);
  const d = q.data;
  return (
    <Page
      title="Phân tích đơn hàng"
      sub="Tỷ lệ hoàn thành, lý do hụt đơn và giờ cao điểm"
      actions={<><DemoTag /><Segmented label="Kỳ phân tích" value={range} onChange={setRange} options={[{ value: '7d', label: '7 ngày' }, { value: '30d', label: '30 ngày' }]} /></>}
    >
      <SubNav label="Phân tích" items={OVERVIEW_NAV} />
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !d ? <Loading /> : d.total === 0 ? (
        <Card><EmptyState icon="doc" title="Chưa có đơn hàng">Số liệu đơn hàng sẽ hiện ở đây khi khách bắt đầu đặt túi.</EmptyState></Card>
      ) : (
        <>
          <div className="row">
            <Kpi icon="doc" label={`Tổng đơn ${range === '7d' ? '7' : '30'} ngày`} value={d.total.toLocaleString('vi-VN')} delta="7%" deltaSuffix=" so với kỳ trước" />
            <Kpi icon="chk" label="Tỷ lệ hoàn thành" value={`${d.completionRate.toLocaleString('vi-VN')}%`} delta="1,2 điểm" deltaSuffix=" so với kỳ trước" />
            <Kpi icon="clock" amber label="Thời gian xác nhận trung bình" value={formatDuration(d.avgConfirmSeconds)} delta="Cần giữ dưới 5 phút" />
          </div>
          <div className="row">
            <Card title="Kết thúc của đơn" grow="1 1 280px"><Donut rows={d.outcome} total={d.total} unit="đơn" /></Card>
            <Card title="Số đơn theo ngày trong tuần" grow="999 1 400px">
              <BarChart data={d.byWeekday} unit="" ariaLabel="Số đơn theo ngày trong tuần" highlight={Math.max(...d.byWeekday.map((p) => p.value)) * 0.85} />
            </Card>
          </div>
          <Card title="Vì sao đơn không thành" action={<span className="bg2 tone-a">Dữ liệu mẫu</span>}>
            <HBars rows={d.failReasons} />
            <div style={{ marginTop: 12 }}>
              <Note>Phần phân loại lý do huỷ cần quy tắc nghiệp vụ được xác nhận trước khi làm thật. Hiện chỉ là nhóm tạm để xem bố cục.</Note>
            </div>
          </Card>
        </>
      )}
    </Page>
  );
}
