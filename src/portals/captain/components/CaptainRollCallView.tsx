import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  Calendar, 
  Users, 
  AlertCircle, 
  Search,
  ShieldCheck,
  ShieldAlert,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AttendanceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { CaptainEmptyState } from './CaptainEmptyState';
import { generateDailyRollCallPDF } from '../../../lib/pdfReport';

export interface RosterItem {
  studentId: string;
  rollNumber: string;
  fullName: string;
  group: string;
  phoneNumber: string;
  email: string;
  gender?: string;
  role?: string;
  status: AttendanceStatus;
  isMarked: boolean;
  studentsNote?: string;
  captainsNote?: string;
}

interface CaptainRollCallViewProps {
  assignedBatch: string;
  assignedSection: string;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  roster: RosterItem[];
  onChangeRosterStatus: (studentId: string, status: AttendanceStatus) => void;
  onChangeRosterCaptainsNote: (studentId: string, captainsNote: string) => void;
  onBulkSetStatus: (status: AttendanceStatus) => void;
  onSaveAttendance: () => Promise<void>;
  saving: boolean;
  saveSuccess: string | null;
  saveError: string | null;
  loading: boolean;
}

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatToIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if day is Friday (5) or Saturday (6)
const isAcademicWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 5 || day === 6;
};

// Step back skipping Friday and Saturday
const getPreviousAcademicDay = (currentDateStr: string): string => {
  const d = parseLocalDate(currentDateStr);
  d.setDate(d.getDate() - 1);
  while (isAcademicWeekend(d)) {
    d.setDate(d.getDate() - 1);
  }
  return formatToIso(d);
};

// Step forward skipping Friday and Saturday
const getNextAcademicDay = (currentDateStr: string): string => {
  const d = parseLocalDate(currentDateStr);
  d.setDate(d.getDate() + 1);
  while (isAcademicWeekend(d)) {
    d.setDate(d.getDate() + 1);
  }
  return formatToIso(d);
};

const getDisplayCaptainNote = (note?: string) => {
  if (!note) return '';
  const trimmed = note.trim().toLowerCase();
  if (
    trimmed === 'fraud present detected.' ||
    trimmed === 'frauded the attendance' ||
    trimmed === 'auto marked as absent'
  ) {
    return '';
  }
  return note;
};

