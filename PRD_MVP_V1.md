# PRD_MVP_V1.md

# Product Requirements Document — Kho Phòng Realtime MVP v1

## 1. Tổng quan sản phẩm

**Tên sản phẩm:** Kho Phòng Realtime

**Loại sản phẩm:** Web app mobile-first

**Người dùng chính:**

- Chủ nhà căn hộ dịch vụ mini.
- Môi giới/sale phòng cho thuê.
- Admin vận hành hệ thống.

**Mục tiêu:**

Tạo một hệ thống giúp chủ nhà quản lý phòng trống theo từng căn nhà/địa chỉ và giúp môi giới xem toàn bộ phòng trống/sắp trống realtime, có thể lọc, xem ảnh, copy nội dung, lưu phòng, ghi chú và giảm phụ thuộc vào việc lội nhiều group Zalo.

---

## 2. Bối cảnh hiện tại

Chủ nhà và môi giới hiện làm việc chủ yếu qua Zalo.

Workflow phổ biến:

```text
Chủ nhà có phòng trống
→ tìm lại ảnh phòng
→ gõ lại thông tin phòng
→ đăng vào group Zalo
→ môi giới tự vào group lấy ảnh/nội dung
→ môi giới đăng tin lên Chợ Tốt/Mogi/Facebook/Zalo
```

Một chủ nhà có thể có nhiều căn nhà. Mỗi căn nhà có thể có group Zalo riêng. Môi giới thường tham gia nhiều group của nhiều chủ nhà, dẫn đến thông tin bị loãng, dễ bỏ sót phòng mới, dễ đăng nhầm phòng đã thuê.

---

## 3. Vấn đề cần giải quyết

### 3.1. Vấn đề của chủ nhà

Chủ nhà gặp các vấn đề:

- Mỗi lần có phòng trống phải tìm lại ảnh.
- Phải gõ lại thông tin phòng nhiều lần.
- Phòng đã có dữ liệu nhưng không có nơi lưu chuẩn.
- Không biết sale nào đang xem/lấy phòng.
- Khó thông báo khi phòng đã thuê.
- Nhiều group Zalo dẫn đến rối thông tin.

---

### 3.2. Vấn đề của môi giới

Môi giới gặp các vấn đề:

- Phải lội nhiều group Zalo để tìm phòng.
- Dễ bỏ sót phòng trống mới.
- Dễ lấy nhầm thông tin cũ.
- Dễ đăng phòng đã thuê.
- Khó lọc phòng theo chủ nhà, khu vực, giá, tiện ích.
- Khó quản lý phòng đã lưu, phòng đã đăng, phòng đã gửi khách.
- Ảnh và nội dung không chuẩn hóa.

---

### 3.3. Vấn đề của hệ thống hiện tại

- Zalo đang bị dùng như database, nhưng Zalo không phù hợp làm database.
- Thông tin không có cấu trúc.
- Không có trạng thái phòng rõ ràng.
- Không có lịch sử cập nhật.
- Không có dashboard chung cho môi giới.
- Không có link cố định theo chủ nhà/căn/phòng.

---

## 4. Mục tiêu MVP v1

MVP v1 tập trung vào 5 mục tiêu:

1. Cho phép chủ nhà quản lý phòng theo cấu trúc:

```text
Chủ nhà → Căn nhà/địa chỉ → Phòng
```

2. Cho phép chủ nhà cập nhật trạng thái phòng nhanh:

```text
Đang trống
Sắp trống
Đang giữ cọc
Đã thuê
Tạm ẩn
```

3. Cho phép chủ nhà thêm ảnh bằng nhiều cách:

```text
Dán link thư mục Google Drive
Dán link từng ảnh Google Drive/external URL
Upload ảnh trực tiếp vào app
```

4. Cho phép môi giới xem/lọc phòng trống nhanh:

```text
Theo chủ nhà
Theo căn nhà
Theo quận/khu vực
Theo giá
Theo tiện ích
Theo trạng thái
```

5. Cho phép copy link và nội dung để dùng trong Zalo:

