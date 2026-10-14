# EcoBite Restaurant Dashboard (frontend)

Ứng dụng web độc lập cho chủ nhà hàng quản lý đơn hàng, sản phẩm (đồ ăn và Mystery Bag) và hồ sơ. React + TypeScript + Vite, giao diện tiếng Việt, dựng theo bộ **29 màn** thiết kế trong `references/ecobite-dashboard-29-screens.html` (5 nhóm). File `ecobite-dashboard-29-screens.html` là nguồn chuẩn.

> **Trạng thái: chạy hoàn toàn ở chế độ DEMO.** Mọi dữ liệu (đơn, túi, hồ sơ, số liệu) là dữ liệu mẫu nằm trong bộ nhớ trình duyệt. Chưa gọi backend EcoBite nào, không tin nhắn SMS nào được gửi. Tải lại trang là về trạng thái ban đầu. Xem mục "API còn thiếu".

## Chạy trên máy

Cần Node 20 trở lên (đã thử với Node 24).

```bash
cd Ecobite-Dashboard
npm install
npm run dev          # http://localhost:5174  (cổng cố định, không trùng Expo 8081 / backend 3000)
```

Các lệnh khác:

```bash
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build production vào dist/
npm run preview      # chạy bản build ở cổng 5174
```

Chưa cấu hình ESLint. Biến môi trường (không bắt buộc ở chế độ demo): xem `.env.example` (`VITE_API_URL`). Mọi biến `VITE_*` đều công khai trong bundle, không đặt bí mật vào đó.

## Đăng nhập thử (chỉ chế độ demo)

Tài khoản là **số điện thoại**; không còn email ở bất kỳ màn nào.

