'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Warns users before navigating away with unsaved changes.
 * Handles both browser close/refresh (beforeunload) and Next.js client-side navigation.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Browser close / refresh guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      // Modern browsers show a generic message; returnValue is required for some
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Confirmation helper for programmatic navigation
  const confirmNavigation = useCallback((onConfirm: () => void) => {
    if (!isDirtyRef.current) {
      onConfirm();
      return;
    }
    const confirmed = window.confirm(
      'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
    );
    if (confirmed) {
      onConfirm();
    }
  }, []);

  return { confirmNavigation };
}
