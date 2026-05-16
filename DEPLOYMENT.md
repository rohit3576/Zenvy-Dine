# Zenvy Dine - Deployment & Production Guide

This guide covers the steps required to deploy Zenvy Dine to a production environment using Vercel (Frontend) and Firebase (Backend).

## 1. Firebase Project Setup

### 1.1 Create Project
- Go to [Firebase Console](https://console.firebase.google.com/).
- Create a new project named "Zenvy Dine".
- Enable **Firestore Database**, **Authentication**, **Storage**, and **Functions**.

### 1.2 Authentication
- Enable **Email/Password** and **Google** providers in the Auth tab.

### 1.3 Service Account
- Go to Project Settings > Service Accounts.
- Generate a new private key. This is your `FIREBASE_PRIVATE_KEY` for the Admin SDK.

## 2. Environment Variables

Create a `.env.production` or set these in your Vercel Dashboard:

### Client Side (Public)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API Key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: your-project.firebaseapp.com
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: your-project-id
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: your-project.appspot.com
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: sender-id
- `NEXT_PUBLIC_FIREBASE_APP_ID`: app-id
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Live Key ID

### Server Side (Private)
- `FIREBASE_PROJECT_ID`: your-project-id
- `FIREBASE_CLIENT_EMAIL`: your-firebase-service-account-email
- `FIREBASE_PRIVATE_KEY`: Your full private key (including \n)
- `RAZORPAY_KEY_ID`: Your Razorpay Live Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Secret
- `RAZORPAY_WEBHOOK_SECRET`: Secret used for webhook verification

Validate locally before deploy:

```bash
npm run validate:env
```

## 3. Deploying Firebase Backend

### 3.1 Security Rules & Indexes
```bash
# Install Firebase CLI if not already
npm install -g firebase-tools

# Login and initialize
firebase login
firebase use --add

# Deploy Rules and Indexes
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 3.2 Cloud Functions
```bash
cd functions
npm install
npm run deploy
```

## 4. Deploying Next.js Frontend (Vercel)

- Push your code to GitHub.
- Connect your repository to [Vercel](https://vercel.com).
- Vercel will automatically detect Next.js.
- Add all environment variables from Section 2.
- **Build Settings:** Default settings are correct.
- Confirm CI passes `npm run lint` and `npm run build` before promoting production.

## 5. Post-Deployment Steps

### 5.1 Initialize Demo Data
Use the provided `scripts/seed-demo-data.ts` to create your first restaurant.
```bash
npm run seed:demo
```

### 5.2 Razorpay Webhook Configuration
- Go to Razorpay Dashboard > Settings > Webhooks.
- Add your Cloud Function URL: `https://<region>-<project-id>.cloudfunctions.net/razorpayWebhook`.
- Select events: `payment.captured`.
- Use the same `RAZORPAY_WEBHOOK_SECRET` as in your environment variables.

## 6. Optimization Checklist
- [ ] Enable Firestore "Production Mode" for performance.
- [ ] Configure custom domain in Vercel.
- [ ] Set up a favicon and real PWA icons in `public/icons/`.
- [ ] Run Lighthouse against the Vercel production URL.
- [ ] Verify demo ordering at `/r/spice-garden/table/1`.
- [ ] Verify Admin > Table Management prints QR cards.
- [ ] Verify Admin > Live Orders receipt and WhatsApp actions.
