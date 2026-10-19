# Asthalaxmi Forest & Plantation Monitoring Frontend (Next.js 14)

Modern, enterprise-grade GIS and forest analytics dashboard built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Leaflet**, and **Recharts** for the State of Assam, India.

Designed to address **NESFIC-D-15** indicative technology directions:
- **Optical & SAR Remote Sensing Fusion**: Near-real-time Sentinel-1 C-Band SAR backscatter and Sentinel-2 MSI NDVI tracking.
- **Sub-decimeter UAV Vision & Canopy Height Model**: Drone mission flight-logs, orthomosaic inspection, and automated crown segmentation.
- **Afforestation Scheme Auditing**: Survival rates and health indicators across CAMPA, NABARD, and Social Forestry plantations.
- **IPCC Tier-2 Carbon MRV & Credit Registry**: Verra VCS and Gold Standard credit issuance with cryptographic SHA-256 seals.
- **Real-Time Deforestation Incident Workflow**: Automated alert dispatch, field inspections, and tamper-evident audit logs.

---

## Tech Stack & Architecture

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) with dark mode support
- **Spatial GIS**: [Leaflet 1.9](https://leafletjs.com/) & [React-Leaflet 4](https://react-leaflet.js.org/) with SSR dynamic loading
- **Charts & Data Visualization**: [Recharts 2](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

---

## Project Structure

```
next-frontend/
├── next.config.mjs                 # Next.js config with API proxy rewrites to FastAPI backend
├── tailwind.config.js              # Forest green color scheme & dark mode configuration
├── postcss.config.js               # PostCSS config
├── jsconfig.json                   # Path alias mappings (@/* -> ./src/*)
├── package.json                    # Dependencies & scripts
└── src/
    ├── api/
    │   └── client.js               # Centralized REST API client for FastAPI endpoints
    ├── app/
    │   ├── layout.jsx              # Root layout (fonts, providers, global styles)
    │   ├── globals.css             # Tailwind directives & Leaflet styling
    │   ├── page.jsx                # Dashboard Overview (/)
    │   ├── map/page.jsx            # GIS Spatial Map View (/map)
    │   ├── divisions/page.jsx      # Forest Divisions View (/divisions)
    │   ├── compartments/page.jsx   # Forest Compartment Boundaries (/compartments)
    │   ├── plantations/page.jsx    # Afforestation Plantations & Survival (/plantations)
    │   ├── sample-plots/page.jsx   # Sample Plots Inventory (/sample-plots)
    │   ├── tree-measurements/page.jsx # Individual Tree Measurements (/tree-measurements)
    │   ├── alerts/page.jsx         # Deforestation & Degradation Alerts (/alerts)
    │   ├── field-inspections/page.jsx # Ground Verification Inspections (/field-inspections)
    │   ├── carbon-mrv/page.jsx     # Carbon MRV Accounting & Certification (/carbon-mrv)
    │   ├── audit-log/page.jsx      # System Security & Audit Trail (/audit-log)
    │   ├── settings/page.jsx       # System Settings & Configuration (/settings)
    │   ├── satellite/page.jsx      # Satellite STAC Catalog & Radar (/satellite)
    │   ├── drone-surveys/page.jsx  # Drone UAV Missions & AI Crown Count (/drone-surveys)
    │   └── resources/page.jsx      # Government Portals & ISFR Standards (/resources)
    └── components/
        ├── Layout/                 # Sidebar, Header & DashboardLayout wrapper
        ├── common/                 # DataTable (inline editing & CSV export), Modal, KPICard, StatusBadge
        ├── Map/                    # MapViewClient with dynamic SSR-safe Leaflet rendering
        ├── Dashboard/              # Analytic KPI cards & Recharts graphs
        ├── Satellite/              # Sentinel-1 SAR and Sentinel-2 STAC records table
        ├── DroneSurveys/           # UAV mission cards, dossier modal & AI trigger
        ├── CarbonMRV/              # IPCC calculator & Verra credit issuance
        └── ...                     # Compartments, Plantations, Alerts, Inspections
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.17.0 or later
- **Backend API**: The FastAPI backend should be running on `http://127.0.0.1:8000` (or set `NEXT_PUBLIC_API_URL`).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/kaustavgayon93-ux/Asthalaxmi-Frontend.git
cd Asthalaxmi-Frontend

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Deployment on Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g. `https://api.asthalaxmi.assam.gov.in`).
4. Click **Deploy**. Next.js App Router will optimize, pre-render, and serve the dashboard globally.
