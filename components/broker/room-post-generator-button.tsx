"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Copy, ExternalLink, FileText, ImageIcon, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { markBrokerRoomPostChannel } from "@/app/broker/actions";
import type { BrokerPostChannel } from "@/lib/broker/types";
import {
  generateRoomPost,
  postChannelLabels,
  type GenerateRoomPostInput,
  type RoomPostImageInput
} from "@/lib/broker/post-templates";

type RoomPostGeneratorButtonProps = {
  input: Omit<GenerateRoomPostInput, "channel">;
  label?: string;
  variant?: "primary" | "secondary" | "menu";
};

const channels: BrokerPostChannel[] = ["chotot", "mogi", "facebook", "zalo"];

export function RoomPostGeneratorButton({
  input,
  label = "Tạo bài đăng",
  variant = "secondary"
}: RoomPostGeneratorButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState<BrokerPostChannel>("chotot");
  const generated = useMemo(() => generateRoomPost({ ...input, channel }), [channel, input]);
  const images = useMemo(() => getPostImages(input), [input]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(images[0]?.image_url ?? null);
  const [title, setTitle] = useState(generated.title);
  const [body, setBody] = useState(generated.body);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const driveUrls = [
    input.room.room_drive_folder_url
      ? { label: "Mở thư mục ảnh Drive", url: input.room.room_drive_folder_url }
      : null,
    input.building.building_drive_folder_url
      ? { label: "Mở Drive căn nhà", url: input.building.building_drive_folder_url }
      : null
  ].filter((item): item is { label: string; url: string } => Boolean(item));
  const hasImageSource = images.length > 0 || driveUrls.length > 0;

  function openModal() {
    const next = generateRoomPost({ ...input, channel });
    setTitle(next.title);
    setBody(next.body);
    setSelectedImageUrl(images[0]?.image_url ?? null);
    setIsDirty(false);
    setIsOpen(true);
  }

  function changeChannel(nextChannel: BrokerPostChannel) {
    if (nextChannel === channel) {
      return;
    }

    if (isDirty && !window.confirm("Đổi mẫu sẽ thay thế nội dung đang sửa. Bạn có muốn tiếp tục không?")) {
      return;
    }

    const next = generateRoomPost({ ...input, channel: nextChannel });
    setChannel(nextChannel);
    setTitle(next.title);
    setBody(next.body);
    setIsDirty(false);
  }

  function regenerate() {
    const next = generateRoomPost({ ...input, channel });
    setTitle(next.title);
    setBody(next.body);
    setIsDirty(false);
  }

  async function copyPost() {
    await navigator.clipboard.writeText(`${title}\n\n${body}`.trim());
    setToast("Đã copy bài đăng");
    window.setTimeout(() => setToast(null), 1800);
  }

  function markPosted() {
    startTransition(async () => {
      await markBrokerRoomPostChannel(input.room.id, channel);
      router.refresh();
      setToast(channel === "zalo" ? "Đã đánh dấu đã gửi khách" : `Đã đánh dấu đã đăng ${postChannelLabels[channel]}`);
      window.setTimeout(() => setToast(null), 1800);
    });
  }

  return (
    <>
      <button
        className={
          variant === "primary"
            ? "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            : variant === "menu"
              ? "flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              : "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-100"
        }
        onClick={openModal}
        type="button"
      >
        <FileText className={variant === "primary" || variant === "menu" ? "size-4" : "size-3.5"} aria-hidden />
        {label}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-4xl sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">Tạo bài đăng</h3>
                <p className="text-xs text-slate-500">
                  Nội dung đã ẩn thông tin nội bộ, bạn có thể sửa trước khi copy.
                </p>
              </div>
              <button
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-4" aria-hidden />
                <span className="sr-only">Đóng</span>
              </button>
            </div>

            <div className="max-h-[calc(94vh-62px)] overflow-y-auto p-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {channels.map((item) => (
                  <button
                    className={
                      channel === item
                        ? "h-10 whitespace-nowrap rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
                        : "h-10 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    }
                    key={item}
                    onClick={() => changeChannel(item)}
                    type="button"
                  >
                    {postChannelLabels[item]}
                  </button>
                ))}
              </div>

              <section className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-teal-700" aria-hidden />
                  <h4 className="text-sm font-bold text-slate-950">Ảnh đăng bài</h4>
                </div>

                {images.length > 0 ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
                    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                      <img
                        alt="Ảnh phòng đang chọn"
                        className="aspect-[4/3] w-full object-cover"
                        src={selectedImageUrl ?? images[0].image_url}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500">
                          Ảnh upload/link ảnh trong app, dùng để tải hoặc đăng thủ công.
                        </p>
                        <a
                          className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          href={selectedImageUrl ?? images[0].image_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Mở ảnh
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
                      {images.map((image, index) => (
                        <button
                          className={
                            (selectedImageUrl ?? images[0].image_url) === image.image_url
                              ? "overflow-hidden rounded-md border-2 border-teal-600"
                              : "overflow-hidden rounded-md border border-slate-200"
                          }
                          key={`${image.image_url}-${index}`}
                          onClick={() => setSelectedImageUrl(image.image_url)}
                          type="button"
                        >
                          <img
                            alt={`Ảnh phòng ${index + 1}`}
                            className="aspect-square w-full object-cover"
                            src={image.image_url}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {driveUrls.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {driveUrls.map((drive) => (
                      <a
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-teal-200 bg-white px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                        href={drive.url}
                        key={drive.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {drive.label}
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    ))}
                  </div>
                ) : null}

                {!hasImageSource ? (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    Phòng này chưa có ảnh. Nên bổ sung ảnh trước khi đăng để tăng khả năng chốt khách.
                  </p>
                ) : null}
              </section>

              <label className="mt-4 block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Preview tiêu đề bài đăng
                </span>
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setIsDirty(true);
                  }}
                  value={title}
                />
              </label>

              <label className="mt-4 block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nội dung bài đăng
                </span>
                <textarea
                  className="min-h-[340px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => {
                    setBody(event.target.value);
                    setIsDirty(true);
                  }}
                  value={body}
                />
              </label>

              <div className="sticky bottom-0 -mx-4 mt-4 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={regenerate}
                  type="button"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Tạo lại theo mẫu
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-60"
                  onClick={markPosted}
                  type="button"
                  disabled={isPending}
                >
                  <CheckCircle2 className="size-4" aria-hidden />
                  {channel === "zalo" ? "Đánh dấu đã gửi khách" : "Đánh dấu đã đăng"}
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
                  onClick={copyPost}
                  type="button"
                >
                  <Copy className="size-4" aria-hidden />
                  Copy toàn bộ bài đăng
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </>
  );
}

function getPostImages(input: Omit<GenerateRoomPostInput, "channel">) {
  const images = [
    input.room.cover_image_url
      ? {
          image_url: input.room.cover_image_url,
          is_cover: true,
          sort_order: -1
        }
      : null,
    ...(input.images ?? [])
  ]
    .filter((image): image is RoomPostImageInput & { image_url: string } => Boolean(image?.image_url))
    .sort((a, b) => {
      if (Boolean(a.is_cover) !== Boolean(b.is_cover)) {
        return a.is_cover ? -1 : 1;
      }

      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.image_url)) {
      return false;
    }

    seen.add(image.image_url);
    return true;
  });
}
