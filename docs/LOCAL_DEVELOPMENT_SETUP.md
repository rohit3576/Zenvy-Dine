# Zenvy Dine Local Development Setup

This guide is for getting the local development environment stable after Firebase is connected and Firestore is enabled.

## 1. Environment Variables

Create `.env.local` from `.env.example` and fill the Firebase values.

Required for the app:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Razorpay values are only required for full online payment testing:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## 2. Development Firestore Rules

The active `firestore.rules` file is intentionally open for local development:

```js
allow read, write: if true;
```

This is marked `DEVELOPMENT ONLY`.

Do not deploy these rules to production. Production rules are preserved in:

```bash
firestore.production.rules
```

Deploy the local development rules after logging into Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project zenvy-dine
```

To restore production rules before deployment:

```powershell
Copy-Item firestore.production.rules firestore.rules
firebase deploy --only firestore:rules
```

## 3. Install Dependencies

```bash
npm install
```

For Firebase Functions:

```bash
cd functions
npm install
cd ..
```

## 4. Seed Demo Data

Seed Spice Garden:

```bash
npm run seed
```

If seeding fails with `PERMISSION_DENIED`, either:

- deploy the development Firestore rules above, or
- grant the service account in `.env.local` a Firestore-capable role such as Cloud Datastore User/Owner for the development Firebase project.

This creates:

- `restaurants`
- `tables`
- `menuCategories`
- `menuItems`
- `users`
- `restaurantStaff`

The seed script is idempotent and safe to rerun.

## 5. Reset Demo Data

Reset only the Spice Garden demo records and seed them again:

```bash
npm run reset-db
```

This does not delete unrelated restaurants.

## 6. Run the App

```bash
npm run dev
```

Useful local routes:

```text
/r/spice-garden
/r/spice-garden/table/1
/admin/spice-garden
/admin/spice-garden/orders
/admin/spice-garden/kds
/admin/spice-garden/tables
```

In development, admin routes use a demo admin profile automatically when no Firebase Auth user is signed in.

## 7. Indexes

Deploy indexes after Firebase is connected:

```bash
firebase deploy --only firestore:indexes
```

Indexes cover restaurant slug lookup, realtime order queries, menu filtering, table lookup, waiter calls, staff lookup, and admin query patterns.

## 8. Final Local Validation

Run:

```bash
npm run lint
npm run build
```

Checklist:

- App starts locally
- `/r/spice-garden` loads
- `/r/spice-garden/table/1` loads
- Menu categories and items render
- Add-to-cart works
- Pay-at-counter order creates an order
- Admin orders/KDS pages load without permission errors
- No runtime crashes
- No TypeScript or ESLint errors
