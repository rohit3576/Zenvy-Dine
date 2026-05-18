import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { permissionsForRole } from "@/lib/auth-roles";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const onboardingSchema = z.object({
  displayName: z.string().trim().optional(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
  restaurantId: z.string().trim().min(2),
  onboardingCode: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const configuredCode = process.env.ADMIN_ONBOARDING_CODE;

  if (!configuredCode) {
    return NextResponse.json({ error: "Admin onboarding is not configured." }, { status: 503 });
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding request." }, { status: 400 });
  }

  const { displayName, email, password, restaurantId, onboardingCode } = parsed.data;

  if (onboardingCode !== configuredCode) {
    return NextResponse.json({ error: "Invalid onboarding code." }, { status: 403 });
  }

  const db = getAdminDb();
  const restaurant = await db.collection("restaurants").doc(restaurantId).get();

  if (!restaurant.exists) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const auth = getAdminAuth();

  try {
    await auth.getUserByEmail(email);
    return NextResponse.json({ error: "A Firebase Auth user already exists for this email." }, { status: 409 });
  } catch {
    // Expected path for first-time onboarding.
  }

  const authUser = await auth.createUser({
    email,
    password,
    displayName: displayName || email,
    emailVerified: false,
  });

  await db.collection("users").doc(authUser.uid).set({
    uid: authUser.uid,
    email,
    displayName: displayName || email,
    role: "OWNER",
    restaurantId,
    permissions: permissionsForRole("OWNER"),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const customToken = await auth.createCustomToken(authUser.uid);

  return NextResponse.json({ customToken, restaurantId });
}