```text
Link chủ nhà
Link căn nhà
Link phòng
Copy tin chủ nhà
Copy tin căn nhà
Copy tin phòng
```

---

## 5. Phạm vi MVP v1

### 5.1. Có trong MVP v1

MVP v1 bao gồm:

- Đăng nhập.
- Phân quyền admin/chủ nhà/môi giới.
- Quản lý căn nhà theo từng địa chỉ.
- Quản lý phòng trong từng căn nhà.
- Quản lý trạng thái phòng.
- Thêm ảnh bằng Google Drive link hoặc upload trực tiếp.
- Dashboard môi giới.
- Bộ lọc theo chủ nhà, căn nhà, quận, giá, trạng thái, tiện ích, hoa hồng.
- Link chủ nhà.
- Link căn nhà.
- Link phòng.
- Copy nội dung Zalo theo 3 cấp.
- Môi giới lưu phòng.
- Môi giới ghi chú riêng.
- Môi giới đánh dấu đã đăng/gửi khách.
- Môi giới báo sai thông tin.
- Admin quản lý user/căn/phòng/report.
- Realtime hoặc thông báo có cập nhật mới khi phòng thay đổi.

---

### 5.2. Không có trong MVP v1

MVP v1 không làm:

- Không tích hợp Zalo API.
- Không đọc group Zalo tự động.
- Không Zalo Mini App.
- Không Zalo OA/ZNS/ZBS.
- Không auto đăng Chợ Tốt/Mogi.
- Không thanh toán.
- Không app native iOS/Android.
- Không AI matching.
- Không bắt buộc Google Drive Picker.
- Không watermark ảnh nâng cao.
- Không CRM khách thuê nâng cao.

---

## 6. User roles

## 6.1. Admin

Admin là người vận hành hệ thống.

Admin cần làm được:

- Đăng nhập.
- Xem dashboard tổng quan.
- Xem danh sách user.
- Duyệt user mới.
- Khóa user.
- Xem tất cả chủ nhà.
- Xem tất cả môi giới.
- Xem tất cả căn nhà.
- Xem tất cả phòng.
- Xử lý báo sai thông tin.

---

## 6.2. Chủ nhà / Landlord

Chủ nhà cần làm được:

- Đăng nhập.
- Xem dashboard kho phòng của mình.
- Tạo căn nhà.
- Sửa căn nhà.
- Tạo phòng trong từng căn nhà.
- Sửa phòng.
- Cập nhật trạng thái phòng.
- Thêm ảnh/link ảnh cho căn nhà.
- Thêm ảnh/link ảnh cho phòng.
- Copy link kho phòng của chủ nhà.
- Copy link căn nhà.
- Copy link phòng.
- Copy nội dung Zalo của chủ nhà/căn/phòng.

---

## 6.3. Môi giới / Broker

Môi giới cần làm được:

- Đăng nhập.
- Xem dashboard phòng trống/sắp trống.
- Lọc theo chủ nhà.
- Lọc theo căn nhà.
- Lọc theo quận/khu vực.
- Lọc theo khoảng giá.
- Lọc theo trạng thái.
- Lọc theo tiện ích.
- Lọc theo hoa hồng.
- Xem chi tiết phòng.
- Mở link Google Drive ảnh.
- Xem ảnh upload trong app.
- Copy nội dung tin đăng.
- Lưu phòng yêu thích.
- Ghi chú riêng.
- Đánh dấu đã đăng Chợ Tốt/Mogi/Facebook.
- Đánh dấu đã gửi khách.
- Báo sai thông tin.

---

## 7. User stories

### 7.1. Admin

```text
Là admin, tôi muốn xem tổng số chủ nhà, môi giới, căn nhà, phòng và report để nắm tình trạng hệ thống.
```

```text
Là admin, tôi muốn duyệt hoặc khóa user để kiểm soát ai được dùng hệ thống.
```

```text
Là admin, tôi muốn xem tất cả phòng theo chủ nhà/căn nhà/trạng thái để kiểm tra dữ liệu.
```

