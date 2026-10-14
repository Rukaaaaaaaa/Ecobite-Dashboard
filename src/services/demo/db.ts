import type { Account, Bag, Order, RestaurantProfile } from '@/types';
import { ApiError } from '../types';
import { blankProfile, DEMO_PASSWORD, DEMO_PHONE, seedBags, seedOrders, seedProfile } from './fixtures';

/** In-memory demo "database". Lives only in this browser tab; a reload resets everything. */
export const delay = (ms = 220): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface StoredAccount extends Account {
  password: string;
}

export interface RestaurantStore {
  profile: RestaurantProfile;
  bags: Bag[];
  orders: Order[];
}

const accounts: StoredAccount[] = [
  { id: 'acc_demo', fullName: 'Nguyễn Văn An', phone: DEMO_PHONE, phoneVerified: true, otpLogin: true, role: 'owner', password: DEMO_PASSWORD },
];
const stores = new Map<string, RestaurantStore>();
let sessionId: string | null = null;
let seq = 1;

export const demoDb = {
  accounts,
  nextId: (prefix: string): string => `${prefix}_${Date.now().toString(36)}${seq++}`,
  findByPhone: (phone: string) => accounts.find((a) => a.phone === phone),
  setSession: (id: string | null): void => {
    sessionId = id;
  },
  session: (): StoredAccount | null => accounts.find((a) => a.id === sessionId) ?? null,
  requireSession(): StoredAccount {
    const a = demoDb.session();
    if (!a) throw new ApiError('unauthenticated', 'Phiên đăng nhập đã hết. Hãy đăng nhập lại.');
    return a;
  },
  /** Only the demo account has sample data; a new account starts empty (shows the empty states). */
  store(): RestaurantStore {
    const a = demoDb.requireSession();
    let s = stores.get(a.id);
    if (!s) {
      if (a.id === 'acc_demo') {
        const bags = seedBags();
        s = { profile: seedProfile(), bags, orders: seedOrders(bags) };
      } else {
        s = { profile: blankProfile(a.phone), bags: [], orders: [] };
      }
      stores.set(a.id, s);
    }
    return s;
  },
  publicAccount: (a: StoredAccount): Account => {
    const { password: _password, ...rest } = a;
    return rest;
  },
};
