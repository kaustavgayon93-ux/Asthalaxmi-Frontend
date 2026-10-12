"use client";

import React, { useState } from "react";
import { useGeoCrop } from "@/context/GeoCropContext";

const I18N = {
  en: {
    appTitle: "GeoCrop Collector",
    subtitle: "Assam Field Intelligence & CCE",
    statusOnline: "ONLINE · Cloud Sync Active",
    statusOffline: "OFFLINE MODE · Storing in Local Cache",
    tabNewSurvey: "New Survey",
    tabHistory: "Field Records",
    farmerDetails: "1. Farmer & Plot Details",
    farmerName: "Farmer Full Name",
    farmerPhone: "Mobile Number",
    district: "District",
    block: "Block / Revenue Village",
    cropDetails: "2. Crop & Phenology",
    cropType: "Select Crop (All Assam Crops)",
    sowingDate: "Sowing / Transplantation Date",
    cropStage: "Crop Growth Stage",
    cropHealth: "Health & Damage Status",
    gpsSection: "3. Precision Geolocation",
    gpsLockBtn: "📡 Acquire High-Precision GPS Lock",
    cceTitle: "4. Crop Cutting Experiment (5x5m CCE)",
    freshBiomass: "Fresh Biomass Weight (kg)",
    freshGrain: "Fresh Grain / Fibre Weight (kg)",
    moisturePct: "Moisture Content (%)",
    estimatedYield: "Standardized Yield (t/ha)",
    photoCapture: "5. Mandatory Geotagged Evidence",
    submitBtn: "Save & Commit Field Survey",
    syncQueueBtn: "Sync Offline Records to Cloud",
  },
  as: {
    appTitle: "জিঅ’ক্ৰপ সংগ্ৰাহক",
    subtitle: "অসম কৃষি তথ্য আৰু চি.চি.ই.",
    statusOnline: "অনলাইন · ক্লাউড সংমিশ্ৰণ সক্ৰিয়",
    statusOffline: "অফলাইন · স্থানীয় কেচত সংৰক্ষিত",
    tabNewSurvey: "নতুন জৰীপ",
    tabHistory: "পূৰ্বৰ ৰেকৰ্ড",
    farmerDetails: "১. কৃষক আৰু মাটিৰ তথ্য",
    farmerName: "কৃষকৰ সম্পূৰ্ণ নাম",
    farmerPhone: "মোবাইল নম্বৰ",
    district: "জিলা",
    block: "উন্নয়ন খণ্ড / ৰাজহ গাঁও",
    cropDetails: "২. শস্য আৰু বৃদ্ধিৰ স্তৰ",
    cropType: "শস্য নিৰ্বাচন কৰক",
    sowingDate: "ৰোপণৰ তাৰিখ",
    cropStage: "শস্যৰ স্তৰ",
    cropHealth: "স্বাস্থ্য আৰু বানপানীৰ ক্ষতি",
    gpsSection: "৩. জিপিএছ অৱস্থান",
    gpsLockBtn: "📡 সঠিক জিপিএছ অৱস্থান লওক",
    cceTitle: "৪. শস্য কটা পৰীক্ষা (৫x৫ মিটাৰ)",
    freshBiomass: "কেঁচা বায়’মাচ ওজন (কেজি)",
    freshGrain: "কেঁচা শস্যৰ ওজন (কেজি)",
    moisturePct: "আৰ্দ্ৰতাৰ শতাংশ (%)",
    estimatedYield: "পৰিমাপিত উৎপাদন (টন/হেক্টৰ)",
    photoCapture: "৫. জিঅ’টেগযুক্ত প্ৰমাণ ছবি",
    submitBtn: "জৰীপ সংৰক্ষণ কৰক",
    syncQueueBtn: "অফলাইন ৰেকৰ্ড ক্লাউডলৈ পঠিয়াওক",
  },
  bn: {
    appTitle: "জিওক্রপ সংগ্রাহক",
    subtitle: "আসাম মাঠ তথ্য ও সিসিই",
    statusOnline: "অনলাইন · ক্লাউড সিঙ্ক সক্রিয়",
    statusOffline: "অফলাইন · লোকাল ক্যাশে সংরক্ষিত",
    tabNewSurvey: "নতুন জরিপ",
    tabHistory: "পূর্ববর্তী রেকর্ড",
    farmerDetails: "১. কৃষক ও জমির বিবরণ",
    farmerName: "কৃষকের পুরো নাম",
    farmerPhone: "মোবাইল নম্বর",
    district: "জেলা",
    block: "ব্লক / রাজস্ব গ্রাম",
    cropDetails: "২. ফসল ও পর্যায়",
    cropType: "ফসল নির্বাচন করুন",
    sowingDate: "বপন / রোপনের তারিখ",
    cropStage: "ফসলের পর্যায়",
    cropHealth: "স্বাস্থ্য ও বন্যা ক্ষয়ক্ষতি",
    gpsSection: "৩. জিপিএস অবস্থান",
    gpsLockBtn: "📡 সঠিক জিপিএস অবস্থান নিন",
    cceTitle: "৪. ফসল কাটার পরীক্ষা (৫x৫ মিটার সিসিই)",
    freshBiomass: "তাজা বায়োমাস ওজন (কেজি)",
    freshGrain: "তাজা শস্যের ওজন (কেজি)",
    moisturePct: "আর্দ্রতা শতাংশ (%)",
    estimatedYield: "প্রাক্কলিত ফলন (টন/হেক্টর)",
    photoCapture: "৫. জিওট্যাগযুক্ত প্রমাণ",
    submitBtn: "জরিপ সংরক্ষণ করুন",
    syncQueueBtn: "অফলাইন রেকর্ড ক্লাউডে পাঠান",
  },
};

