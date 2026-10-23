import { useState, useEffect, useRef, useCallback } from 'react';
import { getStateInstance } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CONNECTION_POLL_INTERVAL_MS,
  CONNECTION_INITIAL_DELAY_MS,
} from '../constants';

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
      interval = setInterval(checkStatus, CONNECTION_POLL_INTERVAL_MS);
    }, CONNECTION_INITIAL_DELAY_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkStatus]);

  return status;
}
