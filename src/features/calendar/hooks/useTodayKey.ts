import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { addDaysToKey, dayKeyToDate, toDayKey } from '../../../lib/dayKey';
import type { DayKey } from '../../../types/task';

/**
 * Today's local day key, kept current. Re-checks at midnight and whenever the
 * app returns to the foreground, so an app left open overnight shows the new
 * day's tasks instead of yesterday's.
 */
export function useTodayKey(): DayKey {
  const [today, setToday] = useState(toDayKey);

  useEffect(() => {
    const refresh = () => setToday(toDayKey());

    const msUntilMidnight = dayKeyToDate(addDaysToKey(today, 1)).getTime() - Date.now();
    // +1s margin so the timer never fires just before the day actually changes.
    const timer = setTimeout(refresh, Math.max(msUntilMidnight, 0) + 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [today]);

  return today;
}