export function MobileCollector() {
  const {
    crops,
    districts,
    surveys,
    isOfflineSimulated,
    setIsOfflineSimulated,
    currentLanguage,
    setCurrentLanguage,
    addSurvey,
    deleteSurvey,
    syncAllOfflineSurveys,
  } = useGeoCrop();

  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [farmerName, setFarmerName] = useState("Bhaben Das");
  const [phone, setPhone] = useState("+91 94351 00291");
  const [districtId, setDistrictId] = useState("dist_kamrup");
  const [blockVillage, setBlockVillage] = useState("Rani Block, Palashbari Village");
  const [cropId, setCropId] = useState("crop_sali_rice");
  const [stage, setStage] = useState("Vegetative");
  const [healthStatus, setHealthStatus] = useState("Healthy");
  const [isCCE, setIsCCE] = useState(true);
  const [freshGrain, setFreshGrain] = useState(7.2);
  const [moisture, setMoisture] = useState(14.5);
  const [gps, setGps] = useState({ lat: 26.2415, lng: 91.5642, acc: 3.2 });

  const t = I18N[currentLanguage] || I18N.en;
  const pendingCount = surveys.filter((s) => s.syncStatus === "pending_offline").length;

  const selectedCropObj = crops.find((c) => c.id === cropId) || crops[0];
  const stdMoisture = selectedCropObj?.typicalMoisture || 14.0;
  const calculatedYield = freshGrain > 0
    ? Number((((freshGrain * (100 - moisture)) / (100 - stdMoisture) / 25) * 10).toFixed(2))
    : 0;

  const handleSimulateGps = () => {
    const d = districts.find((dist) => dist.id === districtId);
    const baseLat = d ? d.coordinates[0] : 26.24;
    const baseLng = d ? d.coordinates[1] : 91.56;
    setGps({
      lat: Number((baseLat + (Math.random() - 0.5) * 0.04).toFixed(5)),
      lng: Number((baseLng + (Math.random() - 0.5) * 0.04).toFixed(5)),
      acc: Number((2.5 + Math.random() * 1.5).toFixed(1)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSurvey({
      enumeratorName: "Field Extension Worker",
      phone: phone,
      districtId: districtId,
      blockName: blockVillage.split(",")[0] || "Block",
      villageName: blockVillage.split(",")[1] || "Village",
      farmerName: farmerName,
      farmerId: "ASSAM-FARM-" + Math.floor(10000 + Math.random() * 90000),
      cropId: cropId,
      sowingDate: new Date().toISOString().split("T")[0],
      stage: stage,
      irrigation: "Canal & Rainfed",
      healthStatus: healthStatus,
      damageNote: healthStatus.includes("Flood") ? "Standing submergence" : "Normal",
      coordinates: [gps.lat, gps.lng],
      accuracyMeters: gps.acc,
      isCCE: isCCE,
      cceDetails: isCCE
        ? {
            plotSize: "5m x 5m (25 sq.m)",
            freshBiomassKg: Number((freshGrain * 3.8).toFixed(2)),
            freshGrainKg: freshGrain,
            moisturePct: moisture,
            calculatedYieldTHa: calculatedYield,
            fieldPhotoUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
          }
        : null,
    });

    alert(isOfflineSimulated ? "Survey saved to offline cache!" : "Survey uploaded to cloud!");
    setActiveTab("history");
  };

  return (
    <div className="max-w-sm mx-auto bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 text-slate-800 font-sans">
      {/* Phone Header */}
      <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[11px] text-slate-400">
        <span>11:58</span>
        <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto"></div>
        <div className="flex items-center gap-1">
          <span>{isOfflineSimulated ? "Offline" : "5G"}</span>
          <span>94%</span>
        </div>
      </div>

      {/* Screen */}
      <div className="bg-slate-50 rounded-[30px] overflow-hidden flex flex-col" style={{ height: 680 }}>
        {/* App Bar */}
        <div className="bg-blue-700 text-white p-3 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm tracking-wide">📱 {t.appTitle}</h3>
              <p className="text-[10px] text-blue-100">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as any)}
                className="text-xs bg-blue-800 text-white rounded px-1 py-0.5 border border-blue-600 focus:outline-none"
              >
                <option value="en">ENG</option>
                <option value="as">অসমীয়া</option>
                <option value="bn">বাংলা</option>
              </select>
              <button
                type="button"
                onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isOfflineSimulated ? "bg-amber-500 text-slate-950 animate-pulse" : "bg-emerald-600 text-white"
                }`}
              >
                {isOfflineSimulated ? "Offline" : "Online"}
              </button>
            </div>
          </div>

          {/* Sync strip */}
          {pendingCount > 0 ? (
            <div className="mt-2 bg-amber-400 text-slate-900 px-2 py-1 rounded text-[11px] font-medium flex justify-between items-center">
              <span>⚠️ {pendingCount} offline survey(s)</span>
              <button
                type="button"
                onClick={() => {
                  const c = syncAllOfflineSurveys();
                  alert(`Synced ${c} record(s) to cloud!`);
                }}
                className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold"
              >
                Sync Now
              </button>
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-blue-200">
              {isOfflineSimulated ? t.statusOffline : t.statusOnline}
            </div>
          )}
        </div>

        {/* Tab Headers */}
        <div className="flex bg-white border-b text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`flex-1 py-2 text-center border-b-2 ${
              activeTab === "new" ? "border-blue-600 text-blue-600" : "border-transparent"
            }`}
          >
            {t.tabNewSurvey}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-center border-b-2 ${
              activeTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent"
            }`}
          >
            {t.tabHistory} ({surveys.length})
          </button>
        </div>

        {/* Form or History */}
        <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
          {activeTab === "new" ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Farmer Section */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">👤 {t.farmerDetails}</h4>
                <div>
                  <label className="text-[11px] text-slate-600">{t.farmerName}</label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full mt-0.5 p-1.5 border rounded text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600">{t.farmerPhone}</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full mt-0.5 p-1.5 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">{t.district}</label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="w-full mt-0.5 p-1.5 border rounded text-xs"
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600">{t.block}</label>
                  <input
                    type="text"
                    value={blockVillage}
                    onChange={(e) => setBlockVillage(e.target.value)}
                    className="w-full mt-0.5 p-1.5 border rounded text-xs"
                  />
                </div>
              </div>

              {/* Crop Section */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">🌾 {t.cropDetails}</h4>
                <div>
                  <label className="text-[11px] text-slate-600">{t.cropType}</label>
                  <select
                    value={cropId}
                    onChange={(e) => setCropId(e.target.value)}
                    className="w-full mt-0.5 p-1.5 border rounded text-xs bg-emerald-50/50 font-medium"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.assameseName})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600">{t.cropStage}</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full mt-0.5 p-1.5 border rounded text-xs"
                    >
                      <option value="Land Prep">Land Prep</option>
                      <option value="Vegetative">Vegetative</option>
                      <option value="Flowering / Heading">Flowering</option>
                      <option value="Maturity">Maturity</option>
                      <option value="Harvested">Harvested</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">{t.cropHealth}</label>
                    <select
                      value={healthStatus}
                      onChange={(e) => setHealthStatus(e.target.value)}
                      className="w-full mt-0.5 p-1.5 border rounded text-xs"
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Partial Flood Inundation">Partial Flood</option>
                      <option value="Pest Damage">Pest Damage</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GPS Section */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">📡 {t.gpsSection}</h4>
                <div className="p-2 font-mono text-[10px] bg-emerald-50 text-emerald-800 rounded border border-emerald-300">
                  Lat: {gps.lat}° N · Long: {gps.lng}° E (Acc: {gps.acc}m)
                </div>
                <button
                  type="button"
                  onClick={handleSimulateGps}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border"
                >
                  {t.gpsLockBtn}
                </button>
              </div>

              {/* CCE 5x5m Section */}
              <div className="bg-purple-50/70 p-3 rounded-lg shadow-sm border border-purple-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-purple-950 text-xs">🔬 {t.cceTitle}</h4>
                  <input
                    type="checkbox"
                    checked={isCCE}
                    onChange={(e) => setIsCCE(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                </div>
                {isCCE && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-700">{t.freshGrain}</label>
                        <input
                          type="number"
                          step="0.05"
                          value={freshGrain}
                          onChange={(e) => setFreshGrain(parseFloat(e.target.value) || 0)}
                          className="w-full mt-0.5 p-1.5 border rounded text-xs bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700">{t.moisturePct}</label>
                        <input
                          type="number"
                          step="0.5"
                          value={moisture}
                          onChange={(e) => setMoisture(parseFloat(e.target.value) || 14)}
                          className="w-full mt-0.5 p-1.5 border rounded text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="p-2 bg-purple-600 text-white rounded flex justify-between items-center font-semibold">
                      <span>{t.estimatedYield}:</span>
                      <span className="text-sm font-bold">{calculatedYield} t/ha</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md text-xs"
              >
                💾 {t.submitBtn}
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              {surveys.map((s) => (
                <div key={s.id} className="bg-white p-2.5 rounded-lg border shadow-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-xs">{s.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        s.syncStatus === "pending_offline"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {s.syncStatus === "pending_offline" ? "Offline" : "Synced"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong>{s.farmerName}</strong> · {s.villageName}
                  </div>
                  {s.cceDetails && (
                    <div className="p-1 bg-purple-50 text-purple-900 rounded text-[10px] flex justify-between">
                      <span>Grain: {s.cceDetails.freshGrainKg} kg</span>
                      <strong>Yield: {s.cceDetails.calculatedYieldTHa} t/ha</strong>
                    </div>
                  )}
                  <div className="flex justify-end pt-1 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete survey ${s.id}?`)) deleteSurvey(s.id);
                      }}
                      className="text-red-600 text-[11px] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
