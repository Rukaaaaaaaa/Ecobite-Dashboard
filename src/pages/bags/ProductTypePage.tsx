import { LinkButton } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { Page } from '@/layouts/DashboardLayout';
import { Link } from 'react-router-dom';
import type { ProductKind } from '@/types';

interface Option {
  kind: ProductKind;
  icon: IconName;
  title: string;
  desc: string;
  points: string[];
  to: string;
  tone: { fg: string; bg: string };
}

const OPTIONS: Option[] = [
  {
    kind: 'food', icon: 'dish', title: 'Tạo đồ ăn mới', to: '/products/new/food',
    desc: 'Món cụ thể, khách thấy rõ tên và ảnh trước khi đặt.',
    points: ['Khách biết chính xác mình mua gì', 'Hợp với món còn dư nhưng vẫn ngon', 'Đặt tên, ảnh và giá cho từng món'],
    tone: { fg: 'var(--blu)', bg: 'var(--blu-bg)' },
  },
  {
    kind: 'bag', icon: 'gift', title: 'Tạo Mystery Bag', to: '/products/new/bag',
    desc: 'Túi bất ngờ, quán tự chọn món bỏ vào, khách không biết trước.',
    points: ['Gom nhiều món lẻ còn lại thành một túi', 'Giảm giá sâu hơn vì khách chấp nhận bất ngờ', 'Soạn nhanh vào cuối ca'],
    tone: { fg: 'var(--g7)', bg: 'var(--g1)' },
  },
];

/** 4.2 — "Tạo sản phẩm" lands here first: a regular dish or a Mystery Bag. */
export default function ProductTypePage() {
  return (
    <Page title="Tạo sản phẩm" sub="Chọn loại sản phẩm muốn đăng bán" actions={<LinkButton variant="ghost" to="/products"><Icon name="back" size={16} />Về danh sách</LinkButton>}>
      <div style={{ maxWidth: 900, margin: '10px auto 0', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6 }}>Bạn muốn đăng gì hôm nay?</h2>
          <p className="mu" style={{ margin: 0, fontSize: 13 }}>Hai loại dùng chung một bảng giá và khung giờ, chỉ khác ở chỗ khách có biết trước món hay không.</p>
        </div>
        <div className="row" style={{ gap: 16 }}>
          {OPTIONS.map((o) => (
            <div key={o.kind} className="cd" style={{ flex: '1 1 320px', minWidth: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 13, ...(o.kind === 'bag' ? { borderColor: 'var(--g6)', boxShadow: '0 0 0 2px rgba(43,163,95,.14)' } : {}) }}>
              <span style={{ width: 52, height: 52, borderRadius: 14, background: o.tone.bg, color: o.tone.fg, display: 'grid', placeItems: 'center' }}><Icon name={o.icon} size={26} /></span>
              <div>
                <b style={{ display: 'block', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{o.title}</b>
                <p className="mu" style={{ margin: 0, fontSize: 12.5 }}>{o.desc}</p>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {o.points.map((t) => (
                  <li key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ink2)' }}>
                    <span style={{ color: o.tone.fg, flex: '0 0 auto', marginTop: 1 }}><Icon name="chk" size={14} /></span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link className={`bt block ${o.kind === 'food' ? 'gh' : ''}`} to={o.to} style={{ marginTop: 'auto' }}>{o.title}<Icon name="chev" size={15} /></Link>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 18, textAlign: 'center' }}>Chọn nhầm cũng không sao. Trong màn tạo vẫn đổi được loại sản phẩm trước khi lưu.</div>
      </div>
    </Page>
  );
}
