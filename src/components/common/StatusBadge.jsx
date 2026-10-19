'use client';

import React from 'react';

/**
 * StatusBadge component handles:
 * - Alert statuses: Generated, Assigned, Under Inspection, Verified, Action Taken, Closed, False Alert
 * - Severity: Critical, High, Medium, Low
 * - Plantation statuses: Active, Under Review, Degraded, Mature
 * - Report statuses: Draft, Finalized, Audited, Certified
 * - Tree health: Healthy, Diseased, Broken/Felled, Dead
 */
export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = String(status).trim().toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  // Severity mappings
  if (normalized === 'critical') {
    colorClasses = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/80';
  } else if (normalized === 'high') {
    colorClasses = 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800/80';
  } else if (normalized === 'medium') {
    colorClasses = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80';
  } else if (normalized === 'low') {
    colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80';
  }
  // Alert status mapping
  else if (normalized === 'generated' || normalized === 'draft') {
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  } else if (normalized === 'assigned' || normalized === 'finalized') {
    colorClasses = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/80';
  } else if (normalized === 'under inspection' || normalized === 'under review' || normalized === 'audited') {
    colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-400 dark:border-yellow-800/80';
  } else if (normalized === 'verified' || normalized === 'active' || normalized === 'certified' || normalized === 'healthy') {
    colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80';
  } else if (normalized === 'action taken') {
    colorClasses = 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/80';
  } else if (normalized === 'closed') {
    colorClasses = 'bg-slate-700 text-slate-100 border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
  } else if (normalized === 'false alert' || normalized === 'dead' || normalized === 'degraded') {
    colorClasses = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/80';
  } else if (normalized === 'mature') {
    colorClasses = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/80';
  } else if (normalized === 'diseased') {
    colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-400 dark:border-yellow-800/80';
  } else if (normalized === 'broken/felled' || normalized === 'felled' || normalized === 'broken') {
    colorClasses = 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800/80';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
}
