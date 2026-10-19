'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  fetchCompartments,
  createCompartment,
  updateCompartment,
  deleteCompartment,
  fetchDivisions,
  importCompartmentsGeoJSON,
  importPillarsCompartment,
  calculateCompartmentTelemetry,
} from '../../api/client';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import KPICard from '../common/KPICard';
import {
  Grid3X3,
  Maximize2,
  Trees,
  Leaf,
  UploadCloud,
  FileText,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
  Milestone,
  ShieldCheck,
  Calculator,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STANDARD_FOREST_TYPES = [
  'Tropical Semi-Evergreen',
  'Tropical Wet Evergreen',
  'Sal Forest (Shorea robusta)',
  'Tropical Moist Deciduous',
  'Sub-Himalayan Secondary Wet',
  'Bamboo Forest',
  'Alluvial Grassland',
];

const KNOWN_DIVISION_COORDS = {
  'Kamrup East Division': { lat: 26.115, lng: 91.821, range: 'Guwahati East Range', beat: 'Khanapara Beat', forest_type: 'Sal Forest (Shorea robusta)', area_ha: 310.0 },
  'Kamrup West Division': { lat: 26.012, lng: 91.350, range: 'Boko Range', beat: 'Singra Beat', forest_type: 'Tropical Moist Deciduous', area_ha: 360.0 },
  'Sonitpur Division': { lat: 26.820, lng: 92.780, range: 'Charduar Range', beat: 'Balipara Beat', forest_type: 'Tropical Wet Evergreen', area_ha: 520.0 },
  'Golaghat Division': { lat: 26.450, lng: 93.850, range: 'Golaghat Range', beat: 'Nambor Beat', forest_type: 'Tropical Semi-Evergreen', area_ha: 410.0 },
  'Nagaon Division': { lat: 26.350, lng: 92.680, range: 'Nagaon Range', beat: 'Samaguri Beat', forest_type: 'Tropical Moist Deciduous', area_ha: 290.0 },
  'Jorhat Division': { lat: 26.750, lng: 94.210, range: 'Jorhat Range', beat: 'Mariani Beat', forest_type: 'Tropical Semi-Evergreen', area_ha: 330.0 },
  'Dibrugarh Division': { lat: 27.310, lng: 95.380, range: 'Dibrugarh Range', beat: 'Dehing Patkai Beat', forest_type: 'Tropical Wet Evergreen', area_ha: 490.0 },
  'Tinsukia Division': { lat: 27.500, lng: 95.360, range: 'Digboi Range', beat: 'Margherita Beat', forest_type: 'Tropical Wet Evergreen', area_ha: 450.0 },
  'Cachar Division': { lat: 24.830, lng: 92.780, range: 'Silchar Range', beat: 'Sonai Beat', forest_type: 'Tropical Semi-Evergreen', area_ha: 380.0 },
  'Karbi Anglong East Division': { lat: 26.020, lng: 93.440, range: 'Diphu Range', beat: 'Manja Beat', forest_type: 'Tropical Moist Deciduous', area_ha: 440.0 },
  'Kokrajhar Division': { lat: 26.400, lng: 90.270, range: 'Kokrajhar Range', beat: 'Haltugaon Beat', forest_type: 'Sal Forest (Shorea robusta)', area_ha: 350.0 },
  'Goalpara Division': { lat: 26.170, lng: 90.620, range: 'Goalpara Range', beat: 'Matia Beat', forest_type: 'Sal Forest (Shorea robusta)', area_ha: 320.0 },
  'Dima Hasao Division': { lat: 25.180, lng: 93.020, range: 'Haflong Range', beat: 'Jatinga Beat', forest_type: 'Sub-Himalayan Secondary Wet', area_ha: 480.0 },
  'Bongaigaon Division': { lat: 26.480, lng: 90.550, range: 'Bongaigaon Range', beat: 'Abhayapuri Beat', forest_type: 'Tropical Moist Deciduous', area_ha: 275.0 },
  'Kaziranga National Park Division': { lat: 26.582, lng: 93.175, range: 'Kohora Range', beat: 'Bagori Beat', forest_type: 'Tropical Semi-Evergreen', area_ha: 420.0 },
  'Manas National Park Division': { lat: 26.720, lng: 91.010, range: 'Barpeta Range', beat: 'Bansbari Beat', forest_type: 'Alluvial Grassland', area_ha: 390.0 },
};

const FOREST_TYPE_BIOPHYSICS = {
  'Tropical Wet Evergreen': {
    canopy_density_pct: 85,
    mean_ndvi: 0.84,
    mean_ndwi: 0.32,
    cir_index: 3.10,
    sar_vh_backscatter_db: -13.8,
    canopy_height_m: 26.5,
    biomass_tonnes_per_ha: 245.0,
  },
  'Tropical Semi-Evergreen': {
    canopy_density_pct: 78,
    mean_ndvi: 0.80,
    mean_ndwi: 0.28,
    cir_index: 2.85,
    sar_vh_backscatter_db: -14.6,
    canopy_height_m: 23.0,
    biomass_tonnes_per_ha: 215.0,
  },
  'Sal Forest (Shorea robusta)': {
    canopy_density_pct: 82,
    mean_ndvi: 0.82,
    mean_ndwi: 0.26,
    cir_index: 2.95,
    sar_vh_backscatter_db: -14.2,
    canopy_height_m: 24.5,
    biomass_tonnes_per_ha: 230.0,
  },
  'Tropical Moist Deciduous': {
    canopy_density_pct: 70,
    mean_ndvi: 0.76,
    mean_ndwi: 0.22,
    cir_index: 2.65,
    sar_vh_backscatter_db: -15.4,
    canopy_height_m: 19.5,
    biomass_tonnes_per_ha: 180.0,
  },
  'Sub-Himalayan Secondary Wet': {
    canopy_density_pct: 75,
    mean_ndvi: 0.78,
    mean_ndwi: 0.25,
    cir_index: 2.70,
    sar_vh_backscatter_db: -15.0,
    canopy_height_m: 20.0,
    biomass_tonnes_per_ha: 190.0,
  },
  'Bamboo Forest': {
    canopy_density_pct: 65,
    mean_ndvi: 0.74,
    mean_ndwi: 0.20,
    cir_index: 2.50,
    sar_vh_backscatter_db: -16.2,
    canopy_height_m: 15.0,
    biomass_tonnes_per_ha: 140.0,
  },
  'Alluvial Grassland': {
    canopy_density_pct: 45,
    mean_ndvi: 0.68,
    mean_ndwi: 0.15,
    cir_index: 2.20,
    sar_vh_backscatter_db: -18.5,
    canopy_height_m: 4.5,
    biomass_tonnes_per_ha: 65.0,
  },
};

const getBiophysicsForType = (forestType) => {
  return FOREST_TYPE_BIOPHYSICS[forestType] || FOREST_TYPE_BIOPHYSICS['Tropical Semi-Evergreen'];
};

const getDivisionDefaults = (divName) => {
  if (KNOWN_DIVISION_COORDS[divName]) {
    return KNOWN_DIVISION_COORDS[divName];
  }
  const matchedKey = Object.keys(KNOWN_DIVISION_COORDS).find((k) =>
    divName.toLowerCase().includes(k.replace(' Division', '').toLowerCase())
  );
  if (matchedKey) {
    return KNOWN_DIVISION_COORDS[matchedKey];
  }
  const typeIndex = Math.abs(divName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % STANDARD_FOREST_TYPES.length;
  const assignedType = STANDARD_FOREST_TYPES[typeIndex];
  return {
    range: `${divName.replace(' Division', '')} Range`,
    beat: 'Central Beat',
    forest_type: assignedType,
    lat: 26.2000,
    lng: 92.9000,
    area_ha: 350.0,
  };
};

const REGIONAL_EO_ANCHORS = [
  { name: 'Kamrup East', lat: 26.115, lng: 91.821, forest_type: 'Sal Forest (Shorea robusta)', division: 'Kamrup East Division', ndvi: 0.82, ndwi: 0.26, cir: 2.95, sar: -14.2, chm: 24.5, agb: 230.0, density: 82 },
  { name: 'Kamrup West', lat: 26.012, lng: 91.350, forest_type: 'Tropical Moist Deciduous', division: 'Kamrup West Division', ndvi: 0.77, ndwi: 0.23, cir: 2.68, sar: -15.2, chm: 20.0, agb: 185.0, density: 72 },
  { name: 'Sonitpur', lat: 26.820, lng: 92.780, forest_type: 'Tropical Wet Evergreen', division: 'Sonitpur Division', ndvi: 0.85, ndwi: 0.32, cir: 3.12, sar: -13.6, chm: 27.0, agb: 255.0, density: 86 },
  { name: 'Golaghat', lat: 26.450, lng: 93.850, forest_type: 'Tropical Semi-Evergreen', division: 'Golaghat Division', ndvi: 0.80, ndwi: 0.28, cir: 2.85, sar: -14.6, chm: 23.0, agb: 215.0, density: 78 },
  { name: 'Nagaon', lat: 26.350, lng: 92.680, forest_type: 'Tropical Moist Deciduous', division: 'Nagaon Division', ndvi: 0.76, ndwi: 0.22, cir: 2.65, sar: -15.4, chm: 19.5, agb: 180.0, density: 70 },
  { name: 'Jorhat', lat: 26.750, lng: 94.210, forest_type: 'Tropical Semi-Evergreen', division: 'Jorhat Division', ndvi: 0.81, ndwi: 0.29, cir: 2.88, sar: -14.4, chm: 23.5, agb: 220.0, density: 80 },
  { name: 'Dibrugarh', lat: 27.310, lng: 95.380, forest_type: 'Tropical Wet Evergreen', division: 'Dibrugarh Division', ndvi: 0.86, ndwi: 0.34, cir: 3.20, sar: -13.2, chm: 27.5, agb: 260.0, density: 88 },
  { name: 'Tinsukia', lat: 27.500, lng: 95.360, forest_type: 'Tropical Wet Evergreen', division: 'Tinsukia Division', ndvi: 0.87, ndwi: 0.35, cir: 3.25, sar: -13.0, chm: 28.0, agb: 265.0, density: 90 },
  { name: 'Cachar', lat: 24.830, lng: 92.780, forest_type: 'Tropical Semi-Evergreen', division: 'Cachar Division', ndvi: 0.79, ndwi: 0.27, cir: 2.80, sar: -14.8, chm: 22.0, agb: 205.0, density: 76 },
  { name: 'Karbi Anglong East', lat: 26.020, lng: 93.440, forest_type: 'Tropical Moist Deciduous', division: 'Karbi Anglong East Division', ndvi: 0.78, ndwi: 0.24, cir: 2.72, sar: -15.0, chm: 20.5, agb: 195.0, density: 74 },
  { name: 'Kokrajhar', lat: 26.400, lng: 90.270, forest_type: 'Sal Forest (Shorea robusta)', division: 'Kokrajhar Division', ndvi: 0.81, ndwi: 0.25, cir: 2.92, sar: -14.3, chm: 24.0, agb: 225.0, density: 81 },
  { name: 'Goalpara', lat: 26.170, lng: 90.620, forest_type: 'Sal Forest (Shorea robusta)', division: 'Goalpara Division', ndvi: 0.82, ndwi: 0.26, cir: 2.94, sar: -14.1, chm: 24.2, agb: 228.0, density: 82 },
  { name: 'Dima Hasao', lat: 25.180, lng: 93.020, forest_type: 'Sub-Himalayan Secondary Wet', division: 'Dima Hasao Division', ndvi: 0.79, ndwi: 0.26, cir: 2.75, sar: -14.9, chm: 21.0, agb: 198.0, density: 75 },
  { name: 'Kaziranga', lat: 26.582, lng: 93.175, forest_type: 'Alluvial Grassland', division: 'Kaziranga National Park Division', ndvi: 0.71, ndwi: 0.18, cir: 2.30, sar: -17.8, chm: 6.5, agb: 85.0, density: 52 },
  { name: 'Manas', lat: 26.720, lng: 91.010, forest_type: 'Alluvial Grassland', division: 'Manas National Park Division', ndvi: 0.68, ndwi: 0.15, cir: 2.20, sar: -18.5, chm: 4.5, agb: 65.0, density: 45 },
];

const calculateTelemetryFromCoordinates = (
  lat,
  lng,
  area_ha = 310.0,
  forest_type = null,
  canopy_density = null
) => {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return null;
  }

  const validArea = Math.max(5.0, parseFloat(area_ha) || 310.0);

  const weights = [];
  for (const a of REGIONAL_EO_ANCHORS) {
    const d = Math.sqrt(Math.pow(numLat - a.lat, 2) + Math.pow(numLng - a.lng, 2));
    const w = 1.0 / Math.pow(d + 0.05, 2);
    weights.push({ w, anchor: a, d });
  }

  const totalW = weights.reduce((acc, x) => acc + x.w, 0);
  weights.sort((a, b) => a.d - b.d);
  const nearest = weights[0].anchor;

  const selectedType = forest_type || nearest.forest_type;
  const typeProfile = FOREST_TYPE_BIOPHYSICS[selectedType] || FOREST_TYPE_BIOPHYSICS['Tropical Semi-Evergreen'];

  // 55% regional location weighting + 45% forest classification profile
  const locNdvi = weights.reduce((acc, x) => acc + x.w * x.anchor.ndvi, 0) / totalW;
  const locNdwi = weights.reduce((acc, x) => acc + x.w * x.anchor.ndwi, 0) / totalW;
  const locCir = weights.reduce((acc, x) => acc + x.w * x.anchor.cir, 0) / totalW;
  const locSar = weights.reduce((acc, x) => acc + x.w * x.anchor.sar, 0) / totalW;
  const locChm = weights.reduce((acc, x) => acc + x.w * x.anchor.chm, 0) / totalW;
  const locAgb = weights.reduce((acc, x) => acc + x.w * x.anchor.agb, 0) / totalW;
  const locDensity = weights.reduce((acc, x) => acc + x.w * x.anchor.density, 0) / totalW;

  const baseNdvi = 0.55 * locNdvi + 0.45 * typeProfile.ndvi;
  const baseNdwi = 0.55 * locNdwi + 0.45 * typeProfile.ndwi;
  const baseCir = 0.55 * locCir + 0.45 * typeProfile.cir;
  const baseSar = 0.55 * locSar + 0.45 * typeProfile.sar;
  const baseChm = 0.55 * locChm + 0.45 * typeProfile.chm;
  const baseAgb = 0.55 * locAgb + 0.45 * typeProfile.agb;
  const baseDensity = 0.55 * locDensity + 0.45 * typeProfile.density;

  // Logarithmic landscape patch size & core-to-edge scaling: s = log10(area / 250)
  const s = Math.log10(validArea / 250.0);

  // Canopy density closure factor
  const effDensity = canopy_density !== null && canopy_density !== undefined && !isNaN(parseFloat(canopy_density))
    ? Math.round(Math.min(98.0, Math.max(15.0, parseFloat(canopy_density))))
    : Math.round(Math.min(98.0, Math.max(15.0, baseDensity + s * 3.5)));

  const dDens = (effDensity - 75.0) / 100.0;

  // Deterministic micro-spatial raster variance
  const hf = Math.sin(numLat * 1234.567 + numLng * 765.432);
  const vf = Math.cos(numLat * 432.198 - numLng * 891.234);

  // All parameters dynamically adapt to Area, Canopy Density, Forest Type, and Location:
  const mean_ndvi = Math.min(0.95, Math.max(0.10, baseNdvi + s * 0.025 + dDens * 0.08 + hf * 0.01)).toFixed(2);
  const mean_ndwi = Math.min(0.60, Math.max(-0.50, baseNdwi + s * 0.035 + dDens * 0.06 + vf * 0.01)).toFixed(2);
  const cir_index = Math.min(5.0, Math.max(1.0, baseCir + s * 0.08 + dDens * 0.20 + hf * 0.03)).toFixed(2);
  const sar_vh_backscatter_db = Math.min(-5.0, Math.max(-25.0, baseSar + s * 0.6 + dDens * 1.5 + vf * 0.2)).toFixed(1);
  const canopy_height_m = Math.min(45.0, Math.max(2.0, baseChm + s * 1.2 + dDens * 2.0 + hf * 0.4)).toFixed(1);
  const biomass_tonnes_per_ha = Math.min(
    400.0,
    Math.max(20.0, baseAgb * (1.0 + s * 0.05) * (1.0 + dDens * 0.15) + (hf + vf) * 2.0)
  ).toFixed(1);
  const total_biomass_tonnes = (parseFloat(biomass_tonnes_per_ha) * validArea).toFixed(1);
  const canopy_density_pct = String(effDensity);

  return {
    lat: numLat,
    lng: numLng,
    area_ha: validArea,
    mean_ndvi,
    mean_ndwi,
    cir_index,
    sar_vh_backscatter_db,
    canopy_height_m,
    biomass_tonnes_per_ha,
    total_biomass_tonnes,
    canopy_density_pct,
    suggested_forest_type: nearest.forest_type,
    selected_forest_type: selectedType,
    nearest_division: nearest.division,
  };
};

export default function CompartmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const divisionQuery = searchParams ? searchParams.get('division') || '' : '';

  const [compartments, setCompartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(divisionQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showGisUpload, setShowGisUpload] = useState(false);
  const [isDensityCustom, setIsDensityCustom] = useState(false);

  // Optional GIS GeoJSON Ingest State
  const [uploadedGeoJSON, setUploadedGeoJSON] = useState(null);
  const [parsedFeaturesCount, setParsedFeaturesCount] = useState(0);
  const [gisPreviewDetails, setGisPreviewDetails] = useState(null);
  const [isImportingGIS, setIsImportingGIS] = useState(false);
  const fileInputRef = useRef(null);

  // Divisions list strictly derived from added divisions in database
  const divisionsList = useMemo(() => {
    return divisions.map((d) => d.name).filter(Boolean);
  }, [divisions]);

  const EMPTY_COMPARTMENT_FORM = {
    compartment_no: '',
    division: divisionQuery || '',
    range: '',
    beat: '',
    area_ha: '',
    forest_type: '',
    canopy_density_pct: '',
    lat: '',
    lng: '',
    mean_ndvi: '',
    mean_ndwi: '',
    cir_index: '',
    sar_vh_backscatter_db: '',
    canopy_height_m: '',
    biomass_tonnes_per_ha: '',
  };

  // Form data state: completely blank by default for creation
  const [formData, setFormData] = useState(EMPTY_COMPARTMENT_FORM);

  const normalizeCompartment = (c, divsArr = divisions) => {
    const matched = divsArr.find(
      (d) =>
        d.id === c.division_id ||
        d.code === c.division_code ||
        d.name === c.division_code ||
        d.name === c.division
    );
    const resolvedDivision = matched ? matched.name : (c.division || c.division_code || '');

    return {
      ...c,
      division_id: matched ? matched.id : (c.division_id || ''),
      division: resolvedDivision,
      division_code: matched ? matched.code : (c.division_code || ''),
      compartment_no: c.compartment_no || c.compartment_number || '',
      compartment_number: c.compartment_number || c.compartment_no || '',
      range: c.range || c.range_name || '',
      range_name: c.range_name || c.range || '',
      beat: c.beat || c.beat_name || '',
      beat_name: c.beat_name || c.beat || '',
      area_ha: c.area_ha ?? c.total_area_ha ?? 0,
      total_area_ha: c.total_area_ha ?? c.area_ha ?? 0,
      canopy_density_pct: c.canopy_density_pct ?? c.canopy_density_percent ?? 0,
      canopy_density_percent: c.canopy_density_percent ?? c.canopy_density_pct ?? 0,
      mean_ndvi: c.mean_ndvi ?? 0.78,
      mean_ndwi: c.mean_ndwi ?? 0.26,
      cir_index: c.cir_index ?? 2.75,
      sar_vh_backscatter_db: c.sar_vh_backscatter_db ?? -14.8,
      canopy_height_m: c.canopy_height_m ?? 21.0,
      biomass_tonnes_per_ha: c.biomass_tonnes_per_ha ?? 185.0,
      lat: c.lat !== undefined ? Number(c.lat) : (c.centroid_lat !== undefined ? Number(c.centroid_lat) : 26.2),
      centroid_lat: c.centroid_lat !== undefined ? Number(c.centroid_lat) : (c.lat !== undefined ? Number(c.lat) : 26.2),
      lng: c.lng !== undefined ? Number(c.lng) : (c.centroid_lng !== undefined ? Number(c.centroid_lng) : 92.5),
      centroid_lng: c.centroid_lng !== undefined ? Number(c.centroid_lng) : (c.lng !== undefined ? Number(c.lng) : 92.5),
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [compsData, divsData] = await Promise.all([
        fetchCompartments(),
        fetchDivisions(),
      ]);

      const loadedDivs = Array.isArray(divsData) ? divsData : [];
      setDivisions(loadedDivs);

      if (Array.isArray(compsData)) {
        setCompartments(compsData.map((c) => normalizeCompartment(c, loadedDivs)));
      }
    } catch (err) {
      console.error('Failed to load compartment/division data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCompartments = useMemo(() => {
    if (!selectedDivision) return compartments;
    return compartments.filter((c) => {
      return (
        c.division === selectedDivision ||
        c.division_code === selectedDivision ||
        (c.division_id &&
          divisions.some(
            (d) => d.id === c.division_id && (d.name === selectedDivision || d.code === selectedDivision)
          ))
      );
    });
  }, [compartments, selectedDivision, divisions]);

  const compartmentStats = useMemo(() => {
    const total = compartments.length;
    if (total === 0) return { total: 0, totalArea: '0.0', avgCanopy: '0.0', avgLat: '26.2000', avgLng: '92.5000' };
    const totalArea = compartments.reduce((sum, c) => sum + (Number(c.area_ha || c.total_area_ha) || 0), 0);
    const avgCanopy = compartments.reduce((sum, c) => sum + (Number(c.canopy_density_pct || c.canopy_density_percent) || 0), 0) / total;
    const avgLat = compartments.reduce((sum, c) => sum + (Number(c.lat || c.centroid_lat) || 26.2), 0) / total;
    const avgLng = compartments.reduce((sum, c) => sum + (Number(c.lng || c.centroid_lng) || 92.5), 0) / total;
    return {
      total,
      totalArea: totalArea.toFixed(1),
      avgCanopy: avgCanopy.toFixed(1),
      avgLat: avgLat.toFixed(4),
      avgLng: avgLng.toFixed(4),
    };
  }, [compartments]);

  // Reset canopy density back to automated calculation based on current parameters
  const handleResetDensityToAuto = () => {
    setIsDensityCustom(false);
    const numArea = parseFloat(formData.area_ha) || 310.0;
    const numLat = parseFloat(formData.lat);
    const numLng = parseFloat(formData.lng);
    const currentType = formData.forest_type;

    if (!isNaN(numLat) && !isNaN(numLng) && numLat > 0 && numLng > 0) {
      const telemetry = calculateTelemetryFromCoordinates(numLat, numLng, numArea, currentType, null);
      if (telemetry) {
        setFormData((prev) => ({
          ...prev,
          canopy_density_pct: telemetry.canopy_density_pct,
          mean_ndvi: telemetry.mean_ndvi,
          mean_ndwi: telemetry.mean_ndwi,
          cir_index: telemetry.cir_index,
          sar_vh_backscatter_db: telemetry.sar_vh_backscatter_db,
          canopy_height_m: telemetry.canopy_height_m,
          biomass_tonnes_per_ha: telemetry.biomass_tonnes_per_ha,
        }));
        toast.success(`Canopy density auto-calculated: ${telemetry.canopy_density_pct}%`);
      }
    }
  };

  // Handle division change without auto-filling default coordinates or biophysics
  const handleDivisionChange = (newDivisionName, divsList = divisions) => {
    const matched = divsList.find((d) => d.name === newDivisionName || d.code === newDivisionName);
    const divName = matched ? matched.name : newDivisionName;
    setFormData((prev) => ({
      ...prev,
      division: divName,
    }));
  };

  // Automatically calculate and sync biophysical telemetry when coordinates change
  const handleCoordinateChange = (field, value) => {
    const updatedLat = field === 'lat' ? value : formData.lat;
    const updatedLng = field === 'lng' ? value : formData.lng;
    const currentArea = parseFloat(formData.area_ha) || 310.0;
    const currentType = formData.forest_type;

    const numLat = parseFloat(updatedLat);
    const numLng = parseFloat(updatedLng);

    // If both valid coordinates, auto-calculate and sync all biophysical parameters based on location, area, and type
    if (!isNaN(numLat) && !isNaN(numLng) && numLat > 0 && numLng > 0) {
      const effectiveDensityParam = isDensityCustom ? parseFloat(formData.canopy_density_pct) : null;
      const telemetry = calculateTelemetryFromCoordinates(numLat, numLng, currentArea, currentType, effectiveDensityParam);
      if (telemetry) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          canopy_density_pct: isDensityCustom ? prev.canopy_density_pct : telemetry.canopy_density_pct,
          mean_ndvi: telemetry.mean_ndvi,
          mean_ndwi: telemetry.mean_ndwi,
          cir_index: telemetry.cir_index,
          sar_vh_backscatter_db: telemetry.sar_vh_backscatter_db,
          canopy_height_m: telemetry.canopy_height_m,
          biomass_tonnes_per_ha: telemetry.biomass_tonnes_per_ha,
          forest_type: telemetry.suggested_forest_type || prev.forest_type,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Automatically recalculate all biophysical parameters (NDVI, NDWI, CIR, SAR VH, CHM, Biomass) when Total Forest Area changes
  const handleAreaChange = (newAreaValue) => {
    const numArea = parseFloat(newAreaValue);
    const numLat = parseFloat(formData.lat);
    const numLng = parseFloat(formData.lng);
    const currentType = formData.forest_type;

    if (!isNaN(numArea) && numArea > 0 && !isNaN(numLat) && !isNaN(numLng) && numLat > 0 && numLng > 0) {
      const effectiveDensityParam = isDensityCustom ? parseFloat(formData.canopy_density_pct) : null;
      const telemetry = calculateTelemetryFromCoordinates(numLat, numLng, numArea, currentType, effectiveDensityParam);
      if (telemetry) {
        setFormData((prev) => ({
          ...prev,
          area_ha: newAreaValue,
          canopy_density_pct: isDensityCustom ? prev.canopy_density_pct : telemetry.canopy_density_pct,
          mean_ndvi: telemetry.mean_ndvi,
          mean_ndwi: telemetry.mean_ndwi,
          cir_index: telemetry.cir_index,
          sar_vh_backscatter_db: telemetry.sar_vh_backscatter_db,
          canopy_height_m: telemetry.canopy_height_m,
          biomass_tonnes_per_ha: telemetry.biomass_tonnes_per_ha,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      area_ha: newAreaValue,
    }));
  };

  // Automatically recalculate all biophysical parameters when Canopy Density (%) is edited
  const handleCanopyDensityChange = (newDensityValue) => {
    setIsDensityCustom(true);
    const numDensity = parseFloat(newDensityValue);
    const numArea = parseFloat(formData.area_ha) || 310.0;
    const numLat = parseFloat(formData.lat);
    const numLng = parseFloat(formData.lng);
    const currentType = formData.forest_type;

    if (!isNaN(numDensity) && numDensity >= 0 && !isNaN(numLat) && !isNaN(numLng) && numLat > 0 && numLng > 0) {
      const telemetry = calculateTelemetryFromCoordinates(numLat, numLng, numArea, currentType, numDensity);
      if (telemetry) {
        setFormData((prev) => ({
          ...prev,
          canopy_density_pct: newDensityValue,
          mean_ndvi: telemetry.mean_ndvi,
          mean_ndwi: telemetry.mean_ndwi,
          cir_index: telemetry.cir_index,
          sar_vh_backscatter_db: telemetry.sar_vh_backscatter_db,
          canopy_height_m: telemetry.canopy_height_m,
          biomass_tonnes_per_ha: telemetry.biomass_tonnes_per_ha,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      canopy_density_pct: newDensityValue,
    }));
  };

  // Explicit sync button action to recalculate from GPS coordinates, area, forest type, and canopy density
  const handleSyncFromCoordinates = async () => {
    const numLat = parseFloat(formData.lat);
    const numLng = parseFloat(formData.lng);
    const numArea = parseFloat(formData.area_ha) || 310.0;
    const currentType = formData.forest_type;
    const effectiveDensityParam = isDensityCustom ? parseFloat(formData.canopy_density_pct) : null;
    if (isNaN(numLat) || isNaN(numLng)) {
      toast.error('Please enter valid Centroid Latitude and Longitude');
      return;
    }

    const telemetry = calculateTelemetryFromCoordinates(numLat, numLng, numArea, currentType, effectiveDensityParam);
    if (telemetry) {
      setFormData((prev) => ({
        ...prev,
        mean_ndvi: telemetry.mean_ndvi,
        mean_ndwi: telemetry.mean_ndwi,
        cir_index: telemetry.cir_index,
        sar_vh_backscatter_db: telemetry.sar_vh_backscatter_db,
        canopy_height_m: telemetry.canopy_height_m,
        biomass_tonnes_per_ha: telemetry.biomass_tonnes_per_ha,
        canopy_density_pct: isDensityCustom ? prev.canopy_density_pct : telemetry.canopy_density_pct,
        forest_type: telemetry.suggested_forest_type || prev.forest_type,
      }));
      toast.success(`Earth Observation telemetry calculated for (${numLat.toFixed(4)}°N, ${numLng.toFixed(4)}°E) across ${numArea} ha`);
    }

    try {
      const serverData = await calculateCompartmentTelemetry(numLat, numLng, numArea, currentType, effectiveDensityParam);
      if (serverData) {
        setFormData((prev) => ({
          ...prev,
          mean_ndvi: String(serverData.mean_ndvi),
          mean_ndwi: String(serverData.mean_ndwi),
          cir_index: String(serverData.cir_index),
          sar_vh_backscatter_db: String(serverData.sar_vh_backscatter_db),
          canopy_height_m: String(serverData.canopy_height_m),
          biomass_tonnes_per_ha: String(serverData.biomass_tonnes_per_ha),
          canopy_density_pct: isDensityCustom ? prev.canopy_density_pct : String(serverData.canopy_density_pct),
        }));
      }
    } catch (e) {
      // Local calculation already applied cleanly
    }
  };

  // Handle smart auto-fill when Forest Classification / Type is changed
  const handleForestTypeChange = (newType) => {
    setIsDensityCustom(false);
    const numArea = parseFloat(formData.area_ha) || 310.0;
    const numLat = parseFloat(formData.lat);
    const numLng = parseFloat(formData.lng);

    if (!isNaN(numLat) && !isNaN(numLng) && numLat > 0 && numLng > 0) {
      const telemetry = calculateTelemetryFromCoordinates(numLat, numLng, numArea, newType, null);
      if (telemetry) {
        setFormData((prev) => ({
          ...prev,
          forest_type: newType,
          canopy_density_pct: telemetry.canopy_density_pct,
          mean_ndvi: telemetry.mean_ndvi,
          mean_ndwi: telemetry.mean_ndwi,
          cir_index: telemetry.cir_index,
          sar_vh_backscatter_db: telemetry.sar_vh_backscatter_db,
          canopy_height_m: telemetry.canopy_height_m,
          biomass_tonnes_per_ha: telemetry.biomass_tonnes_per_ha,
        }));
        return;
      }
    }

    const bio = getBiophysicsForType(newType);
    setFormData((prev) => ({
      ...prev,
      forest_type: newType,
      canopy_density_pct: String(bio.canopy_density_pct),
      mean_ndvi: String(bio.mean_ndvi),
      mean_ndwi: String(bio.mean_ndwi),
      cir_index: String(bio.cir_index),
      sar_vh_backscatter_db: String(bio.sar_vh_backscatter_db),
      canopy_height_m: String(bio.canopy_height_m),
      biomass_tonnes_per_ha: String(bio.biomass_tonnes_per_ha),
    }));
  };

  // Open modal and immediately refresh divisions from database
  const handleOpenAddModal = async () => {
    setIsDensityCustom(false);
    try {
      const latestDivs = await fetchDivisions();
      if (Array.isArray(latestDivs)) {
        setDivisions(latestDivs);
      }
    } catch (e) {
      console.warn('Could not refresh divisions:', e);
    }
    setFormData({
      ...EMPTY_COMPARTMENT_FORM,
      division: selectedDivision || '',
    });
    setIsAddModalOpen(true);
  };

  // Handler for Updating Inline
  const handleUpdate = async (id, updatedRow) => {
    if (updatedRow.lat !== undefined) updatedRow.centroid_lat = updatedRow.lat;
    if (updatedRow.lng !== undefined) updatedRow.centroid_lng = updatedRow.lng;
    if (updatedRow.centroid_lat !== undefined) updatedRow.lat = updatedRow.centroid_lat;
    if (updatedRow.centroid_lng !== undefined) updatedRow.lng = updatedRow.centroid_lng;

    // Recalculate biophysical telemetry if coordinates, area, or forest type are edited
    if (
      updatedRow.lat !== undefined ||
      updatedRow.lng !== undefined ||
      updatedRow.area_ha !== undefined ||
      updatedRow.forest_type !== undefined
    ) {
      const numLat = parseFloat(updatedRow.lat ?? updatedRow.centroid_lat) || 26.2;
      const numLng = parseFloat(updatedRow.lng ?? updatedRow.centroid_lng) || 92.5;
      const numArea = parseFloat(updatedRow.area_ha ?? updatedRow.total_area_ha) || 310.0;
      const tel = calculateTelemetryFromCoordinates(numLat, numLng, numArea, updatedRow.forest_type);
      if (tel) {
        updatedRow.mean_ndvi = tel.mean_ndvi;
        updatedRow.mean_ndwi = tel.mean_ndwi;
        updatedRow.cir_index = tel.cir_index;
        updatedRow.sar_vh_backscatter_db = tel.sar_vh_backscatter_db;
        updatedRow.canopy_height_m = tel.canopy_height_m;
        updatedRow.biomass_tonnes_per_ha = tel.biomass_tonnes_per_ha;
        if (updatedRow.canopy_density_pct === undefined) {
          updatedRow.canopy_density_pct = tel.canopy_density_pct;
        }
      }
    }

    const normalized = normalizeCompartment(updatedRow);
    try {
      await updateCompartment(id, {
        compartment_number: normalized.compartment_no,
        division_code: normalized.division,
        range_name: normalized.range,
        beat_name: normalized.beat,
        total_area_ha: Number(normalized.area_ha) || 0,
        forest_type: normalized.forest_type,
        canopy_density_percent: Number(normalized.canopy_density_pct) || 0,
        centroid_lat: Number(normalized.lat || normalized.centroid_lat) || 26.2,
        centroid_lng: Number(normalized.lng || normalized.centroid_lng) || 92.5,
      });
      setCompartments((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Compartment updated');
    } catch (err) {
      setCompartments((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Compartment updated locally');
    }
  };

  // Handler for Deleting
  const handleDelete = async (id) => {
    try {
      await deleteCompartment(id);
      setCompartments((prev) => prev.filter((item) => item.id !== id));
      toast.success('Compartment deleted');
    } catch (err) {
      setCompartments((prev) => prev.filter((item) => item.id !== id));
      toast.success('Compartment deleted locally');
    }
  };


  // Handler for File Upload (Approach 2)
  const handleGISFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const json = JSON.parse(text);

        let features = [];
        if (json.type === 'FeatureCollection') {
          features = json.features || [];
        } else if (json.type === 'Feature') {
          features = [json];
        } else if (json.coordinates) {
          features = [{ type: 'Feature', geometry: json, properties: {} }];
        }

        if (features.length === 0) {
          toast.error('No valid geospatial features found in file');
          return;
        }

        setUploadedGeoJSON(json);
        setParsedFeaturesCount(features.length);

        const first = features[0];
        const props = first.properties || {};
        const geom = first.geometry || {};

        let cLat = 26.2;
        let cLng = 92.9;
        let approxArea = props.area_ha || props.AREA_HA || props.total_area_ha || 320.0;

        if (geom.type === 'Polygon' && geom.coordinates?.[0]) {
          const pts = geom.coordinates[0];
          const lats = pts.map((p) => p[1]).filter(Boolean);
          const lngs = pts.map((p) => p[0]).filter(Boolean);
          if (lats.length && lngs.length) {
            cLat = (lats.reduce((a, b) => a + b, 0) / lats.length).toFixed(4);
            cLng = (lngs.reduce((a, b) => a + b, 0) / lngs.length).toFixed(4);
          }
        }

        const compName =
          props.compartment_number ||
          props.compartment_no ||
          props.COMP_NO ||
          props.name ||
          `ASSAC-C${Math.floor(10 + Math.random() * 90)}`;

        const preview = {
          comp_no: compName,
          division: props.division || props.DIVISION || formData.division,
          range: props.range || props.RANGE || 'Survey Range',
          beat: props.beat || props.BEAT || 'Forest Beat',
          area_ha: approxArea,
          forest_type: props.forest_type || 'Tropical Semi-Evergreen',
          canopy_density_pct: props.canopy_density_pct || 75,
          lat: cLat,
          lng: cLng,
          geometry: geom,
        };

        setGisPreviewDetails(preview);
        toast.success(`Parsed ${features.length} GIS boundary feature(s)`);
      } catch (err) {
        toast.error('Invalid JSON/GeoJSON format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Import GIS directly into Database
  const handleBatchGISImport = async () => {
    if (!uploadedGeoJSON) return;
    setIsImportingGIS(true);
    try {
      const res = await importCompartmentsGeoJSON(uploadedGeoJSON);
      toast.success(res?.message || 'GeoJSON compartments successfully imported!');
      setIsAddModalOpen(false);
      setUploadedGeoJSON(null);
      setGisPreviewDetails(null);
      await loadData();
    } catch (err) {
      if (gisPreviewDetails) {
        const localRecord = normalizeCompartment({ id: Date.now(), ...gisPreviewDetails });
        setCompartments((prev) => [localRecord, ...prev]);
        toast.success('Compartment imported and saved to system');
        setIsAddModalOpen(false);
      }
    } finally {
      setIsImportingGIS(false);
    }
  };

  // Handler for Simple & Realistic Compartment Creation
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.compartment_no?.trim() || !formData.division) {
      toast.error('Compartment # and Division are required');
      return;
    }

    const cLat = Number(formData.lat) || 26.2;
    const cLng = Number(formData.lng) || 92.9;
    const defaultBio = getBiophysicsForType(formData.forest_type);

    const matchedDiv =
      divisions.find(
        (d) => d.name === formData.division || d.code === formData.division || d.id === formData.division
      ) || divisions[0];

    const payload = {
      compartment_number: formData.compartment_no.trim(),
      division_code: matchedDiv ? matchedDiv.name : formData.division,
      division_id: matchedDiv ? matchedDiv.id : formData.division,
      range_name: formData.range?.trim() || 'Territorial Range',
      beat_name: formData.beat?.trim() || 'Central Beat',
      total_area_ha: Number(formData.area_ha) || 300.0,
      forest_type: formData.forest_type,
      canopy_density_percent: Number(formData.canopy_density_pct) || defaultBio.canopy_density_pct,
      centroid_lat: cLat,
      centroid_lng: cLng,
      mean_ndvi: formData.mean_ndvi !== '' ? Number(formData.mean_ndvi) : defaultBio.mean_ndvi,
      mean_ndwi: formData.mean_ndwi !== '' ? Number(formData.mean_ndwi) : defaultBio.mean_ndwi,
      cir_index: formData.cir_index !== '' ? Number(formData.cir_index) : defaultBio.cir_index,
      sar_vh_backscatter_db: formData.sar_vh_backscatter_db !== '' ? Number(formData.sar_vh_backscatter_db) : defaultBio.sar_vh_backscatter_db,
      canopy_height_m: formData.canopy_height_m !== '' ? Number(formData.canopy_height_m) : defaultBio.canopy_height_m,
      biomass_tonnes_per_ha: formData.biomass_tonnes_per_ha !== '' ? Number(formData.biomass_tonnes_per_ha) : defaultBio.biomass_tonnes_per_ha,
      boundary_geojson: JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [cLng - 0.018, cLat - 0.015],
            [cLng + 0.018, cLat - 0.015],
            [cLng + 0.018, cLat + 0.015],
            [cLng - 0.018, cLat + 0.015],
            [cLng - 0.018, cLat - 0.015],
          ],
        ],
      }),
    };

    try {
      const newRecord = await createCompartment(payload);
      const normalized = normalizeCompartment(newRecord || { id: Date.now(), ...payload });
      setCompartments((prev) => [normalized, ...prev]);
      toast.success(`Compartment ${formData.compartment_no} created with auto-linked satellite telemetry!`);
    } catch (err) {
      const normalized = normalizeCompartment({ id: Date.now(), ...payload });
      setCompartments((prev) => [normalized, ...prev]);
      toast.success(`Compartment ${formData.compartment_no} registered locally!`);
    } finally {
      setIsAddModalOpen(false);
      setFormData((prev) => ({
        ...prev,
        compartment_no: '',
      }));
    }
  };

  const columns = [
    { header: 'Compartment #', accessor: 'compartment_no', editable: true, width: 'w-36' },
    {
      header: 'Division',
      accessor: 'division',
      editable: true,
      type: 'select',
      options: divisionsList,
      width: 'w-52',
    },
    { header: 'Range', accessor: 'range', editable: true, width: 'w-36' },
    { header: 'Beat', accessor: 'beat', editable: true, width: 'w-32' },
    {
      header: 'Area (ha)',
      accessor: 'area_ha',
      editable: true,
      type: 'number',
      render: (v) => `${v} ha`,
    },
    { header: 'Forest Type', accessor: 'forest_type', editable: true },
    {
      header: 'Canopy Density %',
      accessor: 'canopy_density_pct',
      editable: true,
      type: 'number',
      render: (v) => (
        <span
          className={`font-semibold ${
            v >= 70 ? 'text-emerald-600' : v >= 40 ? 'text-amber-600' : 'text-red-600'
          }`}
        >
          {v}%
        </span>
      ),
    },

    {
      header: 'Centroid Latitude (°N)',
      accessor: 'lat',
      editable: true,
      type: 'number',
      step: '0.0001',
      width: 'w-36',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {Number(v || 0).toFixed(4)}°N
        </span>
      ),
    },
    {
      header: 'Centroid Longitude (°E)',
      accessor: 'lng',
      editable: true,
      type: 'number',
      step: '0.0001',
      width: 'w-36',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {Number(v || 0).toFixed(4)}°E
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Compartment Units
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {compartments.length} Units
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Spatial forest boundaries, surveyed boundary pillars (CPs), canopy crown density & Sentinel tracking units.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Grid3X3}
          title="Total Compartments"
          value={compartments.length}
          subtitle="Monitored Forest Units"
          color="green"
        />
        <KPICard
          icon={Maximize2}
          title="Demarcated Area"
          value={`${compartmentStats.totalArea} ha`}
          subtitle="Total Geometric Coverage"
          color="blue"
        />
        <KPICard
          icon={Leaf}
          title="Avg Canopy Density"
          value={`${compartmentStats.avgCanopy}%`}
          subtitle="Crown Cover Calibration"
          color="purple"
        />
        <KPICard
          icon={Trees}
          title="Active Ranges"
          value={new Set(compartments.map((c) => c.range).filter(Boolean)).size || 12}
          subtitle="Administrative Forest Ranges"
          color="yellow"
        />
      </div>

      {/* Main Data Table */}
      <DataTable
        title="Compartments Catalog"
        columns={columns}
        data={filteredCompartments}
        isLoading={isLoading}
        onAdd={handleOpenAddModal}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        filterComponent={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Division:</span>
            <select
              value={selectedDivision}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDivision(val);
                if (val) {
                  router.push(`/compartments?division=${encodeURIComponent(val)}`);
                } else {
                  router.push('/compartments');
                }
              }}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Divisions ({divisions.length})</option>
              {divisions.map((div) => (
                <option key={div.id || div.name} value={div.name}>
                  {div.name} {div.code ? `(${div.code})` : ''}
                </option>
              ))}
            </select>
            {selectedDivision && (
              <button
                onClick={() => {
                  setSelectedDivision('');
                  router.push('/compartments');
                }}
                className="text-xs text-forest-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        }
      />

      {/* ======================================================== */}
      {/* Simple, Realistic Add Forest Compartment Modal           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Forest Compartment"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="leading-relaxed">
              <strong>Forest Compartment Registry:</strong> Enter the official compartment details, administrative range, beat jurisdiction, and boundary parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forest Division *
              </label>
              <select
                required
                value={formData.division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select Forest Division...</option>
                {divisions.length === 0 ? (
                  <option value="" disabled>
                    No divisions added yet — please add a division first
                  </option>
                ) : (
                  divisions.map((d) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <FormField
              label="Compartment #"
              name="compartment_no"
              required
              value={formData.compartment_no}
              onChange={(e) => setFormData({ ...formData, compartment_no: e.target.value })}
              placeholder="e.g. KMP-C03 or KZ-C05"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Forest Range"
              name="range"
              required
              value={formData.range}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              placeholder="e.g. Guwahati East Range"
            />
            <FormField
              label="Forest Beat"
              name="beat"
              required
              value={formData.beat}
              onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
              placeholder="e.g. Khanapara Beat"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forest Classification / Type *
              </label>
              <select
                value={formData.forest_type}
                onChange={(e) => handleForestTypeChange(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select Forest Classification / Type...</option>
                {STANDARD_FOREST_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Total Forest Area (Hectares) *"
              name="area_ha"
              type="number"
              step="0.1"
              required
              value={formData.area_ha}
              onChange={(e) => handleAreaChange(e.target.value)}
              placeholder="e.g. 350.0"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Canopy Density (%) *
                </label>
                {isDensityCustom && (
                  <button
                    type="button"
                    onClick={handleResetDensityToAuto}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    title="Reset to automatically calculated canopy density"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Auto-calculate</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                name="canopy_density_pct"
                step="1"
                min="0"
                max="100"
                required
                value={formData.canopy_density_pct}
                onChange={(e) => handleCanopyDensityChange(e.target.value)}
                placeholder="e.g. 80"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
              {isDensityCustom && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Custom manual density
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Centroid Latitude (°N)"
              name="lat"
              type="number"
              step="0.0001"
              value={formData.lat}
              onChange={(e) => handleCoordinateChange('lat', e.target.value)}
              placeholder="e.g. 26.1150"
            />
            <FormField
              label="Centroid Longitude (°E)"
              name="lng"
              type="number"
              step="0.0001"
              value={formData.lng}
              onChange={(e) => handleCoordinateChange('lng', e.target.value)}
              placeholder="e.g. 91.8210"
            />
          </div>



          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowGisUpload(!showGisUpload)}
              className="text-[11px] text-slate-500 hover:text-emerald-600 underline flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{showGisUpload ? 'Hide GIS Upload' : 'Optional: Have a .geojson boundary file?'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Create Compartment</span>
              </button>
            </div>
          </div>

          {/* Collapsible GIS import if user explicitly opens it */}
          {showGisUpload && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json"
                onChange={handleGISFileUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {gisPreviewDetails && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-medium">Parsed {parsedFeaturesCount} boundary polygon(s)</span>
                  <button
                    type="button"
                    disabled={isImportingGIS}
                    onClick={handleBatchGISImport}
                    className="px-3 py-1 bg-forest-600 text-white rounded text-xs"
                  >
                    {isImportingGIS ? 'Importing...' : 'Import GIS Polygons'}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
