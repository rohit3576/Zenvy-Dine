"use client";

import Link from "next/link";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState("spice-garden");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!email || !password || !restaurantId) return;
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      await setDoc(doc(db, "users", credential.user.uid), {
        email,
        displayName: displayName || email,
        role: "RESTAURANT_OWNER",
        restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Account created.");
      router.push(`/admin/${restaurantId}`);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Could not create account. Check Firebase Auth settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Zenvy Dine Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Input placeholder="Restaurant ID" value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)} />
          <Button className="w-full" onClick={signup} disabled={loading || !email || !password || !restaurantId}>
            {loading ? "Creating..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link className="font-medium text-primary" href="/login">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
