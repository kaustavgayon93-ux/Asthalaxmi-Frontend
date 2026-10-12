"use client";

import React, { useEffect, useRef } from "react";
import { useGeoCrop } from "@/context/GeoCropContext";
import "leaflet/dist/leaflet.css";

export function GisMap({ onEditDistrict }: { onEditDistrict: (id: string) => void }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ districts?: any; flood?: any; surveys?: any }>({});

  const {
    districts,
    surveys,
    selectedDistrictId,
    floodMaskActive,
    setFloodMaskActive,
    setSelectedDistrictId,
  } = useGeoCrop();

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current && isMounted) {
        const map = L.map(mapContainerRef.current, {
          center: [26.25, 92.90],
          zoom: 7.4,
          minZoom: 6,
          maxZoom: 16,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; OpenStreetMap &copy; CARTO | ASSAC GIS',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        layersRef.current.districts = L.layerGroup().addTo(map);
        layersRef.current.flood = L.layerGroup().addTo(map);
        layersRef.current.surveys = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
      }

      if (mapInstanceRef.current && isMounted) {
        renderLayers(L);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [districts, surveys, selectedDistrictId, floodMaskActive]);

  const renderLayers = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Districts
    layersRef.current.districts.clearLayers();
    districts.forEach((d) => {
      const isSelected = selectedDistrictId === d.id;
      let fillColor = "#10b981";
      if (d.floodVulnerability === "High") fillColor = "#ef4444";
      else if (d.floodVulnerability === "Moderate") fillColor = "#f59e0b";

      const radius = Math.max(9000, Math.sqrt(d.currentCroppedAreaHa) * 65);

      const circle = L.circle(d.coordinates, {
        color: isSelected ? "#1d4ed8" : fillColor,
        weight: isSelected ? 3 : 1.5,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.45 : 0.22,
        radius: radius,
      });

      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
          <div style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            ${d.name} (${d.assameseName})
          </div>
          <div>Area: <strong>${d.currentCroppedAreaHa.toLocaleString()} ha</strong></div>
          <div>Yield: <strong>${d.predictedAvgYield} t/ha</strong></div>
          <div>Flood Loss: <strong style="color: #dc2626;">${d.floodDamagedHa.toLocaleString()} ha</strong></div>
          <div>Uncertainty: <strong>±${d.uncertaintyMarginPct}%</strong></div>
          <div style="margin-top: 8px;">
            <button id="btn-edit-${d.id}" style="padding: 4px 8px; background: #2563eb; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
              ✏️ Edit District Data
            </button>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on("popupopen", () => {
        const btn = document.getElementById(`btn-edit-${d.id}`);
        if (btn) btn.onclick = () => onEditDistrict(d.id);
      });

      layersRef.current.districts.addLayer(circle);

      const label = L.marker(d.coordinates, {
        icon: L.divIcon({
          className: "district-map-label",
          html: `<div style="font-size: 10px; font-weight: 600; background: rgba(255,255,255,0.9); padding: 2px 4px; border-radius: 4px; border: 1px solid #cbd5e1; transform: translate(-50%, -50%); white-space: nowrap;">${d.name}</div>`,
          iconSize: [0, 0],
        }),
      });
      layersRef.current.districts.addLayer(label);
    });

    // 2. Flood Inundation Polygons (Sentinel-1 SAR)
    layersRef.current.flood.clearLayers();
    if (floodMaskActive) {
      const floodPolys = [
        [[27.05, 94.10], [27.18, 94.35], [27.05, 94.55], [26.90, 94.35], [26.92, 94.15]],
        [[26.38, 92.25], [26.42, 92.55], [26.25, 92.65], [26.20, 92.35]],
        [[26.15, 90.75], [26.25, 90.95], [26.10, 91.05], [26.02, 90.85]],
        [[24.88, 92.70], [24.95, 92.85], [24.82, 92.90], [24.78, 92.75]]
      ];
      floodPolys.forEach((poly, i) => {
        const p = L.polygon(poly, {
          color: "#2563eb",
          weight: 1.5,
          dashArray: "4, 4",
          fillColor: "#3b82f6",
          fillOpacity: 0.35,
        });
        p.bindTooltip(`🛰️ Sentinel-1 SAR Radar Flood Inundation Zone #${i + 1}`);
        layersRef.current.flood.addLayer(p);
      });
    }

    // 3. Ground Truth Surveys
    layersRef.current.surveys.clearLayers();
    surveys.forEach((s) => {
      const isPending = s.syncStatus === "pending_offline";
      const marker = L.marker(s.coordinates, {
        icon: L.divIcon({
          className: "survey-pin",
          html: `<div style="width: 24px; height: 24px; border-radius: 50%; background: ${isPending ? '#d97706' : (s.isCCE ? '#7c3aed' : '#059669')}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${s.isCCE ? '🌾' : '📍'}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      });

      marker.bindPopup(`
        <div style="font-size: 12px; min-width: 180px;">
          <strong>${s.id}</strong> (${s.farmerName})<br/>
          Stage: ${s.stage}<br/>
          ${s.cceDetails ? `Yield: <strong>${s.cceDetails.calculatedYieldTHa} t/ha</strong>` : ''}
        </div>
      `);
      layersRef.current.surveys.addLayer(marker);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 flex flex-col">
      <div className="flex items-center justify-between pb-2 mb-2 border-b">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <span>🗺️</span> Web-GIS Spatial Viewer · Assam Multi-Sensor Layers
          </h3>
          <p className="text-[11px] text-slate-500">
            District boundaries, Sentinel-1 SAR flood overlays, and verified CCE coordinates.
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFloodMaskActive(!floodMaskActive)}
            className={`px-2.5 py-1 rounded font-semibold text-[11px] border transition-colors ${
              floodMaskActive
                ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
          >
            🌊 SAR Flood Layer
          </button>
          <button
            onClick={() => {
              setSelectedDistrictId("all");
              if (mapInstanceRef.current) mapInstanceRef.current.flyTo([26.25, 92.90], 7.4);
            }}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] border"
          >
            Reset View
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} className="w-full rounded-lg border border-slate-300 shadow-inner" style={{ height: 500 }} />

      <div className="mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Normal / High Yield</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Moderate Flood Risk</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> High Flood Risk</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500/40 border border-blue-600 inline-block"></span> SAR Flood Layer</span>
        </div>
        <span className="font-mono text-slate-400">EPSG:4326</span>
      </div>
    </div>
  );
}
