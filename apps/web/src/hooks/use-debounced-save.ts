'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseDebouncedSaveOptions {
  /** Delay in ms before triggering save. Default 1000ms */
  delay?: number;
  /** The save function to call */
  onSave: (value: string) => Promise<void>;
}

/**
 * Provides debounced auto-save with status indicator.
 * Returns save status ('idle' | 'saving' | 'saved' | 'error') and a manual trigger.
 */
export function useDebouncedSave({ delay = 1000, onSave }: UseDebouncedSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const debouncedSave = useCallback(
    (value: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setStatus('saving');
        try {
          await saveRef.current(value);
          setStatus('saved');
          setLastSavedAt(new Date());
          // Reset to idle after 3 seconds
          setTimeout(() => setStatus('idle'), 3000);
        } catch {
          setStatus('error');
        }
      }, delay);
    },
    [delay]
  );

  const saveNow = useCallback(async (value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('saving');
    try {
      await saveRef.current(value);
      setStatus('saved');
      setLastSavedAt(new Date());
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { status, lastSavedAt, debouncedSave, saveNow, cancel };
}
