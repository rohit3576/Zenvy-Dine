type FirestoreDebugMeta = Record<string, unknown>;

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

export function getFirestoreErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: unknown }).code);
  }

  return error instanceof Error ? error.name : "unknown";
}

export function getFirestoreErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return String(error);
}

export function getFirestoreIndexUrl(error: unknown) {
  const message = getFirestoreErrorMessage(error);
  return message.match(/https:\/\/console\.firebase\.google\.com\/[^\s)]+/)?.[0] ?? null;
}

function isMissingIndexError(error: unknown) {
  const code = getFirestoreErrorCode(error).toLowerCase();
  const message = getFirestoreErrorMessage(error).toLowerCase();

  return (
    code.includes("failed-precondition") ||
    message.includes("requires an index") ||
    Boolean(getFirestoreIndexUrl(error))
  );
}

export function formatFirestoreError(error: unknown) {
  const code = getFirestoreErrorCode(error);
  const message = getFirestoreErrorMessage(error);

  if (isMissingIndexError(error)) {
    return "Firestore index is missing or still building. Please try again shortly.";
  }

  if (code.includes("permission-denied") || message.toLowerCase().includes("permission")) {
    return "You do not have permission to access this data.";
  }

  if (code.includes("unauthenticated")) {
    return "Please sign in again.";
  }

  if (code.includes("unavailable")) {
    return "Realtime connection is unavailable. Check your connection and retry.";
  }

  return "Firestore request failed. Check the console for details.";
}

export function logFirestoreOperation(operation: string, meta: FirestoreDebugMeta = {}) {
  if (!isDevelopment()) return;
  console.log(`[firestore:${operation}]`, meta);
}

export function logFirestoreError(operation: string, error: unknown, meta: FirestoreDebugMeta = {}) {
  const details = {
    ...meta,
    code: getFirestoreErrorCode(error),
    message: getFirestoreErrorMessage(error),
    missingIndexUrl: getFirestoreIndexUrl(error),
  };

  console.error(`[firestore:${operation}:error]`, details);

  return details;
}
