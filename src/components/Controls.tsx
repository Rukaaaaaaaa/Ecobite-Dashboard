import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Sparkline } from './charts';

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chp" aria-pressed={active} onClick={onClick}>
      {children}
      {count !== undefined && <span className="n num">{count}</span>}
    </button>
  );
}

export function Kpi({
  icon, label, value, delta, deltaSuffix, amber, spark,
}: { icon: IconName; label: string; value: ReactNode; delta?: ReactNode; deltaSuffix?: string; amber?: boolean; spark?: number[] }) {
  return (
    <div className="cd kp" style={spark ? { paddingBottom: 0 } : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span className={`ic ${amber ? 'amber' : ''}`}>
          <Icon name={icon} size={16} />
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{label}</span>
      </div>
      <div className="v num">{value}</div>
      {delta !== undefined && (
        <div className={`d ${amber ? 'amber' : ''}`}>
          <Icon name={amber ? 'clock' : 'up'} size={13} />
          {delta}
          {deltaSuffix && <span className="mu">{deltaSuffix}</span>}
        </div>
      )}
      {spark && (
        <div style={{ margin: '3px -15px 0' }}>
          <Sparkline values={spark} color={amber ? 'var(--amb)' : 'var(--g6)'} />
        </div>
      )}
    </div>
  );
}

export function Card({ title, icon, action, children, tone, className, grow, style }: { title?: ReactNode; icon?: IconName; action?: ReactNode; children: ReactNode; tone?: 'ok' | 'warn'; className?: string; /** flex shorthand when the card sits in a `.row` */ grow?: string; style?: CSSProperties }) {
  return (
    <section className={`cd pd ${tone ? `tone-${tone}` : ''} ${className ?? ''}`} style={grow ? { flex: grow, minWidth: 0, ...style } : style}>
      {title && (
        <h2 className="ttl">
          {icon && (
            <span style={{ color: 'var(--g7)', display: 'grid' }}>
              <Icon name={icon} size={16} />
            </span>
          )}
          <span className="gro">{title}</span>
          {action}
        </h2>
      )}
      {children}
    </section>
  );
}

export function Note({ tone, children }: { tone?: 'warn' | 'ok' | 'err'; children: ReactNode }) {
  return <div className={`note ${tone ?? ''}`}>{children}</div>;
}

export function Pager({ page, pages, total, shown, onPage }: { page: number; pages: number; total: number; shown: number; onPage: (p: number) => void }) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="pager">
      <span className="mu">
        Hiện {shown} trên {total} đơn
      </span>
      {pages > 1 && (
        <nav className="pages" aria-label="Phân trang">
          <button type="button" className="bt gh sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Trước
          </button>
          {nums.map((n, i) => (
            <span key={n} style={{ display: 'contents' }}>
              {i > 0 && n - nums[i - 1] > 1 && <span className="mu" style={{ alignSelf: 'center' }}>…</span>}
              <button type="button" className={`bt sm ${n === page ? '' : 'gh'}`} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>
                {n}
              </button>
            </span>
          ))}
          <button type="button" className="bt gh sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
