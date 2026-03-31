import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader, Noto_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  style: ["normal", "italic"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "The Gavel | Sovereign Scholar Dashboard",
    template: "%s | The Gavel",
  },
  description: "Gamified legal simulator — rule from the bench on real case materials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} ${newsreader.variable} ${notoSerif.variable} ${inter.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background font-sans text-foreground selection:bg-primary/30"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
