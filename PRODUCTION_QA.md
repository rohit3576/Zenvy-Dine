# Production QA Checklist

Use this checklist before every client demo or production release.

## Customer Ordering Flow
- Open `/r/spice-garden/table/1` on mobile and desktop.
- Search, filter categories, add 2-3 items, change quantities, and clear an item.
- Place a pay-at-counter order and confirm it appears in Admin > Live Orders.
- Verify GST, service charge, subtotal, and total match the restaurant settings.

## Realtime Kitchen Updates
- Open Admin > Live Orders and Admin > Kitchen (KDS) in separate windows.
- Confirm a pending order, move it to preparing, then ready.
- Verify KDS updates without refresh and only shows `CONFIRMED` and `PREPARING`.

## Razorpay Payment Flow
- Confirm `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
- Place an online order from the customer menu.
- Verify a Razorpay checkout opens, payment success calls `verifyRazorpayPayment`, and the order becomes `PAID`.
- Verify failed or dismissed checkout leaves the order `PENDING`.

## Tenant Isolation and RBAC
- Sign in as a staff user for restaurant A and confirm only restaurant A orders/tables load.
- Attempt direct Firestore reads for another restaurant from the client console; they should fail.
- Verify owners/managers can manage menu and tables; kitchen staff should only handle order flow.

## Firestore Security Rules
- Deploy rules to a staging Firebase project first.
- Run manual create order tests with valid and invalid payloads.
- Verify unauthenticated users can create waiter calls and orders but cannot read admin collections.

## Mobile Responsiveness
- Test iPhone SE, iPhone 15, Pixel, iPad, and desktop widths.
- Confirm sticky menu header, category tabs, cart sheet, and admin sidebar do not overlap.

## PWA and Offline
- Build and serve production locally.
- Install the app from Chrome.
- Reload while offline and confirm the shell loads; realtime Firestore actions should show network failure gracefully.

## Performance
- Run `npm run build`.
- Run Lighthouse against production preview.
- Check menu images are served through `next/image` and remote image domains are configured.

## Deployment
- Run `npm run validate:env`.
- Deploy Firestore rules and indexes.
- Deploy Firebase functions.
- Deploy Vercel production and smoke-test `/`, `/r/spice-garden/table/1`, and `/admin/spice-garden`.
