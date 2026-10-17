import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { services } from '@/services';

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spin" style={{ width: 22, height: 22, color: 'var(--g7)' }} aria-hidden="true" />
      <span className="mu">{label}</span>
    </div>
  );
}

export function EmptyState({ icon = 'bag', title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <span className="ico">
        <Icon name={icon} size={20} />
      </span>
      <b style={{ color: 'var(--ink)' }}>{title}</b>
      {children && <p className="mu" style={{ maxWidth: '44ch' }}>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state err" role="alert">
      <span className="ico">
        <Icon name="warn" size={20} />
      </span>
      <b style={{ color: 'var(--ink)' }}>Không tải được dữ liệu</b>
      <p className="mu">{message}</p>
      {onRetry && (
        <Button variant="ghost" small onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

/** Marks a block whose numbers come from the demo service. */
export function DemoTag({ children = 'Dữ liệu mẫu' }: { children?: string }) {
  return services.demo ? <span className="demo-tag">{children}</span> : null;
}
