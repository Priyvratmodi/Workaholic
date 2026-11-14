export interface BackgroundOption {
  id: string;
  name: string;
  className: string;
  previewClass: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'gradient-1',
    name: 'Ocean Depth',
    className: 'bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 text-white',
    previewClass: 'bg-gradient-to-br from-blue-600 to-indigo-900',
  },
  {
    id: 'gradient-2',
    name: 'Emerald Flow',
    className: 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 text-white',
    previewClass: 'bg-gradient-to-br from-emerald-600 to-teal-900',
  },
  {
    id: 'gradient-3',
    name: 'Cosmic Violet',
    className: 'bg-gradient-to-br from-purple-700 via-indigo-900 to-slate-950 text-white',
    previewClass: 'bg-gradient-to-br from-purple-600 to-indigo-950',
  },
  {
    id: 'gradient-4',
    name: 'Sunset Rose',
    className: 'bg-gradient-to-br from-rose-700 via-pink-900 to-slate-950 text-white',
    previewClass: 'bg-gradient-to-br from-rose-600 to-pink-900',
  },
  {
    id: 'gradient-5',
    name: 'Golden Amber',
    className: 'bg-gradient-to-br from-amber-700 via-orange-900 to-slate-950 text-white',
    previewClass: 'bg-gradient-to-br from-amber-600 to-orange-950',
  },
  {
    id: 'gradient-6',
    name: 'Obsidian Minimal',
    className: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white',
    previewClass: 'bg-gradient-to-br from-slate-700 to-slate-950',
  },
];

export function getBackgroundClass(id?: string | null): string {
  const match = BACKGROUND_OPTIONS.find((b) => b.id === id);
  return match ? match.className : BACKGROUND_OPTIONS[0].className;
}

export function getBackgroundPreviewClass(id?: string | null): string {
  const match = BACKGROUND_OPTIONS.find((b) => b.id === id);
  return match ? match.previewClass : BACKGROUND_OPTIONS[0].previewClass;
}
