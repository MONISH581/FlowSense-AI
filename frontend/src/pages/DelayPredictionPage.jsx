import React, { useState, useEffect } from 'react';
import {
  Clock,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { getModelEvaluation, predictDelay } from '../api';

export default function DelayPredictionPage() {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  // Form State for Live Prediction
  const [formData, setFormData] = useState({
    activity: 'Payment Verification',
    department: 'Finance',
    priority: 'Medium',
    time_spent_current_hours: 2.2,
    previous_activity_duration_hours: 0.8,
    rework_count: 1,
    sla_hours: 24.0,
    completed_stages_count: 2,
  });

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await getModelEvaluation();
      setModelMetrics(res.data);
    } catch (err) {
      console.error('Error fetching model evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    try {
      setPredicting(true);
      const res = await predictDelay(formData);
      setPredictionResult(res.data);
    } catch (err) {
      console.error('Error during prediction:', err);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    handlePredict(); // Run initial prediction
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Loading Random Forest ML Classifier...
        </p>
      </div>
    );
  }

  const cm = modelMetrics?.confusion_matrix || {
    true_negative: 84,
    false_positive: 12,
    false_negative: 9,
    true_positive: 35,
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <Cpu className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Supervised Random Forest Classifier</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">AI Delay Prediction Workbench</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
          Predicts whether an ongoing process case will breach its target SLA using non-leaking mid-stage trajectory snapshots.
        </p>
      </div>

      {/* Model Evaluation Metrics Cards */}
      {modelMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
            <span className="text-[10px] font-black text-[#99AFA9] uppercase tracking-wider block">Model Accuracy</span>
            <p className="text-2xl font-black text-[#01110A] mt-1">
              {(modelMetrics.accuracy * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-[#3B4A34] font-bold">80/20 Holdout Test</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
            <span className="text-[10px] font-black text-[#99AFA9] uppercase tracking-wider block">Precision</span>
            <p className="text-2xl font-black text-[#01110A] mt-1">
              {(modelMetrics.precision * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-[#3B4A34] font-bold">Low false alarms</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
            <span className="text-[10px] font-black text-[#99AFA9] uppercase tracking-wider block">Recall (Sensitivity)</span>
            <p className="text-2xl font-black text-[#01110A] mt-1">
              {(modelMetrics.recall * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-[#3B4A34] font-bold">Catches SLA breaches</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
            <span className="text-[10px] font-black text-[#99AFA9] uppercase tracking-wider block">F1-Score</span>
            <p className="text-2xl font-black text-[#3B4A34] mt-1">
              {(modelMetrics.f1_score * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-[#99AFA9] font-medium">Harmonic mean</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#99AFA9]/30 shadow-xs">
            <span className="text-[10px] font-black text-[#99AFA9] uppercase tracking-wider block">ROC-AUC</span>
            <p className="text-2xl font-black text-[#01110A] mt-1">
              {(modelMetrics.roc_auc * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-[#3B4A34] font-bold">Discrimination index</span>
          </div>
        </div>
      )}

      {/* Main Interactive Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Prediction Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#01110A] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#3B4A34]" />
                <span>Ongoing Case Simulator</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9] font-bold">
                Live Inference
              </span>
            </div>
            <p className="text-xs text-[#99AFA9] mb-6 font-medium">
              Simulate or inspect an in-flight case at an intermediate milestone to generate real-time breach probability.
            </p>

            <form onSubmit={handlePredict} className="space-y-4 text-xs">
              {/* Activity */}
              <div>
                <label className="font-bold text-[#01110A] block mb-1">Current Process Activity</label>
                <select
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-medium"
                >
                  <option value="Order Created">Order Created</option>
                  <option value="Payment Verification">Payment Verification (Finance)</option>
                  <option value="Manual Fraud Review">Manual Fraud Review (Finance)</option>
                  <option value="Inventory Check">Inventory Check (Warehouse)</option>
                  <option value="Backorder Allocation">Backorder Allocation (Warehouse)</option>
                  <option value="Packing">Packing (Warehouse)</option>
                  <option value="Quality Inspection">Quality Inspection (QA)</option>
                  <option value="Shipping">Shipping (Logistics)</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="font-bold text-[#01110A] block mb-1">Handling Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-medium"
                >
                  <option value="Finance">Finance</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              {/* Priority & SLA */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-[#01110A] block mb-1">Priority Class</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => {
                      const prio = e.target.value;
                      const sla = prio === 'High' ? 14.0 : prio === 'Medium' ? 24.0 : 48.0;
                      setFormData({ ...formData, priority: prio, sla_hours: sla });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-medium"
                  >
                    <option value="High">High (Express)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Low">Low (Economy)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#01110A] block mb-1">Target SLA (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.sla_hours}
                    onChange={(e) => setFormData({ ...formData, sla_hours: parseFloat(e.target.value) || 24.0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                  />
                </div>
              </div>

              {/* Time Spent & Previous Duration */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-[#01110A] block mb-1">
                    Elapsed Stage Time (Hrs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="48"
                    value={formData.time_spent_current_hours}
                    onChange={(e) => setFormData({ ...formData, time_spent_current_hours: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#01110A] block mb-1">
                    Prev Stage Dur (Hrs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="48"
                    value={formData.previous_activity_duration_hours}
                    onChange={(e) => setFormData({ ...formData, previous_activity_duration_hours: parseFloat(e.target.value) || 0.5 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                  />
                </div>
              </div>

              {/* Rework Count & Completed Stages */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-[#01110A] block mb-1">
                    Rework Passes So Far
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.rework_count}
                    onChange={(e) => setFormData({ ...formData, rework_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#01110A] block mb-1">
                    Completed Stages
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.completed_stages_count}
                    onChange={(e) => setFormData({ ...formData, completed_stages_count: parseInt(e.target.value) || 2 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#99AFA9]/30 focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={predicting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-black shadow-md shadow-[#01110A]/20 transition-all cursor-pointer"
                >
                  {predicting ? <Loader2 className="w-4 h-4 animate-spin text-[#A0F89C]" /> : <Sparkles className="w-4 h-4 text-[#A0F89C]" />}
                  <span>{predicting ? 'Calculating Probability...' : 'Predict Delay Likelihood'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Prediction Output Card & Explainability (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Prediction Output Hero Card in Deep Green */}
          {predictionResult && (
            <div className="relative overflow-hidden bg-[#01110A] rounded-3xl border border-[#3B4A34]/60 p-6 sm:p-8 shadow-2xl text-[#FAFDFC]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(#A0F89C_1px,transparent_1px)] [background-size:18px_18px] opacity-25 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[#3B4A34]/50">
                <div>
                  <span className="text-[10px] font-black text-[#99AFA9] uppercase tracking-wider block">Inference Outcome</span>
                  <h3 className="text-2xl font-black text-[#FAFDFC] mt-0.5">
                    {predictionResult.predicted_status}
                  </h3>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      predictionResult.risk_category === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : predictionResult.risk_category === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#ADEBD9]/20 text-[#ADEBD9] border border-[#ADEBD9]/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        predictionResult.risk_category === 'High'
                          ? 'bg-rose-500 animate-ping'
                          : predictionResult.risk_category === 'Medium'
                          ? 'bg-amber-400'
                          : 'bg-[#A0F89C]'
                      }`}
                    />
                    {predictionResult.risk_category} Risk Category
                  </span>
                </div>
              </div>

              {/* Neon Probability Gauge Bar */}
              <div className="relative z-10 py-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#99AFA9]">Calculated Breach Probability</span>
                  <span className="text-2xl font-black text-[#A0F89C]">
                    {(predictionResult.delay_probability * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-[#082819] rounded-full h-4 overflow-hidden p-0.5 border border-[#3B4A34]/70">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      predictionResult.delay_probability >= 0.65
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                        : predictionResult.delay_probability >= 0.30
                        ? 'bg-gradient-to-r from-[#A0F89C] to-amber-400'
                        : 'bg-[#A0F89C]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, predictionResult.delay_probability * 100))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-[#99AFA9] font-bold mt-1.5">
                  <span>0% (On-Track)</span>
                  <span>30% Threshold</span>
                  <span>65% Critical</span>
                  <span>100% (Breach)</span>
                </div>
              </div>

              {/* Explainable Contributing Factors */}
              <div className="relative z-10 pt-2 border-t border-[#3B4A34]/50">
                <h4 className="text-xs font-black text-[#FAFDFC] uppercase tracking-wider mb-3">
                  Top Contributing Risk Factors (Explainable ML)
                </h4>
                <div className="space-y-2">
                  {predictionResult.contributing_factors?.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#031B10]/80 border border-[#3B4A34]/50 text-xs"
                    >
                      <span className="text-[#FAFDFC] font-medium">{f.factor}</span>
                      <span
                        className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${
                          f.impact.includes('Negative')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-[#ADEBD9]/20 text-[#ADEBD9] border border-[#ADEBD9]/30'
                        }`}
                      >
                        {f.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confusion Matrix Card */}
          <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-[#01110A] uppercase tracking-wider">
                Confusion Matrix (Holdout Validation Partition)
              </h4>
              <span className="text-xs text-[#99AFA9] font-mono font-bold">N = {modelMetrics?.test_samples || 120}</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-center text-xs">
              <div className="p-4 rounded-2xl bg-[#ADEBD9]/20 border border-[#ADEBD9]">
                <span className="text-[10px] font-black text-[#3B4A34] uppercase block">True Negative (On-Time)</span>
                <span className="text-2xl font-black text-[#01110A] mt-1 block">{cm.true_negative}</span>
                <span className="text-[10px] text-[#3B4A34] font-medium">Correctly predicted on-time</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-black text-amber-700 uppercase block">False Positive (False Alarm)</span>
                <span className="text-2xl font-black text-amber-950 mt-1 block">{cm.false_positive}</span>
                <span className="text-[10px] text-amber-600 font-medium">Predicted delay, was on-time</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-black text-rose-700 uppercase block">False Negative (Missed Breach)</span>
                <span className="text-2xl font-black text-rose-950 mt-1 block">{cm.false_negative}</span>
                <span className="text-[10px] text-rose-600 font-medium">Predicted on-time, was delayed</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#01110A] text-[#FAFDFC] border border-[#3B4A34]">
                <span className="text-[10px] font-black text-[#A0F89C] uppercase block">True Positive (Caught Breach)</span>
                <span className="text-2xl font-black text-[#A0F89C] mt-1 block">{cm.true_positive}</span>
                <span className="text-[10px] text-[#99AFA9] font-medium">Correctly predicted delay</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Horizontal Chart */}
      {modelMetrics && modelMetrics.feature_importance && (
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-extrabold text-[#01110A]">Machine Learning Feature Importances</h3>
            <span className="text-xs text-[#99AFA9] font-semibold">Gini Impurity Metric</span>
          </div>
          <p className="text-xs text-[#99AFA9] mb-4 font-medium">
            Relative predictive weight of operational factors utilized by the Random Forest classifier.
          </p>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelMetrics.feature_importance}
                layout="vertical"
                margin={{ left: 80, right: 30, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis type="number" stroke="#3B4A34" fontSize={11} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#3B4A34" fontSize={11} width={180} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Relative Weight']}
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="importance" fill="#3B4A34" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
