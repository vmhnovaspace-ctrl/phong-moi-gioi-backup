# PROJECT_CONTEXT.md

# Project: Kho Phòng Realtime

## 1. Mục tiêu tổng thể

Kho Phòng Realtime là một web app mobile-first giúp chủ nhà và môi giới cho thuê căn hộ dịch vụ mini làm việc hiệu quả hơn.

Hiện tại, chủ nhà và môi giới chủ yếu trao đổi qua Zalo group. Chủ nhà thường tạo nhiều group Zalo theo từng căn nhà hoặc từng nhóm sale. Khi có phòng trống, chủ nhà phải tìm lại ảnh, gõ lại thông tin và đăng lại vào group. Môi giới phải tự lội nhiều group Zalo để tìm phòng trống, lấy ảnh, lấy nội dung, rồi đăng lên các kênh như Chợ Tốt, Mogi, Facebook, Zalo.

Vấn đề chính là thông tin phòng trống đang bị rải rác, không có cấu trúc, không có trạng thái rõ ràng, dễ bị bỏ sót, dễ đăng nhầm phòng đã thuê.

Mục tiêu của project là tạo một kho dữ liệu phòng trống tập trung, cập nhật nhanh, dễ lọc, dễ copy nội dung, dễ lấy ảnh, nhưng vẫn giữ thói quen làm việc qua Zalo.

Zalo trong MVP v1 chỉ đóng vai trò là kênh share link và giao tiếp, không phải nơi lưu dữ liệu gốc.

---

## 2. Nguyên tắc sản phẩm cốt lõi

### 2.1. Dữ liệu gốc nằm trong app, không nằm trong Zalo

Zalo chỉ dùng để:

- Gửi link chủ nhà.
- Gửi link căn nhà.
- Gửi link phòng.
- Gửi nội dung đã copy sẵn.
- Giao tiếp giữa chủ nhà và môi giới.

Không dùng Zalo làm database.

Không cố đọc group Zalo tự động trong MVP v1.

---

### 2.2. Cấu trúc dữ liệu lõi

Cấu trúc dữ liệu bắt buộc là:

```text
Chủ nhà
  ↓
Căn nhà / địa chỉ
  ↓
Phòng
```

Một chủ nhà có thể có nhiều căn nhà.

Một căn nhà là một địa chỉ cụ thể.

Một căn nhà có nhiều phòng.

Một phòng bắt buộc phải thuộc về một căn nhà.

Ví dụ:

```text
Chủ nhà: Anh Minh
  ├── Căn 1: 123 Nguyễn Thị Thập, Quận 7
  │     ├── Phòng 101
  │     ├── Phòng 102
  │     └── Phòng 203
  │
  └── Căn 2: 45 Lâm Văn Bền, Quận 7
        ├── Phòng A1
        └── Phòng A2
```

Không thiết kế phòng rời rạc ngoài căn nhà.

---

### 2.3. Có 3 loại link bắt buộc

App phải có 3 loại link:

| Loại link | Mục đích | Ví dụ route |
|---|---|---|
| Link chủ nhà | Xem toàn bộ kho phòng trống/sắp trống của một chủ nhà | `/l/[landlordSlug]` |
| Link căn nhà | Xem toàn bộ phòng trống/sắp trống trong một địa chỉ/căn nhà | `/b/[buildingSlug]` |
| Link phòng | Xem chi tiết một phòng cụ thể | `/r/[roomSlug]` |

Cách dùng trong Zalo:

```text
Group Zalo tổng của chủ nhà → ghim link chủ nhà
Group Zalo từng căn nhà → ghim link căn nhà
Muốn đẩy một phòng cụ thể → gửi link phòng
```

---

### 2.4. Chủ nhà có nhiều cách thêm ảnh

Chủ nhà phải được chọn nhiều cách quản lý ảnh, vì thực tế mỗi người có thói quen khác nhau.

MVP v1 hỗ trợ các cách sau:

#### Cách 1: Dán link thư mục Google Drive

Ở cấp căn nhà:

```text
building_drive_folder_url
```

Ở cấp phòng:

```text
room_drive_folder_url
```

Dùng khi chủ nhà đã có sẵn album ảnh trong Google Drive.

#### Cách 2: Dán link từng ảnh Google Drive hoặc external URL

Dùng khi chủ nhà muốn chọn từng ảnh cụ thể.

Ảnh có thể được lưu vào bảng `building_images` hoặc `room_images` với `source_type = google_drive_link` hoặc `external_url`.

#### Cách 3: Upload ảnh trực tiếp vào app

Chủ nhà có thể upload ảnh từ máy tính hoặc điện thoại.

Ảnh upload trực tiếp sẽ lưu vào Supabase Storage.

Ảnh có thể có `source_type = uploaded`.

#### Cách 4: Google Drive Picker

