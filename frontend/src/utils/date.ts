// Parses a date string formatted as DD.MM.YYYY to Unix millisecond timestamp
export const parseDateString = (str: string): number | null => {
  const trimmed = str.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date.getTime();
};

// Convert Unix millisecond timestamp to DD.MM.YYYY for input element values
export const formatTimestampForInput = (ts: number | null | undefined): string => {
  if (!ts) return '';
  const date = new Date(ts);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Formats a Unix timestamp (in milliseconds) to DD.MM.YYYY | HH:MM for UI display
export const formatUnixDateTime = (ts: number | null | undefined): string => {
  if (!ts) return '—';
  const date = new Date(ts);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} | ${hours}:${minutes}`;
};

// Formats a Unix timestamp (in milliseconds) to DD.MM.YYYY for UI display
export const formatUnixDate = (ts: number | null | undefined): string => {
  if (!ts) return '—';
  const date = new Date(ts);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};


