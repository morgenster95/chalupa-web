"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";

declare global {
  interface Window {
    turnstile?: { reset: (el?: string) => void };
  }
}

export default function ContactForm({ locale, m, turnstileKey }: { locale: string; m: Messages; turnstileKey?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_DEMO === "1") return setError("Náhled webu – zprávy se zatím neodesílají.");
    const fd = new FormData(e.currentTarget);
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          website: fd.get("website"),
          turnstile: fd.get("cf-turnstile-response"),
          startedAt: startedAt.current,
          locale,
        }),
      });
      const j = await res.json();
      if (j.ok) return setState("sent");
      setError((m.errors as Record<string, string>)[j.error] ?? m.errors.server);
      window.turnstile?.reset();
    } catch {
      setError(m.errors.server);
    }
    setState("idle");
  }

  if (state === "sent") {
    return <p className="card bg-sage-light/60 p-6 text-lg text-sage-dark">{m.contact.sent}</p>;
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      {turnstileKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">{m.contact.name}</label>
          <input id="c-name" name="name" className="input" required minLength={2} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">{m.contact.email}</label>
          <input id="c-email" name="email" type="email" className="input" required autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-phone">{m.contact.phone}</label>
        <input id="c-phone" name="phone" type="tel" className="input" autoComplete="tel" />
      </div>
      <div>
        <label className="label" htmlFor="c-msg">{m.contact.message}</label>
        <textarea id="c-msg" name="message" rows={6} className="input resize-y" required minLength={5} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
      {turnstileKey && <div className="cf-turnstile" data-sitekey={turnstileKey} data-language={locale} data-theme="light" />}
      {error && (
        <p className="rounded-xl bg-[#f7e3dc] p-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button className="btn-primary" disabled={state === "sending"}>
        {state === "sending" ? m.contact.sending : m.contact.send}
      </button>
    </form>
  );
}
