# GeoCrop-NE: Next.js Frontend
### Intelligent Crop Intelligence & Forecasting Platform for Assam (NESFIC-D-12)

This repository contains the complete Next.js frontend implementation of **GeoCrop-NE**, designed for the Assam State Space Applications Centre (ASSAC), Directorate of Agriculture, and the Assam Innovation & Startup Foundation under **NESFIC-D-12**.

---

## 📚 Project Documentation & Specifications

The `docs/` directory contains complete reference materials for developers, spatial analysts, and AI agents:
* 📄 **[Product Requirement Document (PRD)](docs/PRD.md):** Complete specifications, user personas, functional/non-functional requirements.
* 🏛️ **[Technical Architecture & Scientific Methodology](docs/ARCHITECTURE.md):** Radar physics, Sentinel-1 SAR cloud penetration, Bayesian uncertainty quantification, and CCE formulas.
* 🌾 **[Assam Agricultural Domain Reference](docs/ASSAM_AGRI_DOMAIN.md):** Comprehensive catalog of all 50+ crops grown in Assam, 6 agro-climatic zones, and 35 districts.
* 🤖 **[AI Session Context & Operational Invariants](docs/AI_SESSION_CONTEXT.md):** Mandatory guidelines, constraints, and architecture rules for future AI coding sessions.

---

## 🚀 Key Features

* **🛰️ Web-GIS Command Center:** 
  * Interactive Leaflet maps with dynamic layers for Assam's 35 districts.
  * Simulated Sentinel-1 SAR all-weather flood inundation layer.
  * Verified field Crop Cutting Experiment (CCE) marker pins with photos and calculated yields.
* **🎯 Advance Pre-Harvest Forecasting & Uncertainty Quantification:**
  * Toggleable $T-45$, $T-30$, and $T-15$ day forecast horizons.
  * Dynamic Bayesian Uncertainty Quantification displaying Gaussian probability density curves ($90\%$ and $95\%$ Confidence Intervals) for food procurement planning.
* **📱 GeoCrop Collector (Field Mobile App Simulator):**
  * Offline-first local caching engine with pending sync queue.
  * High-accuracy GNSS GPS simulator ($\pm 2.4 - 4.5\,\text{m}$).
  * Standardized $5\,\text{m} \times 5\,\text{m}$ ($25\,\text{m}^2$) CCE yield calculation formula engine.
  * Multilingual support for English, Assamese (অসমীয়া), and Bengali (বাংলা).
* **🌾 Comprehensive Assam 50+ Crops Master Directory:**
  * Categorized into Cereals, Oilseeds, Pulses, Fibre & Cash Crops, Plantation Crops, Fruits, Vegetables, and Spices.
  * Scientific names, local Assamese names, typical yields, and moisture baselines.
* **✏️ 100% Fully Editable Data:**
  * Full inline & modal editing for all 35 districts, all crops, and all field surveys.
  * Persistent storage in browser `localStorage` with JSON export/import and baseline reset.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 14 / React 18 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Mapping:** Leaflet & OpenStreetMap / CartoDB Positron
* **Analytics:** Chart.js & React-Chartjs-2
* **Icons:** Lucide React

---

## 💻 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
