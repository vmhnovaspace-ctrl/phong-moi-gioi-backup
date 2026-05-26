# Module 03 — Auth & Role Permission

Tài liệu này giải thích Module 03 cho người không chuyên kỹ thuật. Mục tiêu là sau này mở lại vẫn hiểu hệ thống đăng ký, đăng nhập, phân quyền đang hoạt động như thế nào.

---

## 1. Module 03 đã làm gì

Module 03 xây nền đăng nhập và phân quyền cho project **Kho Phòng Realtime**.

Các việc đã hoàn thành:

- Người dùng đăng ký bằng họ tên, số điện thoại, mật khẩu và vai trò.
- Người dùng đăng nhập bằng số điện thoại và mật khẩu.
- Hệ thống tự chuẩn hóa số điện thoại Việt Nam về dạng `+84...`.
- Supabase tạo tài khoản đăng nhập trong `auth.users`.
- Trigger database tự tạo profile tương ứng trong `public.profiles`.
- User mới mặc định ở trạng thái `pending` để chờ duyệt.
- User `active` được chuyển đúng dashboard theo vai trò:
  - `admin` -> `/admin`
  - `landlord` -> `/landlord`
  - `broker` -> `/broker`
- User `pending` chỉ vào `/pending`.
- User `blocked` chỉ vào `/blocked`.
- User chưa đăng nhập bị chuyển về `/login`.
- User đổi mật khẩu khi đang đăng nhập được.
- Có nền quên mật khẩu bằng OTP SMS.

---

## 2. Vì sao đổi từ email sang số điện thoại + mật khẩu

Người dùng thật của sản phẩm là chủ nhà và môi giới. Nhóm này thường dùng số điện thoại để liên hệ và làm việc, không nhất thiết dùng email thật.

Nếu bắt dùng email thật thì có vài vấn đề:

- Chủ nhà/môi giới có thể không quen đăng nhập bằng email.
- Số điện thoại mới là định danh tự nhiên trong nghiệp vụ môi giới.
- Quên mật khẩu nên xử lý qua OTP SMS, gần với thói quen người dùng hơn.
- Dữ liệu vận hành sau này cần tìm user theo số điện thoại nhanh.

Vì vậy Module 03 chuyển sang:

```text
Đăng ký: số điện thoại + mật khẩu
Đăng nhập: số điện thoại + mật khẩu
Quên mật khẩu: số điện thoại -> OTP SMS -> đặt mật khẩu mới
```

---

## 3. Email ảo nội bộ `@phone.local`

Ban đầu có phương án dùng email ảo nội bộ, ví dụ:

```text
phone: +84912345678
auth email nội bộ: 84912345678@phone.local
```

Ý tưởng của phương án này là: người dùng vẫn nhập số điện thoại, nhưng phía sau app đổi số điện thoại thành email ảo để dùng Supabase email/password.

Tuy nhiên bản Module 03 hiện tại **không dùng flow email ảo làm flow chính**.

Lý do:

- Supabase JS hiện tại đã hỗ trợ đăng ký/đăng nhập bằng `phone + password`.
- Dùng phone trực tiếp giúp tránh rủi ro tạo 2 tài khoản auth khác nhau cho cùng 1 số điện thoại.
- OTP SMS cho quên mật khẩu cũng gắn với cùng user phone auth.
- Người dùng không bao giờ thấy email ảo.

Trong code vẫn có helper `phoneToAuthEmail()` như phương án dự phòng nếu sau này cần quay lại email ảo. Nhưng flow đang chạy là:

```text
User phone + password -> Supabase Phone Auth
```

Không phải:

```text
User phone -> email ảo @phone.local -> Supabase Email Auth
```

---

## 4. Workflow đăng ký

User vào `/register` và nhập:

```text
Họ tên
Số điện thoại
Mật khẩu
Nhập lại mật khẩu
Vai trò: Chủ nhà hoặc Môi giới
```

Vai trò hiển thị tiếng Việt:

```text
Chủ nhà
Môi giới
```

Giá trị kỹ thuật gửi vào hệ thống:

```text
landlord
broker
```

Sơ đồ workflow:

```text
User nhập form đăng ký
        |
        v
App kiểm tra dữ liệu
- họ tên không rỗng
- số điện thoại hợp lệ
- mật khẩu tối thiểu 6 ký tự
- nhập lại mật khẩu khớp
        |
        v
Chuẩn hóa số điện thoại
0912345678 -> +84912345678
        |
        v
Supabase Auth tạo user trong auth.users
        |
        v
Database trigger handle_new_user()
        |
        v
Tạo row trong public.profiles
- full_name
- phone
- role
- status = pending
        |
        v
User vào /pending để chờ duyệt
```

Ví dụ profile sau đăng ký:

```text
full_name: Nguyễn A
phone: +84384532123
role: broker
status: pending
```

---

## 5. Workflow đăng nhập

User vào `/login` và nhập:

