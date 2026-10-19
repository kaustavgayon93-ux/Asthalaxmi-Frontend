'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchSamplePlots,
  createSamplePlot,
  updateSamplePlot,
  deleteSamplePlot,
} from '../../api/client';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import StatusBadge from '../common/StatusBadge';
import KPICard from '../common/KPICard';
import { Target, ClipboardCheck, Clock, Maximize2, ShieldCheck, CheckCircle2, Sparkles, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_SAMPLE_PLOTS = [
  { id: 1, plot_code: 'PLT-BK-01', plantation: 'Bokakhat Sal Restoration Block', center_lat: 26.5824, center_lng: 93.1842, radius_m: 17.84, area_ha: 0.1, last_surveyed: '2026-09-15', survey_count: 4, status: 'Active' },
  { id: 2, plot_code: 'PLT-BK-02', plantation: 'Bokakhat Sal Restoration Block', center_lat: 26.5851, center_lng: 93.1895, radius_m: 17.84, area_ha: 0.1, last_surveyed: '2026-09-18', survey_count: 4, status: 'Active' },
  { id: 3, plot_code: 'PLT-SN-01', plantation: 'Sonapur Teak & Gamhar Plot', center_lat: 26.1215, center_lng: 91.9540, radius_m: 12.62, area_ha: 0.05, last_surveyed: '2026-08-20', survey_count: 3, status: 'Active' },
  { id: 4, plot_code: 'PLT-CH-01', plantation: 'Charduar Hollong Afforestation', center_lat: 26.8240, center_lng: 92.7845, radius_m: 17.84, area_ha: 0.1, last_surveyed: '2026-10-02', survey_count: 5, status: 'Active' },
  { id: 5, plot_code: 'PLT-KL-01', plantation: 'Kalaigaon Riverine Buffer', center_lat: 26.4380, center_lng: 92.0310, radius_m: 17.84, area_ha: 0.1, last_surveyed: '2026-07-10', survey_count: 2, status: 'Degraded' },
];

export default function SamplePlotsPage() {
  const [plots, setPlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlantation, setSelectedPlantation] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const EMPTY_PLOT_FORM = {
    plot_code: '',
    plantation: '',
    center_lat: '',
    center_lng: '',
    radius_m: '',
    area_ha: '',
    last_surveyed: '',
    survey_count: '',
    status: '',
  };

  const [formData, setFormData] = useState(EMPTY_PLOT_FORM);

  const normalizePlot = (p) => ({
    ...p,
    radius_m: p.radius_m ?? p.radius_meters ?? 17.84,
    radius_meters: p.radius_meters ?? p.radius_m ?? 17.84,
    plantation: p.plantation || p.plantation_id || 'Kamrup Plantation Block',
  });

  const loadPlots = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSamplePlots();
      if (Array.isArray(data) && data.length > 0) {
        setPlots(data.map(normalizePlot));
      } else {
        setPlots(INITIAL_SAMPLE_PLOTS.map(normalizePlot));
      }
    } catch (err) {
      setPlots(INITIAL_SAMPLE_PLOTS.map(normalizePlot));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlots();
  }, []);

  const plantationsList = useMemo(() => {
    const set = new Set(plots.map((p) => p.plantation));
    return Array.from(set).filter(Boolean);
  }, [plots]);

  const filteredPlots = useMemo(() => {
    if (!selectedPlantation) return plots;
    return plots.filter((p) => p.plantation === selectedPlantation);
  }, [plots, selectedPlantation]);

  const handleUpdate = async (id, updatedRow) => {
    const normalized = normalizePlot(updatedRow);
    try {
      await updateSamplePlot(id, {
        plot_code: normalized.plot_code,
        center_lat: Number(normalized.center_lat) || 26.2,
        center_lng: Number(normalized.center_lng) || 92.5,
        radius_meters: Number(normalized.radius_m) || 17.84,
        area_ha: Number(normalized.area_ha) || 0.1,
        status: normalized.status,
      });
      setPlots((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Sample Plot updated');
    } catch (err) {
      setPlots((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Sample Plot updated locally');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSamplePlot(id);
      setPlots((prev) => prev.filter((item) => item.id !== id));
      toast.success('Sample Plot deleted');
    } catch (err) {
      setPlots((prev) => prev.filter((item) => item.id !== id));
      toast.success('Sample Plot deleted locally');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.plot_code || !formData.plantation) {
      toast.error('Plot Code and Plantation are required');
      return;
    }

    const payload = {
      plot_code: formData.plot_code,
      plantation_id: formData.plantation_id || 'plant-01',
      center_lat: Number(formData.center_lat) || 26.2,
      center_lng: Number(formData.center_lng) || 92.9,
      radius_meters: Number(formData.radius_m) || 17.84,
      area_ha: Number(formData.area_ha) || 0.1,
      survey_count: Number(formData.survey_count) || 1,
      status: formData.status || 'Active',
    };

    try {
      const newRecord = await createSamplePlot(payload);
      const normalized = normalizePlot(newRecord || { id: Date.now(), ...payload });
      setPlots((prev) => [normalized, ...prev]);
      toast.success('Sample Plot created');
    } catch (err) {
      const normalized = normalizePlot({ id: Date.now(), ...payload });
      setPlots((prev) => [normalized, ...prev]);
      toast.success('Sample Plot created locally');
    } finally {
      setIsAddModalOpen(false);
      setFormData({ ...EMPTY_PLOT_FORM });
    }
  };

  const columns = [
    { header: 'Plot Code', accessor: 'plot_code', editable: true, width: 'w-36' },
    { header: 'Plantation', accessor: 'plantation', editable: true, width: 'w-60' },
    { header: 'Centroid Latitude (°N)', accessor: 'center_lat', editable: true, type: 'number', step: '0.0001', width: 'w-36' },
    { header: 'Centroid Longitude (°E)', accessor: 'center_lng', editable: true, type: 'number', step: '0.0001', width: 'w-36' },
    { header: 'Radius (m)', accessor: 'radius_m', editable: true, type: 'number', width: 'w-24' },
    { header: 'Area (ha)', accessor: 'area_ha', editable: true, type: 'number', width: 'w-24' },
    { header: 'Last Surveyed', accessor: 'last_surveyed', editable: true, width: 'w-32' },
    { header: 'Surveys', accessor: 'survey_count', editable: true, type: 'number', width: 'w-20' },
    {
      header: 'Status',
      accessor: 'status',
      editable: true,
      type: 'select',
      options: ['Active', 'Under Review', 'Degraded'],
      render: (v) => <StatusBadge status={v} />,
      width: 'w-28',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Sample Plots
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {plots.length} Plots
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Standard 0.1ha and 0.05ha circular sample plots for biomass verification.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Target}
          title="Total Sample Plots"
          value={plots.length}
          subtitle="Fixed Radius Plots"
          color="green"
        />
        <KPICard
          icon={ClipboardCheck}
          title="Active Plots"
          value={plots.filter((p) => p.status === 'Active').length}
          subtitle="Regular Field Inventory"
          color="blue"
        />
        <KPICard
          icon={Clock}
          title="Total Surveys"
          value={plots.reduce((acc, p) => acc + (Number(p.survey_count) || 0), 0)}
          subtitle="Field Audits Executed"
          color="purple"
        />
        <KPICard
          icon={Maximize2}
          title="Monitored Area"
          value={`${plots.reduce((acc, p) => acc + (Number(p.area_ha) || 0), 0).toFixed(2)} ha`}
          subtitle="Sample Ground Coverage"
          color="yellow"
        />
      </div>

      <DataTable
        title="Survey Plots"
        columns={columns}
        data={filteredPlots}
        isLoading={isLoading}
        onAdd={() => {
          setFormData({
            ...EMPTY_PLOT_FORM,
            plantation: selectedPlantation || '',
          });
          setIsAddModalOpen(true);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        filterComponent={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter by Plantation:</span>
            <select
              value={selectedPlantation}
              onChange={(e) => setSelectedPlantation(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Plantations</option>
              {plantationsList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {selectedPlantation && (
              <button
                onClick={() => setSelectedPlantation('')}
                className="text-xs text-forest-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        }
      />

      {/* Add Sample Plot Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Sample Inventory Plot"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="leading-relaxed">
              <strong>Sample Inventory Plot Registry:</strong> Demarcate standard circular inventory plots for field allometry and tree measurement calibration. Area is linked to plot radius (e.g. 17.84m = 0.10 ha; 12.62m = 0.05 ha).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Plot Code *"
              name="plot_code"
              required
              value={formData.plot_code}
              onChange={(e) => setFormData({ ...formData, plot_code: e.target.value })}
              placeholder="e.g. PLT-BK-03"
            />
            <FormField
              label="Plantation Site *"
              name="plantation"
              required
              value={formData.plantation}
              onChange={(e) => setFormData({ ...formData, plantation: e.target.value })}
              placeholder="e.g. Bokakhat Sal Restoration Block"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Centroid Latitude (°N) *"
              name="center_lat"
              type="number"
              step="0.0001"
              required
              value={formData.center_lat}
              onChange={(e) => setFormData({ ...formData, center_lat: e.target.value })}
              placeholder="e.g. 26.5824"
            />
            <FormField
              label="Centroid Longitude (°E) *"
              name="center_lng"
              type="number"
              step="0.0001"
              required
              value={formData.center_lng}
              onChange={(e) => setFormData({ ...formData, center_lng: e.target.value })}
              placeholder="e.g. 93.1842"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Plot Radius (m) *"
              name="radius_m"
              type="number"
              step="0.01"
              value={formData.radius_m}
              onChange={(e) => {
                const r = parseFloat(e.target.value);
                const a = !isNaN(r) && r > 0 ? ((Math.PI * r * r) / 10000).toFixed(2) : formData.area_ha;
                setFormData({ ...formData, radius_m: e.target.value, area_ha: String(a) });
              }}
              placeholder="17.84"
            />
            <FormField
              label="Plot Area (ha) *"
              name="area_ha"
              type="number"
              step="0.01"
              value={formData.area_ha}
              onChange={(e) => {
                const a = parseFloat(e.target.value);
                const r = !isNaN(a) && a > 0 ? Math.sqrt((a * 10000) / Math.PI).toFixed(2) : formData.radius_m;
                setFormData({ ...formData, area_ha: e.target.value, radius_m: String(r) });
              }}
              placeholder="0.10"
            />
            <FormField
              label="Inventory Status"
              name="status"
              type="select"
              value={formData.status}
              placeholder="Select Inventory Status..."
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={['Active', 'Under Review', 'Degraded']}
            />
          </div>

          {/* Plot Geometry Preview Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Plot Geometry & Allometric Parameters</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                GPS: {formData.center_lat && formData.center_lng ? `${Number(formData.center_lat).toFixed(4)}°N, ${Number(formData.center_lng).toFixed(4)}°E` : 'Pending Coordinates'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Geometry Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Circular NFI</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Radius</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formData.radius_m ? `${formData.radius_m} m` : '—'}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Area Footprint</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{formData.area_ha ? `${formData.area_ha} ha` : '—'}</span>
              </div>
            </div>
          </div>

          <FormField
            label="Last Survey Date"
            name="last_surveyed"
            type="date"
            value={formData.last_surveyed}
            onChange={(e) => setFormData({ ...formData, last_surveyed: e.target.value })}
          />

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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Create Sample Plot</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
