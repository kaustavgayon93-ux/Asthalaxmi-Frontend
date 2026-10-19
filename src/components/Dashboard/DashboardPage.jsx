'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trees,
  Sprout,
  AlertTriangle,
  Leaf,
  Building2,
  Grid3X3,
  Target,
  Ruler,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchDashboardAnalytics } from '../../api/client';
import KPICard from '../common/KPICard';
import StatusBadge from '../common/StatusBadge';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#10b981',
};

const SCHEME_COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

/**
 * Transform the flat backend response into chart-friendly arrays
 */
function transformData(raw) {
  // active_alerts is a dict like {"Critical": 2, "High": 5}
  const alertsBySeverity = Object.entries(raw.active_alerts || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // alerts_by_type is a dict like {"Canopy Loss": 3}
  const alertsByType = Object.entries(raw.alerts_by_type || {}).map(([type, count]) => ({
    type,
    count,
  }));

  // plantations_by_scheme is a dict
  const plantationsByScheme = Object.entries(raw.plantations_by_scheme || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // plantations_by_year is a dict like {"2022": 5}
  const plantationsByYear = Object.entries(raw.plantations_by_year || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  // species_distribution is a dict
  const speciesDistribution = Object.entries(raw.species_distribution || {}).map(([species, trees]) => ({
    species,
    trees,
  }));

  // biomass_by_division is a dict
  const biomassByDivision = Object.entries(raw.biomass_by_division || {}).map(([division, biomass]) => ({
    division,
    biomass: Math.round(biomass),
  }));

  // Count open alerts
  const openAlertCount = alertsBySeverity.reduce((sum, item) => sum + item.value, 0);

  // recent_alerts - add a location field from compartment info if missing
  const recentAlerts = (raw.recent_alerts || []).map((a) => ({
    ...a,
    location: a.description?.substring(0, 40) || `Lat ${a.centroid_lat}, Lng ${a.centroid_lng}`,
  }));

  // recent_inspections
  const recentInspections = (raw.recent_inspections || []).map((insp) => ({
    ...insp,
    officer: insp.officer_id || 'Field Officer',
    date: insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString() : '',
  }));

  return {
    total_forest_area_ha: raw.total_forest_area_ha || 0,
    total_plantations: raw.total_plantations || 0,
    open_alerts: openAlertCount,
    total_carbon_stock_tco2e: raw.total_carbon_stock_tco2e || 0,
    total_divisions: raw.total_divisions || 0,
    total_compartments: raw.total_compartments || 0,
    total_sample_plots: raw.total_sample_plots || 0,
    total_tree_measurements: raw.total_tree_measurements || 0,
    avg_survival_rate: raw.avg_survival_rate || 0,
    alerts_by_severity: alertsBySeverity,
    alerts_by_type: alertsByType,
    plantations_by_scheme: plantationsByScheme,
    plantations_by_year: plantationsByYear,
    species_distribution: speciesDistribution,
    biomass_by_division: biomassByDivision,
    recent_alerts: recentAlerts,
    recent_inspections: recentInspections,
  };
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardAnalytics();
      setData(transformData(result));
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      setError(err.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading Assam Forest analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-sm font-medium text-slate-500">Failed to load dashboard: {error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                State Forest Command Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Live Operations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Real-time satellite detection, plantation survival rates, and MRV carbon stock indicators.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            loadData();
            toast.success('Analytics refreshed');
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>


      {/* NESFIC-D-15 Indicative Technology Directions Banner */}
      <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[11px]">
            NESFIC-D-15 Technology Directions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[10px]">
              🛰️ Optical / C-Band SAR Remote Sensing
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px]">
              🛸 AI/ML UAV Surveys (2–5cm GSD)
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold text-[10px]">
              🌲 16 Assam Divisions (ISFR 2023)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold text-[10px]">
              📊 IPCC 2006 AFOLU Tier-2 Carbon
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">14 Public GoI/Assam Portals Calibrated</span>
          <Link href="/resources" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
            <span>View Registry</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Row 1: 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Trees}
          title="Total Forest Area"
          value={`${Number(data.total_forest_area_ha).toLocaleString()} ha`}
          subtitle={`${data.avg_survival_rate}% avg survival rate`}
          color="green"
        />
        <KPICard
          icon={Sprout}
          title="Active Plantations"
          value={data.total_plantations}
          subtitle={`Across ${data.total_divisions} divisions`}
          color="blue"
        />
        <KPICard
          icon={AlertTriangle}
          title="Open Alerts"
          value={data.open_alerts}
          subtitle={`${data.alerts_by_severity.find(a => a.name === 'Critical')?.value || 0} critical events`}
          color="red"
        />
        <KPICard
          icon={Leaf}
          title="Carbon Stock"
          value={`${Number(data.total_carbon_stock_tco2e).toLocaleString()} tCO₂e`}
          subtitle="VCS-certified aboveground biomass"
          color="purple"
        />
      </div>

      {/* Row 2: 4 Secondary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Building2}
          title="Forest Divisions"
          value={data.total_divisions}
          subtitle="Kamrup, Sonitpur, Golaghat..."
          color="green"
        />
        <KPICard
          icon={Grid3X3}
          title="Compartments"
          value={data.total_compartments}
          subtitle="Geo-delimited management units"
          color="yellow"
        />
        <KPICard
          icon={Target}
          title="Sample Plots"
          value={data.total_sample_plots}
          subtitle="Quarterly biomass survey points"
          color="blue"
        />
        <KPICard
          icon={Ruler}
          title="Tree Measurements"
          value={Number(data.total_tree_measurements).toLocaleString()}
          subtitle="Individual trees monitored"
          color="purple"
        />
      </div>

      {/* Row 3: Charts - Severity, Type, Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts by Severity Pie */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Alerts by Severity
          </h3>
          <p className="text-xs text-slate-500 mb-4">Active deforestation & degradation incidents</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.alerts_by_severity}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.alerts_by_severity.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#059669'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts by Type Bar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Incidents by Classification
          </h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown of threats reported via Earth Observation</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.alerts_by_type}>
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plantations by Scheme Pie */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Plantations by Scheme
          </h3>
          <p className="text-xs text-slate-500 mb-4">Funding & restoration program allotment</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.plantations_by_scheme}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.plantations_by_scheme.map((_, idx) => (
                    <Cell key={idx} fill={SCHEME_COLORS[idx % SCHEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Charts - Plantations by Year, Species Distribution, Biomass by Division */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plantations by Year */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Plantations Established Over Time
          </h3>
          <p className="text-xs text-slate-500 mb-4">Year-over-year afforestation site count</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.plantations_by_year}>
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Species Distribution Horizontal Bar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Top Indigenous Tree Species
          </h3>
          <p className="text-xs text-slate-500 mb-4">Count of tagged plantation species</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.species_distribution} margin={{ left: 20 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="species" stroke="#94a3b8" fontSize={10} width={90} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="trees" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biomass by Division Bar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Biomass by Division (tonnes)
          </h3>
          <p className="text-xs text-slate-500 mb-4">Aboveground biomass estimation per division</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.biomass_by_division}>
                <XAxis dataKey="division" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="biomass" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Alerts & Recent Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Recent Forest Disturbance Alerts
              </h3>
              <p className="text-xs text-slate-500">Last alerts detected by Sentinel-1 & Sentinel-2</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Area (ha)</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {data.recent_alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {alert.alert_type}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={alert.severity} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {alert.affected_area_ha} ha
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {(alert.confidence_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {alert.detected_at ? new Date(alert.detected_at).toLocaleDateString() : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Inspections (1/3 width) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Ground Truth Inspections
          </h3>
          <p className="text-xs text-slate-500 mb-4">Latest field officer verifications</p>

          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {data.recent_inspections.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No recent inspections</p>
            )}
            {data.recent_inspections.map((insp) => (
              <div
                key={insp.id}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/30 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{insp.officer}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {insp.date}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-500 dark:text-slate-400">Cause:</span> {insp.cause}
                </div>
                {insp.action_taken && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded flex items-start gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{insp.action_taken}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
