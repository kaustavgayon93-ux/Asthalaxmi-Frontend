"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ASSAM_CROPS, Crop } from "@/data/crops";
import { ASSAM_DISTRICTS, District } from "@/data/districts";
import { INITIAL_SURVEYS, FieldSurvey } from "@/data/surveys";

interface Aggregates {
  totalAreaHa: number;
  avgYield: number;
  totalProductionTonnes: number;
  avgUncertaintyPct: number;
  ci90LowerTonnes: number;
  ci90UpperTonnes: number;
  ci95LowerTonnes: number;
  ci95UpperTonnes: number;
  totalFloodDamagedHa: number;
  lostProductionTonnes: number;
  totalCceTarget: number;
  totalCceCompleted: number;
  cceProgressPct: number;
  leadTimeLabel: string;
}

interface GeoCropContextType {
  crops: Crop[];
  districts: District[];
  surveys: FieldSurvey[];
  selectedDistrictId: string;
  selectedCropId: string;
  leadTimeDays: number;
  floodMaskActive: boolean;
  isOfflineSimulated: boolean;
  currentLanguage: "en" | "as" | "bn";
  activeView: "dashboard" | "mobile" | "cropsDirectory";
  
  // Setters & Actions
  setSelectedDistrictId: (id: string) => void;
  setSelectedCropId: (id: string) => void;
  setLeadTimeDays: (days: number) => void;
  setFloodMaskActive: (active: boolean) => void;
  setIsOfflineSimulated: (offline: boolean) => void;
  setCurrentLanguage: (lang: "en" | "as" | "bn") => void;
  setActiveView: (view: "dashboard" | "mobile" | "cropsDirectory") => void;
  
  // CRUD
  updateDistrict: (id: string, fields: Partial<District>) => void;
  updateCrop: (id: string, fields: Partial<Crop>) => void;
  addSurvey: (survey: Omit<FieldSurvey, "id" | "timestamp" | "syncStatus">) => FieldSurvey;
  updateSurvey: (id: string, fields: Partial<FieldSurvey>) => void;
  deleteSurvey: (id: string) => void;
  syncAllOfflineSurveys: () => number;
  resetToDefaults: () => void;
  
  // Computed
  aggregates: Aggregates;
}

const GeoCropContext = createContext<GeoCropContextType | null>(null);

const STORAGE_KEY = "geocrop_assam_nextjs_v1";

