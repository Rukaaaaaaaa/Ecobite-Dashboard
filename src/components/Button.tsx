import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'ghost' | 'danger';

interface Common {
  variant?: Variant;
  small?: boolean;
  block?: boolean;
  children: ReactNode;
}

const cls = ({ variant = 'primary', small, block }: Common): string =>
  ['bt', variant === 'ghost' ? 'gh' : variant === 'danger' ? 'dg' : '', small ? 'sm' : '', block ? 'block' : ''].filter(Boolean).join(' ');

export function Button({
  variant,
  small,
  block,
  loading,
  children,
  disabled,
  type = 'button',
  ...rest
}: Common & { loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={type} className={cls({ variant, small, block, children })} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading && <span className="spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function LinkButton({ variant, small, block, children, ...rest }: Common & LinkProps) {
  return (
    <Link {...rest} className={cls({ variant, small, block, children })}>
      {children}
    </Link>
  );
}
