import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Clock, Save, AlertTriangle, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { api } from '../../../lib/api';
import { SystemSettings } from '../../../types';

interface TimeParts {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

function parseTimeToParts(str: string, fallback: TimeParts): TimeParts {
  const match = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    const [_, h, m, p] = match;
    let hNum = parseInt(h, 10);
    if (hNum < 1 || hNum > 12) hNum = 12;
    return {
      hour: String(hNum),
      minute: m.padStart(2, '0'),
      period: (p.toUpperCase() === 'AM' ? 'AM' : 'PM'),
    };
  }
  return fallback;
}

function partsToTimeString(parts: TimeParts): string {
  return `${parts.hour}:${parts.minute.padStart(2, '0')} ${parts.period}`;
}

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  presets: string[];
  fallback: TimeParts;
  variant?: 'start' | 'end';
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label,
  value,
  onChange,
  presets,
  fallback,
  variant = 'start',
}) => {
  const parts = useMemo(() => parseTimeToParts(value, fallback), [value, fallback]);

  const updateParts = (newParts: Partial<TimeParts>) => {
    const updated: TimeParts = { ...parts, ...newParts };
    onChange(partsToTimeString(updated));
  };

  const isStart = variant === 'start';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
        isStart
          ? 'bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white border-amber-200/90 shadow-xs'
          : 'bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-white border-rose-200/90 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isStart ? 'bg-amber-500' : 'bg-rose-500'}`}
          />
          <label
            className={`text-xs sm:text-sm font-black uppercase tracking-wide ${
              isStart ? 'text-amber-950' : 'text-rose-950'
            }`}
          >
            {label}
          </label>
        </div>
        <div
          className={`px-3 py-1 rounded-xl border font-mono font-black text-sm shadow-2xs ${
            isStart
              ? 'bg-white border-amber-300 text-amber-900'
              : 'bg-white border-rose-300 text-rose-900'
          }`}
        >
          {value}
        </div>
      </div>

      {/* Selectors for Hour, Minute, and AM/PM */}
      <div className="grid grid-cols-12 gap-2 items-center mt-4">
        {/* Hour Dropdown */}
        <div className="col-span-4">
          <label
            className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${
              isStart ? 'text-amber-800/80' : 'text-rose-800/80'
            }`}
          >
            Hour
          </label>
          <select
            value={parts.hour}
            onChange={(e) => updateParts({ hour: e.target.value })}
            className={`w-full h-10 px-2.5 bg-white border rounded-xl text-slate-900 text-xs sm:text-sm font-bold outline-hidden transition-all cursor-pointer ${
              isStart
                ? 'border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'
                : 'border-rose-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
            }`}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Minute Dropdown */}
        <div className="col-span-4">
          <label
            className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${
              isStart ? 'text-amber-800/80' : 'text-rose-800/80'
            }`}
          >
            Minute
          </label>
          <select
            value={parts.minute}
            onChange={(e) => updateParts({ minute: e.target.value })}
            className={`w-full h-10 px-2.5 bg-white border rounded-xl text-slate-900 text-xs sm:text-sm font-bold font-mono outline-hidden transition-all cursor-pointer ${
              isStart
                ? 'border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'
                : 'border-rose-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
            }`}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                :{m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Segmented Control */}
        <div className="col-span-4">
          <label
            className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${
              isStart ? 'text-amber-800/80' : 'text-rose-800/80'
            }`}
          >
            Period
          </label>
          <div
            className={`grid grid-cols-2 gap-1 p-1 rounded-xl h-10 items-center border ${
              isStart
                ? 'bg-amber-100/70 border-amber-200/80'
                : 'bg-rose-100/70 border-rose-200/80'
            }`}
          >
            <button
              type="button"
              onClick={() => updateParts({ period: 'AM' })}
              className={`h-full rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                parts.period === 'AM'
                  ? isStart
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-rose-600 text-white shadow-xs'
                  : isStart
                  ? 'text-amber-900 hover:text-amber-950'
                  : 'text-rose-900 hover:text-rose-950'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => updateParts({ period: 'PM' })}
              className={`h-full rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                parts.period === 'PM'
                  ? isStart
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-rose-600 text-white shadow-xs'
                  : isStart
                  ? 'text-amber-900 hover:text-amber-950'
                  : 'text-rose-900 hover:text-rose-950'
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="pt-3 mt-3 border-t border-black/5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-[10px] font-black uppercase tracking-widest mr-1 ${
              isStart ? 'text-amber-800/70' : 'text-rose-800/70'
            }`}
          >
            Presets:
          </span>
          {presets.map((preset) => {
            const isSelected =
              value.toLowerCase().replace(/\s+/g, '') === preset.toLowerCase().replace(/\s+/g, '');
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? isStart
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-black'
                      : 'bg-rose-600 text-white border-rose-700 shadow-xs font-black'
                    : isStart
                    ? 'bg-white/90 text-amber-950 border-amber-200/90 hover:bg-amber-100 hover:text-amber-950'
                    : 'bg-white/90 text-rose-950 border-rose-200/90 hover:bg-rose-100 hover:text-rose-950'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [startTime, setStartTime] = useState('3:00 PM');
  const [endTime, setEndTime] = useState('12:00 AM');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemSettings();
      setSettings(res);
      setStartTime(res.startTime || '3:00 PM');
      setEndTime(res.endTime || '12:00 AM');
    } catch {
      setMessage({ text: 'Failed to load settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.updateSystemSettings({ startTime, endTime });
      if (res.success) {
        setSettings(res.settings);
        setMessage({ text: 'Attendance window settings updated successfully.', type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const startPresets = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
  const endPresets = ['10:00 PM', '11:00 PM', '11:59 PM', '12:00 AM', '1:00 AM', '2:00 AM'];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="bg-gradient-to-b from-white via-slate-50/50 to-white rounded-3xl p-5 sm:p-7 shadow-xs border border-rose-200/80">
        <div className="flex items-center gap-3.5 mb-5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-600 to-rose-500 text-white flex items-center justify-center ring-2 ring-rose-200 shrink-0 shadow-md shadow-rose-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Attendance Settings</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Configure daily attendance submission hours.
            </p>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-5 p-3.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 shadow-2xs'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-4">
            <div className="bg-slate-100/80 px-3.5 py-2.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                Reporting Window
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shadow-2xs">
                Daily Hub
              </span>
            </div>

            {/* Time Pickers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <TimePickerField
                label="Opening Time"
                value={startTime}
                onChange={setStartTime}
                presets={startPresets}
                fallback={{ hour: '3', minute: '00', period: 'PM' }}
                variant="start"
              />

              <TimePickerField
                label="Cutoff Time"
                value={endTime}
                onChange={setEndTime}
                presets={endPresets}
                fallback={{ hour: '12', minute: '00', period: 'AM' }}
                variant="end"
              />
            </div>

            {/* Visual Window Summary Badge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-100/80 via-red-50/90 to-amber-100/80 border border-rose-300/80 flex items-center gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center border border-rose-300 shrink-0 shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-slate-700 font-semibold inline-flex items-center gap-1.5 flex-wrap">
                  Active window: <strong className="text-amber-950 bg-amber-200/70 px-1.5 py-0.2 rounded border border-amber-300 font-mono">{startTime}</strong>
                  <ArrowRight className="w-3 h-3 text-rose-500 shrink-0" />
                  <strong className="text-rose-950 bg-rose-200/70 px-1.5 py-0.2 rounded border border-rose-300 font-mono">{endTime}</strong> daily.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setStartTime('3:00 PM');
                setEndTime('12:00 AM');
              }}
              className="px-3.5 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl border border-slate-300/80 transition-all cursor-pointer shadow-2xs"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 disabled:opacity-50 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-rose-500"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {settings?.updatedAt && (
          <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] sm:text-[11px] font-medium text-slate-500 text-center bg-slate-50/60 p-2 rounded-xl border border-slate-100">
            Last updated by <span className="text-slate-800 font-bold">{settings.updatedBy}</span> on {new Date(settings.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

