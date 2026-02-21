import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ICEConnect",
  description: "International Community Of Entrepreneurs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#E5E7EB] text-[#0B1F3A]">
        {children}
      </body>
    </html>
  );
}