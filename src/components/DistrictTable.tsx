"use client";

import React, { useState } from "react";
import { useGeoCrop } from "@/context/GeoCropContext";
import { Search } from "lucide-react";

export function DistrictTable({ onEditDistrict }: { onEditDistrict: (id: string) => void }) {
  const { districts, selectedDistrictId, setSelectedDistrictId } = useGeoCrop();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = districts.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.assameseName.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            District-Level Agricultural Statistics & Forecast Matrix (35 Districts)
          </h3>
          <p className="text-xs text-slate-500">
            All columns are fully editable by department officials and spatial analysts.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search district or zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="p-2.5">District / Agro Zone</th>
              <th className="p-2.5 text-right">Acreage (ha)</th>
              <th className="p-2.5 text-right">Predicted Yield</th>
              <th className="p-2.5 text-right">Production (MT)</th>
              <th className="p-2.5 text-right">Flood Lost (ha)</th>
              <th className="p-2.5 text-right">Uncertainty</th>
              <th className="p-2.5 text-center">Flood Risk</th>
              <th className="p-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const prod = Math.round(d.currentCroppedAreaHa * d.predictedAvgYield);
              const isSelected = selectedDistrictId === d.id;

              return (
                <tr
                  key={d.id}
                  className={`border-b hover:bg-blue-50/50 transition-colors ${
                    isSelected ? "bg-blue-50 font-semibold" : ""
                  }`}
                >
                  <td className="p-2.5 text-xs text-slate-900">
                    <div className="font-bold">{d.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {d.assameseName} · {d.zone}
                    </div>
                  </td>
                  <td className="p-2.5 text-xs font-mono text-right">{d.currentCroppedAreaHa.toLocaleString()}</td>
                  <td className="p-2.5 text-xs font-mono text-right text-emerald-700 font-bold">
                    {d.predictedAvgYield}
                  </td>
                  <td className="p-2.5 text-xs font-mono text-right font-bold text-slate-900">
                    {prod.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-xs font-mono text-right text-red-600">
                    {d.floodDamagedHa.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-xs font-mono text-right">±{d.uncertaintyMarginPct}%</td>
                  <td className="p-2.5 text-xs text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.floodVulnerability === "High"
                          ? "bg-red-100 text-red-700"
                          : d.floodVulnerability === "Moderate"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {d.floodVulnerability}
                    </span>
                  </td>
                  <td className="p-2.5 text-xs text-center space-x-1">
                    <button
                      onClick={() => onEditDistrict(d.id)}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-medium text-[11px]"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setSelectedDistrictId(d.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                    >
                      Focus
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
