import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminEmails, devShortcuts, firestoreEnabled } from "./config";
import { sign, verify } from "./tokens";

// Firebase Hosting / App Hosting předává do aplikace jen cookie s názvem "__session".
export const SESSION_COOKIE = "__session";
export const SESSION_DAYS = 7;

export interface Admin {
  email: string;
}

export async function getAdmin(): Promise<Admin | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  if (value.startsWith("dev.")) {
    if (!devShortcuts()) return null;
    return verify("dev-admin", "dev", value.slice(4)) ? { email: "dev@localhost" } : null;
  }
  if (!firestoreEnabled()) return null;
  try {
    const { adminAuth } = await import("./firebase-admin");
    const decoded = await adminAuth().verifySessionCookie(value, true);
    const email = (decoded.email || "").toLowerCase();
    return adminEmails().includes(email) ? { email } : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

export function devSessionValue() {
  return "dev." + sign("dev-admin", "dev");
}
