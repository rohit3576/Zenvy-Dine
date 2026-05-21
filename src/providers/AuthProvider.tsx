"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onIdTokenChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, ensureAuthPersistence } from "@/lib/firebase";
import { User } from "@/types";
import { normalizeUserProfile, profileFromClaims } from "@/lib/auth-roles";
import { authDebug, getFirebaseErrorCode, getFirebaseErrorMessage } from "@/lib/auth-debug";
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
    let isMounted = true;

    const handleAuthUser = async (fUser: FirebaseUser | null) => {
      if (!isMounted) return;
      setFirebaseUser(fUser);
      authDebug("id token changed", { uid: fUser?.uid ?? null, email: fUser?.email ?? null });
      if (process.env.NODE_ENV !== "production") {
        console.log("CURRENT USER:", fUser);
        console.log("AUTH LOADING:", true);
      }
      if (fUser) {
        try {
          await persistFirebaseSession(fUser);
          authDebug("session cookie refreshed", { uid: fUser.uid });
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          authDebug("rbac profile lookup", {
            path: `users/${fUser.uid}`,
            uid: fUser.uid,
            exists: userDoc.exists(),
            profile: userDoc.exists() ? userDoc.data() : null,
          });
          if (userDoc.exists()) {
            const profile = normalizeUserProfile(fUser.uid, userDoc.data(), fUser.email ?? "");
            authDebug("rbac profile normalized", {
              uid: fUser.uid,
              role: profile?.role ?? null,
              restaurantSlug: profile?.restaurantSlug ?? null,
              isActive: profile?.isActive ?? null,
            });
            setUser(profile);
          } else {
            const token = await fUser.getIdTokenResult(true);
            const claimsProfile = profileFromClaims(fUser.uid, token.claims, fUser.email ?? "");
            authDebug("rbac profile missing, using claims fallback", {
              uid: fUser.uid,
              role: claimsProfile?.role ?? null,
              restaurantSlug: claimsProfile?.restaurantSlug ?? null,
              isActive: claimsProfile?.isActive ?? null,
            });
            setUser(claimsProfile);
          }
        } catch (error) {
          console.error("Failed to load user profile", {
            code: getFirebaseErrorCode(error),
            message: getFirebaseErrorMessage(error),
          });
          try {
            const token = await fUser.getIdTokenResult(true);
            const claimsProfile = profileFromClaims(fUser.uid, token.claims, fUser.email ?? "");
            authDebug("rbac claims fallback", {
              uid: fUser.uid,
              role: claimsProfile?.role ?? null,
              restaurantSlug: claimsProfile?.restaurantSlug ?? null,
              isActive: claimsProfile?.isActive ?? null,
            });
            setUser(claimsProfile);
          } catch (claimsError) {
            console.error("Failed to load RBAC custom claims", {
              code: getFirebaseErrorCode(claimsError),
              message: getFirebaseErrorMessage(claimsError),
            });
            setUser(null);
          }
        }
      } else {
        clearFirebaseSession();
        setUser(null);
      }
      if (isMounted) {
        setLoading(false);
        if (process.env.NODE_ENV !== "production") {
          console.log("AUTH LOADING:", false);
        }
      }
    };

    let unsubscribe: (() => void) | undefined;

    ensureAuthPersistence()
      .then(() => {
        if (!isMounted) return;
        unsubscribe = onIdTokenChanged(auth, handleAuthUser);
      })
      .catch((error) => {
        console.error("Failed to enable persistent auth sessions", {
          code: getFirebaseErrorCode(error),
          message: getFirebaseErrorMessage(error),
        });
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
