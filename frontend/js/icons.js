/* ===== EMAII :: Ícones SVG (substitui lucide-react) ===== */
const ICONS = {
  ShieldCheck: '<path d="M12 3l7 3v6c0 4.6-3 8.4-7 9-4-.6-7-4.4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  UserCog: '<circle cx="9" cy="7" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5"/><circle cx="18" cy="16.5" r="2.3"/><path d="M18 12.7v1.2M18 18.6v1.2M14.4 16.5h1.2M20.4 16.5h1.2M15.3 13.8l.85.85M19.85 18.35l.85.85M15.3 19.2l.85-.85M19.85 14.65l.85-.85"/>',
  BookUser: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v14"/><circle cx="11.5" cy="9" r="1.7"/><path d="M8.7 14.2c0-1.7 1.3-2.6 2.8-2.6s2.8.9 2.8 2.6"/>',
  GraduationCap: '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11.5V17c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5"/><path d="M22 9v6"/>',
  Users: '<circle cx="8.5" cy="8" r="3.2"/><path d="M2.3 20c0-3.4 2.8-5.8 6.2-5.8s6.2 2.4 6.2 5.8"/><path d="M15.5 5a3.2 3.2 0 0 1 0 6.4"/><path d="M16 14.3c2.6.4 4.5 2.5 4.5 5.4"/>',
  Sparkles: '<path d="M11 2l1.2 4.3L16.5 8l-4.3 1.7L11 14l-1.2-4.3L5.5 8l4.3-1.7L11 2z"/><path d="M18.5 13.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/>',
  LogIn: '<path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M15 16l4-4-4-4"/><path d="M19 12H8"/>',
  LayoutDashboard: '<rect x="3" y="3" width="8" height="8" rx="1.3"/><rect x="13" y="3" width="8" height="5" rx="1.3"/><rect x="13" y="11" width="8" height="10" rx="1.3"/><rect x="3" y="14" width="8" height="7" rx="1.3"/>',
  Bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  AlertTriangle: '<path d="M12 3.5l10 17.5H2z"/><path d="M12 10v4"/><path d="M12 17.3h.01"/>',
  ClipboardList: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5"/>',
  CalendarCheck2: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v3M16 3v3"/><path d="M8.5 14l2 2 4-4.2"/>',
  TrendingDown: '<path d="M3 6l7 7 4-4 7 7"/><path d="M15 15.5H21V9.5"/>',
  Edit2: '<path d="M4 20l.9-4.2L16.4 5.3a1.7 1.7 0 0 1 2.4 0l1 1a1.7 1.7 0 0 1 0 2.4L8.3 19.1 4 20z"/><path d="M14.5 7.3l2.2 2.2"/>',
  Plus: '<path d="M12 5v14M5 12h14"/>',
  Search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
  Menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  X: '<path d="M5 5l14 14M19 5L5 19"/>',
  ChevronRight: '<path d="M9 5l7 7-7 7"/>',
  LogOut: '<path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M9 8l-4 4 4 4"/><path d="M5 12h12"/>',
  Settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M17.6 6.4l-1.6 1.6M8 16l-1.6 1.6M17.6 17.6L16 16M8 8 6.4 6.4"/>',
  Send: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4 18-7z"/>',
  BookOpen: '<path d="M2 5.5C2 4.7 3.6 4 6 4s4 .7 4 1.5V19c0-.8-1.6-1.5-4-1.5S2 18.2 2 19z"/><path d="M22 5.5C22 4.7 20.4 4 18 4s-4 .7-4 1.5V19c0-.8 1.6-1.5 4-1.5s4 .7 4 1.5z"/>',
}

function icon(name, extraAttrs) {
  const body = ICONS[name] || ''
  const attrs = extraAttrs || ''
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${attrs}>${body}</svg>`
}
