import './globals.css';
import DashboardLayout from '@/components/Layout/DashboardLayout';

export const metadata = {
  title: 'Asthalaxmi | Forest & Plantation Monitoring System (Assam)',
  description: 'Next.js 14 AI & Spatial Forest Monitoring System for Assam, India (NESFIC-D-15)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
