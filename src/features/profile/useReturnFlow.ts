import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/Feedback';
import { services } from '@/services';
import { completeProfileLink } from '@/utils/profile';
import { safeReturnTo } from '@/utils/format';

/**
 * Profile forms can be opened from the product flow with `?returnTo=…`.
 * After a save: if the profile can now publish, go back to where the user came from;
 * otherwise guide them to the next missing item, keeping the return target.
 */
export function useReturnFlow(fallback: string) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const returnTo = safeReturnTo(params.get('returnTo'));

  const afterSave = async (message: string) => {
    toast.success(message);
    if (!returnTo) return navigate(fallback);
    // Coming from the wallet: the bank account is all it needs, so do not send the owner to unrelated profile gaps.
    if (returnTo.startsWith('/wallet')) return navigate(returnTo);
    const c = await services.profile.completeness();
    if (c.canPublish) {
      toast.success('Hồ sơ đã đủ thông tin. Quay lại sản phẩm để đăng bán.');
      return navigate(returnTo);
    }
    toast.info(`Còn thiếu: ${c.missing.map((m) => m.label.toLowerCase()).join(', ')}`);
    navigate(completeProfileLink(c.missing[0], returnTo));
  };

  return { returnTo, afterSave, cancelTo: returnTo ?? fallback };
}
