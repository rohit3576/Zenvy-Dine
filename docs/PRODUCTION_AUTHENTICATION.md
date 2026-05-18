# Production Authentication

## Authentication Architecture

Zenvy Dine uses Firebase Authentication for identity and Firestore for admin authorization.

- Firebase Auth providers: Email/Password is required. Google can be enabled in Firebase Console and is supported by the login screen.
- Session persistence: Firebase Auth uses browser local persistence. The app also writes the current Firebase ID token to the `__session` cookie so Next.js server routes can verify protected admin requests.
- Server protection: `src/app/admin/[slug]/layout.tsx` calls `requireAdminUser()` before rendering admin UI. It verifies the ID token with Firebase Admin SDK and loads `/users/{uid}` from Firestore.
- Owner onboarding: `/signup` calls `/api/admin/onboarding`, which requires `ADMIN_ONBOARDING_CODE`, creates the Firebase Auth user with the Admin SDK, writes the owner profile, and returns a custom token for first sign-in.
- Client protection: `AuthProvider` tracks `onIdTokenChanged`, loads the Firestore user profile, normalizes legacy roles, refreshes the `__session` cookie, and clears it on logout.
- Data protection: Firestore rules require authenticated users and tenant-matching `restaurantId` for admin reads and writes.

## RBAC Summary

Canonical production roles are:

- `OWNER`: full restaurant admin, settings, menu, tables, staff, and order operations.
- `MANAGER`: menu, tables, staff, and order operations for the assigned restaurant.
- `STAFF`: operational access for reading and updating orders and waiter calls.

Firestore user schema:

```json
{
  "uid": "firebase-auth-uid",
  "email": "owner@example.com",
  "role": "OWNER",
  "restaurantId": "restaurant-slug-or-id",
  "permissions": ["restaurant:read", "orders:read"],
  "createdAt": "serverTimestamp"
}
```

The app accepts old seeded roles as aliases in code and rules, but new production users should use only `OWNER`, `MANAGER`, or `STAFF`.

## Admin Onboarding

1. In Firebase Console, enable Authentication providers: Email/Password, and optionally Google.
2. Confirm Vercel has all `NEXT_PUBLIC_FIREBASE_*` variables plus Firebase Admin SDK variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
3. Set a high-entropy `ADMIN_ONBOARDING_CODE` in Vercel before using `/signup`.
4. Create or confirm the restaurant document exists at `/restaurants/{restaurantId}`.
5. Open `/signup`, enter the onboarding code, create the first owner account, and use the exact restaurant id.
6. Verify the generated Firestore user document at `/users/{uid}` has `uid`, `email`, `role: OWNER`, `restaurantId`, `permissions`, and timestamps.
7. Sign out, sign back in from `/login`, and confirm the app redirects to `/admin/{restaurantId}`.
8. Rotate or remove `ADMIN_ONBOARDING_CODE` after first-owner setup unless you intentionally need another owner onboarding window.

## Production Auth Checklist

- Firebase Email/Password provider enabled.
- Google provider enabled only if Google login should be offered.
- Vercel environment variables configured for Firebase client and Admin SDK.
- `ADMIN_ONBOARDING_CODE` configured for controlled owner onboarding, then rotated after use.
- `firestore.rules` deployed, not permissive development rules.
- Every admin has a `/users/{uid}` document with canonical role and matching `restaurantId`.
- Direct access to `/admin/{restaurantId}` redirects unauthenticated users to `/login`.
- Authenticated users assigned to another restaurant redirect to `/unauthorized`.
- Logout clears Firebase Auth and the `__session` cookie.
- Password reset email sends from the login page.
- Firestore reads/writes fail for cross-tenant admin attempts.
