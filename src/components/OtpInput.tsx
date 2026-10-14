import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

const LENGTH = 6;

/** Six single-digit boxes. Controlled by a string of up to six digits; supports paste and backspace. */
export function OtpInput({ value, onChange, error, disabled, autoFocus }: { value: string; onChange: (v: string) => void; error?: boolean; disabled?: boolean; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Keystrokes can arrive faster than React re-renders: always build the next value from the latest one.
  const latest = useRef(value);
  latest.current = value;
  const emit = (next: string) => {
    latest.current = next;
    onChange(next);
  };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  const set = (i: number, digit: string) => {
    const chars = latest.current.padEnd(LENGTH, ' ').split('');
    chars[i] = digit || ' ';
    emit(chars.join('').trimEnd().replace(/ /g, ''));
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !latest.current[i]) {
      e.preventDefault();
      if (i > 0) {
        emit(latest.current.slice(0, i - 1) + latest.current.slice(i));
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!digits) return;
    e.preventDefault();
    emit(digits);
    focus(digits.length);
  };

  return (
    <div className={`otp ${error ? 'err' : ''}`} role="group" aria-label="Mã xác thực sáu chữ số">
      {Array.from({ length: LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Chữ số ${i + 1}`}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1);
            set(i, d);
            if (d) focus(i + 1);
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
