import type { Account, Bag, Order, OrderStatus, RestaurantProfile } from '@/types';
import { businessDate, normalizePhone } from '@/utils/format';
import { computeCompleteness } from '@/utils/profile';
import { http, setAccessToken } from './http';
import { ApiError, type AuthService, type OrdersService, type Services } from './types';
import { createLiveStats } from './live-stats';

interface MerchantSession {
  account: { id: string; name: string; phone: string };
  restaurant: { id: string; name: string; address: string; phone: string; location?: { lat: number; lng: number } };
}
interface BackendOrder {
  id: string;
  orderCode: string;
  status: 'placed' | 'paid' | 'preparing' | 'ready' | 'qr_verified' | 'picked_up' | 'cancelled' | 'expired';
  customer: string;
  phoneMasked: string;
  items: { foodBagId: string; name: string; quantity: number; unitPrice: number; ownBox: boolean }[];
  money: { subtotal: number; promoDiscount: number; ownBoxDiscount: number; total: number };
  paymentMethod: string;
  paymentStatus: string;
  pickupSlot: { date: string; start: string; end: string };
  statusHistory: Partial<Record<BackendOrder['status'], string>>;
  createdAt: string;
}

let account: Account | null = null;
const pickupTokens = new Map<string, string>();
const unavailable = async (): Promise<never> => {
  throw new ApiError('not_available', 'Chức năng này chưa được hỗ trợ trên máy chủ.');
};
const statusMap: Record<BackendOrder['status'], OrderStatus> = {
  placed: 'unpaid', paid: 'wait', preparing: 'conf', ready: 'ready',
  qr_verified: 'verified', picked_up: 'done', cancelled: 'cancel', expired: 'expired',
};

export function mapOrder(o: BackendOrder): Order {
  const quantity = o.items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: o.id, orderCode: o.orderCode, backendStatus: o.status,
    paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    items: o.items, money: o.money,
    pickupCode: '', customer: o.customer, phoneMasked: o.phoneMasked,
    bagId: o.items[0]?.foodBagId ?? '', productKind: 'bag',
    bagName: o.items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
    image: '/images/ph-rice.jpg', quantity,
    unitPrice: o.items.length === 1 ? o.items[0].unitPrice : 0,
    total: o.money.total, placedAt: o.createdAt, pickupWindow: o.pickupSlot,
    status: statusMap[o.status], confirmedAt: o.statusHistory.preparing ?? null,
    readyAt: o.statusHistory.ready ?? null, deliveredAt: o.statusHistory.picked_up ?? null,
    deliveredBy: null, customerOrderCount: 0,
    revenueRecognised: o.paymentStatus === 'success' && !['cancelled', 'expired'].includes(o.status),
  };
}

const readOrders = async () => (await http<BackendOrder[]>('/merchant/orders')).map(mapOrder);
const statuses: OrderStatus[] = ['unpaid', 'wait', 'conf', 'ready', 'verified', 'done', 'miss', 'cancel', 'expired'];
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

function acceptSession(result: MerchantSession & { accessToken: string }): Account {
  setAccessToken(result.accessToken);
  account = { id: result.account.id, fullName: result.account.name, phone: result.account.phone,
    phoneVerified: false, otpLogin: false, role: 'owner' };
  pickupTokens.clear();
  return account;
}

const auth: AuthService = {
  getSession: () => account,
  async login(phone, password) {
    setAccessToken(null);
    account = null;
    pickupTokens.clear();
    const result = await http<MerchantSession & { accessToken: string }>('/merchant/login', {
      method: 'POST', body: { identifier: normalizePhone(phone) ?? phone, password },
    });
    return acceptSession(result);
  },
  async register(input) {
    const result = await http<MerchantSession & { accessToken: string }>('/merchant/register', {
      method: 'POST', body: { fullName: input.fullName, phone: normalizePhone(input.phone) ?? input.phone,
        password: input.password, restaurantName: input.restaurantName, address: input.address },
    });
    return acceptSession(result);
  },
  async logout() { setAccessToken(null); account = null; pickupTokens.clear(); },
  requestPhoneLoginCode: unavailable, loginWithPhoneCode: unavailable,
  sendPhoneCode: unavailable, verifyPhoneCode: unavailable, requestPasswordReset: unavailable,
  verifyPasswordResetCode: unavailable, resetPassword: unavailable, async changePassword(current, next) {
    await http('/merchant/manage/password', { method: 'POST', body: { current, next } });
  }, setOtpLogin: unavailable,
};

