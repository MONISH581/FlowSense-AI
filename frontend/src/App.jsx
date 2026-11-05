import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProcessMiningPage from './pages/ProcessMiningPage';
import BottleneckDetectionPage from './pages/BottleneckDetectionPage';
import DelayPredictionPage from './pages/DelayPredictionPage';
import AnomalyDetectionPage from './pages/AnomalyDetectionPage';
import ClusteringPage from './pages/ClusteringPage';
import AIInsightsPage from './pages/AIInsightsPage';
import SimulationPage from './pages/SimulationPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { getDatasetPreview } from './api';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(null);

  const fetchDatasetInfo = async () => {
    try {
      const res = await getDatasetPreview();
      setDatasetInfo(res.data);
    } catch {
      console.log('No active dataset preview yet.');
    }
  };

  useEffect(() => {
    fetchDatasetInfo();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFDFC] text-[#01110A] flex selection:bg-[#A0F89C] selection:text-[#01110A]">
        {/* Deep Green Enterprise Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-[#01110A]/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-68 transition-all">
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            datasetInfo={datasetInfo}
            onDatasetLoaded={() => {
              fetchDatasetInfo();
            }}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/process-mining" element={<ProcessMiningPage />} />
              <Route path="/bottlenecks" element={<BottleneckDetectionPage />} />
              <Route path="/delay-prediction" element={<DelayPredictionPage />} />
              <Route path="/anomalies" element={<AnomalyDetectionPage />} />
              <Route path="/clustering" element={<ClusteringPage />} />
              <Route path="/insights" element={<AIInsightsPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
