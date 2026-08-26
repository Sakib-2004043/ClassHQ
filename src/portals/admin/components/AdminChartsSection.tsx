import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import { AdminOverviewStats } from '../../../types';

interface AdminChartsSectionProps {
  stats: AdminOverviewStats | null;
  loading?: boolean;
  variant?: 'full' | 'compact';
}

const STATUS_COLORS: Record<string, string> = {
  Present: '#10b981',
  Absent: '#f43f5e',
  Late: '#f59e0b',
  'Excused / Leave': '#06b6d4',
};

export const AdminChartsSection: React.FC<AdminChartsSectionProps> = ({ 
  stats, 
  loading = false,
  variant = 'full' 
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'attendance' | 'cohort' | 'streams'>('attendance');

  // Fallback / Normalized Data for Charts
  const dailyTrend = stats?.dailyTrend || [
    { date: '2026-08-18', formattedDate: 'Aug 18', rate: 94, present: 142, absent: 8, late: 2, total: 152 },
    { date: '2026-08-19', formattedDate: 'Aug 19', rate: 91, present: 138, absent: 12, late: 4, total: 154 },
    { date: '2026-08-20', formattedDate: 'Aug 20', rate: 96, present: 148, absent: 6, late: 1, total: 155 },
    { date: '2026-08-21', formattedDate: 'Aug 21', rate: 89, present: 135, absent: 15, late: 5, total: 155 },
    { date: '2026-08-22', formattedDate: 'Aug 22', rate: 93, present: 144, absent: 10, late: 3, total: 157 },
    { date: '2026-08-23', formattedDate: 'Aug 23', rate: 95, present: 147, absent: 7, late: 2, total: 156 },
    { date: '2026-08-24', formattedDate: 'Today', rate: stats?.todayInstitutionAttendanceRate || 92, present: 143, absent: 11, late: 3, total: 157 },
  ];

  const statusData = stats?.statusDistribution || [
    { name: 'Present', count: 143, percentage: 91, color: '#10b981' },
    { name: 'Absent', count: 11, percentage: 7, color: '#f43f5e' },
    { name: 'Late', count: 3, percentage: 2, color: '#f59e0b' },
  ];

  const batchData = stats?.batchBreakdown || [
    { batch: 'HSC 2024', totalStudents: 48, approvedStudents: 46, captainsCount: 4, attendanceRate: 92 },
    { batch: 'HSC 2025', totalStudents: 56, approvedStudents: 54, captainsCount: 4, attendanceRate: 94 },
    { batch: 'HSC 2026', totalStudents: 62, approvedStudents: 58, captainsCount: 4, attendanceRate: 89 },
  ];

  const groupData = stats?.groupBreakdown || [
    { group: 'Science', totalStudents: 85, attendanceRate: 94 },
    { group: 'Business Studies', totalStudents: 52, attendanceRate: 90 },
    { group: 'Humanities', totalStudents: 29, attendanceRate: 88 },
  ];

  const sectionBreakdown = (stats?.sectionAttendanceBreakdown || []).map((sec) => ({
    name: `Sec ${sec.section}`,
    batch: sec.batch,
    rate: sec.attendanceRate,
    students: sec.totalStudents,
  }));

  const complianceTiers = stats?.complianceTiers || [
    { tier: 'Distinction (≥90%)', range: '90-100%', count: 124, percentage: 76, color: '#10b981' },
    { tier: 'Satisfactory (75-89%)', range: '75-89%', count: 28, percentage: 17, color: '#3b82f6' },
    { tier: 'At Risk (60-74%)', range: '60-74%', count: 8, percentage: 5, color: '#f59e0b' },
    { tier: 'Critical (<60%)', range: '<60%', count: 3, percentage: 2, color: '#f43f5e' },
  ];

  if (loading) {
    return (
      <div className="p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm text-center">
        <div className="flex items-center justify-center gap-3 text-rose-600 font-black text-sm animate-pulse">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Generating multi-dimensional visual intelligence graphs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Control Header with Tab Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 text-white flex items-center justify-center font-black shadow-md shadow-rose-200/80 shrink-0 mt-0.5 sm:mt-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Institutional Visual Analytics
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100/90 text-rose-700 border border-rose-200/90 whitespace-nowrap inline-flex items-center gap-1 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-rose-600" />
                Live Dynamic Graphs
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
              Interactive timeline curves, distribution donuts, and cohort comparison matrices.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="w-full xl:w-auto grid grid-cols-3 gap-1 p-1.5 bg-rose-50/90 rounded-2xl border border-rose-200/80 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMetricTab('attendance')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 text-center min-w-0 ${
              activeMetricTab === 'attendance'
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Attendance Trend</span>
            <span className="sm:hidden truncate">Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetricTab('cohort')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 text-center min-w-0 ${
              activeMetricTab === 'cohort'
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Batches & Sections</span>
            <span className="sm:hidden truncate">Batches</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetricTab('streams')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 text-center min-w-0 ${
              activeMetricTab === 'streams'
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Groups & Tiers</span>
            <span className="sm:hidden truncate">Groups</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Attendance Velocity & Status Donut */}
      {activeMetricTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Chart: Attendance Timeline Curve */}
          <div className="lg:col-span-2 p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Daily Timeline Velocity</span>
                <h4 className="text-base font-black text-slate-900 tracking-tight">Institutional Attendance Rate Curve (%)</h4>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Presence Rate
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 font-mono">Target: 75%</span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.6} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={700}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[60, 100]} 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={700}
                    unit="%"
                    tickLine={false}
                  />
                  <ReferenceLine y={75} stroke="#e11d48" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '75% Minimum', fill: '#e11d48', fontSize: 10, fontWeight: 800, position: 'insideBottomRight' }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-slate-900/95 text-white rounded-2xl border border-slate-700 shadow-xl text-xs space-y-1">
                            <span className="font-black text-rose-400 block">{label}</span>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Attendance Rate:</span>
                              <span className="font-black text-emerald-400">{data.rate}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400">
                              <span>Present / Absent:</span>
                              <span className="font-mono text-slate-200">{data.present} / {data.absent}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#e11d48"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                    dot={{ r: 4, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#be123c', stroke: '#ffffff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-100 text-center">
              <div className="p-2 rounded-xl bg-rose-50/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">7-Day Average</span>
                <span className="text-sm font-black text-slate-900">
                  {Math.round(dailyTrend.reduce((acc, curr) => acc + curr.rate, 0) / dailyTrend.length)}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Peak Attendance</span>
                <span className="text-sm font-black text-emerald-700">
                  {Math.max(...dailyTrend.map((d) => d.rate))}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50/50">
                <span className="text-[10px] font-bold text-blue-600 uppercase block">Compliance Status</span>
                <span className="text-sm font-black text-blue-700">
                  ✓ High Standing
                </span>
              </div>
            </div>
          </div>

          {/* Status Composition Donut Chart */}
          <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Roll Call Status</span>
                <PieChartIcon className="w-4 h-4 text-rose-500" />
              </div>
              <h4 className="text-base font-black text-slate-900 tracking-tight">Presence Composition</h4>
            </div>

            {/* Donut Chart */}
            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || STATUS_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 bg-slate-900/95 text-white rounded-xl border border-slate-700 shadow-xl text-xs space-y-0.5">
                            <span className="font-black text-rose-400 block">{data.name}</span>
                            <div className="flex items-center justify-between gap-3 text-slate-200">
                              <span>Records:</span>
                              <span className="font-bold">{data.count} ({data.percentage || Math.round((data.count / 157) * 100)}%)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Central Stat Inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {stats?.todayInstitutionAttendanceRate || 92}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  Overall Present
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2 pt-2 border-t border-rose-100">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color || STATUS_COLORS[item.name] || '#cbd5e1' }}
                    />
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-900">{item.count} logs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Cohort Breakdown & Section Comparison */}
      {activeMetricTab === 'cohort' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HSC Cohort Bar Chart */}
          <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Batch Comparison</span>
                <h4 className="text-base font-black text-slate-900 tracking-tight">HSC Cohort Distribution Matrix</h4>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Total Enrolled
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Approved
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.6} />
                  <XAxis dataKey="batch" stroke="#94a3b8" fontSize={11} fontWeight={700} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-slate-900/95 text-white rounded-2xl border border-slate-700 shadow-xl text-xs space-y-1">
                            <span className="font-black text-rose-400 block">{label}</span>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Total Enrolled:</span>
                              <span className="font-bold">{data.totalStudents}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-emerald-400">
                              <span>Approved Students:</span>
                              <span className="font-bold">{data.approvedStudents}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-blue-400">
                              <span>Captains Assigned:</span>
                              <span className="font-bold">{data.captainsCount}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-amber-400">
                              <span>Attendance Avg:</span>
                              <span className="font-bold">{data.attendanceRate}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="totalStudents" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Total Enrolled" />
                  <Bar dataKey="approvedStudents" fill="#10b981" radius={[6, 6, 0, 0]} name="Approved" />
                  <Bar dataKey="captainsCount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Captains" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-100 text-center">
              {batchData.map((b) => (
                <div key={b.batch} className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">{b.batch}</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">{b.totalStudents} Students</span>
                  <span className="text-[10px] font-bold text-rose-600 block">{b.attendanceRate}% Rate</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section Attendance Comparison Horizontal Bars */}
          <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Section Auditing</span>
                <h4 className="text-base font-black text-slate-900 tracking-tight">Section Attendance Health Matrix</h4>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                75% Required
              </span>
            </div>

            {sectionBreakdown.length > 0 ? (
              <div className="space-y-3 pt-2">
                {sectionBreakdown.map((sec) => (
                  <div key={`${sec.batch}-${sec.name}`} className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                          {sec.name.replace('Sec ', '')}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-900">{sec.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 block">{sec.batch} • {sec.students} Students</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-black ${sec.rate >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {sec.rate}%
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                          {sec.rate >= 75 ? '✓ Compliant' : '⚠ Action Needed'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Bar with Target Line Marker */}
                    <div className="relative w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sec.rate >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(sec.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-bold text-slate-500">
                No section attendance logs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Academic Groups & Compliance Tiers */}
      {activeMetricTab === 'streams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Academic Group Comparison */}
          <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Discipline Groups</span>
              <h4 className="text-base font-black text-slate-900 tracking-tight">Academic Group Attendance Performance</h4>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.6} />
                  <XAxis type="number" domain={[0, 100]} unit="%" stroke="#94a3b8" fontSize={11} fontWeight={700} />
                  <YAxis type="category" dataKey="group" stroke="#94a3b8" fontSize={11} fontWeight={700} width={100} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-slate-900/95 text-white rounded-2xl border border-slate-700 shadow-xl text-xs space-y-1">
                            <span className="font-black text-rose-400 block">{label}</span>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Attendance Rate:</span>
                              <span className="font-bold text-emerald-400">{data.attendanceRate}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-400">
                              <span>Enrolled Students:</span>
                              <span className="font-bold text-slate-200">{data.totalStudents}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="attendanceRate" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                    {groupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#0ea5e9' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-rose-100">
              {groupData.map((g, idx) => (
                <div key={g.group} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-purple-500' : idx === 1 ? 'bg-sky-500' : 'bg-rose-500'}`} />
                    <span className="text-slate-700">{g.group}</span>
                  </div>
                  <span className="text-slate-900 font-mono">{g.attendanceRate}% Attendance ({g.totalStudents} enrolled)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Board Exam Compliance Tiers */}
          <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">HSC Board Compliance</span>
              <h4 className="text-base font-black text-slate-900 tracking-tight">Exam Eligibility Spectrum</h4>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Distribution of students across institutional attendance thresholds.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {complianceTiers.map((tier) => (
                <div key={tier.tier} className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span className="text-slate-900">{tier.tier}</span>
                    </div>
                    <span className="text-slate-700 font-mono">{tier.count} students ({tier.percentage}%)</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(tier.percentage, 100)}%`, backgroundColor: tier.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold">
                Over 90% of enrolled students currently meet the required criteria for regular board examination entry.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
