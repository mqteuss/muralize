export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'mh.umateus@gmail.com').trim().toLowerCase();

export function isAdminEmail(email?: string | null) {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL);
}

export const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mês' },
] as const;

export type FilterType = (typeof FILTERS)[number]['id'];
