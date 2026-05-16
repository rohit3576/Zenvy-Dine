# Zenvy Dine - Multi-Tenant Restaurant QR Ordering SaaS

Zenvy Dine is a production-grade SaaS platform for restaurants to manage digital menus, QR-based ordering, and real-time kitchen operations.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management:** Zustand, React Hook Form
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Payments:** Razorpay
- **Deployment:** Vercel (Frontend), Firebase (Functions)

## Key Features

- **Multi-Tenancy:** Single platform supporting multiple restaurants with tenant isolation.
- **QR Ordering:** Unique QR codes for each table; no login required for customers.
- **Admin Dashboard:** Manage menus, tables, staff, and analytics.
- **Real-time KDS:** Kitchen Display System for live order tracking.
- **ISR Menus:** Blazing fast menu loading using Incremental Static Regeneration.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install --legacy-peer-deps`.
3. Set up Firebase project and obtain configuration.
4. Create `.env.local` based on `.env.example`.
5. Run development server: `npm run dev`.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/features`: Feature-based modular logic.
- `src/components`: Reusable UI and layout components.
- `src/lib`: Core utility and configuration (Firebase, Utils).
- `src/hooks`: Custom React hooks.
- `src/services`: Data fetching and external service integrations.
- `src/store`: Global state management (Zustand).
- `src/types`: TypeScript definitions.
