import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AttendanceStatus, LeaveRequest, CaptainSectionStats, User, ApprovalStatus, AttendanceRecord, LeaveType } from '../../types';
import { CaptainNavbar } from './components/CaptainNavbar';
import { CaptainRollCallView, RosterItem } from './components/CaptainRollCallView';
import { CaptainRosterView } from './components/CaptainRosterView';
import { CaptainLeavesView } from './components/CaptainLeavesView';
import { CaptainMyProfileView } from './components/CaptainMyProfileView';
import { CaptainSelfAttendanceView } from './components/CaptainSelfAttendanceView';
import { CaptainUserProfileModal } from './components/CaptainUserProfileModal';

const getInitialAcademicDate = (): string => {
  const now = new Date();
  const day = now.getDay();
  // 5 = Friday, 6 = Saturday
  if (day === 5) {
    now.setDate(now.getDate() - 1); // snap to Thursday
  } else if (day === 6) {
    now.setDate(now.getDate() - 2); // snap to Thursday
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${d}`;
};

export const CaptainPortal: React.FC = () => {
  const { user } = useAuth();
  const assignedBatch = user?.assignedBatch || user?.batch || 'HSC 2026';
  const assignedSection = user?.assignedSection || user?.section || 'A';

  const [selectedDate, setSelectedDate] = useState<string>(getInitialAcademicDate);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [stats, setStats] = useState<CaptainSectionStats | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [personalRecords, setPersonalRecords] = useState<AttendanceRecord[]>([]);
  const [personalLeaves, setPersonalLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Student Profile Modal State for Captain
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<User | null>(null);

  const fetchCaptainData = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const [rosterRes, statsRes, leavesRes, personalAttRes, personalLeavesRes] = await Promise.all([
        api.getCaptainRoster(selectedDate, assignedBatch, assignedSection).catch(() => null),
        api.getCaptainSectionStats(assignedBatch, assignedSection).catch(() => null),
        api.getCaptainSectionLeaves(assignedBatch, assignedSection).catch(() => null),
        user?.userId ? api.getStudentAttendance(user.userId).catch(() => ({ records: [] })) : Promise.resolve({ records: [] }),
        user?.userId ? api.getStudentLeaves(user.userId).catch(() => ({ leaves: [] })) : Promise.resolve({ leaves: [] }),
      ]);

      if (rosterRes?.roster) {
        setRoster(
          rosterRes.roster.map((r) => ({
            studentId: r.studentId,
            rollNumber: r.rollNumber,
            fullName: r.fullName,
            group: r.group,
            phoneNumber: r.phoneNumber,
            email: r.email,
            gender: (r as any).gender || 'Male',
            role: r.role,
            status: (r.status as AttendanceStatus) || 'Absent',
            isMarked: r.isMarked,
            studentsNote: r.studentsNote || '',
            captainsNote: r.captainsNote || '',
          }))
        );
      }

      if (statsRes) setStats(statsRes);
      if (leavesRes?.leaves) setLeaves(leavesRes.leaves);
      if (personalAttRes?.records) setPersonalRecords(personalAttRes.records);
      if (personalLeavesRes?.leaves) setPersonalLeaves(personalLeavesRes.leaves);
    } catch (err: any) {
      console.error('Error loading captain portal data:', err);
      setSaveError(err.message || 'Failed to fetch section records from database.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, assignedBatch, assignedSection, user?.userId]);

  useEffect(() => {
    fetchCaptainData();
  }, [fetchCaptainData]);

  const isAutoFraudNote = (note?: string) => {
    if (!note) return false;
    const t = note.trim().toLowerCase();
    return t === 'fraud present detected.' || t === 'frauded the attendance';
  };

  const handleChangeRosterStatus = (studentId: string, status: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const isFraud = String(status).toLowerCase() === 'fraud';
          let updatedNote = item.captainsNote || '';
          if (isFraud) {
            if (!updatedNote || isAutoFraudNote(updatedNote)) {
              updatedNote = 'Fraud Present Detected.';
            }
          } else {
            if (isAutoFraudNote(updatedNote)) {
              updatedNote = '';
            }
          }
          return {
            ...item,
            status,
            captainsNote: updatedNote,
          };
        }
        return item;
      })
    );
  };

  const handleChangeRosterCaptainsNote = (studentId: string, captainsNote: string) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const isFraud = String(item.status).toLowerCase() === 'fraud';
          let noteValue = captainsNote;
          if (!noteValue.trim() && isFraud) {
            noteValue = 'Fraud Present Detected.';
          }
          return { ...item, captainsNote: noteValue };
        }
        return item;
      })
    );
  };

  const handleBulkSetStatus = (status: AttendanceStatus) => {
    const isFraud = String(status).toLowerCase() === 'fraud';
    setRoster((prev) =>
      prev.map((item) => {
        let updatedNote = item.captainsNote || '';
        if (isFraud) {
          if (!updatedNote || isAutoFraudNote(updatedNote)) {
            updatedNote = 'Fraud Present Detected.';
          }
        } else {
          if (isAutoFraudNote(updatedNote)) {
            updatedNote = '';
          }
        }
        return {
          ...item,
          status,
          captainsNote: updatedNote,
        };
      })
    );
  };

  const handleSaveAttendance = async () => {
    if (roster.length === 0) return;
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const recordsToSave = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        captainsNote: r.captainsNote || '',
      }));

      const res = await api.saveCaptainAttendance(
        assignedBatch,
        assignedSection,
        selectedDate,
        recordsToSave
      );

      if (res.success) {
        setSaveSuccess(`Attendance for ${selectedDate} saved and certified successfully.`);
        await fetchCaptainData();
        setTimeout(() => setSaveSuccess(null), 5000);
      } else {
        setSaveError('Failed to certify section attendance.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error occurred while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStudentApproval = async (id: string, approval: ApprovalStatus) => {
    return api.updateStudentApproval(id, approval);
  };

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-900 font-sans antialiased relative pb-16">
      {/* Light Sky Blue Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <CaptainNavbar
          assignedBatch={assignedBatch}
          assignedSection={assignedSection}
          todayMarked={stats?.todayMarked}
        />

        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2.5 sm:py-6">
          <Routes>
            <Route
              path="/"
              element={
                <CaptainRollCallView
                  assignedBatch={assignedBatch}
                  assignedSection={assignedSection}
                  selectedDate={selectedDate}
                  onChangeDate={setSelectedDate}
                  roster={roster}
                  onChangeRosterStatus={handleChangeRosterStatus}
                  onChangeRosterCaptainsNote={handleChangeRosterCaptainsNote}
                  onBulkSetStatus={handleBulkSetStatus}
                  onSaveAttendance={handleSaveAttendance}
                  saving={saving}
                  saveSuccess={saveSuccess}
                  saveError={saveError}
                  loading={loading}
                />
              }
            />
            <Route
              path="/my-attendance"
              element={
                <CaptainSelfAttendanceView
                  records={personalRecords}
                  leaves={personalLeaves}
                  onRefreshData={fetchCaptainData}
                  loading={loading}
                />
              }
            />
            <Route
              path="/roster"
              element={
                <CaptainRosterView
                  assignedBatch={assignedBatch}
                  assignedSection={assignedSection}
                  onSelectStudentForModal={(student) => setSelectedStudentForModal(student)}
                />
              }
            />
            <Route
              path="/leaves"
              element={
                <CaptainLeavesView
                  assignedBatch={assignedBatch}
                  assignedSection={assignedSection}
                  leaves={leaves}
                  loading={loading}
                  onRefresh={fetchCaptainData}
                />
              }
            />
            <Route
              path="/profile"
              element={<CaptainMyProfileView />}
            />
            <Route path="*" element={<Navigate to="/captain" replace />} />
          </Routes>
        </main>
      </div>

      {/* Student Profile & Approval Modal for Captain */}
      {selectedStudentForModal && (
        <CaptainUserProfileModal
          user={selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          onUpdateApproval={handleUpdateStudentApproval}
          onUserModified={() => fetchCaptainData()}
        />
      )}
    </div>
  );
};

