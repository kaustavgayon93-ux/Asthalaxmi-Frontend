"use client";

import React from "react";
import { useGeoCrop } from "@/context/GeoCropContext";

export function KpiCards() {
  const { aggregates, districts, selectedDistrictId, crops, selectedCropId, leadTimeDays, setLeadTimeDays } = useGeoCrop();

  const selDist = districts.find((d) => d.id === selectedDistrictId);
  const selCrop = crops.find((c) => c.id === selectedCropId);

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
            Active Spatio-Temporal Scope
          </span>
          <h2 className="text-base font-bold text-slate-900">
            {selDist ? selDist.name : "Entire State of Assam (35 Districts)"} · {selCrop ? selCrop.name : "All Crops"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Advance Forecast Horizon:</span>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setLeadTimeDays(45)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                leadTimeDays === 45 ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              T-45 Days
            </button>
            <button
              onClick={() => setLeadTimeDays(30)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                leadTimeDays === 30 ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              T-30 Days
            </button>
            <button
              onClick={() => setLeadTimeDays(15)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                leadTimeDays === 15 ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              T-15 Days
            </button>
          </div>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">
            {aggregates.leadTimeLabel} (T-{leadTimeDays} Days)
          </span>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Cropped Area</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {aggregates.totalAreaHa.toLocaleString()} ha
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">✓ Fused Sentinel-1 & 2 Mask</div>
          <div className="absolute -right-2 -bottom-2 text-slate-100 text-5xl font-extrabold pointer-events-none select-none">
            🌾
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Predicted Avg Yield</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {aggregates.avgYield} t/ha
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Hybrid Biophysical + ML</div>
          <div className="absolute -right-2 -bottom-2 text-slate-100 text-5xl font-extrabold pointer-events-none select-none">
            📈
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Total Projected Production</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">
            {aggregates.totalProductionTonnes.toLocaleString()} MT
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            <span className="text-xs text-blue-700 font-semibold">90% CI:</span> [
            {aggregates.ci90LowerTonnes.toLocaleString()} – {aggregates.ci90UpperTonnes.toLocaleString()} MT]{" "}
            <span className="text-[10px] text-slate-500">(±{aggregates.avgUncertaintyPct}%)</span>
          </div>
          <div className="absolute -right-2 -bottom-2 text-blue-100/50 text-5xl font-extrabold pointer-events-none select-none">
            🎯
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-red-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-800">Flood Inundation Impact</div>
          <div className="text-base font-bold text-red-600 mt-1">
            {aggregates.totalFloodDamagedHa.toLocaleString()} ha
          </div>
          <div className="text-[11px] text-slate-500">
            Est. Loss: <strong>{aggregates.lostProductionTonnes.toLocaleString()} MT</strong>
          </div>
          <div className="absolute -right-2 -bottom-2 text-red-100/60 text-5xl font-extrabold pointer-events-none select-none">
            🌊
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-purple-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900">CCE Experiments Progress</div>
          <div className="mt-2">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>{aggregates.totalCceCompleted} / {aggregates.totalCceTarget}</span>
              <span>{aggregates.cceProgressPct}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${aggregates.cceProgressPct}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[10px] text-purple-700 font-medium mt-1.5">5m x 5m GPS Walkaround Trials</div>
          <div className="absolute -right-2 -bottom-2 text-purple-100/50 text-5xl font-extrabold pointer-events-none select-none">
            🔬
          </div>
        </div>
      </div>
    </div>
  );
}
