import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { PixelArtProvider } from "./pixel-art-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minecraft Pixel Art",
  description: "Generate Minecraft pixel art from an image",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* On every page (this is the root layout, not any one route), so
            there's always a way back to step 1 without retracing whichever
            page you happen to be on — the per-page "← Back" links only ever
            go one step back, not all the way. */}
        <header className="border-b border-zinc-800 px-4 py-3">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-zinc-100 hover:underline"
          >
            ⌂ Home
          </Link>
        </header>
        <PixelArtProvider>{children}</PixelArtProvider>
      </body>
    </html>
  );
}
