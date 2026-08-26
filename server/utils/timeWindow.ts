export function parseTime(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 15, minutes: 0 };
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hours: 15, minutes: 0 };
  let [_, h, m, p] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (p) {
    const period = p.toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

export function isTimeWithinWindow(now: Date, startStr: string, endStr: string): boolean {
  const start = parseTime(startStr);
  const end = parseTime(endStr);

  let dhakaHours = now.getHours();
  let dhakaMinutes = now.getMinutes();
  try {
    const dhakaTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [h, m] = dhakaTimeStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      dhakaHours = h;
      dhakaMinutes = m;
    }
  } catch (e) {
    // fallback to local container time
  }

  const startMins = start.hours * 60 + start.minutes;
  const endMins = end.hours * 60 + end.minutes;

  const checkMins = (nowMins: number) => {
    if (startMins < endMins) {
      return nowMins >= startMins && nowMins <= endMins;
    } else {
      return nowMins >= startMins || (endMins > 0 && nowMins < endMins);
    }
  };

  const nativeMins = now.getHours() * 60 + now.getMinutes();
  const bgMins = dhakaHours * 60 + dhakaMinutes;

  return checkMins(nativeMins) || checkMins(bgMins);
}
