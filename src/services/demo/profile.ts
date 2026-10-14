import { computeCompleteness } from '@/utils/profile';
import { normalizePhone } from '@/utils/format';
import { ApiError, type ProfileService } from '../types';
import { delay, demoDb } from './db';

export const demoProfile: ProfileService = {
  async get() {
    await delay();
    return structuredClone(demoDb.store().profile);
  },

  async update(patch) {
    await delay();
    const store = demoDb.store();
    if (patch.phone !== undefined && patch.phone && !normalizePhone(patch.phone))
      throw new ApiError('invalid_phone', 'Số điện thoại không hợp lệ');
    store.profile = { ...store.profile, ...patch };
    return structuredClone(store.profile);
  },

  async updateBank(bank) {
    await delay();
    if (!/^\d{6,20}$/.test(bank.accountNumber)) throw new ApiError('invalid_account', 'Số tài khoản chỉ gồm 6 đến 20 chữ số');
    if (!/^[A-Z ]{3,}$/.test(bank.accountHolder)) throw new ApiError('invalid_holder', 'Tên chủ tài khoản viết in hoa, không dấu');
    const store = demoDb.store();
    store.profile = { ...store.profile, bank: { ...bank } };
    return structuredClone(store.profile);
  },

  async completeness() {
    await delay(100);
    return computeCompleteness(demoDb.store().profile, demoDb.requireSession());
  },
};
