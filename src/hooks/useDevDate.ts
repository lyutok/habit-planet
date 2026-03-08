import { useState, useCallback } from 'react';

const DEV_OFFSET_KEY = 'habitplanet_dev_offset';

function loadOffset(): number {
  try {
    return parseInt(localStorage.getItem(DEV_OFFSET_KEY) ?? '0', 10) || 0;
  } catch { return 0; }
}

export function useDevDate() {
  const [dayOffset, setDayOffset] = useState<number>(loadOffset);

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
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
  }, [dayOffset]);

  return { dayOffset, advanceDay, resetOffset, getToday, jumpDays };
}
