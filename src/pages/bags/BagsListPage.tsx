import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BagStatusBadge, BAG_STATUS, ProductKindBadge } from '@/components/Badge';
import { Button, LinkButton } from '@/components/Button';
import { Card, Chip } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { useBagStatus } from '@/features/bags/useBagStatus';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { SubNav, BAG_NAV } from '@/components/SubNav';
import { services } from '@/services';
import type { Bag, BagStatus, ProductKind } from '@/types';
import { totalSeats } from '@/utils/bags';
import { discountPct, vnd, windowLabel } from '@/utils/format';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

/** 4.1 */
export default function BagsListPage() {
  const q = useAsync(() => services.bags.list(), []);
  const [filter, setFilter] = useState<'all' | BagStatus>('all');
  const [kind, setKind] = useState<'all' | ProductKind>('all');
  const [search, setSearch] = useState('');
  const { change, busyId, modal } = useBagStatus('/products', () => q.reload());

  const bags = q.data ?? [];
  const shown = useMemo(() => bags.filter((b) => (filter === 'all' || b.status === filter) && (kind === 'all' || b.kind === kind) && norm(b.name).includes(norm(search.trim()))), [bags, filter, kind, search]);
  const count = (s: BagStatus) => bags.filter((b) => b.status === s).length;

  return (
    <Page
      title="Sản phẩm"
      sub="Đồ ăn và Mystery Bag của nhà hàng bạn"
      actions={
        <>
          <div className="ip-wrap" style={{ width: 190 }}>
            <span className="lead"><Icon name="srch" size={15} /></span>
            <input className="ip" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sản phẩm…" aria-label="Tìm sản phẩm" />
          </div>
          <LinkButton to="/products/new"><Icon name="plus" size={16} />Tạo sản phẩm</LinkButton>
        </>
      }
    >
      <SubNav label="Mục con" items={BAG_NAV} />
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !q.data ? <Loading label="Đang tải sản phẩm…" /> : bags.length === 0 ? (
        <Card><EmptyState icon="bag" title="Bạn chưa có sản phẩm nào" action={<LinkButton to="/products/new"><Icon name="plus" size={16} />Tạo sản phẩm đầu tiên</LinkButton>}>Tạo món hoặc Mystery Bag từ phần đồ ăn còn tốt cuối ngày, đặt giá và khung giờ rồi đăng bán.</EmptyState></Card>
      ) : (
        <>
          <Card>
            <div className="chips" role="group" aria-label="Lọc theo trạng thái">
              <Chip active={kind === 'all'} count={bags.length} onClick={() => setKind('all')}>Tất cả</Chip>
              <Chip active={kind === 'food'} count={bags.filter((b) => b.kind === 'food').length} onClick={() => setKind('food')}><Icon name="dish" size={14} />Đồ ăn</Chip>
              <Chip active={kind === 'bag'} count={bags.filter((b) => b.kind === 'bag').length} onClick={() => setKind('bag')}><Icon name="gift" size={14} />Mystery Bag</Chip>
              <span style={{ width: 1, background: 'var(--ln)', margin: '0 4px' }} />
              <Chip active={filter === 'all'} onClick={() => setFilter('all')}>Mọi trạng thái</Chip>
              {(['live', 'paused', 'draft'] as BagStatus[]).map((s) => (
                <Chip key={s} active={filter === s} count={count(s)} onClick={() => setFilter(s)}>{BAG_STATUS[s].label}</Chip>
              ))}
              <span style={{ flex: 1 }} />
              <Link to="/products/status" style={{ alignSelf: 'center', fontSize: 12 }}>Bảng trạng thái</Link>
            </div>
          </Card>
          {shown.length === 0 ? (
            <Card><EmptyState icon="srch" title="Không có sản phẩm phù hợp">Thử đổi từ khoá hoặc bộ lọc.</EmptyState></Card>
          ) : (
            <div className="bag-grid">
              {shown.map((b) => <BagCard key={b.id} bag={b} busy={busyId === b.id} onToggle={() => void change(b, b.status === 'live' ? 'paused' : 'live')} />)}
            </div>
          )}
        </>
      )}
      {modal}
    </Page>
  );
}

function BagCard({ bag: b, busy, onToggle }: { bag: Bag; busy: boolean; onToggle: () => void }) {
  const live = b.status === 'live';
  return (
    <article className="cd" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--g1)', borderBottom: '1px solid var(--ln)' }}>
        <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <span style={{ position: 'absolute', left: 9, top: 9 }}><ProductKindBadge kind={b.kind} /></span>
      </div>
      <div style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <h3 style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{b.name}</h3>
          <BagStatusBadge status={b.status} />
        </div>
        <p className="mu" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.description || 'Chưa có mô tả'}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <b className="num" style={{ fontSize: 17, color: 'var(--g7)' }}>{vnd(b.price)}</b>
          <s className="mu num">{vnd(b.originalPrice)}</s>
          <span className="bg2 tone-g" style={{ marginLeft: 'auto' }}>-{discountPct(b.originalPrice, b.price)}%</span>
        </div>
        <div className="mu" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>Còn <b className="num" style={{ color: 'var(--ink)' }}>{b.left}</b>/{totalSeats(b) || b.quantity} suất</span>
          <span className="num">{b.windows.map(windowLabel).join(' · ') || 'Chưa có khung giờ'}</span>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 'auto', paddingTop: 3 }}>
          <Link className="bt gh sm" style={{ flex: 1 }} to={`/products/${b.id}/edit`}><Icon name="edit" size={14} />Sửa</Link>
          <Button small variant={live ? 'ghost' : 'primary'} loading={busy} onClick={onToggle} aria-label={live ? `Tạm dừng ${b.name}` : `Đăng bán ${b.name}`} title={live ? 'Tạm dừng bán' : 'Đăng bán'}>
            {!busy && <Icon name={live ? 'pause' : 'play'} size={14} />}
          </Button>
        </div>
      </div>
    </article>
  );
}
