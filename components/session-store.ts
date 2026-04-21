import { useSyncExternalStore } from 'react';

export type BookedSession = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed';
  actions?: boolean;
};

let sessions: BookedSession[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return sessions;
}

export function useBookedSessions() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addBookedSession(session: BookedSession) {
  sessions = [session, ...sessions];
  emitChange();
}

export function updateBookedSession(sessionId: string, patch: Partial<BookedSession>) {
  sessions = sessions.map((session) => (session.id === sessionId ? { ...session, ...patch } : session));
  emitChange();
}

export function removeBookedSession(sessionId: string) {
  sessions = sessions.filter((session) => session.id !== sessionId);
  emitChange();
}