```text
Là admin, tôi muốn xử lý report sai thông tin từ môi giới để giữ dữ liệu đáng tin cậy.
```

---

### 7.2. Chủ nhà

```text
Là chủ nhà, tôi muốn tạo từng căn nhà theo từng địa chỉ để quản lý phòng đúng thực tế.
```

```text
Là chủ nhà, tôi muốn tạo phòng trong từng căn nhà để không bị lẫn phòng giữa các địa chỉ.
```

```text
Là chủ nhà, tôi muốn dán link thư mục Google Drive ảnh phòng để không phải upload lại toàn bộ album ảnh.
```

```text
Là chủ nhà, tôi muốn upload ảnh trực tiếp nếu tôi không muốn dùng Google Drive link.
```

```text
Là chủ nhà, tôi muốn đổi trạng thái phòng từ Đã thuê sang Đang trống để sale thấy phòng mới ngay.
```

```text
Là chủ nhà, tôi muốn copy link căn nhà để gửi vào group Zalo của căn đó.
```

```text
Là chủ nhà, tôi muốn copy nội dung Zalo cho một căn đang có nhiều phòng trống để không phải gõ lại thủ công.
```

---

### 7.3. Môi giới

```text
Là môi giới, tôi muốn lọc theo chủ nhà để xem tất cả căn và phòng trống của chủ nhà đó.
```

```text
Là môi giới, tôi muốn lọc theo căn nhà để xem tất cả phòng trống trong một địa chỉ.
```

```text
Là môi giới, tôi muốn lọc theo giá, quận, tiện ích để tìm phòng phù hợp với khách.
```

```text
Là môi giới, tôi muốn xem ảnh phòng hoặc mở Google Drive để lấy ảnh đăng tin.
```

```text
Là môi giới, tôi muốn copy nội dung tin đăng để đăng nhanh lên các kênh khác.
```

```text
Là môi giới, tôi muốn lưu phòng và ghi chú riêng để quản lý khách đang quan tâm.
```

```text
Là môi giới, tôi muốn báo phòng đã thuê hoặc sai giá để admin/chủ nhà kiểm tra lại.
```

---

## 8. Functional requirements

## 8.1. Authentication & authorization

### Yêu cầu

- Người dùng có thể đăng nhập bằng email/password.
- Hệ thống có 3 role: `admin`, `landlord`, `broker`.
- Sau khi đăng nhập, user được redirect theo role:

```text
admin → /admin
landlord → /landlord
broker → /broker
```

- User không được truy cập route sai role.
- Profile được tạo hoặc đồng bộ với Supabase Auth.

### Acceptance criteria

- Admin đăng nhập vào `/admin` được.
- Chủ nhà đăng nhập vào `/landlord` được.
- Môi giới đăng nhập vào `/broker` được.
- User sai role bị chặn khỏi route không thuộc quyền.

---

## 8.2. Landlord — Quản lý căn nhà

### Yêu cầu

Chủ nhà có thể tạo/sửa căn nhà.

Mỗi căn nhà gồm:

```text
Tên căn nhà
Địa chỉ
Phường
Quận
Thành phố
Google Maps URL
Mô tả chung
Tiện ích chung
Quy định chung
Link thư mục Google Drive ảnh căn nhà
Ảnh đại diện căn nhà
```

Mỗi căn nhà là một địa chỉ cụ thể.

### Acceptance criteria

- Chủ nhà tạo được căn nhà.
- Chủ nhà sửa được căn nhà.
- Chủ nhà xem được danh sách căn nhà của mình.
- Mỗi căn hiển thị tổng số phòng, số phòng trống, số phòng sắp trống.
- Chủ nhà copy được link căn nhà.

---

## 8.3. Landlord — Quản lý phòng

### Yêu cầu

Chủ nhà có thể tạo/sửa phòng trong từng căn nhà.

Mỗi phòng gồm:

