import React, { useState } from 'react';
import {
  ArrowRight,
  Clock,
  RotateCw,
  Activity as ActivityIcon,
  X,
  Workflow
} from 'lucide-react';

export default function ProcessGraph({ nodes = [], edges = [], onSelectActivity }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onSelectActivity) onSelectActivity(node.id);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-rose-500/20',
          text: 'text-rose-300',
          border: 'border-rose-500/40',
          ring: 'ring-2 ring-rose-500/30 animate-soft-pulse',
        };
      case 'High':
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/40',
          ring: 'ring-1 ring-amber-500/30',
        };
      case 'Medium':
        return {
          bg: 'bg-[#ADEBD9]/20',
          text: 'text-[#ADEBD9]',
          border: 'border-[#ADEBD9]/40',
          ring: '',
        };
      default:
        return {
          bg: 'bg-[#A0F89C]/20',
          text: 'text-[#A0F89C]',
          border: 'border-[#A0F89C]/40',
          ring: '',
        };
    }
  };

  return (
    <div className="relative bg-[#01110A] rounded-3xl border border-[#3B4A34]/50 p-6 sm:p-8 overflow-hidden shadow-2xl">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#3B4A34_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* Graph Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#3B4A34]/40">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A0F89C] animate-ping"></span>
            <h3 className="text-lg font-black text-[#FAFDFC] tracking-tight">
              Directly-Follows Process Graph (DFG)
            </h3>
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#ADEBD9]/15 text-[#ADEBD9] rounded-full border border-[#ADEBD9]/30">
              PM4Py Algorithm
            </span>
          </div>
          <p className="text-xs text-[#99AFA9] mt-1 font-medium">
            Discovered end-to-end activity transitions, rework patterns, and queue accumulation points. Click any stage to inspect.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-3.5 text-xs text-[#99AFA9] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A0F89C] shadow-xs shadow-[#A0F89C]"></span>
            <span className="text-[#FAFDFC]">Standard Flow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Queue Stalled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/40"></span>
            <span className="text-rose-300 font-bold">Bottleneck</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-[#ADEBD9]" />
            <span className="text-[#ADEBD9]">Rework Loop</span>
          </div>
        </div>
      </div>

      {/* Visual Workflow Canvas */}
      <div className="relative z-10 py-8 overflow-x-auto">
        <div className="min-w-[880px] flex flex-col gap-8">
          {/* Main Nodes Flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {nodes.map((node) => {
              const badge = getSeverityBadge(node.severity);
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`group relative p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#082819] border-[#A0F89C] shadow-xl shadow-[#A0F89C]/20 scale-102 ring-2 ring-[#A0F89C]/40'
                      : 'bg-[#031B10]/80 border-[#3B4A34]/60 hover:bg-[#082819] hover:border-[#ADEBD9]/50 shadow-sm'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border} ${badge.ring}`}
                    >
                      {node.severity}
                    </span>

                    {node.is_rework && (
                      <span
                        className="flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#ADEBD9]/15 text-[#ADEBD9] border border-[#ADEBD9]/30"
                        title="Repeated Activity Loop"
                      >
                        <RotateCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Rework</span>
                      </span>
                    )}
                  </div>

                  {/* Activity Name */}
                  <h4 className="text-sm font-extrabold text-[#FAFDFC] group-hover:text-[#A0F89C] transition-colors line-clamp-1">
                    {node.label}
                  </h4>
                  <p className="text-[11px] text-[#99AFA9] font-medium mb-3">{node.department}</p>

                  {/* Metrics Badges */}
                  <div className="space-y-1.5 pt-2.5 border-t border-[#3B4A34]/50 text-xs">
                    <div className="flex items-center justify-between text-[#FAFDFC]">
                      <span className="flex items-center gap-1 text-[11px] text-[#99AFA9]">
                        <ActivityIcon className="w-3 h-3 text-[#A0F89C]" />
                        Active Exec:
                      </span>
                      <span className="font-bold text-[#A0F89C]">{node.avg_duration_min}m</span>
                    </div>

                    <div className="flex items-center justify-between text-[#FAFDFC]">
                      <span className="flex items-center gap-1 text-[11px] text-[#99AFA9]">
                        <Clock className="w-3 h-3 text-[#ADEBD9]" />
                        Queue Wait:
                      </span>
                      <span
                        className={`font-bold ${
                          node.avg_waiting_min > 90 ? 'text-rose-400' : 'text-[#ADEBD9]'
                        }`}
                      >
                        {node.avg_waiting_min}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#99AFA9] text-[10px]">
                      <span>Throughput:</span>
                      <span className="font-semibold text-[#FAFDFC]">{node.frequency.toLocaleString()} cases</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Process Flow Transitions */}
          <div className="bg-[#031B10]/90 rounded-2xl p-5 border border-[#3B4A34]/50 shadow-inner">
            <p className="text-[11px] font-bold text-[#99AFA9] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Workflow className="w-3.5 h-3.5 text-[#A0F89C]" />
              <span>Directly-Follows Transition Hand-offs (Dominant Workflow Streams)</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {edges.slice(0, 8).map((edge, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#082819]/80 border border-[#3B4A34] text-xs text-[#FAFDFC]"
                >
                  <span className="font-medium text-[#FAFDFC]">{edge.source}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A0F89C] shrink-0" />
                  <span className="font-medium text-[#FAFDFC]">{edge.target}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ADEBD9]/20 text-[#ADEBD9] border border-[#ADEBD9]/30 text-[10px] font-extrabold ml-1">
                    {edge.frequency} cases ({edge.percentage_flow}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Node Inspector Modal / Drawer */}
      {selectedNode && (
        <div className="relative z-20 mt-4 p-6 rounded-2xl bg-[#082819] border border-[#A0F89C]/40 shadow-2xl animate-fadeIn">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-xl font-black text-[#FAFDFC]">{selectedNode.label}</h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ADEBD9]/15 text-[#ADEBD9] border border-[#ADEBD9]/30 font-bold">
                  {selectedNode.department} Department
                </span>
              </div>
              <p className="text-xs text-[#99AFA9] mt-0.5">
                Process Mining Activity Diagnostic & Queue Friction Inspector
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg text-[#99AFA9] hover:text-[#FAFDFC] hover:bg-[#3B4A34]/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#01110A] border border-[#3B4A34]/50">
              <span className="text-[#99AFA9] block text-[11px]">Total Volume</span>
              <p className="text-lg font-black text-[#FAFDFC] mt-1">{selectedNode.frequency.toLocaleString()} cases</p>
            </div>
            <div className="p-4 rounded-xl bg-[#01110A] border border-[#3B4A34]/50">
              <span className="text-[#99AFA9] block text-[11px]">Avg Active Time</span>
              <p className="text-lg font-black text-[#A0F89C] mt-1">{selectedNode.avg_duration_min} minutes</p>
            </div>
            <div className="p-4 rounded-xl bg-[#01110A] border border-[#3B4A34]/50">
              <span className="text-[#99AFA9] block text-[11px]">Idle Queue Wait</span>
              <p className="text-lg font-black text-[#ADEBD9] mt-1">{selectedNode.avg_waiting_min} minutes</p>
            </div>
            <div className="p-4 rounded-xl bg-[#01110A] border border-[#3B4A34]/50">
              <span className="text-[#99AFA9] block text-[11px]">Bottleneck Rating</span>
              <p
                className={`text-lg font-black mt-1 ${
                  selectedNode.severity === 'Critical' ? 'text-rose-400' : 'text-[#A0F89C]'
                }`}
              >
                {selectedNode.severity} Severity
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
