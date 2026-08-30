import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  MessageSquare,
  Pencil,
  Plus,
  X,
  Palmtree,
  CalendarRange,
  Sun,
  Lock,
  Key,
  Unlock,
  FileDown
} from 'lucide-react';
import { AttendanceStatus, Holiday, CaptainEditPermissionStatus } from '../../../types';
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
  onBulkSetStatus?: (status: AttendanceStatus) => void;
  onSaveAttendance: () => Promise<void>;
  saving: boolean;
  saveSuccess: string | null;
  saveError: string | null;
  loading: boolean;
  activeHoliday?: Holiday | null;
  editPermission?: CaptainEditPermissionStatus | null;
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

interface CaptainNoteCellProps {
  note?: string;
  onSave: (newNote: string) => void;
  disabled?: boolean;
}

const CaptainNoteCell: React.FC<CaptainNoteCellProps> = ({ note = '', onSave, disabled = false }) => {
  const displayNote = getDisplayCaptainNote(note);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(displayNote);

  useEffect(() => {
    setValue(displayNote);
  }, [displayNote]);

  const handleSave = () => {
    setIsEditing(false);
    onSave(value.trim());
  };

  if (disabled) {
    if (displayNote) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-medium">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{displayNote}</span>
        </div>
      );
    }
    return <span className="text-[10px] text-slate-400 font-mono italic">No note</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 w-full">
        <input
          type="text"
          autoFocus
          placeholder="Enter captain note..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setValue(displayNote);
              setIsEditing(false);
            }
          }}
          onBlur={handleSave}
          className="w-full px-2.5 py-1 text-xs font-medium bg-white border-2 border-sky-400 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden shadow-2xs"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="p-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
          title="Save Note"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (displayNote) {
    return (
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-sky-950 text-xs font-medium group">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="truncate">{displayNote}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-white rounded-md transition-colors cursor-pointer"
            title="Edit Note"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onSave('')}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors cursor-pointer"
            title="Delete Note"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-sky-600 transition-colors py-0.5 px-2 rounded-lg hover:bg-sky-50/80 border border-dashed border-slate-200 hover:border-sky-300 cursor-pointer"
    >
      <Plus className="w-3 h-3 text-slate-400" />
      <span>Add Note</span>
    </button>
  );
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
  activeHoliday,
  editPermission,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [dateWeekendWarning, setDateWeekendWarning] = useState<string | null>(null);

  // Live timer tick for active override countdown
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const isSelectedDateToday = selectedDate === todayIso;

  const canEditAttendance = useMemo(() => {
    if (activeHoliday) return false;
    if (editPermission !== undefined && editPermission !== null) {
      return Boolean(editPermission.allowed);
    }
    return isSelectedDateToday;
  }, [activeHoliday, editPermission, isSelectedDateToday]);

  const activeOverrideInfo = useMemo(() => {
    if (!editPermission?.activeOverride) return null;
    const expiresAt = new Date(editPermission.activeOverride.expiresAt).getTime();
    const diffSec = Math.max(0, Math.floor((expiresAt - nowTime) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const isExpired = diffSec <= 0;
    return {
      grantedBy: editPermission.activeOverride.grantedBy?.name || 'Administrator',
      reason: editPermission.activeOverride.reason,
      targetDate: editPermission.activeOverride.targetDate,
      remainingText: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      isExpired,
    };
  }, [editPermission, nowTime]);

  const otherActiveGrants = useMemo(() => {
    if (!editPermission?.activeGrants) return [];
    return editPermission.activeGrants
      .filter((g) => g.targetDate !== selectedDate && new Date(g.expiresAt).getTime() > nowTime)
      .map((g) => {
        const diffSec = Math.max(0, Math.floor((new Date(g.expiresAt).getTime() - nowTime) / 1000));
        return {
          ...g,
          remainingSeconds: diffSec,
          remainingText: `${String(Math.floor(diffSec / 60)).padStart(2, '0')}:${String(diffSec % 60).padStart(2, '0')}`,
        };
      });
  }, [editPermission?.activeGrants, selectedDate, nowTime]);

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

  const handleOnlyDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
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
      console.error('Error generating PDF report:', err);
    } finally {
      setDownloadingPdf(false);
    }
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

  return (
    <div className="space-y-2.5 sm:space-y-3.5">
      {/* 1. TOP BANNER: Active Admin Edit Grant for Currently Selected Date */}
      {activeOverrideInfo && !activeOverrideInfo.isExpired && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-500 text-emerald-950 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0 ring-4 ring-emerald-100">
                <Key className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight">
                    Edit Access Granted by Administrator
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 border border-emerald-400 text-emerald-950 font-mono text-[11px] font-black flex items-center gap-1 shadow-2xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping" />
                    ⏱ {activeOverrideInfo.remainingText} left
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider">
                    {formatDateDDMMYYYY(selectedDate)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium mt-1 leading-snug">
                  Authorized by <strong className="text-emerald-950 font-bold">{activeOverrideInfo.grantedBy}</strong>. You have full edit, save, and official PDF certification authorization for this roll-call ledger.
                  {activeOverrideInfo.reason && (
                    <span className="block text-[10px] text-emerald-900/90 font-semibold mt-0.5">
                      Memo: "{activeOverrideInfo.reason}"
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Edit Access Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP BANNER: Active Admin Grant for Other Academic Dates - Aesthetic Glowing Warm Bronze / Brown */}
      {otherActiveGrants.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#fdf8f4] via-[#fbf3ec] to-[#f7ebe1] border-2 border-[#b07d58]/70 text-[#43281c] shadow-[0_4px_20px_rgba(146,64,14,0.18)] ring-1 ring-[#c99a75]/40 animate-in fade-in transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7f4f24] via-[#936639] to-[#a68a64] text-amber-50 flex items-center justify-center shadow-md ring-2 ring-[#c99a75]/50 shrink-0">
                <Clock className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-[#3d2314] tracking-tight">
                    You have active edit permissions for other dates:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ebd7c8] border border-[#b07d58]/60 text-[#43281c] font-mono text-xs font-black shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7f4f24] animate-ping" />
                    {otherActiveGrants.map((g) => formatDateDDMMYYYY(g.targetDate)).join(', ')}
                  </span>
                </div>
                <p className="text-[11px] text-[#6b4423] font-medium mt-0.5 leading-snug">
                  Switch to the authorized date below to update rolls and certify attendance.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
              {otherActiveGrants.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChangeDate(g.targetDate)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7f4f24] via-[#936639] to-[#7f4f24] hover:from-[#653e1b] hover:to-[#7f4f24] text-amber-50 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-[0_2px_12px_rgba(127,79,36,0.35)] hover:shadow-[0_4px_16px_rgba(127,79,36,0.5)] ring-1 ring-[#d4a373]/60 cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <span>Go to {formatDateDDMMYYYY(g.targetDate)}</span>
                  <span className="font-mono text-[10px] font-black bg-[#43281c]/90 text-amber-200 px-1.5 py-0.5 rounded-md border border-[#c99a75]/40 shadow-inner">
                    {g.remainingText}
                  </span>
                  <span className="text-amber-300 font-black">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            {activeHoliday ? (
              <div className="px-3.5 py-2 bg-amber-100/90 border border-amber-300 text-amber-950 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="whitespace-nowrap">Roll Call Locked (Holiday)</span>
              </div>
            ) : canEditAttendance ? (
              /* Primary Requested Button: Certify and Download */
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
            ) : (
              /* Read-only Ledger PDF Download */
              <button
                id="btn-download-readonly-pdf"
                type="button"
                onClick={handleOnlyDownloadPdf}
                disabled={downloadingPdf || roster.length === 0}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0"
                title="Download roll-call ledger PDF in read-only mode"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">
                  {downloadingPdf ? 'Generating PDF...' : 'Download Ledger PDF'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications & Dynamic Status Warnings */}
      {!canEditAttendance && !activeHoliday && (
        <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-amber-950 text-xs sm:text-sm">Roll-Call Locked (Read-Only Mode)</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-black">
                  {editPermission?.reason || (isSelectedDateToday ? 'Outside 12:05 AM – 11:55 PM window' : 'Past/future dates locked')}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                Captains can only update same-day attendance between 12:05 AM and 11:55 PM. For past or future records, an Academic Admin must grant a temporary Edit Window.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-1 rounded-lg border border-amber-300 shrink-0 self-end sm:self-auto">
            View Only
          </div>
        </div>
      )}

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

      {activeHoliday ? (
        /* Blocked Access View for Holiday */
        <div className="p-6 sm:p-10 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-amber-300 shadow-sm space-y-6 text-center animate-in fade-in duration-200">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md ring-4 ring-amber-100">
            <Palmtree className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Roll Call Locked • Academic Holiday</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeHoliday.title}
            </h3>

            <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
              <CalendarRange className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-mono">{formatDateDDMMYYYY(activeHoliday.startDate)}</span>
              <span className="text-slate-400 font-normal">through</span>
              <span className="font-mono">{formatDateDDMMYYYY(activeHoliday.endDate)}</span>
            </div>

            {activeHoliday.description && (
              <p className="text-xs sm:text-sm text-slate-600 italic bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 max-w-lg mx-auto leading-relaxed">
                "{activeHoliday.description}"
              </p>
            )}

            <p className="text-xs text-slate-500 leading-relaxed pt-1 max-w-md mx-auto">
              Roll-call roster access, student self-reporting, and attendance certification are blocked during declared holidays for <strong>Section {assignedSection} ({assignedBatch})</strong>.
            </p>
          </div>

          {/* Quick Navigation and Holiday Management Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => {
                const prev = getPreviousAcademicDay(selectedDate);
                setDateWeekendWarning(null);
                onChangeDate(prev);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl transition-all shadow-2xs hover:border-sky-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-sky-600" />
              <span>Previous Academic Day</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = getNextAcademicDay(selectedDate);
                setDateWeekendWarning(null);
                onChangeDate(next);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl transition-all shadow-2xs hover:border-sky-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Next Academic Day</span>
              <ChevronRight className="w-4 h-4 text-sky-600" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/captain/holidays')}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Calendar className="w-4 h-4 text-amber-100" />
              <span>Manage Section Holidays</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Student Search Bar */}
          <div className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-md rounded-2xl border border-sky-200/80 shadow-2xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student by name, roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-white border border-sky-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-hidden focus:border-sky-500 shadow-2xs"
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
                                disabled={!canEditAttendance}
                                onClick={canEditAttendance ? () => onChangeRosterStatus(st.studentId, opt.value as AttendanceStatus) : undefined}
                                className={`py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider rounded-md transition-all text-center ${
                                  !canEditAttendance
                                    ? isSelected
                                      ? opt.activeClass + ' cursor-not-allowed opacity-90'
                                      : 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-50'
                                    : isSelected
                                    ? opt.activeClass + ' cursor-pointer'
                                    : 'text-slate-600 hover:bg-sky-50 cursor-pointer'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Note Display / Action */}
                        <CaptainNoteCell
                          note={st.captainsNote}
                          onSave={(newNote) => onChangeRosterCaptainsNote(st.studentId, newNote)}
                          disabled={!canEditAttendance}
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
                                      disabled={!canEditAttendance}
                                      onClick={canEditAttendance ? () => onChangeRosterStatus(st.studentId, opt.value as AttendanceStatus) : undefined}
                                      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition-all ${
                                        !canEditAttendance
                                          ? isSelected
                                            ? opt.activeClass + ' cursor-not-allowed opacity-90'
                                            : 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-50'
                                          : isSelected
                                          ? opt.activeClass + ' cursor-pointer'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100 cursor-pointer'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <CaptainNoteCell
                                note={st.captainsNote}
                                onSave={(newNote) => onChangeRosterCaptainsNote(st.studentId, newNote)}
                                disabled={!canEditAttendance}
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
                {canEditAttendance ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Ready to certify section roll-call?</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Roll-call ledger is read-only for this date</span>
                  </>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-relaxed">
                {canEditAttendance
                  ? `Saves ${summary.present} Present, ${summary.absent} Absent, ${summary.leave} Leave, and ${summary.fraud} Fraud records for `
                  : `Official ledger snapshot for `}
                <span className="font-bold text-slate-700 whitespace-nowrap">{formatDateDDMMYYYY(selectedDate)}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {canEditAttendance ? (
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
              ) : (
                <button
                  id="btn-download-readonly-pdf-bottom"
                  type="button"
                  onClick={handleOnlyDownloadPdf}
                  disabled={downloadingPdf || roster.length === 0}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  <FileDown className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{downloadingPdf ? 'Generating PDF...' : 'Download Ledger PDF'}</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};



