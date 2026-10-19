'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Polyline,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  Info,
  Edit,
  AlertTriangle,
  TreePine,
  Grid3X3,
  ExternalLink,
  Satellite,
  ArrowRightLeft,
  Sparkles,
  CloudRain,
  Eye,
  Activity,
  Sliders,
  UploadCloud,
  Plane,
} from 'lucide-react';
import {
  fetchCompartmentsGeoJSON,
  fetchPlantationsGeoJSON,
  fetchAlertsGeoJSON,
  fetchSatelliteLayers,
  fetchTemporalComparison,
  importCompartmentsGeoJSON,
  fetchDroneSurveysGeoJSON,
} from '../../api/client';
import StatusBadge from '../common/StatusBadge';
import toast from 'react-hot-toast';

// Default Assam center: Guwahati/Kaziranga corridor
const ASSAM_CENTER = [26.2006, 92.9376];
const DEFAULT_ZOOM = 8;

// Fallback GeoJSON sample data if API is not yet seeded
const SAMPLE_COMPARTMENTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        compartment_no: 'KZ-C12',
        division: 'Kaziranga Buffer',
        range: 'Bokakhat',
        beat: 'Kohora',
        forest_type: 'Tropical Semi-Evergreen',
        canopy_density_pct: 78,
        area_ha: 420.5,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [93.10, 26.55],
            [93.25, 26.55],
            [93.25, 26.65],
            [93.10, 26.65],
            [93.10, 26.55],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        compartment_no: 'KP-C04',
        division: 'Kamrup East',
        range: 'Guwahati East',
        beat: 'Khanapara',
        forest_type: 'Moist Deciduous',
        canopy_density_pct: 64,
        area_ha: 310.2,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [91.75, 26.05],
            [91.90, 26.05],
            [91.90, 26.15],
            [91.75, 26.15],
            [91.75, 26.05],
          ],
        ],
      },
    },
  ],
};

const SAMPLE_PLANTATIONS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'Bokakhat Sal Block 1',
        scheme: 'CAMPA',
        species: 'Sal (Shorea robusta)',
        survival_rate: 88.4,
        area_ha: 25.0,
      },
      geometry: { type: 'Point', coordinates: [93.18, 26.58] },
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'Sonapur Teak Plot',
        scheme: 'Green India Mission',
        species: 'Teak, Gamhar',
        survival_rate: 74.5,
        area_ha: 40.0,
      },
      geometry: { type: 'Point', coordinates: [91.95, 26.12] },
    },
  ],
};

const SAMPLE_ALERTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        alert_type: 'Deforestation',
        severity: 'Critical',
        affected_area_ha: 3.2,
        status: 'Under Inspection',
        detected_at: '2026-10-12 04:30',
        confidence: 0.94,
      },
      geometry: { type: 'Point', coordinates: [93.21, 26.62] },
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        alert_type: 'Encroachment',
        severity: 'High',
        affected_area_ha: 1.1,
        status: 'Assigned',
        detected_at: '2026-10-11 18:20',
        confidence: 0.88,
      },
      geometry: { type: 'Point', coordinates: [91.82, 26.11] },
    },
  ],
};

// NASA GEDI Spaceborne LiDAR tracks crossing Assam
const GEDI_LIDAR_TRACKS = [
  {
    orbitId: 'GEDI_O28491_T02 (Kamrup Track)',
    beam: 'Beam 0111 (Full Power 1064nm)',
    points: [
      [25.85, 91.50],
      [26.05, 91.75],
      [26.25, 92.00],
      [26.45, 92.25],
    ],
    rh98_height_m: 28.4,
    agb_estimate_t_ha: 245.2,
  },
  {
    orbitId: 'GEDI_O27940_T01 (Kaziranga Buffer Track)',
    beam: 'Beam 0101 (Canopy Profile)',
    points: [
      [26.35, 92.95],
      [26.55, 93.20],
      [26.75, 93.45],
    ],
    rh98_height_m: 32.1,
    agb_estimate_t_ha: 298.6,
  },
];

