import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";

const slides = [
  {
    title: "Môi giới dùng app để làm gì?",
    bullets: [
      "Xem phòng trống/sắp trống từ chủ nhà.",
      "Lọc phòng theo nhu cầu khách.",
      "Theo dõi phòng đang quan tâm.",
      "Gửi danh sách phòng cho khách qua Zalo.",
      "Nhận thông báo khi khách quan tâm phòng.",
      "Báo chốt phòng để chủ nhà xác nhận.",
      "App có 2 tab chính: Kho phòng; Tìm phòng và Gửi khách."
    ],
    image: "Hình minh họa giao diện 2 tab."
  },
  {
    title: "Tab Kho phòng dùng để làm gì?",
    bullets: [
      "Xem danh sách phòng đang trống/sắp trống.",
      "Lọc phòng theo khu vực, giá, diện tích.",
      "Xem thông tin từng phòng.",
      "Theo dõi phòng tốt.",
      "Báo chốt phòng cho chủ nhà."
    ],
    image: "Hình minh họa trang Kho phòng."
  },
  {
    title: "Cách đọc một card phòng",
    bullets: [
      "Tên phòng hoặc mã phòng.",
      "Tên căn nhà.",
      "Giá thuê.",
      "Tiền cọc.",
      "Khu vực.",
      "Ngày trống nếu có.",
      "Tầng/diện tích nếu có.",
      "Hoa hồng.",
      "Trạng thái: Đang trống hoặc Sắp trống.",
      "Mẹo: nhìn nhanh giá, khu vực, trạng thái và hoa hồng trước khi mở chi tiết."
    ],
    image: "Hình minh họa card phòng."
  },
  {
    title: "Cách lọc phòng trong Kho phòng",
    bullets: [
      "Có thể lọc theo: Chủ nhà, Quận/khu vực, Phường, Trạng thái, Giá từ, Giá đến, Diện tích từ, Diện tích đến, Có nội thất, Cho nuôi thú cưng.",
      "Sau khi chọn điều kiện, bấm Lọc. Muốn làm lại thì bấm Xóa lọc."
    ],
    image: "Hình minh họa bộ lọc Kho phòng."
  },
  {
    title: "Xem chi tiết phòng",
    bullets: [
      "Bấm Xem chi tiết để kiểm tra: Giá thuê, Tiền cọc, Diện tích, Tiện ích phòng, Phí điện/nước/dịch vụ nếu có, Ảnh phòng, Link Drive, Ghi chú riêng của bạn."
    ],
    image: "Hình minh họa trang chi tiết phòng."
  },
  {
    title: "Chốt phòng",
    bullets: [
      "Khi khách đã đồng ý chốt phòng, quay lại danh sách phòng và bấm Chốt phòng trên card phòng.",
      "Quy trình: Môi giới bấm Chốt phòng; Hệ thống gửi yêu cầu cho chủ nhà; Chủ nhà xác nhận hoặc từ chối; Nếu chủ nhà xác nhận, phòng mới được cập nhật trạng thái.",
      "Lưu ý: Môi giới không tự đổi trạng thái phòng. Chủ nhà là người xác nhận cuối."
    ],
    image: "Hình minh họa nút Chốt phòng."
  },
  {
    title: "Tab Tìm phòng và Gửi khách dùng để làm gì?",
    bullets: [
      "Nhập thông tin khách.",
      "Lọc phòng theo nhu cầu.",
      "Chọn nhiều phòng phù hợp.",
      "Tạo một link gửi khách.",
      "Gửi link qua Zalo.",
      "Theo dõi khách bấm quan tâm phòng."
    ],
    image: "Hình minh họa tab Tìm phòng và Gửi khách."
  },
  {
    title: "Nhập thông tin khách",
    bullets: [
      "Có thể nhập: Tên khách, Số điện thoại/Zalo, Link Zalo khách.",
      "Thông tin này giúp biết gói phòng đang gửi cho khách nào.",
      "Nếu chưa đủ thông tin vẫn có thể tạo gói phòng trước."
    ],
    image: "Hình minh họa khu thông tin khách."
  },
  {
    title: "Lọc phòng cho khách",
    bullets: [
      "Chọn điều kiện theo nhu cầu: Quận/khu vực, Phường, Chủ nhà, Giá từ, Giá đến, Diện tích từ, Diện tích đến, Trạng thái, Có nội thất, Cho nuôi thú cưng.",
      "Sau đó bấm Tìm phòng phù hợp."
    ],
    image: "Hình minh họa bộ lọc gửi khách."
  },
  {
    title: "Chọn phòng và tạo gói gửi khách",
    bullets: [
      "Chọn các phòng phù hợp.",
      "Có thể chọn tối đa số phòng app đang cho phép.",
      "Bấm Tạo gói gửi khách.",
      "Hệ thống tạo link riêng cho khách."
    ],
    image: "Hình minh họa gói gửi khách đã tạo."
  },
  {
    title: "Gửi Zalo cho khách",
    bullets: [
      "Bấm Copy tin nhắn để copy nội dung.",
      "Bấm Gửi Zalo để mở Zalo khách nếu đã nhập thông tin Zalo.",
      "Nội dung gửi gồm: Lời nhắn cho khách, Link gói phòng, Hướng dẫn khách xem thông tin phòng.",
      "Lưu ý: Link gửi khách do hệ thống tự tạo sẵn. Môi giới chỉ cần bấm Copy tin nhắn hoặc Gửi Zalo, không cần tự kiểm tra hay chỉnh sửa link."
    ],
    image: "Hình minh họa nút Copy tin nhắn và Gửi Zalo."
  },
  {
    title: "Khi khách bấm “Tôi quan tâm phòng này”",
    bullets: [
      "Hệ thống ghi nhận lại.",
      "Môi giới thấy thông báo Khách quan tâm trong tab Tìm phòng và Gửi khách.",
      "Việc cần làm: Liên hệ khách; Xác nhận khách muốn xem/chốt phòng nào; Nếu khách chốt, quay lại Kho phòng và bấm Chốt phòng; Sau khi đã xử lý, bấm Đã xử lý để ẩn thông báo khách quan tâm."
    ],
    image: "Hình minh họa thông báo khách quan tâm."
  },
  {
    title: "Quy trình chuẩn từ lúc có khách đến lúc chốt phòng",
    bullets: [
      "Khách nhắn nhu cầu.",
      "Môi giới vào Tìm phòng và Gửi khách.",
      "Lọc phòng theo nhu cầu.",
      "Chọn phòng phù hợp.",
      "Tạo gói gửi khách.",
      "Gửi link qua Zalo.",
      "Khách bấm quan tâm phòng.",
      "Môi giới liên hệ lại khách.",
      "Nếu khách chốt, vào Kho phòng bấm Chốt phòng.",
      "Chờ chủ nhà xác nhận."
    ],
    image: "Hình minh họa quy trình gửi khách và chốt phòng."
  },
  {
    title: "Những lưu ý quan trọng",
    bullets: [
      "Luôn kiểm tra trạng thái phòng trước khi gửi khách.",
      "Nếu phòng đã có khách chốt, hãy bấm Chốt phòng để chủ nhà xác nhận.",
      "Không để thông báo khách quan tâm tồn đọng sau khi đã xử lý.",
      "Nếu thông tin phòng sai, báo lại để chủ nhà/admin kiểm tra."
    ],
    image: "Hình minh họa các lưu ý quan trọng."
  }
];

export default async function BrokerGuidePage() {
  await requireRole(["broker"]);

  return (
    <div className="space-y-5">
      <Link
        className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        href="/broker"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại Kho phòng
      </Link>

      <section className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#0F5FD7]">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              Hướng dẫn Môi giới sử dụng Kho Phòng Realtime
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Trang này giúp Môi giới hiểu nhanh 2 khu vực chính: Kho phòng và Tìm phòng và Gửi khách.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {slides.map((slide, index) => (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={slide.title}>
            <p className="text-xs font-black uppercase tracking-wide text-[#0F5FD7]">Slide {index + 1}</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">{slide.title}</h2>
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              {slide.image}
            </div>
            <ul className="mt-3 space-y-2">
              {slide.bullets.map((bullet) => (
                <li className="flex gap-2 text-sm leading-6 text-slate-700" key={bullet}>
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
