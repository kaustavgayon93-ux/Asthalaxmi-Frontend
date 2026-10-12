"use client";

import React, { useEffect, useRef } from "react";
import { useGeoCrop } from "@/context/GeoCropContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Charts() {
  const { districts, selectedDistrictId, crops, aggregates } = useGeoCrop();

  // 1. District Production Data
  let topDistricts = [...districts];
  if (selectedDistrictId !== "all") {
    topDistricts = topDistricts.filter(d => d.id === selectedDistrictId);
  } else {
    topDistricts.sort((a, b) => 
      (b.currentCroppedAreaHa * b.predictedAvgYield) - (a.currentCroppedAreaHa * a.predictedAvgYield)
    );
    topDistricts = topDistricts.slice(0, 8);
  }

  const barData = {
    labels: topDistricts.map(d => d.name),
    datasets: [
      {
        label: "Estimated Production (MT)",
        data: topDistricts.map(d => Math.round(d.currentCroppedAreaHa * d.predictedAvgYield)),
        backgroundColor: "#2563eb",
        borderRadius: 4,
      },
      {
        label: "Flood Loss (MT)",
        data: topDistricts.map(d => Math.round(d.floodDamagedHa * d.predictedAvgYield)),
        backgroundColor: "#ef4444",
        borderRadius: 4,
      }
    ]
  };

  // 2. Explicit Gaussian Uncertainty Density Curve
  const mean = aggregates.totalProductionTonnes;
  const stdDev = mean * (aggregates.avgUncertaintyPct / 100 / 1.645);
  const steps = 30;
  const minVal = mean - (3 * stdDev);
  const maxVal = mean + (3 * stdDev);
  const stepSize = (maxVal - minVal) / steps;

  const bellLabels: string[] = [];
  const bellPoints: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const x = minVal + (i * stepSize);
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    bellLabels.push(Math.round(x / 1000) + "k");
    bellPoints.push(y * 1000000);
  }

  const bellData = {
    labels: bellLabels,
    datasets: [
      {
        label: "Probability Density P(Production)",
        data: bellPoints,
        fill: true,
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        borderColor: "#2563eb",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      }
    ]
  };

  // 3. Crop Categories Share
  const categoryCounts: Record<string, number> = {};
  crops.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const doughnutData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: [
          "#22c55e", "#facc15", "#f97316", "#059669", 
          "#047857", "#84cc16", "#ef4444", "#dc2626"
        ],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="space-y-4">
      {/* Chart 1: Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-xs text-slate-900 mb-1">Estimated Production vs Flood Loss (Top Districts)</h4>
        <div className="h-44">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 10 } } } },
              scales: {
                y: { beginAtZero: true, ticks: { callback: (v: any) => v >= 1000 ? (v / 1000) + "k MT" : v } },
                x: { ticks: { font: { size: 9 } } }
              }
            }}
          />
        </div>
      </div>

      {/* Chart 2: Bell Curve */}
      <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm bg-gradient-to-br from-white to-blue-50/20">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-bold text-xs text-blue-950">Explicit Uncertainty Quantification (Probability Density)</h4>
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Bayesian Prior</span>
        </div>
        <p className="text-[10px] text-slate-500 mb-1">90% & 95% Confidence Bounds for Procurement & Planning</p>
        <div className="h-36">
          <Line
            data={bellData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: { size: 9 } } }
              }
            }}
          />
        </div>
      </div>

      {/* Chart 3: Doughnut */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-xs text-slate-900 mb-1">Assam Agricultural Diversity Breakdown</h4>
        <div className="h-36">
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 9 } } } },
              cutout: "65%"
            }}
          />
        </div>
      </div>
    </div>
  );
}
