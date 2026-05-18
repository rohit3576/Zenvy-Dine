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
import { normalizeRole } from "@/lib/auth-roles";
import { persistFirebaseSession } from "@/lib/auth-session";

async function getAdminRedirect(firebaseUser: FirebaseUser, requestedNext: string | null) {
  await persistFirebaseSession(firebaseUser);
  const profile = await getDoc(doc(db, "users", firebaseUser.uid));

  if (!profile.exists()) {
    throw new Error("NO_ADMIN_PROFILE");
  }

  const data = profile.data();
  const role = normalizeRole(data.role);
  const restaurantId = typeof data.restaurantId === "string" ? data.restaurantId : null;

  if (!role || !restaurantId) {
    throw new Error("INVALID_ADMIN_PROFILE");
  }

  if (requestedNext?.startsWith(`/admin/${restaurantId}`)) {
    return requestedNext;
  }

  return `/admin/${restaurantId}`;
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
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const redirectTo = await getAdminRedirect(credential.user, searchParams.get("next"));
      toast.success("Signed in successfully.");
      router.replace(redirectTo);
    } catch (error) {
      console.error("Sign-in error", error);
      if (error instanceof Error && error.message === "NO_ADMIN_PROFILE") {
        await signOut(auth).catch(() => undefined);
        toast.error("This Firebase account is not linked to a Zenvy Dine admin profile.");
      } else if (error instanceof Error && error.message === "INVALID_ADMIN_PROFILE") {
        await signOut(auth).catch(() => undefined);
        toast.error("Your admin profile is incomplete. Ask the owner to assign a role and restaurant.");
      } else {
        toast.error("Could not sign in. Check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const redirectTo = await getAdminRedirect(credential.user, searchParams.get("next"));
      toast.success("Signed in with Google.");
      router.replace(redirectTo);
    } catch (error) {
      console.error("Google sign-in error", error);
      toast.error("Google sign-in is unavailable or this account has no admin profile.");
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
