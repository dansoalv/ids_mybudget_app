import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";

import { PwaProvider } from "@/components/pwa-provider";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "MyBudget",
    template: "%s · MyBudget",
  },
  description: "Tus finanzas personales y gastos de grupo, organizados por separado.",
  applicationName: "MyBudget",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
  themeColor: "#faf0ca",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={montserrat.variable}>
      <body>
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
