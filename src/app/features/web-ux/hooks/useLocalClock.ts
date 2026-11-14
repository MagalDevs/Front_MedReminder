'use client';

import { useCallback, useEffect, useState } from 'react';

const readClock = () => ({ now: new Date(), zone: Intl.DateTimeFormat().resolvedOptions().timeZone });

export function useLocalClock() {
  const [clock, setClock] = useState(readClock);
  // Also available to a gesture which must recheck the actual time before registering.
  const refreshNow = useCallback(() => {
    const next = readClock();
    setClock(next);
    return next.now;
  }, []);
  useEffect(() => {
    const timer = window.setInterval(refreshNow, 1000);
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshNow(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshNow]);
  return { ...clock, refreshNow };
}
