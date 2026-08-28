import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db, getFirebaseConfigError } from "@/lib/firebase";

export type AdminProfile = {
  uid: string;
  email: string;
  role: "admin";
};

export type MemberRecord = {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  gender: string;
  dob: string;
  profileCompleted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CounselorRecord = {
  uid: string;
  email: string;
  salutation: string;
  fullName: string;
  displayName: string;
  specialty: string;
  qualifications: string[];
  researchStudies: string[];
  bio: string;
  role: "counselor";
  profileCompleted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AppointmentRecord = {
  id: string;
  patientId: string;
  counselorId: string;
  counselorUid: string;
  date: string;
  time: string;
  status: "scheduled" | "completed";
};

export async function signInAdmin(email: string, password: string) {
  if (!auth) {
    throw new Error(getFirebaseConfigError() ?? "Firebase Auth is unavailable.");
  }
  if (!db) {
    throw new Error(getFirebaseConfigError() ?? "Firestore is unavailable.");
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const adminDocRef = doc(db, "admins", uid);
  const adminSnap = await getDoc(adminDocRef);

  if (adminSnap.exists()) {
    return {
      uid,
      email: credential.user.email ?? email,
      role: "admin" as const,
    };
  }

  const lowerEmail = email.toLowerCase();
  if (lowerEmail === 'admin@gmail.com' || lowerEmail === 'admin@mindcare.lk') {
    await setDoc(adminDocRef, {
      email: lowerEmail,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return {
      uid,
      email: credential.user.email ?? email,
      role: "admin" as const,
    };
  }

  throw new Error("This account does not have admin privileges.");
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!auth?.currentUser || !db) return false;

  try {
    const adminDocRef = doc(db, "admins", auth.currentUser.uid);
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists()) {
      return true;
    }

    const email = auth.currentUser.email?.toLowerCase();
    if (email === 'admin@gmail.com' || email === 'admin@mindcare.lk') {
      await setDoc(adminDocRef, {
        email,
        role: "admin",
        createdAt: new Date().toISOString(),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getAllMembers(): Promise<MemberRecord[]> {
  if (!db) throw new Error("Firestore is unavailable.");

  const snapshot = await getDocs(collection(db, "members"));
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as MemberRecord));
}

export async function deleteMember(uid: string): Promise<void> {
  if (!db) throw new Error("Firestore is unavailable.");
  await deleteDoc(doc(db, "members", uid));
}

export async function getAllCounselors(): Promise<CounselorRecord[]> {
  if (!db) throw new Error("Firestore is unavailable.");

  const snapshot = await getDocs(collection(db, "counselors"));
  return snapshot.docs.map(
    (d) => ({ uid: d.id, ...d.data() } as CounselorRecord),
  );
}

export async function deleteCounselor(uid: string): Promise<void> {
  if (!db) throw new Error("Firestore is unavailable.");
  await deleteDoc(doc(db, "counselors", uid));
}

export async function updateCounselorStatus(
  uid: string,
  profileCompleted: boolean,
): Promise<void> {
  if (!db) throw new Error("Firestore is unavailable.");
  await setDoc(
    doc(db, "counselors", uid),
    {
      profileCompleted,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function approveCounselor(uid: string): Promise<void> {
  return updateCounselorStatus(uid, true);
}

export async function getAllAppointments(): Promise<AppointmentRecord[]> {
  if (!db) throw new Error("Firestore is unavailable.");

  const snapshot = await getDocs(collection(db, "appointments"));
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as AppointmentRecord),
  );
}

export async function deleteAppointment(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is unavailable.");
  await deleteDoc(doc(db, "appointments", id));
}

const memberNameCache = new Map<string, string>();

export async function getMemberName(uid: string): Promise<string> {
  if (memberNameCache.has(uid)) return memberNameCache.get(uid)!;
  if (!db) return "Unknown";

  try {
    const snap = await getDoc(doc(db, "members", uid));
    const name =
      (snap.data()?.name as string) ||
      (snap.data()?.displayName as string) ||
      "Unknown";
    memberNameCache.set(uid, name);
    return name;
  } catch {
    return "Unknown";
  }
}
