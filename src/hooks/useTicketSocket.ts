import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV } from '../config';

const WS_BASE = ENV.API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

interface UseTicketSocketOptions {
  token: string | null;
  ticketId: number | null;
  onNewComment: (comment: any) => void;
  onStatusChanged?: (payload: { ticketId: number; status: string }) => void;
}

export function useTicketSocket({
  token,
  ticketId,
  onNewComment,
  onStatusChanged,
}: UseTicketSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!token || !ticketId) return;

    const socket = io(`${WS_BASE}/tickets`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket.emit('join_ticket', { ticketId });
    });

    socket.on('new_comment', (comment: any) => {
      onNewComment(comment);
    });

    socket.on('ticket_status_changed', (payload: { ticketId: number; status: string }) => {
      onStatusChanged?.(payload);
    });

    socket.on('connect_error', (err) => {
      console.warn('[TicketSocket] connection error:', err.message);
    });

    socketRef.current = socket;
  }, [token, ticketId, onNewComment, onStatusChanged]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_ticket', { ticketId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);
}
