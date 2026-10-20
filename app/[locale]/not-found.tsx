import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x py-24 text-center">
      <p className="font-serif text-7xl text-honey">404</p>
      <h1 className="mt-4 text-3xl">Stránka nenalezena · Page not found</h1>
      <Link href="/" className="btn-primary mt-8">
        ← Úvod / Home
      </Link>
    </section>
  );
}
