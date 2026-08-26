import React from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react';
import { AdminOverviewStats } from '../../../types';
import { AdminEmptyState } from './AdminEmptyState';

interface AdminAnalyticsViewProps {
  stats: AdminOverviewStats | null;
  loading: boolean;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ stats, loading }) => {
  const lowAttendanceStudents = stats?.lowAttendanceStudents || [];

  return (
    <div className="space-y-8">
      {/* Header - Light Red Theme */}
      <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Institutional Attendance Intelligence</h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Automated compliance monitoring for HSC Board Exam eligibility thresholds (75% minimum presence).
        </p>
      </div>

      {/* Critical Exam Eligibility Watchlist (<75%) */}
      <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              HSC Exam Non-Collegiate Watchlist (&lt;75% Attendance)
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Students identified at risk of disqualification from final board examinations.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-rose-600 animate-pulse">
            Analyzing student compliance records from database...
          </div>
        ) : lowAttendanceStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowAttendanceStudents.map((st) => (
              <div
                key={st.studentId}
                className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-rose-800 text-sm">Roll: {st.rollNumber}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-2xs">
                    {st.attendancePercentage}% Attendance
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">{st.fullName}</h4>
                  <span className="text-xs font-bold text-slate-500">
                    {st.batch} • Section {st.section}
                  </span>
                </div>

                <div className="pt-2 border-t border-rose-100 text-xs text-slate-700 flex items-center justify-between font-bold">
                  <span>Attended: {st.presentDays}/{st.totalClasses} classes</span>
                  <span className="text-rose-600 font-black">Warning Triggered</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={CheckCircle2}
            title="100% Institutional Compliance"
            description="No students currently fall below the 75% attendance threshold in the database."
          />
        )}
      </div>

      {/* Section Performance Comparison */}
      <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          Section Attendance Comparison Matrix
        </h3>

        {(stats?.sectionAttendanceBreakdown?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            {(stats?.sectionAttendanceBreakdown || []).map((sec) => (
              <div
                key={`${sec.batch}-${sec.section}`}
                className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    {sec.section}
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900">
                      Section {sec.section} ({sec.batch})
                    </span>
                    <span className="text-xs font-medium text-slate-500 block">
                      {sec.totalStudents} Enrolled Students
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 sm:w-48 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        sec.attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(sec.attendanceRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-900 w-12 text-right">
                    {sec.attendanceRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={BarChart3}
            title="No Section Records"
            description="Attendance logs have not been recorded for comparison yet."
          />
        )}
      </div>
    </div>
  );
};
