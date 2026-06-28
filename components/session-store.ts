import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot, getDocs, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useAuthContext } from '@/components/AuthContext';
import { auth, db } from '@/lib/firebase';

export type BookedSession = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Pending';
  actions?: boolean;
  patientId?: string;
  patientName?: string;
};

export function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    if (!dateStr || !timeStr) return null;
    
    // Split dateStr: expected "Month day, year" (e.g. "June 13, 2026")
    const dateParts = dateStr.trim().split(/[\s,]+/);
    if (dateParts.length < 3) return null;

    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const shortMonths = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec"
    ];

    let monthVal = months.indexOf(dateParts[0].toLowerCase());
    if (monthVal === -1) {
      monthVal = shortMonths.indexOf(dateParts[0].toLowerCase().slice(0, 3));
    }
    if (monthVal === -1) return null;

    const dayVal = parseInt(dateParts[1], 10);
    const yearVal = parseInt(dateParts[2], 10);
    if (isNaN(dayVal) || isNaN(yearVal)) return null;

    // Match timeStr: expected "hh:mm AM/PM" (e.g. "6:30 PM" or "06:30 PM")
    const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (isNaN(hours) || isNaN(minutes)) return null;

    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }

    return new Date(yearVal, monthVal, dayVal, hours, minutes, 0, 0);
  } catch {
    return null;
  }
}

export function isSessionNear(dateStr: string, timeStr: string): boolean {
  try {
    const sessionDate = parseDateTime(dateStr, timeStr);
    if (!sessionDate) return false;
    
    const now = new Date();
    const diffInMs = sessionDate.getTime() - now.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    // Near session time: 15 minutes before, until 60 minutes after the start time
    return diffInMinutes <= 15 && diffInMinutes >= -60;
  } catch {
    return false;
  }
}

export function isSessionPast(dateStr: string, timeStr: string): boolean {
  try {
    const sessionDate = parseDateTime(dateStr, timeStr);
    if (!sessionDate) return false;
    
    const now = new Date();
    // A session is past if current time is greater than session start time + 60 minutes
    const sessionEndTime = new Date(sessionDate.getTime() + 60 * 60 * 1000);
    return now > sessionEndTime;
  } catch {
    return false;
  }
}

export function useBookedSessions() {
  const { currentUser } = useAuthContext();
  const [sessions, setSessions] = useState<BookedSession[]>([]);

  useEffect(() => {
    if (!currentUser || !db) {
      setTimeout(() => {
        setSessions([]);
      }, 0);
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
          const isPast = isSessionPast(data.date, data.time);
          
          let status: 'Upcoming' | 'Completed' | 'Pending' = 'Completed';
          if (!isPast) {
            status = data.status === 'scheduled' ? 'Upcoming' : data.status === 'pending' ? 'Pending' : 'Completed';
          }
          
          return {
            id: docSnap.id,
            doctor: data.counselorId || 'Unknown Counselor',
            specialty: 'Counselor', // Mocked as the DB schema does not store specialty
            date: data.date,
            time: data.time,
            status: status,
            actions: !isPast && (data.status === 'scheduled' || data.status === 'pending'),
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
  const { currentUser } = useAuthContext();
  const [sessions, setSessions] = useState<BookedSession[]>([]);

  useEffect(() => {
    if (!counselorName || !db || !currentUser) {
      setTimeout(() => {
        setSessions([]);
      }, 0);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('counselorUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSessions: BookedSession[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const isPast = isSessionPast(data.date, data.time);
          
          let status: 'Upcoming' | 'Completed' | 'Pending' = 'Completed';
          if (!isPast) {
            status = data.status === 'scheduled' ? 'Upcoming' : data.status === 'pending' ? 'Pending' : 'Completed';
          }
          
          return {
            id: docSnap.id,
            doctor: data.counselorId || 'Unknown Counselor',
            specialty: 'Counselor',
            date: data.date,
            time: data.time,
            status: status,
            actions: !isPast && (data.status === 'scheduled' || data.status === 'pending'),
            patientId: data.patientId,
            patientName: data.patientName || '',
          };
        });
        
        setSessions(fetchedSessions);
      },
      (error) => {
        console.error('Error fetching counselor appointments:', error);
      }
    );

    return () => unsubscribe();
  }, [counselorName, currentUser]);

  return sessions;
}

export async function addBookedSession(session: (Omit<BookedSession, 'id'> | BookedSession) & { counselorUid?: string }) {
  const user = auth?.currentUser;
  if (!user || !db) {
    Alert.alert(
      'Authentication Required',
      'Please log in to your account to book a session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/member-login') }
      ]
    );
    return;
  }

  try {
    let counselorUid = session.counselorUid || '';
    if (!counselorUid) {
      console.log('[addBookedSession] Querying counselor profile for doctor:', session.doctor);
      const counselorQ = query(collection(db, 'counselors'), where('displayName', '==', session.doctor));
      const counselorSnap = await getDocs(counselorQ);
      if (!counselorSnap.empty) {
        counselorUid = counselorSnap.docs[0].id;
      }
    }
    console.log('[addBookedSession] Resolved counselorUid:', counselorUid);

    console.log('[addBookedSession] Creating appointment document for patient:', user.uid);
    let patientName = user.displayName || '';
    if (db) {
      try {
        const memberSnap = await getDoc(doc(db, 'members', user.uid));
        if (memberSnap.exists()) {
          const mData = memberSnap.data();
          patientName = mData.name || mData.displayName || patientName;
        }
      } catch (err) {
        console.error("Error reading patient name for appointment booking:", err);
      }
    }
    if (!patientName.trim()) {
      patientName = 'Patient';
    }

    const note = (session as any).note || 'Seeking mental health guidance';
    await addDoc(collection(db, 'appointments'), {
      patientId: user.uid,
      patientName: patientName,
      counselorId: session.doctor,
      counselorUid: counselorUid,
      date: session.date,
      time: session.time,
      status: 'pending',
      note: note,
    });
    console.log('[addBookedSession] Appointment document created successfully.');

    if (counselorUid) {
      await addDoc(collection(db, 'notifications'), {
        counselorUid: counselorUid,
        counselorName: session.doctor,
        type: 'booking',
        title: 'New session request',
        message: `A patient requested a session for ${session.date} at ${session.time}.`,
        createdAt: Date.now(),
        read: false,
      });
    }
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