Chưa bắt buộc trong MVP v1.

Thiết kế code nên chừa đường để sau này thêm Google Drive Picker, cho phép chủ nhà bấm chọn ảnh trực tiếp từ Google Drive.

---

### 2.5. Không tích hợp Zalo API trong MVP v1

MVP v1 không làm:

- Không đọc group Zalo tự động.
- Không dùng bot Zalo cá nhân.
- Không Zalo Mini App.
- Không Zalo OA/ZNS/ZBS.
- Không tự động gửi tin Zalo.
- Không tự động lấy nội dung từ group Zalo.

MVP v1 chỉ làm:

- Copy link.
- Copy nội dung.
- Chủ nhà tự dán vào Zalo.
- Môi giới bấm link hoặc vào dashboard để xem dữ liệu.

---

### 2.6. Không auto đăng Chợ Tốt/Mogi trong MVP v1

MVP v1 không tự động đăng tin lên Chợ Tốt, Mogi, Facebook hay nền tảng bên ngoài.

MVP v1 chỉ tạo nội dung để môi giới copy thủ công.

---

### 2.7. UI phải mobile-first

Người dùng chính là chủ nhà và môi giới, thường thao tác trên điện thoại.

UI cần:

- Dễ dùng trên điện thoại.
- Nút lớn, dễ bấm bằng ngón tay.
- Form rõ ràng.
- Bộ lọc nhanh.
- Card phòng dễ đọc.
- Ảnh hiển thị rõ.
- Nút copy dễ thấy.
- Nút mở Google Drive dễ thấy.
- Trạng thái phòng hiển thị bằng badge màu rõ ràng.

---

## 3. Người dùng và vai trò

### 3.1. Admin

Admin là người vận hành hệ thống.

Admin có thể:

- Quản lý chủ nhà.
- Quản lý môi giới.
- Duyệt tài khoản.
- Khóa tài khoản.
- Xem toàn bộ căn nhà.
- Xem toàn bộ phòng.
- Xem thống kê.
- Xử lý báo sai thông tin.

---

### 3.2. Chủ nhà / Landlord

Chủ nhà có thể:

- Tạo căn nhà.
- Sửa căn nhà.
- Tạo phòng trong từng căn nhà.
- Sửa phòng.
- Cập nhật trạng thái phòng.
- Quản lý ảnh phòng bằng nhiều cách.
- Copy link chủ nhà.
- Copy link căn nhà.
- Copy link phòng.
- Copy nội dung gửi Zalo.

---

### 3.3. Môi giới / Broker

Môi giới có thể:

- Xem dashboard phòng trống/sắp trống.
- Lọc theo chủ nhà.
- Lọc theo căn nhà.
- Lọc theo quận/khu vực.
- Lọc theo khoảng giá.
- Lọc theo trạng thái.
- Lọc theo tiện ích.
- Lọc theo hoa hồng.
- Xem chi tiết phòng.
- Mở link ảnh Google Drive.
- Xem ảnh upload trong app.
- Lưu phòng yêu thích.
- Ghi chú riêng cho từng phòng.
- Đánh dấu đã đăng Chợ Tốt/Mogi/Facebook.
- Đánh dấu đã gửi khách.
- Copy nội dung tin đăng.
- Báo sai thông tin.

---

## 4. Trạng thái phòng

Phòng có các trạng thái sau:

| Trạng thái tiếng Việt | Tên kỹ thuật | Ý nghĩa |
|---|---|---|
| Đang trống | `available` | Môi giới có thể sell ngay |
| Sắp trống | `coming_soon` | Chưa trống ngay nhưng có thể tư vấn trước |
| Đang giữ cọc | `reserved` | Đang giữ khách, không nên đẩy mạnh |
| Đã thuê | `rented` | Không còn hiển thị mặc định cho môi giới |
| Tạm ẩn | `hidden` | Chủ nhà/admin chủ động ẩn |

Dashboard môi giới mặc định chỉ hiển thị:

- `available`
- `coming_soon`

Có thể cho phép bật thêm `reserved` nếu cần.

Không hiển thị mặc định:

- `rented`
- `hidden`

---

## 5. Tech stack

MVP v1 sử dụng stack:

```text
Frontend: Next.js App Router
Language: TypeScript
UI: Tailwind CSS
Database: Supabase PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Realtime: Supabase Realtime
Hosting: Vercel
```

Lý do chọn stack này:

- Chi phí thấp.
- Dễ build với Codex/Cursor.
- Có database rõ ràng.
- Có auth sẵn.
- Có realtime.
- Có storage ảnh.
- Deploy dễ.
- Phù hợp MVP.

---

## 6. Database model dự kiến

Các bảng chính:

```text
profiles
buildings
rooms
room_fees
room_features
building_images
room_images
broker_room_actions
landlord_broker_permissions
room_status_logs
room_reports
```

