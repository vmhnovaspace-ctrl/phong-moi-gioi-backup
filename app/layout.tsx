import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kho Phòng Realtime",
  description: "Quản lý phòng trống realtime cho chủ nhà và môi giới"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
