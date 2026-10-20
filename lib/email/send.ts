import "server-only";
import { firestoreEnabled, isProd, resendEnabled } from "../config";
import { newId } from "../tokens";

export interface Mail {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export function mailFrom(name: string): string {
  return process.env.EMAIL_FROM || `${name} <onboarding@resend.dev>`;
}

/**
 * Odešle e-mail přes Resend. Bez API klíče se e-mail v lokálním režimu
 * uloží do „vývojové pošty“ (/admin/posta) a vypíše do konzole.
 */
export async function sendMail(mail: Mail, fromName: string): Promise<boolean> {
  if (!resendEnabled()) {
    console.log(`\n📧 [e-mail – Resend není nastaven] Komu: ${mail.to} | ${mail.subject}`);
    if (!firestoreEnabled()) {
      const { saveOutbox } = await import("../db/local");
      await saveOutbox({ id: newId(), at: new Date().toISOString(), to: mail.to, subject: mail.subject, html: mail.html });
    } else if (isProd) {
      console.warn("RESEND_API_KEY chybí – e-maily se v produkci neodesílají!");
    }
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mailFrom(fromName),
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend chyba", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Resend výjimka", e);
    return false;
  }
}
