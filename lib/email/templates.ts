import "server-only";
import { formatDate, formatRange, getMessages, t } from "../i18n";
import { amountDue, isDepositStage } from "../payments";
import { formatCzk } from "../pricing";
import { czAccountFromIban, normalizeIban } from "../spayd";
import type { Booking, Settings } from "../types";
import { siteUrl } from "../config";
import { sign } from "../tokens";

const C = {
  paper: "#fbf8f2",
  cream: "#f4ecdd",
  wood: "#6b4a2e",
  ink: "#2e2822",
  muted: "#6f6355",
  honey: "#c58a3e",
  sage: "#56664d",
  line: "#e3d5bd",
};

export const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function layout(s: Settings, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.cream};font-family:Georgia,'Times New Roman',serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.paper};border-radius:16px;border:1px solid ${C.line}">
<tr><td style="padding:28px 32px 8px;font-size:22px;color:${C.wood}">${esc(s.name)}</td></tr>
<tr><td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink}">${body}</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.muted}">
${esc(s.name)} · ${esc(s.address)}, ${esc(s.municipality)} · ${esc(s.phone)} · ${esc(s.email)}</td></tr>
</table></td></tr></table></body></html>`;
}

export function button(href: string, label: string, color = C.honey): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;margin:4px 8px 4px 0">${esc(label)}</a>`;
}

function rows(items: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;border-bottom:1px solid ${C.line};color:${C.muted}">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid ${C.line};text-align:right;font-weight:bold">${v}</td></tr>`,
    )
    .join("")}</table>`;
}

const ROOM_NAME = (b: Booking) => getMessages(b.locale).rooms[b.roomId].name;

export function viewUrl(b: Booking): string {
  return `${siteUrl()}/${b.locale}/rezervace/hotovo?id=${b.id}&t=${sign("view", b.id)}`;
}

function guestsText(b: Booking): string {
  const m = getMessages(b.locale);
  return `${b.adults} × ${m.booking.adults.toLowerCase()}${b.children ? `, ${b.children} × ${m.booking.children.toLowerCase()}` : ""}${b.extraBed ? `, ${m.booking.extraBedLine.toLowerCase()}` : ""}`;
}

function stayRows(b: Booking) {
  const m = getMessages(b.locale);
  return rows([
    [m.email.ref, esc(b.variableSymbol)],
    [m.email.room, esc(ROOM_NAME(b))],
    [m.email.stay, esc(formatRange(b.from, b.to, b.locale))],
    [m.email.guests, esc(guestsText(b))],
    [m.email.total, esc(formatCzk(b.price.total, b.locale))],
  ]);
}

// ---------- Host ----------

export function guestInquiryReceived(b: Booking, s: Settings) {
  const m = getMessages(b.locale);
  return {
    subject: t(m.email.inquiryReceivedSubject, { room: ROOM_NAME(b), dates: formatRange(b.from, b.to, b.locale) }),
    html: layout(
      s,
      `<p>${esc(t(m.email.hello, { name: b.guest.name }))}</p><p>${esc(t(m.email.inquiryReceivedText, { h: s.holdHours }))}</p>${stayRows(b)}
<p>${button(viewUrl(b), m.email.detailLink)}</p><p style="color:${C.muted}">${esc(m.email.regards)},<br>${esc(s.name)}</p>`,
    ),
  };
}

export function guestConfirmedTransfer(b: Booking, s: Settings) {
  const m = getMessages(b.locale);
  const due = amountDue(b);
  const deposit = isDepositStage(b);
  const qr = `${siteUrl()}/api/qr/${b.id}?t=${sign("view", b.id)}`;
  const acc = czAccountFromIban(s.iban);
  const pay = rows([
    [deposit ? m.email.payDeposit : m.email.payFull, `<span style="font-size:18px;color:${C.wood}">${esc(formatCzk(due, b.locale))}</span>`],
    ...(acc ? ([[getMessages(b.locale).done.payAccount, esc(acc)]] as [string, string][]) : []),
    ["IBAN", esc(normalizeIban(s.iban))],
    [getMessages(b.locale).done.payVs, esc(b.variableSymbol)],
    ...(b.paymentDue ? ([[getMessages(b.locale).done.payDue, esc(formatDate(b.paymentDue, b.locale))]] as [string, string][]) : []),
  ]);
  return {
    subject: m.email.confirmedSubject,
    html: layout(
      s,
      `<p>${esc(t(m.email.hello, { name: b.guest.name }))}</p><p>${esc(m.email.confirmedText)}</p>${pay}
<p style="text-align:center"><img src="${esc(qr)}" width="200" height="200" alt="QR platba" style="border:8px solid #fff;border-radius:8px"></p>
${deposit ? `<p style="color:${C.muted}">${esc(m.email.remaining)}: <b>${esc(formatCzk(b.price.total - b.price.deposit, b.locale))}</b></p>` : ""}
${stayRows(b)}<p>${esc(t(m.email.checkInOut, { in: s.checkIn, out: s.checkOut }))}</p>
<p>${button(viewUrl(b), m.email.detailLink)}</p><p style="color:${C.muted}">${esc(m.email.regards)},<br>${esc(s.name)}</p>`,
    ),
  };
}

export function guestDeclined(b: Booking, s: Settings) {
  const m = getMessages(b.locale);
  return {
    subject: m.email.declinedSubject,
    html: layout(
      s,
      `<p>${esc(t(m.email.hello, { name: b.guest.name }))}</p><p>${esc(m.email.declinedText)}</p>${stayRows(b)}
<p>${button(`${siteUrl()}/${b.locale}/rezervace`, getMessages(b.locale).done.again)}</p><p style="color:${C.muted}">${esc(s.name)}</p>`,
    ),
  };
}

