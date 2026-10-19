'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchTreeMeasurements,
  createTreeMeasurement,
  updateTreeMeasurement,
  deleteTreeMeasurement,
  fetchSamplePlots,
} from '../../api/client';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import StatusBadge from '../common/StatusBadge';
import KPICard from '../common/KPICard';
import { ShieldCheck, CheckCircle2, Sparkles, Ruler, Trees, Activity, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_SAMPLE_PLOTS = [
  { id: 'sp-001', plot_code: 'GB-TK-01', plantation: 'Bokakhat Sal Restoration Block' },
  { id: 'sp-002', plot_code: 'GB-TK-02', plantation: 'Bokakhat Sal Restoration Block' },
  { id: 'sp-003', plot_code: 'GB-BM-01', plantation: 'Bokakhat Sal Restoration Block' },
  { id: 'sp-004', plot_code: 'RN-SL-01', plantation: 'Sonapur Teak & Gamhar Plot' },
  { id: 'sp-005', plot_code: 'RN-RB-01', plantation: 'Sonapur Teak & Gamhar Plot' },
  { id: 'sp-006', plot_code: 'KL-BM-01', plantation: 'Kalaigaon Riverine Buffer' },
  { id: 'sp-007', plot_code: 'KH-TK-01', plantation: 'Charduar Hollong Afforestation' },
  { id: 'sp-008', plot_code: 'KH-SS-01', plantation: 'Charduar Hollong Afforestation' },
  { id: 'sp-009', plot_code: 'BG-SS-01', plantation: 'Bhomoraguri Sissoo Stand' },
  { id: 'sp-010', plot_code: 'BP-HL-01', plantation: 'Bhalukpong Hollong Stand' },
  { id: 'sp-011', plot_code: 'BP-TK-01', plantation: 'Bhalukpong Teak Reserve' },
  { id: 'sp-012', plot_code: 'BC-SL-01', plantation: 'Balipara Sal Buffer' },
  { id: 'sp-013', plot_code: 'KZ-BM-01', plantation: 'Kaziranga Buffer Bamboo Stand' },
  { id: 'sp-014', plot_code: 'NB-HL-01', plantation: 'Numaligarh Biodiversity Block' },
  { id: 'sp-015', plot_code: 'NB-SL-01', plantation: 'Numaligarh Sal Restoration' },
  { id: 'sp-016', plot_code: 'CP-BM-01', plantation: 'Central Plantation Bamboo Plot' },
  { id: 'sp-017', plot_code: 'KP-SS-01', plantation: 'Kamrup Sissoo Stand' },
  { id: 'sp-018', plot_code: 'KP-RB-01', plantation: 'Kamrup Rubber Agroforestry' },
];

const INITIAL_TREES = [
  { id: 1, tree_no: 'TR-001', plot_code: 'GB-TK-01', sample_plot_id: 'sp-001', species_code: 'SAL', species_local: 'Sal', species_botanical: 'Shorea robusta', gbh_cm: 85.0, dbh_cm: 27.06, height_m: 18.5, health_status: 'Healthy', recorded_at: '2026-09-15' },
  { id: 2, tree_no: 'TR-002', plot_code: 'GB-TK-01', sample_plot_id: 'sp-001', species_code: 'HOL', species_local: 'Hollong', species_botanical: 'Dipterocarpus retusus', gbh_cm: 110.0, dbh_cm: 35.01, height_m: 24.2, health_status: 'Healthy', recorded_at: '2026-09-15' },
  { id: 3, tree_no: 'TR-003', plot_code: 'GB-TK-02', sample_plot_id: 'sp-002', species_code: 'GAM', species_local: 'Gamhar', species_botanical: 'Gmelina arborea', gbh_cm: 62.0, dbh_cm: 19.74, height_m: 14.0, health_status: 'Diseased', recorded_at: '2026-09-18' },
  { id: 4, tree_no: 'TR-004', plot_code: 'RN-SL-01', sample_plot_id: 'sp-004', species_code: 'TEK', species_local: 'Teak', species_botanical: 'Tectona grandis', gbh_cm: 74.0, dbh_cm: 23.55, height_m: 16.2, health_status: 'Healthy', recorded_at: '2026-08-20' },
  { id: 5, tree_no: 'TR-005', plot_code: 'KH-SS-01', sample_plot_id: 'sp-008', species_code: 'SIS', species_local: 'Sissoo', species_botanical: 'Dalbergia sissoo', gbh_cm: 45.0, dbh_cm: 14.32, height_m: 9.8, health_status: 'Broken/Felled', recorded_at: '2026-10-02' },
  { id: 6, tree_no: 'TR-006', plot_code: 'KL-BM-01', sample_plot_id: 'sp-006', species_code: 'KHA', species_local: 'Khair', species_botanical: 'Acacia catechu', gbh_cm: 32.0, dbh_cm: 10.19, height_m: 6.5, health_status: 'Dead', recorded_at: '2026-07-10' },
];

export default function TreeMeasurementsPage() {
  const [trees, setTrees] = useState([]);
  const [samplePlots, setSamplePlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPlot, setFilterPlot] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const EMPTY_TREE_FORM = {
    tree_no: '',
    plot_code: '',
    species_code: '',
    species_local: '',
    species_botanical: '',
    gbh_cm: '',
    height_m: '',
    health_status: '',
    recorded_at: '',
  };

  const [formData, setFormData] = useState(EMPTY_TREE_FORM);

  const normalizeTree = (t, plots = samplePlots) => {
    const list = plots && plots.length > 0 ? plots : INITIAL_SAMPLE_PLOTS;
    const matched = list.find(
      (p) =>
        p.id === t.sample_plot_id ||
        p.plot_code === t.plot_code ||
        p.plot_code === t.sample_plot_id ||
        p.id === t.plot_code
    );
    const resolvedPlotCode = matched?.plot_code || t.plot_code || list[0]?.plot_code || 'GB-TK-01';
    const resolvedPlotId = matched?.id || t.sample_plot_id || list[0]?.id || 'sp-001';

    return {
      ...t,
      tree_no: t.tree_no || (t.tree_number ? `TR-${String(t.tree_number).padStart(3, '0')}` : 'TR-001'),
      tree_number: t.tree_number || parseInt(String(t.tree_no || '').replace(/\D/g, '')) || 1,
      species_local: t.species_local || t.species_local_name || 'Sal',
      species_local_name: t.species_local_name || t.species_local || 'Sal',
      species_botanical: t.species_botanical || t.species_botanical_name || 'Shorea robusta',
      species_botanical_name: t.species_botanical_name || t.species_botanical || 'Shorea robusta',
      plot_code: resolvedPlotCode,
      sample_plot_id: resolvedPlotId,
      plantation_name: matched?.plantation || '',
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [treesData, plotsData] = await Promise.all([
        fetchTreeMeasurements().catch(() => null),
        fetchSamplePlots().catch(() => null),
      ]);

      const validPlots = Array.isArray(plotsData) && plotsData.length > 0 ? plotsData : INITIAL_SAMPLE_PLOTS;
      setSamplePlots(validPlots);

      if (Array.isArray(treesData) && treesData.length > 0) {
        setTrees(treesData.map((t) => normalizeTree(t, validPlots)));
      } else {
        setTrees(INITIAL_TREES.map((t) => normalizeTree(t, validPlots)));
      }


    } catch (err) {
      setSamplePlots(INITIAL_SAMPLE_PLOTS);
      setTrees(INITIAL_TREES.map((t) => normalizeTree(t, INITIAL_SAMPLE_PLOTS)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const registeredPlotCodes = useMemo(() => {
    const list = samplePlots.length > 0 ? samplePlots : INITIAL_SAMPLE_PLOTS;
    return list.map((sp) => sp.plot_code).filter(Boolean);
  }, [samplePlots]);

  const samplePlotOptions = useMemo(() => {
    const list = samplePlots.length > 0 ? samplePlots : INITIAL_SAMPLE_PLOTS;
    return list.map((sp) => ({
      value: sp.plot_code,
      label: sp.plot_code,
      id: sp.id,
    }));
  }, [samplePlots]);

  const speciesList = useMemo(() => Array.from(new Set(trees.map((t) => t.species_local))), [trees]);

  const filteredTrees = useMemo(() => {
    return trees.filter((t) => {
      if (filterPlot && t.plot_code !== filterPlot) return false;
      if (filterSpecies && t.species_local !== filterSpecies) return false;
      if (filterHealth && t.health_status !== filterHealth) return false;
      return true;
    });
  }, [trees, filterPlot, filterSpecies, filterHealth]);

  const handleUpdate = async (id, updatedRow) => {
    // Recalculate DBH = GBH / PI
    if (updatedRow.gbh_cm) {
      updatedRow.dbh_cm = Number((Number(updatedRow.gbh_cm) / Math.PI).toFixed(2));
    }

    const list = samplePlots.length > 0 ? samplePlots : INITIAL_SAMPLE_PLOTS;
    const matchedPlot = list.find((p) => p.plot_code === updatedRow.plot_code || p.id === updatedRow.plot_code);
    const normalized = normalizeTree({
      ...updatedRow,
      sample_plot_id: matchedPlot?.id || updatedRow.sample_plot_id,
      plot_code: matchedPlot?.plot_code || updatedRow.plot_code,
    }, list);

    try {
      await updateTreeMeasurement(id, {
        sample_plot_id: matchedPlot?.id || normalized.sample_plot_id,
        tree_number: Number(normalized.tree_number) || 1,
        species_code: normalized.species_code,
        species_local_name: normalized.species_local,
        species_botanical_name: normalized.species_botanical,
        gbh_cm: Number(normalized.gbh_cm) || 0,
        dbh_cm: Number(normalized.dbh_cm) || 0,
        height_m: Number(normalized.height_m) || 0,
        health_status: normalized.health_status,
      });
      setTrees((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Tree measurement updated');
    } catch (err) {
      setTrees((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Tree measurement updated locally');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTreeMeasurement(id);
      setTrees((prev) => prev.filter((item) => item.id !== id));
      toast.success('Measurement deleted');
    } catch (err) {
      setTrees((prev) => prev.filter((item) => item.id !== id));
      toast.success('Measurement deleted locally');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.tree_no || !formData.plot_code) {
      toast.error('Tree # and Sample Plot Code are required');
      return;
    }

    const list = samplePlots.length > 0 ? samplePlots : INITIAL_SAMPLE_PLOTS;
    const matchedPlot = list.find((p) => p.plot_code === formData.plot_code || p.id === formData.plot_code);
    if (!matchedPlot) {
      toast.error('Selected plot code must be from registered sample plots only.');
      return;
    }

    const gbh = Number(formData.gbh_cm) || 0;
    const dbh = Number((gbh / Math.PI).toFixed(2));
    const treeNum = parseInt(formData.tree_no.replace(/\D/g, '')) || trees.length + 1;

    const payload = {
      sample_plot_id: matchedPlot.id,
      tree_number: treeNum,
      species_code: formData.species_code || 'SAL',
      species_local_name: formData.species_local || 'Sal',
      species_botanical_name: formData.species_botanical || 'Shorea robusta',
      gbh_cm: gbh,
      dbh_cm: dbh,
      height_m: Number(formData.height_m) || 0,
      health_status: formData.health_status || 'Healthy',
      recorded_at: new Date().toISOString(),
    };

    try {
      const newRecord = await createTreeMeasurement(payload);
      const normalized = normalizeTree(
        newRecord || { id: Date.now(), ...payload, tree_no: formData.tree_no, plot_code: matchedPlot.plot_code },
        list
      );
      setTrees((prev) => [normalized, ...prev]);
      toast.success(`Tree measurement added to ${matchedPlot.plot_code}`);
    } catch (err) {
      const normalized = normalizeTree(
        { id: Date.now(), ...payload, tree_no: formData.tree_no, plot_code: matchedPlot.plot_code },
        list
      );
      setTrees((prev) => [normalized, ...prev]);
      toast.success('Tree measurement added locally');
    } finally {
      setIsAddModalOpen(false);
      setFormData({ ...EMPTY_TREE_FORM });
    }
  };

  const columns = [
    { header: 'Tree #', accessor: 'tree_no', editable: true, width: 'w-24' },
    {
      header: 'Plot Code',
      accessor: 'plot_code',
      editable: true,
      type: 'select',
      options: registeredPlotCodes,
      width: 'w-36',
      render: (v) => (
        <span className="font-mono font-semibold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-2xs">
          {v}
        </span>
      ),
    },
    {
      header: 'Species',
      accessor: 'species_local',
      editable: true,
      exportValue: (row) => row.species_botanical ? `${row.species_local} (${row.species_botanical})` : (row.species_local || ''),
      render: (_, row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.species_local}</span>
          <span className="text-slate-400 text-xs italic block">{row.species_botanical}</span>
        </div>
      ),
    },
    {
      header: 'GBH (cm)',
      accessor: 'gbh_cm',
      editable: true,
      type: 'number',
      step: '0.1',
      render: (v) => `${v} cm`,
    },
    {
      header: 'DBH (cm)',
      accessor: 'dbh_cm',
      editable: false,
      render: (v) => <span className="font-mono text-xs font-semibold">{v} cm</span>,
    },
    {
      header: 'Height (m)',
      accessor: 'height_m',
      editable: true,
      type: 'number',
      step: '0.1',
      render: (v) => `${v} m`,
    },
    {
      header: 'Health Status',
      accessor: 'health_status',
      editable: true,
      type: 'select',
      options: ['Healthy', 'Diseased', 'Broken/Felled', 'Dead'],
      render: (v) => <StatusBadge status={v} />,
    },
    { header: 'Recorded', accessor: 'recorded_at', editable: true, width: 'w-28' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Tree Biomass Measurements
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {trees.length} Stems Measured
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              GBH / DBH calculations (DBH = GBH/π), height calipers, and tree vitality audits linked to registered sample plots.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Trees}
          title="Total Stems Measured"
          value={trees.length}
          subtitle="Plot Inventory Stems"
          color="green"
        />
        <KPICard
          icon={CheckCircle2}
          title="Healthy Trees"
          value={`${trees.length > 0 ? Math.round((trees.filter((t) => t.health_status === 'Healthy').length / trees.length) * 100) : 0}%`}
          subtitle={`${trees.filter((t) => t.health_status === 'Healthy').length} of ${trees.length} healthy`}
          color="blue"
        />
        <KPICard
          icon={Ruler}
          title="Mean DBH"
          value={`${trees.length > 0 ? (trees.reduce((acc, t) => acc + (Number(t.dbh_cm) || 0), 0) / trees.length).toFixed(1) : '0'} cm`}
          subtitle="Diameter at Breast Height"
          color="purple"
        />
        <KPICard
          icon={Activity}
          title="Mean Height"
          value={`${trees.length > 0 ? (trees.reduce((acc, t) => acc + (Number(t.height_m) || 0), 0) / trees.length).toFixed(1) : '0'} m`}
          subtitle="Canopy Vertical Hypsometry"
          color="yellow"
        />
      </div>

      <DataTable
        title="Field Inventory Log"
        columns={columns}
        data={filteredTrees}
        isLoading={isLoading}
        onAdd={() => {
          setFormData({
            ...EMPTY_TREE_FORM,
            plot_code: filterPlot || '',
          });
          setIsAddModalOpen(true);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        filterComponent={
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={filterPlot}
              onChange={(e) => setFilterPlot(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="">All Sample Plots ({registeredPlotCodes.length})</option>
              {registeredPlotCodes.map((p) => (
                <option key={p} value={p} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {p}
                </option>
              ))}
            </select>

            <select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="">All Species</option>
              {speciesList.map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterHealth}
              onChange={(e) => setFilterHealth(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="">All Health Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Diseased">Diseased</option>
              <option value="Broken/Felled">Broken/Felled</option>
              <option value="Dead">Dead</option>
            </select>

            {(filterPlot || filterSpecies || filterHealth) && (
              <button
                onClick={() => {
                  setFilterPlot('');
                  setFilterSpecies('');
                  setFilterHealth('');
                }}
                className="text-forest-600 dark:text-forest-400 hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        }
      />

      {/* Add Tree Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Tree Measurement"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="leading-relaxed">
              <strong>Tree Allometric Measurement Log:</strong> Record field caliper inventory observations. Diameter at Breast Height (DBH) is auto-derived via DBH = GBH/π. All tree measurements are linked strictly to designated <strong>Sample Plots</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Tree Number / Tag *"
              name="tree_no"
              required
              value={formData.tree_no}
              onChange={(e) => setFormData({ ...formData, tree_no: e.target.value })}
              placeholder="e.g. TR-007"
            />
            <FormField
              label="Sample Plot Code *"
              name="plot_code"
              type="select"
              required
              value={formData.plot_code}
              onChange={(e) => setFormData({ ...formData, plot_code: e.target.value })}
              options={samplePlotOptions}
              placeholder="-- Select Registered Sample Plot --"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Local Species Name *"
              name="species_local"
              required
              value={formData.species_local}
              onChange={(e) => setFormData({ ...formData, species_local: e.target.value })}
              placeholder="e.g. Sal"
            />
            <FormField
              label="Botanical Name"
              name="species_botanical"
              value={formData.species_botanical}
              onChange={(e) => setFormData({ ...formData, species_botanical: e.target.value })}
              placeholder="e.g. Shorea robusta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Girth at Breast Height (GBH cm) *"
              name="gbh_cm"
              type="number"
              step="0.1"
              required
              value={formData.gbh_cm}
              onChange={(e) => setFormData({ ...formData, gbh_cm: e.target.value })}
              placeholder="e.g. 75.5"
            />
            <FormField
              label="Tree Total Height (m) *"
              name="height_m"
              type="number"
              step="0.1"
              required
              value={formData.height_m}
              onChange={(e) => setFormData({ ...formData, height_m: e.target.value })}
              placeholder="e.g. 15.2"
            />
          </div>

          {/* Dendrometry Allometric Telemetry Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Allometric Computations (DBH = GBH/π)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Plot: {formData.plot_code} | Tag: {formData.tree_no || 'Pending'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Calculated DBH</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formData.gbh_cm && Number(formData.gbh_cm) > 0
                    ? `${(Number(formData.gbh_cm) / Math.PI).toFixed(2)} cm`
                    : '—'}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Basal Area</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  {formData.gbh_cm && Number(formData.gbh_cm) > 0
                    ? `${((Math.PI * Math.pow(Number(formData.gbh_cm) / Math.PI / 200, 2))).toFixed(4)} m²`
                    : '—'}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Stem Volume</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {formData.gbh_cm && formData.height_m && Number(formData.gbh_cm) > 0 && Number(formData.height_m) > 0
                    ? `${((Math.PI * Math.pow(Number(formData.gbh_cm) / Math.PI / 200, 2)) * Number(formData.height_m) * 0.45).toFixed(3)} m³`
                    : '—'}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Est. Biomass</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formData.gbh_cm && formData.height_m && Number(formData.gbh_cm) > 0 && Number(formData.height_m) > 0
                    ? `~${Math.round((Math.PI * Math.pow(Number(formData.gbh_cm) / Math.PI / 200, 2)) * Number(formData.height_m) * 0.45 * 650)} kg`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Health Status"
              name="health_status"
              type="select"
              value={formData.health_status}
              placeholder="Select Health Status..."
              onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
              options={['Healthy', 'Diseased', 'Broken/Felled', 'Dead']}
            />
            <FormField
              label="Measurement Date"
              name="recorded_at"
              type="date"
              value={formData.recorded_at}
              onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Measurement</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
