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
  metadataBase: new URL("https://opsrelay.onrender.com"),
  title: "OpsRelay — Know what moves when a supplier slips",
  description: "Trace supplier disruptions to customer commitments, inspect the evidence, and review the response. Explore a working company brain powered by FalkorDB.",
  openGraph: {
    title: "OpsRelay — One update. The whole picture.",
    description: "See which customer commitments are affected by a supplier delay, trace the evidence, and give the right people a clear next step.",
    type: "website",
    siteName: "OpsRelay",
    images: [{ url: "/media/walkthrough.jpg", width: 1920, height: 1080, alt: "OpsRelay synthetic supply operations workspace" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
