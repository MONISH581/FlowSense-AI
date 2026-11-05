import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { getClusters } from '../api';

const clusterColors = ['#A0F89C', '#ADEBD9', '#3B4A34', '#ef4444'];

export default function ClusteringPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const res = await getClusters();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Executing K-Means clustering and PCA projection...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#99AFA9]/30">
        <p className="text-[#3B4A34] font-medium">No clustering data found. Please load a dataset first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-[#3B4A34]" />
            <span>K-Means Clustering &bull; Unsupervised Workflow Segmentation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">Process Case Clustering & Behavior Cohorts</h1>
          <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
            Groups historical workflow trajectories into behavioral cohorts using multidimensional duration, idle waiting, and circular rework features.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-[#01110A] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-bold shadow-xs">
            Optimal Clusters: k = {data.optimal_k}
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9] text-xs font-bold shadow-xs">
            Silhouette Score: {data.silhouette_score}
          </div>
        </div>
      </div>

      {/* Cluster Profiles Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.profiles.map((p, index) => {
          const color = clusterColors[index % clusterColors.length];
          return (
            <div
              key={p.cluster_id}
              className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#FAFDFC] text-[#01110A] border border-[#99AFA9]/30">
                    {p.percentage}% of Log
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#01110A] mb-1">{p.label}</h3>
                <p className="text-xs text-[#99AFA9] mb-4 leading-relaxed font-medium line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#99AFA9]/20 text-xs">
                <div className="flex justify-between text-[#3B4A34]">
                  <span className="text-[#99AFA9] font-medium">Cohort Volume:</span>
                  <span className="font-bold text-[#01110A]">{p.count} cases</span>
                </div>
                <div className="flex justify-between text-[#3B4A34]">
                  <span className="text-[#99AFA9] font-medium">Avg Duration:</span>
                  <span className="font-bold text-[#3B4A34]">{p.avg_duration_hours} hrs</span>
                </div>
                <div className="flex justify-between text-[#3B4A34]">
                  <span className="text-[#99AFA9] font-medium">Queue Wait:</span>
                  <span className="font-bold text-[#01110A]">{p.avg_waiting_hours} hrs</span>
                </div>
                <div className="flex justify-between text-[#3B4A34]">
                  <span className="text-[#99AFA9] font-medium">Rework Passes:</span>
                  <span className="font-bold text-[#3B4A34]">{p.avg_rework_count} / case</span>
                </div>
                <div className="flex justify-between text-[#3B4A34]">
                  <span className="text-[#99AFA9] font-medium">Delayed Rate:</span>
                  <span className={`font-black ${p.delayed_percentage > 35 ? 'text-rose-600' : 'text-[#3B4A34]'}`}>
                    {p.delayed_percentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2D PCA Dimensionality Projection Scatter Chart on Deep Green Canvas */}
      <div className="relative bg-[#01110A] rounded-3xl border border-[#3B4A34]/50 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3B4A34_1px,transparent_1px)] [background-size:20px_20px] opacity-35 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <h3 className="text-lg font-black text-[#FAFDFC]">
            2D Principal Component Projection (Cohort Separation)
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ADEBD9]/20 text-[#ADEBD9] font-bold border border-[#ADEBD9]/30">
            PCA Decomposition
          </span>
        </div>
        <p className="relative z-10 text-xs text-[#99AFA9] mb-6 font-medium">
          Multidimensional distribution of standardized case vectors across primary variance eigenvectors.
        </p>

        <div className="relative z-10 h-84 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3B4A34" strokeOpacity={0.4} />
              <XAxis type="number" dataKey="pca_x" name="Principal Component 1" stroke="#99AFA9" fontSize={11} />
              <YAxis type="number" dataKey="pca_y" name="Principal Component 2" stroke="#99AFA9" fontSize={11} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#082819] text-[#FAFDFC] p-3.5 rounded-2xl text-xs space-y-1 shadow-2xl border border-[#3B4A34]">
                        <p className="font-extrabold text-[#A0F89C]">{d.case_id}</p>
                        <p className="text-[#FAFDFC]">Cohort: {d.cluster_label}</p>
                        <p className="text-[#99AFA9]">Total Span: {d.total_duration_hours} hrs</p>
                        <p className="text-[#99AFA9]">Queue Waiting: {d.total_waiting_hours} hrs</p>
                        <p className="text-[#99AFA9]">Rework Passes: {d.rework_count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
              {data.profiles.map((p, idx) => {
                const clusterPoints = data.clusters.filter((c) => c.cluster_id === p.cluster_id);
                return (
                  <Scatter
                    key={p.cluster_id}
                    name={p.label}
                    data={clusterPoints}
                    fill={clusterColors[idx % clusterColors.length]}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
