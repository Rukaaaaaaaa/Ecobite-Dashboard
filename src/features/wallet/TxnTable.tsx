import { Link } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import type { WalletTxn } from '@/types';
import { businessTime, shortDate, vnd } from '@/utils/format';
import { feeOf, netOf, PLATFORM_FEE_LABEL, WALLET_STATUS } from '@/utils/wallet';

/** `14/10 09:12` */
export const txnTime = (iso: string): string => `${shortDate(iso)} ${businessTime(iso)}`;

/** Withdrawal codes open the withdrawal detail (6.5); order ids are plain text. */
const CodeCell = ({ t }: { t: WalletTxn }) =>
  t.kind === 'out' ? <Link to={`/wallet/withdrawals/${t.code}`} className="num">{t.code}</Link> : <span className="num">{t.code}</span>;

/** Transactions of the wallet. `withFee` adds the three money columns of 6.2 (taken from wallet, fee, to the bank). */
export function TxnTable({ rows, withFee }: { rows: WalletTxn[]; withFee?: boolean }) {
  return (
    <div className="tbl-wrap">
      <table className="tb">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Nội dung</th>
            <th>Mã</th>
            {withFee ? (
              <>
                <th style={{ textAlign: 'right' }}>Trừ khỏi ví</th>
                <th style={{ textAlign: 'right' }}>Chiết khấu {PLATFORM_FEE_LABEL}</th>
                <th style={{ textAlign: 'right' }}>Về ngân hàng</th>
              </>
            ) : (
              <th style={{ textAlign: 'right' }}>Số tiền</th>
            )}
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const out = t.kind === 'out';
            const status = WALLET_STATUS[t.status];
            return (
              <tr key={t.id}>
                <td className="num">{txnTime(t.at)}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span className={`txn-ico ${out ? 'out' : ''}`}>
                      <Icon name={out ? 'out' : 'dn'} size={14} />
                    </span>
                    {t.title}
                  </span>
                </td>
                <td><CodeCell t={t} /></td>
                <td className="num" style={{ textAlign: 'right' }}>
                  <b style={{ color: out ? 'var(--ink)' : 'var(--g7)' }}>{out ? '−' : '+'}{vnd(t.amount)}</b>
                </td>
                {withFee && (
                  <>
                    <td className="num" style={{ textAlign: 'right', color: out ? 'var(--red)' : 'var(--ink3)' }}>{out ? `−${vnd(feeOf(t.amount))}` : '—'}</td>
                    <td className="num" style={{ textAlign: 'right' }}><b>{out ? vnd(netOf(t.amount)) : '—'}</b></td>
                  </>
                )}
                <td><Badge tone={status.tone}>{status.label}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
