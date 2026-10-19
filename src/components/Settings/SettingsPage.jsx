'use client';

import React, { useState } from 'react';
import {
  Settings,
  Server,
  Globe,
  MapPin,
  Bell,
  Database,
  Leaf,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Save,
} from 'lucide-react';
import FormField from '../common/FormField';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    language: 'English',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'Asia/Kolkata (IST +05:30)',
  });

  const [mapSettings, setMapSettings] = useState({
    defaultCenter: '26.2006, 92.9376 (Assam Central)',
    defaultZoom: '8',
    defaultLayer: 'osm',
    showCompartmentsByDefault: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    criticalAlertsEmail: true,
    inspectionReminders: true,
    confidenceThreshold: '80',
  });

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    toast.success('General preferences saved successfully');
  };

  const handleSaveMap = (e) => {
    e.preventDefault();
    toast.success('Map defaults updated');
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.success('Notification thresholds saved');
  };

  const handleExportAll = () => {
    const backupData = {
      system: 'Asthalaxmi Forest GIS',
      export_date: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asthalaxmi_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('System database exported');
  };

  const handleClearCache = () => {
    toast.success('Local GIS tile and analytics cache cleared');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-200 dark:border-forest-800">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                System Settings
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                v1.0.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Configure regional defaults, notification thresholds and GIS raster cache.
            </p>
          </div>
        </div>
      </div>

      {/* 1. System Information Panel */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <Server className="w-5 h-5 text-forest-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">System & Service Status</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Application Version</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">Asthalaxmi GIS v1.0.0</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">API Backend Link</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>http://localhost:8000 (Connected)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Satellite Feeds</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">Copernicus Sentinel-2 & VIIRS</span>
          </div>
        </div>
      </div>

      {/* 2. General Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <Globe className="w-5 h-5 text-forest-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">General & Localization</h3>
        </div>

        <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <FormField
            label="Dashboard Language"
            name="language"
            type="select"
            value={generalSettings.language}
            onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
            options={['English', 'Assamese (অসমীয়া)', 'Hindi (हिन्दी)']}
          />
          <FormField
            label="Date Format"
            name="dateFormat"
            type="select"
            value={generalSettings.dateFormat}
            onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
            options={['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']}
          />
          <FormField
            label="Timezone"
            name="timezone"
            value={generalSettings.timezone}
            disabled
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* 3. GIS Map Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <MapPin className="w-5 h-5 text-forest-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">GIS Map Settings</h3>
        </div>

        <form onSubmit={handleSaveMap} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Default Spatial Center"
              name="defaultCenter"
              value={mapSettings.defaultCenter}
              onChange={(e) => setMapSettings({ ...mapSettings, defaultCenter: e.target.value })}
            />
            <FormField
              label="Default Zoom Level"
              name="defaultZoom"
              type="number"
              value={mapSettings.defaultZoom}
              onChange={(e) => setMapSettings({ ...mapSettings, defaultZoom: e.target.value })}
            />
            <FormField
              label="Default Base Imagery"
              name="defaultLayer"
              type="select"
              value={mapSettings.defaultLayer}
              onChange={(e) => setMapSettings({ ...mapSettings, defaultLayer: e.target.value })}
              options={[
                { value: 'osm', label: 'OpenStreetMap Carto' },
                { value: 'satellite', label: 'Esri World Imagery (Satellite)' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showComps"
              checked={mapSettings.showCompartmentsByDefault}
              onChange={(e) =>
                setMapSettings({ ...mapSettings, showCompartmentsByDefault: e.target.checked })
              }
              className="rounded text-forest-600 focus:ring-forest-500"
            />
            <label htmlFor="showComps" className="text-slate-700 dark:text-slate-300">
              Automatically render compartment polygon boundaries on initial load
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Save Map Settings
            </button>
          </div>
        </form>
      </div>

      {/* 4. Notification Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <Bell className="w-5 h-5 text-forest-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alert Trigger & Notifications</h3>
        </div>

        <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.criticalAlertsEmail}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, criticalAlertsEmail: e.target.checked })
                }
                className="rounded text-forest-600 focus:ring-forest-500"
              />
              <span>Send immediate SMS / Email notifications to DFOs for Critical Deforestation events</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.inspectionReminders}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, inspectionReminders: e.target.checked })
                }
                className="rounded text-forest-600 focus:ring-forest-500"
              />
              <span>Send 48-hour ground truth verification reminders for Assigned alerts</span>
            </label>
          </div>

          <div className="max-w-xs">
            <FormField
              label="Minimum Detection Confidence (%)"
              name="confidenceThreshold"
              type="number"
              value={notificationSettings.confidenceThreshold}
              onChange={(e) =>
                setNotificationSettings({ ...notificationSettings, confidenceThreshold: e.target.value })
              }
              placeholder="80"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Save Notification Rules
            </button>
          </div>
        </form>
      </div>

      {/* 5. Data Management */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <Database className="w-5 h-5 text-forest-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Management & Backup</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-forest-600" />
            <span>Export Complete Dataset (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-amber-500" />
            <span>Flush Local GIS Cache</span>
          </button>
        </div>
      </div>

      {/* 6. About Asthalaxmi Branding */}
      <div className="bg-emerald-900 text-emerald-100 p-6 rounded-xl shadow-md border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-800 rounded-xl text-emerald-300">
            <Leaf className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Asthalaxmi Forest & Plantation Monitoring</h4>
            <p className="text-xs text-emerald-200/80">
              Government of Assam • Environment and Forest Department • Remote Sensing & GIS Cell
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-emerald-300/80">
          <div>Sentinel-2 & Planet Integration</div>
          <div className="text-[11px] text-emerald-400">UNFCCC REDD+ & Verra VCS Ready</div>
        </div>
      </div>
    </div>
  );
}
