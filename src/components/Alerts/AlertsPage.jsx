'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  updateAlertStatus,
  assignAlert,
} from '../../api/client';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import StatusBadge from '../common/StatusBadge';
import KPICard from '../common/KPICard';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  UserPlus,
  Search,
  Check,
  ChevronDown,
  Eye,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_ALERTS = [
  { id: 1, alert_type: 'Deforestation', severity: 'Critical', location: 'Kaziranga Buffer Comp-12', affected_area_ha: 3.2, confidence: 0.94, status: 'Under Inspection', assigned_to: 'R. K. Barua (RFO)', detected_at: '2026-10-12 04:30', notes: 'Continuous canopy loss detected via Sentinel-2 diff.' },
  { id: 2, alert_type: 'Encroachment', severity: 'High', location: 'Kamrup East Beat-3', affected_area_ha: 1.1, confidence: 0.88, status: 'Assigned', assigned_to: 'P. Gogoi (Forester)', detected_at: '2026-10-11 18:20', notes: 'New makeshift structures reported near boundary.' },
  { id: 3, alert_type: 'Forest Fire', severity: 'Critical', location: 'Sonitpur West Range', affected_area_ha: 5.6, confidence: 0.96, status: 'Action Taken', assigned_to: 'D. Kalita (RFO)', detected_at: '2026-10-11 11:15', notes: 'Thermal anomaly confirmed by VIIRS instrument.' },
  { id: 4, alert_type: 'Illegal Felling', severity: 'Medium', location: 'Darrang Territorial Plot-4', affected_area_ha: 0.8, confidence: 0.82, status: 'Verified', assigned_to: 'M. Sarma (Beat Officer)', detected_at: '2026-10-10 14:05', notes: 'Fresh tractor tire tracks and log piles spotted.' },
  { id: 5, alert_type: 'Deforestation', severity: 'High', location: 'Nagaon Kaliabor Range', affected_area_ha: 2.0, confidence: 0.91, status: 'Generated', assigned_to: 'Unassigned', detected_at: '2026-10-09 22:40', notes: 'Awaiting triage by DFO control room.' },
  { id: 6, alert_type: 'Forest Fire', severity: 'Low', location: 'Kaziranga Kohora Beat', affected_area_ha: 0.2, confidence: 0.76, status: 'Closed', assigned_to: 'R. K. Barua (RFO)', detected_at: '2026-10-08 09:10', notes: 'Controlled grassland burn by park management.' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modals & detail view
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModalAlert, setDetailModalAlert] = useState(null);
  const [assignModalAlert, setAssignModalAlert] = useState(null);
  const [assigneeName, setAssigneeName] = useState('');

  const EMPTY_ALERT_FORM = {
    alert_type: '',
    severity: '',
    location: '',
    affected_area_ha: '',
    confidence: '',
    status: 'Generated',
    assigned_to: '',
    detected_at: '',
    notes: '',
  };

  const [formData, setFormData] = useState(EMPTY_ALERT_FORM);

  const normalizeAlert = (a) => ({
    ...a,
    confidence: a.confidence ?? (a.confidence_score ? Number(a.confidence_score).toFixed(2) : '0.90'),
    confidence_score: a.confidence_score ?? (Number(a.confidence) || 0.9),
    location: a.location || a.description || (a.centroid_lat ? `Lat ${a.centroid_lat}, Lng ${a.centroid_lng}` : 'Kaziranga Buffer'),
    assigned_to: a.assigned_to || 'Unassigned',
  });

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAlerts();
      if (Array.isArray(data) && data.length > 0) {
        setAlerts(data.map(normalizeAlert));
      } else {
        setAlerts(INITIAL_ALERTS.map(normalizeAlert));
      }
    } catch (err) {
      setAlerts(INITIAL_ALERTS.map(normalizeAlert));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterSeverity && a.severity !== filterSeverity) return false;
      if (filterType && a.alert_type !== filterType) return false;
      return true;
    });
  }, [alerts, filterStatus, filterSeverity, filterType]);

  // KPI Metrics
  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const underInspectionCount = alerts.filter((a) => a.status === 'Under Inspection').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Closed' || a.status === 'Action Taken').length;

  const handleUpdate = async (id, updatedRow) => {
    const normalized = normalizeAlert(updatedRow);
    try {
      await updateAlert(id, {
        alert_type: normalized.alert_type,
        severity: normalized.severity,
        affected_area_ha: Number(normalized.affected_area_ha) || 1.0,
        confidence_score: Number(normalized.confidence) || 0.9,
        status: normalized.status,
        description: normalized.location || normalized.description,
      });
      setAlerts((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Alert updated');
    } catch (err) {
      setAlerts((prev) => prev.map((item) => (item.id === id ? normalized : item)));
      toast.success('Alert updated locally');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((item) => item.id !== id));
      toast.success('Alert deleted');
    } catch (err) {
      setAlerts((prev) => prev.filter((item) => item.id !== id));
      toast.success('Alert deleted locally');
    }
  };

  const handleTransitionStatus = async (alertItem, newStatus) => {
    try {
      await updateAlertStatus(alertItem.id, newStatus);
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertItem.id ? { ...item, status: newStatus } : item))
      );
      toast.success(`Alert transitioned to "${newStatus}"`);
    } catch (err) {
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertItem.id ? { ...item, status: newStatus } : item))
      );
      toast.success(`Alert transitioned to "${newStatus}" locally`);
    }
  };

  const handleAssignConfirm = async () => {
    if (!assignModalAlert || !assigneeName.trim()) return;
    try {
      await assignAlert(assignModalAlert.id, { assigned_to: assigneeName, status: 'Assigned' });
      setAlerts((prev) =>
        prev.map((item) =>
          item.id === assignModalAlert.id ? { ...item, assigned_to: assigneeName, status: 'Assigned' } : item
        )
      );
      toast.success(`Assigned to ${assigneeName}`);
    } catch (err) {
      setAlerts((prev) =>
        prev.map((item) =>
          item.id === assignModalAlert.id ? { ...item, assigned_to: assigneeName, status: 'Assigned' } : item
        )
      );
      toast.success(`Assigned locally to ${assigneeName}`);
    } finally {
      setAssignModalAlert(null);
      setAssigneeName('');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.alert_type) {
      toast.error('Alert type is required');
      return;
    }
    if (!formData.severity) {
      toast.error('Severity level is required');
      return;
    }
    if (!formData.location) {
      toast.error('Location is required');
      return;
    }

    const payload = {
      ...formData,
      affected_area_ha: Number(formData.affected_area_ha) || 0,
      confidence: Number(formData.confidence) || 0.85,
      detected_at: formData.detected_at || new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    try {
      const newRecord = await createAlert(payload);
      setAlerts((prev) => [newRecord || { id: Date.now(), ...payload }, ...prev]);
      toast.success('Incident alert registered');
    } catch (err) {
      setAlerts((prev) => [{ id: Date.now(), ...payload }, ...prev]);
      toast.success('Incident alert registered locally');
    } finally {
      setIsAddModalOpen(false);
      setFormData({ ...EMPTY_ALERT_FORM });
    }
  };

  const columns = [
    {
      header: 'Alert Type',
      accessor: 'alert_type',
      editable: true,
      type: 'select',
      options: ['Deforestation', 'Encroachment', 'Forest Fire', 'Illegal Felling'],
      width: 'w-36',
    },
    {
      header: 'Severity',
      accessor: 'severity',
      editable: true,
      type: 'select',
      options: ['Critical', 'High', 'Medium', 'Low'],
      render: (v) => <StatusBadge status={v} />,
      width: 'w-28',
    },
    { header: 'Location', accessor: 'location', editable: true, width: 'w-56' },
    {
      header: 'Area (ha)',
      accessor: 'affected_area_ha',
      editable: true,
      type: 'number',
      step: '0.1',
      render: (v) => `${v} ha`,
      width: 'w-24',
    },
    {
      header: 'Confidence',
      accessor: 'confidence',
      editable: true,
      type: 'number',
      step: '0.01',
      render: (v) => `${Math.round(Number(v || 0) * 100)}%`,
      width: 'w-24',
    },
    {
      header: 'Status',
      accessor: 'status',
      editable: true,
      type: 'select',
      options: ['Generated', 'Assigned', 'Under Inspection', 'Verified', 'Action Taken', 'Closed', 'False Alert'],
      render: (v) => <StatusBadge status={v} />,
      width: 'w-36',
    },
    { header: 'Assigned To', accessor: 'assigned_to', editable: true, width: 'w-44' },
    { header: 'Detected At', accessor: 'detected_at', editable: true, width: 'w-36' },
    {
      header: 'Workflow',
      accessor: 'id',
      sortable: false,
      exportable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === 'Generated' && (
            <button
              onClick={() => {
                setAssignModalAlert(row);
                setAssigneeName('R. K. Barua (RFO)');
              }}
              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold border border-blue-200"
            >
              Assign
            </button>
          )}
          {row.status === 'Assigned' && (
            <button
              onClick={() => handleTransitionStatus(row, 'Under Inspection')}
              className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[11px] font-semibold border border-amber-200"
            >
              Start Inspection
            </button>
          )}
          {row.status === 'Under Inspection' && (
            <button
              onClick={() => handleTransitionStatus(row, 'Verified')}
              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold border border-emerald-200"
            >
              Verify
            </button>
          )}
          {row.status === 'Verified' && (
            <button
              onClick={() => handleTransitionStatus(row, 'Action Taken')}
              className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-semibold border border-purple-200"
            >
              Action Taken
            </button>
          )}
          {(row.status === 'Action Taken' || row.status === 'Verified') && (
            <button
              onClick={() => handleTransitionStatus(row, 'Closed')}
              className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-semibold border border-slate-300"
            >
              Close
            </button>
          )}
          <button
            onClick={() => setDetailModalAlert(row)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Forest Disturbance Alerts
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {totalCount} Active Events
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Real-time alerts generated from satellite observation and incident lifecycle dispatch.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={AlertTriangle}
          title="Total Incidents"
          value={totalCount}
          subtitle="Active Satellite Triggers"
          color="blue"
        />
        <KPICard
          icon={Flame}
          title="Critical Alerts"
          value={criticalCount}
          subtitle="High Risk / Fire / Felling"
          color="red"
        />
        <KPICard
          icon={Clock}
          title="Under Inspection"
          value={underInspectionCount}
          subtitle="Ground Field Verification"
          color="yellow"
        />
        <KPICard
          icon={CheckCircle2}
          title="Resolved / Closed"
          value={resolvedCount}
          subtitle="Mitigated & Documented"
          color="green"
        />
      </div>

      <DataTable
        title="Active Incident Stream"
        columns={columns}
        data={filteredAlerts}
        isLoading={isLoading}
        onAdd={() => {
          setFormData({ ...EMPTY_ALERT_FORM });
          setIsAddModalOpen(true);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        filterComponent={
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Types</option>
              <option value="Deforestation">Deforestation</option>
              <option value="Encroachment">Encroachment</option>
              <option value="Forest Fire">Forest Fire</option>
              <option value="Illegal Felling">Illegal Felling</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="Generated">Generated</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Verified">Verified</option>
              <option value="Action Taken">Action Taken</option>
              <option value="Closed">Closed</option>
            </select>

            {(filterSeverity || filterType || filterStatus) && (
              <button
                onClick={() => {
                  setFilterSeverity('');
                  setFilterType('');
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

      {/* Add Alert Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Report New Incident / Alert"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="leading-relaxed">
              <strong>Incident Alert Registration:</strong> Log new satellite anomaly alerts or field patrol sightings. Registered alerts enter the verification and dispatch triage workflow immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Alert Type *"
              name="alert_type"
              type="select"
              value={formData.alert_type}
              onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
              options={['Deforestation', 'Encroachment', 'Forest Fire', 'Illegal Felling']}
              placeholder="Select Alert Type..."
            />
            <FormField
              label="Severity Level *"
              name="severity"
              type="select"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              options={['Critical', 'High', 'Medium', 'Low']}
              placeholder="Select Severity Level..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Location / Compartment *"
              name="location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Kaziranga Buffer Comp-12"
            />
            <FormField
              label="Assigned Officer"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="e.g. R. K. Barua (RFO) or Unassigned"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Affected Area (ha) *"
              name="affected_area_ha"
              type="number"
              step="0.1"
              required
              value={formData.affected_area_ha}
              onChange={(e) => setFormData({ ...formData, affected_area_ha: e.target.value })}
              placeholder="e.g. 2.5"
            />
            <FormField
              label="Detection Confidence (0.00 – 1.00) *"
              name="confidence"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
              placeholder="e.g. 0.90"
            />
          </div>

          {/* Incident Telemetry Summary Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Incident Triage & Satellite Telemetry</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Detected: {formData.detected_at || 'Pending / Now'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Alert Classification</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.alert_type || '—'}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Severity</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formData.severity || '—'}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Footprint Area</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formData.affected_area_ha ? `${formData.affected_area_ha} ha` : '—'}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] text-slate-400">Confidence</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formData.confidence ? `${Math.round(Number(formData.confidence) * 100)}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          <FormField
            label="Field Investigation Notes"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Describe visual indications, satellite imagery scene ID, or ground guard notes..."
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
              <span>Register Incident Alert</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={!!assignModalAlert}
        onClose={() => setAssignModalAlert(null)}
        title="Assign Alert Incident"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Assign incident <strong>#{assignModalAlert?.id} ({assignModalAlert?.location})</strong> to a designated Range Forest Officer.
          </p>
          <FormField
            label="Assignee Officer"
            name="assignee"
            type="select"
            value={assigneeName}
            onChange={(e) => setAssigneeName(e.target.value)}
            options={[
              'R. K. Barua (RFO Kaziranga)',
              'P. Gogoi (DFO Kamrup East)',
              'D. Kalita (RFO Sonitpur)',
              'M. Sarma (Beat Officer Darrang)',
              'T. Das (Forester Nagaon)',
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setAssignModalAlert(null)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignConfirm}
              className="px-3 py-1.5 text-xs text-white bg-forest-600 rounded-lg hover:bg-forest-700 font-medium"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailModalAlert && (
        <Modal
          isOpen={!!detailModalAlert}
          onClose={() => setDetailModalAlert(null)}
          title={`Incident Detail #${detailModalAlert.id} - ${detailModalAlert.alert_type}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-750 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Severity</span>
                <div className="mt-1"><StatusBadge status={detailModalAlert.severity} /></div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Workflow Status</span>
                <div className="mt-1"><StatusBadge status={detailModalAlert.status} /></div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{detailModalAlert.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Affected Area</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{detailModalAlert.affected_area_ha} ha</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Assigned Officer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{detailModalAlert.assigned_to}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Detection Timestamp</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{detailModalAlert.detected_at}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Field Notes / Satellite Context:</span>
              <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-750 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {detailModalAlert.notes || 'No extra notes recorded.'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
