const BASE_URL = '/api';

/**
 * Helper to build query parameters
 */
function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Generic API request handler
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, error);
    throw error;
  }
}

// ==========================================
// Dashboard & Analytics
// ==========================================
export const fetchDashboardAnalytics = () => request('/analytics/dashboard');

// ==========================================
// Divisions
// ==========================================
export const fetchDivisions = (params) => request(`/divisions${buildQueryString(params)}`);
export const createDivision = (data) => request('/divisions', { method: 'POST', body: JSON.stringify(data) });
export const updateDivision = (id, data) => request(`/divisions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDivision = (id) => request(`/divisions/${id}`, { method: 'DELETE' });
export const syncDivisionsSatellite = (divisionId = null) => {
  const url = divisionId ? `/divisions/satellite-sync?division_id=${divisionId}` : '/divisions/satellite-sync';
  return request(url, { method: 'POST' });
};
export const fetchDivisionLiveSatellite = (divisionId) => request(`/divisions/${divisionId}/satellite-live`);

// ==========================================
// Compartments
// ==========================================
export const fetchCompartments = (params) => request(`/compartments${buildQueryString(params)}`);
export const createCompartment = (data) => request('/compartments', { method: 'POST', body: JSON.stringify(data) });
export const updateCompartment = (id, data) => request(`/compartments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCompartment = (id) => request(`/compartments/${id}`, { method: 'DELETE' });
export const fetchCompartmentsGeoJSON = () => request('/compartments/geojson');
export const calculateCompartmentTelemetry = (lat, lng, area_ha = 300, forest_type = null, canopy_density = null) => {
  let url = `/compartments/calculate-telemetry?lat=${lat}&lng=${lng}&area_ha=${area_ha}`;
  if (forest_type) url += `&forest_type=${encodeURIComponent(forest_type)}`;
  if (canopy_density !== null && canopy_density !== undefined) url += `&canopy_density=${canopy_density}`;
  return request(url);
};
export const importCompartmentsGeoJSON = (geojsonData) => request('/compartments/import-geojson', { method: 'POST', body: JSON.stringify(geojsonData) });
export const importPillarsCompartment = (data) => request('/compartments/import-pillars', { method: 'POST', body: JSON.stringify(data) });

// ==========================================
// Plantations
// ==========================================
export const fetchPlantations = (params) => request(`/plantations${buildQueryString(params)}`);
export const createPlantation = (data) => request('/plantations', { method: 'POST', body: JSON.stringify(data) });
export const updatePlantation = (id, data) => request(`/plantations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePlantation = (id) => request(`/plantations/${id}`, { method: 'DELETE' });
export const fetchPlantationsGeoJSON = () => request('/plantations/geojson');
export const calculatePlantationTelemetry = (lat, lng, area_ha = 10, species = null, planting_year = null, survival_rate = null) => {
  let url = `/plantations/calculate-telemetry?lat=${lat}&lng=${lng}&area_ha=${area_ha}`;
  if (species) url += `&species=${encodeURIComponent(species)}`;
  if (planting_year) url += `&planting_year=${planting_year}`;
  if (survival_rate !== null && survival_rate !== undefined) url += `&survival_rate=${survival_rate}`;
  return request(url);
};

// ==========================================
// Sample Plots
// ==========================================
export const fetchSamplePlots = (params) => request(`/sample-plots${buildQueryString(params)}`);
export const createSamplePlot = (data) => request('/sample-plots', { method: 'POST', body: JSON.stringify(data) });
export const updateSamplePlot = (id, data) => request(`/sample-plots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSamplePlot = (id) => request(`/sample-plots/${id}`, { method: 'DELETE' });

// ==========================================
// Tree Measurements
// ==========================================
export const fetchTreeMeasurements = (params) => request(`/tree-measurements${buildQueryString(params)}`);
export const createTreeMeasurement = (data) => request('/tree-measurements', { method: 'POST', body: JSON.stringify(data) });
export const updateTreeMeasurement = (id, data) => request(`/tree-measurements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTreeMeasurement = (id) => request(`/tree-measurements/${id}`, { method: 'DELETE' });

// ==========================================
// Alerts
// ==========================================
export const fetchAlerts = (params) => request(`/alerts${buildQueryString(params)}`);
export const createAlert = (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) });
export const updateAlert = (id, data) => request(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAlert = (id) => request(`/alerts/${id}`, { method: 'DELETE' });
export const updateAlertStatus = (id, status) => request(`/alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const assignAlert = (id, data) => request(`/alerts/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) });
export const fetchAlertsGeoJSON = () => request('/alerts/geojson');

// ==========================================
// Field Inspections
// ==========================================
export const fetchFieldInspections = (params) => request(`/field-inspections${buildQueryString(params)}`);
export const createFieldInspection = (data) => request('/field-inspections', { method: 'POST', body: JSON.stringify(data) });
export const updateFieldInspection = (id, data) => request(`/field-inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFieldInspection = (id) => request(`/field-inspections/${id}`, { method: 'DELETE' });

// ==========================================
// Carbon MRV Reports
// ==========================================
export const fetchCarbonReports = (params) => request(`/carbon-reports${buildQueryString(params)}`);
export const createCarbonReport = (data) => request('/carbon-reports', { method: 'POST', body: JSON.stringify(data) });
export const updateCarbonReport = (id, data) => request(`/carbon-reports/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCarbonReport = (id) => request(`/carbon-reports/${id}`, { method: 'DELETE' });

// ==========================================
// Audit Logs & Users
// ==========================================
export const fetchAuditLog = (params) => request(`/audit-log${buildQueryString(params)}`);
export const fetchUsers = (params) => request(`/users${buildQueryString(params)}`);

// ==========================================
// Satellite & Earth Observation (PRD Module 1)
// ==========================================
export const fetchSatelliteLayers = () => request('/satellite/layers');
export const fetchSatelliteScenes = (params) => request(`/satellite/scenes${buildQueryString(params)}`);
export const fetchSatelliteScene = (id) => request(`/satellite/scenes/${id}`);
export const createSatelliteScene = (data) => request('/satellite/scenes', { method: 'POST', body: JSON.stringify(data) });
export const updateSatelliteScene = (id, data) => request(`/satellite/scenes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSatelliteScene = (id) => request(`/satellite/scenes/${id}`, { method: 'DELETE' });
export const triggerSatelliteFusion = (division = 'Kamrup East') => request(`/satellite/run-fusion?division_name=${encodeURIComponent(division)}`, { method: 'POST' });
export const fetchTemporalComparison = (division = 'Kamrup East') => request(`/satellite/temporal-comparison?division=${encodeURIComponent(division)}`);

// ==========================================
// Drone & UAV Surveys
// ==========================================
export const fetchDroneSurveys = (params) => request(`/drone-surveys${buildQueryString(params)}`);
export const fetchDroneSurvey = (id) => request(`/drone-surveys/${id}`);
export const createDroneSurvey = (data) => request('/drone-surveys', { method: 'POST', body: JSON.stringify(data) });
export const updateDroneSurvey = (id, data) => request(`/drone-surveys/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDroneSurvey = (id) => request(`/drone-surveys/${id}`, { method: 'DELETE' });
export const runAICrownCount = (id) => request(`/drone-surveys/${id}/run-ai-crown-count`, { method: 'POST' });
export const fetchDroneSurveysGeoJSON = () => request('/drone-surveys/geojson');
export const uploadDroneFile = async (formData) => {
  const response = await fetch('/api/drone-surveys/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to upload drone file');
  }
  return response.json();
};
export const fetchUploadedDroneFiles = () => request('/drone-surveys/uploaded-files');

// ==========================================
// Official Government Portals & Standards
// ==========================================
export const fetchGovernmentResources = (params) => request(`/government-resources${buildQueryString(params)}`);
export const fetchGovernmentResourcesSummary = () => request('/government-resources/summary');

// ==========================================
// IPCC AFOLU Carbon Calculation Engine
// ==========================================
export const calculateIPCCCarbon = (data) => request('/carbon-reports/calculate-ipcc', {
  method: 'POST',
  body: JSON.stringify(data),
});




// ==========================================
// Multi-Sensor Satellite Records (Optical + SAR)
// ==========================================
export const fetchSatelliteRecords = (params) => request(`/satellite-records${buildQueryString(params)}`);
export const createSatelliteRecord = (data) => request('/satellite-records', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateSatelliteRecord = (id, data) => request(`/satellite-records/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteSatelliteRecord = (id) => request(`/satellite-records/${id}`, {
  method: 'DELETE',
});

// ==========================================
// Carbon Credit Assessments & Traceability
// ==========================================
export const fetchCarbonCredits = (params) => request(`/carbon-credits${buildQueryString(params)}`);
export const createCarbonCredit = (data) => request('/carbon-credits', {
  method: 'POST',
  body: JSON.stringify(data),
});

// ==========================================
// AI/ML Multi-Sensor Predictive Models
// ==========================================
export const mlPredictBiomass = (data) => request('/ml/predict-biomass', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const mlSegmentTrees = (data) => request('/ml/segment-trees', {
  method: 'POST',
  body: JSON.stringify(data),
});
