# Firestore Index Documentation

The app uses tenant-scoped realtime queries. Keep indexes in `firestore.indexes.json` synchronized with these query shapes.

## Required Query Shapes
- `menuCategories`: `restaurantId ==`, `isActive ==`, `order asc`
- `menuItems`: `restaurantId ==`, `isAvailable ==`
- `orders`: `restaurantId ==`, `createdAt desc`
- `orders`: `restaurantId ==`, `status in`, `createdAt asc`
- `waiterCalls`: `restaurantId ==`, `status in`, `createdAt desc`

## Deploy

```bash
firebase deploy --only firestore:indexes
```

## When to Add an Index
Add an index whenever a Firestore query combines equality filters, `in` filters, and `orderBy`. Test in the Firebase emulator or staging before production.
