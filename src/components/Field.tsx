import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

interface FieldShell {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  ok?: string;
}

function Shell({ id, label, required, error, hint, ok, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div>
      {label && (
        <label className="lb" htmlFor={id}>
          {label} {required && <span className="rq" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-err" id={`${id}-msg`} role="alert">
          <Icon name="warn" size={14} />
          {error}
        </p>
      ) : ok ? (
        <p className="field-ok" id={`${id}-msg`}>
          <Icon name="chk" size={14} />
          {ok}
        </p>
      ) : hint ? (
        <p className="mu field-hint" id={`${id}-msg`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextProps = FieldShell & { icon?: IconName } & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, required, error, hint, ok, icon, className, ...rest }: TextProps) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} error={error} hint={hint} ok={ok}>
      <div className="ip-wrap">
        {icon && (
          <span className="lead">
            <Icon name={icon} size={16} />
          </span>
        )}
        <input {...rest} id={id} className={`ip ${error ? 'err' : ''} ${className ?? ''}`} aria-invalid={!!error} aria-describedby={error || hint || ok ? `${id}-msg` : undefined} aria-required={required} />
      </div>
    </Shell>
  );
}

/** Vietnamese mobile number input: fixed "+84" prefix, the user types the rest (0912…, 912… or +84…). */
export function PhoneField({ label, required, error, hint, ok, className, ...rest }: FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} error={error} hint={hint} ok={ok}>
      <div style={{ display: 'flex', gap: 8 }}>
        <span className="ip" aria-hidden="true" style={{ width: 70, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--soft)', fontWeight: 600, gap: 5 }}>
          <svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#DA251D" /><path d="M15 4.6l1.47 4.52h4.75l-3.84 2.8 1.47 4.52L15 13.63l-3.85 2.8 1.47-4.51-3.84-2.8h4.75z" fill="#FF0" /></svg>
          +84
        </span>
        <input {...rest} id={id} type="tel" inputMode="tel" autoComplete="tel" placeholder={rest.placeholder ?? '912 345 678'} className={`ip ${error ? 'err' : ''} ${className ?? ''}`} style={{ flex: 1, minWidth: 0 }} aria-invalid={!!error} aria-describedby={error || hint || ok ? `${id}-msg` : undefined} aria-required={required} />
      </div>
    </Shell>
  );
}
export function PasswordField(props: Omit<TextProps, 'type' | 'icon'>) {
  const [show, setShow] = useState(false);
  const id = useId();
  const { label, required, error, hint, ok, className, ...rest } = props;
  return (
    <Shell id={id} label={label} required={required} error={error} hint={hint} ok={ok}>
      <div className="ip-wrap">
        <span className="lead">
          <Icon name="lock" size={16} />
        </span>
        <input {...rest} id={id} type={show ? 'text' : 'password'} className={`ip ${error ? 'err' : ''} ${className ?? ''}`} aria-invalid={!!error} aria-describedby={error || hint || ok ? `${id}-msg` : undefined} aria-required={required} />
        <button type="button" className="trail" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          <Icon name={show ? 'eyeoff' : 'eye'} size={16} />
        </button>
      </div>
    </Shell>
  );
}

export function TextArea({ label, required, error, hint, ok, className, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} error={error} hint={hint} ok={ok}>
      <textarea {...rest} id={id} className={`ip ${error ? 'err' : ''} ${className ?? ''}`} aria-invalid={!!error} aria-describedby={error || hint || ok ? `${id}-msg` : undefined} />
    </Shell>
  );
}

export function SelectField({
  label, required, error, hint, options, placeholder, ...rest
}: FieldShell & { options: string[]; placeholder?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} error={error} hint={hint}>
      <select {...rest} id={id} className={`ip ${error ? 'err' : ''}`} aria-invalid={!!error}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function Checkbox({ children, ...rest }: { children: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className="check">
      <input {...rest} type="checkbox" />
      <span className="box">
        <Icon name="chk" size={11} />
      </span>
      <span>{children}</span>
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

export function PasswordStrengthBar({ score, label }: { score: number; label: string }) {
  return (
    <div aria-live="polite">
      <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? 'var(--g6)' : 'var(--ln)' }} />
        ))}
      </div>
      <p className="mu" style={{ marginTop: 6 }}>
        Độ mạnh: {label}. Ít nhất 8 ký tự, có chữ và chữ số.
      </p>
    </div>
  );
}
