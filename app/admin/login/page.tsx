import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { adminEmails, devShortcuts } from "@/lib/config";
import LoginButtons from "./LoginButtons";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card bg-white p-8 text-center">
        <h1 className="text-3xl">Správa chalupy</h1>
        <p className="mt-2 text-muted">Přihlaste se Google účtem, který má přístup do administrace.</p>
        <LoginButtons dev={devShortcuts()} />
        {!devShortcuts() && adminEmails().length === 0 && (
          <p className="mt-6 rounded-xl bg-honey-light/60 p-3 text-xs text-honey-dark">Pozor: proměnná ADMIN_EMAILS není nastavená, nikdo se nepřihlásí.</p>
        )}
      </div>
    </div>
  );
}