export const CaptainRollCallView: React.FC<CaptainRollCallViewProps> = ({
  assignedBatch,
  assignedSection,
  selectedDate,
  onChangeDate,
  roster = [],
  onChangeRosterStatus,
  onChangeRosterCaptainsNote,
  onBulkSetStatus,
  onSaveAttendance,
  saving,
  saveSuccess,
  saveError,
  loading,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [dateWeekendWarning, setDateWeekendWarning] = useState<string | null>(null);

  const formatDateDDMMYYYY = (isoDateStr: string): string => {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return isoDateStr;
  };

  const handleDateChange = (val: string) => {
    if (!val) return;
    const d = parseLocalDate(val);
    if (isAcademicWeekend(d)) {
      const dayName = d.getDay() === 5 ? 'Friday' : 'Saturday';
      // Snap to preceding Thursday
      d.setDate(d.getDate() - (d.getDay() === 5 ? 1 : 2));
      const validIso = formatToIso(d);
      onChangeDate(validIso);
      setDateWeekendWarning(`${dayName}s are academic weekends (off-days). Shifted to Thursday (${formatDateDDMMYYYY(validIso)}).`);
      setTimeout(() => setDateWeekendWarning(null), 4000);
      return;
    }
    setDateWeekendWarning(null);
    onChangeDate(val);
  };

  const handleCertifyAndDownload = async () => {
    try {
      setDownloadingPdf(true);
      await onSaveAttendance();
      generateDailyRollCallPDF({
        batch: assignedBatch,
        section: assignedSection,
        selectedDate,
        roster: roster.map((r) => {
          const isCapt = r.role === 'captain' || Boolean(user && (r.studentId === user.userId || r.email === user.email || (r.rollNumber && user.rollNumber && r.rollNumber === user.rollNumber)));
          return {
            studentId: r.studentId,
            rollNumber: r.rollNumber,
            fullName: r.fullName,
            group: r.group,
            gender: r.gender || 'Male',
            role: r.role,
            isCaptain: isCapt,
            status: r.status,
            studentsNote: r.studentsNote,
            captainsNote: r.captainsNote,
          };
        }),
        captainUser: user
          ? {
              fullName: user.fullName,
              email: user.email,
              rollNumber: user.rollNumber,
              role: user.role,
            }
          : null,
      });
    } catch (err) {
      console.error('Error in Certify and Download:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const filteredRoster = useMemo(() => {
    const list = [...(roster || [])]; // clone to avoid mutating original
    let result = list;
    
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (st) =>
          (st.fullName ? st.fullName.toLowerCase().includes(q) : false) ||
          (st.rollNumber ? st.rollNumber.toLowerCase().includes(q) : false) ||
          (st.email ? st.email.toLowerCase().includes(q) : false)
      );
    }
    
    return result.sort((a, b) => {
      return (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }, [roster, searchTerm]);

  const summary = useMemo(() => {
    const list = roster || [];
    const present = list.filter((r) => String(r.status).toLowerCase() === 'present').length;
    const absent = list.filter((r) => String(r.status).toLowerCase() === 'absent').length;
    const leave = list.filter((r) => ['leave', 'excused', 'late'].includes(String(r.status).toLowerCase())).length;
    const fraud = list.filter((r) => String(r.status).toLowerCase() === 'fraud').length;
    return { present, absent, leave, fraud, total: list.length };
  }, [roster]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const isSelectedDateToday = selectedDate === todayIso;

  return (
    <div className="space-y-2.5 sm:space-y-3.5">
      {/* Redesigned Clean Executive Control Bar */}
      <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200/90 shadow-2xs space-y-3">
        {/* Header Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-100/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Daily Roll-Call Ledger</h2>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                {assignedBatch} • Section {assignedSection}
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 pl-8">
              Verify attendance rolls, certify daily records, and download the official PDF sheet.
            </p>
          </div>

          {/* Roll Tags Legend */}
          <div className="hidden lg:flex items-center gap-1.5 text-[9px] font-bold">
            <span className="text-slate-400 font-medium">Roll Tags:</span>
            <span className="px-1.5 py-0.5 rounded border bg-blue-50 border-blue-300 text-blue-800 font-mono">
              Boys
            </span>
            <span className="px-1.5 py-0.5 rounded border bg-pink-50 border-pink-300 text-pink-700 font-mono">
              Girls
            </span>
            <span className="px-1.5 py-0.5 rounded border bg-blue-200 border-blue-700 text-blue-950 font-mono">
              Captain (Boy)
            </span>
            <span className="px-1.5 py-0.5 rounded border bg-pink-200 border-pink-700 text-pink-950 font-mono">
              Captain (Girl)
            </span>
          </div>
        </div>

        {/* Controls Toolbar: Compact Date Selector & Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-0.5">
          {/* Date Picker Component & Navigation Arrows */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-sky-50/90 px-2.5 py-1.5 rounded-xl border border-sky-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-[11px] font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Left (<) and Right (>) Day Navigation Arrows (Skips Friday & Saturday) */}
            <div className="flex items-center gap-1">
              <button
                id="btn-prev-academic-date"
                type="button"
                onClick={() => {
                  const prev = getPreviousAcademicDay(selectedDate);
                  setDateWeekendWarning(null);
                  onChangeDate(prev);
                }}
                title="Previous academic day (skips Friday & Saturday)"
                className="w-8 h-8 flex items-center justify-center text-slate-700 bg-white hover:bg-sky-50 active:bg-sky-100 hover:text-sky-700 border border-sky-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
                aria-label="Previous date"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                id="btn-next-academic-date"
                type="button"
                onClick={() => {
                  const next = getNextAcademicDay(selectedDate);
                  setDateWeekendWarning(null);
                  onChangeDate(next);
                }}
                title="Next academic day (skips Friday & Saturday)"
                className="w-8 h-8 flex items-center justify-center text-slate-700 bg-white hover:bg-sky-50 active:bg-sky-100 hover:text-sky-700 border border-sky-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
                aria-label="Next date"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Primary Requested Button: Certify and Download */}
            <button
              id="btn-save-captain-attendance"
              type="button"
              onClick={handleCertifyAndDownload}
              disabled={saving || downloadingPdf || roster.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {saving || downloadingPdf ? 'Certifying & Downloading...' : 'Certify and Download'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {dateWeekendWarning && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{dateWeekendWarning}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Bulk Action & Search Bar */}
      <div className="p-2.5 sm:p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-sky-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Bulk Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full md:w-auto">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">Bulk Mark:</span>
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onBulkSetStatus('present')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Present</span>
            </button>
            <button
              type="button"
              onClick={() => onBulkSetStatus('absent')}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            >
              <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>Absent</span>
            </button>
            <button
              type="button"
              onClick={() => onBulkSetStatus('leave')}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-amber-200 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            >
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Leave</span>
            </button>
            <button
              type="button"
              onClick={() => onBulkSetStatus('fraud')}
              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-purple-200 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-3 h-3 text-purple-600 shrink-0" />
              <span>Fraud</span>
            </button>
          </div>
        </div>

        {/* Student Search */}
        <div className="relative w-full md:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-[11px] font-medium bg-white border border-sky-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      {/* Roster Roll-Call Container */}
      <div className="p-2.5 sm:p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-sky-200/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-sky-100 pb-2">
          <div className="text-[10px] text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredRoster.length}</strong> of <strong className="text-slate-900">{roster.length}</strong> enrolled students
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] font-extrabold flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">{summary.present} Present</span>
            <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">{summary.absent} Absent</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">{summary.leave} Leave</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">{summary.fraud} Fraud</span>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-[11px] font-bold text-sky-600 animate-pulse">
            Loading section roster from database...
          </div>
        ) : filteredRoster.length > 0 ? (
          <>
            {/* Mobile Touch-Optimized Cards List (< md) */}
            <div className="block md:hidden space-y-2">
              {filteredRoster.map((st) => {
                const isSelf = user && (st.studentId === user.userId || st.email === user.email || (st.rollNumber && st.rollNumber === user.rollNumber));
                const isCoCaptain = st.role === 'captain' && !isSelf;
                const isAnyCaptain = isSelf || isCoCaptain || st.role === 'captain';
                const currentStatus = String(st.status || 'Absent').toLowerCase();
                const isFemale = String(st.gender || '').toLowerCase() === 'female';

                return (
                  <div
                    key={st.studentId}
                    className={`p-2.5 rounded-xl border space-y-2 transition-all shadow-2xs ${
                      isSelf
                        ? 'bg-sky-100/70 border-sky-300 ring-1 ring-sky-400/30'
                        : isCoCaptain
                        ? 'bg-amber-50/80 border-amber-200'
                        : 'bg-sky-50/40 border-sky-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        {/* Roll number bounded box with gender & captain color */}
                        <div className={`w-8 h-8 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 border shadow-2xs ${
                          isAnyCaptain && isFemale
                            ? 'bg-pink-200 border-pink-700 text-pink-950 font-black'
                            : isAnyCaptain && !isFemale
                            ? 'bg-blue-200 border-blue-700 text-blue-950 font-black'
                            : isFemale 
                            ? 'bg-pink-50 border-pink-300 text-pink-700' 
                            : 'bg-blue-50 border-blue-300 text-blue-800'
                        }`}>
                          <span>{st.rollNumber}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{st.fullName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-sky-600 text-white">
                                You
                              </span>
                            )}
                            {isCoCaptain && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-amber-500 text-white">
                                Co-Captain
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-sky-700 font-mono block truncate">{st.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-white border border-sky-200 text-slate-600 shrink-0">
                          {st.group}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-extrabold uppercase border shrink-0 ${
                          isFemale
                            ? 'bg-pink-50 border-pink-200 text-pink-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {isFemale ? 'FEMALE' : 'MALE'}
                        </span>
                      </div>
                    </div>

                    {st.studentsNote && (
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-medium">
                        <strong>Student Note:</strong> {st.studentsNote}
                      </div>
                    )}

                    {/* Status Button Group for Touch */}
                    <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-white rounded-lg border border-sky-200">
                      {[
                        { value: 'present', label: 'Present', activeClass: 'bg-emerald-600 text-white shadow-2xs' },
                        { value: 'absent', label: 'Absent', activeClass: 'bg-rose-600 text-white shadow-2xs' },
                        { value: 'leave', label: 'Leave', activeClass: 'bg-amber-600 text-white shadow-2xs' },
                        { value: 'fraud', label: 'Fraud', activeClass: 'bg-purple-700 text-white shadow-2xs' },
                      ].map((opt) => {
                        const isSelected = currentStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChangeRosterStatus(st.studentId, opt.value as AttendanceStatus)}
                            className={`py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider rounded-md transition-all text-center cursor-pointer ${
                              isSelected
                                ? opt.activeClass
                                : 'text-slate-600 hover:bg-sky-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Note Input */}
                    <input
                      type="text"
                      placeholder="Captain note / remark..."
                      value={getDisplayCaptainNote(st.captainsNote)}
                      onChange={(e) => onChangeRosterCaptainsNote(st.studentId, e.target.value)}
                      className="w-full px-2 py-1 text-[10px] bg-white border border-sky-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-sky-100">
                  <tr>
                    <th className="py-2.5 px-2.5 w-28">Roll Number</th>
                    <th className="py-2.5 px-2.5">Student Email & Name</th>
                    <th className="py-2.5 px-2.5">Group</th>
                    <th className="py-2.5 px-2.5">Status [Present / Absent / Leave / Fraud]</th>
                    <th className="py-2.5 px-2.5">Captain's Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-800 text-[11px]">
                  {filteredRoster.map((st) => {
                    const isSelf = user && (st.studentId === user.userId || st.email === user.email || (st.rollNumber && st.rollNumber === user.rollNumber));
                    const isCoCaptain = st.role === 'captain' && !isSelf;
                    const isAnyCaptain = isSelf || isCoCaptain || st.role === 'captain';
                    const currentStatus = String(st.status || 'Absent').toLowerCase();
                    const isFemale = String(st.gender || '').toLowerCase() === 'female';

                    return (
                      <tr
                        key={st.studentId}
                        className={`transition-colors ${
                          isSelf
                            ? 'bg-sky-100/60 font-semibold'
                            : isCoCaptain
                            ? 'bg-amber-50/70 hover:bg-amber-50 font-medium'
                            : 'hover:bg-sky-50/50'
                        }`}
                      >
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {/* Bounded Roll box with gender & captain specific color */}
                          <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-extrabold text-[11px] border shadow-2xs ${
                            isAnyCaptain && isFemale
                              ? 'bg-pink-200 border-pink-700 text-pink-950 font-black'
                              : isAnyCaptain && !isFemale
                              ? 'bg-blue-200 border-blue-700 text-blue-950 font-black'
                              : isFemale
                              ? 'bg-pink-50 border-pink-300 text-pink-700'
                              : 'bg-blue-50 border-blue-300 text-blue-800'
                          }`}>
                            <span>{st.rollNumber}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-slate-900 block text-xs">{st.fullName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-sky-600 text-white inline-flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                You (Captain)
                              </span>
                            )}
                            {isCoCaptain && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500 text-white inline-flex items-center gap-0.5 shadow-xs">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Co-Captain
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-sky-700 font-mono font-medium">{st.email}</span>
                          {st.studentsNote && (
                            <div className="mt-0.5 text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded inline-block">
                              <strong>Student:</strong> {st.studentsNote}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-700">{st.group}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-extrabold uppercase border ${
                              isFemale
                                ? 'bg-pink-50 border-pink-200 text-pink-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                              {isFemale ? 'FEMALE' : 'MALE'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <div className="inline-flex rounded-lg p-0.5 bg-sky-50 border border-sky-200 gap-0.5">
                            {[
                              { value: 'present', label: 'Present', activeClass: 'bg-emerald-600 text-white shadow-2xs' },
                              { value: 'absent', label: 'Absent', activeClass: 'bg-rose-600 text-white shadow-2xs' },
                              { value: 'leave', label: 'Leave', activeClass: 'bg-amber-600 text-white shadow-2xs' },
                              { value: 'fraud', label: 'Fraud', activeClass: 'bg-purple-700 text-white shadow-2xs' },
                            ].map((opt) => {
                              const isSelected = currentStatus === opt.value;

                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => onChangeRosterStatus(st.studentId, opt.value as AttendanceStatus)}
                                  className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                                    isSelected
                                      ? opt.activeClass
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            placeholder="Captain's note..."
                            value={getDisplayCaptainNote(st.captainsNote)}
                            onChange={(e) => onChangeRosterCaptainsNote(st.studentId, e.target.value)}
                            className="w-full px-2 py-1 text-[11px] font-medium bg-white border border-sky-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <CaptainEmptyState
            icon={Users}
            title={roster.length === 0 ? "No Approved Students in Section" : "No Matching Students"}
            description={
              roster.length === 0
                ? `There are currently no approved students registered under Section ${assignedSection} (${assignedBatch}) in the database.`
                : "No students match your search criteria. Try a different name or roll number."
            }
            actionLabel={roster.length === 0 ? "Class Students & Approvals" : undefined}
            onAction={roster.length === 0 ? () => navigate('/captain/roster') : undefined}
          />
        )}
      </div>

      {/* Bottom Certify Attendance Action Bar */}
      <div className="p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="text-center sm:text-left space-y-0.5">
          <div className="text-[11px] sm:text-xs font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Ready to certify section roll-call?</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-relaxed">
            Saves {summary.present} Present, {summary.absent} Absent, {summary.leave} Leave, and {summary.fraud} Fraud records for{' '}
            <span className="font-bold text-slate-700 whitespace-nowrap">{formatDateDDMMYYYY(selectedDate)}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-save-captain-attendance-bottom"
            type="button"
            onClick={handleCertifyAndDownload}
            disabled={saving || downloadingPdf || roster.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{saving || downloadingPdf ? 'Certifying & Downloading...' : 'Certify and Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};



