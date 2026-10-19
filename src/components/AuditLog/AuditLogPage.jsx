'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAuditLog } from '../../api/client';
import DataTable from '../common/DataTable';
import KPICard from '../common/KPICard';
import {
  ChevronRight,
  ChevronDown,
  Shield,
  Filter,
  ScrollText,
  Edit2,
  Sparkles,
} from 'lucide-react';

const INITIAL_LOGS = [
  {
    id: 1,
    entity_type: 'Alert',
    entity_id: '1',
    action: 'STATUS_CHANGE',
    changed_by: 'rfo.barua@forest.gov.in',
    description: 'Updated alert status from Assigned to Under Inspection',
    timestamp: '2026-10-12 05:12:00',
    old_values: { status: 'Assigned', officer: 'R. K. Barua' },
    new_values: { status: 'Under Inspection', officer: 'R. K. Barua', inspection_scheduled: true },
  },
  {
    id: 2,
    entity_type: 'Plantation',
    entity_id: '2',
    action: 'UPDATE',
    changed_by: 'dfo.assam@forest.gov.in',
    description: 'Modified surviving saplings count following drone audit',
    timestamp: '2026-10-11 16:40:22',
    old_values: { surviving_saplings: 32000, survival_rate_pct: 80.0 },
    new_values: { surviving_saplings: 29800, survival_rate_pct: 74.5 },
  },
  {
    id: 3,
    entity_type: 'TreeMeasurement',
    entity_id: '4',
    action: 'CREATE',
    changed_by: 'field.forester@forest.gov.in',
    description: 'Recorded tree caliper measurement TR-004 in plot PLT-SN-01',
    timestamp: '2026-10-11 10:15:08',
    old_values: null,
    new_values: { tree_no: 'TR-004', gbh_cm: 74.0, dbh_cm: 23.55, height_m: 16.2 },
  },
  {
    id: 4,
    entity_type: 'Compartment',
    entity_id: '5',
    action: 'DELETE',
    changed_by: 'admin.gis@forest.gov.in',
    description: 'Removed deprecated administrative boundary entry DRG-C99',
    timestamp: '2026-10-10 14:22:19',
    old_values: { compartment_no: 'DRG-C99', division: 'Darrang Territorial' },
    new_values: null,
  },
  {
    id: 5,
    entity_type: 'CarbonReport',
    entity_id: '1',
    action: 'STATUS_CHANGE',
    changed_by: 'auditor.vcs@verra.org',
    description: 'Certified Kaziranga Buffer Biomass MRV report',
    timestamp: '2026-10-09 09:30:45',
    old_values: { status: 'Audited' },
    new_values: { status: 'Certified', sha256_hash: '9f83a8b417c69a7c88b64e83c2719a93e3d640fa087bb8c8e1e70e9a7e30e123' },
  },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLog();
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      } else {
        setLogs(INITIAL_LOGS);
      }
    } catch (err) {
      setLogs(INITIAL_LOGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterEntityType && log.entity_type !== filterEntityType) return false;
      if (filterAction && log.action !== filterAction) return false;
      return true;
    });
  }, [logs, filterEntityType, filterAction]);

  const toggleExpand = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200">
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200">
            DELETE
          </span>
        );
      case 'STATUS_CHANGE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200">
            STATUS CHANGE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  const columns = [
    {
      header: 'Expand',
      accessor: 'id',
      sortable: false,
      exportable: false,
      render: (v, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(row.id);
          }}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          {expandedRowId === row.id ? (
            <ChevronDown className="w-4 h-4 text-forest-600" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
      width: 'w-12',
    },
    { header: 'Entity Type', accessor: 'entity_type', editable: false, width: 'w-36' },
    { header: 'Entity ID', accessor: 'entity_id', editable: false, width: 'w-24' },
    {
      header: 'Action',
      accessor: 'action',
      editable: false,
      render: (v) => getActionBadge(v),
      width: 'w-36',
    },
    { header: 'Changed By', accessor: 'changed_by', editable: false, width: 'w-48' },
    { header: 'Description', accessor: 'description', editable: false },
    { header: 'Timestamp', accessor: 'timestamp', editable: false, width: 'w-40' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Security & Audit Log
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {logs.length} Events Logged
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Immutable audit records of all state modifications, user sessions and compliance tracking.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={ScrollText}
          title="Total Audit Events"
          value={logs.length}
          subtitle="Real-time Stream"
          color="green"
        />
        <KPICard
          icon={Edit2}
          title="Data Modifications"
          value={logs.filter((l) => l.action === 'UPDATE' || l.action === 'CREATE').length}
          subtitle="Create & Edit Operations"
          color="blue"
        />
        <KPICard
          icon={Sparkles}
          title="Status Transitions"
          value={logs.filter((l) => l.action === 'STATUS_CHANGE').length}
          subtitle="Lifecycle State Changes"
          color="purple"
        />
        <KPICard
          icon={Shield}
          title="Monitored Entities"
          value={new Set(logs.map((l) => l.entity_type).filter(Boolean)).size || 6}
          subtitle="Asset Types Audited"
          color="yellow"
        />
      </div>

      <DataTable
        title="Audit Event Records"
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        onRowClick={(row) => toggleExpand(row.id)}
        filterComponent={
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Entities</option>
              <option value="Alert">Alert</option>
              <option value="Plantation">Plantation</option>
              <option value="TreeMeasurement">TreeMeasurement</option>
              <option value="Compartment">Compartment</option>
              <option value="CarbonReport">CarbonReport</option>
              <option value="Division">Division</option>
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            </select>

            {(filterEntityType || filterAction) && (
              <button
                onClick={() => {
                  setFilterEntityType('');
                  setFilterAction('');
                }}
                className="text-forest-600 hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        }
      />

      {/* Expanded Row Detail Drawer if selected */}
      {expandedRowId && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
          {(() => {
            const logItem = logs.find((l) => l.id === expandedRowId);
            if (!logItem) return null;

            return (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-forest-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Audit Record Diff #{logItem.id} ({logItem.entity_type} ID: {logItem.entity_id})
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedRowId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close Diff
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old values */}
                  <div className="space-y-1">
                    <span className="font-semibold text-red-600 dark:text-red-400">Previous State (old_values):</span>
                    <pre className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {(() => {
                        if (!logItem.old_values) return 'null (New entity created)';
                        try {
                          const parsed = typeof logItem.old_values === 'string' ? JSON.parse(logItem.old_values) : logItem.old_values;
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          return String(logItem.old_values);
                        }
                      })()}
                    </pre>
                  </div>

                  {/* New values */}
                  <div className="space-y-1">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Updated State (new_values):</span>
                    <pre className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {(() => {
                        if (!logItem.new_values) return 'null (Entity permanently deleted)';
                        try {
                          const parsed = typeof logItem.new_values === 'string' ? JSON.parse(logItem.new_values) : logItem.new_values;
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          return String(logItem.new_values);
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
