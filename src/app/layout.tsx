import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/common/PWARegister";
import type { Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Zenvy Dine",
    template: "%s | Zenvy Dine",
  },
  description: "Production-grade Restaurant QR Ordering SaaS",
  applicationName: "Zenvy Dine",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Zenvy Dine",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-[#f5f5f7] text-foreground">
        <AuthProvider>
          {children}
          <PWARegister />
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className: "premium-panel text-foreground",
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
