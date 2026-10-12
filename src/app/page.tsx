"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useGeoCrop } from "@/context/GeoCropContext";
import { Header } from "@/components/Header";
import { KpiCards } from "@/components/KpiCards";
import { Charts } from "@/components/Charts";
import { DistrictTable } from "@/components/DistrictTable";
import { MobileCollector } from "@/components/MobileCollector";
import { CropsDirectory } from "@/components/CropsDirectory";
import { EditDistrictModal, EditCropModal } from "@/components/Modals";

// Dynamic import for GisMap to avoid SSR issues with Leaflet
const GisMap = dynamic(
  () => import("@/components/GisMap").then((mod) => mod.GisMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">Loading Leaflet Web-GIS Map...</div> }
);

export default function Home() {
  const { activeView } = useGeoCrop();
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: Web-GIS Command Center Dashboard */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            <KpiCards />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <GisMap onEditDistrict={(id) => setEditingDistrictId(id)} />
              </div>
              <div className="lg:col-span-5">
                <Charts />
              </div>
            </div>

            <DistrictTable onEditDistrict={(id) => setEditingDistrictId(id)} />
          </div>
        )}

        {/* VIEW 2: Mobile Collector Experience */}
        {activeView === "mobile" && (
          <div className="py-4">
            <div className="max-w-2xl mx-auto mb-6 text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900">GeoCrop Collector — Mobile Field Experience</h2>
              <p className="text-xs text-slate-600">
                Simulating the offline-first field enumerator and CCE supervisor application. 
                Record new ground-truthing surveys, run 5x5m CCE calculations, and manage local cached records.
              </p>
            </div>
            <MobileCollector />
          </div>
        )}

        {/* VIEW 3: Assam Crops Master Directory */}
        {activeView === "cropsDirectory" && (
          <CropsDirectory onEditCrop={(id) => setEditingCropId(id)} />
        )}
      </main>

      {/* Modals */}
      <EditDistrictModal
        districtId={editingDistrictId}
        onClose={() => setEditingDistrictId(null)}
      />
      <EditCropModal
        cropId={editingCropId}
        onClose={() => setEditingCropId(null)}
      />
    </div>
  );
}
