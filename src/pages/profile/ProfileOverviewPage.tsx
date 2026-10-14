import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { LinkButton } from '@/components/Button';
import { Card } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/States';
import { useAsync } from '@/hooks/useAsync';
import { Page } from '@/layouts/DashboardLayout';
import { services } from '@/services';
import { WEEKDAYS } from '@/utils/bags';
import { completeProfileLink } from '@/utils/profile';

const Line = ({ k, children, missing }: { k: string; children: ReactNode; missing?: boolean }) => (
  <div className="rowline">
    <span className="mu">{k}</span>
    <b style={missing ? { color: 'var(--amb)' } : undefined}>{children || '—'}</b>
  </div>
);

/** 5.1 */
export default function ProfileOverviewPage() {
  const profile = useAsync(() => services.profile.get(), []);
  const done = useAsync(() => services.profile.completeness(), []);
  const p = profile.data;
  const c = done.data;
  const infoOk = c ? ['name', 'businessType'].every((k) => c.checks.find((x) => x.key === k)?.done) : false;
  const contactOk = c ? ['street', 'ward', 'city', 'phone'].every((k) => c.checks.find((x) => x.key === k)?.done) : false;
  const bankOk = c ? ['bankName', 'accountNumber', 'accountHolder'].every((k) => c.checks.find((x) => x.key === k)?.done) : false;
  const hours = p
    ? p.openingHours.map((o, i) => (o.open ? `${WEEKDAYS[i]} ${o.start}–${o.end}` : `${WEEKDAYS[i]} nghỉ`)).join(' · ')
    : '';

  return (
    <Page title="Hồ sơ nhà hàng" sub="Thông tin khách nhìn thấy và nơi EcoBite chuyển tiền về" actions={<LinkButton variant="ghost" to="/profile/edit"><Icon name="edit" size={15} />Chỉnh sửa</LinkButton>}>
      {profile.error || done.error ? <ErrorState message={(profile.error ?? done.error)!} onRetry={() => { profile.reload(); done.reload(); }} /> : !p || !c ? <Loading /> : (
        <>
          {c.canPublish ? (
            <Card tone="ok">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: 'var(--g7)' }}><Icon name="chk" size={20} /></span>
                <div><b style={{ display: 'block', fontSize: 13.5 }}>Hồ sơ đã đủ thông tin</b><span className="mu">Bạn có thể đăng bán sản phẩm.</span></div>
              </div>
            </Card>
          ) : (
            <Card tone="warn">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <span style={{ color: 'var(--amb)' }}><Icon name="warn" size={20} /></span>
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 13.5 }}>Hồ sơ còn thiếu {c.missing.length} mục bắt buộc</b>
                  <span className="mu">Bạn vẫn dùng được Dashboard. Chỉ khi đăng bán sản phẩm mới cần điền đủ.</span>
                </div>
                <Link className="bt" to={completeProfileLink(c.missing[0], '/profile')}>Hoàn thiện ngay</Link>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="mt"><i style={{ width: `${(c.filled / c.total) * 100}%`, background: 'var(--amb)' }} /></div>
                <p className="mu" style={{ marginTop: 6 }}>Đã điền {c.filled} trên {c.total} mục. Còn thiếu: {c.missing.map((m) => m.label.toLowerCase()).join(', ')}.</p>
              </div>
            </Card>
          )}
          <div className="row">
            <Card title="Thông tin nhà hàng" grow="999 1 380px" action={<><Badge tone={infoOk ? 'g' : 'a'}>{infoOk ? 'Đã đủ' : 'Còn thiếu'}</Badge><Link to="/profile/edit" aria-label="Sửa thông tin nhà hàng"><Icon name="edit" size={15} /></Link></>}>
              <Line k="Tên nhà hàng" missing={!p.name}>{p.name}</Line>
              <Line k="Loại hình" missing={!p.businessType}>{p.businessType}</Line>
              <Line k="Giới thiệu">{p.description}</Line>
              <Line k="Địa chỉ" missing={!p.street}>{[p.street, p.ward, p.district, p.city].filter(Boolean).join(', ')}</Line>
              <Line k="Giờ mở cửa">{hours}</Line>
            </Card>
            <div style={{ flex: '1 1 280px', minWidth: 0 }} className="stack">
              <Card title="Liên hệ" action={<><Badge tone={contactOk ? 'g' : 'a'}>{contactOk ? 'Đã đủ' : 'Còn thiếu'}</Badge><Link to="/profile/contact" aria-label="Sửa liên hệ và địa chỉ"><Icon name="edit" size={15} /></Link></>}>
                <Line k="Số điện thoại" missing={!p.phone}>{p.phone}</Line>
                <Line k="Zalo">{p.zalo}</Line>
                <Line k="Xác thực">
                  <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge tone={c.checks.find((x) => x.key === 'phoneVerified')?.done ? 'g' : 'a'} small>SĐT {c.checks.find((x) => x.key === 'phoneVerified')?.done ? 'đã xác thực' : 'chưa xác thực'}</Badge>
                  </span>
                </Line>
              </Card>
              <Card title="Tài khoản nhận tiền" style={bankOk ? undefined : { borderColor: 'var(--amb-ln)' }} action={<><Badge tone={bankOk ? 'g' : 'a'}>{bankOk ? 'Đã đủ' : 'Còn thiếu'}</Badge><Link to="/profile/bank" aria-label="Sửa tài khoản nhận tiền"><Icon name="edit" size={15} /></Link></>}>
                <Line k="Ngân hàng" missing={!p.bank.bankName}>{p.bank.bankName}</Line>
                <Line k="Số tài khoản" missing={!p.bank.accountNumber}>{p.bank.accountNumber ? `•••• ${p.bank.accountNumber.slice(-4)}` : ''}</Line>
                <Line k="Chủ tài khoản" missing={!p.bank.accountHolder}>{p.bank.accountHolder}</Line>
              </Card>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
