'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Check,
  X,
  Edit2,
  AlertCircle
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  title = '',
  isLoading = false,
  onAdd = null,
  onUpdate = null,
  onEdit = null,
  onDelete = null,
  onRowClick = null,
  itemsPerPage = 10,
  emptyMessage = 'No records found',
  filterComponent = null,
  customActions = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState(null); // { rowId, columnKey, value }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting
  const handleSort = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === columnKey && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key: columnKey, direction });
  };

  // Filter & Search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lower = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.accessor];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [data, searchTerm, columns]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Inline editing handlers
  const handleStartEdit = (row, col) => {
    if (!col.editable || !onUpdate) return;
    setEditingCell({
      rowId: row[keyField],
      columnKey: col.accessor,
      value: row[col.accessor] ?? '',
      originalRow: row,
    });
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCell || !onUpdate) return;
    try {
      const updatedRow = {
        ...editingCell.originalRow,
        [editingCell.columnKey]: editingCell.value,
      };
      await onUpdate(editingCell.rowId, updatedRow);
      setEditingCell(null);
    } catch (err) {
      console.error('Failed to save inline edit:', err);
    }
  };

  const handleKeyDownEdit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // CSV Export using Blob + UTF-8 BOM (prevents #, %, length limit, and action column truncation bugs)
  const exportToCSV = () => {
    if (!data.length) return;

    // Filter out UI-only action, workflow, button, or non-data columns
    const exportColumns = columns.filter((c) => {
      if (c.exportable === false) return false;
      if (!c.accessor) return false;
      const h = (c.header || '').toLowerCase().trim();
      const forbiddenHeaders = [
        'actions',
        'action',
        'workflow',
        'audit dossier',
        'expand',
        'ai actions',
      ];
      if (forbiddenHeaders.includes(h)) return false;
      return true;
    });

    if (exportColumns.length === 0) return;

    const headers = exportColumns
      .map((c) => `"${(c.header || '').replace(/"/g, '""')}"`)
      .join(',');

    const rows = sortedData.map((row) =>
      exportColumns
        .map((col) => {
          let val;
          if (typeof col.exportValue === 'function') {
            val = col.exportValue(row);
          } else {
            val = row[col.accessor];
            // Smart fallbacks for common property aliases if undefined or null
            if (val === undefined || val === null || val === '') {
              const fallbacks = {
                compartment_no: row.compartment_number || row.comp_no,
                compartment_number: row.compartment_no || row.comp_no,
                division: row.division_name || row.division_code,
                division_name: row.division || row.division_code,
                range: row.range_name,
                range_name: row.range,
                beat: row.beat_name,
                beat_name: row.beat,
                area_ha: row.total_area_ha ?? row.covered_area_ha,
                total_area_ha: row.area_ha ?? row.covered_area_ha,
                covered_area_ha: row.area_ha ?? row.total_area_ha,
                canopy_density_pct: row.canopy_density_percent,
                canopy_density_percent: row.canopy_density_pct,
                forest_cover_pct: row.forest_cover_percent,
                forest_cover_percent: row.forest_cover_pct,
                lat: row.centroid_lat ?? row.center_lat,
                centroid_lat: row.lat ?? row.center_lat,
                center_lat: row.lat ?? row.centroid_lat,
                lng: row.centroid_lng ?? row.center_lng,
                centroid_lng: row.lng ?? row.center_lng,
                center_lng: row.lng ?? row.centroid_lng,
                survival_rate_pct: row.survival_rate_percent,
                survival_rate_percent: row.survival_rate_pct,
                surviving_saplings: row.surviving_count,
                surviving_count: row.surviving_saplings,
                initial_saplings: row.initial_count,
                tree_no: row.tree_number,
                tree_number: row.tree_no,
                species_local: row.species_local_name || row.species,
                species_local_name: row.species_local || row.species,
                species_botanical: row.species_botanical_name,
                species_botanical_name: row.species_botanical,
                period: row.reporting_period || (row.reporting_period_start ? `${row.reporting_period_start.slice(0, 10)} to ${row.reporting_period_end?.slice(0, 10)}` : ''),
                satellite_sync_status: row.satellite_sync_status || 'Active (Live S2/SAR Telemetry)',
                confidence: row.confidence_score !== undefined ? `${Math.round(Number(row.confidence_score || 0) * 100)}%` : undefined,
                confidence_score: row.confidence,
                officer: row.officer_id,
                officer_id: row.officer,
              };
              if (fallbacks[col.accessor] !== undefined && fallbacks[col.accessor] !== null && fallbacks[col.accessor] !== '') {
                val = fallbacks[col.accessor];
              }
            }
          }

          // Format booleans
          if (typeof val === 'boolean') {
            if (col.accessor === 'synced') {
              val = val ? 'Synced' : 'Pending';
            } else {
              val = val ? 'Yes' : 'No';
            }
          } else if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          } else if (val === null || val === undefined) {
            val = '';
          }

          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    // Prepend UTF-8 BOM (\uFEFF) so Excel and spreadsheet applications correctly read UTF-8 characters without corruption
    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (title || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    link.setAttribute('download', `${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Delete flow
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget[keyField]);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {title && (
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h2>
            )}
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full">
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {customActions}

            {/* Add Button */}
            {onAdd && (
              <button
                onClick={onAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Filter Slot */}
        {filterComponent && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center flex-wrap gap-2">
            {filterComponent}
          </div>
        )}
      </div>

      {/* Editing Toolbar Banner if editing */}
      {editingCell && (
        <div className="bg-forest-50 dark:bg-forest-950/40 border-b border-forest-200 dark:border-forest-800/60 px-4 py-2 flex items-center justify-between text-xs text-forest-800 dark:text-forest-200">
          <div className="flex items-center gap-2">
            <Edit2 className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
            <span>
              Editing <strong>{editingCell.columnKey}</strong>. Press <strong>Enter</strong> to save, <strong>Esc</strong> to cancel.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-forest-600 text-white rounded font-medium hover:bg-forest-700"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium hover:bg-slate-300"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.accessor;
                return (
                  <th
                    key={col.accessor || col.header}
                    onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                    className={`py-3 px-4 transition-colors ${
                      col.sortable !== false && col.accessor ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 select-none' : ''
                    } ${col.width || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable !== false && col.accessor && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-forest-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-forest-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                      {col.editable && (
                        <span className="text-[10px] text-slate-400 font-normal">✎</span>
                      )}
                    </div>
                  </th>
                );
              })}
              {(onEdit || onDelete) && <th className="py-3 px-4 text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onDelete ? 1 : 0)}
                  className="py-12 px-4 text-center text-slate-400 dark:text-slate-500"
                >
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowKey = row[keyField] ?? index;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/60'
                    } hover:bg-emerald-50/40 dark:hover:bg-slate-750 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col) => {
                      const isCellEditing =
                        editingCell &&
                        editingCell.rowId === row[keyField] &&
                        editingCell.columnKey === col.accessor;

                      const rawValue = row[col.accessor];

                      return (
                        <td
                          key={col.accessor || col.header}
                          onClick={(e) => {
                            if (col.editable) {
                              e.stopPropagation();
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(row, col);
                          }}
                          className={`py-3 px-4 text-slate-700 dark:text-slate-200 ${
                            col.editable ? 'hover:bg-amber-50/60 dark:hover:bg-amber-950/20 cursor-text' : ''
                          }`}
                        >
                          {isCellEditing ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {col.type === 'select' ? (
                                <select
                                  autoFocus
                                  value={editingCell.value}
                                  onChange={(e) =>
                                    setEditingCell((prev) => ({ ...prev, value: e.target.value }))
                                  }
                                  onKeyDown={handleKeyDownEdit}
                                  className="w-full min-w-[140px] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-400 rounded-lg px-2.5 py-1.5 shadow-md focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                                >
                                  {(col.options || []).map((opt) => {
                                    const val = typeof opt === 'object' ? opt.value : opt;
                                    const lbl = typeof opt === 'object' ? opt.label : opt;
                                    return (
                                      <option key={val} value={val} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                                        {lbl}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <input
                                  autoFocus
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  step={col.step || (col.type === 'number' ? 'any' : undefined)}
                                  value={editingCell.value}
                                  onChange={(e) =>
                                    setEditingCell((prev) => ({
                                      ...prev,
                                      value: col.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value,
                                    }))
                                  }
                                  onKeyDown={handleKeyDownEdit}
                                  className="w-full min-w-[130px] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-400 rounded-lg px-2.5 py-1.5 shadow-md focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                                />
                              )}
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors shrink-0"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors shrink-0"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : col.render ? (
                            col.render(rawValue, row)
                          ) : (
                            <span className="truncate block max-w-xs">{rawValue !== null && rawValue !== undefined ? String(rawValue) : '—'}</span>
                          )}
                        </td>
                      );
                    })}

                    {(onEdit || onDelete) && (
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {Math.min(currentPage * itemsPerPage, sortedData.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {sortedData.length}
          </span>{' '}
          results
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-200">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Record"
        message={`Are you sure you want to delete this record? This action cannot be undone.`}
      />
    </div>
  );
}
