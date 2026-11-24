import type { Metadata, Viewport } from "next";

import { PwaProvider } from "@/components/pwa-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MyBudget",
    template: "%s · MyBudget",
  },
  description: "Tus gastos personales y compartidos, claros en un solo lugar.",
  applicationName: "MyBudget",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyBudget",
  },
  icons: {
    icon: "/app-icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f3d3e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
