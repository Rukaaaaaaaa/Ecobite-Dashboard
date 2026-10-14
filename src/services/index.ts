import { demoAuth } from './demo/auth';
import { demoBags } from './demo/bags';
import { demoOrders } from './demo/orders';
import { demoProfile } from './demo/profile';
import { DEMO_CODE, DEMO_PASSWORD, DEMO_PHONE } from './demo/fixtures';
import { demoStats } from './demo/stats';
import type { Services } from './types';

/**
 * The single place that decides which implementation the app uses.
 *
 * Everything is the in-memory DEMO for now: the backend has none of the restaurant-owner endpoints yet
 * (see README, "API còn thiếu"). When one exists, add its http implementation (using `http.ts`) and swap
 * ONLY that service here; do not mix demo and real data inside one screen.
 */
export const services: Services = {
  demo: true,
  auth: demoAuth,
  orders: demoOrders,
  bags: demoBags,
  profile: demoProfile,
  stats: demoStats,
};

export { ApiError } from './types';
export type * from './types';

/** Sign-in values shown in the UI while everything is demo. `null` as soon as a real backend is used. */
export const demoHints = services.demo ? { password: DEMO_PASSWORD, phone: DEMO_PHONE, code: DEMO_CODE } : null;
