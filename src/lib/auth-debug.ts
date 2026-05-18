export function isAuthDebugEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";
}

export function maskValue(value: string | undefined) {
  if (!value) return "missing";
  if (value.length <= 8) return `${value[0] ?? ""}***`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  return null;
}

export function getFirebaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function authDebug(label: string, details?: Record<string, unknown>) {
  if (!isAuthDebugEnabled()) return;
  console.info(`[auth] ${label}`, details ?? {});
}

