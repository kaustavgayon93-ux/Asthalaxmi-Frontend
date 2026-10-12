"use client";

import React, { useState } from "react";
import { useGeoCrop } from "@/context/GeoCropContext";
import { CROP_CATEGORIES } from "@/data/crops";
import { Search } from "lucide-react";

export function CropsDirectory({ onEditCrop }: { onEditCrop: (id: string) => void }) {
  const { crops, setSelectedCropId, setActiveView } = useGeoCrop();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");

  let filtered = [...crops];
  if (selectedCategory !== "All Categories") {
    filtered = filtered.filter((c) => c.category === selectedCategory);
  }
  if (searchTerm) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.assameseName.includes(searchTerm) ||
        c.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Comprehensive Assam Crop Directory (All 50+ Grown Crops)
          </h2>
          <p className="text-xs text-slate-500">
            Every crop baseline yield, moisture norm, and duration is fully editable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg p-2 font-medium"
          >
            {CROP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search crop / অসমীয়া..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{c.name}</h4>
                  <p className="text-xs text-emerald-800 font-semibold">{c.assameseName}</p>
                  <p className="text-[11px] text-slate-400 italic">{c.scientificName}</p>
                </div>
                <button
                  onClick={() => onEditCrop(c.id)}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 font-medium"
                >
                  ✏️ Edit
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-3">{c.notes || "Grown across Assam."}</p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border">
                <div>
                  <span className="text-slate-500 text-[10px] block">Season:</span>
                  <strong className="text-slate-800">{c.season}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Standard Yield:</span>
                  <strong className="text-emerald-700 font-bold">{c.avgYield} t/ha</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Moisture:</span>
                  <strong>{c.typicalMoisture}%</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Duration / CCE:</span>
                  <strong>
                    {c.growthDurationDays}d ({c.ccePlotSize})
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-500">Sowing: {c.sowingPeriod}</span>
              <button
                onClick={() => {
                  setSelectedCropId(c.id);
                  setActiveView("dashboard");
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                View in Forecast →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
