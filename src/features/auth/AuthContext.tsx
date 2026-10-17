import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { services } from '@/services';
import type { Account } from '@/types';
import { safeReturnTo } from '@/utils/format';

interface AuthValue {
  account: Account | null;
  setAccount: (a: Account | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** The session lives in memory only: a reload signs the user out (no token or password is written to storage). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => services.auth.getSession());
  useEffect(() => {
    const expire = () => { void services.auth.logout(); setAccount(null); };
    window.addEventListener('ecobite:session-expired', expire);
    return () => window.removeEventListener('ecobite:session-expired', expire);
  }, []);
  const logout = useCallback(async () => {
    await services.auth.logout();
    setAccount(null);
  }, []);
  const value = useMemo(() => ({ account, setAccount, logout }), [account, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The signed-in account. Only call inside routes wrapped by `RequireAuth`. */
export function useAccount(): Account {
  const { account } = useAuth();
  if (!account) throw new Error('No signed-in account');
  return account;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const location = useLocation();
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

/**
 * Auth pages are for signed-out users. A signed-in user is sent to `afterAuth(account)`
 * (register uses it to continue with verification), else back to where they came from, else Tổng quan.
 */
export function RedirectIfAuthed({ children, afterAuth }: { children: ReactNode; afterAuth?: (a: Account) => string | null }) {
  const { account } = useAuth();
  const location = useLocation();
  if (account) {
    const from = safeReturnTo((location.state as { from?: string } | null)?.from);
    return <Navigate to={afterAuth?.(account) ?? from ?? '/'} replace />;
  }
  return <>{children}</>;
}

/** Next verification step a new account still owes, or null. */
export const nextVerificationStep = (a: Account): '/verify-phone' | null => (services.demo && !a.phoneVerified ? '/verify-phone' : null);
