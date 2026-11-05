import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { getInsights } from '../api';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await getInsights();
      setInsights(res.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Synthesizing executive process intelligence recommendations...
        </p>
      </div>
    );
  }

  const filteredInsights = insights.filter(
    (ins) => activeCategory === 'ALL' || ins.category.toUpperCase() === activeCategory.toUpperCase()
  );

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          border: 'border-rose-200',
          bg: 'bg-rose-50/15',
          icon: AlertOctagon,
          iconColor: 'text-rose-600',
        };
      case 'Warning':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          border: 'border-amber-200',
          bg: 'bg-amber-50/15',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      case 'Success':
        return {
          badge: 'bg-[#ADEBD9] text-[#01110A] border-[#ADEBD9]',
          border: 'border-[#ADEBD9]',
          bg: 'bg-[#ADEBD9]/10',
          icon: CheckCircle2,
          iconColor: 'text-[#01110A]',
        };
      default:
        return {
          badge: 'bg-[#FAFDFC] text-[#3B4A34] border-[#99AFA9]/40',
          border: 'border-[#99AFA9]/30',
          bg: 'bg-white',
          icon: Lightbulb,
          iconColor: 'text-[#3B4A34]',
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Rule-Based Analytical Expert System</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">AI Insights & Optimization Action Plan</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
          Converts raw process mining metrics and predictive machine learning models into plain-language executive business recommendations.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center flex-wrap gap-2.5">
        {['ALL', 'BOTTLENECK', 'REWORK', 'WORKLOAD', 'SLA', 'RESOURCE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#01110A] text-[#A0F89C] shadow-xs'
                : 'bg-white text-[#3B4A34] border border-[#99AFA9]/30 hover:bg-[#FAFDFC]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insights Cards List */}
      <div className="space-y-5">
        {filteredInsights.map((ins) => {
          const style = getSeverityStyle(ins.severity);
          const Icon = style.icon;

          return (
            <div
              key={ins.id}
              className={`rounded-3xl border ${style.border} ${style.bg} p-6 sm:p-7 shadow-xs hover:shadow-md transition-all`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl bg-white shadow-xs border border-[#99AFA9]/25 shrink-0 ${style.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                        {ins.category} &bull; {ins.severity}
                      </span>
                      <span className="text-xs text-[#99AFA9] font-mono font-bold">{ins.id}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#01110A]">{ins.title}</h3>
                  </div>
                </div>

                <span className="px-3.5 py-1.5 rounded-full bg-[#01110A] border border-[#3B4A34] text-xs font-black text-[#A0F89C] shrink-0 shadow-xs">
                  {ins.metric_value}
                </span>
              </div>

              {/* Observation, Root Cause, Action Plan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-4 border-t border-[#99AFA9]/20">
                <div className="p-4 rounded-2xl bg-white/90 border border-[#99AFA9]/30">
                  <span className="font-black text-[#01110A] uppercase tracking-wider text-[10px] block mb-1">
                    Analytical Observation:
                  </span>
                  <p className="text-[#3B4A34] leading-relaxed font-medium">{ins.observation}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-[#99AFA9]/30">
                  <span className="font-black text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                    Root Cause Diagnosis:
                  </span>
                  <p className="text-[#3B4A34] leading-relaxed font-medium">{ins.root_cause}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#ADEBD9]/25 border border-[#ADEBD9]/60">
                  <span className="font-black text-[#01110A] uppercase tracking-wider text-[10px] block mb-1">
                    Suggested Action Plan:
                  </span>
                  <p className="text-[#01110A] font-semibold leading-relaxed">{ins.suggested_action}</p>
                  <div className="mt-2.5 pt-2 border-t border-[#ADEBD9]/60 text-[#01110A] font-black text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3B4A34]" />
                    <span>Impact: {ins.expected_impact}</span>
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
