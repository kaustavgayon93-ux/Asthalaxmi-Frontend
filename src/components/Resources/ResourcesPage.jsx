'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Layers,
  Database,
  Search,
  Building2,
  Satellite,
  Flame,
  CheckCircle2,
  BookOpen,
  FileCheck,
  Radio,
  Landmark,
} from 'lucide-react';
import KPICard from '../common/KPICard';
import { fetchGovernmentResources, fetchGovernmentResourcesSummary } from '../../api/client';
import toast from 'react-hot-toast';

const FALLBACK_RESOURCES = [
  {
    id: 1,
    name: "ISFR 2023 (Assam Chapter 10.3)",
    agency: "Forest Survey of India (FSI), MoEFCC",
    level: "National Scientific",
    role: "Ground truth baseline for forest area (28,313.55 km²), carbon stock (272 Mt), canopy density stratification (VDF 4.07%, MDF 12.45%, OF 19.58%) and RFA (26,832 km²).",
    url: "https://fsi.nic.in/",
    category: "Scientific Baselines & Inventory",
    data_types: ["Forest Cover 1:50K", "Canopy Density Classes", "Growing Stock / Carbon Stock", "Bamboo Resources"],
    integration_status: "Calibrated",
    citation: "FSI India State of Forest Report 2023, Vol II, Chapter 10 - Assam",
  },
  {
    id: 2,
    name: "Bhuvan Indian Geo-Platform",
    agency: "National Remote Sensing Centre (NRSC), ISRO",
    level: "National Geospatial",
    role: "Multi-temporal LULC 1:50K layers, Forest Fraction Cover, NDVI, Forest Fire Point Services, and OGC WMS/WMTS map services integration.",
    url: "https://bhuvan.nrsc.gov.in/",
    category: "Geospatial & Remote Sensing",
    data_types: ["OGC WMS Layers", "LULC 50K", "Active Fire Hotspots", "High-Resolution Basemaps"],
    integration_status: "WMS Ingested",
    citation: "NRSC / ISRO Bhuvan Spatial Data Infrastructure",
  },
  {
    id: 3,
    name: "VEDAS",
    agency: "Space Applications Centre (SAC), ISRO",
    level: "National Analytics",
    role: "High-performance API Centre for NDVI time-series analysis, Vegetation Carbon Stock (VCS) models, and Above-Ground Biomass (AGB) raster products.",
    url: "https://vedas.sac.gov.in/en/",
    category: "Geospatial & Remote Sensing",
    data_types: ["Time-Series Vegetation Indices", "Biomass Models", "Desertification/Degradation Atlas"],
    integration_status: "API Synced",
    citation: "SAC / ISRO Visualisation of Earth science Data and Archival System",
  },
  {
    id: 4,
    name: "MOSDAC",
    agency: "Space Applications Centre (SAC), ISRO",
    level: "National Satellite",
    role: "INSAT-3D/3DR and SNPP-VIIRS active fire thermal anomalies, high-frequency precipitation anomalies, and flood/drought meteorological alerting.",
    url: "https://www.mosdac.gov.in",
    category: "Disaster & Active Alerting",
    data_types: ["30-min Thermal Anomaly Hotspots", "Precipitation Accumulation", "Cyclone/Storm Alerts"],
    integration_status: "Connected",
    citation: "SAC / ISRO Meteorological & Oceanographic Satellite Data Archival Centre",
  },
  {
    id: 5,
    name: "Survey of India Geoportal",
    agency: "Survey of India (DST, GoI)",
    level: "National Mapping",
    role: "Official administrative boundary coordinates for Assam's 35 districts, sub-divisions, revenue villages, and Reserved Forest 1:50,000 Open Series Maps (OSM) cadastral baseline.",
    url: "https://onlinemaps.surveyofindia.gov.in/",
    category: "Cadastral & Boundaries",
    data_types: ["District Boundaries", "Reserved Forest Cadastral Sheets", "1:50,000 Toposheets"],
    integration_status: "Calibrated",
    citation: "Survey of India Open Series Maps (OSM) & National Topographic Database",
  },
  {
    id: 6,
    name: "Assam Environment & Forest Department",
    agency: "Govt. of Assam",
    level: "State Administrative",
    role: "Administrative forest hierarchy (Territorial & Social Forestry divisions), Wildlife Wing jurisdiction (Kaziranga, Manas, Dehing Patkai), and state indigenous tree species registry.",
    url: "https://environmentandforest.assam.gov.in/",
    category: "State Administration",
    data_types: ["Administrative Hierarchy", "Plantation Scheme Registers", "Working Plans", "Wildlife Notifications"],
    integration_status: "Connected",
    citation: "Assam Forest Department Administrative Portal & Annual Administrative Reports",
  },
  {
    id: 7,
    name: "Assam State Geoportal",
    agency: "Directorate of Town & Country Planning, Govt. of Assam",
    level: "State Geospatial",
    role: "Inter-departmental spatial coordination, peri-urban Master Plan zones, and forest boundary encroachment monitoring against master planning.",
    url: "https://gistcp.assam.gov.in/geoportal/index.aspx",
    category: "Geospatial & Remote Sensing",
    data_types: ["Town & Country Planning Layers", "Land Use Classification", "Zonings"],
    integration_status: "Connected",
    citation: "Directorate of Town & Country Planning Assam Geospatial Node",
  },
  {
    id: 8,
    name: "NeSDR Assam (NESAC)",
    agency: "North Eastern Space Applications Centre (NESAC, Dept of Space)",
    level: "Regional Geospatial",
    role: "Regional hill division geospatial layers (Karbi Anglong, Dima Hasao), shifting cultivation (Jhum) dynamics, bamboo stock mapping, and slope instability models.",
    url: "https://nesdr.gov.in/assam/",
    category: "Geospatial & Remote Sensing",
    data_types: ["Hill Forest Stratification", "Jhum Land Dynamic Maps", "Regional Bamboo Stocks"],
    integration_status: "API Synced",
    citation: "NESAC North Eastern Spatial Data Repository (NeSDR)",
  },
  {
    id: 9,
    name: "Directorate of Economics & Statistics (DES Assam)",
    agency: "Transformation & Development Dept, Govt. of Assam",
    level: "State Statistical",
    role: "Statistical Handbook of Assam; macro-validation of land use allocation across forest, tea garden estates, rubber plantations, and agriculture.",
    url: "https://des.assam.gov.in/",
    category: "State Administration",
    data_types: ["Statistical Handbook of Assam", "District Land Utilization Statistics", "Agro-climatic Profiles"],
    integration_status: "Calibrated",
    citation: "Directorate of Economics and Statistics, Transformation & Development Department, Assam",
  },
  {
    id: 10,
    name: "ASDMA (Flood & Disaster Management)",
    agency: "Revenue & Disaster Management Dept, Govt. of Assam",
    level: "State Hazard",
    role: "Flood Early Warning System (FLEWS) inundation maps to distinguish flood-related canopy defoliation from logging/encroachment during Brahmaputra monsoon surges.",
    url: "https://asdma.assam.gov.in/",
    category: "Disaster & Active Alerting",
    data_types: ["FLEWS Real-Time Inundation Extents", "District Hazard Exposure Profiles", "Riverbank Erosion Layers"],
    integration_status: "Connected",
    citation: "Assam State Disaster Management Authority (ASDMA) FLEWS System",
  },
  {
    id: 11,
    name: "Data.gov.in (Open Government Data Platform)",
    agency: "National Informatics Centre (NIC), MeitY",
    level: "National Open Data",
    role: "MoEFCC state-wise afforestation targets, CAMPA fund physical progress tracking, and machine-readable open APIs for inter-state benchmarking.",
    url: "https://www.data.gov.in",
    category: "Open Data & Standards",
    data_types: ["CAMPA Afforestation Targets", "National Forest Inventory Aggregates", "Public Sector Metadata"],
    integration_status: "API Synced",
    citation: "Open Government Data (OGD) Platform India - data.gov.in",
  },
  {
    id: 12,
    name: "National Geospatial Data Catalogue",
    agency: "National Geospatial Program, DST, GoI",
    level: "National Discovery",
    role: "Discovery and federated metadata registry for Indian spatial data infrastructure (NSDI) ensuring ISO 19115 and OGC compliance.",
    url: "https://catalogue.geospatial.org.in",
    category: "Open Data & Standards",
    data_types: ["NSDI Metadata Standard ISO 19115", "OGC WFS/WMS Service Endpoints"],
    integration_status: "Connected",
    citation: "Department of Science and Technology (DST) National Geospatial Program",
  },
  {
    id: 13,
    name: "IPCC 2006 GL Vol-4 AFOLU",
    agency: "IPCC / UNFCCC",
    level: "International Standard",
    role: "Carbon fraction (CF = 0.47), root-to-shoot ratio (R = 0.26 for tropical moist deciduous forest), and molecular ratio conversion factor (44/12 = 3.67 tCO2e / tC).",
    url: "https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html",
    category: "Scientific Baselines & Inventory",
    data_types: ["Allometric Biomass Equations", "Tier-2 Root-to-Shoot Ratios", "Carbon Equivalent Coefficients"],
    integration_status: "Calibrated",
    citation: "2006 IPCC Guidelines for National Greenhouse Gas Inventories - Volume 4: AFOLU",
  },
  {
    id: 14,
    name: "DGCA Digital Sky Platform",
    agency: "Directorate General of Civil Aviation (DGCA), MoCA",
    level: "National Regulatory",
    role: "UAV Remote Pilot certification, No-Permission-No-Takeoff (NPNT) airspace classification (Green/Yellow/Red zones), and sub-decimeter drone survey compliance.",
    url: "https://digitalsky.dgca.gov.in/",
    category: "UAV & Aviation Standards",
    data_types: ["Airspace Map (Green Zone Clearances)", "UAV Flight Approvals", "Pilot Licenses"],
    integration_status: "Connected",
    citation: "Ministry of Civil Aviation / DGCA Drone Rules 2021 & Digital Sky Platform",
  },
];

