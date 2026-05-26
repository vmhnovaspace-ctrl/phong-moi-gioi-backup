import { CopyTextButton } from "@/components/share/copy-text-button";

export function CopyRoomButton({
  className,
  label = "Copy tin đăng",
  text
}: {
  className?: string;
  label?: string;
  text: string;
}) {
  return (
    <CopyTextButton
      className={className ?? "h-9 px-3 text-xs"}
      label={label}
      text={text}
    />
  );
}