export function GeoCropProvider({ children }: { children: React.ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>(ASSAM_CROPS);
  const [districts, setDistricts] = useState<District[]>(ASSAM_DISTRICTS);
  const [surveys, setSurveys] = useState<FieldSurvey[]>(INITIAL_SURVEYS);
  
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("all");
  const [selectedCropId, setSelectedCropId] = useState<string>("crop_sali_rice");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(30);
  const [floodMaskActive, setFloodMaskActive] = useState<boolean>(true);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "as" | "bn">("en");
  const [activeView, setActiveView] = useState<"dashboard" | "mobile" | "cropsDirectory">("dashboard");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.crops) setCrops(parsed.crops);
        if (parsed.districts) setDistricts(parsed.districts);
        if (parsed.surveys) setSurveys(parsed.surveys);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }, []);

  // Save to localStorage whenever core data changes
  const persist = (newCrops: Crop[], newDistricts: District[], newSurveys: FieldSurvey[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        crops: newCrops,
        districts: newDistricts,
        surveys: newSurveys
      }));
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

  const updateDistrict = (id: string, fields: Partial<District>) => {
    const updated = districts.map(d => d.id === id ? { ...d, ...fields } : d);
    setDistricts(updated);
    persist(crops, updated, surveys);
  };

  const updateCrop = (id: string, fields: Partial<Crop>) => {
    const updated = crops.map(c => c.id === id ? { ...c, ...fields } : c);
    setCrops(updated);
    persist(updated, districts, surveys);
  };

  const addSurvey = (surveyData: Omit<FieldSurvey, "id" | "timestamp" | "syncStatus">) => {
    const newSurvey: FieldSurvey = {
      ...surveyData,
      id: "SRV-" + Date.now(),
      timestamp: new Date().toISOString(),
      syncStatus: isOfflineSimulated ? "pending_offline" : "synced"
    };
    const updatedSurveys = [newSurvey, ...surveys];
    setSurveys(updatedSurveys);

    if (newSurvey.isCCE && newSurvey.syncStatus === "synced") {
      const updatedDistricts = districts.map(d => 
        d.id === newSurvey.districtId ? { ...d, cceCompleted: (d.cceCompleted || 0) + 1 } : d
      );
      setDistricts(updatedDistricts);
      persist(crops, updatedDistricts, updatedSurveys);
    } else {
      persist(crops, districts, updatedSurveys);
    }
    return newSurvey;
  };

  const updateSurvey = (id: string, fields: Partial<FieldSurvey>) => {
    const updated = surveys.map(s => s.id === id ? { ...s, ...fields } : s);
    setSurveys(updated);
    persist(crops, districts, updated);
  };

  const deleteSurvey = (id: string) => {
    const updated = surveys.filter(s => s.id !== id);
    setSurveys(updated);
    persist(crops, districts, updated);
  };

  const syncAllOfflineSurveys = () => {
    let synced = 0;
    const updatedDistricts = [...districts];
    const updatedSurveys = surveys.map(s => {
      if (s.syncStatus === "pending_offline") {
        synced++;
        if (s.isCCE) {
          const d = updatedDistricts.find(dist => dist.id === s.districtId);
          if (d) d.cceCompleted = (d.cceCompleted || 0) + 1;
        }
        return { ...s, syncStatus: "synced" as const };
      }
      return s;
    });

    setSurveys(updatedSurveys);
    setDistricts(updatedDistricts);
    persist(crops, updatedDistricts, updatedSurveys);
    return synced;
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCrops(ASSAM_CROPS);
    setDistricts(ASSAM_DISTRICTS);
    setSurveys(INITIAL_SURVEYS);
  };

  // Lead time modifiers
  const getModifiers = () => {
    if (leadTimeDays === 45) return { uncertaintyFactor: 1.35, yieldFactor: 0.96, label: "Early Season Baseline" };
    if (leadTimeDays === 15) return { uncertaintyFactor: 0.70, yieldFactor: 1.02, label: "Final Pre-Harvest Projection" };
    return { uncertaintyFactor: 1.0, yieldFactor: 1.0, label: "Mid-Season Satellite Sync" };
  };

  // Aggregates computation
  const modifiers = getModifiers();
  const activeDistricts = selectedDistrictId === "all" ? districts : districts.filter(d => d.id === selectedDistrictId);
  const selectedCrop = crops.find(c => c.id === selectedCropId) || crops[0];

  let totalAreaHa = 0;
  let totalProductionTonnes = 0;
  let totalFloodDamagedHa = 0;
  let totalCceTarget = 0;
  let totalCceCompleted = 0;
  let weightedUncertaintySum = 0;

  activeDistricts.forEach(d => {
    let cropShare = 0.55;
    if (selectedCrop.category === "Cereals & Grains") {
      cropShare = selectedCrop.id === "crop_sali_rice" ? 0.65 : 0.15;
    } else if (selectedCrop.category === "Oilseeds") {
      cropShare = 0.12;
    } else if (selectedCrop.category === "Plantation Crops") {
      cropShare = selectedCrop.id === "crop_tea" ? 0.18 : 0.05;
    } else {
      cropShare = 0.04;
    }

    const area = selectedCropId === "all" ? d.currentCroppedAreaHa : (d.currentCroppedAreaHa * cropShare);
    const yieldVal = (selectedCropId === "all" ? d.predictedAvgYield : (selectedCrop.avgYield * (d.predictedAvgYield / 2.65))) * modifiers.yieldFactor;
    const prod = area * yieldVal;
    const floodLoss = Math.min(d.floodDamagedHa * (cropShare || 0.5), area * 0.35);

    totalAreaHa += area;
    totalProductionTonnes += prod;
    totalFloodDamagedHa += floodLoss;
    totalCceTarget += d.cceTarget;
    totalCceCompleted += d.cceCompleted;
    weightedUncertaintySum += (d.uncertaintyMarginPct * modifiers.uncertaintyFactor) * area;
  });

  const avgYield = totalAreaHa > 0 ? (totalProductionTonnes / totalAreaHa) : 0;
  const avgUncertaintyPct = totalAreaHa > 0 ? (weightedUncertaintySum / totalAreaHa) : 5.0;

  const margin90 = totalProductionTonnes * (avgUncertaintyPct / 100);
  const margin95 = totalProductionTonnes * ((avgUncertaintyPct * 1.25) / 100);

  const aggregates: Aggregates = {
    totalAreaHa: Math.round(totalAreaHa),
    avgYield: Number(avgYield.toFixed(2)),
    totalProductionTonnes: Math.round(totalProductionTonnes),
    avgUncertaintyPct: Number(avgUncertaintyPct.toFixed(1)),
    ci90LowerTonnes: Math.round(totalProductionTonnes - margin90),
    ci90UpperTonnes: Math.round(totalProductionTonnes + margin90),
    ci95LowerTonnes: Math.round(totalProductionTonnes - margin95),
    ci95UpperTonnes: Math.round(totalProductionTonnes + margin95),
    totalFloodDamagedHa: Math.round(totalFloodDamagedHa),
    lostProductionTonnes: Math.round(totalFloodDamagedHa * avgYield),
    totalCceTarget,
    totalCceCompleted,
    cceProgressPct: totalCceTarget > 0 ? Math.round((totalCceCompleted / totalCceTarget) * 100) : 0,
    leadTimeLabel: modifiers.label
  };

  return (
    <GeoCropContext.Provider value={{
      crops,
      districts,
      surveys,
      selectedDistrictId,
      selectedCropId,
      leadTimeDays,
      floodMaskActive,
      isOfflineSimulated,
      currentLanguage,
      activeView,
      setSelectedDistrictId,
      setSelectedCropId,
      setLeadTimeDays,
      setFloodMaskActive,
      setIsOfflineSimulated,
      setCurrentLanguage,
      setActiveView,
      updateDistrict,
      updateCrop,
      addSurvey,
      updateSurvey,
      deleteSurvey,
      syncAllOfflineSurveys,
      resetToDefaults,
      aggregates
    }}>
      {children}
    </GeoCropContext.Provider>
  );
}

export function useGeoCrop() {
  const context = useContext(GeoCropContext);
  if (!context) throw new Error("useGeoCrop must be used within GeoCropProvider");
  return context;
}
