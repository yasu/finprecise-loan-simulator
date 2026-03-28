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

const siteUrl = "https://finprecise-loan-simulator.vercel.app";
const title = "住宅ローン シミュレーター | finprecise";
const description =
  "変動金利・繰上返済・元利均等/元金均等に対応した住宅ローンシミュレーター。任意精度演算エンジン @finprecise/loans による正確な計算。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "住宅ローン",
    "シミュレーター",
    "返済計画",
    "変動金利",
    "繰上返済",
    "元利均等",
    "元金均等",
  ],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "finprecise Loan Simulator",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "住宅ローン シミュレーター スクリーンショット",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/og-image.png`],
  },
  metadataBase: new URL(siteUrl),
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