```text
Mã phòng
Tiêu đề
Tầng
Diện tích
Giá thuê
Cọc
Số người tối đa
Trạng thái
Ngày có thể vào
Hoa hồng
Mô tả
Điểm mạnh
Điểm yếu
Phí
Tiện ích
Link thư mục Google Drive ảnh phòng
Ảnh đại diện
Ảnh phụ nếu có
```

Phòng có các trạng thái:

```text
available
coming_soon
reserved
rented
hidden
```

### Acceptance criteria

- Chủ nhà tạo được phòng trong đúng căn nhà.
- Chủ nhà sửa được phòng.
- Chủ nhà đổi trạng thái phòng được.
- Khi đổi trạng thái, hệ thống ghi log.
- Chủ nhà copy được link phòng.
- Chủ nhà copy được nội dung phòng.

---

## 8.4. Image system

### Yêu cầu

Chủ nhà có thể thêm ảnh bằng nhiều cách.

#### Cấp căn nhà

- Dán link thư mục Google Drive ảnh căn nhà.
- Dán link từng ảnh căn nhà.
- Upload ảnh đại diện căn nhà.
- Upload nhiều ảnh căn nhà nếu cần.

#### Cấp phòng

- Dán link thư mục Google Drive ảnh phòng.
- Dán link từng ảnh phòng.
- Upload ảnh đại diện phòng.
- Upload nhiều ảnh phòng nếu cần.

Mỗi ảnh có thể có:

```text
source_type: uploaded | google_drive_link | external_url
image_type: main | room | bathroom | kitchen | balcony | building | other
is_cover: true/false
sort_order
```

### Acceptance criteria

- Chủ nhà dán được link folder Drive cho căn nhà.
- Chủ nhà dán được link folder Drive cho phòng.
- Chủ nhà upload được ảnh đại diện.
- Chủ nhà upload được ảnh phụ hoặc dán link ảnh phụ.
- Môi giới xem được ảnh trong app nếu có.
- Môi giới mở được link Google Drive nếu có.

---

## 8.5. Broker dashboard

### Yêu cầu

Môi giới có dashboard xem phòng `available` và `coming_soon`.

Bộ lọc bắt buộc:

```text
Chủ nhà
Căn nhà
Quận
Khoảng giá
Trạng thái
Tiện ích
Hoa hồng
Ngày cập nhật
```

Có 2 chế độ xem:

```text
Danh sách phòng
Nhóm theo chủ nhà/căn nhà
```

Khi chọn một chủ nhà:

```text
Hiển thị tất cả căn nhà của chủ nhà đó
Hiển thị các phòng đang trống/sắp trống trong từng căn
```

### Acceptance criteria

- Môi giới xem được phòng đang trống/sắp trống.
- Môi giới lọc được theo chủ nhà.
- Môi giới lọc được theo căn nhà.
- Môi giới lọc được theo quận.
- Môi giới lọc được theo giá.
- Môi giới xem được nhóm theo chủ nhà/căn nhà.
- Môi giới mở chi tiết phòng được.

---

## 8.6. Broker room actions

### Yêu cầu

Môi giới có thể thao tác riêng với từng phòng:

- Lưu phòng.
- Ghi chú riêng.
- Đánh dấu đã đăng Chợ Tốt.
- Đánh dấu đã đăng Mogi.
- Đánh dấu đã đăng Facebook.
- Đánh dấu đã gửi khách.

Các hành động này là riêng của từng môi giới, chủ nhà khác hoặc môi giới khác không thấy ghi chú riêng.

### Acceptance criteria

- Môi giới lưu phòng được.
- Môi giới bỏ lưu phòng được.
- Môi giới ghi chú riêng được.
- Môi giới đánh dấu đã đăng/gửi khách được.
- Dữ liệu action không ảnh hưởng môi giới khác.

---

## 8.7. Share links

### Yêu cầu

Hệ thống có 3 loại link:

#### Link chủ nhà

Route:

```text
/l/[landlordSlug]
```

Hiển thị:

