import { useState, useEffect, useRef, useCallback } from 'react';
import { getStateInstance } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Connection state is low-priority decoration — poll infrequently to avoid
// adding pressure to GREEN-API's rate limit.
const POLL_INTERVAL_MS = 60_000; // 60 s
// Delay the very first check so it doesn't fire in the same burst as getChats
// and receiveNotification on mount (avoids 429 on startup).
const INITIAL_DELAY_MS = 2_000;

/**
 * Polls the instance connection state.
 * Returns: 'authorized' | 'notAuthorized' | 'sleepMode' | 'loading' | 'error'
 * A rate-limit (429) does NOT flip the dot to error — it keeps the last state.
 */
export default function useConnectionStatus() {
  const { credentials } = useAuth();
  const [status, setStatus] = useState('loading');
  const requestPendingRef = useRef(false);

  const checkStatus = useCallback(async () => {
    if (!credentials) {
      setStatus('notAuthorized');
      return;
    }
    if (requestPendingRef.current) return;
    requestPendingRef.current = true;

    try {
      const result = await getStateInstance(credentials);
      setStatus(result.stateInstance || 'unknown');
    } catch (err) {
      // On rate-limit, keep whatever we last showed instead of flashing red.
      if (err?.response?.status !== 429) {
        setStatus('error');
      }
    } finally {
      requestPendingRef.current = false;
    }
  }, [credentials]);

  useEffect(() => {
    let interval;
    const initialTimer = setTimeout(() => {
      checkStatus();
      interval = setInterval(checkStatus, POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkStatus]);

  return status;
}
