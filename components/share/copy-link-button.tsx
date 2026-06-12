"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { buildAbsoluteUrl } from "@/lib/site-url";

type CopyLinkButtonProps = {
  label?: string;
  copiedLabel?: string;
  path?: string;
  url?: string;
  className?: string;
};

export function CopyLinkButton({
  className,
  copiedLabel = "Đã copy",
  label = "Copy link",
  path,
  url
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const value = url ?? (path ? buildAbsoluteUrl(path) : window.location.href);

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-bold text-[#0F5FD7] hover:bg-[#EFF6FF]",
        className
      )}
      onClick={copyLink}
      type="button"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? copiedLabel : label}
    </button>
  );
}
