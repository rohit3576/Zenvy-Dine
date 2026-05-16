# Restaurant Setup Guide

## 1. Create Restaurant
Create a document in `restaurants`:

- `name`: public restaurant name
- `slug`: URL slug used in `/r/{slug}/table/{tableNumber}`
- `logoUrl`: square logo or brand photo
- `address`, `phone`
- `settings.currency`: `INR`
- `settings.taxPercentage`: GST percentage
- `settings.serviceChargePercentage`: optional service charge
- `settings.themeColor`: primary customer UI color
- `settings.notificationPhone`: WhatsApp notification target
- `paymentSettings.razorpayEnabled`
- `paymentSettings.payAtCounterEnabled`

## 2. Add Categories and Items
Create `menuCategories` with `restaurantId`, `name`, `order`, and `isActive`.

Create `menuItems` with `restaurantId`, `categoryId`, name, description, price, image URL, veg flag, bestseller flag, availability, and add-ons.

## 3. Add Tables and QR Codes
Create `tables` documents with:

- `restaurantId`
- `number`
- `capacity`
- `isActive`
- `qrCodeUrl`: `/r/{slug}/table/{number}`

In Admin > Table Management, download or print QR cards for every table.

## 4. Configure Staff
Each staff user lives in `users` with:

- `restaurantId`
- `role`: `RESTAURANT_OWNER`, `MANAGER`, `CASHIER`, or `KITCHEN_STAFF`

## 5. Demo Data
Run:

```bash
npm run seed:demo
```

Demo customer URL:

```text
/r/spice-garden/table/1
```
