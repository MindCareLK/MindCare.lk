import { doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Creates a new video call room in Firestore.
 */
export const createRoom = async (roomId: string, uid: string) => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const roomRef = doc(db, 'calls', roomId);
  await setDoc(roomRef, {
    createdBy: uid,
    status: 'waiting',
    createdAt: Date.now(),
  });
  
  return roomRef;
};

/**
 * Updates an existing video call room when the counselor joins.
 */
export const joinRoom = async (roomId: string, uid: string) => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const roomRef = doc(db, 'calls', roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (roomSnap.exists()) {
    await updateDoc(roomRef, {
      status: 'connected',
      joinedBy: uid,
      joinedAt: Date.now(),
    });
  } else {
    throw new Error('Room does not exist');
  }
};

/**
 * Listens for real-time updates to the room document (e.g., status changes, WebRTC offers/answers).
 * Returns an unsubscribe function.
 */
export const listenRoom = (roomId: string, onUpdate: (data: any) => void) => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const roomRef = doc(db, 'calls', roomId);
  const unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data());
    }
  });
  
  return unsubscribe;
};

/**
 * Marks the room as ended.
 */
export const endRoom = async (roomId: string) => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const roomRef = doc(db, 'calls', roomId);
  await updateDoc(roomRef, {
    status: 'ended',
    endedAt: Date.now(),
  });
};
