import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | undefined;

function getApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    // JSON servisního účtu – buď přímo, nebo zakódovaný v base64
    const json = sa.trim().startsWith("{") ? sa : Buffer.from(sa, "base64").toString("utf8");
    app = initializeApp({ credential: cert(JSON.parse(json)) });
  } else {
    // Na Firebase App Hosting se přihlašovací údaje doplní automaticky
    app = initializeApp();
  }
  return app;
}

let db: Firestore | undefined;
export function firestore(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}

export function adminAuth(): Auth {
  return getAuth(getApp());
}
