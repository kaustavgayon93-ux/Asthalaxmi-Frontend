"use client";

import React, { useState, useEffect } from "react";
import { useGeoCrop } from "@/context/GeoCropContext";

export function EditDistrictModal({
  districtId,
  onClose,
}: {
  districtId: string | null;
  onClose: () => void;
}) {
  const { districts, updateDistrict } = useGeoCrop();
  const district = districts.find((d) => d.id === districtId);

  const [area, setArea] = useState(0);
  const [yieldVal, setYieldVal] = useState(0);
  const [floodLoss, setFloodLoss] = useState(0);
  const [uncertainty, setUncertainty] = useState(5);
  const [vulnerability, setVulnerability] = useState<"High" | "Moderate" | "Low">("Moderate");
  const [cceDone, setCceDone] = useState(0);
  const [cceTarget, setCceTarget] = useState(50);

  useEffect(() => {
    if (district) {
      setArea(district.currentCroppedAreaHa);
      setYieldVal(district.predictedAvgYield);
      setFloodLoss(district.floodDamagedHa);
      setUncertainty(district.uncertaintyMarginPct);
      setVulnerability(district.floodVulnerability);
      setCceDone(district.cceCompleted || 0);
      setCceTarget(district.cceTarget);
    }
  }, [district]);

  if (!districtId || !district) return null;

  const handleSave = () => {
    updateDistrict(districtId, {
      currentCroppedAreaHa: area,
      predictedAvgYield: yieldVal,
      floodDamagedHa: floodLoss,
      uncertaintyMarginPct: uncertainty,
      floodVulnerability: vulnerability,
      cceCompleted: cceDone,
      cceTarget: cceTarget,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase">Edit District Statistics</span>
            <h3 className="text-base font-bold text-slate-900">
              {district.name} ({district.assameseName})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700">Current Cropped Area (ha)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono font-semibold"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Predicted Yield (t/ha)</label>
              <input
                type="number"
                step="0.05"
                value={yieldVal}
                onChange={(e) => setYieldVal(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono font-semibold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700">Flood Inundated (ha)</label>
              <input
                type="number"
                value={floodLoss}
                onChange={(e) => setFloodLoss(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono font-semibold text-red-600"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Uncertainty Margin (±%)</label>
              <input
                type="number"
                step="0.1"
                value={uncertainty}
                onChange={(e) => setUncertainty(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-medium text-slate-700">Flood Risk</label>
              <select
                value={vulnerability}
                onChange={(e) => setVulnerability(e.target.value as any)}
                className="w-full mt-1 p-2 border rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-700">CCE Done</label>
              <input
                type="number"
                value={cceDone}
                onChange={(e) => setCceDone(parseInt(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">CCE Target</label>
              <input
                type="number"
                value={cceTarget}
                onChange={(e) => setCceTarget(parseInt(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md">
            Save & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditCropModal({
  cropId,
  onClose,
}: {
  cropId: string | null;
  onClose: () => void;
}) {
  const { crops, updateCrop } = useGeoCrop();
  const crop = crops.find((c) => c.id === cropId);

  const [yieldVal, setYieldVal] = useState(2);
  const [moisture, setMoisture] = useState(14);
  const [duration, setDuration] = useState(120);
  const [season, setSeason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (crop) {
      setYieldVal(crop.avgYield);
      setMoisture(crop.typicalMoisture);
      setDuration(crop.growthDurationDays);
      setSeason(crop.season);
      setNotes(crop.notes || "");
    }
  }, [crop]);

  if (!cropId || !crop) return null;

  const handleSave = () => {
    updateCrop(cropId, {
      avgYield: yieldVal,
      typicalMoisture: moisture,
      growthDurationDays: duration,
      season: season,
      notes: notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Edit Crop Parameters</span>
            <h3 className="text-base font-bold text-slate-900">
              {crop.name} ({crop.assameseName})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700">Standard Yield (t/ha)</label>
              <input
                type="number"
                step="0.05"
                value={yieldVal}
                onChange={(e) => setYieldVal(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono font-semibold text-emerald-700"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Moisture Standard (%)</label>
              <input
                type="number"
                step="0.5"
                value={moisture}
                onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700">Growth Duration (Days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Season</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-slate-700">Agronomic Notes & Context</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md">
            Update Crop
          </button>
        </div>
      </div>
    </div>
  );
}
