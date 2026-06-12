import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evox Business OS",
  description:
    "Replace the chaos of 10+ tools with one intelligent OS for your business.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const isPreviewEnvironment =
    process.env.NODE_ENV !== "development" &&
    (process.env.VERCEL_TARGET_ENV === "preview" ||
      process.env.VERCEL_ENV === "preview");

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0b0e]">
        {isPreviewEnvironment ? (
          <Script
            src="https://app.cofounder.co/agentation/widget.js"
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
