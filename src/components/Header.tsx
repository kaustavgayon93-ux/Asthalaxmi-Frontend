"use client";

import React from "react";
import { useGeoCrop } from "@/context/GeoCropContext";
import { Satellite, Smartphone, Sprout, FileText, Download, RotateCcw } from "lucide-react";

export function Header() {
  const {
    districts,
    crops,
    selectedDistrictId,
    selectedCropId,
    setSelectedDistrictId,
    setSelectedCropId,
    activeView,
    setActiveView,
    resetToDefaults,
  } = useGeoCrop();

  const handlePrintBulletin = () => {
    window.print();
  };

  const handleExportJson = () => {
    const raw = localStorage.getItem("geocrop_assam_nextjs_v1");
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geocrop_assam_backup_${Date.now()}.json`;
    a.click();
  };

  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-lg border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700/80 border border-blue-500/50 flex items-center justify-center text-xl shadow-inner">
              🛰️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest text-blue-300 uppercase">
                  Government of Assam · ASSAC
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono">
                  NESFIC-D-12
                </span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight">
                GeoCrop-NE <span className="font-normal text-blue-200 text-sm">| Agricultural Intelligence Platform</span>
              </h1>
            </div>
          </div>

          {/* Mode Switcher Nav */}
          <nav className="flex items-center gap-1 bg-blue-950/70 p-1 rounded-xl border border-blue-800/80">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeView === "dashboard"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Satellite className="w-3.5 h-3.5" /> Web-GIS Dashboard
            </button>
            <button
              onClick={() => setActiveView("mobile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeView === "mobile"
                  ? "bg-white text-blue-900 shadow-sm font-bold"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Field Collector App
            </button>
            <button
              onClick={() => setActiveView("cropsDirectory")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeView === "cropsDirectory"
                  ? "bg-white text-blue-900 shadow-sm font-bold"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Sprout className="w-3.5 h-3.5" /> Assam Crops Directory
            </button>
          </nav>

          {/* Global Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBulletin}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> Official Bulletin
            </button>
            <button
              onClick={handleExportJson}
              title="Backup JSON Data"
              className="p-1.5 bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs rounded-lg border border-blue-700 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm("Reset all Assam crops and district estimates to official defaults?")) {
                  resetToDefaults();
                }
              }}
              title="Reset Baseline"
              className="p-1.5 bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs rounded-lg border border-blue-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 pt-3 border-t border-blue-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-300 font-medium">📍 Focus District:</span>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="bg-blue-900/90 text-white rounded-md px-2 py-1 border border-blue-700 font-medium focus:ring-1 focus:ring-blue-400"
              >
                <option value="all">Entire State of Assam (35 Districts)</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.assameseName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-blue-300 font-medium">🌾 Focus Crop:</span>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="bg-blue-900/90 text-white rounded-md px-2 py-1 border border-blue-700 font-medium focus:ring-1 focus:ring-blue-400"
              >
                <option value="all">All Crops Aggregate</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.assameseName}) · {c.category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Sentinel-1 SAR Radar: <strong>Ascending Track #121</strong> (Clouds: 82% Penetrated)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
