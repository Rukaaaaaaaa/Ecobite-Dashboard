import type { Bag, BagInput, BagStatus } from '@/types';
import { computeCompleteness } from '@/utils/profile';
import { hasErrors, validateBag } from '@/utils/validation';
import { ApiError, type BagsService } from '../types';
import { delay, demoDb } from './db';

const find = (id: string): Bag => {
  const b = demoDb.store().bags.find((x) => x.id === id);
  if (!b) throw new ApiError('bag_not_found', 'Không tìm thấy sản phẩm');
  return b;
};

/** Server-side style guard: going on sale needs a complete profile and a valid bag. */
const assertCanPublish = (input: BagInput): void => {
  const acc = demoDb.requireSession();
  if (!computeCompleteness(demoDb.store().profile, acc).canPublish)
    throw new ApiError('profile_incomplete', 'Hồ sơ nhà hàng còn thiếu thông tin bắt buộc. Hoàn thiện hồ sơ rồi đăng bán.');
  if (hasErrors(validateBag(input))) throw new ApiError('validation', 'Thông tin sản phẩm chưa hợp lệ');
};

const total = (b: Pick<Bag, 'windows'>): number => b.windows.reduce((s, w) => s + w.quantity, 0);

export const demoBags: BagsService = {
  async list() {
    await delay();
    return demoDb.store().bags.map((b) => ({ ...b }));
  },

  async get(id) {
    await delay(120);
    return { ...find(id) };
  },

  async create(input) {
    await delay();
    if (input.status === 'live') assertCanPublish(input);
    else if (input.name.trim().length < 2) throw new ApiError('validation', 'Nhập tên sản phẩm để lưu nháp');
    const bag: Bag = { ...input, id: demoDb.nextId('bag'), left: input.windows[0]?.quantity ?? input.quantity };
    demoDb.store().bags.unshift(bag);
    return { ...bag };
  },

  async update(id, input) {
    await delay();
    const bag = find(id);
    if (input.status === 'live') assertCanPublish(input);
    else if (input.name.trim().length < 2) throw new ApiError('validation', 'Nhập tên sản phẩm để lưu');
    // Orders already placed keep the name and price they were bought at; only new orders see the change.
    Object.assign(bag, input, { left: Math.min(bag.left, Math.max(total(input), 0)) });
    return { ...bag };
  },

  async setStatus(id, status: BagStatus) {
    await delay();
    const bag = find(id);
    if (status === 'live') assertCanPublish(bag);
    bag.status = status;
    return { ...bag };
  },
};
