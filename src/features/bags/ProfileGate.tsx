import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { completeProfileLink } from '@/utils/profile';

/**
 * Shown when someone tries to put a product on sale while the restaurant profile is incomplete.
 * The dashboard stays usable; only publishing is blocked. `returnTo` brings the user back to the bag afterwards.
 */
export function ProfileGateModal({ returnTo, onClose, savedAsDraft }: { returnTo: string; onClose: () => void; savedAsDraft?: boolean }) {
  const q = useAsync(() => services.profile.completeness(), []);
  const missing = q.data?.missing ?? [];
  return (
    <Modal title="Hoàn thiện hồ sơ để đăng bán" onClose={onClose}>
      {savedAsDraft && <p className="note ok" style={{ marginBottom: 12 }}>Sản phẩm của bạn đã được lưu nháp, không mất dữ liệu.</p>}
      <p className="mu" style={{ marginBottom: 12 }}>Cần đủ các mục sau trước khi sản phẩm được bán trên ứng dụng khách. Bạn vẫn dùng được Dashboard bình thường.</p>
      {q.error ? <ErrorState message={q.error} onRetry={q.reload} /> : !q.data ? <Loading /> : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {missing.map((m) => (
            <li key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid var(--ln)', fontSize: 12.5 }}>
              <span style={{ color: 'var(--amb)', display: 'grid' }}><Icon name="warn" size={15} /></span>
              <span style={{ flex: 1 }}>{m.label}</span>
              <Link to={completeProfileLink(m, returnTo)} onClick={onClose} style={{ fontSize: 12 }}>Điền ngay</Link>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Để sau</Button>
        {missing[0] && <Link className="bt" to={completeProfileLink(missing[0], returnTo)} onClick={onClose}>Hoàn thiện hồ sơ</Link>}
      </div>
    </Modal>
  );
}
