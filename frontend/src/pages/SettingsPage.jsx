import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Clock,
  ShieldAlert,
  Database,
  CheckCircle2
} from 'lucide-react';
import { getSettings, updateSettings, getHealth } from '../api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    sla_high_hours: 14.0,
    sla_medium_hours: 24.0,
    sla_low_hours: 48.0,
    anomaly_contamination: 0.05,
    clustering_k: 4,
  });
  const [health, setHealth] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch (err) {
      console.log('Error fetching settings:', err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await getHealth();
      setHealth(res.data);
    } catch (err) {
      console.log('Error fetching health:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHealth();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(settings);
      setMessage('System configurations updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert('Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <Settings className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Platform & Algorithm Configuration</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">System Settings & SLA Thresholds</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
          Tune operational turnaround commitments, machine learning sensitivity, and dataset clustering parameters.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#ADEBD9]/30 border border-[#ADEBD9] text-[#01110A] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-[#3B4A34]" />
          <span>{message}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* SLA Thresholds Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3B4A34]" />
              <span>Service Level Agreement (SLA) Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-[#01110A] block mb-1">
                  High Priority SLA (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.sla_high_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, sla_high_hours: parseFloat(e.target.value) || 14.0 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                />
                <span className="text-[10px] text-[#99AFA9] mt-1 block">Express orders target</span>
              </div>

              <div>
                <label className="font-bold text-[#01110A] block mb-1">
                  Medium Priority SLA (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.sla_medium_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, sla_medium_hours: parseFloat(e.target.value) || 24.0 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                />
                <span className="text-[10px] text-[#99AFA9] mt-1 block">Standard fulfillment commitment</span>
              </div>

              <div>
                <label className="font-bold text-[#01110A] block mb-1">
                  Low Priority SLA (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.sla_low_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, sla_low_hours: parseFloat(e.target.value) || 48.0 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                />
                <span className="text-[10px] text-[#99AFA9] mt-1 block">Economy routing threshold</span>
              </div>
            </div>
          </div>

          {/* Machine Learning Parameters */}
          <div className="space-y-4 pt-5 border-t border-[#99AFA9]/20">
            <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#3B4A34]" />
              <span>Machine Learning Sensitivity Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#01110A] block mb-1">
                  Isolation Forest Contamination: {(settings.anomaly_contamination * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={settings.anomaly_contamination}
                  onChange={(e) =>
                    setSettings({ ...settings, anomaly_contamination: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#01110A] cursor-pointer"
                />
                <span className="text-[10px] text-[#99AFA9] mt-1 block">
                  Proportion of expected outliers flagged by Isolation Forest.
                </span>
              </div>

              <div>
                <label className="font-bold text-[#01110A] block mb-1">
                  K-Means Number of Clusters (k = {settings.clustering_k})
                </label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={settings.clustering_k}
                  onChange={(e) =>
                    setSettings({ ...settings, clustering_k: parseInt(e.target.value) || 4 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                />
                <span className="text-[10px] text-[#99AFA9] mt-1 block">
                  Cluster partitions for case behavior segmentation.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-bold shadow-md shadow-[#01110A]/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database & Runtime Diagnostics Card */}
      <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
        <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#3B4A34]" />
          <span>Backend & Database Infrastructure</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
            <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Database Engine</span>
            <span className="font-black text-[#01110A] mt-1 block">SQLite (PostgreSQL Ready)</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
            <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">ORM Layer</span>
            <span className="font-black text-[#01110A] mt-1 block">SQLAlchemy 2.0</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
            <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Server State</span>
            <span className="font-black text-[#3B4A34] mt-1 block">Online (FastAPI/Uvicorn)</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
            <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Active Cases</span>
            <span className="font-black text-[#01110A] mt-1 block">
              {health?.total_cases ? health.total_cases.toLocaleString() : '2,200'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
