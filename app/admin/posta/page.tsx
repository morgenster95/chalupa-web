import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { devShortcuts } from "@/lib/config";
import { Card } from "../ui";

// Vývojová pošta: v lokálním režimu bez Resendu se sem ukládají odeslané e-maily.
export default async function Outbox({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  await requireAdmin();
  if (!devShortcuts()) notFound();
  const { listOutbox } = await import("@/lib/db/local");
  const mails = await listOutbox();
  const { i } = await searchParams;
  const open = mails.find((m) => m.id === i) ?? mails[0];
  return (
    <div>
      <h1 className="text-3xl">Vývojová pošta</h1>
      <p className="mt-1 text-sm text-muted">E-maily, které by se odeslaly, kdyby byl nastaven Resend. Po nastavení klíče se odesílají skutečně.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit !p-2">
          {mails.length === 0 && <p className="p-3 text-sm text-muted">Zatím žádné e-maily.</p>}
          <ul>
            {mails.map((m) => (
              <li key={m.id}>
                <a href={`/admin/posta?i=${m.id}`} className={`block rounded-xl p-3 text-sm ${open?.id === m.id ? "bg-cream" : "hover:bg-cream/50"}`}>
                  <span className="block font-semibold">{m.subject}</span>
                  <span className="block text-xs text-muted">
                    {m.to} · {new Date(m.at).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
        {open && (
          <Card className="!p-0 overflow-hidden">
            <p className="border-b border-line px-5 py-3 text-sm">
              <b>Komu:</b> {open.to} · <b>Předmět:</b> {open.subject}
            </p>
            <iframe srcDoc={open.html} className="h-[75vh] w-full bg-white" title="Náhled e-mailu" />
          </Card>
        )}
      </div>
    </div>
  );
}
