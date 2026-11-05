import React, { useState, useEffect } from 'react';
import {
  SearchCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { getAnomalies } from '../api';

export default function AnomalyDetectionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await getAnomalies();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#3B4A34] border-t-[#A0F89C] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#3B4A34] uppercase tracking-wider">
          Running Isolation Forest anomaly detector...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#99AFA9]/30">
        <p className="text-[#3B4A34] font-medium">No anomaly data found. Please load a dataset first.</p>
      </div>
    );
  }

  const filteredAnomalies = data.anomalies.filter((a) => {
    const matchesSearch =
      a.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev =
      severityFilter === 'ALL' || a.severity.toUpperCase() === severityFilter.toUpperCase();
    return matchesSearch && matchesSev;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1550px] mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADEBD9]/20 text-[#01110A] border border-[#ADEBD9] text-xs font-bold mb-2">
          <SearchCheck className="w-3.5 h-3.5 text-[#3B4A34]" />
          <span>Isolation Forest &bull; Unsupervised Anomaly Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#01110A] tracking-tight">Workflow Anomaly Detection</h1>
        <p className="text-xs text-[#99AFA9] mt-0.5 font-medium">
          Identifies statistical workflow outliers, extreme queue stalls, circular loop deviations, and abnormal execution durations.
        </p>
      </div>

      {/* Context Alert */}
      <div className="flex items-start gap-3 p-4.5 rounded-2xl bg-[#FAFDFC] border border-[#99AFA9]/30 text-xs text-[#3B4A34] leading-relaxed shadow-xs">
        <Info className="w-4 h-4 text-[#3B4A34] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#01110A]">Operational Context:</span> An anomaly flags statistical deviations (such as a 4x execution time surge or repetitive verification loop) that warrant supervisor investigation.
        </div>
      </div>

      {/* Breakdown Charts: Anomalies by Department & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-extrabold text-[#01110A]">Anomalies by Department</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAFDFC] text-[#3B4A34] border border-[#99AFA9]/30">
              Outlier Count
            </span>
          </div>
          <p className="text-xs text-[#99AFA9] mb-4 font-medium">Distribution of detected outlier events across functional units.</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.anomalies_by_department}>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis dataKey="department" stroke="#3B4A34" fontSize={11} tickLine={false} />
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
                <Bar dataKey="count" name="Anomalies" fill="#3B4A34" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-extrabold text-[#01110A]">Anomalies by Stage</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAFDFC] text-[#3B4A34] border border-[#99AFA9]/30">
              Outlier Count
            </span>
          </div>
          <p className="text-xs text-[#99AFA9] mb-4 font-medium">Workflow activities exhibiting highest operational variance.</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.anomalies_by_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#99AFA9" strokeOpacity={0.2} />
                <XAxis dataKey="activity" stroke="#3B4A34" fontSize={10} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
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
                <Bar dataKey="count" name="Anomalies" fill="#ADEBD9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-3xl border border-[#99AFA9]/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#99AFA9] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Case ID or activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#99AFA9]/30 focus:outline-none focus:ring-2 focus:ring-[#A0F89C] w-64 bg-[#FAFDFC] text-[#01110A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#99AFA9]" />
            <span className="text-xs text-[#99AFA9] font-semibold">Severity:</span>
            {['ALL', 'SEVERE', 'HIGH', 'MODERATE'].map((sev) => (
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

        {/* Anomalies Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3B4A34]">
            <thead className="bg-[#01110A] text-[#FAFDFC] font-bold uppercase tracking-wider text-[10px] rounded-xl">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Case ID</th>
                <th className="py-3 px-3">Activity</th>
                <th className="py-3 px-3">Dept</th>
                <th className="py-3 px-3">Actual Time</th>
                <th className="py-3 px-3">Median Benchmark</th>
                <th className="py-3 px-3">Idle Wait</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3 rounded-r-xl">Audit Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#99AFA9]/20">
              {filteredAnomalies.map((a) => (
                <tr key={a.anomaly_id} className="hover:bg-[#FAFDFC] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#01110A]">{a.case_id}</td>
                  <td className="py-3 px-3 font-semibold text-[#01110A]">{a.activity}</td>
                  <td className="py-3 px-3">{a.department}</td>
                  <td className="py-3 px-3 font-bold text-rose-600">{a.actual_time_min}m</td>
                  <td className="py-3 px-3 text-[#99AFA9] font-medium">{a.expected_time_min}m</td>
                  <td className="py-3 px-3 font-semibold text-[#3B4A34]">{a.waiting_time_min}m</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        a.severity === 'Severe'
                          ? 'bg-rose-100 text-rose-800'
                          : a.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#ADEBD9]/40 text-[#01110A]'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#01110A] max-w-md font-medium">{a.explanation}</td>
                </tr>
              ))}
              {filteredAnomalies.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#99AFA9]">
                    No anomalies match the selected search or severity criteria.
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
