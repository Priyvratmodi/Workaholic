export const COVER_COLORS = [
  { name: 'Indigo Blue', color: '#4241BC' },
  { name: 'Sky Blue', color: '#2563EB' },
  { name: 'Teal Green', color: '#0D9488' },
  { name: 'Emerald', color: '#16A34A' },
  { name: 'Amber Orange', color: '#D97706' },
  { name: 'Rose Red', color: '#E11D48' },
  { name: 'Purple', color: '#9333EA' },
  { name: 'Slate Obsidian', color: '#475569' },
];

export const LABEL_PRESET_COLORS = COVER_COLORS;

export function getLabelTextColor(hexColor?: string | null): string {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? '#0F172A' : '#FFFFFF';
}

export interface ListColorOption {
  id: string;
  name: string;
  color: string | null;
  bgClass: string;
  headerClass: string;
  borderClass: string;
  accentBarClass: string;
  dotColor: string;
}

export const LIST_COLOR_PRESETS: ListColorOption[] = [
  {
    id: 'default',
    name: 'Default',
    color: null,
    bgClass: 'bg-column',
    headerClass: '',
    borderClass: 'border-border',
    accentBarClass: 'hidden',
    dotColor: '#94a3b8',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    color: 'sky',
    bgClass: 'bg-sky-50/70',
    headerClass: 'border-b border-sky-200/60 pb-1 mb-1',
    borderClass: 'border-sky-300/80',
    accentBarClass: 'bg-sky-500',
    dotColor: '#0284c7',
  },
  {
    id: 'emerald',
    name: 'Mint Emerald',
    color: 'emerald',
    bgClass: 'bg-emerald-50/70',
    headerClass: 'border-b border-emerald-200/60 pb-1 mb-1',
    borderClass: 'border-emerald-300/80',
    accentBarClass: 'bg-emerald-500',
    dotColor: '#059669',
  },
  {
    id: 'purple',
    name: 'Lavender Purple',
    color: 'purple',
    bgClass: 'bg-purple-50/70',
    headerClass: 'border-b border-purple-200/60 pb-1 mb-1',
    borderClass: 'border-purple-300/80',
    accentBarClass: 'bg-purple-500',
    dotColor: '#7c3aed',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    color: 'amber',
    bgClass: 'bg-amber-50/70',
    headerClass: 'border-b border-amber-200/60 pb-1 mb-1',
    borderClass: 'border-amber-300/80',
    accentBarClass: 'bg-amber-500',
    dotColor: '#d97706',
  },
  {
    id: 'rose',
    name: 'Soft Rose',
    color: 'rose',
    bgClass: 'bg-rose-50/70',
    headerClass: 'border-b border-rose-200/60 pb-1 mb-1',
    borderClass: 'border-rose-300/80',
    accentBarClass: 'bg-rose-500',
    dotColor: '#e11d48',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    color: 'indigo',
    bgClass: 'bg-indigo-50/70',
    headerClass: 'border-b border-indigo-200/60 pb-1 mb-1',
    borderClass: 'border-indigo-300/80',
    accentBarClass: 'bg-indigo-500',
    dotColor: '#4f46e5',
  },
  {
    id: 'teal',
    name: 'Teal Green',
    color: 'teal',
    bgClass: 'bg-teal-50/70',
    headerClass: 'border-b border-teal-200/60 pb-1 mb-1',
    borderClass: 'border-teal-300/80',
    accentBarClass: 'bg-teal-500',
    dotColor: '#0d9488',
  },
];

export function getListColorPreset(colorKey?: string | null): ListColorOption {
  if (!colorKey) return LIST_COLOR_PRESETS[0];
  const found = LIST_COLOR_PRESETS.find((p) => p.color === colorKey || p.id === colorKey);
  return found || LIST_COLOR_PRESETS[0];
}
