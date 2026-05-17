"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types";

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
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          if (userDoc.exists()) {
            setUser({ id: fUser.uid, ...userDoc.data() } as User);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to load user profile", error);
          setUser(null);
        }
      } else {
        if (process.env.NODE_ENV !== "production") {
          // DEVELOPMENT ONLY: allows local admin screens to be tested before Auth is wired.
          setUser({
            id: "demo-owner",
            email: "owner@spicegarden.test",
            role: "RESTAURANT_OWNER",
            restaurantId: "spice-garden",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        } else {
          setUser(null);
        }
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