export function guestPaid(b: Booking, s: Settings) {
  const m = getMessages(b.locale);
  return {
    subject: m.email.paidSubject,
    html: layout(
      s,
      `<p>${esc(t(m.email.hello, { name: b.guest.name }))}</p><p>${esc(m.email.paidText)}</p>${stayRows(b)}
<p>${esc(t(m.email.checkInOut, { in: s.checkIn, out: s.checkOut }))}</p><p>${button(viewUrl(b), m.email.detailLink)}</p>
<p style="color:${C.muted}">${esc(m.email.regards)},<br>${esc(s.name)}</p>`,
    ),
  };
}

export function guestCancelled(b: Booking, s: Settings) {
  const m = getMessages(b.locale);
  return {
    subject: m.email.cancelledSubject,
    html: layout(s, `<p>${esc(t(m.email.hello, { name: b.guest.name }))}</p><p>${esc(m.email.cancelledText)}</p>${stayRows(b)}<p style="color:${C.muted}">${esc(s.name)}</p>`),
  };
}

// ---------- Majitel (vždy česky) ----------

function ownerDetail(b: Booking) {
  const p = b.price;
  return rows([
    ["Pokoj", esc(getMessages("cs").rooms[b.roomId].name)],
    ["Termín", esc(`${formatRange(b.from, b.to, "cs")} (${p.nights} n.)`)],
    ["Hosté", esc(`${b.adults} dosp. + ${b.children} dětí${b.extraBed ? " + přistýlka" : ""}`)],
    ["Jméno", esc(b.guest.name)],
    ["E-mail", `<a href="mailto:${esc(b.guest.email)}">${esc(b.guest.email)}</a>`],
    ["Telefon", `<a href="tel:${esc(b.guest.phone)}">${esc(b.guest.phone)}</a>`],
    ["Jazyk", esc(b.locale.toUpperCase())],
    ["Celkem", esc(formatCzk(p.total))],
    ["Záloha", esc(p.deposit < p.total ? formatCzk(p.deposit) : "—")],
    ["VS", esc(b.variableSymbol)],
  ]) + (b.guest.note ? `<p style="background:${C.cream};padding:12px 14px;border-radius:10px"><b>Poznámka:</b><br>${esc(b.guest.note).replace(/\n/g, "<br>")}</p>` : "");
}

export function ownerInquiry(b: Booking, s: Settings) {
  const confirm = `${siteUrl()}/admin/rozhodnuti/${b.id}?a=confirm&t=${sign("decide", b.id)}`;
  const decline = `${siteUrl()}/admin/rozhodnuti/${b.id}?a=decline&t=${sign("decide", b.id)}`;
  const until = b.holdUntil ? new Date(b.holdUntil).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" }) : "";
  return {
    subject: `Nová poptávka: ${getMessages("cs").rooms[b.roomId].name}, ${formatRange(b.from, b.to, "cs")}`,
    html: layout(
      s,
      `<p><b>Přišla nová nezávazná poptávka.</b> Termín je předběžně blokovaný do <b>${esc(until)}</b>.</p>${ownerDetail(b)}
<p>${button(confirm, "✓ Potvrdit", C.sage)}${button(decline, "✕ Odmítnout", "#a4442f")}</p>
<p style="color:${C.muted};font-size:13px">Po potvrzení dostane host e-mail s QR platbou. Rezervaci najdete i v <a href="${siteUrl()}/admin">administraci</a>.</p>`,
    ),
  };
}

export function ownerPaid(b: Booking, s: Settings) {
  return {
    subject: `Zaplaceno kartou: ${getMessages("cs").rooms[b.roomId].name}, ${formatRange(b.from, b.to, "cs")}`,
    html: layout(s, `<p><b>Nová okamžitá rezervace byla zaplacena přes Stripe</b> a je automaticky potvrzená.</p>${ownerDetail(b)}<p>${button(`${siteUrl()}/admin/rezervace/${b.id}`, "Otevřít v administraci")}</p>`),
  };
}

export function ownerConflict(b: Booking, s: Settings) {
  return {
    subject: `⚠ Zaplacená rezervace v kolizi: ${b.variableSymbol}`,
    html: layout(
      s,
      `<p><b>Pozor:</b> host zaplatil kartou až po vypršení rezervace a termín mezitím obsadil někdo jiný. Kontaktujte prosím hosta a případně vraťte platbu ve Stripe.</p>${ownerDetail(b)}<p>${button(`${siteUrl()}/admin/rezervace/${b.id}`, "Otevřít v administraci")}</p>`,
    ),
  };
}

export function ownerContact(s: Settings, d: { name: string; email: string; phone: string; message: string; locale: string }) {
  return {
    subject: `Zpráva z webu od ${d.name}`,
    html: layout(
      s,
      `<p><b>Nová zpráva z kontaktního formuláře</b></p>${rows([
        ["Jméno", esc(d.name)],
        ["E-mail", `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`],
        ["Telefon", esc(d.phone || "—")],
        ["Jazyk", esc(d.locale.toUpperCase())],
      ])}<p style="background:${C.cream};padding:14px 16px;border-radius:10px;white-space:pre-wrap">${esc(d.message)}</p><p style="color:${C.muted};font-size:13px">Stačí odpovědět na tento e-mail.</p>`,
    ),
  };
}
