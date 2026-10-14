import type { BagInput } from '@/types';
import { minutesOf } from './format';

export type Errors<T extends string = string> = Partial<Record<T, string>>;

export const hasErrors = (e: Errors): boolean => Object.values(e).some(Boolean);

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

export const passwordStrength = (pw: string): PasswordStrength => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  const s = score as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: ['Quá ngắn', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][s] };
};

/** At least 8 characters with a letter and a digit. */
export const passwordError = (pw: string): string | undefined => {
  if (pw.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Mật khẩu cần có cả chữ và chữ số';
  return undefined;
};

export type BagField = 'name' | 'category' | 'image' | 'originalPrice' | 'price' | 'quantity' | 'windows' | 'repeatDays' | 'perCustomerLimit';

export const validateBag = (b: BagInput): Errors<BagField> => {
  const e: Errors<BagField> = {};
  if (b.name.trim().length < 2) e.name = b.kind === 'bag' ? 'Nhập tên túi (ít nhất 2 ký tự)' : 'Nhập tên món (ít nhất 2 ký tự)';
  // Only a dish has a group; a Mystery Bag has an internal contents list instead and needs no group.
  if (b.kind === 'food' && !b.category) e.category = 'Chọn nhóm món';
  if (!b.image) e.image = 'Chọn hoặc tải lên ảnh riêng của sản phẩm';
  if (!(b.originalPrice > 0)) e.originalPrice = 'Giá gốc phải lớn hơn 0';
  if (!(b.price > 0)) e.price = 'Giá bán phải lớn hơn 0';
  else if (b.originalPrice > 0 && b.price >= b.originalPrice) e.price = 'Giá bán phải thấp hơn giá gốc';
  if (!Number.isInteger(b.quantity) || b.quantity < 1) e.quantity = 'Số suất phải là số nguyên từ 1';
  if (b.perCustomerLimit !== null && (!Number.isInteger(b.perCustomerLimit) || b.perCustomerLimit < 1))
    e.perCustomerLimit = 'Giới hạn mỗi khách phải từ 1';
  if (b.windows.length === 0) e.windows = 'Thêm ít nhất một khung giờ bán';
  else {
    const sorted = [...b.windows].sort((x, y) => minutesOf(x.start) - minutesOf(y.start));
    for (let i = 0; i < sorted.length; i++) {
      const w = sorted[i];
      if (!/^\d{2}:\d{2}$/.test(w.start) || !/^\d{2}:\d{2}$/.test(w.end)) e.windows = 'Giờ không hợp lệ';
      else if (minutesOf(w.end) <= minutesOf(w.start)) e.windows = 'Giờ kết thúc phải sau giờ bắt đầu';
      else if (!Number.isInteger(w.quantity) || w.quantity < 1) e.windows = 'Mỗi khung giờ cần ít nhất 1 suất';
      else if (i > 0 && minutesOf(w.start) < minutesOf(sorted[i - 1].end)) e.windows = 'Các khung giờ không được chồng nhau';
      if (e.windows) break;
    }
  }
  if (b.repeatDays.length === 0) e.repeatDays = 'Chọn ít nhất một ngày bán';
  return e;
};
