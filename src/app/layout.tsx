import type { Metadata } from "next";
import "./globals.css";
import { GeoCropProvider } from "@/context/GeoCropContext";

export const metadata: Metadata = {
  title: "GeoCrop-NE | Assam Agricultural Intelligence & Forecasting Platform",
  description: "Advanced spatio-temporal remote sensing, all-weather radar fusion, and field crop cutting experiment platform for Assam (NESFIC-D-12 / ASSAC).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <GeoCropProvider>
          {children}
        </GeoCropProvider>
      </body>
    </html>
  );
}
