import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Key,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Unlock,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { AttendanceEditOverride, HSCBatch, Section, User } from '../../../types';

interface AdminOverridesViewProps {
  onRefresh?: () => void;
}

const BATCH_OPTIONS: HSCBatch[] = ['HSC 2025', 'HSC 2026', 'HSC 2027'];
const SECTION_OPTIONS: Section[] = ['A', 'B', 'C', 'D', 'E'];

const DURATION_PRESETS = [
  { label: '10m', value: 10, title: '10 Minutes' },
  { label: '30m', value: 30, title: '30 Minutes' },
  { label: '1h', value: 60, title: '1 Hour' },
  { label: '2h', value: 120, title: '2 Hours' },
  { label: '24h', value: 1440, title: '24 Hours' },
];

const normalizeBatch = (b?: string): string => {
  if (!b) return '';
  return b.replace(/[^0-9]/g, '');
};

const normalizeSection = (s?: string): string => {
  if (!s) return '';
  return s.trim().toUpperCase();
};

export const AdminOverridesView: React.FC<AdminOverridesViewProps> = () => {
  const [overrides, setOverrides] = useState<AttendanceEditOverride[]>([]);
  const [captains, setCaptains] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sequential Filtering Form State - Dynamic availability
  const [batch, setBatch] = useState<HSCBatch>('HSC 2026');
  const [section, setSection] = useState<Section>('A');
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>('all');
  const [targetDate, setTargetDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Live Timer tick to update countdowns smoothly every second
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overridesRes, studentsRes] = await Promise.all([
        api.getAdminOverrides().catch(() => ({ total: 0, overrides: [] })),
        api.getAdminStudents({ role: 'captain' }).catch(() => ({ total: 0, students: [] })),
      ]);

      setOverrides(overridesRes?.overrides || []);

      // Filter all approved captains
      const captainList = (studentsRes?.students || []).filter((s) => s.role === 'captain');
      setCaptains(captainList);
    } catch (err: any) {
      console.error('Error loading override data:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch access overrides.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Derive Available Batches dynamically based on captain availability
  const availableBatches = useMemo(() => {
    const set = new Set<string>();
    captains.forEach((c) => {
      const bRaw = c.assignedBatch || c.batch || (c as any).hscBatch;
      const num = normalizeBatch(bRaw);
      if (num) {
        set.add(`HSC ${num}`);
      }
    });
    const list = Array.from(set).sort();
    // If no captains exist yet or loaded, fallback to default batches so form is not broken
    return list.length > 0 ? list : BATCH_OPTIONS;
  }, [captains]);

  // Auto-sync selected batch if current batch is not in availableBatches
  useEffect(() => {
    if (availableBatches.length > 0 && !availableBatches.includes(batch)) {
      setBatch(availableBatches[0] as HSCBatch);
    }
  }, [availableBatches, batch]);

  // 2. Derive Available Sections dynamically based on selected Batch
  const availableSections = useMemo(() => {
    const selectedBatchYear = normalizeBatch(batch);
    const set = new Set<string>();
    captains.forEach((c) => {
      const bRaw = c.assignedBatch || c.batch || (c as any).hscBatch;
      const cBatch = normalizeBatch(bRaw);
      if (cBatch === selectedBatchYear) {
        const sec = normalizeSection(c.assignedSection || c.section);
        if (sec) {
          set.add(sec);
        }
      }
    });
    const list = Array.from(set).sort();
    // If no captains found for that specific batch, fallback to default sections
    return list.length > 0 ? list : SECTION_OPTIONS;
  }, [captains, batch]);

  // Auto-sync selected section if current section is not in availableSections
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(section)) {
      setSection(availableSections[0] as Section);
    }
  }, [availableSections, section]);

  // 3. Filter Captains strictly based on selected Batch and Section
  const filteredCaptains = useMemo(() => {
    const selectedBatchYear = normalizeBatch(batch);
    const selectedSec = normalizeSection(section);

    return captains.filter((c) => {
      const cBatch = normalizeBatch(c.assignedBatch || c.batch || (c as any).hscBatch);
      const cSec = normalizeSection(c.assignedSection || c.section);
      return cBatch === selectedBatchYear && cSec === selectedSec;
    });
  }, [captains, batch, section]);

  // Keep selectedCaptainId in sync when batch/section filters change
  useEffect(() => {
    if (selectedCaptainId === 'all') return;
    const exists = filteredCaptains.some((c) => c.id === selectedCaptainId);
    if (!exists) {
      // Default to "all" or the first available captain in that batch & section
      setSelectedCaptainId(filteredCaptains.length > 0 ? filteredCaptains[0].id : 'all');
    }
  }, [filteredCaptains, selectedCaptainId]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const finalDuration = customDuration.trim()
        ? Math.max(1, parseInt(customDuration, 10))
        : durationMinutes;

      const res = await api.createAdminOverride({
        captainId: selectedCaptainId,
        batch,
        section,
        targetDate,
        durationMinutes: finalDuration,
        reason: reason.trim() || 'Admin authorized roll-call edit override',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Access window granted successfully!' });
        setReason('');
        setCustomDuration('');
        await loadData();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: 'error', message: 'Failed to grant access window.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error granting access window.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await api.revokeAdminOverride(id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await loadData();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to revoke override.' });
    }
  };

  const handleExtend = async (id: string, additionalMinutes: number) => {
    try {
      const res = await api.extendAdminOverride(id, additionalMinutes);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await loadData();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to extend override.' });
    }
  };

  const getRemainingTimeFormatted = (expiresAtStr: string, status: string) => {
    if (status === 'revoked') return { label: 'Revoked', isExpired: true, text: 'Revoked' };
    const expTime = new Date(expiresAtStr).getTime();
    const diffSec = Math.floor((expTime - nowTimestamp) / 1000);

    if (diffSec <= 0 || status === 'expired') {
      return { label: 'Expired', isExpired: true, text: 'Expired' };
    }

    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    if (hours > 0) {
      return {
        label: `${hours}h ${minutes}m ${seconds}s left`,
        isExpired: false,
        text: `${hours}h ${minutes}m`,
      };
    }
    return {
      label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} left`,
      isExpired: false,
      text: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    };
  };

  const filteredOverrides = useMemo(() => {
    return overrides.filter((o) => {
      const remaining = getRemainingTimeFormatted(o.expiresAt, o.status);
      const isActuallyActive = o.status === 'active' && !remaining.isExpired;

      if (statusFilter === 'active' && !isActuallyActive) return false;
      if (statusFilter === 'expired' && isActuallyActive) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = o.captainName?.toLowerCase().includes(q);
        const matchEmail = o.captainEmail?.toLowerCase().includes(q);
        const matchDate = o.targetDate?.toLowerCase().includes(q);
        const matchReason = o.reason?.toLowerCase().includes(q);
        const matchBatch = o.batch?.toLowerCase().includes(q);
        const matchSec = o.section?.toLowerCase().includes(q);
        return matchName || matchEmail || matchDate || matchReason || matchBatch || matchSec;
      }

      return true;
    });
  }, [overrides, statusFilter, searchTerm, nowTimestamp]);

  const activeCount = overrides.filter((o) => {
    const rem = getRemainingTimeFormatted(o.expiresAt, o.status);
    return o.status === 'active' && !rem.isExpired;
  }).length;

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      {/* Compact Executive Header */}
      <div className="p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center font-black shadow-2xs shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                Roll-Call Access Grants
              </h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                Admin Control
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 line-clamp-1">
              Grant temporary edit windows (10m, 1h, etc.) to captains for past/locked attendance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeCount} Active</span>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition-all border border-slate-200 hover:border-rose-200 cursor-pointer active:scale-95"
            title="Refresh grants"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compact Feedback Banner */}
      {feedback && (
        <div
          className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-2xs animate-in fade-in duration-150 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span className="truncate">{feedback.message}</span>
        </div>
      )}

      {/* Main Responsive Grid: Grant Form (Left/Top) + Live Grants (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Column: Sequential Granting Form (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200/80 shadow-2xs p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Grant Edit Window</h3>
              <p className="text-[10px] text-slate-500 font-medium">Select Batch → Section → Captain</p>
            </div>
          </div>

          <form onSubmit={handleGrantAccess} className="space-y-2.5 text-xs">
            {/* Step 1: Batch Selection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700">
                  1. Select Batch
                </label>
                <span className="text-[9px] font-bold text-rose-600 font-mono">{batch}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableBatches.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBatch(b as HSCBatch)}
                    className={`flex-1 min-w-[65px] py-1 px-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all text-center cursor-pointer border ${
                      batch === b
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Section Selection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700">
                  2. Select Section
                </label>
                <span className="text-[9px] font-bold text-rose-600 font-mono">Sec {section}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableSections.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSection(s as Section)}
                    className={`flex-1 min-w-[32px] py-1 px-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all text-center cursor-pointer border ${
                      section === s
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Captain Selection (Filtered by Batch & Section) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700">
                  3. Select Captain
                </label>
                <span className="text-[9px] text-slate-500 font-medium">
                  {filteredCaptains.length > 0
                    ? `${filteredCaptains.length} captain${filteredCaptains.length > 1 ? 's' : ''} found`
                    : 'No assigned captain'}
                </span>
              </div>
              <select
                value={selectedCaptainId}
                onChange={(e) => setSelectedCaptainId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[11px] font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
              >
                <option value="all">
                  ⚡ All Captains in Sec {section} ({batch})
                </option>
                {filteredCaptains.map((cap) => (
                  <option key={cap.id} value={cap.id}>
                    {cap.fullName} {cap.rollNumber ? `(Roll: ${cap.rollNumber})` : ''}
                  </option>
                ))}
              </select>
              {filteredCaptains.length === 0 && (
                <p className="text-[9px] text-amber-700 font-medium bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200">
                  Tip: "All Captains" grants access to any captain in Sec {section} ({batch}).
                </p>
              )}
            </div>

            {/* Step 4: Target Attendance Date */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700">
                  4. Attendance Date
                </label>
                <div className="flex items-center gap-1 text-[9px]">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setTargetDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-rose-600 hover:underline font-bold"
                  >
                    Today
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setTargetDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-rose-600 hover:underline font-bold"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[11px] font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:border-rose-400 cursor-pointer"
              />
            </div>

            {/* Step 5: Duration Presets */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700">
                  5. Duration Window
                </label>
                <span className="text-[9px] font-bold text-slate-500 font-mono">
                  {customDuration ? `${customDuration}m` : `${durationMinutes}m`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(preset.value);
                      setCustomDuration('');
                    }}
                    className={`py-1 px-0.5 rounded-lg text-center border transition-all cursor-pointer ${
                      durationMinutes === preset.value && !customDuration
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-black'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200 font-bold'
                    }`}
                  >
                    <span className="text-[10px]">{preset.label}</span>
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="10080"
                placeholder="Or custom minutes (e.g. 15, 45, 90)..."
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="w-full px-2.5 py-1 text-[10px] font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:border-rose-400 placeholder:text-slate-400"
              />
            </div>

            {/* Optional Memo / Reason */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700">
                Reason / Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Captain correction requested"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[11px] font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:border-rose-400 placeholder:text-slate-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50 mt-1"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{submitting ? 'Granting...' : 'Grant Edit Access'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Grants Overview & Active Overrides (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-2.5">
          {/* Compact Filter & Search Bar */}
          <div className="p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search captain, batch, section, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({overrides.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'expired' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expired
              </button>
            </div>
          </div>

          {/* Grants List */}
          {filteredOverrides.length === 0 ? (
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-rose-100 shadow-2xs text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">No Access Grants Found</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-0.5">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No grants match your search or filter.'
                    : 'No edit grants issued yet. Use the form to grant a captain temporary edit permission.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOverrides.map((grant) => {
                const remaining = getRemainingTimeFormatted(grant.expiresAt, grant.status);
                const isActive = grant.status === 'active' && !remaining.isExpired;

                return (
                  <div
                    key={grant.id}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-white/95 border-emerald-300 shadow-2xs ring-1 ring-emerald-200'
                        : 'bg-slate-50/90 border-slate-200/80 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-1.5 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] sm:text-xs font-black text-slate-900">
                            {grant.captainName}
                          </span>
                          {grant.captainRoll && (
                            <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px] font-mono font-bold">
                              Roll: {grant.captainRoll}
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            {grant.batch} • Sec {grant.section}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <span>Target Date: <strong className="text-slate-800 font-mono">{grant.targetDate}</strong></span>
                          <span>•</span>
                          <span>Duration: <strong>{grant.durationMinutes}m</strong></span>
                        </div>
                      </div>

                      {/* Live Status Badge */}
                      <div className="shrink-0 self-end sm:self-auto">
                        {isActive ? (
                          <div className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-950 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <Clock className="w-3 h-3 text-emerald-700" />
                            <span className="font-mono">{remaining.label}</span>
                          </div>
                        ) : grant.status === 'revoked' ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-wider rounded border border-rose-200">
                            Revoked
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer with reason & admin quick actions */}
                    <div className="pt-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[10px]">
                      <div className="space-y-0.5 text-slate-500">
                        {grant.reason && (
                          <p className="text-slate-700 italic font-medium line-clamp-1">"{grant.reason}"</p>
                        )}
                        <p className="text-[9px]">
                          By <strong>{grant.grantedBy.name}</strong> • Expires{' '}
                          {new Date(grant.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Actions Toolbar */}
                      {isActive && (
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleExtend(grant.id, 15)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            title="Extend window by 15 mins"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExtend(grant.id, 60)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            title="Extend window by 1 hour"
                          >
                            +1h
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(grant.id)}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            title="Revoke access immediately"
                          >
                            Revoke
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