const STATUS_BADGES = {
  Connected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  Calibrated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  'WMS Ingested': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  'API Synced': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
};

export default function ResourcesPage() {
  const [resources, setResources] = useState(FALLBACK_RESOURCES);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resData, sumData] = await Promise.all([
        fetchGovernmentResources(),
        fetchGovernmentResourcesSummary(),
      ]);
      if (Array.isArray(resData) && resData.length > 0) {
        setResources(resData);
      }
      if (sumData) {
        setSummary(sumData);
      }
    } catch (err) {
      console.warn('API error, using cached government resources baseline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category));
    return ['All', ...Array.from(set)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.agency.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          r.level.toLowerCase().includes(q) ||
          r.data_types.some((dt) => dt.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Official Government Portals & Data Standards
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase">
                NESFIC-D-15
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Authoritative registry of national space platforms (ISRO), MoEFCC inventories (FSI), state disaster systems (ASDMA) and IPCC Tier-2 carbon standards.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Landmark}
          title="Integrated Govt Portals"
          value={resources.length}
          subtitle="ISRO, FSI, ASDMA, Survey of India"
          color="green"
        />
        <KPICard
          icon={ShieldCheck}
          title="Standards Compliance"
          value="100%"
          subtitle="Grounded in public GoI & Assam portals"
          color="blue"
        />
        <KPICard
          icon={BookOpen}
          title="State Forest Cover (ISFR 2023)"
          value="28,313 km²"
          subtitle="36.10% state area (RFA: 26,832 km²)"
          color="purple"
        />
        <KPICard
          icon={FileCheck}
          title="State Carbon Stock Baseline"
          value="272 Mt"
          subtitle="IPCC Tier-2 (~61.10 t/ha average)"
          color="yellow"
        />
      </div>


      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search portals, agency, dataset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Portals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Header: Name + Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                    #{res.id} • {res.level}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight mt-0.5">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {res.agency}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    STATUS_BADGES[res.integration_status] || STATUS_BADGES.Connected
                  }`}
                >
                  {res.integration_status}
                </span>
              </div>

              {/* Role in MRV */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed my-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                {res.role}
              </p>

              {/* Data Types Tags */}
              <div className="mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  Integrated Datasets:
                </span>
                <div className="flex flex-wrap gap-1">
                  {res.data_types.map((dt) => (
                    <span
                      key={dt}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                    >
                      {dt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions & Citation */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 italic mb-2 line-clamp-1" title={res.citation}>
                Ref: {res.citation}
              </div>
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                <span>Access Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No government resources found
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your category filter or search query.
          </p>
        </div>
      )}
    </div>
  );
}
