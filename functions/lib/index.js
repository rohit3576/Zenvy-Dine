"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.razorpayWebhook = exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
admin.initializeApp();
const db = admin.firestore();
function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.startsWith("your_") || keySecret.startsWith("your_")) {
        throw new functions.https.HttpsError("failed-precondition", "Razorpay keys are not configured");
    }
    return new razorpay_1.default({
        key_id: keyId,
        key_secret: keySecret,
    });
}
// 1. Create Razorpay Order
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        // For customers, we might not have auth, but for now let's assume some validation
        // In a real app, you might want to validate the amount and items against your DB
    }
    const { amount, currency = "INR", receipt, restaurantId } = data;
    try {
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, order };
    }
    catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        throw new functions.https.HttpsError("internal", "Failed to create payment order");
    }
});
// 2. Verify Payment (Manual verification from client)
exports.verifyRazorpayPayment = functions.https.onCall(async (data) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = data;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.startsWith("your_")) {
        throw new functions.https.HttpsError("failed-precondition", "Razorpay secret is not configured");
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body.toString())
        .digest("hex");
    if (expectedSignature === razorpay_signature) {
        // Payment verified
        await db.collection("orders").doc(orderId).update({
            paymentStatus: "PAID",
            paymentId: razorpay_payment_id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    else {
        throw new functions.https.HttpsError("invalid-argument", "Payment verification failed");
    }
});
// 3. Razorpay Webhook (Automated verification)
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-razorpay-signature"];
    if (!secret) {
        res.status(500).send("webhook secret not configured");
        return;
    }
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
    if (expectedSignature === signature) {
        const event = req.body.event;
        const payload = req.body.payload;
        if (event === "payment.captured") {
            const razorpayOrderId = payload.payment.entity.order_id;
            // Find the order with this razorpayOrderId
            const orderQuery = await db.collection("orders")
                .where("razorpayOrderId", "==", razorpayOrderId)
                .limit(1)
                .get();
            if (!orderQuery.empty) {
                const orderDoc = orderQuery.docs[0];
                await orderDoc.ref.update({
                    paymentStatus: "PAID",
                    paymentId: payload.payment.entity.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
        res.status(200).send("ok");
    }
    else {
        res.status(400).send("invalid signature");
    }
});
// 4. User Creation Trigger
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    // Default role is RESTAURANT_OWNER for the first user of a restaurant
    // In a real SaaS, this would be more complex (e.g., invitation based)
    await db.collection("users").doc(uid).set({
        email,
        displayName,
        photoURL,
        role: "RESTAURANT_OWNER", // Default role
        restaurantId: null, // To be linked later
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=index.js.map