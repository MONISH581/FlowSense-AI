import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  DollarSign,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { runSimulation, getBottlenecks } from '../api';

export default function SimulationPage() {
  const [activities, setActivities] = useState([]);
  const [simParams, setSimParams] = useState({
    target_activity: 'Payment Verification',
    additional_staff_percentage: 25.0,
    processing_time_reduction_percentage: 20.0,
    waiting_time_reduction_percentage: 35.0,
  });
  const [result, setResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await getBottlenecks();
      if (res.data.bottlenecks) {
        setActivities(res.data.bottlenecks.map((b) => b.activity));
      }
    } catch (err) {
      console.log('Error fetching activities:', err);
    }
  };

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    try {
      setSimulating(true);
      const res = await runSimulation(simParams);
      setResult(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    handleSimulate(); // Run initial simulation
  }, []);

  const comparisonData = result
    ? [
        {
          metric: 'Completion Time',
          Baseline: result.original_avg_duration_hours,
          Simulated: result.simulated_avg_duration_hours,
        },
        {
          metric: 'Queue Wait Time',
          Baseline: result.original_waiting_hours,
          Simulated: result.simulated_waiting_hours,
        },
        {
          metric: 'Delay Rate (%)',
          Baseline: result.original_delay_rate,
          Simulated: result.simulated_delay_rate,
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <Sliders className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Operational Capacity & Elasticity Modeling</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">What-If Operational Scenario Simulation</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
          Simulate adjustments in employee allocation, automation speedups, and queue waiting reductions to project SLA gains and cost savings.
        </p>
      </div>

      {/* Main Grid: Control Sliders on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Control Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#01110A] mb-1">Operational Parameter Controls</h3>
            <p className="text-xs text-[#99AFA9] mb-6 font-medium">
              Adjust levers to model staff reallocations and technological automations.
            </p>

            <form onSubmit={handleSimulate} className="space-y-5 text-xs">
              {/* Target Activity Select */}
              <div>
                <label className="font-bold text-[#01110A] block mb-1">Target Workflow Stage</label>
                <select
                  value={simParams.target_activity}
                  onChange={(e) => setSimParams({ ...simParams, target_activity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-medium"
                >
                  {activities.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                  {activities.length === 0 && (
                    <option value="Payment Verification">Payment Verification</option>
                  )}
                </select>
              </div>

              {/* Slider 1: Additional Staffing */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-[#01110A]">Additional Staff Allocation:</span>
                  <span className="text-[#3B4A34] font-black">+{simParams.additional_staff_percentage}% personnel</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simParams.additional_staff_percentage}
                  onChange={(e) =>
                    setSimParams({
                      ...simParams,
                      additional_staff_percentage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#01110A] cursor-pointer"
                />
                <span className="text-[10px] text-[#99AFA9] block">
                  Reallocates available workforce to absorb queue buildup.
                </span>
              </div>

              {/* Slider 2: Processing Time Reduction */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-[#01110A]">Automation Execution Speedup:</span>
                  <span className="text-[#01110A] font-black">
                    -{simParams.processing_time_reduction_percentage}% duration
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={simParams.processing_time_reduction_percentage}
                  onChange={(e) =>
                    setSimParams({
                      ...simParams,
                      processing_time_reduction_percentage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#3B4A34] cursor-pointer"
                />
                <span className="text-[10px] text-[#99AFA9] block">
                  Represents RPA auto-approval or straight-through processing.
                </span>
              </div>

              {/* Slider 3: Queue Waiting Time Reduction */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-[#01110A]">Queue & Triage Reduction:</span>
                  <span className="text-[#3B4A34] font-black">
                    -{simParams.waiting_time_reduction_percentage}% queue wait
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={simParams.waiting_time_reduction_percentage}
                  onChange={(e) =>
                    setSimParams({
                      ...simParams,
                      waiting_time_reduction_percentage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#ADEBD9] cursor-pointer"
                />
                <span className="text-[10px] text-[#99AFA9] block">
                  Accelerates batch release frequency and fast-track routing.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-black shadow-md shadow-[#01110A]/20 transition-all cursor-pointer"
                >
                  {simulating ? <Loader2 className="w-4 h-4 animate-spin text-[#A0F89C]" /> : <Sparkles className="w-4 h-4 text-[#A0F89C]" />}
                  <span>{simulating ? 'Computing Trajectories...' : 'Simulate Operational Impact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Showcase Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              {/* Projected Gains Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-[#99AFA9] block">Completion Time</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-[#01110A]">
                      {result.simulated_avg_duration_hours}h
                    </span>
                    <span className="text-xs font-bold text-[#3B4A34]">
                      -{result.duration_improvement_percentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[#99AFA9] font-medium">Baseline: {result.original_avg_duration_hours}h</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-[#99AFA9] block">Overall Delay Rate</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-[#01110A]">
                      {result.simulated_delay_rate}%
                    </span>
                    <span className="text-xs font-bold text-[#3B4A34]">
                      -{result.delay_reduction_percentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[#99AFA9] font-medium">Baseline: {result.original_delay_rate}%</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#01110A] text-[#FAFDFC] border border-[#3B4A34] shadow-xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-[#99AFA9] block">Estimated Cost Saved</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-[#A0F89C]">
                      ${result.estimated_cost_saved_usd?.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#ADEBD9]">Remediation recovery</span>
                </div>
              </div>

              {/* Before vs After Visual Bar Chart */}
              <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-extrabold text-[#01110A]">Baseline vs Simulated Metrics Comparison</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#ADEBD9]/30 text-[#01110A] font-bold border border-[#ADEBD9]">
                    Target: {result.activity_targeted}
                  </span>
                </div>
                <p className="text-xs text-[#99AFA9] mb-4 font-medium">
                  Direct empirical comparison of baseline event logs against the simulated optimized state.
                </p>

                <div className="h-68 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                      <XAxis dataKey="metric" stroke="#3B4A34" fontSize={11} tickLine={false} />
                      <YAxis stroke="#3B4A34" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#01110A',
                          borderColor: '#3B4A34',
                          borderRadius: '16px',
                          color: '#FAFDFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="Baseline" fill="#3B4A34" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Simulated" fill="#ADEBD9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Model Transparency Disclaimer */}
          <div className="flex items-start gap-3 p-4.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/30 text-xs text-[#3B4A34] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-[#3B4A34] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#01110A]">Simulation Elasticity Model:</span> Projected outcomes are mathematical estimations generated by replaying historical event logs with calibrated reduction factors. They provide directional guidance rather than operational guarantees.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
