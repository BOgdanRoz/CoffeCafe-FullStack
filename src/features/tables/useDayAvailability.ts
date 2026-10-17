import { useCallback, useEffect, useState } from 'react';
import { getDayAvailability } from './availabilityService';
import type { DayAvailability } from './types';

// Refresh while the page stays open, and when the visitor comes back to it.
const REFRESH_INTERVAL_MS = 60_000;

type RequestState = {
  date: string;
  data?: DayAvailability;
  failed: boolean;
  errorMessage?: string;
};

export function useDayAvailability(date: string) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [request, setRequest] = useState<RequestState | null>(null);

  useEffect(() => {
    let ignore = false;

    getDayAvailability(date)
      .then((data) => {
        if (!ignore) {
          setRequest({ date, data, failed: false });
        }
      })
      .catch((error: unknown) => {
        if (ignore) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Не вдалося завантажити доступність.';
        // Keep previously loaded data for the same date, so a failed refresh does not wipe the view.
        setRequest((previous) => ({
          date,
          data: previous?.date === date ? previous.data : undefined,
          failed: true,
          errorMessage: message,
        }));
      });

    return () => {
      ignore = true;
    };
  }, [date, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  useEffect(() => {
    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const current = request?.date === date ? request : null;

  let status: 'loading' | 'ready' | 'error' = 'loading';
  if (current?.data) {
    status = 'ready';
  } else if (current?.failed) {
    status = 'error';
  }

  return {
    status,
    data: current?.data,
    errorMessage: current?.failed ? current.errorMessage : undefined,
    retry: refresh,
  };
}
