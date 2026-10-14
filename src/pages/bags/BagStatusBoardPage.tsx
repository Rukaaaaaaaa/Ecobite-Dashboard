import { Link } from 'react-router-dom';
import { BagStatusBadge, ProductKindBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, Note } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { useBagStatus } from '@/features/bags/useBagStatus';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, BAG_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { BagStatus } from '@/types';
import { vnd } from '@/utils/format';

const COLUMNS: { status: BagStatus; desc: string }[] = [
  { status: 'draft', desc: 'Chỉ mình bạn thấy. Chưa lên ứng dụng khách.' },
  { status: 'live', desc: 'Khách mua được ngay trong khung giờ.' },
  { status: 'paused', desc: 'Vẫn còn nhưng ẩn khỏi ứng dụng khách.' },
];

/** 4.7 — three columns; the status changes with the buttons on each bag (no drag and drop). */
export default function BagStatusBoardPage() {
  const q = useAsync(() => services.bags.list(), []);
  const { change, busyId, modal } = useBagStatus('/products/status', () => q.reload());
  const bags = q.data ?? [];

  return (
    <Page title="Trạng thái sản phẩm" sub="Đổi trạng thái ngay trên từng thẻ">
      <SubNav label="Mục con" items={BAG_NAV} />
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !q.data ? <Loading /> : (
        <>
          <div className="board">
            {COLUMNS.map((c) => {
              const list = bags.filter((b) => b.status === c.status);
              return (
                <Card key={c.status} tone={c.status === 'live' ? 'ok' : undefined}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                    <BagStatusBadge status={c.status} />
                    <span className="mu num" style={{ marginLeft: 'auto' }}>{list.length} sản phẩm</span>
                  </div>
                  <p className="mu" style={{ marginBottom: 12 }}>{c.desc}</p>
                  <div className="stack" style={{ gap: 9 }}>
                    {list.map((b) => (
                      <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 9, border: '1px solid var(--ln)', borderRadius: 10, background: 'var(--s)' }}>
                        <img className="thb" src={b.image} alt="" width={42} height={36} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <Link to={`/products/${b.id}/edit`} style={{ display: 'block', fontSize: 12.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</Link>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}><ProductKindBadge kind={b.kind} /><span className="mu num">{vnd(b.price)}</span></span>
                        </span>
                        {b.status === 'live' ? (
                          <Button small variant="ghost" loading={busyId === b.id} onClick={() => void change(b, 'paused')} aria-label={`Tạm dừng ${b.name}`}><Icon name="pause" size={14} /></Button>
                        ) : (
                          <Button small loading={busyId === b.id} onClick={() => void change(b, 'live')} aria-label={`Đăng bán ${b.name}`}><Icon name="play" size={14} /></Button>
                        )}
                      </div>
                    ))}
                    {c.status === 'draft' && (
                      <Link to="/products/new" style={{ border: '1px dashed var(--ln2)', borderRadius: 10, padding: 13, textAlign: 'center', color: 'var(--ink3)', fontSize: 12.5, fontWeight: 500 }}>
                        <Icon name="plus" size={16} /><br />Tạo sản phẩm
                      </Link>
                    )}
                    {list.length === 0 && c.status !== 'draft' && <span className="mu">Chưa có sản phẩm nào.</span>}
                  </div>
                </Card>
              );
            })}
          </div>
          <Note>Chuyển một sản phẩm nháp sang đang bán khi hồ sơ chưa đủ thông tin sẽ hiện thông báo yêu cầu hoàn thiện hồ sơ.</Note>
        </>
      )}
      {modal}
    </Page>
  );
}
