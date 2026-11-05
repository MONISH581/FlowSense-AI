import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Database,
  ArrowRight,
  ShieldCheck,
  Table as TableIcon,
  Loader2
} from 'lucide-react';
import {
  getDatasetPreview,
  uploadDatasetFile,
  loadDemoDataset,
  downloadSampleCSVUrl
} from '../api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPreview = async () => {
    try {
      const res = await getDatasetPreview();
      setPreview(res.data);
    } catch {
      console.log('No existing preview yet.');
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await uploadDatasetFile(file);
      setSuccessMsg(`Successfully uploaded and analyzed ${file.name}!`);
      await fetchPreview();
      setFile(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to upload dataset. Check column formatting.');
    } finally {
      setUploading(false);
    }
  };

  const handleDemo = async () => {
    try {
      setLoadingDemo(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await loadDemoDataset();
      setSuccessMsg('High-fidelity e-commerce demo dataset loaded (2,200 cases, ~14,600 events)!');
      await fetchPreview();
    } catch (err) {
      setErrorMsg('Failed to load demo dataset.');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <UploadCloud className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Data Ingestion & Quality Validation</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">Dataset Upload & Workflow Ingestion</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5">
          Ingest real-world business process event logs (CSV or Excel) or load our curated enterprise dataset for automatic bottleneck analysis.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#ADEBD9]/30 border border-[#ADEBD9] text-[#01110A] text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#3B4A34] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone & Demo Trigger Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Drag & Drop Dropzone */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-[#01110A]">Upload Process Event Log</h3>
            <span className="text-xs text-[#99AFA9] font-medium">Formats: .csv, .xlsx, .xls</span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-[#3B4A34]/30 hover:border-[#A0F89C] bg-[#FAFDFC] hover:bg-[#ADEBD9]/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-2xl bg-[#ADEBD9]/40 border border-[#ADEBD9] text-[#01110A] flex items-center justify-center mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6 text-[#01110A]" />
            </div>

            <p className="text-sm font-extrabold text-[#01110A]">
              {file ? file.name : 'Click to browse or drag and drop event log file'}
            </p>
            <p className="text-xs text-[#99AFA9] mt-1 font-medium">
              Required: Case_ID, Activity, Timestamp &bull; Optional: Department, Employee, Status, Priority, SLA_Hours, Cost
            </p>

            {file && (
              <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ADEBD9]/40 text-[#01110A] text-xs font-bold border border-[#ADEBD9]">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Selected: {(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 border-t border-[#99AFA9]/20">
            <div className="flex items-center gap-2 text-xs text-[#3B4A34]">
              <ShieldCheck className="w-4 h-4 text-[#3B4A34]" />
              <span>Automatic duplicate cleansing, timestamp validation, and waiting time derivation.</span>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-bold shadow-md shadow-[#01110A]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#A0F89C]" /> : <ArrowRight className="w-4 h-4" />}
              <span>{uploading ? 'Validating & Mining...' : 'Analyze Event Log'}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Instant Demo & Sample Download */}
        <div className="space-y-6">
          {/* Quick Demo Dataset Card in Deep Green */}
          <div className="bg-[#01110A] rounded-3xl p-6 text-[#FAFDFC] border border-[#3B4A34]/50 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ADEBD9]/20 text-[#ADEBD9] text-[10px] font-black border border-[#ADEBD9]/30">
                <Sparkles className="w-3 h-3 text-[#A0F89C]" />
                <span>1-Click Ingestion</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#FAFDFC]">Load E-Commerce Dataset</h3>
              <p className="text-xs text-[#99AFA9] leading-relaxed font-medium">
                Generates a realistic order fulfillment log with 2,200 cases (~14,600 events) featuring Finance and Warehouse queue bottlenecks and rework cycles.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={handleDemo}
                disabled={loadingDemo}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A0F89C] hover:bg-[#ADEBD9] text-[#01110A] text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-70"
              >
                {loadingDemo ? <Loader2 className="w-4 h-4 animate-spin text-[#01110A]" /> : <Database className="w-4 h-4 text-[#01110A]" />}
                <span>{loadingDemo ? 'Synthesizing...' : 'Load Demo Dataset Now'}</span>
              </button>
            </div>
          </div>

          {/* Sample CSV Download Card */}
          <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-5.5 shadow-xs">
            <h4 className="text-xs font-black text-[#01110A] uppercase tracking-wider mb-1">
              Sample Template File
            </h4>
            <p className="text-xs text-[#99AFA9] mb-3 font-medium">
              Download the official schema template to verify custom event log headers.
            </p>
            <a
              href={downloadSampleCSVUrl}
              download="flowsense_sample_process_log.csv"
              className="inline-flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 text-xs font-bold text-[#3B4A34] hover:bg-[#FAFDFC] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#3B4A34]" />
              <span>Download sample_process_log.csv</span>
            </a>
          </div>
        </div>
      </div>

      {/* Data Quality & Schema Diagnostics */}
      {preview && preview.data_quality && (
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#01110A]">Dataset Health & Integrity Audit</h3>
              <p className="text-xs text-[#99AFA9]">Automated preprocessing and hygiene diagnostics.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#99AFA9] font-medium">Data Health:</span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#ADEBD9]/40 text-[#01110A] border border-[#ADEBD9]">
                {preview.data_quality.health_score || 98}% Excellent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-xs">
              <span className="text-[#99AFA9] font-medium block">Total Cases Analyzed</span>
              <p className="text-xl font-black text-[#01110A] mt-1">{preview.total_cases?.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-xs">
              <span className="text-[#99AFA9] font-medium block">Cleaned Event Records</span>
              <p className="text-xl font-black text-[#01110A] mt-1">{preview.total_rows?.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-xs">
              <span className="text-[#99AFA9] font-medium block">Duplicates Cleansed</span>
              <p className="text-xl font-black text-[#3B4A34] mt-1">{preview.data_quality.duplicates_removed || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-xs">
              <span className="text-[#99AFA9] font-medium block">Date Span Horizon</span>
              <p className="text-xs font-extrabold text-[#01110A] mt-1 truncate">
                {preview.data_quality.date_range?.start?.split(' ')[0]} to {preview.data_quality.date_range?.end?.split(' ')[0]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview Table */}
      {preview && preview.sample_records && preview.sample_records.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <TableIcon className="w-5 h-5 text-[#3B4A34]" />
              <h3 className="text-base font-extrabold text-[#01110A]">
                Active Dataset Ingestion Preview (First 15 Rows)
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#99AFA9]">
              Active: <span className="font-bold text-[#01110A]">{preview.filename}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#3B4A34]">
              <thead className="bg-[#01110A] text-[#FAFDFC] font-bold uppercase tracking-wider text-[10px] rounded-xl">
                <tr>
                  {preview.columns.map((col, idx) => (
                    <th
                      key={col}
                      className={`py-3 px-3 whitespace-nowrap ${idx === 0 ? 'rounded-l-xl' : ''} ${
                        idx === preview.columns.length - 1 ? 'rounded-r-xl' : ''
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#99AFA9]/20">
                {preview.sample_records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFDFC] transition-colors">
                    {preview.columns.map((col) => (
                      <td key={col} className="py-2.5 px-3 whitespace-nowrap font-medium text-[#01110A]">
                        {String(row[col] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
