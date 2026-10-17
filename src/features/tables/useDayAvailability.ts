import { useEffect, useState } from 'react';
import { getDayAvailability } from './availabilityService';
import type { DayAvailability } from './types';

type RequestState = {
  key: string;
  data?: DayAvailability;
  failed?: boolean;
};

// Loads availability for a date. Results from an outdated request are ignored.
export function useDayAvailability(date: string) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${date}#${attempt}`;
  const [request, setRequest] = useState<RequestState>({ key: '' });

  useEffect(() => {
    let ignore = false;

    getDayAvailability(date)
      .then((data) => {
        if (!ignore) {
          setRequest({ key: requestKey, data });
        }
      })
      .catch(() => {
        if (!ignore) {
          setRequest({ key: requestKey, failed: true });
        }
      });

    return () => {
      ignore = true;
    };
  }, [date, requestKey]);

  const isCurrent = request.key === requestKey;

  let status: 'loading' | 'ready' | 'error' = 'loading';
  if (isCurrent && request.failed) {
    status = 'error';
  } else if (isCurrent && request.data) {
    status = 'ready';
  }

  return {
    status,
    data: isCurrent ? request.data : undefined,
    retry: () => setAttempt((value) => value + 1),
  };
}
