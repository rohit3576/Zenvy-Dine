"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully.");
      router.push("/admin/spice-garden");
    } catch (error) {
      console.error("Sign-in error", error);
      toast.error("Could not sign in. Check your email and password.");
    } finally {
      setLoading(false);
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
            <p className="text-xs leading-5 text-muted-foreground">
              Development mode uses a demo admin profile automatically when no Firebase Auth user is signed in.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
