import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth, db } from '@/lib/firebase';
import { getMemberProfile } from '@/lib/members';

export type MemberProfile = {
  name: string;
  email: string;
  gender: string;
  dob: string;
};

export type UserRole = 'member' | 'counselor' | 'admin' | null;

type AuthContextValue = {
  currentUser: User | null;
  memberProfile: MemberProfile;
  setMemberProfile: (profile: MemberProfile) => void;
  isAuthReady: boolean;
  userRole: UserRole;
};

const emptyProfile: MemberProfile = {
  name: '',
  email: '',
  gender: '',
  dob: '',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth?.currentUser ?? null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile>(emptyProfile);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAuthReady, setIsAuthReady] = useState(!auth);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setCurrentUser(nextUser);
      setIsAuthReady(true);

      if (!nextUser) {
        setMemberProfile(emptyProfile);
        setUserRole(null);
        return;
      }

      void (async () => {
        try {
          if (db) {
            // If counselor, do not populate member profile
            const counselorRef = doc(db, 'counselors', nextUser.uid);
            const counselorSnap = await getDoc(counselorRef);
            if (counselorSnap.exists()) {
              setMemberProfile(emptyProfile);
              setUserRole('counselor');
              return;
            }

            // If admin, do not populate member profile
            const adminRef = doc(db, 'admins', nextUser.uid);
            const adminSnap = await getDoc(adminRef);
            if (adminSnap.exists()) {
              setMemberProfile(emptyProfile);
              setUserRole('admin');
              return;
            }
          }
        } catch (e) {
          // Fallback to regular flow on error
        }

        setUserRole('member');
        const savedProfile = await getMemberProfile(nextUser.uid);

        setMemberProfile(
          savedProfile
            ? {
                name: savedProfile.name,
                email: savedProfile.email,
                gender: savedProfile.gender,
                dob: savedProfile.dob,
              }
            : {
                name: nextUser.displayName || '',
                email: nextUser.email || '',
                gender: '',
                dob: '',
              }
        );
      })();
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      memberProfile,
      setMemberProfile,
      isAuthReady,
      userRole,
    }),
    [currentUser, isAuthReady, memberProfile, userRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
