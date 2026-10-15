import type { WalletSummary, Withdrawal } from '@/types';
import { feeOf, isBankComplete, maskAccount } from '@/utils/wallet';
import { ApiError, type WalletService } from '../types';
import { delay, demoDb } from './db';
import { DEMO_CODE } from './fixtures';

const MAX_ATTEMPTS = 3;
const RESEND_SECONDS = 30;
const CODE_TTL_MS = 2 * 60 * 1000;

/**
 * Demo wallet. No money moves and no bank is called. The withdrawal code is the constant DEMO_CODE
 * (no SMS), kept only in memory like the sign-in codes. A confirmed withdrawal stays "Đang xử lý":
 * how long the bank takes is not decided yet, so the demo never completes it by itself.
 */
const issuedAt = new Map<string, number>();
const attempts = new Map<string, number>();

const lastNumber = (rows: { code: string }[]): number => rows.reduce((m, r) => Math.max(m, Number(r.code.replace(/\D/g, '')) || 0), 250_000);

const find = (code: string): Withdrawal => {
  const w = demoDb.store().wallet.withdrawals.find((x) => x.code === code);
  if (!w) throw new ApiError('not_found', 'Không tìm thấy lệnh rút này');
  return w;
};

export const demoWallet: WalletService = {
  async summary() {
    await delay();
    const { wallet, profile } = demoDb.store();
    const last = wallet.txns.find((t) => t.kind === 'out');
    const out: WalletSummary = {
      available: wallet.available,
      holding: wallet.holding,
      bank: isBankComplete(profile.bank) ? { ...profile.bank } : null,
      lastWithdrawal: last ? { code: last.code, status: last.status } : null,
      period: { ...wallet.period },
    };
    return out;
  },

  async transactions() {
    await delay();
    return structuredClone(demoDb.store().wallet.txns);
  },

  async startWithdrawal(amount) {
    await delay();
    const { wallet, profile } = demoDb.store();
    if (!isBankComplete(profile.bank)) throw new ApiError('bank_missing', 'Cần khai tài khoản ngân hàng trước khi rút tiền');
    if (!Number.isInteger(amount) || amount <= 0) throw new ApiError('invalid_amount', 'Nhập số tiền muốn rút');
    if (amount > wallet.available) throw new ApiError('insufficient_funds', 'Số tiền vượt quá số dư khả dụng');
    // A withdrawal that was never confirmed is simply replaced: only one can be waiting for its code.
    wallet.withdrawals = wallet.withdrawals.filter((w) => w.status !== 'awaiting_otp');
    const fee = feeOf(amount);
    const w: Withdrawal = {
      code: `RT${lastNumber(wallet.withdrawals) + 1}`,
      amount,
      fee,
      net: amount - fee,
      status: 'awaiting_otp',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      balanceBefore: wallet.available,
      bank: { ...profile.bank },
    };
    wallet.withdrawals.unshift(w);
    return structuredClone(w);
  },

  async getWithdrawal(code) {
    await delay(120);
    return structuredClone(find(code));
  },

  async sendWithdrawalCode(code) {
    await delay();
    if (find(code).status !== 'awaiting_otp') throw new ApiError('already_confirmed', 'Lệnh rút này đã được xác thực');
    attempts.set(code, 0);
    issuedAt.set(code, Date.now());
    return { resendAfterSeconds: RESEND_SECONDS };
  },

  async confirmWithdrawal(code, otp) {
    await delay();
    const store = demoDb.store();
    const w = find(code);
    if (w.status !== 'awaiting_otp') throw new ApiError('already_confirmed', 'Lệnh rút này đã được xác thực');
    const at = issuedAt.get(code);
    if (at === undefined || Date.now() - at > CODE_TTL_MS) {
      issuedAt.delete(code);
      throw new ApiError('code_expired', 'Mã đã hết hạn. Hãy bấm “Gửi lại mã” để nhận mã mới.');
    }
    const used = attempts.get(code) ?? 0;
    if (used >= MAX_ATTEMPTS) throw new ApiError('too_many_attempts', 'Nhập sai quá nhiều lần. Hãy yêu cầu mã mới.', { attemptsLeft: 0 });
    if (otp !== DEMO_CODE) {
      attempts.set(code, used + 1);
      const left = MAX_ATTEMPTS - used - 1;
      throw new ApiError('code_invalid', left > 0 ? `Mã không đúng. Còn ${left} lần thử.` : 'Nhập sai quá nhiều lần. Hãy yêu cầu mã mới.', { attemptsLeft: left });
    }
    // The balance may have changed since the withdrawal was created: check again right before taking the money.
    if (w.amount > store.wallet.available) throw new ApiError('insufficient_funds', 'Số dư không còn đủ cho lệnh rút này');
    issuedAt.delete(code);
    attempts.delete(code);
    w.status = 'processing';
    w.verifiedAt = new Date().toISOString();
    w.balanceBefore = store.wallet.available;
    store.wallet.available -= w.amount;
    store.wallet.txns.unshift({
      id: demoDb.nextId('wt'),
      at: w.verifiedAt,
      kind: 'out',
      title: `Rút về ${w.bank.bankName} ${maskAccount(w.bank.accountNumber)}`,
      code: w.code,
      amount: w.amount,
      status: 'outp',
    });
    return structuredClone(w);
  },
};
