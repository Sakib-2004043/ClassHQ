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
  description: string;
  value: string;
  onChange: (val: string) => void;
  presets: string[];
  fallback: TimeParts;
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label,
  description,
  value,
  onChange,
  presets,
  fallback,
}) => {
  const parts = useMemo(() => parseTimeToParts(value, fallback), [value, fallback]);

  const updateParts = (newParts: Partial<TimeParts>) => {
    const updated: TimeParts = { ...parts, ...newParts };
    onChange(partsToTimeString(updated));
  };

  return (
    <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
            {label}
          </label>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{description}</p>
        </div>
        <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 text-rose-700 font-mono font-black text-sm shadow-2xs">
          {value}
        </div>
      </div>

      {/* Selectors for Hour, Minute, and AM/PM */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Hour Dropdown */}
        <div className="col-span-4 sm:col-span-4">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Hour
          </label>
          <select
            value={parts.hour}
            onChange={(e) => updateParts({ hour: e.target.value })}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all cursor-pointer"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Minute Dropdown */}
        <div className="col-span-4 sm:col-span-4">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Minute
          </label>
          <select
            value={parts.minute}
            onChange={(e) => updateParts({ minute: e.target.value })}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-bold font-mono focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all cursor-pointer"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                :{m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Segmented Control */}
        <div className="col-span-4 sm:col-span-4">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Period
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-xl h-11 items-center">
            <button
              type="button"
              onClick={() => updateParts({ period: 'AM' })}
              className={`h-full rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                parts.period === 'AM'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => updateParts({ period: 'PM' })}
              className={`h-full rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                parts.period === 'PM'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="pt-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
          Quick Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const isSelected = value.toLowerCase().replace(/\s+/g, '') === preset.toLowerCase().replace(/\s+/g, '');
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-rose-100">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-200 shrink-0 shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">System Settings</h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Configure attendance submission windows and portal behavior.
            </p>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
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

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                Attendance Self-Reporting Window
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Next-Day Hub</span>
            </div>

            {/* Time Pickers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimePickerField
                label="Opening Time (Daily Start)"
                description="Time when students can start self-reporting for tomorrow."
                value={startTime}
                onChange={setStartTime}
                presets={startPresets}
                fallback={{ hour: '3', minute: '00', period: 'PM' }}
              />

              <TimePickerField
                label="Cutoff Time (Daily End)"
                description="Time when reporting closes and unconfirmed are marked absent."
                value={endTime}
                onChange={setEndTime}
                presets={endPresets}
                fallback={{ hour: '12', minute: '00', period: 'AM' }}
              />
            </div>

            {/* Visual Window Summary Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/70 to-amber-50/70 border border-rose-200/70 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-rose-600 flex items-center justify-center border border-rose-200 shrink-0 shadow-2xs">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-black text-slate-900 block">Active Attendance Window Rule:</span>
                <span className="text-slate-600 font-medium inline-flex items-center gap-1.5 flex-wrap mt-0.5">
                  Opens at <strong className="text-rose-700 font-mono">{startTime}</strong>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  Closes at <strong className="text-rose-700 font-mono">{endTime}</strong> daily.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStartTime('3:00 PM');
                setEndTime('12:00 AM');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl shadow-xs hover:shadow active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {settings?.updatedAt && (
          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-400 text-center">
            Last updated by {settings.updatedBy} on {new Date(settings.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

