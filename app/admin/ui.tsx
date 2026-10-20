import type { BookingStatus, PaymentStatus } from "@/lib/types";

export function Flash({ msg, err }: { msg?: string; err?: string }) {
  if (!msg && !err) return null;
  return (
    <p className={`mb-6 rounded-xl px-4 py-3 text-sm font-semibold ${err ? "bg-[#f7e3dc] text-danger" : "bg-sage-light text-sage-dark"}`} role="status">
      {err || msg}
    </p>
  );
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Čeká na potvrzení",
  awaiting_payment: "Čeká na platbu kartou",
  confirmed: "Potvrzeno",
  declined: "Odmítnuto",
  cancelled: "Zrušeno",
  expired: "Propadlo",
  conflict: "⚠ Kolize",
};

const STATUS_CLS: Record<BookingStatus, string> = {
  pending: "bg-honey-light text-honey-dark",
  awaiting_payment: "bg-honey-light/60 text-honey-dark",
  confirmed: "bg-sage-light text-sage-dark",
  declined: "bg-busy text-muted",
  cancelled: "bg-busy text-muted",
  expired: "bg-busy text-muted",
  conflict: "bg-[#f7e3dc] text-danger",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Nezaplaceno",
  deposit_paid: "Záloha zaplacena",
  paid: "Zaplaceno",
  refunded: "Vráceno",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cls = status === "paid" ? "text-sage-dark" : status === "deposit_paid" ? "text-honey-dark" : "text-muted";
  return <span className={`whitespace-nowrap text-xs font-bold ${cls}`}>{PAYMENT_LABEL[status]}</span>;
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card bg-white p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-xl">{title}</h2>}
      {children}
    </section>
  );
}
