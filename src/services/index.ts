import { demoAuth } from './demo/auth';
import { demoBags } from './demo/bags';
import { demoOrders } from './demo/orders';
import { demoProfile } from './demo/profile';
import { DEMO_CODE, DEMO_PASSWORD, DEMO_PHONE } from './demo/fixtures';
import { demoStats } from './demo/stats';
import { demoWallet } from './demo/wallet';
import type { Services } from './types';
import { liveServices } from './live';

/**
 * The single place that decides which implementation the app uses.
 *
 * Live restaurant services are the default. VITE_DEMO_MODE=true explicitly selects
 * the original isolated demo. Never mix demo and real data inside one screen.
 */
export const services: Services = import.meta.env.VITE_DEMO_MODE === 'true' ? {
  demo: true,
  auth: demoAuth,
  orders: demoOrders,
  bags: demoBags,
  profile: demoProfile,
  stats: demoStats,
  wallet: demoWallet,
} : liveServices;

export { ApiError } from './types';
export type * from './types';

/** Sign-in values shown in the UI while everything is demo. `null` as soon as a real backend is used. */
export const demoHints = services.demo ? { password: DEMO_PASSWORD, phone: DEMO_PHONE, code: DEMO_CODE } : null;