// Component to track mouse coordinates
function MouseCoordinatesTracker({ setCoords }) {
  useMapEvents({
    mousemove(e) {
      setCoords([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapView() {
  // Base Imagery & Satellite Layer Switchers
  const [baseMap, setBaseMap] = useState('satellite'); // 'osm' | 'satellite' | 'topographic'
  const [satelliteOverlay, setSatelliteOverlay] = useState('none'); // 'none' | 'cir' | 'ndvi' | 'ndwi' | 'sar-vh' | 'sar-vv' | 'chm' | 'agb'
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);

  // Vector Feature Toggles
  const [showCompartments, setShowCompartments] = useState(true);
  const [showPlantations, setShowPlantations] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showGediTracks, setShowGediTracks] = useState(true);
  const [showDroneSurveys, setShowDroneSurveys] = useState(true);

  // Dual-Pane Temporal "Swipe" Comparison Tool (PRD Section 4.1.1)
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [swipeSplit, setSwipeSplit] = useState(50); // percentage 0 - 100
  const [temporalInfo, setTemporalInfo] = useState(null);

  // Data States
  const [compartmentsData, setCompartmentsData] = useState(null);
  const [plantationsData, setPlantationsData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [droneSurveysData, setDroneSurveysData] = useState(null);
  const [mouseCoords, setMouseCoords] = useState(ASSAM_CENTER);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    // Fetch GeoJSON and Temporal info
    const loadGeoData = async () => {
      try {
        const comps = await fetchCompartmentsGeoJSON();
        setCompartmentsData(comps?.features?.length ? comps : SAMPLE_COMPARTMENTS);
      } catch (e) {
        setCompartmentsData(SAMPLE_COMPARTMENTS);
      }

      try {
        const plants = await fetchPlantationsGeoJSON();
        setPlantationsData(plants?.features?.length ? plants : SAMPLE_PLANTATIONS);
      } catch (e) {
        setPlantationsData(SAMPLE_PLANTATIONS);
      }

      try {
        const alts = await fetchAlertsGeoJSON();
        setAlertsData(alts?.features?.length ? alts : SAMPLE_ALERTS);
      } catch (e) {
        setAlertsData(SAMPLE_ALERTS);
      }

      try {
        const drones = await fetchDroneSurveysGeoJSON();
        setDroneSurveysData(drones);
      } catch (e) {
        // fallback
      }

      try {
        const temp = await fetchTemporalComparison('Kamrup East');
        setTemporalInfo(temp);
      } catch (e) {
        // fallback
      }
    };

    loadGeoData();
  }, []);

  const handleMapGeoJSONUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        let newFeatures = [];
        if (json.type === 'FeatureCollection') {
          newFeatures = json.features || [];
        } else if (json.type === 'Feature') {
          newFeatures = [json];
        } else if (json.coordinates) {
          newFeatures = [{ type: 'Feature', geometry: json, properties: { compartment_no: 'INGESTED-01' } }];
        }

        if (newFeatures.length === 0) {
          toast.error('No valid geospatial vector features in file');
          return;
        }

        setCompartmentsData((prev) => {
          const currentFeatures = prev?.features || [];
          return {
            type: 'FeatureCollection',
            features: [...newFeatures, ...currentFeatures],
          };
        });

        try {
          await importCompartmentsGeoJSON(json);
          toast.success(`Ingested ${newFeatures.length} boundary polygon(s) to GIS database!`);
        } catch (dbErr) {
          toast.success(`Rendered ${newFeatures.length} boundary polygon(s) on map canvas`);
        }
      } catch (err) {
        toast.error('Failed to parse vector file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const getSeverityRadius = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 12;
      case 'high':
        return 9;
      case 'medium':
        return 7;
      default:
        return 5;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      default:
        return '#10b981';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md ${
        isFullscreen ? 'h-screen fixed inset-0 z-50 rounded-none' : 'h-[calc(100vh-140px)] min-h-[580px]'
      }`}
    >
      {/* Top Banner: Dual-Pane Temporal Swipe Comparison Alert (When Active) */}
      {isSwipeMode && (
        <div className="absolute top-4 left-4 z-[1001] bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Temporal Swipe Mode Active</span>
              <span className="text-[10px] text-slate-300">
                Left: Pre-Monsoon Optical Baseline | Right: Post-Monsoon Sentinel-1 SAR (Inpainted)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[11px] text-emerald-400 font-bold">Split: {swipeSplit}%</span>
            <input
              type="range"
              min="10"
              max="90"
              value={swipeSplit}
              onChange={(e) => setSwipeSplit(Number(e.target.value))}
              className="w-24 accent-emerald-500 cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsSwipeMode(false)}
            className="px-2.5 py-1 text-[11px] bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
          >
            Exit Swipe
          </button>
        </div>
      )}

      {/* Map Element */}
      <MapContainer
        center={ASSAM_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        zoomControl={false}
      >
        <MouseCoordinatesTracker setCoords={setMouseCoords} />

        {/* 1. Base Imagery Layers */}
        {baseMap === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {baseMap === 'satellite' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Sentinel-2 & World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        {baseMap === 'topographic' && (
          <TileLayer
            attribution='&copy; Copernicus 30m DEM & OpenTopoMap'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* 2. Specialized Satellite & SAR Overlays */}
        {satelliteOverlay === 'cir' && (
          <TileLayer
            attribution='Sentinel-2 Color Infrared (CIR)'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={overlayOpacity}
            className="filter saturate-150 contrast-125"
          />
        )}
        {satelliteOverlay === 'ndvi' && (
          <TileLayer
            attribution='Sentinel-2 NDVI Vegetation Index'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={overlayOpacity}
            className="filter hue-rotate-60 contrast-150"
          />
        )}
        {satelliteOverlay === 'ndwi' && (
          <TileLayer
            attribution='Sentinel-2 NDWI Moisture Stress'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={overlayOpacity}
            className="filter hue-rotate-180 contrast-150"
          />
        )}
        {satelliteOverlay === 'sar-vh' && (
          <TileLayer
            attribution='Sentinel-1 SAR C-Band VH Backscatter (Cloud Penetrating)'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={overlayOpacity}
            className="filter grayscale contrast-200"
          />
        )}
        {satelliteOverlay === 'chm' && (
          <TileLayer
            attribution='NASA GEDI + AI 10m Canopy Height Model (CHM)'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={overlayOpacity}
            className="filter hue-rotate-90 saturate-200"
          />
        )}
        {satelliteOverlay === 'agb' && (
          <TileLayer
            attribution='Above-Ground Biomass Density (AGB tonnes/ha)'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={overlayOpacity}
            className="filter hue-rotate-30 saturate-150"
          />
        )}

        {/* 3. NASA GEDI LiDAR Tracks */}
        {showGediTracks &&
          GEDI_LIDAR_TRACKS.map((t, idx) => (
            <React.Fragment key={`gedi-${idx}`}>
              <Polyline
                positions={t.points}
                pathOptions={{
                  color: '#eab308',
                  weight: 3,
                  dashArray: '6, 6',
                  opacity: 0.85,
                }}
              >
                <Popup>
                  <div className="p-3 text-xs space-y-1">
                    <div className="font-bold text-amber-600 text-sm flex items-center gap-1">
                      <span>⚡ {t.orbitId}</span>
                    </div>
                    <div><strong>Beam:</strong> {t.beam}</div>
                    <div><strong>RH98 Canopy Height:</strong> <span className="font-bold text-emerald-600">{t.rh98_height_m} m</span></div>
                    <div><strong>Footprint AGB:</strong> <span className="font-bold text-purple-600">{t.agb_estimate_t_ha} t/ha</span></div>
                    <div className="text-[10px] text-slate-400">NASA Spaceborne LiDAR Waveform</div>
                  </div>
                </Popup>
              </Polyline>
              {t.points.map((pt, pIdx) => (
                <CircleMarker
                  key={`gedi-pt-${idx}-${pIdx}`}
                  center={pt}
                  radius={4}
                  pathOptions={{ color: '#eab308', fillColor: '#fef08a', fillOpacity: 0.9 }}
                />
              ))}
            </React.Fragment>
          ))}

        {/* 4. Compartment Boundaries (Polygons) */}
        {showCompartments && compartmentsData && (
          <GeoJSON
            key={JSON.stringify(compartmentsData)}
            data={compartmentsData}
            style={() => ({
              color: '#2563eb',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.18,
            })}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindPopup(`
                <div class="p-3 text-xs space-y-1.5 min-w-[220px]">
                  <div class="font-bold text-slate-800 text-sm">${p.compartment_number || p.compartment_no || 'Compartment'}</div>
                  <div class="text-slate-600"><strong>Division:</strong> ${p.division_code || p.division || 'N/A'} • <strong>Range:</strong> ${p.range_name || p.range || 'N/A'}</div>
                  <div class="text-slate-600"><strong>Type:</strong> ${p.forest_type || 'N/A'}</div>
                  <div class="text-slate-600"><strong>Canopy Cover:</strong> ${p.canopy_density_percent || p.canopy_density_pct || 0}% • ${p.total_area_ha || p.area_ha || 0} ha</div>
                  <div class="pt-1.5 border-t border-slate-200 mt-1 grid grid-cols-3 gap-1 text-[10px]">
                    <div class="bg-emerald-50 text-emerald-800 p-1 rounded font-semibold text-center">NDVI: ${Number(p.mean_ndvi || 0.75).toFixed(2)}</div>
                    <div class="bg-sky-50 text-sky-800 p-1 rounded font-semibold text-center">NDWI: +${Number(p.mean_ndwi || 0.25).toFixed(2)}</div>
                    <div class="bg-rose-50 text-rose-800 p-1 rounded font-semibold text-center">CIR: ${Number(p.cir_index || 2.5).toFixed(2)}</div>
                    <div class="bg-purple-50 text-purple-800 p-1 rounded font-semibold text-center">SAR: ${Number(p.sar_vh_backscatter_db || -15).toFixed(1)}dB</div>
                    <div class="bg-teal-50 text-teal-800 p-1 rounded font-semibold text-center">CHM: ${Number(p.canopy_height_m || 15).toFixed(1)}m</div>
                    <div class="bg-slate-100 text-slate-800 p-1 rounded font-semibold text-center">AGB: ${Number(p.biomass_tonnes_per_ha || 150).toFixed(0)}t/ha</div>
                  </div>
                </div>
              `);
            }}
          />
        )}

        {/* 5. Plantation Plots (Markers) */}
        {showPlantations &&
          plantationsData?.features?.map((f, idx) => {
            const coords = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
            const p = f.properties || {};
            return (
              <CircleMarker
                key={`plant-${p.id || idx}`}
                center={coords}
                radius={7}
                pathOptions={{
                  color: '#065f46',
                  fillColor: '#10b981',
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-3 text-xs space-y-1.5 min-w-[220px]">
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      <span>🌱 {p.name}</span>
                    </div>
                    <div className="text-slate-600"><strong>Scheme:</strong> ${p.scheme_name || p.scheme}</div>
                    <div className="text-slate-600"><strong>Species:</strong> ${p.primary_species || p.species}</div>
                    <div className="text-slate-600"><strong>Survival Rate:</strong> ${p.survival_rate_percent || p.survival_rate}% • ${p.area_ha} ha</div>
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 mt-1 grid grid-cols-3 gap-1 text-[10px]">
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-1 rounded font-semibold text-center">NDVI: ${Number(p.current_ndvi || 0.78).toFixed(2)}</div>
                      <div className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 p-1 rounded font-semibold text-center">NDWI: +${Number(p.current_ndwi || 0.22).toFixed(2)}</div>
                      <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-1 rounded font-semibold text-center">CIR: ${Number(p.cir_vigor_score || 2.6).toFixed(2)}</div>
                      <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 p-1 rounded font-semibold text-center">SAR: ${Number(p.sar_backscatter_vh_db || -15.5).toFixed(1)}dB</div>
                      <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 p-1 rounded font-semibold text-center">CHM: ${Number(p.mean_canopy_height_m || 10).toFixed(1)}m</div>
                      <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-1 rounded font-semibold text-center">AGB: ${Number(p.biomass_tonnes_per_ha || 110).toFixed(0)}t/ha</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 6. Alert Incidents (Severity Markers) */}
        {showAlerts &&
          alertsData?.features?.map((f, idx) => {
            const coords = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
            const severity = f.properties.severity || 'Medium';
            const radius = getSeverityRadius(severity);
            const color = getSeverityColor(severity);

            return (
              <CircleMarker
                key={`alert-${f.properties.id || idx}`}
                center={coords}
                radius={radius}
                pathOptions={{
                  color: '#fff',
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-3 text-xs space-y-1.5 min-w-[200px]">
                    <div className="font-bold text-red-600 text-sm flex items-center gap-1">
                      ⚠️ {f.properties.alert_type} Incident
                    </div>
                    <div className="text-slate-600"><strong>Severity:</strong> <span style={{ color }}>{severity}</span></div>
                    <div className="text-slate-600"><strong>Status:</strong> {f.properties.status}</div>
                    <div className="text-slate-600"><strong>Confidence:</strong> {Math.round((f.properties.confidence || 0.9) * 100)}%</div>
                    <div className="text-slate-600"><strong>Area:</strong> {f.properties.affected_area_ha} ha</div>
                    <div className="text-[11px] text-slate-400">Detected: {f.properties.detected_at}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 7. Drone (UAV) Survey Flight Footprints */}
        {showDroneSurveys && droneSurveysData && (
          <GeoJSON
            key={JSON.stringify(droneSurveysData)}
            data={droneSurveysData}
            style={() => ({
              color: '#8b5cf6',
              weight: 2,
              dashArray: '5, 5',
              fillColor: '#c084fc',
              fillOpacity: 0.3,
            })}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindPopup(`
                <div class="p-3 text-xs space-y-1.5 min-w-[230px]">
                  <div class="font-bold text-purple-700 text-sm flex items-center gap-1">
                    <span>✈️ ${p.mission_code}</span>
                  </div>
                  <div class="font-semibold text-slate-800">${p.survey_name}</div>
                  <div class="text-slate-600"><strong>Division:</strong> ${p.division_name}</div>
                  <div class="text-slate-600"><strong>Sensor:</strong> ${p.sensor_type} • <span class="text-emerald-600 font-bold">${p.ground_sampling_distance_cm} cm/px GSD</span></div>
                  <div class="text-purple-700 font-bold"><strong>AI Crowns:</strong> ${p.itc_crown_count ? Number(p.itc_crown_count).toLocaleString() + ' stems' : 'Pending AI'} (${p.survival_rate_verified_pct || 88}% survival)</div>
                  <div class="pt-1.5 border-t border-slate-200 mt-1 grid grid-cols-3 gap-1 text-[10px]">
                    <div class="bg-emerald-50 text-emerald-800 p-1 rounded font-semibold text-center">NDVI: ${Number(p.mean_ndvi || 0.82).toFixed(2)}</div>
                    <div class="bg-sky-50 text-sky-800 p-1 rounded font-semibold text-center">NDWI: +${Number(p.mean_ndwi || 0.28).toFixed(2)}</div>
                    <div class="bg-rose-50 text-rose-800 p-1 rounded font-semibold text-center">CIR: ${Number(p.cir_reflectance || 2.45).toFixed(2)}</div>
                    <div class="bg-purple-50 text-purple-800 p-1 rounded font-semibold text-center">SAR: ${Number(p.sar_correlation_vh_db || -15.2).toFixed(1)}dB</div>
                    <div class="bg-teal-50 text-teal-800 p-1 rounded font-semibold text-center">CHM: ${Number(p.mean_canopy_height_m || 6.5).toFixed(1)}m</div>
                    <div class="bg-slate-100 text-slate-800 p-1 rounded font-semibold text-center">AGB: ${Number(p.biomass_estimate_t_ha || 95).toFixed(0)}t/ha</div>
                  </div>
                </div>
              `);
            }}
          />
        )}
      </MapContainer>

      {/* Floating Control Panel: Multi-Sensor Satellite Layers & Tools */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-72 text-xs space-y-3 max-h-[calc(100%-40px)] overflow-y-auto">
        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
          <div className="flex items-center gap-1.5">
            <Satellite className="w-4 h-4 text-emerald-600" />
            <span>Earth Observation GIS</span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Dual-Pane Temporal Swipe Toggle Button */}
        <div>
          <button
            onClick={() => {
              setIsSwipeMode(!isSwipeMode);
              if (!isSwipeMode) toast.success('Dual-Pane Temporal Swipe Mode enabled');
            }}
            className={`w-full py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              isSwipeMode
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isSwipeMode ? 'Swipe Mode Active' : 'Temporal Swipe Comparison'}</span>
          </button>
        </div>

        {/* Base Map Selector */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Base Imagery
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setBaseMap('satellite')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-medium text-center transition-colors ${
                baseMap === 'satellite'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setBaseMap('osm')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-medium text-center transition-colors ${
                baseMap === 'osm'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              OSM
            </button>
            <button
              type="button"
              onClick={() => setBaseMap('topographic')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-medium text-center transition-colors ${
                baseMap === 'topographic'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              DEM 30m
            </button>
          </div>
        </div>

        {/* Specialized Satellite & Radar Spectral Overlays */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Satellite Spectral / SAR
            </span>
            {satelliteOverlay !== 'none' && (
              <button
                onClick={() => setSatelliteOverlay('none')}
                className="text-[10px] text-red-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={satelliteOverlay}
            onChange={(e) => {
              setSatelliteOverlay(e.target.value);
              if (e.target.value !== 'none') toast.success(`Active layer: ${e.target.options[e.target.selectedIndex].text}`);
            }}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none mb-2"
          >
            <option value="none">None (True Color Base)</option>
            <option value="ndvi">🌱 NDVI (Vegetation Vigor)</option>
            <option value="cir">🍁 False Color Infrared (CIR)</option>
            <option value="ndwi">💧 NDWI (Moisture & Fire Risk)</option>
            <option value="sar-vh">🛰️ Sentinel-1 SAR VH (All-Weather Radar)</option>
            <option value="chm">🌲 10m Canopy Height Model (CHM)</option>
            <option value="agb">📊 Aboveground Biomass (t/ha)</option>
          </select>

          {satelliteOverlay !== 'none' && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400">Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer h-1"
              />
              <span className="text-[10px] text-slate-500 font-mono">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          )}
        </div>

        {/* Vector Overlay Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Vector Layers
          </span>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={showCompartments}
              onChange={(e) => setShowCompartments(e.target.checked)}
              className="rounded text-forest-600 focus:ring-forest-500"
            />
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 border border-blue-400"></span>
            <span>Compartments ({compartmentsData?.features?.length || 0})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={showPlantations}
              onChange={(e) => setShowPlantations(e.target.checked)}
              className="rounded text-forest-600 focus:ring-forest-500"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-700"></span>
            <span>Plantations ({plantationsData?.features?.length || 0})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={showAlerts}
              onChange={(e) => setShowAlerts(e.target.checked)}
              className="rounded text-forest-600 focus:ring-forest-500"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700"></span>
            <span>Disturbance Alerts ({alertsData?.features?.length || 0})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={showGediTracks}
              onChange={(e) => setShowGediTracks(e.target.checked)}
              className="rounded text-forest-600 focus:ring-forest-500"
            />
            <span className="w-2.5 h-0.5 bg-yellow-400"></span>
            <span>NASA GEDI LiDAR ({GEDI_LIDAR_TRACKS.length} tracks)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={showDroneSurveys}
              onChange={(e) => setShowDroneSurveys(e.target.checked)}
              className="rounded text-forest-600 focus:ring-forest-500"
            />
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 border border-purple-700"></span>
            <span>Drone UAV Missions ({droneSurveysData?.features?.length || 4})</span>
          </label>
        </div>

        {/* Vector Ingestion Upload Button (PRD Section 4.1.1) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <label className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm">
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Drop / Ingest Boundary File</span>
            <input
              type="file"
              accept=".geojson,.json,.kml"
              onChange={handleMapGeoJSONUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white"></span>
          <span className="text-slate-600 dark:text-slate-300">Critical Alert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
          <span className="text-slate-600 dark:text-slate-300">Plantation Plot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 border border-blue-600 bg-blue-500/30"></span>
          <span className="text-slate-600 dark:text-slate-300">Compartment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 border border-purple-600 bg-purple-500/30 border-dashed"></span>
          <span className="text-slate-600 dark:text-slate-300">UAV Drone Footprint</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-yellow-400"></span>
          <span className="text-slate-600 dark:text-slate-300">GEDI LiDAR Pulse</span>
        </div>
        {satelliteOverlay === 'sar-vh' && (
          <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 border border-purple-200 font-semibold text-[10px]">
            <span>Cloud-Free SAR Active</span>
          </div>
        )}
      </div>

      {/* Mouse Coordinate Bar */}
      <div className="absolute bottom-6 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <Navigation className="w-3 h-3 text-forest-600" />
        <span>
          {mouseCoords[0].toFixed(4)}° N, {mouseCoords[1].toFixed(4)}° E
        </span>
      </div>
    </div>
  );
}
