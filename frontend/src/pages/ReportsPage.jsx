import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ArrowDownToLine,
  Printer
} from 'lucide-react';
import {
  getDashboardKPIs,
  getBottlenecks,
  getModelEvaluation,
  getInsights,
  downloadPdfReportUrl,
  downloadCsvReportUrl
} from '../api';

export default function ReportsPage() {
  const [kpis, setKpis] = useState(null);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [kpiRes, bnRes, mlRes, insRes] = await Promise.all([
        getDashboardKPIs(),
        getBottlenecks(),
        getModelEvaluation(),
        getInsights(),
      ]);
      setKpis(kpiRes.data);
      setBottlenecks(bnRes.data.bottlenecks || []);
      setMlMetrics(mlRes.data);
      setInsights(insRes.data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Compiling executive intelligence report...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Title & Download Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#99AFA9]/30 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5 text-[#3B4A34]" />
            <span>Automated Audit Export</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">Analytical Reports & Data Exports</h1>
          <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
            Generate and download comprehensive executive PDF briefings and raw case-level CSV exports.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-3">
          <a
            href={downloadCsvReportUrl}
            download="flowsense_analyzed_cases.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#99AFA9]/40 text-[#01110A] hover:bg-[#FAFDFC] text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-[#3B4A34]" />
            <span>Export CSV</span>
          </a>

          <a
            href={downloadPdfReportUrl}
            download="flowsense_process_intelligence_report.pdf"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-black shadow-md shadow-[#01110A]/20 transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download Official PDF Report</span>
          </a>
        </div>
      </div>

      {/* In-Browser Document Preview */}
      <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-8 sm:p-10 shadow-sm space-y-8">
        {/* Document Header */}
        <div className="border-b border-[#99AFA9]/25 pb-6 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#3B4A34] block mb-1">
              FlowSense AI Enterprise Intelligence
            </span>
            <h2 className="text-2xl font-black text-[#01110A]">
              Process Mining & Operational Bottleneck Audit Report
            </h2>
            <p className="text-xs text-[#99AFA9] mt-1 font-medium">
              Automated Business Intelligence &bull; Date: {new Date().toLocaleDateString()} &bull; Scope: E-Commerce Fulfillment Workflow
            </p>
          </div>
          <div className="p-3 bg-[#FAFDFC] border border-[#99AFA9]/30 rounded-2xl">
            <Printer className="w-5 h-5 text-[#3B4A34]" />
          </div>
        </div>

        {/* Section 1: Executive KPI Scorecard */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider">
            1. Executive Operational Scorecard
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
              <span className="text-[#99AFA9] font-medium block">Total Volume</span>
              <span className="text-lg font-black text-[#01110A]">{kpis?.total_processes?.toLocaleString()} cases</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
              <span className="text-[#99AFA9] font-medium block">Delayed Cases</span>
              <span className="text-lg font-black text-rose-600">
                {kpis?.delayed_processes} ({kpis?.delayed_percentage}%)
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
              <span className="text-[#99AFA9] font-medium block">Avg Duration</span>
              <span className="text-lg font-black text-[#3B4A34]">{kpis?.avg_completion_time_hours} hrs</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25">
              <span className="text-[#99AFA9] font-medium block">SLA Compliance</span>
              <span className="text-lg font-black text-[#01110A]">{kpis?.sla_compliance_rate}%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Bottleneck Findings Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider">
            2. Identified Process Bottlenecks
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#3B4A34] border border-[#99AFA9]/25 rounded-2xl overflow-hidden">
              <thead className="bg-[#01110A] text-[#FAFDFC] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Queue Wait</th>
                  <th className="py-2.5 px-3">Processing</th>
                  <th className="py-2.5 px-3">Delay Rate</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#99AFA9]/20">
                {bottlenecks.slice(0, 5).map((b) => (
                  <tr key={b.activity}>
                    <td className="py-2 px-3 font-bold text-[#01110A]">{b.activity}</td>
                    <td className="py-2 px-3">{b.department}</td>
                    <td className="py-2 px-3 text-[#3B4A34] font-extrabold">{b.avg_waiting_time_min}m</td>
                    <td className="py-2 px-3">{b.avg_processing_time_min}m</td>
                    <td className="py-2 px-3 font-bold text-rose-600">{b.delay_percentage}%</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          b.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : b.severity === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-[#ADEBD9]/50 text-[#01110A]'
                        }`}
                      >
                        {b.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Machine Learning Model Evaluation */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider">
            3. Predictive Machine Learning Validation
          </h3>
          <div className="p-4.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/30 text-xs text-[#3B4A34] leading-relaxed">
            <p className="font-medium">
              The system employs a <b>Random Forest Classifier</b> (100 estimators, max depth 12) evaluated on an independent 20% holdout test partition:
            </p>
            <div className="flex flex-wrap gap-4 mt-2 font-bold">
              <span className="text-[#01110A]">&bull; Accuracy: {(mlMetrics?.accuracy * 100).toFixed(1)}%</span>
              <span className="text-[#3B4A34]">&bull; Precision: {(mlMetrics?.precision * 100).toFixed(1)}%</span>
              <span className="text-[#3B4A34]">&bull; Recall: {(mlMetrics?.recall * 100).toFixed(1)}%</span>
              <span className="text-[#01110A]">&bull; F1-Score: {(mlMetrics?.f1_score * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Section 4: Strategic Recommendations */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-[#01110A] uppercase tracking-wider">
            4. Strategic Action Plan & Recommendations
          </h3>
          <div className="space-y-3">
            {insights.slice(0, 3).map((ins) => (
              <div key={ins.id} className="p-4 rounded-2xl bg-[#ADEBD9]/15 border border-[#ADEBD9]/40 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-[#01110A]">[{ins.category}] {ins.title}</span>
                </div>
                <p className="text-[#3B4A34] mb-1.5 font-medium">{ins.suggested_action}</p>
                <span className="text-[#01110A] font-bold text-[11px] block">
                  &bull; Projected Impact: {ins.expected_impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
