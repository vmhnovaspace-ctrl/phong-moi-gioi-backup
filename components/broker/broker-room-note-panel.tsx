"use client";

import { useMemo, useState, useTransition } from "react";
import { Eraser, Save } from "lucide-react";
import { saveBrokerRoomNote } from "@/app/broker/actions";

type BrokerRoomNotePanelProps = {
  initialValue: string | null;
  roomId: string;
};

export function BrokerRoomNotePanel({ initialValue, roomId }: BrokerRoomNotePanelProps) {
  const normalizedInitialValue = useMemo(() => normalizeInitialNote(initialValue), [initialValue]);
  const [note, setNote] = useState(normalizedInitialValue);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function persist(nextNote: string, successMessage: string) {
    startTransition(async () => {
      try {
        await saveBrokerRoomNote(roomId, nextNote);
        setMessage(successMessage);
        window.setTimeout(() => setMessage(null), 1800);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Không lưu được ghi chú.");
      }
    });
  }

  function clearNote() {
    if (!note.trim()) {
      return;
    }

    if (!window.confirm("Xóa ghi chú của phòng này?")) {
      return;
    }

    setNote("");
    persist("", "Đã xóa ghi chú.");
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-base font-bold text-slate-950">Ghi chú</h3>
        <p className="mt-1 text-sm text-slate-500">
          Ghi chú này chỉ bạn thấy, không ảnh hưởng thông tin chủ nhà/phòng.
        </p>
      </div>

      <textarea
        className="mt-4 min-h-36 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ví dụ: Khách A thích phòng này, hẹn xem lúc 18h, cần hỏi thêm phí xe..."
        value={note}
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isPending || !note.trim()}
          onClick={clearNote}
          type="button"
        >
          <Eraser className="size-4" aria-hidden />
          Xóa ghi chú
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          disabled={isPending}
          onClick={() => persist(note, "Đã lưu ghi chú.")}
          type="button"
        >
          <Save className="size-4" aria-hidden />
          Lưu ghi chú
        </button>
      </div>

      {message ? <p className="mt-3 text-sm font-medium text-slate-600">{message}</p> : null}
    </section>
  );
}

function normalizeInitialNote(value: string | null) {
  if (!value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value) as {
      rows?: unknown;
      type?: unknown;
    };

    if (parsed.type === "broker_note_table_v1" && Array.isArray(parsed.rows)) {
      return parsed.rows
        .filter((row): row is string[] => Array.isArray(row))
        .map((row) => row.filter((cell) => typeof cell === "string" && cell.trim()).join(" | "))
        .filter(Boolean)
        .join("\n");
    }
  } catch {
    return value;
  }

  return value;
}