### 6.1. profiles

Lưu người dùng.

```text
profiles
- id
- full_name
- phone
- email
- role
- status
- avatar_url
- created_at
- updated_at
```

Role:

```text
admin
landlord
broker
```

Status:

```text
pending
active
blocked
```

---

### 6.2. buildings

Lưu từng căn nhà/từng địa chỉ.

```text
buildings
- id
- landlord_id
- name
- address
- ward
- district
- city
- google_maps_url
- description
- common_amenities
- house_rules
- building_drive_folder_url
- cover_image_url
- public_slug
- visibility
- created_at
- updated_at
```

Một `building` là một địa chỉ cụ thể.

---

### 6.3. rooms

Lưu từng phòng trong căn nhà.

```text
rooms
- id
- building_id
- room_code
- title
- floor
- area_m2
- rent_price
- deposit_amount
- max_people
- status
- available_from
- commission
- description
- strengths
- weaknesses
- room_drive_folder_url
- cover_image_url
- public_slug
- visibility
- created_at
- updated_at
```

---

### 6.4. room_fees

```text
room_fees
- id
- room_id
- electricity_price
- water_price
- parking_fee
- service_fee
- internet_fee
- management_fee
- other_fees
- created_at
- updated_at
```

---

### 6.5. room_features

```text
room_features
- id
- room_id
- has_window
- has_balcony
- has_private_bathroom
- has_private_kitchen
- has_washing_machine
- has_elevator
- has_air_conditioner
- has_fridge
- has_bed
- has_wardrobe
- allows_pet
- is_furnished
- has_parking
- has_security
- created_at
- updated_at
```

---

### 6.6. room_images

Lưu ảnh phòng upload trực tiếp hoặc link ảnh riêng.

```text
room_images
- id
- room_id
- image_url
- source_type
- image_type
- sort_order
- is_cover
- created_at
```

`source_type`:

```text
uploaded
google_drive_link
external_url
```

`image_type`:

```text
main
room
bathroom
kitchen
balcony
building
other
```

---

### 6.7. building_images

Lưu ảnh căn nhà upload trực tiếp hoặc link ảnh riêng.

```text
building_images
- id
- building_id
- image_url
- source_type
- image_type
- sort_order
- is_cover
- created_at
```

---

### 6.8. broker_room_actions

Lưu hành động riêng của mỗi môi giới với từng phòng.

```text
broker_room_actions
- id
- broker_id
- room_id
- is_saved
- posted_chotot
- posted_mogi
- posted_facebook
- sent_to_customer
- customer_note
- private_note
- updated_at
```

---

### 6.9. landlord_broker_permissions

Quản lý môi giới nào được xem dữ liệu của chủ nhà nào.

```text
landlord_broker_permissions
- id
- landlord_id
- broker_id
- status
- created_at
```

Status:

```text
pending
approved
blocked
```

MVP có thể bắt đầu bằng quyền theo chủ nhà. Sau này có thể mở rộng quyền theo từng căn nhà.

---

### 6.10. room_status_logs

Lưu lịch sử đổi trạng thái phòng.

```text
room_status_logs
- id
- room_id
- old_status
- new_status
- changed_by
- note
- created_at
```

---

### 6.11. room_reports

Lưu báo cáo sai thông tin từ môi giới.

```text
room_reports
- id
- room_id
- broker_id
- report_type
- message
- status
- created_at
- resolved_at
```

Report type:

```text
rented
wrong_price
wrong_images
wrong_info
other
```

Status:

```text
open
reviewing
resolved
rejected
```

---

## 7. Các route chính

### 7.1. Auth

```text
/login
/register
/logout
```

Redirect sau login:

```text
admin → /admin
landlord → /landlord
broker → /broker
```

---

### 7.2. Landlord

```text
/landlord
/landlord/buildings/new
/landlord/buildings/[id]
/landlord/buildings/[id]/edit
/landlord/buildings/[id]/rooms/new
/landlord/rooms/[id]
/landlord/rooms/[id]/edit
```

---

### 7.3. Broker

```text
/broker
/broker/rooms/[id]
/broker/saved
/broker/actions
```

---

### 7.4. Admin

```text
/admin
/admin/users
/admin/buildings
/admin/rooms
/admin/reports
```

---

### 7.5. Share links

```text
/l/[landlordSlug]
/b/[buildingSlug]
/r/[roomSlug]
```

---

## 8. Module thực hiện

Project nên được làm theo các module sau:

```text
Module 00: Project Context & Rulebook
Module 01: PRD sản phẩm
Module 02: Database Schema Supabase
Module 03: Auth & Role Permission
Module 04: Landlord Flow
Module 05: Image System
Module 06: Broker Dashboard
Module 07: Share Links System
Module 08: Copy Content Templates
Module 09: Realtime Update
Module 10: Admin Dashboard
Module 11: UI/UX Design System
Module 12: Testing & Sample Data
Module 13: Deploy & Production Setup
Module 14: Nâng cấp sau MVP
```

