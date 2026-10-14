/** Icon paths from the reference design (stroke icons, 24x24). */
const PATHS = {
  home: '<path d="M3 10.3 12 3l9 7.3"/><path d="M5.5 9.2V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.2"/>',
  doc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  bag: '<path d="M4.5 8h15l-1.1 11.3a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7z"/><path d="M8.7 8V6.2a3.3 3.3 0 0 1 6.6 0V8"/>',
  shop: '<path d="M3.5 9.3 5 4.5h14l1.5 4.8"/><path d="M3.5 9.3a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0"/><path d="M5.5 12v7.5h13V12"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.4a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.84 2.83l-.06-.06a1.7 1.7 0 0 0-2.88 1.22V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.98-1.22l-.06.06A2 2 0 1 1 4.13 16.9l.06-.06A1.7 1.7 0 0 0 3 14h-.1a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.19-2.98l-.06-.06A2 2 0 1 1 7.1 4.13l.06.06A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.88 1.19l.06-.06a2 2 0 1 1 2.83 2.84l-.06.06A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  money: '<rect x="2.5" y="6" width="19" height="12" rx="3"/><circle cx="12" cy="12" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.3V12l3.2 2"/>',
  up: '<path d="M12 19V6"/><path d="m6 12 6-6 6 6"/>',
  dn: '<path d="M12 5v13"/><path d="m18 12-6 6-6-6"/>',
  srch: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  chk: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  warn: '<path d="M12 3.6 21.5 20h-19z"/><path d="M12 10v4.2"/><path d="M12 17.3h.01"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  qr: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M13.5 13.5h3v3h-3zM20.5 13.5v3M17 20.5h3.5v-3"/>',
  bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.1-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  lock: '<rect x="3.5" y="10.5" width="17" height="10.5" rx="2.5"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m2.5 7.5 9.5 6 9.5-6"/>',
  phone: '<rect x="6.5" y="2" width="11" height="20" rx="3"/><path d="M11 18.5h2"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  pause: '<rect x="7.5" y="5" width="3.2" height="14" rx="1"/><rect x="13.3" y="5" width="3.2" height="14" rx="1"/>',
  play: '<path d="M7.5 4.8v14.4L19 12z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  bank: '<path d="M3 10.5 12 4l9 6.5"/><path d="M5 10.5V19M9.5 10.5V19M14.5 10.5V19M19 10.5V19"/><path d="M3 21h18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  dish: '<path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 4v1.4"/>',
  gift: '<rect x="3" y="8.5" width="18" height="12.5" rx="2"/><path d="M2 8.5h20v4H2z"/><path d="M12 8.5V21"/><path d="M12 8.5S10.5 3 8 3a2.5 2.5 0 0 0 0 5.5zM12 8.5S13.5 3 16 3a2.5 2.5 0 0 1 0 5.5z"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
