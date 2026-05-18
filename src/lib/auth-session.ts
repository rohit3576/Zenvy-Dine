import type { User as FirebaseUser } from "firebase/auth";

export const sessionCookieName = "__session";
const sessionMaxAge = 60 * 60 * 24 * 7;

function secureCookieAttribute() {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export async function persistFirebaseSession(user: FirebaseUser) {
  const token = await user.getIdToken();
  document.cookie = `${sessionCookieName}=${token}; Path=/; Max-Age=${sessionMaxAge}; SameSite=Lax${secureCookieAttribute()}`;
}

export function clearFirebaseSession() {
  document.cookie = `${sessionCookieName}=; Path=/; Max-Age=0; SameSite=Lax${secureCookieAttribute()}`;
}

