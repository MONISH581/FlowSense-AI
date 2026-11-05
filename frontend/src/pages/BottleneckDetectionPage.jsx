import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Workflow
} from 'lucide-react';
import { getBottlenecks } from '../api';

export default function BottleneckDetectionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBottlenecks = async () => {
    try {
      setLoading(true);
      const res = await getBottlenecks();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching bottlenecks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBottlenecks();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Calculating multi-factor bottleneck friction scores...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#99AFA9]/30">
        <p className="text-[#3B4A34] font-medium">No bottleneck analysis available. Please load a dataset first.</p>
      </div>
    );
  }

  const filteredBottlenecks = data.bottlenecks.filter((b) => {
    const matchesSeverity =
      severityFilter === 'ALL' || b.severity.toUpperCase() === severityFilter.toUpperCase();
    const matchesSearch =
      b.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <Workflow className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Multi-Factor Friction & Queue Diagnostic Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">Bottleneck Detection & Queue Friction</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
          Identifies workflow bottlenecks considering transition queue waiting, active execution time, case volume, and SLA violation correlations.
        </p>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Critical Severity</span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black mt-2 text-rose-950">{data.critical_count}</p>
          <span className="text-[11px] text-rose-700 font-medium">Immediate friction hazard</span>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">High Severity</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black mt-2 text-amber-950">{data.high_count}</p>
          <span className="text-[11px] text-amber-700 font-medium">Substantial queue buffer</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#ADEBD9]/25 border border-[#ADEBD9] text-[#01110A] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#3B4A34]">Medium Severity</span>
            <Clock className="w-5 h-5 text-[#3B4A34]" />
          </div>
          <p className="text-3xl font-black mt-2 text-[#01110A]">{data.medium_count}</p>
          <span className="text-[11px] text-[#3B4A34] font-medium">Minor queue friction</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#FAFDFC] border border-[#99AFA9]/30 text-[#01110A] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#3B4A34]">Normal Stages</span>
            <CheckCircle2 className="w-5 h-5 text-[#A0F89C]" />
          </div>
          <p className="text-3xl font-black mt-2 text-[#01110A]">{data.low_count}</p>
          <span className="text-[11px] text-[#99AFA9] font-medium">Smooth throughput</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-[#99AFA9]/30 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#99AFA9] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#99AFA9]/30 focus:outline-none focus:ring-2 focus:ring-[#A0F89C] w-64 bg-[#FAFDFC] text-[#01110A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#99AFA9]" />
          <span className="text-xs text-[#99AFA9] font-semibold">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                severityFilter === sev
                  ? 'bg-[#01110A] text-[#A0F89C] shadow-xs'
                  : 'bg-[#FAFDFC] text-[#3B4A34] hover:bg-[#ADEBD9]/20 border border-[#99AFA9]/25'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Bottlenecks Detailed Cards List */}
      <div className="space-y-4.5">
        {filteredBottlenecks.map((b) => {
          const isCritical = b.severity === 'Critical';
          const isHigh = b.severity === 'High';
          const isMed = b.severity === 'Medium';

          const cardBorder = isCritical
            ? 'border-rose-300 bg-white'
            : isHigh
            ? 'border-amber-300 bg-white'
            : isMed
            ? 'border-[#ADEBD9] bg-white'
            : 'border-[#99AFA9]/30 bg-white';

          const badgeClass = isCritical
            ? 'bg-rose-600 text-white animate-soft-pulse'
            : isHigh
            ? 'bg-amber-600 text-white'
            : isMed
            ? 'bg-[#ADEBD9] text-[#01110A]'
            : 'bg-[#A0F89C] text-[#01110A]';

          return (
            <div
              key={b.activity}
              className={`rounded-3xl border ${cardBorder} p-6 sm:p-7 shadow-xs hover:shadow-md transition-all`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#99AFA9]/20">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${badgeClass}`}>
                      {b.severity} Bottleneck
                    </span>
                    <h3 className="text-lg font-black text-[#01110A]">{b.activity}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAFDFC] text-[#3B4A34] border border-[#99AFA9]/30 font-bold">
                      {b.department}
                    </span>
                  </div>
                  <p className="text-xs text-[#99AFA9] mt-1 font-medium">
                    Throughput: {b.cases_affected.toLocaleString()} cases &bull; {b.delay_percentage}% of cases passing through suffer delayed completion.
                  </p>
                </div>

                {/* Composite Bottleneck Score Bar */}
                <div className="flex items-center gap-3 bg-[#FAFDFC] px-4 py-2.5 rounded-2xl border border-[#99AFA9]/30 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#99AFA9] block">Friction Index</span>
                    <span className={`text-xl font-black ${isCritical ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-[#01110A]'}`}>
                      {b.bottleneck_score}/100
                    </span>
                  </div>
                  <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : isMed ? 'bg-[#ADEBD9]' : 'bg-[#A0F89C]'
                      }`}
                      style={{ width: `${Math.min(100, b.bottleneck_score)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/20">
                  <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Avg Queue Waiting</span>
                  <span className={`text-base font-black ${b.avg_waiting_time_min > 90 ? 'text-rose-600' : 'text-[#01110A]'}`}>
                    {b.avg_waiting_time_min} min
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/20">
                  <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Avg Processing</span>
                  <span className="text-base font-black text-[#3B4A34]">{b.avg_processing_time_min} min</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/20">
                  <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Max Processing</span>
                  <span className="text-base font-black text-[#01110A]">{b.max_processing_time_min} min</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/20">
                  <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">Delayed Orders</span>
                  <span className="text-base font-black text-rose-600">{b.delay_frequency} cases</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/20">
                  <span className="text-[#99AFA9] block text-[10px] font-bold uppercase">SLA Breach Rate</span>
                  <span className="text-base font-black text-[#01110A]">{b.sla_violation_rate}%</span>
                </div>
              </div>

              {/* Contextual Reason & Suggested Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 text-xs border-t border-[#99AFA9]/20">
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/30">
                  <HelpCircle className="w-4 h-4 text-[#3B4A34] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-[#01110A] block mb-0.5">Identified Root Cause:</span>
                    <p className="text-[#3B4A34] leading-relaxed font-medium">{b.possible_reason}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-[#ADEBD9]/20 border border-[#ADEBD9]/60">
                  <Lightbulb className="w-4 h-4 text-[#01110A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-[#01110A] block mb-0.5">Recommended Remediation:</span>
                    <p className="text-[#01110A] leading-relaxed font-semibold">{b.suggested_action}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
