'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureRef } from '@/utils/captureRef';

export function RefCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureRef();
  }, [searchParams]);

  return null;
}