- Thông tin chủ nhà.
- Danh sách căn nhà của chủ nhà.
- Phòng đang trống/sắp trống trong từng căn.
- Bộ lọc theo căn/trạng thái/giá nếu cần.

#### Link căn nhà

Route:

```text
/b/[buildingSlug]
```

Hiển thị:

- Thông tin căn nhà.
- Địa chỉ/khu vực.
- Tiện ích chung.
- Quy định chung.
- Danh sách phòng đang trống/sắp trống trong căn.
- Link Google Drive ảnh căn nếu có.

#### Link phòng

Route:

```text
/r/[roomSlug]
```

Hiển thị:

- Chi tiết phòng.
- Giá.
- Phí.
- Tiện ích.
- Trạng thái hiện tại.
- Ảnh.
- Link Drive nếu có.

### Quyền truy cập đề xuất

MVP v1 nên yêu cầu đăng nhập để xem đầy đủ thông tin.

Người chưa đăng nhập có thể thấy preview giới hạn hoặc bị yêu cầu đăng nhập.

### Acceptance criteria

- Chủ nhà copy được link chủ nhà.
- Chủ nhà copy được link căn nhà.
- Chủ nhà copy được link phòng.
- Link mở ra đúng dữ liệu.
- Link hiển thị dữ liệu mới nhất theo trạng thái.
- Link không hiển thị mặc định phòng `rented` và `hidden`.

---

## 8.8. Copy content templates

### Yêu cầu

Hệ thống có nút copy nội dung theo 3 cấp.

#### Copy tin chủ nhà

Dùng khi chủ nhà muốn gửi toàn bộ kho phòng hiện tại.

Ví dụ:

```text
Kho phòng trống cập nhật realtime của Anh Minh:

Hiện có 8 phòng trống/sắp trống tại 3 căn:
- Nguyễn Thị Thập Q7: 3 phòng
- Lâm Văn Bền Q7: 2 phòng
- Ung Văn Khiêm Bình Thạnh: 3 phòng

Xem toàn bộ tại:
[link chủ nhà]
```

#### Copy tin căn nhà

Dùng khi một căn nhà có nhiều phòng trống.

Ví dụ:

```text
Căn Nguyễn Thị Thập Q7 đang còn 3 phòng trống/sắp trống:

- Phòng 101: 5.5tr | 25m2 | full nội thất | cửa sổ
- Phòng 203: 6.0tr | 28m2 | ban công | full nội thất
- Phòng 305: 4.8tr | 22m2 | giá tốt

Xem ảnh + chi tiết cập nhật realtime:
[link căn nhà]
```

#### Copy tin phòng

Dùng khi muốn đẩy một phòng cụ thể.

Ví dụ:

```text
CHO THUÊ PHÒNG Q7 - FULL NỘI THẤT

Phòng: 101
Giá: 5.500.000đ/tháng
Diện tích: 25m2
Trạng thái: Đang trống

Tiện ích:
- Full nội thất
- Cửa sổ
- Thang máy
- Giờ tự do

Chi phí:
- Điện: 4.000đ/kWh
- Nước: 100.000đ/người
- Xe: 150.000đ/xe

Xem ảnh + chi tiết:
[link phòng]
```

### Acceptance criteria

- Copy tin chủ nhà được.
- Copy tin căn nhà được.
- Copy tin phòng được.
- Nội dung không hiển thị field rỗng.
- Giá format đúng kiểu Việt Nam.
- Link trong nội dung đúng loại.
- Copy hoạt động trên điện thoại.

---

## 8.9. Realtime update

### Yêu cầu

Khi chủ nhà cập nhật phòng, môi giới cần biết nhanh.

MVP v1 không cần UI tự nhảy phức tạp. Có thể hiển thị banner:

```text
Có cập nhật mới, bấm để tải lại.
```

Theo dõi các thay đổi chính:

- `rooms.status`
- `rooms.rent_price`
- `rooms.updated_at`
- `buildings.updated_at`

### Acceptance criteria

