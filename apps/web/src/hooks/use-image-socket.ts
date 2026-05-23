'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

export interface ImageJobProgress {
  jobId: string;
  progress: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage?: string;
  finalPrompt?: string;
  imageUrl?: string;
  error?: string;
}

interface UseImageSocketOptions {
  enabled?: boolean;
  onCompleted?: (payload: ImageJobProgress) => void;
  onFailed?: (payload: ImageJobProgress) => void;
  onProgress?: (payload: ImageJobProgress) => void;
}

const WS_URL = process.env['NEXT_PUBLIC_API_URL']?.replace('/api/v1', '') || 'http://localhost:4000';

export function useImageSocket(options: UseImageSocketOptions = {}) {
  const { enabled = true, onCompleted, onFailed, onProgress } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ImageJobProgress | null>(null);

  // Use refs for callbacks to avoid reconnect on callback change
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  const onProgressRef = useRef(onProgress);
  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!enabled) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socket = io(`${WS_URL}/ws/image`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('image:job-progress', (payload: ImageJobProgress) => {
      setLastEvent(payload);
      onProgressRef.current?.(payload);
    });

    socket.on('image:job-completed', (payload: ImageJobProgress) => {
      setLastEvent(payload);
      onCompletedRef.current?.(payload);
    });

    socket.on('image:job-failed', (payload: ImageJobProgress) => {
      setLastEvent(payload);
      onFailedRef.current?.(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]);

  // Re-connect when token changes
  const token = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (socketRef.current && token) {
      socketRef.current.auth = { token };
    }
  }, [token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return { isConnected, lastEvent, disconnect };
}
