import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach Bearer token to all requests if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowsense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication APIs
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');
export const logoutUser = () => {
  localStorage.removeItem('flowsense_token');
  localStorage.removeItem('flowsense_user');
};

// Dataset Management APIs
export const getDatasets = () => api.get('/datasets');
export const activateDataset = (id) => api.post(`/datasets/${id}/activate`);
export const deleteDataset = (id) => api.delete(`/datasets/${id}`);

// Analytics & Subsystems APIs
export const getHealth = () => api.get('/health');
export const getDashboardKPIs = (params = {}) => api.get('/dashboard', { params });
export const getDatasetPreview = (params = {}) => api.get('/dataset/preview', { params });
export const uploadDatasetFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const loadDemoDataset = () => api.post('/load-demo');
export const getProcessMining = (params = {}) => api.get('/process-mining', { params });
export const getBottlenecks = (params = {}) => api.get('/bottlenecks', { params });
export const getModelEvaluation = (params = {}) => api.get('/model-evaluation', { params });
export const predictDelay = (payload) => api.post('/predict-delay', payload);
export const getAnomalies = (params = {}) => api.get('/anomalies', { params });
export const getClusters = (params = {}) => api.get('/clusters', { params });
export const getInsights = (params = {}) => api.get('/insights', { params });
export const runSimulation = (payload) => api.post('/simulation', payload);
export const getSettings = () => api.get('/settings');
export const updateSettings = (settings) => api.post('/settings', settings);

export const downloadSampleCSVUrl = `${API_BASE_URL}/sample-csv`;
export const downloadPdfReportUrl = `${API_BASE_URL}/reports/download/pdf`;
export const downloadCsvReportUrl = `${API_BASE_URL}/reports/download/csv`;

export default api;
