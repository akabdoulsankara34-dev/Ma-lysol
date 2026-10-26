/**
 * Robust date utility functions for BizPilot Burkina Faso.
 * Prevents unhandled exceptions, null pointer crashes, and timezone mismatches
 * when filtering or displaying sales, expenses, and analytics for "Aujourd'hui" (today).
 */

/**
 * Safely extracts the YYYY-MM-DD portion from any date string, Date object, or timestamp.
 * Returns empty string if the value is missing or invalid (never throws).
 */
export const getSafeDateString = (dateVal?: string | Date | null | any): string => {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string') {
      if (dateVal.includes('T')) {
        return dateVal.split('T')[0];
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
        return dateVal.substring(0, 10);
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Safely checks if a date belongs to "Aujourd'hui" (today).
 * Handles:
 * - UTC ISO strings (e.g. 2026-10-26T14:30:00Z)
 * - Local date representations
 * - Expenses with either `createdAt` or `date`
 * - Undefined/null/invalid values without throwing
 */
export const isToday = (dateVal?: string | Date | null | any): boolean => {
  if (!dateVal) return false;
  try {
    const now = new Date();
    const todayUtc = now.toISOString().split('T')[0];
    
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${localYear}-${localMonth}-${localDay}`;

    // Fast check if string starts with either UTC or Local date
    if (typeof dateVal === 'string') {
      if (dateVal.startsWith(todayUtc) || dateVal.startsWith(todayLocal)) {
        return true;
      }
    }

    // Fallback: parse date and compare day/month/year in local time
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const isSameLocalDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (isSameLocalDay) return true;

      // In case the stored date was UTC ISO and we are in a different time zone
      const dIso = d.toISOString().split('T')[0];
      if (dIso === todayUtc) return true;
    }
  } catch {
    return false;
  }
  return false;
};

/**
 * Safely parses a Date object, falling back to new Date() if invalid.
 */
export const getSafeDate = (dateVal?: any): Date => {
  if (!dateVal) return new Date();
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
};

/**
 * Safely formats a date to French format (e.g. 26/10/2026).
 */
export const formatDateFr = (dateVal?: any, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal || '-');
    return d.toLocaleDateString('fr-FR', options || { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
};

/**
 * Safely formats a time to French format (e.g. 14:35).
 */
export const formatTimeFr = (dateVal?: any): string => {
  if (!dateVal) return '--:--';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};
