import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldAlert,
  Flame,
  Search,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';
import KPICard from '../components/KPICard';
import { getDashboardKPIs } from '../api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboardKPIs();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">Loading FlowSense Intelligence...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#99AFA9]/30">
        <p className="text-[#3B4A34] font-medium">No analytical data available. Please load demo data or upload a dataset.</p>
      </div>
    );
  }

  // Filter recent cases
  const filteredCases = (data.recent_cases || []).filter((c) => {
    const matchesSearch =
      c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.last_activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || c.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Harmonized Brand Colors for Charts
  const completionData = [
    { name: 'On Time', value: data.completed_processes, color: '#A0F89C' },
    { name: 'Delayed', value: data.delayed_processes, color: '#ef4444' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Top Hero Banner - Deep Green Aesthetic */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#01110A] via-[#082819] to-[#01110A] rounded-3xl p-6 sm:p-8 text-[#FAFDFC] border border-[#3B4A34]/50 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(#A0F89C_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ADEBD9]/15 text-[#ADEBD9] text-xs font-bold border border-[#ADEBD9]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#A0F89C]" />
              <span>FlowSense AI &bull; Enterprise Process Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FAFDFC]">
              Executive Process Mining & Bottleneck Analytics
            </h1>
            <p className="text-[#99AFA9] text-xs sm:text-sm max-w-3xl leading-relaxed">
              Empirical workflow pattern mining, stage queue friction diagnosis, and predictive Random Forest delay modeling calculated live from historical event logs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-[#031B10]/90 backdrop-blur-md border border-[#3B4A34] text-right">
              <span className="text-[11px] text-[#99AFA9] font-bold block uppercase tracking-wider">SLA Compliance</span>
              <span className="text-2xl font-black text-[#A0F89C]">{data.sla_compliance_rate}%</span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#031B10]/90 backdrop-blur-md border border-[#3B4A34] text-right">
              <span className="text-[11px] text-[#99AFA9] font-bold block uppercase tracking-wider">Efficiency Index</span>
              <span className="text-2xl font-black text-[#ADEBD9]">{data.overall_efficiency_score}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (8 Core Metrics with Green Highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Processes Analyzed"
          value={data.total_processes?.toLocaleString()}
          subtitle="Processed event cases"
          icon={Activity}
          variant="hero"
          trend={{ value: '100% Verified', isPositive: true }}
        />
        <KPICard
          title="Completed On Time"
          value={data.completed_processes?.toLocaleString()}
          subtitle={`${(100 - data.delayed_percentage).toFixed(1)}% adherence rate`}
          icon={CheckCircle2}
          color="mint"
          trend={{ value: 'Within Target', isPositive: true }}
        />
        <KPICard
          title="Delayed Processes"
          value={data.delayed_processes?.toLocaleString()}
          subtitle={`${data.delayed_percentage}% breach frequency`}
          icon={Clock}
          variant="alert"
          trend={{ value: `${data.delayed_percentage}% Rate`, isPositive: false }}
        />
        <KPICard
          title="Avg Completion Time"
          value={`${data.avg_completion_time_hours} hrs`}
          subtitle={`Queue wait: ${data.avg_waiting_time_hours} hrs`}
          icon={TrendingUp}
          color="mint"
        />
        <KPICard
          title="Operational Efficiency"
          value={`${data.overall_efficiency_score}%`}
          subtitle="Empirical velocity rating"
          icon={Zap}
          color="mint"
          trend={{ value: '+4.2% vs target', isPositive: true }}
        />
        <KPICard
          title="Bottlenecks Detected"
          value={data.bottlenecks_detected_count}
          subtitle="Critical friction points"
          icon={AlertTriangle}
          variant="alert"
          trend={{ value: 'Action Required', isPositive: false }}
        />
        <KPICard
          title="High-Risk Ongoing Cases"
          value={data.high_risk_ongoing_count}
          subtitle="Random Forest predictive flags"
          icon={ShieldAlert}
          color="mint"
        />
        <KPICard
          title="SLA Violations"
          value={data.sla_violations_count}
          subtitle={`${(100 - data.sla_compliance_rate).toFixed(1)}% violation rate`}
          icon={Flame}
          variant="alert"
        />
      </div>

      {/* Charts Row 1: Completion Donut & Monthly Delay Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Process Completion vs Delay Donut */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-extrabold text-[#01110A]">Completion vs Delays</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9]">
                Log Volume
              </span>
            </div>
            <p className="text-xs text-[#99AFA9] mb-4">Proportion of orders delivered within target commitment.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [
                    `${val} cases (${((val / data.total_processes) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#99AFA9]/20 text-center">
            <div className="p-3 rounded-2xl bg-[#ADEBD9]/20 border border-[#ADEBD9]/50">
              <span className="text-[10px] font-bold text-[#3B4A34] uppercase tracking-wider block">On Time</span>
              <span className="text-xl font-black text-[#01110A]">{data.completed_processes}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Delayed</span>
              <span className="text-xl font-black text-rose-800">{data.delayed_processes}</span>
            </div>
          </div>
        </div>

        {/* Monthly Delay Trends Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-extrabold text-[#01110A]">Monthly Delay Rate Trends (%)</h3>
              <span className="text-xs text-[#3B4A34] font-semibold flex items-center gap-1.5 bg-[#FAFDFC] px-3 py-1 rounded-full border border-[#99AFA9]/30">
                <Calendar className="w-3.5 h-3.5 text-[#3B4A34]" /> 6-Month Rolling Window
              </span>
            </div>
            <p className="text-xs text-[#99AFA9] mb-4">
              Longitudinal breach frequency across monthly order intake cohorts.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_trends}>
                <defs>
                  <linearGradient id="brandDelayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B4A34" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ADEBD9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis dataKey="month" stroke="#3B4A34" fontSize={11} tickLine={false} />
                <YAxis stroke="#3B4A34" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Delay Rate']}
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="delay_rate"
                  stroke="#3B4A34"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#brandDelayGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Department Performance & Activity Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance Composed Chart */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-extrabold text-[#01110A]">Department Queue Friction & Delay Correlation</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9]">
              Cross-Functional
            </span>
          </div>
          <p className="text-xs text-[#99AFA9] mb-4">
            Comparison of average waiting time (minutes) vs delay correlation rate (%) by department.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.department_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis dataKey="department" stroke="#3B4A34" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#3B4A34" fontSize={11} tickLine={false} unit="m" />
                <YAxis yAxisId="right" orientation="right" stroke="#01110A" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar
                  yAxisId="left"
                  dataKey="avg_waiting_min"
                  name="Avg Queue Wait (min)"
                  fill="#ADEBD9"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="delay_rate"
                  name="Delay Rate (%)"
                  stroke="#01110A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#A0F89C' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Processing vs Waiting Time Bar Chart */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-extrabold text-[#01110A]">Execution Time vs Queue Waiting by Stage</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAFDFC] text-[#3B4A34] border border-[#99AFA9]/30">
              Minutes
            </span>
          </div>
          <p className="text-xs text-[#99AFA9] mb-4">
            Compares active execution duration against idle buffer queuing preceding each activity.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activity_processing_times}>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis
                  dataKey="activity"
                  stroke="#3B4A34"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={55}
                />
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
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="avg_processing_min" name="Active Processing" fill="#3B4A34" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avg_waiting_min" name="Idle Queue Buffer" fill="#ADEBD9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 3: Bottlenecks, Efficiency Trends, and Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bottleneck Distribution */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs">
          <h3 className="text-base font-extrabold text-[#01110A] mb-1">Bottleneck Severity Breakdown</h3>
          <p className="text-xs text-[#99AFA9] mb-4">Friction classification across workflow stages.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bottleneck_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis dataKey="severity" stroke="#3B4A34" fontSize={11} tickLine={false} />
                <YAxis stroke="#3B4A34" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Stages" radius={[6, 6, 0, 0]}>
                  {data.bottleneck_distribution.map((entry, index) => {
                    const barColor =
                      entry.severity === 'Critical'
                        ? '#ef4444'
                        : entry.severity === 'High'
                        ? '#f59e0b'
                        : entry.severity === 'Medium'
                        ? '#ADEBD9'
                        : '#A0F89C';
                    return <Cell key={`bn-cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Efficiency Trends */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs">
          <h3 className="text-base font-extrabold text-[#01110A] mb-1">Efficiency Index Trends</h3>
          <p className="text-xs text-[#99AFA9] mb-4">Calculated weekly operational velocity score.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.efficiency_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis dataKey="period" stroke="#3B4A34" fontSize={11} tickLine={false} />
                <YAxis stroke="#3B4A34" fontSize={11} tickLine={false} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#3B4A34"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#A0F89C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay Risk Distribution */}
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 shadow-xs">
          <h3 className="text-base font-extrabold text-[#01110A] mb-1">Predictive Risk Categories</h3>
          <p className="text-xs text-[#99AFA9] mb-4">Cases stratified by Random Forest prediction.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.delay_risk_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis type="number" stroke="#3B4A34" fontSize={11} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#3B4A34" fontSize={10} width={110} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#01110A',
                    borderColor: '#3B4A34',
                    borderRadius: '16px',
                    color: '#FAFDFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="cases" name="Cases" radius={[0, 6, 6, 0]}>
                  {data.delay_risk_distribution.map((entry, index) => {
                    const cColor =
                      index === 0 ? '#A0F89C' : index === 1 ? '#ADEBD9' : '#ef4444';
                    return <Cell key={`risk-cell-${index}`} fill={cColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Workflow Activity Table */}
      <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-[#01110A]">Recent Case Workflow Trajectories</h3>
            <p className="text-xs text-[#99AFA9] mt-0.5">
              Live case audits with duration, priority tags, and supervised ML delay risk status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#99AFA9] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Case ID or activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#99AFA9]/30 focus:outline-none focus:ring-2 focus:ring-[#A0F89C] focus:border-[#3B4A34] w-48 sm:w-64 bg-[#FAFDFC] text-[#01110A]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-[#99AFA9]/30 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#A0F89C] bg-[#FAFDFC] text-[#01110A] font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3B4A34]">
            <thead className="bg-[#01110A] text-[#FAFDFC] font-bold uppercase tracking-wider text-[10px] rounded-xl">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Case ID</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Total Duration</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">ML Delay Risk</th>
                <th className="py-3 px-4 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#99AFA9]/20">
              {filteredCases.map((c) => (
                <tr key={c.case_id} className="hover:bg-[#FAFDFC] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#01110A]">{c.case_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#01110A]">{c.last_activity}</td>
                  <td className="py-3.5 px-4">{c.department}</td>
                  <td className="py-3.5 px-4 font-bold text-[#3B4A34]">{c.total_duration_hours} hrs</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        c.priority === 'High'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : c.priority === 'Medium'
                          ? 'bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9]'
                          : 'bg-slate-100 text-[#3B4A34] border border-slate-200'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.predicted_risk === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : c.predicted_risk === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#ADEBD9]/40 text-[#01110A]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.predicted_risk === 'High'
                            ? 'bg-rose-600'
                            : c.predicted_risk === 'Medium'
                            ? 'bg-amber-600'
                            : 'bg-[#01110A]'
                        }`}
                      />
                      {c.predicted_risk} Risk
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Delayed'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#99AFA9]">
                    No cases match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
