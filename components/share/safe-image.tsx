"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

type SafeImageProps = {
  alt: string;
  className?: string;
  fallbackClassName?: string;
  src: string | null | undefined;
};

export function SafeImage({ alt, className, fallbackClassName, src }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={
          fallbackClassName ??
          "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400"
        }
      >
        <ImageIcon className="size-8" aria-hidden />
        <span className="text-sm font-semibold">Chưa có ảnh</span>
      </div>
    );
  }

  return <img alt={alt} className={className} onError={() => setFailed(true)} src={src} />;
}
