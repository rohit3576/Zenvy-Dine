import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { permissionsForRole } from "@/lib/auth-roles";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: unknown }).code);
  }

  return error instanceof Error ? error.name : "unknown";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return String(error);
}

function isFirestorePermissionError(error: unknown) {
  const code = getErrorCode(error).toLowerCase();
  const message = getErrorMessage(error).toLowerCase();

  return code === "7" || code.includes("permission") || message.includes("permission");
}

const onboardingSchema = z.object({
  displayName: z.string().trim().optional(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
  restaurantId: z.string().trim().min(2),
  onboardingCode: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
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
    let canWriteFirestoreProfile = true;

    try {
      const restaurant = await db.collection("restaurants").doc(restaurantId).get();

      if (!restaurant.exists) {
        return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
      }
    } catch (error) {
      console.error("Onboarding restaurant lookup failed", {
        code: getErrorCode(error),
        message: getErrorMessage(error),
        restaurantId,
      });

      if (process.env.NODE_ENV === "production" || !isFirestorePermissionError(error)) {
        return NextResponse.json({
          error: "Firebase Admin cannot read restaurants. Check service account Firestore IAM permissions.",
          code: getErrorCode(error),
        }, { status: 503 });
      }

      canWriteFirestoreProfile = false;
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

    const permissions = permissionsForRole("OWNER");
    const customClaims = {
      role: "OWNER",
      restaurantId,
      restaurantSlug: restaurantId,
      isActive: true,
      permissions,
    };

    await auth.setCustomUserClaims(authUser.uid, customClaims);

    if (canWriteFirestoreProfile) {
      try {
        await db.collection("users").doc(authUser.uid).set({
          uid: authUser.uid,
          email,
          displayName: displayName || email,
          ...customClaims,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("Onboarding user profile write failed", {
          code: getErrorCode(error),
          message: getErrorMessage(error),
          restaurantId,
          uid: authUser.uid,
        });

        if (process.env.NODE_ENV === "production") {
          await auth.deleteUser(authUser.uid).catch(() => undefined);
          return NextResponse.json({
            error: "Firebase Admin cannot write user profiles. Check service account Firestore IAM permissions.",
            code: getErrorCode(error),
          }, { status: 503 });
        }

        canWriteFirestoreProfile = false;
      }
    }

    const customToken = await auth.createCustomToken(authUser.uid);

    return NextResponse.json({
      customToken,
      restaurantId,
      profileSource: canWriteFirestoreProfile ? "firestore" : "custom-claims",
    });
  } catch (error) {
    console.error("Admin onboarding failed", {
      code: getErrorCode(error),
      message: getErrorMessage(error),
    });

    return NextResponse.json({
      error: "Admin onboarding failed.",
      code: getErrorCode(error),
    }, { status: 500 });
  }
}
