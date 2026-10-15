import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { LinkButton } from '@/components/Button';
import { useToast } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { useAccount } from '@/features/auth/AuthContext';
import { OtpPanel } from '@/features/auth/OtpPanel';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import { vnd } from '@/utils/format';
import { maskAccount, PLATFORM_FEE_LABEL } from '@/utils/wallet';

/** +84 912 ••• 678 */
const maskedPhone = (local: string): string => `+84 ${local.slice(1, 4)} ••• ${local.slice(7)}`;

/** 6.4 — the money only leaves the wallet after the code is confirmed. */
export default function WithdrawVerifyPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const account = useAccount();
  const q = useAsync(() => services.wallet.getWithdrawal(code), [code]);
  const w = q.data;

  if (q.error) return <Page title="Xác thực lệnh rút"><ErrorState message={q.error} onRetry={q.reload} /></Page>;
  if (!w) return <Page title="Xác thực lệnh rút"><Loading /></Page>;
  if (w.status !== 'awaiting_otp') return <Navigate to={`/wallet/withdrawals/${w.code}`} replace />;

  return (
    <Page title="Xác thực lệnh rút" sub="Mã sáu số gửi về số điện thoại của chủ quán" actions={<LinkButton variant="ghost" to="/wallet/withdraw"><Icon name="back" size={16} />Quay lại</LinkButton>}>
      <div style={{ maxWidth: 520, margin: '14px auto 0', width: '100%' }}>
        <div className="cd pd" style={{ padding: 26 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="big-ico" style={{ margin: '0 auto 12px' }}><Icon name="msg" size={26} /></span>
            <h2 style={{ fontSize: 19, marginBottom: 5 }}>Nhập mã xác thực</h2>
            <p className="mu" style={{ margin: 0, fontSize: 12.5 }}>Mã gửi tới <b style={{ color: 'var(--ink)' }}>{maskedPhone(account.phone)}</b>, số đã đăng ký tài khoản.</p>
          </div>
          <div className="cd pd" style={{ background: 'var(--soft)', marginBottom: 18 }}>
            <div className="rowline"><span className="mu">Trừ khỏi ví</span><b className="num">{vnd(w.amount)}</b></div>
            <div className="rowline"><span className="mu">Chiết khấu nền tảng {PLATFORM_FEE_LABEL}</span><b className="num" style={{ color: 'var(--red)' }}>−{vnd(w.fee)}</b></div>
            <div className="rowline"><span className="mu">Về {w.bank.bankName} {maskAccount(w.bank.accountNumber)}</span><b className="num" style={{ color: 'var(--g7)', fontSize: 15 }}>{vnd(w.net)}</b></div>
          </div>
          <OtpPanel
            send={() => services.wallet.sendWithdrawalCode(w.code)}
            verify={async (otp) => {
              const done = await services.wallet.confirmWithdrawal(w.code, otp);
              toast.success(`Đã tạo lệnh rút ${done.code}`);
              navigate(`/wallet/withdrawals/${done.code}`, { replace: true });
            }}
            submitLabel="Xác nhận rút tiền"
          />
        </div>
      </div>
    </Page>
  );
}
