# Architecture Overview

## Data Flow & Rendering Strategy

### 1. Incremental Static Regeneration (ISR)
For the customer-facing menu pages (`/r/[slug]`), we use ISR. This ensures:
- **Performance:** Menus load instantly from the edge cache.
- **Scalability:** Minimal database reads as most users hit the cache.
- **SEO:** Menus are crawlable by search engines.

### 2. Client-Side Real-time Listeners
For highly dynamic data like orders and KDS, we use Firestore `onSnapshot` on the client. This provides:
- **Low Latency:** Instant updates for kitchen staff and customers.
- **Simplicity:** No need for complex WebSocket management or polling.

## Multi-Tenancy (Tenant Isolation)

- **Database Level:** Every document (except global settings) includes a `restaurantId`.
- **Security Rules:** Firestore rules strictly enforce that users can only read/write data associated with their `restaurantId`.
- **Routing:** Dynamic routes like `/r/[slug]` and `/admin/[slug]` use the slug to identify the tenant.

## RBAC (Role-Based Access Control)

Roles defined: `SUPER_ADMIN`, `RESTAURANT_OWNER`, `MANAGER`, `KITCHEN_STAFF`, `CASHIER`.
- Permissions are enforced both in the UI (conditional rendering) and at the database level (Firestore Rules).

## State Management

- **Zustand:** Used for ephemeral UI state (e.g., active cart, modal states, sidebar toggles).
- **React Hook Form + Zod:** Used for all data entry points to ensure strict validation.

## Security

- **Authentication:** Firebase Auth handles user identity.
- **Authorization:** Firestore Security Rules act as the primary defense against unauthorized data access.
- **Server-Side Operations:** Critical operations like payment verification and order finalization are handled by Firebase Cloud Functions using the Admin SDK.
