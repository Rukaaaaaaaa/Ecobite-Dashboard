import type { Order, OrderStatus } from '@/types';
import { businessDate, businessTime } from '@/utils/format';
import { ApiError, type OrdersService } from '../types';
import { delay, demoDb } from './db';

const FINISHED: OrderStatus[] = ['done', 'miss', 'cancel'];
const ACTIONABLE: OrderStatus[] = ['wait', 'conf', 'ready'];
const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

const sortNewest = (a: Order, b: Order): number => b.placedAt.localeCompare(a.placedAt);

const find = (id: string): Order => {
  const o = demoDb.store().orders.find((x) => x.id === id);
  if (!o) throw new ApiError('order_not_found', 'Không tìm thấy đơn hàng');
  return o;
};

export const demoOrders: OrdersService = {
  async list(q) {
    await delay();
    const all = [...demoDb.store().orders].sort(sortNewest);
    const search = norm(q.search?.trim() ?? '');
    const inScope = all.filter((o) => {
      if (q.finishedOnly && !FINISHED.includes(o.status)) return false;
      if (q.actionableOnly && !ACTIONABLE.includes(o.status)) return false;
      const date = businessDate(new Date(o.placedAt));
      if (q.fromDate && date < q.fromDate) return false;
      if (q.toDate && date > q.toDate) return false;
      if (search && !norm(`${o.id} ${o.customer} ${o.bagName} ${o.pickupCode}`).includes(search)) return false;
      return true;
    });
    const counts = { all: inScope.length, wait: 0, conf: 0, ready: 0, done: 0, miss: 0, cancel: 0 } as Record<OrderStatus | 'all', number>;
    for (const o of inScope) counts[o.status]++;
    const filtered = q.status && q.status !== 'all' ? inScope.filter((o) => o.status === q.status) : inScope;
    const pageSize = q.pageSize ?? 8;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(q.page ?? 1, 1), pages);
    return { items: filtered.slice((page - 1) * pageSize, page * pageSize).map((o) => ({ ...o })), total: filtered.length, page, pageSize, counts };
  },

  async get(id) {
    await delay();
    return { ...find(id) };
  },

  async advance(id) {
    await delay();
    const o = find(id);
    const now = new Date().toISOString();
    if (o.status === 'wait') {
      o.status = 'conf';
      o.confirmedAt = now;
    } else if (o.status === 'conf') {
      o.status = 'ready';
      o.readyAt = now;
    } else {
      throw new ApiError('illegal_transition', 'Đơn này không thể chuyển sang trạng thái tiếp theo');
    }
    return { ...o };
  },

  async lookupPickupCode(code) {
    await delay(300);
    const c = code.trim().toUpperCase();
    if (!c) throw new ApiError('code_invalid', 'Nhập mã nhận hàng của khách');
    const o = demoDb.store().orders.find((x) => x.pickupCode === c);
    if (!o) throw new ApiError('code_invalid', 'Mã không đúng. Kiểm tra lại với khách.');
    if (o.status === 'done')
      throw new ApiError('code_used', `Mã này đã được quét lúc ${o.deliveredAt ? businessTime(o.deliveredAt) : '—'} hôm nay. Mỗi mã chỉ giao một lần.`);
    if (o.status === 'cancel') throw new ApiError('order_cancelled', 'Đơn này đã bị huỷ, không giao túi.');
    if (o.status === 'miss') throw new ApiError('order_closed', 'Đơn này đã đóng (khách không lấy).');
    if (o.status !== 'ready') throw new ApiError('order_not_ready', `Đơn #${o.id} chưa soạn xong. Hãy đánh dấu “đã soạn xong” trước.`);
    return { ...o };
  },

  async completePickup(id) {
    await delay();
    const o = find(id);
    if (o.status !== 'ready') throw new ApiError('order_not_ready', 'Chỉ giao được đơn đang chờ khách lấy.');
    o.status = 'done';
    o.deliveredAt = new Date().toISOString();
    o.deliveredBy = demoDb.requireSession().fullName;
    return { ...o };
  },

  async recentDeliveries() {
    await delay(150);
    return demoDb
      .store()
      .orders.filter((o) => o.deliveredAt)
      .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''))
      .slice(0, 5)
      .map((o) => ({ ...o }));
  },

  async pendingCount() {
    return demoDb.session() ? demoDb.store().orders.filter((o) => o.status === 'wait').length : 0;
  },
};
