import { useState } from 'react';
import { useToast } from '@/components/Feedback';
import { errorMessage } from '@/hooks/useAsync';
import { ApiError, services } from '@/services';
import type { Bag, BagStatus } from '@/types';
import { ProfileGateModal } from './ProfileGate';

/** Changes a bag's status; a refused publish opens the "complete your profile" dialog. */
export function useBagStatus(returnTo: string, onDone: (b: Bag) => void) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [gate, setGate] = useState(false);

  const change = async (bag: Bag, status: BagStatus) => {
    setBusyId(bag.id);
    try {
      const next = await services.bags.setStatus(bag.id, status);
      toast.success(status === 'live' ? `Đã đăng bán “${bag.name}”` : status === 'paused' ? `Đã tạm dừng “${bag.name}”` : `Đã chuyển “${bag.name}” về nháp`);
      onDone(next);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'profile_incomplete') setGate(true);
      else toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const modal = gate ? <ProfileGateModal returnTo={returnTo} onClose={() => setGate(false)} /> : null;
  return { change, busyId, modal };
}
