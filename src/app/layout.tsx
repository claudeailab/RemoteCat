import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RemoteCat",
  description: "RemoteCat application",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={geist.className}>
        {children}
        <Toaster richColors position="top-right" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
