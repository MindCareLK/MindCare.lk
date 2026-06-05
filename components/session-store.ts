import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuthContext } from '@/components/AuthContext';
import { auth, db } from '@/lib/firebase';

export type BookedSession = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed';
  actions?: boolean;
  patientId?: string;
};

export function isSessionNear(dateStr: string, timeStr: string): boolean {
  try {
    const sessionDate = new Date(`${dateStr} ${timeStr}`);
    if (isNaN(sessionDate.getTime())) return false;
    
    const now = new Date();
    const diffInMs = sessionDate.getTime() - now.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    // Near session time: 15 minutes before, until 60 minutes after the start time
    return diffInMinutes <= 15 && diffInMinutes >= -60;
  } catch (e) {
    return false;
  }
}

export function useBookedSessions() {
  const { currentUser } = useAuthContext();
  const [sessions, setSessions] = useState<BookedSession[]>([]);

  useEffect(() => {
    if (!currentUser || !db) {
      setSessions([]);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSessions: BookedSession[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            doctor: data.counselorId || 'Unknown Counselor',
            specialty: 'Counselor', // Mocked as the DB schema does not store specialty
            date: data.date,
            time: data.time,
            status: data.status === 'scheduled' ? 'Upcoming' : 'Completed',
            actions: data.status === 'scheduled',
          };
        });
        
        // Optionally sort them locally or rely on Firestore order
        setSessions(fetchedSessions);
      },
      (error) => {
        console.error('Error fetching appointments:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return sessions;
}

export function useCounselorSessions(counselorName: string) {
  const [sessions, setSessions] = useState<BookedSession[]>([]);

  useEffect(() => {
    if (!counselorName || !db) {
      setSessions([]);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('counselorId', '==', counselorName)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSessions: BookedSession[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            doctor: data.counselorId || 'Unknown Counselor',
            specialty: 'Counselor',
            date: data.date,
            time: data.time,
            status: data.status === 'scheduled' ? 'Upcoming' : 'Completed',
            actions: data.status === 'scheduled',
            patientId: data.patientId,
          };
        });
        
        setSessions(fetchedSessions);
      },
      (error) => {
        console.error('Error fetching counselor appointments:', error);
      }
    );

    return () => unsubscribe();
  }, [counselorName]);

  return sessions;
}

export async function addBookedSession(session: Omit<BookedSession, 'id'> | BookedSession) {
  const user = auth?.currentUser;
  if (!user || !db) {
    console.warn('Cannot add session: User not authenticated or DB not initialized');
    return;
  }

  try {
    await addDoc(collection(db, 'appointments'), {
      patientId: user.uid,
      counselorId: session.doctor,
      date: session.date,
      time: session.time,
      status: session.status === 'Upcoming' ? 'scheduled' : 'completed',
    });
  } catch (error) {
    console.error('Error adding appointment:', error);
  }
}

export async function updateBookedSession(sessionId: string, patch: Partial<BookedSession>) {
  if (!db) return;

  try {
    const updates: Record<string, any> = {};
    if (patch.doctor !== undefined) updates.counselorId = patch.doctor;
    if (patch.date !== undefined) updates.date = patch.date;
    if (patch.time !== undefined) updates.time = patch.time;
    if (patch.status !== undefined) {
      updates.status = patch.status === 'Upcoming' ? 'scheduled' : 'completed';
    }

    const docRef = doc(db, 'appointments', sessionId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating appointment:', error);
  }
}

export async function removeBookedSession(sessionId: string) {
  if (!db) return;

  try {
    const docRef = doc(db, 'appointments', sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing appointment:', error);
  }
}