- Chủ nhà đổi trạng thái phòng.
- Broker dashboard nhận được signal cập nhật.
- Dashboard hiển thị banner có cập nhật mới.
- Broker bấm cập nhật để reload dữ liệu.
- Link chủ nhà/căn/phòng hiển thị dữ liệu mới nhất.

---

## 8.10. Room reports

### Yêu cầu

Môi giới có thể báo sai thông tin.

Report type:

```text
rented
wrong_price
wrong_images
wrong_info
other
```

Report status:

```text
open
reviewing
resolved
rejected
```

### Acceptance criteria

- Môi giới gửi report được.
- Admin xem report được.
- Admin đổi trạng thái report được.
- Report gắn với đúng phòng và đúng môi giới.

---

## 9. Non-functional requirements

## 9.1. Mobile-first

- Giao diện phải dùng tốt trên điện thoại.
- Form không quá dài một màn hình nếu có thể chia section.
- Nút copy/link/upload phải dễ bấm.
- Card phòng phải đọc được nhanh.

---

## 9.2. Performance

MVP v1 cần đủ nhanh cho quy mô test:

```text
3-10 chủ nhà
5-50 căn nhà
50-500 phòng
10-100 môi giới
```

Các danh sách cần phân trang hoặc lazy load nếu dữ liệu nhiều.

---

## 9.3. Security

- Dùng Supabase RLS.
- User chỉ xem/sửa dữ liệu đúng quyền.
- Chủ nhà chỉ sửa căn/phòng của mình.
- Môi giới chỉ sửa action/note của chính mình.
- Admin có quyền xem/quản lý toàn bộ.
- Link public nên có slug khó đoán.
- MVP ưu tiên yêu cầu đăng nhập để xem đầy đủ dữ liệu.

---

## 9.4. Reliability

- Khi đổi trạng thái phòng phải ghi log.
- Không xóa cứng dữ liệu quan trọng nếu không cần.
- Nên có `hidden` thay vì xóa phòng.
- Upload ảnh lỗi phải báo rõ.
- Link Google Drive sai phải cho phép sửa dễ.

---

## 10. UI/UX requirements

## 10.1. Components chính

Cần có các component:

```text
RoomCard
BuildingCard
LandlordCard
StatusBadge
PriceDisplay
FilterBar
CopyButton
ImageGallery
DriveLinkButton
EmptyState
LoadingSkeleton
BottomNavigation
ActionSheet mobile
```

---

## 10.2. Badge trạng thái

Màu gợi ý:

```text
Đang trống: xanh lá
Sắp trống: xanh dương
Đang giữ cọc: vàng/cam
Đã thuê: xám
Tạm ẩn: xám đậm
Báo lỗi: đỏ
```

---

## 10.3. Dashboard môi giới

Dashboard môi giới phải ưu tiên:

- Bộ lọc nhanh.
- Danh sách phòng mới cập nhật.
- Chế độ nhóm theo chủ nhà/căn nhà.
- Card phòng có ảnh, giá, khu vực, trạng thái, nút copy.

---

## 10.4. Dashboard chủ nhà

Dashboard chủ nhà phải ưu tiên:

- Tổng số căn.
- Tổng số phòng.
- Số phòng đang trống.
- Số phòng sắp trống.
- Danh sách căn nhà.
- Nút copy link kho chủ nhà.
- Nút thêm căn nhà.

---

## 11. Routes chi tiết

## 11.1. Auth

```text
/login
/register
/logout
```

---

## 11.2. Landlord routes

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

## 11.3. Broker routes

```text
/broker
/broker/rooms/[id]
/broker/saved
/broker/actions
```

---

## 11.4. Admin routes

```text
/admin
/admin/users
/admin/buildings
/admin/rooms
/admin/reports
```

---

## 11.5. Share link routes

```text
/l/[landlordSlug]
/b/[buildingSlug]
/r/[roomSlug]
```

---

## 12. Database tables

Các bảng cần có:

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

Yêu cầu database:

- UUID primary key.
- Foreign key đầy đủ.
- Enum hoặc check constraint cho role/status.
- RLS policies.
- Index cho các trường filter thường dùng.
- Trigger `updated_at`.
- Trigger log khi đổi trạng thái phòng.
- Storage bucket cho ảnh upload.

