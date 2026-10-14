import type { Account, ProfileCheck, ProfileCompleteness, RestaurantProfile } from '@/types';

/**
 * What a restaurant needs before a product can go on sale: the required profile fields,
 * the payout account and a verified phone. The dashboard itself stays usable without them.
 * (The backend must enforce the same rule; this copy only drives the UI.)
 */
export const computeCompleteness = (p: RestaurantProfile, a: Pick<Account, 'phoneVerified'>): ProfileCompleteness => {
  const filled = (s: string) => s.trim().length > 0;
  const checks: ProfileCheck[] = [
    { key: 'name', label: 'Tên nhà hàng', done: filled(p.name), to: '/profile/edit' },
    { key: 'businessType', label: 'Loại hình kinh doanh', done: filled(p.businessType), to: '/profile/edit' },
    { key: 'street', label: 'Số nhà và tên đường', done: filled(p.street), to: '/profile/contact' },
    { key: 'ward', label: 'Phường, xã', done: filled(p.ward), to: '/profile/contact' },
    { key: 'city', label: 'Tỉnh, thành phố', done: filled(p.city), to: '/profile/contact' },
    { key: 'phone', label: 'Số điện thoại nhà hàng', done: filled(p.phone), to: '/profile/contact' },
    { key: 'bankName', label: 'Ngân hàng nhận tiền', done: filled(p.bank.bankName), to: '/profile/bank' },
    { key: 'accountNumber', label: 'Số tài khoản', done: filled(p.bank.accountNumber), to: '/profile/bank' },
    { key: 'accountHolder', label: 'Tên chủ tài khoản', done: filled(p.bank.accountHolder), to: '/profile/bank' },
    { key: 'phoneVerified', label: 'Xác thực số điện thoại', done: a.phoneVerified, to: '/verify-phone' },
  ];
  const missing = checks.filter((c) => !c.done);
  return { filled: checks.length - missing.length, total: checks.length, missing, checks, canPublish: missing.length === 0 };
};

/** Route to finish the profile, remembering where to come back to. */
export const completeProfileLink = (check: ProfileCheck | undefined, returnTo: string): string =>
  `${check?.to ?? '/profile'}?returnTo=${encodeURIComponent(returnTo)}`;
