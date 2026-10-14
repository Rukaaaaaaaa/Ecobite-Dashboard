import { NavLink } from 'react-router-dom';

/** Secondary navigation inside one section (orders, bags, overview). */
export function SubNav({ label, items }: { label: string; items: { to: string; label: string; end?: boolean }[] }) {
  return (
    <nav className="step-tabs" aria-label={label}>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end ?? true} className={({ isActive }) => `subnav ${isActive ? 'on' : ''}`} aria-current={undefined}>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}

export const ORDER_NAV = [
  { to: '/orders', label: 'Tất cả đơn' },
  { to: '/orders/pending', label: 'Cần xử lý' },
  { to: '/orders/verify', label: 'Xác minh mã nhận hàng' },
  { to: '/orders/history', label: 'Lịch sử' },
];

export const BAG_NAV = [
  { to: '/products', label: 'Danh sách' },
  { to: '/products/expiring', label: 'Sắp hết' },
  { to: '/products/status', label: 'Bảng trạng thái' },
];

export const OVERVIEW_NAV = [
  { to: '/', label: 'Tổng quan' },
  { to: '/analytics/revenue', label: 'Phân tích doanh thu' },
  { to: '/analytics/orders', label: 'Phân tích đơn hàng' },
];
