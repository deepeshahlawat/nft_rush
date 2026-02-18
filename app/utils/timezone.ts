// UTC+5:30 (IST - Indian Standard Time) timezone utilities

export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

/**
 * Get current time in IST (UTC+5:30)
 */
export function getCurrentTimeIST(): Date {
  const utcNow = new Date();
  const istTime = new Date(utcNow.getTime() + IST_OFFSET);
  return istTime;
}

/**
 * Check if a target end time has been exceeded
 * @param targetEndTime - Date object of the end time
 * @returns boolean - true if end time has passed, false otherwise
 */
export function isEventEnded(targetEndTime: Date): boolean {
  const now = getCurrentTimeIST();
  return now.getTime() > targetEndTime.getTime();
}

/**
 * Get time remaining until target end time
 * @param targetEndTime - Date object of the end time
 * @returns object with hours, minutes, seconds remaining
 */
export function getTimeRemaining(targetEndTime: Date) {
  const now = getCurrentTimeIST();
  const distance = targetEndTime.getTime() - now.getTime();

  if (distance <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isEnded: false };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(targetEndTime: Date): string {
  const { hours, minutes, seconds, isEnded } = getTimeRemaining(targetEndTime);

  if (isEnded) {
    return "ROUND ENDED";
  }

  const hDisplay = hours > 0 ? `${hours}h ` : "";
  const mDisplay = minutes < 10 ? `0${minutes}` : minutes;
  const sDisplay = seconds < 10 ? `0${seconds}` : seconds;
  return `${hDisplay}${mDisplay}m ${sDisplay}s`;
}
