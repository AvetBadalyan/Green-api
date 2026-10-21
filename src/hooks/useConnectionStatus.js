import { useState, useEffect, useCallback } from 'react';
import { getStateInstance } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 30000; // Check every 30 seconds

/**
 * Polls the instance connection state.
 * Returns: 'authorized' | 'notAuthorized' | 'sleepMode' | 'loading' | 'error'
 */
export default function useConnectionStatus() {
  const { credentials } = useAuth();
  const [status, setStatus] = useState('loading');

  const checkStatus = useCallback(async () => {
    if (!credentials) {
      setStatus('notAuthorized');
      return;
    }

    try {
      const result = await getStateInstance(credentials);
      setStatus(result.stateInstance || 'unknown');
    } catch (err) {
      console.error('Connection status error:', err);
      setStatus('error');
    }
  }, [credentials]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return status;
}
