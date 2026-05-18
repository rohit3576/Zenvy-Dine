import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.startsWith("your_") || keySecret.startsWith("your_")) {
    throw new functions.https.HttpsError("failed-precondition", "Razorpay keys are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function verifySignature(body: string, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function findOrderByRazorpayOrderId(razorpayOrderId: string) {
  const orderQuery = await db.collection("orders")
    .where("razorpayOrderId", "==", razorpayOrderId)
    .limit(1)
    .get();

  return orderQuery.empty ? null : orderQuery.docs[0];
}

// 1. Create Razorpay Order
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    // For customers, we might not have auth, but for now let's assume some validation
    // In a real app, you might want to validate the amount and items against your DB
  }

  const { amount, currency = "INR", receipt, restaurantId } = data;

  try {
    if (!amount || amount <= 0 || !receipt || !restaurantId) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid payment order payload");
    }

    const restaurant = await db.collection("restaurants").doc(restaurantId).get();
    if (!restaurant.exists) {
      throw new functions.https.HttpsError("not-found", "Restaurant not found");
    }

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency,
      receipt,
    };

    const order = await getRazorpay().orders.create(options);
    
    // Log the payment intent in Firestore
    await db.collection("payments").add({
      razorpayOrderId: order.id,
      restaurantId,
      amount,
      status: "PENDING",
      receipt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, order };
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    throw new functions.https.HttpsError("internal", "Failed to create payment order");
  }
});

// 2. Verify Payment (Manual verification from client)
export const verifyRazorpayPayment = functions.https.onCall(async (data) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = data;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret || keySecret.startsWith("your_")) {
    throw new functions.https.HttpsError("failed-precondition", "Razorpay secret is not configured");
  }

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new functions.https.HttpsError("invalid-argument", "Missing payment verification fields");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  if (verifySignature(body, razorpay_signature, keySecret)) {
    // Payment verified
    await db.collection("orders").doc(orderId).update({
      paymentStatus: "PAID",
      paymentId: razorpay_payment_id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const paymentQuery = await db.collection("payments")
      .where("razorpayOrderId", "==", razorpay_order_id)
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      await paymentQuery.docs[0].ref.update({
        status: "PAID",
        paymentId: razorpay_payment_id,
        orderId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } else {
    await db.collection("orders").doc(orderId).update({
      paymentStatus: "FAILED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => undefined);
    throw new functions.https.HttpsError("invalid-argument", "Payment verification failed");
  }
});

// 3. Razorpay Webhook (Automated verification)
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const signature = req.headers["x-razorpay-signature"] as string;

  if (!secret) {
    res.status(500).send("webhook secret not configured");
    return;
  }

  const rawBody = JSON.stringify(req.body);

  if (verifySignature(rawBody, signature, secret)) {
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const razorpayOrderId = payload.payment.entity.order_id;

      const orderDoc = await findOrderByRazorpayOrderId(razorpayOrderId);
      if (orderDoc) {
        await orderDoc.ref.update({
          paymentStatus: "PAID",
          paymentId: payload.payment.entity.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    if (event === "payment.failed") {
      const razorpayOrderId = payload.payment.entity.order_id;
      const orderDoc = await findOrderByRazorpayOrderId(razorpayOrderId);
      if (orderDoc) {
        await orderDoc.ref.update({
          paymentStatus: "FAILED",
          paymentFailureReason: payload.payment.entity.error_description || payload.payment.entity.error_reason || "Payment failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await db.collection("auditLogs").add({
      source: "razorpayWebhook",
      event,
      razorpayEventId: req.body.id || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send("ok");
  } else {
    res.status(400).send("invalid signature");
  }
});

// 4. User Creation Trigger
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Keep Auth creation separate from authorization. Admin onboarding or staff
  // invitation flows assign role, restaurantId, and permissions explicitly.
  await db.collection("users").doc(uid).set({
    uid,
    email,
    displayName,
    photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
});
