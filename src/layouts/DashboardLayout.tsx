import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/components/Icon';
import { useToast } from '@/components/Feedback';
import { useAccount, useAuth } from '@/features/auth/AuthContext';
import { services } from '@/services';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Tổng quan', icon: 'home', end: true },
  { to: '/orders', label: 'Đơn hàng', icon: 'doc' },
  { to: '/products', label: 'Sản phẩm', icon: 'bag' },
  { to: '/profile', label: 'Hồ sơ nhà hàng', icon: 'shop' },
  { to: '/settings', label: 'Cài đặt', icon: 'gear' },
];

interface ShellValue {
  pending: number;
  openMenu: () => void;
  restaurantName: string;
}
const ShellContext = createContext<ShellValue | null>(null);
const useShell = (): ShellValue => {
  const v = useContext(ShellContext);
  if (!v) throw new Error('Page must be rendered inside DashboardLayout');
  return v;
};

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const [restaurantName, setRestaurantName] = useState('');
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    let live = true;
    void services.orders.pendingCount().then((n) => live && setPending(n));
    void services.profile.get().then((p) => live && setRestaurantName(p.name));
    return () => {
      live = false;
    };
  }, [location.pathname]);

  const value = useMemo(() => ({ pending, restaurantName, openMenu: () => setOpen(true) }), [pending, restaurantName]);

  return (
    <ShellContext.Provider value={value}>
      <div className="app">
        <aside className={`sd ${open ? 'open' : ''}`} aria-label="Điều hướng chính">
          <div className="bd">
            <img src="/images/mark.jpg" alt="" />
            <span>
              <b>EcoBite</b>
              <small>Quản lý nhà hàng</small>
            </span>
          </div>
          <nav>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon name={n.icon} size={18} />
                <span>{n.label}</span>
                {n.to === '/orders' && pending > 0 && <span className="badge" aria-label={`${pending} đơn chờ xác nhận`}>{pending}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="ft">
            {restaurantName || 'Nhà hàng của bạn'}
            <br />
            <small>Tài khoản chủ nhà hàng</small>
          </div>
        </aside>
        <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="mn">
          {services.demo && (
            <div className="demo-banner" role="note">
              <Icon name="warn" size={15} />
              <span>
                <b>Chế độ demo.</b> Số liệu, đơn hàng và sản phẩm là dữ liệu mẫu trong bộ nhớ trình duyệt, chưa kết nối máy chủ EcoBite. Tải lại trang sẽ đặt về ban đầu.
              </span>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </ShellContext.Provider>
  );
}

/** Header + content wrapper every dashboard page renders. */
export function Page({ title, sub, actions, children }: { title: string; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const { pending, openMenu } = useShell();
  const account = useAccount();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [menu, setMenu] = useState<null | 'user' | 'bell'>(null);

  useEffect(() => {
    document.title = `${title} · EcoBite Bếp`;
  }, [title]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);

  const signOut = async () => {
    await logout();
    toast.info('Đã đăng xuất');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="hb">
        <button type="button" className="icon-btn menu-toggle" onClick={openMenu} aria-label="Mở menu">
          <Icon name="menu" size={18} />
        </button>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <h1>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {actions && <div className="acts">{actions}</div>}
        <div className="who">
          <button type="button" className="bellbtn" aria-label="Thông báo" aria-expanded={menu === 'bell'} onClick={() => setMenu(menu === 'bell' ? null : 'bell')}>
            <Icon name="bell" size={19} />
            {pending > 0 && <span className="dot" />}
          </button>
          <button type="button" className="me" aria-expanded={menu === 'user'} aria-haspopup="menu" onClick={() => setMenu(menu === 'user' ? null : 'user')}>
            <img src="/images/ava.jpg" alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ lineHeight: 1.25 }}>
              <b>{account.fullName}</b>
              <span className="mu role">Chủ nhà hàng</span>
            </span>
          </button>
          {menu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenu(null)} aria-hidden="true" />
              <div className="menu" role="menu" onClick={() => setMenu(null)}>
                {menu === 'bell' ? (
                  pending > 0 ? (
                    <Link to="/orders/pending" role="menuitem">
                      <Icon name="doc" size={16} />
                      {pending} đơn đang chờ xác nhận
                    </Link>
                  ) : (
                    <span className="mu" style={{ padding: '9px 10px', display: 'block' }}>Không có thông báo mới</span>
                  )
                ) : (
                  <>
                    <Link to="/profile" role="menuitem"><Icon name="shop" size={16} />Hồ sơ nhà hàng</Link>
                    <Link to="/settings" role="menuitem"><Icon name="gear" size={16} />Cài đặt tài khoản</Link>
                    <button type="button" role="menuitem" className="danger" onClick={signOut}><Icon name="logout" size={16} />Đăng xuất</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>
      <div className="ct">
        {children}
        <footer className="foot">
          <span>EcoBite © 2026 · For a better tomorrow</span>
          <span>Trợ giúp · Điều khoản sử dụng · Chính sách riêng tư</span>
        </footer>
      </div>
    </>
  );
}