const orders: OrdersService = {
  async list(q) {
    const search = normalize(q.search?.trim() ?? '');
    const scope = (await readOrders()).filter((o) => {
      if (q.finishedOnly && !['done', 'miss', 'cancel', 'expired'].includes(o.status)) return false;
      if (q.actionableOnly && !['wait', 'conf', 'ready'].includes(o.status)) return false;
      const date = businessDate(new Date(o.placedAt));
      return (!q.fromDate || date >= q.fromDate) && (!q.toDate || date <= q.toDate) &&
        (!search || normalize(`${o.orderCode} ${o.customer} ${o.bagName}`).includes(search));
    });
    const counts = Object.fromEntries(statuses.map((s) => [s, scope.filter((o) => o.status === s).length])) as Record<OrderStatus | 'all', number>;
    counts.all = scope.length;
    const filtered = q.status && q.status !== 'all' ? scope.filter((o) => o.status === q.status) : scope;
    const pageSize = Math.max(1, Math.min(q.pageSize ?? 8, 5000));
    const page = Math.max(1, Math.min(q.page ?? 1, Math.ceil(filtered.length / pageSize) || 1));
    return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, counts, page, pageSize };
  },
  async get(id) { return mapOrder(await http<BackendOrder>(`/merchant/orders/${encodeURIComponent(id)}`)); },
  async advance(id, expectedStatus) {
    // Carry the observed state so repeated/concurrent clicks cannot skip preparing.
    return mapOrder(await http<BackendOrder>(`/merchant/orders/${encodeURIComponent(id)}/advance`, {
      method: 'POST', body: { expectedStatus },
    }));
  },
  async lookupPickupCode(code) {
    const token = code.trim();
    const order = mapOrder(await http<BackendOrder>('/merchant/pickup/lookup', { method: 'POST', body: { token } }));
    pickupTokens.set(order.id, token);
    return order;
  },
  async completePickup(id) {
    const token = pickupTokens.get(id);
    if (!token) throw new ApiError('pickup_code_required', 'Hãy nhập mã nhận hàng bảo mật của khách trước.');
    const order = mapOrder(await http<BackendOrder>(`/merchant/orders/${encodeURIComponent(id)}/verify-pickup`, {
      method: 'POST', body: { token },
    }));
    pickupTokens.delete(id);
    return order;
  },
  async recentDeliveries() { return (await readOrders()).filter((o) => o.status === 'done')
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? '')).slice(0, 5); },
  async pendingCount() { return account ? (await readOrders()).filter((o) => o.status === 'wait').length : 0; },
};

async function profile(): Promise<RestaurantProfile> {
  return http<RestaurantProfile>('/merchant/manage/profile');
}

const listBags = async (): Promise<Bag[]> => {
  return http<Bag[]>('/merchant/manage/products');
};

export const liveServices: Services = {
  demo: false, auth, orders,
  profile: { get: profile,
    update: (body) => http('/merchant/manage/profile', { method: 'POST', body }),
    updateBank: (body) => http('/merchant/manage/bank', { method: 'POST', body }), async completeness() {
    const current = await profile();
    if (!account) throw new ApiError('unauthenticated', 'Vui lòng đăng nhập lại.');
    const result = computeCompleteness(current, account);
    // Publishing on the server requires public contact details; SMS is not configured.
    result.checks = result.checks.filter((c) => ['name', 'street', 'phone'].includes(c.key));
    result.missing = result.checks.filter((c) => !c.done);
    result.total = result.checks.length;
    result.filled = result.total - result.missing.length;
    result.canPublish = result.missing.length === 0;
    return result;
  } },
  bags: { list: listBags, async get(id) {
    const bag = (await listBags()).find((b) => b.id === id);
    if (!bag) throw new ApiError('not_found', 'Không tìm thấy sản phẩm.');
    return bag;
  }, create: (body) => http('/merchant/manage/products', { method: 'POST', body }),
    update: (id, body) => http(`/merchant/manage/products/${encodeURIComponent(id)}`, { method: 'POST', body }),
    setStatus: (id, status) => http(`/merchant/manage/products/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } }) },
  stats: createLiveStats(readOrders),
  wallet: { summary: () => http('/merchant/manage/wallet'), transactions: () => http('/merchant/manage/wallet/transactions'),
    startWithdrawal: (amount) => http('/merchant/manage/withdrawals', { method: 'POST', body: { amount } }),
    getWithdrawal: (code) => http(`/merchant/manage/withdrawals/${encodeURIComponent(code)}`),
    sendWithdrawalCode: unavailable,
    confirmWithdrawal: (code, password) => http(`/merchant/manage/withdrawals/${encodeURIComponent(code)}/confirm`, { method: 'POST', body: { password } }) },
};
