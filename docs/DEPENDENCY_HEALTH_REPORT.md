# Zenvy Dine Dependency Health Report

Generated: 2026-05-16

## Summary

The dependency pass prioritized production stability over aggressive major upgrades.

- Root app audit: 0 vulnerabilities
- Firebase Functions audit: 0 vulnerabilities
- Deprecated `uuid` warning: resolved with an npm override to `uuid@11.1.0`
- Deprecated standalone `crypto` package in Functions: removed; Node's built-in `crypto` module is used instead
- Root production build: passing
- Root ESLint: passing
- Firebase Functions TypeScript build: passing
- Firebase Functions lint command: passing via the root ESLint 9 setup

## Changes Applied

| Area | Change | Reason |
|---|---|---|
| Root app | Updated `react` and `react-dom` from `19.2.4` to `19.2.6` | Safe React 19 patch update |
| Root app | Updated `react-hook-form` from `7.75.0` to `7.76.0` | Safe minor update within current major |
| Root app | Added `overrides.uuid = 11.1.0` | Removes deprecated `uuid@10 and below` warning from Firebase Admin transitive packages |
| Functions | Removed `crypto` dependency | `crypto` is built into Node.js and the npm package is obsolete |
| Functions | Updated `firebase-admin` to `^13.10.0` | Aligns Functions with root Firebase Admin SDK |
| Functions | Updated `firebase-functions` to `^6.6.0` | Latest stable v6 line without jumping to v7 major |
| Functions | Updated `razorpay` to `^2.9.6` | Aligns Functions with root Razorpay SDK |
| Functions | Added `overrides.uuid = 11.1.0` | Removes deprecated `uuid` warning in Functions dependency tree |
| Functions | Removed stale Functions-local ESLint 8 stack | Avoids deprecated dev tooling; root ESLint 9 now lints `functions/src` |
| Functions | Explicitly imported `firebase-functions/v1` | Source uses v1 callable/auth-trigger APIs; avoids v2 type mismatch |
| Functions | Added `esModuleInterop`, `skipLibCheck`, and `types: ["node"]` | Keeps Functions build scoped to Node/Firebase types |

## Deprecated Packages

| Package | Status | Source | Recommendation |
|---|---|---|---|
| `uuid@8/9` | Resolved | Transitive via `firebase-admin` / Google Cloud packages | Forced to `uuid@11.1.0` using npm overrides |
| `crypto` npm package | Resolved | Direct Functions dependency | Removed; use Node built-in `crypto` |
| `node-domexception@1.0.0` | Remaining transitive warning | Transitive via `firebase-admin -> google-auth-library -> gaxios -> node-fetch -> fetch-blob` | Leave unchanged until upstream Google/Firebase packages replace it; not a security vulnerability |

## Outdated Packages

### Root App

| Package | Current | Wanted | Latest | Action |
|---|---:|---:|---:|---|
| `@types/node` | 20.19.41 | 20.19.41 | 25.8.0 | Keep Node 20 types for Firebase/Vercel compatibility |
| `eslint` | 9.39.4 | 9.39.4 | 10.4.0 | Hold; ESLint 10 is a major upgrade |
| `typescript` | 5.9.3 | 5.9.3 | 6.0.3 | Hold; TypeScript 6 is a major upgrade |

### Firebase Functions

| Package | Current/Wanted | Latest | Action |
|---|---:|---:|---|
| `firebase-admin` | 13.10.0 | 13.10.0 | Current |
| `razorpay` | 2.9.6 | 2.9.6 | Current |
| `firebase-functions` | 6.6.0 | 7.2.5 | Hold; v7 is a major migration and should be tested separately |

## Security Vulnerabilities

| Project | `npm audit` result |
|---|---|
| Root app | 0 vulnerabilities |
| Firebase Functions | 0 vulnerabilities |

## Compatibility Notes

- Next.js: Project is currently pinned to `next@16.2.6`; no dependency changes were made that block a future Next.js 15 compatibility branch, but the active app remains Next 16.
- React: Verified on React `19.2.6`.
- TypeScript: Kept on TypeScript 5.x for stability.
- Firebase SDK: Root and Functions use Firebase Admin `13.10.0`; client SDK remains on the existing Firebase 12 line.
- Razorpay SDK: Root and Functions aligned on `2.9.6`.

## Recommended Future Upgrades

1. Evaluate `firebase-functions@7` in a separate branch; v7 is a major upgrade and should include emulator/payment webhook regression tests.
2. Evaluate TypeScript 6 only after Next.js, Firebase Functions, and ESLint plugins explicitly support it in this project.
3. Evaluate ESLint 10 separately because it may require config updates.
4. Remove `node-domexception` only when upstream Firebase/Google packages stop depending on `node-fetch`/`fetch-blob`.
5. Add automated dependency reporting to CI with `npm audit --audit-level=moderate` for both root and Functions.

## Verification Commands

```bash
npm audit
npm outdated
npm run lint
npm run build

cd functions
npm audit
npm outdated
npm run lint
npm run build
```