---

## 13. Module implementation plan

Thứ tự thực hiện:

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

---

## 14. Definition of Done cho MVP v1

MVP v1 được coi là xong khi các luồng sau hoạt động.

### 14.1. Chủ nhà

```text
Chủ nhà đăng nhập
→ tạo căn nhà theo một địa chỉ
→ tạo phòng trong căn nhà
→ thêm ảnh bằng link Google Drive hoặc upload ảnh
→ đổi trạng thái phòng sang Đang trống
→ copy link căn nhà gửi Zalo
→ copy tin Zalo căn nhà
```

---

### 14.2. Môi giới

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

---

### 14.3. Link

```text
Link chủ nhà mở được
Link căn nhà mở được
Link phòng mở được
Dữ liệu trong link cập nhật theo trạng thái mới nhất
```

---

### 14.4. Admin

```text
Admin đăng nhập
→ xem users
→ duyệt/khóa user
→ xem tất cả căn nhà/phòng
→ xem report sai thông tin
```

---

### 14.5. Realtime

```text
Chủ nhà đổi trạng thái phòng
→ broker dashboard báo có cập nhật mới
→ broker reload và thấy dữ liệu mới
```

---

## 15. Sample data cần có để test

Khi test MVP, cần tạo dữ liệu mẫu:

```text
3 chủ nhà
5 căn nhà
50 phòng
10 môi giới
Nhiều trạng thái phòng khác nhau
Một số phòng có link folder Google Drive
Một số phòng có link ảnh riêng
Một số phòng có ảnh upload trực tiếp
Một số môi giới có phòng đã lưu/ghi chú
Một số report sai thông tin
```

---

## 16. Rủi ro và cách xử lý

### 16.1. Chủ nhà không chịu cập nhật trạng thái

Rủi ro:

- Phòng đã thuê nhưng vẫn hiện trống.
- Môi giới mất niềm tin.

Cách xử lý:

- Có nút báo sai thông tin.
- Có lịch sử cập nhật.
- Có thể thêm nhắc xác nhận phòng trống sau này.

---

### 16.2. Link Google Drive bị sai quyền

Rủi ro:

- Môi giới không mở được ảnh.

Cách xử lý:

- UI hiển thị hướng dẫn: “Hãy để quyền Anyone with the link can view”.
- Cho phép chủ nhà test mở link.
- Cho phép upload ảnh trực tiếp thay thế.

---

### 16.3. Dữ liệu ảnh bị phụ thuộc Google Drive

Rủi ro:

- Chủ nhà xóa ảnh trong Drive.
- Link ảnh chết.

Cách xử lý:

- MVP chấp nhận vì cần nhanh/rẻ.
- Sau này có thể đồng bộ ảnh về storage app.
- Cho phép upload ảnh trực tiếp.

---

### 16.4. Môi giới chia sẻ link ra ngoài

Rủi ro:

- Dữ liệu phòng bị lộ.

Cách xử lý:

- MVP ưu tiên yêu cầu đăng nhập để xem đầy đủ.
- Sau này có tracking link, watermark, phân quyền sâu hơn.

---

## 17. Nâng cấp sau MVP

### v1.5

- Google Drive Picker.
- AI tạo tin đăng.
- AI chuẩn hóa mô tả phòng.
- Web push/email notification.
- Watermark ảnh đơn giản.
- Tải ảnh hàng loạt.

### v2

- Zalo Mini App nếu có traction.
- Zalo OA/ZBS nếu cần thông báo chính thức.
- AI tìm phòng theo nhu cầu khách.
- Tracking link môi giới.
- Phân quyền nâng cao theo từng căn nhà.
- Gói Pro/VIP cho môi giới.
- Thanh toán/gói dịch vụ.
- CRM khách thuê.

---

## 18. Prompt context cho module tiếp theo

Khi mở chat mới, dùng đoạn sau:

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
