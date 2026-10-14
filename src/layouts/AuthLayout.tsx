import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { services } from '@/services';

const STEPS = [
  ['Nhập số điện thoại', 'Số này là tài khoản của quán'],
  ['Xác thực bằng mã OTP', 'Sáu chữ số gửi qua tin nhắn'],
  ['Khai hồ sơ nhà hàng', 'Có thể làm sau'],
];

/** Two-column auth shell. `step` highlights the onboarding step (0-2); omit for sign-in screens. */
export function AuthLayout({ step = 0, head, children }: { step?: number; head?: string; children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="L">
        <div className="brand">
          <img src="/images/mark.jpg" alt="" />
          <span>
            <b>EcoBite</b>
            <small>Quản lý nhà hàng</small>
          </span>
        </div>
        <div>
          <h2>{head ?? 'Bán hết phần đồ ăn còn tốt trước giờ đóng cửa'}</h2>
          <ol className="stl">
            {STEPS.map((s, i) => (
              <li key={s[0]} className={i === step ? 'on' : ''}>
                <span className="n">{i < step ? <Icon name="chk" size={12} /> : i + 1}</span>
                <span>
                  <b>{s[0]}</b>
                  <span className="d">{s[1]}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p style={{ fontSize: 11.5, color: '#7fa893', lineHeight: 1.6 }}>
          {services.demo ? (
            <>
              Đang ở chế độ demo: dữ liệu là dữ liệu mẫu.
              <br />
              Không có tin nhắn nào được gửi.
            </>
          ) : (
            'EcoBite · For a better tomorrow'
          )}
        </p>
      </aside>
      <main className="R">
        <div>{children}</div>
      </main>
    </div>
  );
}
