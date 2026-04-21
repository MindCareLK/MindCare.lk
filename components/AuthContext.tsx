import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/lib/firebase';
import { getMemberProfile } from '@/lib/members';

export type MemberProfile = {
  name: string;
  email: string;
  gender: string;
  dob: string;
};

type AuthContextValue = {
  currentUser: User | null;
  memberProfile: MemberProfile;
  setMemberProfile: (profile: MemberProfile) => void;
  isAuthReady: boolean;
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
        return;
      }

      void (async () => {
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
    }),
    [currentUser, isAuthReady, memberProfile]
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
