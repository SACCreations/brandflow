'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutomationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/automations');
  }, [router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Redirecting to automations...</p>
    </div>
  );
}
