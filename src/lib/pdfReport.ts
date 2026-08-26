import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, AuthSessionPayload, AttendanceRecord, LeaveRequest } from '../types';

interface GenerateReportOptions {
  user: User | AuthSessionPayload | any | null;
  selectedMonth: string; // Mandatory YYYY-MM e.g. "2026-08"
  records: AttendanceRecord[];
  leaves: LeaveRequest[];
}

export function generateMonthlyAttendancePDF({
  user,
  selectedMonth,
  records,
  leaves,
}: GenerateReportOptions) {
  // 1. Mandatory Month Selection Check
  if (!selectedMonth || selectedMonth === 'All' || selectedMonth.trim() === '') {
    throw new Error('Month selection is mandatory for generating an official PDF report. Please select a specific month.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageMargin = 13;
  const contentWidth = pageWidth - pageMargin * 2; // 184 mm

  // Vibrant, Professional Navy & Emerald Theme Colors
  const navyDark: [number, number, number] = [15, 23, 42]; // Slate 900 #0F172A
  const navyAccent: [number, number, number] = [30, 41, 59]; // Slate 800 #1E293B
  const emeraldPrimary: [number, number, number] = [16, 185, 129]; // Emerald 500 #10B981
  const bgCard: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderCard: [number, number, number] = [226, 232, 240]; // Slate 200

  // Format month label (e.g. "2026-08" -> "AUGUST 2026")
  let formattedMonthTitle = selectedMonth;
  try {
    const [year, month] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    formattedMonthTitle = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  } catch {
    formattedMonthTitle = selectedMonth.toUpperCase();
  }

  // ----------------------------------------------------
  // EXECUTIVE HEADER WITH AESTHETIC 4-SIDED MARGINS
  // ----------------------------------------------------
  const headerHeight = 31;
  const headerY = 11;

  // Deep Navy Framed Header Box with Rounded Corners
  doc.setFillColor(...navyDark);
  doc.roundedRect(pageMargin, headerY, contentWidth, headerHeight, 3, 3, 'F');

  // Emerald Top Accent Strip
  doc.setFillColor(...emeraldPrimary);
  doc.roundedRect(pageMargin, headerY, contentWidth, 2, 1, 1, 'F');

  // College Crest/Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('BANGLADESH NAVY COLLEGE, CHITTAGONG', pageWidth / 2, headerY + 9.5, { align: 'center' });

  // Academic Subtitle
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Sailor Colony, New Mooring, Chattogram | Official Academic Audit Ledger', pageWidth / 2, headerY + 15, { align: 'center' });

  // Month Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageWidth / 2 - 42, headerY + 18.5, 84, 7.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`ATTENDANCE AUDIT • ${formattedMonthTitle}`, pageWidth / 2, headerY + 23.5, { align: 'center' });

  let currentY = headerY + headerHeight + 5;

  // ----------------------------------------------------
  // STUDENT PROFILE SUMMARY CARD
  // ----------------------------------------------------
  const studentName = user?.fullName || 'N/A';
  const rollNo = user?.rollNumber || 'N/A';
  const batchSection = `${user?.batch || 'HSC'} (Sec: ${user?.section || 'A'})`;
  const group = user?.group || 'Science';
  const email = user?.email || 'N/A';
  const issuedAt = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Calculate Metrics
  const filteredRecords = records.filter((r) => r.date && r.date.startsWith(selectedMonth));
  const filteredLeaves = leaves.filter(
    (lv) => (lv.startDate && lv.startDate.startsWith(selectedMonth)) || (lv.endDate && lv.endDate.startsWith(selectedMonth))
  );

  const totalDays = filteredRecords.length;
  const presentDays = filteredRecords.filter((r) => String(r.status).toLowerCase() === 'present').length;
  const absentDays = filteredRecords.filter((r) => String(r.status).toLowerCase() === 'absent').length;
  const leaveDays = filteredRecords.filter((r) => ['leave', 'excused', 'late'].includes(String(r.status).toLowerCase())).length;
  const fraudDays = filteredRecords.filter((r) => String(r.status).toLowerCase() === 'fraud' || (r as any).isFraud).length;
  const rate = totalDays > 0 ? Math.round(((presentDays + leaveDays) / totalDays) * 100) : 0;

  // Profile Card Box
  doc.setFillColor(...bgCard);
  doc.setDrawColor(...borderCard);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageMargin, currentY, contentWidth, 27, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STUDENT PROFILE', pageMargin + 4, currentY + 5.5);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(pageMargin + 4, currentY + 7.5, pageMargin + contentWidth - 4, currentY + 7.5);

  doc.setFontSize(7.5);

  // Left Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Name:', pageMargin + 4, currentY + 13);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName, pageMargin + 19, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Roll:', pageMargin + 4, currentY + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text(rollNo, pageMargin + 19, currentY + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Email:', pageMargin + 4, currentY + 23.5);
  doc.setTextColor(15, 23, 42);
  doc.text(email, pageMargin + 19, currentY + 23.5);

  // Center Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Batch / Sec:', pageMargin + 85, currentY + 13);
  doc.setTextColor(15, 23, 42);
  doc.text(batchSection, pageMargin + 107, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Group:', pageMargin + 85, currentY + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text(group, pageMargin + 107, currentY + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Issued Date:', pageMargin + 85, currentY + 23.5);
  doc.setTextColor(15, 23, 42);
  doc.text(issuedAt, pageMargin + 107, currentY + 23.5);

  // Right Side Score Badge Box inside card
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageMargin + contentWidth - 36, currentY + 3.5, 32, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(4, 120, 87);
  doc.text('ATTENDANCE RATE', pageMargin + contentWidth - 20, currentY + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(6, 78, 59);
  doc.text(`${rate}%`, pageMargin + contentWidth - 20, currentY + 17.5, { align: 'center' });

  currentY += 32;

  // ----------------------------------------------------
  // 5-STAT METRICS BAR (INCLUDES FRAUD COUNT)
  // ----------------------------------------------------
  const numBoxes = 5;
  const statGap = 2.5;
  const statBoxWidth = (contentWidth - (numBoxes - 1) * statGap) / numBoxes; // ~34.8mm
  const statHeight = 15.5;

  const statsList = [
    { label: 'TOTAL ROLL CALLS', val: `${totalDays}`, color: [15, 23, 42] },
    { label: 'SESSIONS PRESENT', val: `${presentDays}`, color: [5, 150, 105] },
    { label: 'UNEXCUSED ABSENT', val: `${absentDays}`, color: [225, 29, 72] },
    { label: 'APPROVED LEAVES', val: `${leaveDays}`, color: [217, 119, 6] },
    { label: 'FRAUD DETECTED', val: `${fraudDays}`, color: [147, 51, 234] },
  ];

  statsList.forEach((st, idx) => {
    const xPos = pageMargin + idx * (statBoxWidth + statGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderCard);
    doc.roundedRect(xPos, currentY, statBoxWidth, statHeight, 2, 2, 'FD');

    // Colored top line accent
    doc.setFillColor(...(st.color as [number, number, number]));
    doc.rect(xPos, currentY, statBoxWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(st.label, xPos + statBoxWidth / 2, currentY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...(st.color as [number, number, number]));
    doc.text(st.val, xPos + statBoxWidth / 2, currentY + 12, { align: 'center' });
  });

  currentY += statHeight + 7;

  // ----------------------------------------------------
  // SECTION 1: DAILY ATTENDANCE LEDGER TABLE
  // (SEPARATE STUDENT'S NOTE & CAPTAIN'S NOTE COLUMNS + COLORIZED ROWS)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Daily Attendance Roll Call Logs (${formattedMonthTitle})`, pageMargin, currentY);

  currentY += 3.5;

  const attendanceTableHead = [["Date & Day", "Status", "Student's Note", "Captain's Note", "Certified By"]];
  const attendanceTableBody = filteredRecords.map((r) => {
    let dayOfWeek = '';
    try {
      const d = new Date(r.date);
      if (!isNaN(d.getTime())) {
        dayOfWeek = ` (${d.toLocaleDateString('en-US', { weekday: 'short' })})`;
      }
    } catch {
      // ignore
    }

    const st = String(r.status).toUpperCase();
    
    // Separate Student's Note and Captain's Note cleanly
    const studentNote = r.studentsNote ? `"${r.studentsNote}"` : '-';
    
    let captainNote = '-';
    if (r.captainsNote) {
      captainNote = `"${r.captainsNote}"`;
    } else if (r.remarks && !r.studentsNote) {
      captainNote = `"${r.remarks}"`;
    }

    const certifiedBy = r.markedBy?.name ? `${r.markedBy.name} (${r.markedBy.role || 'captain'})` : 'Section Captain';

    return [`${r.date}${dayOfWeek}`, st, studentNote, captainNote, certifiedBy];
  });

  autoTable(doc, {
    startY: currentY,
    head: attendanceTableHead,
    body: attendanceTableBody.length > 0 ? attendanceTableBody : [['-', 'No Records', '-', `No roll call records found for ${formattedMonthTitle}`, '-']],
    theme: 'grid',
    headStyles: {
      fillColor: navyDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 47, halign: 'left' },
      3: { cellWidth: 47, halign: 'left' },
      4: { cellWidth: 36, halign: 'left' },
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index === 1) {
          data.cell.styles.halign = 'center';
        }
      }
      if (data.section === 'body') {
        const statusRaw = String(data.row.raw?.[1] || '').toUpperCase();
        
        // Aesthetic distinct background color for each status row
        if (statusRaw === 'PRESENT') {
          data.cell.styles.fillColor = [240, 253, 244]; // Soft emerald tint #F0FDF4
        } else if (statusRaw === 'ABSENT') {
          data.cell.styles.fillColor = [255, 241, 242]; // Soft rose tint #FFF1F2
        } else if (statusRaw === 'FRAUD') {
          data.cell.styles.fillColor = [250, 245, 255]; // Soft purple tint #FAF5FF
        } else if (['LEAVE', 'EXCUSED', 'LATE'].includes(statusRaw)) {
          data.cell.styles.fillColor = [254, 252, 232]; // Soft amber tint #FEFCE8
        } else {
          data.cell.styles.fillColor = data.row.index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        }

        // Status pill text styling
        if (data.column.index === 1) {
          data.cell.styles.halign = 'center';
          data.cell.styles.fontStyle = 'bold';
          if (statusRaw === 'PRESENT') {
            data.cell.styles.textColor = [5, 150, 105];
          } else if (statusRaw === 'ABSENT') {
            data.cell.styles.textColor = [225, 29, 72];
          } else if (statusRaw === 'FRAUD') {
            data.cell.styles.textColor = [147, 51, 234];
          } else {
            data.cell.styles.textColor = [217, 119, 6];
          }
        }
      }
    },
    margin: { left: pageMargin, right: pageMargin, top: pageMargin, bottom: pageMargin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 30;
  let leaveY = finalY + 7;

  if (leaveY > 230) {
    doc.addPage();
    leaveY = 22;
  }

  // ----------------------------------------------------
  // SECTION 2: LEAVE APPLICATIONS TABLE (COLORIZED ROWS)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Leave Applications & Certifications (${formattedMonthTitle})`, pageMargin, leaveY);

  leaveY += 3.5;

  const leaveTableHead = [['Leave Date', 'Category', 'Reason for Leave', 'Status', 'Reviewed By & Captain Note']];
  const leaveTableBody = filteredLeaves.map((lv) => {
    const leaveDate = lv.startDate || lv.endDate || 'N/A';
    const statusText = String(lv.status).toUpperCase();
    const reviewerName = typeof lv.reviewedBy === 'object' && lv.reviewedBy?.name
      ? `${lv.reviewedBy.name} (${lv.reviewedBy.role || 'captain'})`
      : typeof lv.reviewedBy === 'string'
      ? lv.reviewedBy
      : 'Section Captain';

    const noteText = lv.captainsNote || lv.reviewNote || (lv as any).reviewerNote || (lv.status === 'Approved' ? 'Approved & Certified' : 'Under Review');
    const reviewerAndNote = `${reviewerName} • "${noteText}"`;

    return [
      leaveDate,
      lv.leaveType || 'General',
      lv.reason || 'No cause specified',
      statusText,
      reviewerAndNote,
    ];
  });

  autoTable(doc, {
    startY: leaveY,
    head: leaveTableHead,
    body: leaveTableBody.length > 0 ? leaveTableBody : [['-', '-', `No leave applications submitted for ${formattedMonthTitle}`, 'N/A', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: navyDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 24, halign: 'left' },
      2: { cellWidth: 54, halign: 'left' },
      3: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
      4: { cellWidth: 56, halign: 'left' },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 3) {
        data.cell.styles.halign = 'center';
      }
      if (data.section === 'body') {
        const statusRaw = String(data.row.raw?.[3] || '').toUpperCase();
        
        if (statusRaw === 'APPROVED') {
          data.cell.styles.fillColor = [240, 253, 244]; // Soft emerald
        } else if (statusRaw === 'REJECTED') {
          data.cell.styles.fillColor = [255, 241, 242]; // Soft rose
        } else {
          data.cell.styles.fillColor = [254, 252, 232]; // Soft amber
        }

        if (data.column.index === 3) {
          data.cell.styles.halign = 'center';
          data.cell.styles.fontStyle = 'bold';
          if (statusRaw === 'APPROVED') {
            data.cell.styles.textColor = [5, 150, 105];
          } else if (statusRaw === 'REJECTED') {
            data.cell.styles.textColor = [225, 29, 72];
          } else {
            data.cell.styles.textColor = [217, 119, 6];
          }
        }
      }
    },
    margin: { left: pageMargin, right: pageMargin, top: pageMargin, bottom: pageMargin },
  });

  // ----------------------------------------------------
  // EXECUTIVE SIGNATURES & OFFICIAL SEAL
  // ----------------------------------------------------
  const sigStartY = (doc as any).lastAutoTable?.finalY || leaveY + 30;
  let sigY = sigStartY + 18;
  if (sigY > 260) {
    doc.addPage();
    sigY = 36;
  }

  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);

  // Left Signature (Class Captain)
  doc.line(pageMargin + 4, sigY, pageMargin + 64, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Class Captain Signature', pageMargin + 34, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Bangladesh Navy College, Chittagong', pageMargin + 34, sigY + 7.5, { align: 'center' });

  // Right Signature (Academic Head / Principal)
  doc.line(pageMargin + contentWidth - 64, sigY, pageMargin + contentWidth - 4, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Academic Head / Principal Signature', pageMargin + contentWidth - 34, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Bangladesh Navy College, Chittagong', pageMargin + contentWidth - 34, sigY + 7.5, { align: 'center' });

  // ----------------------------------------------------
  // FOOTER & PAGE NUMBERING WITH 4-SIDED MARGINS
  // ----------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Page border line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(pageMargin, pageHeight - 12, pageMargin + contentWidth, pageHeight - 12);

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Official Computer-Generated Academic Audit Ledger • Bangladesh Navy College, Chittagong',
      pageMargin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageMargin + contentWidth, pageHeight - 8, { align: 'right' });
  }

  // Save the PDF file
  const cleanStudentName = (user?.fullName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`BNC_Chittagong_Attendance_${cleanStudentName}_${selectedMonth}.pdf`);
}

