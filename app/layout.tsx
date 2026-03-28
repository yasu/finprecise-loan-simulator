import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "住宅ローン シミュレーター | finprecise",
  description:
    "変動金利・繰上返済・元利均等/元金均等に対応した住宅ローンシミュレーター。任意精度演算エンジン @finprecise/loans による正確な計算。",
  keywords: [
    "住宅ローン",
    "シミュレーター",
    "返済計画",
    "変動金利",
    "繰上返済",
    "元利均等",
    "元金均等",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
