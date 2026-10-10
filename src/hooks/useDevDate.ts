import { useState, useCallback } from 'react';

const DEV_OFFSET_KEY = 'habitplanet_dev_offset';

function loadOffset(): number {
  try {
    return parseInt(localStorage.getItem(DEV_OFFSET_KEY) ?? '0', 10) || 0;
  } catch { return 0; }
}

export function getLocalDateString(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().split('T')[0];
}

export function useDevDate() {
  const [dayOffset, setDayOffset] = useState<number>(loadOffset);
  const [databaseDate, setDatabaseDate] = useState<string | null>(null);

  const advanceDay = useCallback(() => {
    setDayOffset(prev => {
      const next = prev + 1;
      localStorage.setItem(DEV_OFFSET_KEY, String(next));
      return next;
    });
  }, []);

  const resetOffset = useCallback(() => {
    setDayOffset(0);
    localStorage.removeItem(DEV_OFFSET_KEY);
  }, []);

  const jumpDays = useCallback((n: number) => {
    setDayOffset(prev => {
      const next = prev + n;
      localStorage.setItem(DEV_OFFSET_KEY, String(next));
      return next;
    });
  }, []);

  /** Returns today's date string offset by dayOffset days */
  const getToday = useCallback((): string => {
    const baseDate = databaseDate ?? getLocalDateString();
    return addDaysToDateString(baseDate, dayOffset);
  }, [databaseDate, dayOffset]);

  return { dayOffset, advanceDay, resetOffset, getToday, jumpDays, databaseDate, setDatabaseDate };
}