```text
Số điện thoại
Mật khẩu
```

Sơ đồ workflow:

```text
User nhập số điện thoại + mật khẩu
        |
        v
App chuẩn hóa phone về +84...
        |
        v
Supabase kiểm tra phone + password
        |
        v
App lấy profile trong public.profiles
        |
        v
Kiểm tra status
```

Luồng redirect:

```text
status = pending
        -> /pending

status = blocked
        -> /blocked

status = active + role = admin
        -> /admin

status = active + role = landlord
        -> /landlord

status = active + role = broker
        -> /broker
```

---

## 6. Workflow đổi mật khẩu

User đã đăng nhập có thể vào:

```text
/account/change-password
```

Form gồm:

```text
Mật khẩu hiện tại
Mật khẩu mới
Nhập lại mật khẩu mới
```

Sơ đồ workflow:

```text
User đang đăng nhập
        |
        v
Mở /account/change-password
        |
        v
Nhập mật khẩu hiện tại + mật khẩu mới
        |
        v
App đăng nhập thử lại bằng phone + mật khẩu hiện tại
        |
        v
Nếu đúng -> Supabase update password
        |
        v
Thông báo đổi mật khẩu thành công
        |
        v
User logout và login lại bằng mật khẩu mới
```

Mục đích của bước nhập mật khẩu hiện tại là tránh trường hợp ai đó cầm được máy đang đăng nhập rồi đổi mật khẩu lung tung.

---

## 7. Workflow quên mật khẩu bằng OTP

User quên mật khẩu thì không cần admin reset thủ công.

Route sử dụng:

```text
/forgot-password
/forgot-password/verify
/reset-password
```

Sơ đồ workflow:

```text
User mở /forgot-password
        |
        v
Nhập số điện thoại
        |
        v
App chuẩn hóa phone về +84...
        |
        v
App kiểm tra public.profiles có phone này không
        |
        v
Supabase gửi OTP SMS
        |
        v
User nhập OTP tại /forgot-password/verify
        |
        v
Supabase verify OTP
        |
        v
User có session tạm
        |
        v
Mở /reset-password
        |
        v
Nhập mật khẩu mới
        |
        v
Supabase update password
        |
        v
App signOut
        |
        v
User login lại bằng mật khẩu mới
```

OTP chỉ dùng cho quên mật khẩu. Login thường ngày vẫn là:

```text
Số điện thoại + mật khẩu
```

---

## 8. `auth.users` và `public.profiles` khác nhau thế nào

Supabase có 2 nơi lưu thông tin user.

### `auth.users`

Đây là bảng hệ thống của Supabase Auth.

Dùng để lưu:

```text
user id
phone
password hash
thông tin đăng nhập
trạng thái xác nhận phone
session
```

App không nên tự chỉnh nhiều dữ liệu ở bảng này.

### `public.profiles`

Đây là bảng nghiệp vụ của app Kho Phòng Realtime.

Dùng để lưu:

```text
họ tên
số điện thoại
vai trò
trạng thái duyệt
avatar
public_slug
```

App dùng bảng này để phân quyền và hiển thị thông tin người dùng.

Sơ đồ:

```text
auth.users
  - lo phần đăng nhập
  - do Supabase quản lý
        |
        | id giống nhau
        v
public.profiles
  - lo nghiệp vụ app
  - do app quản lý
```

---

## 9. Role: admin / landlord / broker

Role là vai trò của user trong hệ thống.

```text
admin
```

Người vận hành hệ thống. Có thể quản lý users, căn nhà, phòng, reports.

```text
landlord
```

Chủ nhà. Sau này ở Module 04 sẽ tạo căn nhà và phòng theo cấu trúc:

```text
Chủ nhà -> Căn nhà -> Phòng
```

```text
broker
```

Môi giới. Xem dashboard phòng trống/sắp trống, lưu phòng, ghi chú, copy nội dung.

Form đăng ký public chỉ cho chọn:

```text
landlord
broker
```

Không cho tự chọn `admin`.

---

## 10. Status: pending / active / blocked

Status là trạng thái duyệt tài khoản.

```text
pending
```

Tài khoản mới tạo, đang chờ duyệt. Chỉ vào được `/pending`.

```text
active
```

Tài khoản đã được duyệt. Được vào dashboard theo role.

```text
blocked
```

Tài khoản bị khóa. Chỉ vào được `/blocked`.

Sơ đồ:

```text
User mới đăng ký
        |
        v
pending
        |
        | admin duyệt
        v
active
        |
        | admin khóa nếu cần
        v
blocked
```

---

## 11. Các lỗi đã gặp và cách xử lý

### Lỗi 1: Database error saving new user

Nguyên nhân:

Trigger `handle_new_user()` cast role enum trực tiếp. Nếu metadata thiếu hoặc sai role, database crash khi tạo user.

Cách xử lý:

