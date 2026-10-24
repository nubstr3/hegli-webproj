import Script from "next/script";
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import TouchDetect from "./components/TouchDetect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ACCENT_INIT = `try{var a=localStorage.getItem("hegli-accent");if(a&&/^#[0-9a-fA-F]{6}$/.test(a))document.documentElement.style.setProperty("--accent",a)}catch(e){}`;

export const metadata: Metadata = {
  title: "hegli.dev",
  description: "Personal Developer Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script src="/debug.js" />
        <Script id="hegli-accent-init" strategy="beforeInteractive">{ACCENT_INIT}</Script>
        {children}<TouchDetect /></body>
    </html>
  );
}