Không nên giao Codex/Cursor build toàn bộ app một lần. Nên làm từng module.

---

## 9. Tiêu chí hoàn thành MVP v1

MVP v1 được xem là xong khi hoàn thành các luồng sau.

### 9.1. Luồng chủ nhà

```text
Chủ nhà đăng nhập
→ tạo căn nhà theo một địa chỉ
→ tạo phòng trong căn nhà
→ thêm ảnh bằng link Google Drive hoặc upload ảnh
→ đổi trạng thái phòng sang Đang trống
→ copy link căn nhà gửi Zalo
→ copy tin Zalo căn nhà
```

### 9.2. Luồng môi giới

```text
Môi giới đăng nhập
→ mở dashboard
→ lọc theo chủ nhà
→ xem tất cả căn nhà của chủ nhà đó
→ xem phòng trống/sắp trống
→ mở chi tiết phòng
→ xem/mở ảnh Drive
→ copy tin đăng
→ lưu phòng
→ ghi chú riêng
```

### 9.3. Luồng link

```text
Link chủ nhà mở được
Link căn nhà mở được
Link phòng mở được
Dữ liệu trong link cập nhật theo trạng thái mới nhất
```

### 9.4. Luồng admin

```text
Admin đăng nhập
→ xem users
→ duyệt/khóa user
→ xem tất cả căn nhà/phòng
→ xem report sai thông tin
```

---

## 10. Những việc không làm trong MVP v1

Không làm trong MVP v1:

- Không Zalo API.
- Không Zalo Mini App.
- Không Zalo OA/ZNS/ZBS.
- Không bot đọc group Zalo.
- Không auto đăng Chợ Tốt/Mogi.
- Không thanh toán.
- Không app native iOS/Android.
- Không AI matching.
- Không Google Drive Picker bắt buộc.
- Không watermark ảnh nâng cao.
- Không CRM khách thuê nâng cao.

---

## 11. Nâng cấp sau MVP

### v1.5

Có thể thêm:

- Google Drive Picker.
- AI tạo tin đăng.
- AI chuẩn hóa mô tả phòng.
- Thông báo email/web push.
- Watermark ảnh đơn giản.

### v2

Có thể thêm:

- Zalo Mini App nếu có traction.
- Zalo OA/ZBS nếu cần thông báo chính thức.
- AI tìm phòng theo nhu cầu khách.
- Tracking link môi giới.
- Phân quyền nâng cao theo từng căn nhà.
- Gói Pro/VIP cho môi giới.
- Thanh toán/gói dịch vụ.

---

## 12. Context mẫu cho chat/module mới

Khi mở chat mới, copy đoạn này:

```text
Tôi đang xây project "Kho Phòng Realtime".

Mục tiêu:
Tạo web app giúp chủ nhà quản lý phòng trống theo từng căn nhà/địa chỉ, và giúp môi giới xem toàn bộ phòng trống realtime, không cần lội nhiều group Zalo.

Nguyên tắc sản phẩm:
- Cấu trúc dữ liệu lõi là: Chủ nhà → Căn nhà/địa chỉ → Phòng.
- Một căn nhà là một địa chỉ cụ thể.
- Mỗi phòng bắt buộc thuộc một căn nhà.
- Có 3 role: admin, landlord/chủ nhà, broker/môi giới.
- Có 3 loại link: link chủ nhà, link căn nhà, link phòng.
- Group Zalo tổng của chủ nhà ghim link chủ nhà.
- Group Zalo từng căn nhà ghim link căn nhà.
- Đẩy một phòng cụ thể thì dùng link phòng.
- Zalo chỉ dùng để share link/copy nội dung, không tích hợp Zalo API trong MVP v1.
- Không auto đọc group Zalo.
- Không auto đăng Chợ Tốt/Mogi trong MVP v1.
- Chủ nhà có nhiều cách thêm ảnh:
  1. Dán link thư mục Google Drive cho căn/phòng.
  2. Dán link từng ảnh Google Drive hoặc external URL.
  3. Upload ảnh trực tiếp vào app.
  4. Google Drive Picker để sau, chưa bắt buộc v1.
- Tech stack: Next.js App Router + TypeScript + Tailwind CSS + Supabase PostgreSQL/Auth/Storage/Realtime + Vercel.
- UI phải mobile-first vì chủ nhà và môi giới chủ yếu dùng điện thoại.

Tôi muốn làm theo module, không làm tất cả một lúc.
Module hiện tại cần làm là: [GHI TÊN MODULE Ở ĐÂY].
Hãy chỉ tập trung vào module này, nhưng vẫn đảm bảo không phá vỡ kiến trúc tổng thể.
```