| | |
|---|---|
| Số điện thoại / mật khẩu | `0912 345 678` / `EcoBite123` |
| Mã OTP (đăng ký, đăng nhập bằng mã, quên mật khẩu) | `123456`. Nhập sai 3 lần thì khoá, mã hết hạn sau 2 phút, “Gửi lại mã” mở sau 30 giây |
| Mã nhận hàng thử | `ECO-8F2K` (đơn #EB001243, đang chờ khách lấy) |

Đăng ký tài khoản mới (họ tên, số điện thoại, mật khẩu) rồi nhập mã OTP; xác thực xong vào thẳng Dashboard. Tài khoản mới là một nhà hàng trống, dùng để xem các trạng thái rỗng và luồng “hoàn thiện hồ sơ để đăng bán”. Quên mật khẩu: số điện thoại → mã OTP → mật khẩu mới (một route `/forgot-password`, ba bước). Dữ liệu đăng nhập/OTP chỉ nằm trong bộ nhớ, không ghi `localStorage`; tải lại trang là phải đăng nhập lại. (Chỉ lựa chọn bật/tắt thông báo ở Cài đặt được lưu trên trình duyệt.)

## Đã làm được (29 màn)

| Nhóm | Màn | Route |
|---|---|---|
| 1. Tài khoản và xác thực | 1.1 Đăng nhập (SĐT + mật khẩu, hoặc mã OTP), 1.2 Đăng ký (không email), 1.3 Xác thực bằng mã OTP, 1.4 Quên mật khẩu, 1.5 Đặt mật khẩu mới | `/login` `/register` `/verify-phone` `/forgot-password` (`/reset-password` chuyển về đây) |
| 2. Tổng quan quản lý | 2.1 Dashboard, 2.2 Phân tích doanh thu, 2.3 Phân tích đơn hàng, 2.4 Đơn cần xử lý, 2.5 Sản phẩm sắp hết | `/` `/analytics/revenue` `/analytics/orders` `/orders/pending` `/products/expiring` |
| 3. Quản lý đơn hàng | 3.1 Danh sách (tìm, lọc trạng thái, phân trang, xuất CSV, phân biệt đồ ăn / Mystery Bag), 3.2 Chi tiết, 3.3 Xử lý (xác nhận → soạn xong), 3.4 Xác minh mã nhận hàng, 3.5 Lịch sử | `/orders` `/orders/:id` `/orders/:id/process` `/orders/verify` `/orders/history` |
| 4. Quản lý sản phẩm | 4.1 Danh sách (lọc theo loại và trạng thái), 4.2 Chọn loại sản phẩm, 4.3 Tạo đồ ăn mới, 4.4 Tạo Mystery Bag, 4.5 Chỉnh sửa (đổi được loại), 4.6 Giá và số lượng, 4.7 Khung giờ, 4.8 Xem trước và kiểm tra, 4.9 Bảng trạng thái | `/products` `/products/new` `/products/new/food` `/products/new/bag` `/products/:id/edit?step=info|pricing|schedule|preview` `/products/status` (`/bags/*` cũ chuyển sang `/products/*`) |
| 5. Hồ sơ nhà hàng và cài đặt | 5.1 Tổng quan hồ sơ, 5.2 Thông tin và giờ mở cửa, 5.3 Liên hệ và địa chỉ (SĐT, Zalo), 5.4 Tài khoản nhận tiền, 5.5 Cài đặt (đổi số, đổi mật khẩu, bật/tắt đăng nhập OTP, thông báo) | `/profile` `/profile/edit` `/profile/contact` `/profile/bank` `/settings` |

Sản phẩm có hai loại, giữ riêng từ đường dẫn tới dữ liệu: **đồ ăn** (có *nhóm món* bắt buộc) và **Mystery Bag** (có *danh sách món nội bộ*, khách không thấy). Đổi loại trong form thì các trường đặc thù của loại kia bị bỏ khi lưu. Bước 1–4 của form tương ứng 4.3–4.8 của thiết kế (4.6 = bước Giá và số lượng, 4.7 = Khung giờ, 4.8 = Xem trước).

Hành vi đáng chú ý:

- **Vào Dashboard khi hồ sơ chưa đủ.** Chỉ khi đăng bán sản phẩm mới bị chặn: sản phẩm được lưu nháp, hiện hộp thoại liệt kê mục còn thiếu (kể cả xác thực số điện thoại), dẫn tới đúng trang cần điền (`?returnTo=`), và sau khi đủ thì quay lại bước xem trước.
- **Vòng đời đơn** chỉ gồm thao tác đã có quy tắc: Chờ xác nhận → Đã xác nhận → Chờ khách lấy → Hoàn thành (giao bằng nhập mã). **Từ chối đơn đã thanh toán và hoàn tiền bị khoá** (hiện rõ “Chờ xác nhận quy tắc”), không tự thêm trạng thái.
- Mã nhận hàng bị che trên chi tiết đơn tới khi đã giao; số điện thoại khách luôn che bớt.
- Ảnh sản phẩm: chọn ảnh mẫu hoặc tải ảnh riêng (JPG/PNG/WebP, tối đa 2 MB). Ở demo ảnh tải lên chỉ nằm trong trình duyệt. Không có logo, ảnh bìa.
- Responsive: sidebar thành ngăn kéo dưới 900px, không tràn ngang ở 390px.

## Cấu trúc

```
src/
  app/        App.tsx (router, lazy routes)
  layouts/    AuthLayout, DashboardLayout (sidebar, header, <Page>)
  pages/      auth/ overview/ orders/ bags/ profile/
  features/   auth (context, OtpPanel), orders (OrdersTable), bags (hộp thoại chặn hồ sơ, đổi trạng thái), profile (luồng quay lại)
  components/ UI dùng chung: Button, Field, Badge, Controls, charts (SVG), States, Feedback (toast, modal), OtpInput, Icon
  services/   types.ts (hợp đồng service)  index.ts (nơi DUY NHẤT chọn demo/thật)  http.ts (client cho backend, chưa dùng)  demo/ (dữ liệu và service mẫu)
  types/ utils/ hooks/ styles/
```

Quy ước: UI chỉ gọi `services.*` từ `@/services`, không import thư mục `services/demo`. Muốn nối backend thật, viết bản `http` cho từng service (dùng `services/http.ts`) rồi đổi dòng tương ứng trong `services/index.ts`. Không trộn demo và thật trong cùng một màn.

## API còn thiếu (backend hiện tại chưa có, đã kiểm tra mã nguồn `backend/`)

Không có gì dưới đây được giả lập như thể đã hoạt động; tất cả đang là demo.

1. **Danh tính chủ nhà hàng**: chưa có `role` chủ nhà hàng (backend chỉ ghi `customer`), không có liên kết nhà hàng ↔ chủ sở hữu, không có kiểm tra quyền theo nhà hàng.
2. **OTP SMS và đăng nhập bằng SĐT**: backend không có SMS, không có đăng nhập bằng số điện thoại; `phoneVerified` luôn false. Màn OTP ở đây là demo (mã cố định `123456`), **không có tin nhắn thật nào được gửi**.
3. **Đặt lại mật khẩu bằng SĐT, đổi mật khẩu, đổi số đăng nhập, tắt/bật đăng nhập OTP**: chưa có endpoint.
4. **Đơn của nhà hàng**: chưa có danh sách/chi tiết theo nhà hàng có xác thực. Chỉ có các route `/api/dev/*` **không xác thực** (`advance`, `staff-scan`) và dev-only, tuyệt đối không dùng cho production.
5. **Trạng thái đơn**: backend là `placed → paid → preparing → ready → qr_verified → picked_up (+ cancelled/expired)`. Thiết kế dùng Chờ xác nhận / Đã xác nhận / Chờ khách lấy / Hoàn thành / Khách không lấy / Khách đã huỷ. Cách ánh xạ đề xuất nằm trong `src/types/index.ts`, cần xác nhận. “Khách không lấy” chưa có trạng thái tương ứng; từ chối/hoàn tiền chưa có quy tắc.
6. **Sản phẩm (`foodbags`)**: chưa có API tạo/sửa/tạm dừng; mô hình chưa có loại sản phẩm (đồ ăn / Mystery Bag), nhóm món, danh sách món nội bộ, trạng thái nháp/đang bán/tạm dừng, nhiều khung giờ bán và nhận, ngày lặp lại, giới hạn mỗi khách, ảnh riêng (chỉ có `art` là mã ảnh mẫu) và upload ảnh.
7. **Hồ sơ nhà hàng**: thiếu loại hình, mô tả, giờ mở cửa, chỉ dẫn, Zalo, chủ sở hữu, **tài khoản ngân hàng nhận tiền** (không có trong mô hình), kỳ đối soát.
8. **Số liệu**: không có API doanh thu, KPI, phân tích, tác động môi trường.
9. **Quét QR bằng camera**: chưa làm, hiện chỉ nhập mã tay.
10. Ghi nhớ đăng nhập: chưa làm có chủ đích (cần cơ chế token an toàn từ backend, không lưu token/mật khẩu vào `localStorage`).

Việc đổi mô hình dữ liệu dùng chung cần đề xuất trước và được người phụ trách cơ sở dữ liệu duyệt; frontend này không sửa backend hay database.

## Đã kiểm tra

`npm run typecheck` và `npm run build` sạch. Chưa có ESLint và chưa có bộ test tự động trong repo. Kiểm thử trình duyệt thật (Chrome headless qua DevTools protocol, 60 kiểm tra chạy 3 lần liên tiếp, không có lỗi console) đã chạy qua: đăng nhập SĐT (sai mật khẩu, SĐT sai), đăng nhập bằng OTP (mã sai, mã hết hạn, tài khoản đã tắt OTP), đăng ký (kiểm tra từng ô, SĐT trùng), OTP SĐT (sai, khoá sau 3 lần, hết hạn, đúng), quên mật khẩu 3 bước rồi đăng nhập bằng mật khẩu mới, mọi route của 29 màn, chọn loại sản phẩm → form đồ ăn / Mystery Bag (validate, lưu nháp, thêm/bỏ khung giờ, hộp thoại chặn hồ sơ), tạm dừng sản phẩm, xác nhận đơn, xác minh mã nhận hàng, bật/tắt OTP ở Cài đặt, trạng thái rỗng của tài khoản mới và không tràn ngang ở 390px. Script kiểm thử không nằm trong repo.
