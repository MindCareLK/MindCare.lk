import { useSyncExternalStore } from 'react';

export type CounselorNotification = {
  id: string;
  counselorName: string;
  type: 'booking' | 'reschedule';
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
};

let notifications: CounselorNotification[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return notifications;
}

export function useCounselorNotifications() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addCounselorNotification(
  notification: Omit<CounselorNotification, 'id' | 'createdAt' | 'read'>
) {
  notifications = [
    {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      read: false,
    },
    ...notifications,
  ];
  emitChange();
}

export function markCounselorNotificationsAsRead(counselorName: string) {
  notifications = notifications.map((notification) =>
    notification.counselorName === counselorName ? { ...notification, read: true } : notification
  );
  emitChange();
}
