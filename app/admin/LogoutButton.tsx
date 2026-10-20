"use client";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/session", { method: "DELETE" });
        window.location.href = "/admin/login";
      }}
      className="rounded-full border border-line px-3 py-1 font-semibold text-wood hover:bg-cream"
    >
      Odhlásit
    </button>
  );
}
