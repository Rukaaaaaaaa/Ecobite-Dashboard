import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { OtpInput } from '@/components/OtpInput';
import { useCountdown } from '@/hooks/useCountdown';
import { errorMessage } from '@/hooks/useAsync';
import { ApiError, demoHints } from '@/services';

/**
 * Shared "enter the six digit code" block: resend countdown, attempts left, error state.
 * `send` asks the service to issue a code (demo: nothing is sent), `verify` checks it.
 */
export function OtpPanel({ send, verify, submitLabel, autoSend = true, initialCountdown = 0 }: {
  send: () => Promise<{ resendAfterSeconds: number }>;
  verify: (code: string) => Promise<void>;
  submitLabel: string;
  autoSend?: boolean;
  /** Seconds before “Gửi lại mã” unlocks, when the caller already sent the first code. */
  initialCountdown?: number;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const cd = useCountdown();
  const sent = useRef(false);

  const doSend = async (clear = true) => {
    setSending(true);
    setError(null);
    try {
      const r = await send();
      cd.start(r.resendAfterSeconds);
      if (clear) setCode('');
      setBlocked(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (initialCountdown > 0 && !sent.current) cd.start(initialCountdown);
    if (autoSend && !sent.current) {
      sent.current = true;
      void doSend(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (code.length !== 6) {
      setError('Nhập đủ sáu chữ số');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verify(code);
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError && e.extra?.attemptsLeft === 0) setBlocked(true);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      noValidate
    >
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} error={!!error} disabled={blocked || busy} autoFocus />
      {error && (
        <p className="field-err" role="alert">
          <Icon name="warn" size={14} />
          {error}
        </p>
      )}
      <div className="flex-between" style={{ margin: '16px 0 18px' }}>
        <span className="mu">
          {cd.seconds > 0 ? (
            <>Gửi lại mã sau <b className="num" style={{ color: 'var(--ink)' }}>{cd.label}</b></>
          ) : (
            'Chưa nhận được mã?'
          )}
        </span>
        <button type="button" className="bt gh sm" disabled={cd.seconds > 0 || sending} onClick={() => void doSend()}>
          {sending ? 'Đang gửi…' : 'Gửi lại mã'}
        </button>
      </div>
      <Button type="submit" block loading={busy} disabled={blocked || code.length !== 6}>
        {submitLabel}
      </Button>
      {demoHints && (
        <div className="note warn" style={{ marginTop: 16 }}>
          <b>Chế độ demo.</b> Không có tin nhắn nào được gửi. Nhập mã <b className="num">{demoHints.code}</b> để tiếp tục.
        </div>
      )}
    </form>
  );
}
