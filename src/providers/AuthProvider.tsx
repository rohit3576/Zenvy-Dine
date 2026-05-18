"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  onIdTokenChanged,
  setPersistence,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types";
import { normalizeRole, permissionsForRole } from "@/lib/auth-roles";
import { clearFirebaseSession, persistFirebaseSession } from "@/lib/auth-session";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Failed to enable persistent auth sessions", error);
    });

    const unsubscribe = onIdTokenChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          await persistFirebaseSession(fUser);
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = normalizeRole(data.role);

            if (!role) {
              setUser(null);
            } else {
              setUser({
                id: fUser.uid,
                uid: fUser.uid,
                ...data,
                role,
                permissions: Array.isArray(data.permissions) ? data.permissions : permissionsForRole(role),
              } as User);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to load user profile", error);
          setUser(null);
        }
      } else {
        clearFirebaseSession();
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
