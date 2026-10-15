import { lazy, Suspense, type ReactElement } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/components/Feedback';
import { Loading } from '@/components/States';
import { AuthProvider, nextVerificationStep, RedirectIfAuthed, RequireAuth } from '@/features/auth/AuthContext';
import type { Account } from '@/types';
import { DashboardLayout } from '@/layouts/DashboardLayout';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyPhonePage = lazy(() => import('@/pages/auth/VerifyPhonePage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/PasswordResetPages').then((m) => ({ default: m.ForgotPasswordPage })));

const OverviewPage = lazy(() => import('@/pages/overview/OverviewPage'));
const RevenueAnalyticsPage = lazy(() => import('@/pages/overview/AnalyticsPages').then((m) => ({ default: m.RevenueAnalyticsPage })));
const OrderAnalyticsPage = lazy(() => import('@/pages/overview/AnalyticsPages').then((m) => ({ default: m.OrderAnalyticsPage })));

const OrdersListPage = lazy(() => import('@/pages/orders/OrdersListPage'));
const PendingOrdersPage = lazy(() => import('@/pages/orders/PendingOrdersPage'));
const OrderHistoryPage = lazy(() => import('@/pages/orders/OrderHistoryPage'));
const VerifyPickupPage = lazy(() => import('@/pages/orders/VerifyPickupPage'));
const OrderDetailPage = lazy(() => import('@/pages/orders/OrderDetailPages').then((m) => ({ default: m.OrderDetailPage })));
const OrderProcessPage = lazy(() => import('@/pages/orders/OrderDetailPages').then((m) => ({ default: m.OrderProcessPage })));

const BagsListPage = lazy(() => import('@/pages/bags/BagsListPage'));
const BagEditorPage = lazy(() => import('@/pages/bags/BagEditorPage'));
const ProductTypePage = lazy(() => import('@/pages/bags/ProductTypePage'));
const BagStatusBoardPage = lazy(() => import('@/pages/bags/BagStatusBoardPage'));
const ExpiringBagsPage = lazy(() => import('@/pages/bags/ExpiringBagsPage'));

const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'));
const WalletHistoryPage = lazy(() => import('@/pages/wallet/WalletHistoryPage'));
const WithdrawPage = lazy(() => import('@/pages/wallet/WithdrawPage'));
const WithdrawVerifyPage = lazy(() => import('@/pages/wallet/WithdrawVerifyPage'));
const WithdrawalDetailPage = lazy(() => import('@/pages/wallet/WithdrawalDetailPage'));

const ProfileOverviewPage = lazy(() => import('@/pages/profile/ProfileOverviewPage'));
const ProfileEditPage = lazy(() => import('@/pages/profile/ProfileEditPages').then((m) => ({ default: m.ProfileEditPage })));
const ProfileContactPage = lazy(() => import('@/pages/profile/ProfileEditPages').then((m) => ({ default: m.ProfileContactPage })));
const ProfileBankPage = lazy(() => import('@/pages/profile/ProfileEditPages').then((m) => ({ default: m.ProfileBankPage })));
const SettingsPage = lazy(() => import('@/pages/profile/SettingsPage'));

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Không tìm thấy trang</h1>
        <p className="mu" style={{ marginBottom: 14 }}>Đường dẫn này không tồn tại.</p>
        <Link className="bt" to="/">Về Tổng quan</Link>
      </div>
    </div>
  );
}

/** Old `/bags/...` links keep working: they land on the matching `/products/...` page. */
function LegacyBagsRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`${pathname.replace(/^\/bags/, '/products')}${search}`} replace />;
}

const guest = (el: ReactElement, afterAuth?: (a: Account) => string | null) => <RedirectIfAuthed afterAuth={afterAuth}>{el}</RedirectIfAuthed>;
const authed = (el: ReactElement) => <RequireAuth>{el}</RequireAuth>;

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={guest(<LoginPage />)} />
              <Route path="/register" element={guest(<RegisterPage />, nextVerificationStep)} />
              <Route path="/forgot-password" element={guest(<ForgotPasswordPage />)} />
              <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
              <Route path="/verify-email" element={<Navigate to="/" replace />} />
              <Route path="/verify-phone" element={authed(<VerifyPhonePage />)} />

              <Route element={authed(<DashboardLayout />)}>
                <Route index element={<OverviewPage />} />
                <Route path="analytics/revenue" element={<RevenueAnalyticsPage />} />
                <Route path="analytics/orders" element={<OrderAnalyticsPage />} />

                <Route path="orders" element={<OrdersListPage />} />
                <Route path="orders/pending" element={<PendingOrdersPage />} />
                <Route path="orders/history" element={<OrderHistoryPage />} />
                <Route path="orders/verify" element={<VerifyPickupPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="orders/:id/process" element={<OrderProcessPage />} />

                <Route path="products" element={<BagsListPage />} />
                <Route path="products/new" element={<ProductTypePage />} />
                <Route path="products/new/food" element={<BagEditorPage kind="food" />} />
                <Route path="products/new/bag" element={<BagEditorPage kind="bag" />} />
                <Route path="products/expiring" element={<ExpiringBagsPage />} />
                <Route path="products/status" element={<BagStatusBoardPage />} />
                <Route path="products/:id/edit" element={<BagEditorPage />} />
                <Route path="bags/*" element={<LegacyBagsRedirect />} />

                <Route path="wallet" element={<WalletPage />} />
                <Route path="wallet/history" element={<WalletHistoryPage />} />
                <Route path="wallet/withdraw" element={<WithdrawPage />} />
                <Route path="wallet/withdraw/:code/verify" element={<WithdrawVerifyPage />} />
                <Route path="wallet/withdrawals/:code" element={<WithdrawalDetailPage />} />

                <Route path="profile" element={<ProfileOverviewPage />} />
                <Route path="profile/edit" element={<ProfileEditPage />} />
                <Route path="profile/contact" element={<ProfileContactPage />} />
                <Route path="profile/bank" element={<ProfileBankPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/home" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
