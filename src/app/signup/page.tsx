"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { persistFirebaseSession } from "@/lib/auth-session";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState("spice-garden");
  const [onboardingCode, setOnboardingCode] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || !restaurantId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password, restaurantId, onboardingCode }),
      });
      const responseText = await response.text();
      let result: { customToken?: string; restaurantId?: string; error?: string } = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(response.ok ? "Onboarding returned an invalid response." : "Onboarding failed before returning JSON.");
      }

      if (!response.ok || !result.customToken) {
        throw new Error(result.error || "Onboarding failed");
      }

      const credential = await signInWithCustomToken(auth, result.customToken);
      await persistFirebaseSession(credential.user, true);
      toast.success("Owner account created.");
      router.push(`/admin/${result.restaurantId}`);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error instanceof Error ? error.message : "Could not create owner account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={signup}>
          <Input placeholder="Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <Input placeholder="Owner email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          <Input placeholder="Restaurant slug" value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)} required />
          <Input placeholder="Onboarding code" type="password" value={onboardingCode} onChange={(event) => setOnboardingCode(event.target.value)} required />
          <Button className="w-full" type="submit" disabled={loading || !email || !password || !restaurantId || !onboardingCode}>
            {loading ? "Creating..." : "Create owner account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link className="font-medium text-primary" href="/login">Log in</Link>
          </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