- Sửa trigger để role chỉ nhận `admin`, `landlord`, `broker`.
- Nếu role sai hoặc thiếu thì default `broker`.
- Status mặc định `pending`.
- Trigger không crash nếu thiếu metadata.

### Lỗi 2: Profile không được tạo

Nguyên nhân:

Auth user đã có trong `auth.users`, nhưng trigger chưa tạo row tương ứng trong `public.profiles`.

Cách xử lý:

- Chạy SQL repair/backfill.
- Kiểm tra bằng query join `auth.users` với `public.profiles`.

### Lỗi 3: SQL migration báo syntax error at or near "Module"

Nguyên nhân:

Dòng tiêu đề bị paste thành text thường:

```text
Module 03: Phone + password auth migration.
```

SQL cần comment bằng `--`:

```sql
-- Module 03: Phone + password auth migration.
```

### Lỗi 4: Login báo sai phone/password sau register

Nguyên nhân:

Phone user chưa confirmed. Supabase tạo user nhưng chưa cho login password.

Cách xử lý:

- Tắt bắt buộc phone confirmation cho register MVP, hoặc
- Nếu muốn bắt OTP sau register thì cần thêm flow `/register/verify`.

MVP hiện chọn cách không bắt OTP khi đăng ký. OTP chỉ dùng cho quên mật khẩu.

### Lỗi 5: Không thấy email trong profile

Đây không phải lỗi.

Vì hệ thống đã chuyển sang phone/password trực tiếp, email có thể `null`. Identity chính của business là `profiles.phone`.

---

## 12. Checklist xác nhận Module 03 DONE

Module 03 được xem là DONE khi pass các mục sau:

```text
[x] Register bằng phone + password được
[x] Phone được chuẩn hóa về +84...
[x] Auth user xuất hiện trong Authentication > Users
[x] Profile xuất hiện trong public.profiles
[x] Profile có full_name, phone, role, status
[x] User mới có status = pending
[x] Pending user vào /pending
[x] Active broker vào /broker
[x] Active landlord vào /landlord
[x] Active admin vào /admin
[x] Blocked user vào /blocked
[x] User sai role không vào được route không thuộc quyền
[x] Đổi mật khẩu khi đang login được
[x] Login lại bằng mật khẩu mới được
[x] Forgot password OTP có route và logic
[x] Không hiển thị email ảo cho user
[x] Không thêm Zalo API
[x] Không làm Module 04 trong Module 03
```

---

## 13. Module 04 sẽ dùng lại những gì từ Module 03

Module 04 là Landlord Flow. Module này sẽ dùng lại nền auth đã có:

```text
requireRole(["landlord"])
```

để đảm bảo chỉ chủ nhà active mới vào được `/landlord`.

Module 04 cũng dùng:

```text
profile.id
```

làm `landlord_id` khi tạo căn nhà.

Sơ đồ Module 04 dự kiến:

```text
Landlord login
        |
        v
Module 03 kiểm tra:
- đã đăng nhập chưa
- status active chưa
- role landlord chưa
        |
        v
Cho vào /landlord
        |
        v
Module 04 tạo căn nhà
        |
        v
buildings.landlord_id = profile.id
```

Nhờ vậy dữ liệu vẫn giữ đúng cấu trúc:

```text
Chủ nhà -> Căn nhà -> Phòng
```

---

## 14. Bài học rút ra

1. Với sản phẩm cho chủ nhà và môi giới, số điện thoại phù hợp hơn email thật.
2. `auth.users` và `public.profiles` phải sync chặt với nhau.
3. Trigger database phải an toàn, không được crash nếu metadata thiếu.
4. Role và status là nền tảng phân quyền, phải ổn trước khi làm các module nghiệp vụ.
5. Không nên trộn OTP login với password login nếu sản phẩm đã quyết định login thường ngày bằng mật khẩu.
6. Nếu bật phone confirmation, phải có thêm flow verify OTP sau đăng ký. Nếu không có flow đó, user sẽ bị kẹt không login được.
7. Test từng bước nhỏ giúp phát hiện lỗi nhanh hơn build cả module lớn một lần.

---

## 15. Không được phá vỡ ở module sau

Các module sau không được làm hỏng các nguyên tắc này:

- Không quay lại bắt user nhập email thật.
- Không hiển thị email ảo hoặc chi tiết auth nội bộ cho user.
- Không cho user public tự chọn role `admin`.
- Không bỏ qua `status`.
- Không cho `pending` hoặc `blocked` vào dashboard nghiệp vụ.
- Không cho broker vào route landlord.
- Không cho landlord vào route broker.
- Không tạo phòng rời rạc không thuộc căn nhà.
- Không tự thêm Zalo API.
- Không auto đọc group Zalo.
- Không auto đăng Chợ Tốt/Mogi.
- Không expose service role key ra client.
- Không tạo 2 auth users cho cùng một số điện thoại.

Module 03 là lớp cửa vào của toàn bộ app. Nếu lớp này bị phá vỡ, các module sau sẽ sai quyền và sai dữ liệu.
