import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  Home,
  Link2,
  ListChecks
} from "lucide-react";
import { requireRole } from "@/lib/auth/profile";

type GuideSection = {
  title: string;
  description?: string;
  bullets: string[];
};

type StepItem = {
  title: string;
  description: string;
};

const quickSteps: StepItem[] = [
  {
    title: "Đăng nhập tài khoản Chủ nhà",
    description: "Vào đúng tài khoản đã được duyệt để quản lý kho phòng của mình."
  },
  {
    title: "Tạo căn nhà/địa chỉ",
    description: "Mỗi căn nhà là một địa chỉ cụ thể, ví dụ một tòa nhà hoặc một căn hộ dịch vụ mini."
  },
  {
    title: "Thêm phòng vào đúng căn nhà",
    description: "Phòng nào thuộc địa chỉ nào thì tạo trong đúng căn nhà đó để môi giới không bị nhầm."
  },
  {
    title: "Nhập đủ thông tin cho thuê",
    description: "Cập nhật giá, cọc, diện tích, phí, tiện ích, dạng phòng, mô tả và điểm mạnh."
  },
  {
    title: "Thêm ảnh hoặc link Google Drive",
    description: "Có thể dán link thư mục ảnh, dán từng link ảnh hoặc upload trực tiếp nếu app đang hỗ trợ."
  },
  {
    title: "Cập nhật trạng thái phòng",
    description: "Chọn Đang trống, Sắp trống, Đang giữ cọc, Đã thuê hoặc Tạm ẩn theo tình trạng thật."
  },
  {
    title: "Copy link/copy tin gửi Zalo",
    description: "Dùng Zalo để gửi link hoặc nội dung đã copy; dữ liệu chuẩn vẫn nằm trong app."
  }
];

const checklist = [
  "Kiểm tra đúng căn nhà.",
  "Kiểm tra đúng mã phòng.",
  "Cập nhật giá, cọc và các khoản phí.",
  "Cập nhật trạng thái phòng mới nhất.",
  "Kiểm tra ảnh hoặc link Google Drive.",
  "Copy link hoặc copy tin gửi Zalo.",
  "Khi đã chốt hoặc đã thuê, cập nhật trạng thái ngay."
];

