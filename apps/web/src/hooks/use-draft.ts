'use client';

import * as React from 'react';

export function useDraft<T>(key: string, initialData?: T) {
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [draft, setDraft] = React.useState<T | undefined>(() => {
    if (typeof window === 'undefined') return initialData;
    const saved = localStorage.getItem(`brand_draft_${key}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.timestamp) setLastSaved(new Date(parsed.timestamp));
      return parsed.data;
    }
    return initialData;
  });

  const saveDraft = React.useCallback((data: T) => {
    const now = new Date();
    setDraft(data);
    setLastSaved(now);
    localStorage.setItem(`brand_draft_${key}`, JSON.stringify({ data, timestamp: now.toISOString() }));
  }, [key]);

  const clearDraft = React.useCallback(() => {
    setDraft(undefined);
    setLastSaved(null);
    localStorage.removeItem(`brand_draft_${key}`);
  }, [key]);

  return { draft, saveDraft, clearDraft, lastSaved };
}