// --------------------------------------------------------------------------
// DAILY SECTION ROLL-CALL PDF REPORT (WITH BOUNDED BOXES & GENDER COLORS)
// --------------------------------------------------------------------------
export interface DailyRollCallStudent {
  studentId?: string;
  rollNumber: string;
  fullName: string;
  group?: string;
  gender?: string;
  role?: string;
  isCaptain?: boolean;
  status: string;
  studentsNote?: string;
  captainsNote?: string;
}

export interface GenerateDailyRollCallPDFOptions {
  batch: string;
  section: string;
  selectedDate: string; // YYYY-MM-DD e.g. "2026-08-26"
  roster: DailyRollCallStudent[];
  captainUser?: {
    fullName?: string;
    email?: string;
    rollNumber?: string;
    role?: string;
  } | null;
}

export function generateDailyRollCallPDF({
  batch,
  section,
  selectedDate,
  roster,
  captainUser,
}: GenerateDailyRollCallPDFOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageMargin = 13;
  const contentWidth = pageWidth - pageMargin * 2; // 184 mm

  // Colors
  const navyDark: [number, number, number] = [15, 23, 42]; // Slate 900 #0F172A
  const emeraldPrimary: [number, number, number] = [16, 185, 129]; // Emerald 500
  const bgCard: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderCard: [number, number, number] = [226, 232, 240]; // Slate 200

  // Format Date for Display e.g. "Wednesday, 26 August 2026"
  let formattedFullDate = selectedDate;
  let formattedShortDate = selectedDate;
  try {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      formattedFullDate = dObj.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      formattedShortDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } catch {
    // fallback
  }

  // 1. Executive Top Header Banner with 4-side margins
  const headerHeight = 31;
  const headerY = 11;

  doc.setFillColor(...navyDark);
  doc.roundedRect(pageMargin, headerY, contentWidth, headerHeight, 3, 3, 'F');

  // Emerald/Teal Stripe
  doc.setFillColor(...emeraldPrimary);
  doc.roundedRect(pageMargin, headerY, contentWidth, 2, 1, 1, 'F');

  // College Name & Crest
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('BANGLADESH NAVY COLLEGE, CHITTAGONG', pageWidth / 2, headerY + 9.5, { align: 'center' });

  // Subtitle
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Sailor Colony, New Mooring, Chattogram | Official Daily Attendance Certification Ledger', pageWidth / 2, headerY + 15, { align: 'center' });

  // Date & Section Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageWidth / 2 - 58, headerY + 18.5, 116, 7.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DAILY ROLL-CALL • ${batch.toUpperCase()} • SECTION ${section.toUpperCase()} • ${formattedShortDate}`, pageWidth / 2, headerY + 23.5, { align: 'center' });

  let currentY = headerY + headerHeight + 5;

  // 2. Section & Certification Overview Card
  const sortedRoster = [...roster].sort((a, b) => {
    return (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  const presentList = sortedRoster.filter((r) => String(r.status).toLowerCase() === 'present');
  const absentList = sortedRoster.filter((r) => String(r.status).toLowerCase() === 'absent');
  const leaveList = sortedRoster.filter((r) => ['leave', 'excused', 'late'].includes(String(r.status).toLowerCase()));
  const fraudList = sortedRoster.filter((r) => String(r.status).toLowerCase() === 'fraud' || (r as any).isFraud);

  const totalCount = sortedRoster.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentList.length + leaveList.length) / totalCount) * 100) : 0;
  const captainName = captainUser?.fullName ? `${captainUser.fullName}${captainUser.rollNumber ? ` (Roll: ${captainUser.rollNumber})` : ''}` : 'Official Section Captain';

  // Overview Card Box
  doc.setFillColor(...bgCard);
  doc.setDrawColor(...borderCard);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageMargin, currentY, contentWidth, 25, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION ROLL-CALL AUDIT OVERVIEW', pageMargin + 4, currentY + 5.5);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(pageMargin + 4, currentY + 7.5, pageMargin + contentWidth - 4, currentY + 7.5);

  doc.setFontSize(7.5);

  // Left Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Academic Cohort:', pageMargin + 4, currentY + 13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${batch} • Section ${section}`, pageMargin + 32, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Roll-Call Date:', pageMargin + 4, currentY + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formattedFullDate, pageMargin + 32, currentY + 18.5);

  // Center Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Certified By:', pageMargin + 95, currentY + 13);
  doc.setTextColor(15, 23, 42);
  doc.text(captainName, pageMargin + 116, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Ledger Time:', pageMargin + 95, currentY + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text(new Date().toLocaleString('en-US'), pageMargin + 116, currentY + 18.5);

  // Rate Badge inside card
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageMargin + contentWidth - 36, currentY + 3.5, 32, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(4, 120, 87);
  doc.text('COMPLIANCE RATE', pageMargin + contentWidth - 20, currentY + 8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(6, 78, 59);
  doc.text(`${attendanceRate}%`, pageMargin + contentWidth - 20, currentY + 16, { align: 'center' });

  currentY += 30;

  // 3. 5-Stat Metrics Bar
  const numBoxes = 5;
  const statGap = 2.5;
  const statBoxWidth = (contentWidth - (numBoxes - 1) * statGap) / numBoxes;
  const statHeight = 14;

  const statsList = [
    { label: 'TOTAL ENROLLED', val: `${totalCount}`, color: [15, 23, 42] },
    { label: 'PRESENT ROLLS', val: `${presentList.length}`, color: [5, 150, 105] },
    { label: 'ABSENT ROLLS', val: `${absentList.length}`, color: [225, 29, 72] },
    { label: 'LEAVE / EXCUSED', val: `${leaveList.length}`, color: [217, 119, 6] },
    { label: 'FRAUD FLAGGED', val: `${fraudList.length}`, color: [147, 51, 234] },
  ];

  statsList.forEach((st, idx) => {
    const xPos = pageMargin + idx * (statBoxWidth + statGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderCard);
    doc.roundedRect(xPos, currentY, statBoxWidth, statHeight, 2, 2, 'FD');

    // Colored top accent
    doc.setFillColor(...(st.color as [number, number, number]));
    doc.rect(xPos, currentY, statBoxWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(st.label, xPos + statBoxWidth / 2, currentY + 4.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...(st.color as [number, number, number]));
    doc.text(st.val, xPos + statBoxWidth / 2, currentY + 10.8, { align: 'center' });
  });

  currentY += statHeight + 6;

  // 4. Bounded Roll Color Legend Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageMargin, currentY, contentWidth, 8, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('COLOR LEGEND:', pageMargin + 3, currentY + 5.2);

  // Boys Indicator Pill (Light Blue)
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(96, 165, 250); // Blue 400
  doc.setLineWidth(0.3);
  doc.roundedRect(pageMargin + 36, currentY + 1.5, 24, 5, 1, 1, 'FD');
  doc.setFontSize(5.8);
  doc.setTextColor(29, 78, 216); // Blue 700
  doc.text('Boys (Blue)', pageMargin + 48, currentY + 4.8, { align: 'center' });

  // Girls Indicator Pill (Light Pink)
  doc.setFillColor(253, 242, 248); // Pink 50
  doc.setDrawColor(244, 114, 182); // Pink 400
  doc.setLineWidth(0.3);
  doc.roundedRect(pageMargin + 63, currentY + 1.5, 24, 5, 1, 1, 'FD');
  doc.setTextColor(190, 24, 93); // Pink 700
  doc.text('Girls (Pink)', pageMargin + 75, currentY + 4.8, { align: 'center' });

  // Boy Captain Indicator Pill (Dark Blue)
  doc.setFillColor(191, 219, 254); // Blue 200 (Darker Blue)
  doc.setDrawColor(29, 78, 216); // Blue 700
  doc.setLineWidth(0.45);
  doc.roundedRect(pageMargin + 90, currentY + 1.5, 41, 5, 1, 1, 'FD');
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text('Captain (Dark Blue)', pageMargin + 110.5, currentY + 4.8, { align: 'center' });

  // Girl Captain Indicator Pill (Dark Pink)
  doc.setFillColor(251, 207, 232); // Pink 200 (Darker Pink)
  doc.setDrawColor(190, 24, 93); // Pink 700
  doc.setLineWidth(0.45);
  doc.roundedRect(pageMargin + 134, currentY + 1.5, 41, 5, 1, 1, 'FD');
  doc.setTextColor(131, 24, 67); // Pink 950
  doc.text('Captain (Dark Pink)', pageMargin + 154.5, currentY + 4.8, { align: 'center' });

  currentY += 12;

  // --------------------------------------------------------------------------
  // HELPER TO RENDER A BOUNDED BOXES ROLL GRID FOR A GIVEN ATTENDANCE CATEGORY
  // --------------------------------------------------------------------------
  const renderRollCategorySection = (
    title: string,
    students: DailyRollCallStudent[],
    badgeColor: [number, number, number],
    bgCategoryColor: [number, number, number]
  ) => {
    // Check if enough space on current page
    if (currentY > 245) {
      doc.addPage();
      currentY = 20;
    }

    // Category Header Box
    doc.setFillColor(...bgCategoryColor);
    doc.setDrawColor(...badgeColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageMargin, currentY, contentWidth, 7, 1.5, 1.5, 'FD');

    // Left Colored Indicator Strip
    doc.setFillColor(...badgeColor);
    doc.rect(pageMargin, currentY, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...badgeColor);
    doc.text(`${title.toUpperCase()} — Total: ${students.length} Student${students.length === 1 ? '' : 's'}`, pageMargin + 6, currentY + 4.8);

    currentY += 9;

    if (students.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('No students recorded in this category for the selected date.', pageMargin + 4, currentY + 2);
      currentY += 6;
      return;
    }

    // Bounded Box Layout Math
    const boxW = 16.5;
    const boxH = 6;
    const gapX = 2;
    const gapY = 2;
    const startX = pageMargin + 2;
    const maxX = pageMargin + contentWidth - 2;

    let curX = startX;

    students.forEach((st) => {
      // Check if we need to wrap to next line
      if (curX + boxW > maxX) {
        curX = startX;
        currentY += boxH + gapY;

        if (currentY > 268) {
          doc.addPage();
          currentY = 20;
        }
      }

      const isCaptain = Boolean(
        st.isCaptain ||
        st.role === 'captain' ||
        (captainUser?.rollNumber && st.rollNumber === captainUser.rollNumber)
      );
      const isFemale = String(st.gender || '').toLowerCase() === 'female';

      if (isCaptain && isFemale) {
        // Female Captain: Darker Pink Bounded Box
        doc.setFillColor(251, 207, 232); // Pink 200 (Darker Pink Fill)
        doc.setDrawColor(190, 24, 93); // Pink 700 (Dark Pink Border)
        doc.setLineWidth(0.55);
        doc.roundedRect(curX, currentY, boxW, boxH, 1.2, 1.2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(131, 24, 67); // Pink 950 (Dark Pink text)
        doc.text(st.rollNumber || '—', curX + boxW / 2, currentY + 4.2, { align: 'center' });
      } else if (isCaptain && !isFemale) {
        // Male Captain: Darker Blue Bounded Box
        doc.setFillColor(191, 219, 254); // Blue 200 (Darker Blue Fill)
        doc.setDrawColor(29, 78, 216); // Blue 700 (Dark Blue Border)
        doc.setLineWidth(0.55);
        doc.roundedRect(curX, currentY, boxW, boxH, 1.2, 1.2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 58, 138); // Blue 900 (Dark Blue text)
        doc.text(st.rollNumber || '—', curX + boxW / 2, currentY + 4.2, { align: 'center' });
      } else if (isFemale) {
        // Regular Girls: Light Pink Bounded Box
        doc.setFillColor(253, 242, 248); // Pink 50 (Soft Light Pink Fill)
        doc.setDrawColor(244, 114, 182); // Pink 400 (Pink Border)
        doc.setLineWidth(0.35);
        doc.roundedRect(curX, currentY, boxW, boxH, 1.2, 1.2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(190, 24, 93); // Pink 700 (Pink text)
        doc.text(st.rollNumber || '—', curX + boxW / 2, currentY + 4.2, { align: 'center' });
      } else {
        // Regular Boys: Light Blue Bounded Box
        doc.setFillColor(239, 246, 255); // Blue 50 (Soft Light Blue Fill)
        doc.setDrawColor(96, 165, 250); // Blue 400 (Blue Border)
        doc.setLineWidth(0.35);
        doc.roundedRect(curX, currentY, boxW, boxH, 1.2, 1.2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(29, 78, 216); // Blue 700 (Blue text)
        doc.text(st.rollNumber || '—', curX + boxW / 2, currentY + 4.2, { align: 'center' });
      }

      curX += boxW + gapX;
    });

    currentY += boxH + 6;
  };

  // 1. PRESENT ROLLS SECTION
  renderRollCategorySection(
    '1. Present Rolls',
    presentList,
    [5, 150, 105], // Emerald
    [236, 253, 245]
  );

  // 2. ABSENT ROLLS SECTION
  renderRollCategorySection(
    '2. Absent Rolls',
    absentList,
    [225, 29, 72], // Rose/Red
    [255, 241, 242]
  );

  // 3. LEAVE ROLLS SECTION
  renderRollCategorySection(
    '3. Leave / Excused Rolls',
    leaveList,
    [217, 119, 6], // Amber
    [254, 243, 199]
  );

  // 4. FRAUD DETECTED (If any)
  if (fraudList.length > 0) {
    renderRollCategorySection(
      '4. Fraud Attendance Rolls (Flagged)',
      fraudList,
      [147, 51, 234], // Purple
      [250, 245, 255]
    );
  }

  // Footer & Page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Official Daily Academic Roll-Call Audit • Bangladesh Navy College, Chittagong • Date: ${formattedShortDate}`,
      12,
      288
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 12, 288, { align: 'right' });
  }

  // Save the PDF file
  const cleanBatch = batch.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSection = section.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`BNC_RollCall_${cleanBatch}_Sec_${cleanSection}_${selectedDate}.pdf`);
}

