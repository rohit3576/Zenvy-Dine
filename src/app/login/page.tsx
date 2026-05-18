"use client";

import { Suspense, useState } from "react";
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { isRestaurantAdmin, normalizeUserProfile, profileFromClaims } from "@/lib/auth-roles";
import { authDebug, getFirebaseErrorCode, getFirebaseErrorMessage } from "@/lib/auth-debug";
import { persistFirebaseSession } from "@/lib/auth-session";

async function getAdminRedirect(firebaseUser: FirebaseUser, requestedNext: string | null) {
  authDebug("login profile redirect start", { uid: firebaseUser.uid, email: firebaseUser.email });
  await persistFirebaseSession(firebaseUser);
  let user = null;

  try {
    const profile = await getDoc(doc(db, "users", firebaseUser.uid));
    authDebug("login rbac lookup", {
      path: `users/${firebaseUser.uid}`,
      uid: firebaseUser.uid,
      exists: profile.exists(),
      profile: profile.exists() ? profile.data() : null,
    });

    if (!profile.exists()) {
      throw new Error("NO_ADMIN_PROFILE");
    }

    user = normalizeUserProfile(firebaseUser.uid, profile.data(), firebaseUser.email ?? "");
  } catch (error) {
    authDebug("login rbac lookup failed, trying claims", {
      code: getFirebaseErrorCode(error),
      message: getFirebaseErrorMessage(error),
    });
    const token = await firebaseUser.getIdTokenResult(true);
    user = profileFromClaims(firebaseUser.uid, token.claims, firebaseUser.email ?? "");
  }

  if (!user) {
    throw new Error("INVALID_ADMIN_PROFILE");
  }

  if (!isRestaurantAdmin(user)) {
    throw new Error("INVALID_ADMIN_PROFILE");
  }

  authDebug("login rbac normalized", {
    uid: user.uid,
    role: user.role,
    restaurantSlug: user.restaurantSlug,
    isActive: user.isActive,
    expectedRole: "OWNER | MANAGER | STAFF",
    allowed: isRestaurantAdmin(user),
  });

  if (requestedNext?.startsWith(`/admin/${user.restaurantSlug}`)) {
    return requestedNext;
  }

  return `/admin/${user.restaurantSlug}`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      authDebug("email login submit", { email });
      const credential = await signInWithEmailAndPassword(auth, email, password);
      authDebug("email login success", { uid: credential.user.uid, email: credential.user.email });
      const redirectTo = await getAdminRedirect(credential.user, searchParams.get("next"));
      toast.success("Signed in successfully.");
      router.replace(redirectTo);
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      const message = getFirebaseErrorMessage(error);
      console.error("Sign-in error", { code, message });
      if (error instanceof Error && error.message === "NO_ADMIN_PROFILE") {
        await signOut(auth).catch(() => undefined);
        toast.error("This Firebase account is not linked to a Zenvy Dine admin profile.");
      } else if (error instanceof Error && error.message === "INVALID_ADMIN_PROFILE") {
        await signOut(auth).catch(() => undefined);
        toast.error("Your admin profile is inactive or missing role/restaurantSlug.");
      } else if (code === "permission-denied" || code === "FirebaseError") {
        toast.error("Signed in, but Firestore blocked your admin profile. Deploy the updated Firestore rules.");
      } else if (code?.startsWith("auth/")) {
        toast.error(`Firebase Auth rejected the login: ${code}`);
      } else {
        toast.error(`Login failed after Firebase Auth: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      authDebug("google login submit");
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      authDebug("google login success", { uid: credential.user.uid, email: credential.user.email });
      const redirectTo = await getAdminRedirect(credential.user, searchParams.get("next"));
      toast.success("Signed in with Google.");
      router.replace(redirectTo);
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      console.error("Google sign-in error", { code, message: getFirebaseErrorMessage(error) });
      toast.error(code ? `Google sign-in failed: ${code}` : "Google sign-in is unavailable or this account has no admin profile.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }

    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success("Password reset email sent.");
    } catch (error) {
      console.error("Password reset error", error);
      toast.error("Could not send a password reset email.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Zenvy Dine Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={signIn}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <Button className="w-full" type="button" variant="outline" disabled={loading} onClick={signInWithGoogle}>
              Continue with Google
            </Button>
            <Button className="w-full" type="button" variant="ghost" disabled={resetting} onClick={resetPassword}>
              {resetting ? "Sending reset email..." : "Forgot password?"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-muted/20" />}>
      <LoginForm />
    </Suspense>
  );
}