const guideSections: GuideSection[] = [
  {
    title: "Tổng quan",
    bullets: [
      "App dùng để quản lý kho phòng theo cấu trúc: Chủ nhà -> Căn nhà -> Phòng.",
      "Dữ liệu gốc nằm trong app. Zalo chỉ dùng để gửi link hoặc copy nội dung đã chuẩn bị sẵn.",
      "Khi Chủ nhà cập nhật phòng, môi giới sẽ xem được thông tin mới nhất trong kho phòng.",
      "Mỗi phòng phải thuộc một căn nhà cụ thể; không tạo phòng rời rạc ngoài căn nhà."
    ]
  },
  {
    title: "Hướng dẫn quản lý Căn nhà",
    description: "Căn nhà là nơi gom các phòng cùng một địa chỉ để môi giới đọc thông tin không bị lẫn.",
    bullets: [
      "Tạo căn nhà mới khi có một địa chỉ cho thuê riêng, một tòa nhà riêng hoặc một nhóm phòng dùng chung địa chỉ.",
      "Đặt tên căn nhà dễ nhận ra, ví dụ: Nguyễn Thị Thập Q7, Ung Văn Khiêm Bình Thạnh hoặc Căn Lê Văn Sỹ.",
      "Nhập rõ địa chỉ, phường, quận và thành phố để môi giới lọc phòng đúng khu vực.",
      "Nếu có link Google Maps, hãy dán vào trường Google Maps để người xem mở vị trí nhanh.",
      "Nhập tiện ích chung như thang máy, giữ xe, giờ giấc, máy giặt chung, camera, bảo vệ hoặc khu bếp chung.",
      "Nhập quy định chung như số người tối đa, nuôi thú cưng, giờ giấc, xe, khách qua đêm hoặc yêu cầu hợp đồng.",
      "Nếu có link nhóm Zalo, link ảnh căn nhà hoặc thư mục Google Drive ảnh căn nhà, hãy lưu vào đúng trường đang có trong form.",
      "Lưu ý: mỗi căn nhà là một địa chỉ cụ thể. Không tạo nhiều phòng ở nhiều địa chỉ khác nhau vào cùng một căn."
    ]
  },
  {
    title: "Hướng dẫn quản lý Phòng",
    description: "Phòng là dữ liệu môi giới xem nhiều nhất, nên cần nhập đúng và đủ ngay từ đầu.",
    bullets: [
      "Vào đúng căn nhà rồi bấm thêm phòng để tạo phòng mới trong địa chỉ đó.",
      "Nhập mã phòng dễ hiểu như 101, 2A, 3.02 hoặc STUDIO 01; không dùng mã quá khó nhớ.",
      "Nhập tầng, diện tích, giá thuê, tiền cọc, số người tối đa và hoa hồng nếu có.",
      "Nhập mô tả ngắn gọn: phòng phù hợp với ai, điểm mạnh, ánh sáng, nội thất, bếp, toilet, ban công/cửa sổ.",
      "Chọn tiện ích và dạng phòng đúng thực tế để môi giới lọc phòng chính xác.",
      "Khi có thay đổi giá, cọc, trạng thái, ngày trống hoặc mô tả, vào sửa phòng và lưu lại.",
      "Nếu cần tạo nhiều phòng giống nhau, dùng chức năng nhân bản phòng nếu app đang hiển thị nút nhân bản.",
      "Lưu ý: tạo phòng đúng căn nhà để môi giới không gửi nhầm địa chỉ cho khách."
    ]
  },
  {
    title: "Hướng dẫn cập nhật trạng thái phòng",
    description: "Trạng thái phòng là thông tin quan trọng nhất để tránh môi giới đẩy nhầm phòng đã thuê.",
    bullets: [
      "Đang trống: phòng có thể cho thuê ngay.",
      "Sắp trống: phòng chưa trống ngay nhưng có thể tư vấn trước; nếu có ngày có thể vào, hãy nhập ngày đó.",
      "Đang giữ cọc: đang giữ khách, môi giới nên cẩn thận khi đẩy.",
      "Đã thuê: phòng không còn trống và không nên xuất hiện trong danh sách sell mặc định.",
      "Tạm ẩn: Chủ nhà muốn ẩn phòng khỏi danh sách sell.",
      "Khi phòng đã thuê, cập nhật ngay sang Đã thuê.",
      "Khi phòng trống lại, chuyển về Đang trống để môi giới thấy và tư vấn được."
    ]
  },
  {
    title: "Hướng dẫn thêm ảnh",
    description: "Ảnh rõ giúp môi giới tư vấn nhanh hơn và giảm số lần phải hỏi lại Chủ nhà.",
    bullets: [
      "Nếu đã có album ảnh trong Google Drive, dán link thư mục Drive vào trường ảnh của căn hoặc phòng.",
      "Nếu chỉ muốn chọn vài ảnh, dán từng link ảnh nếu form đang hỗ trợ danh sách link ảnh.",
      "Nếu app đang có nút upload, có thể upload ảnh trực tiếp từ điện thoại hoặc máy tính.",
      "Google Drive nên để quyền Anyone with the link can view hoặc Bất kỳ ai có đường link đều xem được.",
      "Nên chọn ảnh rõ, đủ ánh sáng, có ảnh phòng, toilet, bếp, ban công hoặc cửa sổ nếu có.",
      "Sau khi lưu, mở thử link ảnh nếu cần để chắc rằng môi giới có thể xem được."
    ]
  },
  {
    title: "Hướng dẫn copy link và gửi Zalo",
    description: "Zalo là kênh gửi thông tin, còn app vẫn là nơi lưu dữ liệu chuẩn.",
    bullets: [
      "Link Chủ nhà: gửi khi muốn môi giới xem toàn bộ kho phòng của một Chủ nhà.",
      "Link Căn nhà: gửi vào nhóm Zalo riêng của một căn hoặc một địa chỉ.",
      "Link Phòng: gửi khi muốn đẩy một phòng cụ thể.",
      "Copy tin Chủ nhà: dùng khi muốn gửi tổng quan kho phòng đang trống/sắp trống.",
      "Copy tin Căn nhà: dùng khi một địa chỉ đang có nhiều phòng cần sell.",
      "Copy tin Phòng: dùng khi muốn gửi nhanh thông tin một phòng cụ thể.",
      "Không cần nhập lại dữ liệu trong Zalo. Hãy cập nhật trong app rồi copy link hoặc copy nội dung mới nhất."
    ]
  },
  {
    title: "Các lỗi thường gặp và cách xử lý",
    bullets: [
      "Không thấy phòng trên trang môi giới: kiểm tra trạng thái phòng, visibility nếu có và chắc chắn căn/phòng đã được lưu.",
      "Môi giới không mở được ảnh Drive: kiểm tra quyền chia sẻ Google Drive.",
      "Nhập xong nhưng chưa thấy thay đổi: tải lại trang và kiểm tra đã bấm Lưu chưa.",
      "Sai giá hoặc sai trạng thái: vào sửa phòng, cập nhật lại thông tin đúng rồi lưu.",
      "Tạo nhầm phòng ở sai căn: sửa lại nếu app có chức năng chuyển căn; nếu chưa có, báo admin để được hỗ trợ."
    ]
  }
];

export default async function LandlordGuidePage() {
  await requireRole(["landlord"]);

  return (
    <div className="space-y-5">
      <Link
        className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        href="/landlord"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại Căn nhà
      </Link>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950">Hướng dẫn sử dụng cho Chủ nhà</h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Trang này giúp Chủ nhà cập nhật căn, phòng, ảnh, trạng thái và link Zalo theo đúng quy trình của Kho Phòng Realtime.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-emerald-700" aria-hidden />
          <h2 className="text-lg font-black text-slate-950">Checklist nhanh khi có phòng trống</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <div className="flex gap-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700" key={item}>
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ListChecks className="size-5 text-[#0F5FD7]" aria-hidden />
          <h2 className="text-lg font-black text-slate-950">Quy trình sử dụng nhanh</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {quickSteps.map((step, index) => (
            <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" key={step.title}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0F5FD7] text-sm font-black text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4">
        {guideSections.map((section) => (
          <GuideCard key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}

function GuideCard({ section }: { section: GuideSection }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#0F5FD7]">
          <SectionIcon title={section.title} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
          {section.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{section.description}</p> : null}
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {section.bullets.map((bullet) => (
          <li className="flex gap-2 text-sm leading-6 text-slate-700" key={bullet}>
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionIcon({ title }: { title: string }) {
  if (title.includes("Căn nhà")) {
    return <Home className="size-5" aria-hidden />;
  }

  if (title.includes("Phòng")) {
    return <DoorOpen className="size-5" aria-hidden />;
  }

  if (title.includes("ảnh")) {
    return <Camera className="size-5" aria-hidden />;
  }

  if (title.includes("copy link")) {
    return <Link2 className="size-5" aria-hidden />;
  }

  if (title.includes("lỗi")) {
    return <AlertTriangle className="size-5" aria-hidden />;
  }

  return <BookOpen className="size-5" aria-hidden />;
}
