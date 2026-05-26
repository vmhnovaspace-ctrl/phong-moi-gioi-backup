"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Copy, XCircle } from "lucide-react";

type CopyTextButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  errorLabel?: string;
  className?: string;
};

type CopyState = "idle" | "copied" | "error";

export function CopyTextButton({
  className,
  copiedLabel = "Đã copy",
  errorLabel = "Không copy được",
  label = "Copy",
  text
}: CopyTextButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  async function copyText() {
    const ok = await writeClipboard(text);
    setState(ok ? "copied" : "error");
    window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      className={clsx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50",
        className
      )}
      onClick={copyText}
      type="button"
    >
      {state === "copied" ? <Check className="size-4" aria-hidden /> : null}
      {state === "error" ? <XCircle className="size-4" aria-hidden /> : null}
      {state === "idle" ? <Copy className="size-4" aria-hidden /> : null}
      {state === "copied" ? copiedLabel : state === "error" ? errorLabel : label}
    </button>
  );
}

async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback for older mobile browsers.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
