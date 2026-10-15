import type { Tone } from '@/components/Badge';
import type { WalletTxnStatus } from '@/types';

/** Platform fee taken from every withdrawal, at the moment it is created. Minimum, daily limit and processing time are NOT decided yet (the design marks them "Chờ xác nhận quy tắc"). */
export const PLATFORM_FEE_RATE = 0.1;
export const PLATFORM_FEE_LABEL = '10%';

export const feeOf = (amount: number): number => Math.round(amount * PLATFORM_FEE_RATE);
export const netOf = (amount: number): number => amount - feeOf(amount);

export const WALLET_STATUS: Record<WalletTxnStatus, { label: string; tone: Tone }> = {
  in: { label: 'Đã vào ví', tone: 'g' },
  hold: { label: 'Chờ đơn kết thúc', tone: 'a' },
  outp: { label: 'Đang xử lý', tone: 'b' },
  outd: { label: 'Đã chuyển', tone: 'g' },
  fail: { label: 'Không thành công', tone: 'r' },
};

/** `•••• 4417` */
export const maskAccount = (accountNumber: string): string => `•••• ${accountNumber.slice(-4)}`;

/** A bank account the wallet can pay out to: every field filled and a valid number. */
export const isBankComplete = (b: { bankName: string; accountNumber: string; accountHolder: string }): boolean =>
  !!b.bankName && /^\d{6,20}$/.test(b.accountNumber) && !!b.accountHolder.trim();
