import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * useOnlineStatus hook
 * Distinguishes true browser offline from backend reachability.
 * Periodically pings /api/health when online to verify API status.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const checkIntervalRef = useRef(null);

  const checkBackendHealth = useCallback(async () => {
    if (!navigator.onLine) {
      setIsBackendReachable(false);
      return false;
    }
    try {
      // 3-second timeout for quick responsiveness
      const res = await axios.get('/api/health', { timeout: 3000 });
      const reachable = res.status === 200;
      setIsBackendReachable(reachable);
      return reachable;
    } catch {
      setIsBackendReachable(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const ok = await checkBackendHealth();
      if (ok) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsBackendReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkBackendHealth();

    // Check periodically every 20 seconds
    checkIntervalRef.current = setInterval(checkBackendHealth, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [checkBackendHealth]);

  const clearReconnectedFlag = () => setWasOffline(false);

  // Operational state: either browser is offline OR backend is unreachable
  const isOffline = !isOnline || !isBackendReachable;

  return {
    isOffline,
    isOnline,
    isBackendReachable,
    wasOffline,
    clearReconnectedFlag,
    checkBackendHealth
  };
}
