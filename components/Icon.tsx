const paths: Record<string, React.ReactNode> = {
  garden: (
    <>
      <path d="M12 22V12" />
      <path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7Z" />
      <path d="M12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5Z" />
      <path d="M4 22h16" />
    </>
  ),
  parking: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </>
  ),
  bike: (
    <>
      <circle cx="5.5" cy="17" r="3.5" />
      <circle cx="18.5" cy="17" r="3.5" />
      <path d="M5.5 17 9 9h6l3.5 8M9 9 12 17h-6.5M14 6h2" />
      <path d="m12.5 4-1.5 3h2l-1.5 3" />
    </>
  ),
  stroller: (
    <>
      <path d="M4 5h2l2 9h10a4 4 0 0 0-4-4h-1V5a6 6 0 0 1 5 5" />
      <circle cx="9" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </>
  ),
  fridge: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 10h14M8 6v1.5M8 13v3" />
    </>
  ),
  kitchen: (
    <>
      <path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-2Z" />
      <path d="M9 7c0-1 1-1.5 1-2.5M13 7c0-1 1-1.5 1-2.5" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3H10v5M3 15h18" />
      <circle cx="6.5" cy="11.5" r="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  tree: (
    <>
      <path d="M12 2 6 10h3l-4 6h14l-4-6h3L12 2Z" />
      <path d="M12 16v6" />
    </>
  ),
  deer: (
    <>
      <path d="M8 3v3l-2 2M8 6l2 1M16 3v3l2 2M16 6l-2 1" />
      <path d="M9 9h6l-1 5h-4L9 9Z" />
      <path d="M10 14v7M14 14v7" />
    </>
  ),
  swing: (
    <>
      <path d="M3 21 7 3h10l4 18M7 3l2 12M17 3l-2 12M8.5 15h7" />
    </>
  ),
  city: (
    <>
      <path d="M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13" />
      <path d="M13 10h3M13 14h3M13 18h3" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v.01M17 20h4M20 17v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="11" cy="6" r="1.8" />
      <circle cx="15" cy="7" r="1.8" />
      <circle cx="18" cy="11" r="1.8" />
      <path d="M8 17c0-3 2-5 4-5s4.5 2 4.5 4.5c0 2-1.5 3-3 3-1 0-1.5-.5-2.5-.5S9.5 20 9 19.5C8.3 19 8 18 8 17Z" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10M10 20v-5h4v5" />
    </>
  ),
};

export default function Icon({ name, className = "h-5 w-5", strokeWidth = 1.6 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? paths.check}
    </svg>
  );
}
