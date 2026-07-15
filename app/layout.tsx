import type { Metadata } from "next";
import { Poppins, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Providers } from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chez Keke POS — at Keke's Place",
  description: "Point of sale system for Chez Keke restaurant. Sign in to manage orders, staff, and cashier operations.",
  applicationName: "Chez Keke POS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chez Keke",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Chez Keke POS",
    title: "Chez Keke POS",
    description: "Premium Point of Sale system for Chez Keke restaurant.",
  },
  twitter: {
    card: "summary",
    title: "Chez Keke POS",
    description: "Premium Point of Sale system for Chez Keke restaurant.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  keywords: [
    "restaurant POS",
    "point of sale",
    "Chez Keke",
    "Ghana restaurant",
    "Odumase Krobo",
  ],
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#070707",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport = {
  themeColor:           "#070707",
  width:                "device-width",
  initialScale:         1,
  maximumScale:         1,
  userScalable:         false,
  viewportFit:          "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${newsreader.variable} ${poppins.className} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-brand/20 selection:text-brand">
        <Providers>
          {children}
          <Toaster theme="dark" position="top-right" richColors />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
