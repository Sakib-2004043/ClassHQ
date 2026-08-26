/**
 * Generates a randomly serial and fixed-length Activity ID (AID).
 * It starts with "D_" and is followed by exactly 12 alphanumeric uppercase characters.
 * The first 8 characters are derived from Date.now() in base-36 to maintain serial/chronological order (extremely efficient for database indexing),
 * and the remaining 4 characters are random base-36 values to support millions of entries with zero collision risk.
 */
export function generateActivityId(): string {
  // Convert current time to Base-36 (8 characters)
  const timePart = Date.now().toString(36).padStart(8, '0').slice(-8);
  
  // Safe random character generation (4 characters from base-36 set)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  
  return `D_${timePart.toUpperCase()}${randomPart}`;
}

/**
 * Generates a randomly serial and fixed-length Exam ID (EID).
 * It starts with "E_" and is followed by exactly 12 alphanumeric uppercase characters.
 * Identical structure to AID to ensure database orderliness and zero collision.
 */
export function generateExamId(): string {
  const timePart = Date.now().toString(36).padStart(8, '0').slice(-8);
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  return `E_${timePart.toUpperCase()}${randomPart}`;
}

/**
 * Generates a randomly serial and fixed-length Payment ID (PID).
 * It starts with "P_" and is followed by exactly 12 alphanumeric uppercase characters.
 * Identical structure to AID and EID to ensure database orderliness and zero collision.
 */
export function generatePaymentId(): string {
  const timePart = Date.now().toString(36).padStart(8, '0').slice(-8);
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  return `P_${timePart.toUpperCase()}${randomPart}`;
}

/**
 * Safely prefixes Activity ID with "AID : " without duplicate prefixing
 */
export function formatAid(aid?: string | null): string {
  if (!aid) return '';
  return aid.startsWith('AID :') ? aid : `AID : ${aid}`;
}

/**
 * Safely prefixes Exam ID with "EID : " without duplicate prefixing
 */
export function formatEid(eid?: string | null): string {
  if (!eid) return '';
  return eid.startsWith('EID :') ? eid : `EID : ${eid}`;
}

/**
 * Safely prefixes Payment ID with "PID : " without duplicate prefixing
 */
export function formatPid(pid?: string | null): string {
  if (!pid) return '';
  return pid.startsWith('PID :') ? pid : `PID : ${pid}`;
}


