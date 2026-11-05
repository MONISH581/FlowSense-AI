import React, { useState, useEffect } from 'react';
import {
  Network,
  RotateCw,
  GitBranch,
  ArrowRight,
  Clock,
  Workflow
} from 'lucide-react';
import ProcessGraph from '../components/ProcessGraph';
import { getProcessMining } from '../api';

export default function ProcessMiningPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const fetchProcessMining = async () => {
    try {
      setLoading(true);
      const res = await getProcessMining();
      setData(res.data);
      if (res.data.variants && res.data.variants.length > 0) {
        setSelectedVariant(res.data.variants[0]);
      }
    } catch (err) {
      console.error('Error fetching process mining:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessMining();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Reconstructing workflow graph via PM4Py algorithms...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#99AFA9]/30">
        <p className="text-[#3B4A34] font-medium">No process mining model available. Please load a dataset first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
            <Workflow className="w-3.5 h-3.5 text-[#3B4A34]" />
            <span>PM4Py Directly-Follows Graph (DFG)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">Process Mining & Workflow Discovery</h1>
          <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
            Empirical reconstruction of business processes, transition probabilities, variant distributions, and circular rework loops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-[#01110A] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-bold shadow-xs">
            {data.total_variants} Discovered Workflow Paths
          </span>
        </div>
      </div>

      {/* Interactive Process Flow Graph Canvas */}
      <ProcessGraph nodes={data.nodes} edges={data.edges} />

      {/* Process Variants & Rework Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Variants List */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#01110A] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#3B4A34]" />
                <span>Process Path Variants</span>
              </h3>
              <span className="text-xs text-[#99AFA9] font-semibold">Ranked by Volume</span>
            </div>
            <p className="text-xs text-[#99AFA9] mb-4 font-medium">
              Observed execution paths followed by cases from start to completion.
            </p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1">
            {data.variants.map((v) => {
              const isSelected = selectedVariant?.variant_id === v.variant_id;
              return (
                <div
                  key={v.variant_id}
                  onClick={() => setSelectedVariant(v)}
                  className={`p-4 rounded-2xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ADEBD9]/35 border-[#ADEBD9] shadow-sm font-semibold'
                      : 'bg-[#FAFDFC] hover:bg-[#ADEBD9]/15 border-[#99AFA9]/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-[#01110A]">Variant #{v.variant_id}</span>
                    <span className="font-black text-[#01110A] bg-[#ADEBD9] px-2 py-0.5 rounded-full text-[10px]">
                      {v.percentage}% ({v.case_count} cases)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[#3B4A34] text-[11px] mt-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#99AFA9]" />
                      Avg: {v.avg_duration_hours} hrs
                    </span>
                    <span className={`font-bold ${v.delayed_rate > 30 ? 'text-rose-600' : 'text-[#3B4A34]'}`}>
                      {v.delayed_rate}% delayed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle & Right Cols: Selected Variant Step Sequence */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#01110A]">
                Detailed Trajectory: Variant #{selectedVariant?.variant_id || 1}
              </h3>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#01110A] text-[#A0F89C]">
                {selectedVariant?.case_count} cases ({selectedVariant?.percentage}% of volume)
              </span>
            </div>
            <p className="text-xs text-[#99AFA9] mb-6 font-medium">
              Sequential flow of activities for this execution path with turnaround benchmarks and breach probability.
            </p>

            {/* Sequence Path Visualization */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 p-5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/30">
                {selectedVariant?.path.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#3B4A34]/20 text-xs font-bold text-[#01110A] shadow-xs">
                      <span className="w-5 h-5 rounded-full bg-[#01110A] text-[#A0F89C] flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                    {idx < selectedVariant.path.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-[#3B4A34] shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Variant Metrics Breakdown */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-center">
                  <span className="text-[10px] text-[#99AFA9] font-bold uppercase tracking-wider block">Total Span</span>
                  <span className="text-xl font-black text-[#01110A] mt-1 block">{selectedVariant?.avg_duration_hours} hrs</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-center">
                  <span className="text-[10px] text-[#99AFA9] font-bold uppercase tracking-wider block">Delay Probability</span>
                  <span className={`text-xl font-black mt-1 block ${selectedVariant?.delayed_rate > 30 ? 'text-rose-600' : 'text-[#3B4A34]'}`}>
                    {selectedVariant?.delayed_rate}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/25 text-center">
                  <span className="text-[10px] text-[#99AFA9] font-bold uppercase tracking-wider block">Conformance</span>
                  <span className="text-lg font-black text-[#01110A] mt-1 block">
                    {selectedVariant?.variant_id === 1 ? 'Standard Flow' : 'Rework Loop'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rework Loops Table */}
          <div className="mt-8 pt-6 border-t border-[#99AFA9]/20">
            <h4 className="text-xs font-black text-[#01110A] uppercase tracking-wider mb-3 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-[#3B4A34]" />
              <span>Detected Circular Rework Loops (Process Waste)</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#3B4A34]">
                <thead className="bg-[#01110A] text-[#FAFDFC] font-bold uppercase tracking-wider text-[10px] rounded-xl">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">Repeated Activity</th>
                    <th className="py-2.5 px-3">Rework Passes</th>
                    <th className="py-2.5 px-3">Affected Cases</th>
                    <th className="py-2.5 px-3 rounded-r-xl">Impact Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#99AFA9]/20">
                  {data.rework_activities.map((rw, i) => (
                    <tr key={i} className="hover:bg-[#FAFDFC]">
                      <td className="py-2.5 px-3 font-bold text-[#01110A]">{rw.activity}</td>
                      <td className="py-2.5 px-3 font-extrabold text-[#3B4A34]">{rw.rework_occurrences} loops</td>
                      <td className="py-2.5 px-3">{rw.affected_cases} cases</td>
                      <td className="py-2.5 px-3 text-rose-600 font-bold">Adds ~2.5 - 4.2h queue wait</td>
                    </tr>
                  ))}
                  {data.rework_activities.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#99AFA9]">
                        No circular rework loops detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
