'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchPlantations,
  createPlantation,
  updatePlantation,
  deletePlantation,
  fetchCompartments,
  calculatePlantationTelemetry,
} from '../../api/client';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import StatusBadge from '../common/StatusBadge';
import KPICard from '../common/KPICard';
import {
  Sparkles,
  Calculator,
  ShieldCheck,
  TreePine,
  RotateCcw,
  Compass,
  CheckCircle2,
  Maximize2,
  Sprout,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STANDARD_PLANTATION_SPECIES = [
  'Sal (Shorea robusta)',
  'Teak (Tectona grandis)',
  'Hollong (Dipterocarpus macrocarpus)',
  'Bamboo (Bambusa tulda)',
  'Sissoo (Dalbergia sissoo)',
  'Rubber (Hevea brasiliensis)',
  'Gamhar (Gmelina arborea)',
  'Mixed Native',
];

const SPECIES_BIOPHYSICS = {
  'Sal (Shorea robusta)': { base_ndvi: 0.78, base_ndwi: 0.25, base_cir: 2.85, base_sar: -14.5, max_chm: 22.0, max_agb: 230.0 },
  'Teak (Tectona grandis)': { base_ndvi: 0.75, base_ndwi: 0.22, base_cir: 2.70, base_sar: -15.0, max_chm: 20.0, max_agb: 210.0 },
  'Hollong (Dipterocarpus macrocarpus)': { base_ndvi: 0.82, base_ndwi: 0.29, base_cir: 3.05, base_sar: -13.8, max_chm: 25.0, max_agb: 260.0 },
  'Bamboo (Bambusa tulda)': { base_ndvi: 0.76, base_ndwi: 0.23, base_cir: 2.65, base_sar: -15.8, max_chm: 16.0, max_agb: 140.0 },
  'Sissoo (Dalbergia sissoo)': { base_ndvi: 0.71, base_ndwi: 0.19, base_cir: 2.50, base_sar: -16.2, max_chm: 15.0, max_agb: 130.0 },
  'Rubber (Hevea brasiliensis)': { base_ndvi: 0.79, base_ndwi: 0.26, base_cir: 2.80, base_sar: -14.6, max_chm: 18.0, max_agb: 175.0 },
  'Gamhar (Gmelina arborea)': { base_ndvi: 0.73, base_ndwi: 0.21, base_cir: 2.60, base_sar: -15.2, max_chm: 17.5, max_agb: 165.0 },
  'Mixed Native': { base_ndvi: 0.77, base_ndwi: 0.24, base_cir: 2.75, base_sar: -14.8, max_chm: 19.0, max_agb: 190.0 },
};

const calculatePlantationTelemetryLocal = (
  lat = 26.115,
  lng = 91.821,
  area_ha = 10.0,
  species = 'Mixed Native',
  planting_year = 2023,
  survival_rate = 85.0
) => {
  const numLat = parseFloat(lat) || 26.115;
  const numLng = parseFloat(lng) || 91.821;
  const validArea = Math.max(0.5, parseFloat(area_ha) || 10.0);
  const yr = parseInt(planting_year) || 2023;
  const age = Math.max(0.5, 2026 - yr);
  const srv = parseFloat(survival_rate) !== undefined && !isNaN(parseFloat(survival_rate)) ? parseFloat(survival_rate) : 85.0;
  const srvRatio = Math.min(1.0, Math.max(0.1, srv / 100.0));

  let specKey = 'Mixed Native';
  if (species) {
    for (const k of Object.keys(SPECIES_BIOPHYSICS)) {
      if (k.toLowerCase().includes(species.toLowerCase()) || species.toLowerCase().includes(k.toLowerCase())) {
        specKey = k;
        break;
      }
    }
  }
  const profile = SPECIES_BIOPHYSICS[specKey] || SPECIES_BIOPHYSICS['Mixed Native'];

  // Allometric growth curve
  const growth = 1.0 - Math.exp(-0.25 * age);
  const s = Math.log10(Math.max(1.0, validArea) / 25.0);

  // Deterministic micro-spatial raster variance
  const hf = Math.sin(numLat * 1234.567 + numLng * 765.432);
  const vf = Math.cos(numLat * 432.198 - numLng * 891.234);

  const current_ndvi = Math.min(0.92, Math.max(0.20, profile.base_ndvi * (0.55 + 0.45 * growth) * (0.7 + 0.3 * srvRatio) + s * 0.02 + hf * 0.01)).toFixed(2);
  const current_ndwi = Math.min(0.55, Math.max(-0.30, profile.base_ndwi * (0.50 + 0.50 * growth) * (0.6 + 0.4 * srvRatio) + s * 0.02 + vf * 0.01)).toFixed(2);
  const cir_vigor_score = Math.min(4.5, Math.max(1.1, profile.base_cir * (0.60 + 0.40 * growth) * (0.7 + 0.3 * srvRatio) + s * 0.05 + hf * 0.02)).toFixed(2);
  const sar_backscatter_vh_db = Math.min(-6.0, Math.max(-24.0, profile.base_sar - (1.0 - growth) * 4.0 - (1.0 - srvRatio) * 3.0 + s * 0.5 + vf * 0.2)).toFixed(1);
  const mean_canopy_height_m = Math.min(35.0, Math.max(1.2, profile.max_chm * growth * (0.8 + 0.2 * srvRatio) + hf * 0.3)).toFixed(1);
  const biomass_tonnes_per_ha = Math.min(350.0, Math.max(10.0, profile.max_agb * Math.pow(growth, 1.3) * srvRatio * (1.0 + s * 0.04) + (hf + vf) * 1.5)).toFixed(1);
  const total_biomass_tonnes = (parseFloat(biomass_tonnes_per_ha) * validArea).toFixed(1);

  let suggested_status = 'Active';
  if (srv >= 80.0 && age >= 5.0) {
    suggested_status = 'Mature';
  } else if (srv >= 75.0) {
    suggested_status = 'Active';
  } else if (srv >= 55.0) {
    suggested_status = 'Under Review';
  } else {
    suggested_status = 'Degraded';
  }

  return {
    current_ndvi,
    current_ndwi,
    cir_vigor_score,
    sar_backscatter_vh_db,
    mean_canopy_height_m,
    biomass_tonnes_per_ha,
    total_biomass_tonnes,
    survival_rate_percent: srv.toFixed(1),
    suggested_status,
  };
};

const INITIAL_PLANTATIONS = [
  { id: 1, name: 'Bokakhat Sal Restoration Block', scheme: 'CAMPA', year: 2023, species: 'Sal (Shorea robusta)', initial_saplings: 25000, surviving_saplings: 22100, survival_rate_pct: 88.4, area_ha: 25.0, centroid_lat: 26.5824, centroid_lng: 93.1842, ndvi: 0.74, biomass_agb: 142.5, status: 'Active' },
  { id: 2, name: 'Sonapur Teak & Gamhar Plot', scheme: 'Green India Mission', year: 2022, species: 'Teak, Gamhar', initial_saplings: 40000, surviving_saplings: 29800, survival_rate_pct: 74.5, area_ha: 40.0, centroid_lat: 26.1215, centroid_lng: 91.9540, ndvi: 0.68, biomass_agb: 210.0, status: 'Under Review' },
  { id: 3, name: 'Charduar Hollong Afforestation', scheme: 'State Forest Plan', year: 2021, species: 'Hollong', initial_saplings: 30000, surviving_saplings: 27500, survival_rate_pct: 91.7, area_ha: 30.0, centroid_lat: 26.8240, centroid_lng: 92.7845, ndvi: 0.81, biomass_agb: 285.2, status: 'Active' },
  { id: 4, name: 'Kalaigaon Riverine Buffer', scheme: 'Afforestation', year: 2024, species: 'Sissoo, Khair', initial_saplings: 15000, surviving_saplings: 8200, survival_rate_pct: 54.7, area_ha: 15.0, centroid_lat: 26.4380, centroid_lng: 92.0310, ndvi: 0.49, biomass_agb: 62.1, status: 'Degraded' },
  { id: 5, name: 'Bagori Eco-Restoration Site', scheme: 'CAMPA', year: 2020, species: 'Mixed Native', initial_saplings: 50000, surviving_saplings: 46200, survival_rate_pct: 92.4, area_ha: 50.0, centroid_lat: 26.5750, centroid_lng: 93.1520, ndvi: 0.85, biomass_agb: 420.0, status: 'Mature' },
];

export default function PlantationsPage() {
  const [plantations, setPlantations] = useState([]);
  const [compartments, setCompartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelemetryCustom, setIsTelemetryCustom] = useState(false);

  // Filters
  const [filterScheme, setFilterScheme] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const EMPTY_PLANTATION_FORM = {
    name: '',
    scheme: '',
    year: '',
    species: '',
    compartment_id: '',
    centroid_lat: '',
    centroid_lng: '',
    initial_saplings: '',
    surviving_saplings: '',
    survival_rate_pct: '',
    area_ha: '',
    ndvi: '',
    ndwi: '',
    cir: '',
    sar_vh: '',
    chm_m: '',
    biomass_agb: '',
    status: '',
  };

  const [formData, setFormData] = useState(EMPTY_PLANTATION_FORM);

  const normalizePlantation = (p) => ({
    ...p,
    scheme: p.scheme || p.scheme_name || 'CAMPA',
    scheme_name: p.scheme_name || p.scheme || 'CAMPA',
    year: p.year || p.planting_year || 2023,
    planting_year: p.planting_year || p.year || 2023,
    species: p.species || p.primary_species || 'Mixed Native',
    primary_species: p.primary_species || p.species || 'Mixed Native',
    surviving_saplings: p.surviving_saplings ?? p.surviving_count ?? (p.initial_saplings || 0),
    surviving_count: p.surviving_count ?? p.surviving_saplings ?? (p.initial_saplings || 0),
    survival_rate_pct: p.survival_rate_pct ?? p.survival_rate_percent ?? 85.0,
    survival_rate_percent: p.survival_rate_percent ?? p.survival_rate_pct ?? 85.0,
    centroid_lat: p.centroid_lat ?? p.lat ?? 26.2,
    centroid_lng: p.centroid_lng ?? p.lng ?? 92.5,
    lat: p.centroid_lat ?? p.lat ?? 26.2,
    lng: p.centroid_lng ?? p.lng ?? 92.5,
    ndvi: p.ndvi ?? p.current_ndvi ?? 0.65,
    current_ndvi: p.current_ndvi ?? p.ndvi ?? 0.65,
    ndwi: p.ndwi ?? p.current_ndwi ?? 0.22,
    current_ndwi: p.current_ndwi ?? p.ndwi ?? 0.22,
    cir: p.cir ?? p.cir_vigor_score ?? 2.75,
    cir_vigor_score: p.cir_vigor_score ?? p.cir ?? 2.75,
    sar_vh: p.sar_vh ?? p.sar_backscatter_vh_db ?? -15.5,
    sar_backscatter_vh_db: p.sar_backscatter_vh_db ?? p.sar_vh ?? -15.5,
    chm_m: p.chm_m ?? p.mean_canopy_height_m ?? 12.0,
    mean_canopy_height_m: p.mean_canopy_height_m ?? p.chm_m ?? 12.0,
    biomass_agb: p.biomass_agb ?? p.biomass_tonnes_per_ha ?? 120.0,
    biomass_tonnes_per_ha: p.biomass_tonnes_per_ha ?? p.biomass_agb ?? 120.0,
  });

  const loadPlantations = async () => {
    setIsLoading(true);
    try {
      const [data, comps] = await Promise.all([
        fetchPlantations(),
        fetchCompartments(),
      ]);

      const loadedComps = Array.isArray(comps) ? comps : [];
      setCompartments(loadedComps);

      if (Array.isArray(data) && data.length > 0) {
        setPlantations(data.map(normalizePlantation));
      } else {
        setPlantations(INITIAL_PLANTATIONS.map(normalizePlantation));
      }


    } catch (err) {
      setPlantations(INITIAL_PLANTATIONS.map(normalizePlantation));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlantations();
  }, []);

  // Reactive multi-parameter biophysical satellite computation
  const syncPlantationBiophysics = (overrides = {}) => {
    const merged = { ...formData, ...overrides };
    const numLat = parseFloat(merged.centroid_lat) || 26.115;
    const numLng = parseFloat(merged.centroid_lng) || 91.821;
    const numArea = parseFloat(merged.area_ha) || 10.0;
    const yr = parseInt(merged.year) || 2023;
    const initSap = parseFloat(merged.initial_saplings) || 0;
    const survSap = parseFloat(merged.surviving_saplings) || initSap;
    const srvRate = initSap > 0 ? ((survSap / initSap) * 100) : 85.0;

    const tel = calculatePlantationTelemetryLocal(numLat, numLng, numArea, merged.species, yr, srvRate);
    if (tel) {
      setFormData((prev) => ({
        ...prev,
        ...overrides,
        survival_rate_pct: srvRate.toFixed(1),
        ndvi: isTelemetryCustom && overrides.ndvi !== undefined ? overrides.ndvi : tel.current_ndvi,
        ndwi: isTelemetryCustom && overrides.ndwi !== undefined ? overrides.ndwi : tel.current_ndwi,
        cir: isTelemetryCustom && overrides.cir !== undefined ? overrides.cir : tel.cir_vigor_score,
        sar_vh: isTelemetryCustom && overrides.sar_vh !== undefined ? overrides.sar_vh : tel.sar_backscatter_vh_db,
        chm_m: isTelemetryCustom && overrides.chm_m !== undefined ? overrides.chm_m : tel.mean_canopy_height_m,
        biomass_agb: isTelemetryCustom && overrides.biomass_agb !== undefined ? overrides.biomass_agb : tel.biomass_tonnes_per_ha,
        status: overrides.status || tel.suggested_status,
      }));
    }
  };

  const handleCompartmentChange = (compId) => {
    setFormData((prev) => ({ ...prev, compartment_id: compId }));
  };

  const handleSaplingsChange = (field, val) => {
    const updated = { [field]: val };
    const init = field === 'initial_saplings' ? parseFloat(val) : parseFloat(formData.initial_saplings);
    const surv = field === 'surviving_saplings' ? parseFloat(val) : parseFloat(formData.surviving_saplings);
    const rate = (!isNaN(init) && init > 0 && !isNaN(surv) && surv >= 0) ? ((surv / init) * 100).toFixed(1) : '';
    syncPlantationBiophysics({ ...updated, survival_rate_pct: rate });
  };

  const handleResetToAuto = () => {
    setIsTelemetryCustom(false);
    const numLat = parseFloat(formData.centroid_lat) || 26.115;
    const numLng = parseFloat(formData.centroid_lng) || 91.821;
    const numArea = parseFloat(formData.area_ha) || 10.0;
    const yr = parseInt(formData.year) || 2023;
    const srv = parseFloat(formData.survival_rate_pct) || 85.0;

    const tel = calculatePlantationTelemetryLocal(numLat, numLng, numArea, formData.species, yr, srv);
    if (tel) {
      setFormData((prev) => ({
        ...prev,
        ndvi: tel.current_ndvi,
        ndwi: tel.current_ndwi,
        cir: tel.cir_vigor_score,
        sar_vh: tel.sar_backscatter_vh_db,
        chm_m: tel.mean_canopy_height_m,
        biomass_agb: tel.biomass_tonnes_per_ha,
        status: tel.suggested_status,
      }));
      toast.success('Plantation telemetry auto-calculated from EO models');
    }
  };

  const filteredPlantations = useMemo(() => {
    return plantations.filter((p) => {
      if (filterScheme && p.scheme !== filterScheme) return false;
      if (filterYear && String(p.year) !== filterYear) return false;
      if (filterSpecies && !p.species?.toLowerCase().includes(filterSpecies.toLowerCase())) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [plantations, filterScheme, filterYear, filterSpecies, filterStatus]);

  const plantationStats = useMemo(() => {
    const total = plantations.length;
    if (total === 0) return { total: 0, totalArea: '0.0', avgSurvival: '0.0', avgLat: '26.2000', avgLng: '92.5000' };
    const totalArea = plantations.reduce((sum, p) => sum + (Number(p.area_ha) || 0), 0);
    const avgSurvival = plantations.reduce((sum, p) => sum + (Number(p.survival_rate_pct) || 0), 0) / total;
    const avgLat = plantations.reduce((sum, p) => sum + (Number(p.centroid_lat || p.lat) || 26.2), 0) / total;
    const avgLng = plantations.reduce((sum, p) => sum + (Number(p.centroid_lng || p.lng) || 92.5), 0) / total;
    return {
      total,
      totalArea: totalArea.toFixed(1),
      avgSurvival: avgSurvival.toFixed(1),
      avgLat: avgLat.toFixed(4),
      avgLng: avgLng.toFixed(4),
    };
  }, [plantations]);

  const handleUpdate = async (id, updatedRow) => {
    // Automatically re-calculate survival rate if saplings change
    if (updatedRow.initial_saplings && updatedRow.surviving_saplings) {
      updatedRow.survival_rate_pct = Number(
        ((Number(updatedRow.surviving_saplings) / Number(updatedRow.initial_saplings)) * 100).toFixed(1)
      );
      updatedRow.survival_rate_percent = updatedRow.survival_rate_pct;
    }

    // Automatically recalculate biophysical telemetry if coordinates, area, or species change
    if (
      updatedRow.centroid_lat !== undefined ||
      updatedRow.centroid_lng !== undefined ||
      updatedRow.area_ha !== undefined ||
      updatedRow.species !== undefined
    ) {
      const numLat = parseFloat(updatedRow.centroid_lat) || 26.115;
      const numLng = parseFloat(updatedRow.centroid_lng) || 91.821;
      const numArea = parseFloat(updatedRow.area_ha) || 10.0;
      const yr = parseInt(updatedRow.year) || 2023;
      const srv = parseFloat(updatedRow.survival_rate_pct) || 85.0;
      const tel = calculatePlantationTelemetryLocal(numLat, numLng, numArea, updatedRow.species || 'Sal (Shorea robusta)', yr, srv);
      if (tel) {
        updatedRow.ndvi = tel.current_ndvi;
        updatedRow.current_ndvi = tel.current_ndvi;
        updatedRow.ndwi = tel.current_ndwi;
        updatedRow.current_ndwi = tel.current_ndwi;
        updatedRow.cir = tel.cir_vigor_score;
        updatedRow.cir_vigor_score = tel.cir_vigor_score;
        updatedRow.sar_vh = tel.sar_backscatter_vh_db;
        updatedRow.sar_backscatter_vh_db = tel.sar_backscatter_vh_db;
        updatedRow.chm_m = tel.mean_canopy_height_m;
        updatedRow.mean_canopy_height_m = tel.mean_canopy_height_m;
        updatedRow.biomass_agb = tel.biomass_tonnes_per_ha;
        updatedRow.biomass_tonnes_per_ha = tel.biomass_tonnes_per_ha;
      }
    }

    const normalized = normalizePlantation(updatedRow);

    try {
      await updatePlantation(id, {
        name: normalized.name,
        scheme_name: normalized.scheme,
        planting_year: Number(normalized.year) || 2023,
        primary_species: normalized.species,
        initial_saplings: Number(normalized.initial_saplings) || 0,
        surviving_count: Number(normalized.surviving_saplings) || 0,
        survival_rate_percent: Number(normalized.survival_rate_pct) || 0,
        area_ha: Number(normalized.area_ha) || 0,
        centroid_lat: Number(normalized.centroid_lat) || 26.2,
        centroid_lng: Number(normalized.centroid_lng) || 92.5,
        current_ndvi: Number(normalized.ndvi) || 0.65,
        current_ndwi: Number(normalized.ndwi) || 0.22,
        cir_vigor_score: Number(normalized.cir) || 2.75,
        sar_backscatter_vh_db: Number(normalized.sar_vh) || -15.5,
        mean_canopy_height_m: Number(normalized.chm_m) || 12.0,
        biomass_tonnes_per_ha: Number(normalized.biomass_agb) || 0,
        status: normalized.status,
      });
      setPlantations((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Plantation updated');
    } catch (err) {
      setPlantations((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Plantation updated locally');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePlantation(id);
      setPlantations((prev) => prev.filter((item) => item.id !== id));
      toast.success('Plantation deleted');
    } catch (err) {
      setPlantations((prev) => prev.filter((item) => item.id !== id));
      toast.success('Plantation deleted locally');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Plantation Name is required');
      return;
    }

    const initSap = Number(formData.initial_saplings) || 0;
    const survSap = Number(formData.surviving_saplings) || initSap;
    const rate = initSap > 0 ? Number(((survSap / initSap) * 100).toFixed(1)) : 100;
    const validArea = Number(formData.area_ha) || 10;
    const resolvedCompId = formData.compartment_id || (compartments[0]?.id || 'kamrup-c01');

    const payload = {
      name: formData.name,
      scheme_name: formData.scheme,
      planting_year: Number(formData.year) || new Date().getFullYear(),
      primary_species: formData.species || 'Mixed Native',
      initial_saplings: initSap,
      surviving_count: survSap,
      survival_rate_percent: rate,
      area_ha: validArea,
      centroid_lat: Number(formData.centroid_lat) || 26.2,
      centroid_lng: Number(formData.centroid_lng) || 92.5,
      current_ndvi: Number(formData.ndvi) || 0.70,
      current_ndwi: Number(formData.ndwi) || 0.22,
      cir_vigor_score: Number(formData.cir) || 2.75,
      sar_backscatter_vh_db: Number(formData.sar_vh) || -15.0,
      mean_canopy_height_m: Number(formData.chm_m) || 10.0,
      biomass_tonnes_per_ha: Number(formData.biomass_agb) || 120,
      status: formData.status || 'Active',
      compartment_id: resolvedCompId,
    };

    try {
      const newRecord = await createPlantation(payload);
      const normalized = normalizePlantation(newRecord || { id: Date.now(), ...payload });
      setPlantations((prev) => [normalized, ...prev]);
      toast.success('Plantation recorded with satellite biophysics');
    } catch (err) {
      const normalized = normalizePlantation({ id: Date.now(), ...payload });
      setPlantations((prev) => [normalized, ...prev]);
      toast.success('Plantation recorded locally');
    } finally {
      setIsAddModalOpen(false);
      setIsTelemetryCustom(false);
    }
  };

  const columns = [
    { header: 'Plantation Site', accessor: 'name', editable: true, width: 'w-56' },
    {
      header: 'Scheme',
      accessor: 'scheme',
      editable: true,
      type: 'select',
      options: ['CAMPA', 'Green India Mission', 'State Forest Plan', 'Afforestation', 'NABARD'],
    },
    { header: 'Year', accessor: 'year', editable: true, type: 'number', width: 'w-20' },
    { header: 'Species', accessor: 'species', editable: true },
    {
      header: 'Initial',
      accessor: 'initial_saplings',
      editable: true,
      type: 'number',
      render: (v) => Number(v || 0).toLocaleString(),
    },
    {
      header: 'Surviving',
      accessor: 'surviving_saplings',
      editable: true,
      type: 'number',
      render: (v) => Number(v || 0).toLocaleString(),
    },
    {
      header: 'Survival %',
      accessor: 'survival_rate_pct',
      editable: false,
      render: (v) => {
        const val = Number(v || 0);
        const color = val > 80 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' : val >= 60 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' : 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200';
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
            {val.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: 'Area (ha)',
      accessor: 'area_ha',
      editable: true,
      type: 'number',
      render: (v) => `${v} ha`,
    },
    {
      header: 'Centroid Latitude (°N)',
      accessor: 'centroid_lat',
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
      accessor: 'centroid_lng',
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

    {
      header: 'Status',
      accessor: 'status',
      editable: true,
      type: 'select',
      options: ['Active', 'Under Review', 'Degraded', 'Mature'],
      render: (v) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Plantation Monitoring
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {plantations.length} Sites
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Multi-year afforestation schemes, GPS centroid coordinates, Sentinel NDVI indices, and survival verification.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={TreePine}
          title="Total Plantations"
          value={plantationStats.total}
          subtitle="Monitored Plantation Sites"
          color="green"
        />
        <KPICard
          icon={Maximize2}
          title="Planted Area"
          value={`${plantationStats.totalArea} ha`}
          subtitle="Total Afforestation Extent"
          color="blue"
        />
        <KPICard
          icon={ShieldCheck}
          title="Avg Survival Rate"
          value={`${plantationStats.avgSurvival}%`}
          subtitle="Field & Drone Verified"
          color="purple"
        />
        <KPICard
          icon={Sprout}
          title="Total Saplings"
          value={plantations.reduce((acc, p) => acc + (Number(p.initial_saplings) || 0), 0).toLocaleString()}
          subtitle="Target Stems Planted"
          color="yellow"
        />
      </div>

      <DataTable
        title="Plantation Sites"
        columns={columns}
        data={filteredPlantations}
        isLoading={isLoading}
        onAdd={() => {
          setFormData({ ...EMPTY_PLANTATION_FORM });
          setIsAddModalOpen(true);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        filterComponent={
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={filterScheme}
              onChange={(e) => setFilterScheme(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Schemes</option>
              <option value="CAMPA">CAMPA</option>
              <option value="Green India Mission">Green India Mission</option>
              <option value="State Forest Plan">State Forest Plan</option>
              <option value="Afforestation">Afforestation</option>
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Degraded">Degraded</option>
              <option value="Mature">Mature</option>
            </select>

            {(filterScheme || filterYear || filterStatus) && (
              <button
                onClick={() => {
                  setFilterScheme('');
                  setFilterYear('');
                  setFilterStatus('');
                }}
                className="text-forest-600 hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        }
      />

      {/* Add Plantation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Plantation Plot"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="leading-relaxed">
              <strong>Plantation Registry:</strong> Link the plantation block to an official forest compartment, afforestation scheme, tree species, and seedling survival count.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parent Forest Compartment *
              </label>
              <select
                required
                value={formData.compartment_id}
                onChange={(e) => handleCompartmentChange(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="">Select Forest Compartment...</option>
                {compartments.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.compartment_number || c.compartment_no || c.id} — {c.division_code || c.division || 'Division'} ({c.range_name || c.range || 'Range'})
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Plantation Site Name *"
              name="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kaziranga Buffer Restoration Plot"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Scheme *
              </label>
              <select
                required
                value={formData.scheme}
                onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="">Select Afforestation Scheme...</option>
                {['CAMPA', 'Green India Mission', 'State Forest Plan', 'Afforestation', 'NABARD'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Species *
              </label>
              <select
                value={formData.species}
                onChange={(e) => syncPlantationBiophysics({ species: e.target.value })}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="">Select Primary Species...</option>
                {STANDARD_PLANTATION_SPECIES.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Planting Year *"
              name="year"
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={formData.year}
              placeholder="e.g. 2024"
              onChange={(e) => syncPlantationBiophysics({ year: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Initial Saplings Planted *"
              name="initial_saplings"
              type="number"
              required
              value={formData.initial_saplings}
              onChange={(e) => handleSaplingsChange('initial_saplings', e.target.value)}
              placeholder="e.g. 25000"
            />

            <FormField
              label="Surviving Saplings *"
              name="surviving_saplings"
              type="number"
              required
              value={formData.surviving_saplings}
              onChange={(e) => handleSaplingsChange('surviving_saplings', e.target.value)}
              placeholder="e.g. 22000"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Survival Rate & Status *
              </label>
              <div className="flex items-center gap-2 h-9">
                <span
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border font-mono ${
                    parseFloat(formData.survival_rate_pct) >= 80
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : parseFloat(formData.survival_rate_pct) >= 60
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  }`}
                >
                  {formData.survival_rate_pct ? `${formData.survival_rate_pct}%` : '—'}
                </span>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex-1 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select Status...</option>
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Degraded">Degraded</option>
                  <option value="Mature">Mature</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Plantation Area (Hectares) *"
              name="area_ha"
              type="number"
              step="0.1"
              required
              value={formData.area_ha}
              onChange={(e) => syncPlantationBiophysics({ area_ha: e.target.value })}
              placeholder="e.g. 25.0"
            />

            <FormField
              label="Centroid Latitude (°N)"
              name="centroid_lat"
              type="number"
              step="0.0001"
              value={formData.centroid_lat}
              onChange={(e) => syncPlantationBiophysics({ centroid_lat: e.target.value })}
              placeholder="e.g. 26.1150"
            />

            <FormField
              label="Centroid Longitude (°E)"
              name="centroid_lng"
              type="number"
              step="0.0001"
              value={formData.centroid_lng}
              onChange={(e) => syncPlantationBiophysics({ centroid_lng: e.target.value })}
              placeholder="e.g. 91.8210"
            />
          </div>



          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Plantation Plot</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
