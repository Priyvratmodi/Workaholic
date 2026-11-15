export type PastelBackgroundKey =
  | 'sky'
  | 'mint'
  | 'lavender'
  | 'peach'
  | 'rose'
  | 'lemon'
  | 'aqua'
  | 'coral'
  | 'lilac'
  | 'sage';

export interface BoardBackgroundDefinition {
  key: PastelBackgroundKey;
  name: string;
  from: string;
  to: string;
  angle: number;
  cssGradient: string;
  tone: 'light';
  darkScrimColor: string;
  inkTextLight: string;
  inkTextDark: string;
}

export const PASTEL_BACKGROUNDS: Record<PastelBackgroundKey, BoardBackgroundDefinition> = {
  sky: {
    key: 'sky',
    name: 'Sky',
    from: '#BFDBFE',
    to: '#E0F2FE',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #BFDBFE 0%, #E0F2FE 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  mint: {
    key: 'mint',
    name: 'Mint',
    from: '#BBF7D0',
    to: '#D1FAE5',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #BBF7D0 0%, #D1FAE5 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  lavender: {
    key: 'lavender',
    name: 'Lavender',
    from: '#DDD6FE',
    to: '#EDE9FE',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #DDD6FE 0%, #EDE9FE 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  peach: {
    key: 'peach',
    name: 'Peach',
    from: '#FED7AA',
    to: '#FFEDD5',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #FED7AA 0%, #FFEDD5 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  rose: {
    key: 'rose',
    name: 'Rose',
    from: '#FBCFE8',
    to: '#FCE7F3',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #FBCFE8 0%, #FCE7F3 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  lemon: {
    key: 'lemon',
    name: 'Lemon',
    from: '#FEF08A',
    to: '#FEF9C3',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #FEF08A 0%, #FEF9C3 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  aqua: {
    key: 'aqua',
    name: 'Aqua',
    from: '#A5F3FC',
    to: '#CFFAFE',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #A5F3FC 0%, #CFFAFE 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  coral: {
    key: 'coral',
    name: 'Coral',
    from: '#FECACA',
    to: '#FEE2E2',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #FECACA 0%, #FEE2E2 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  lilac: {
    key: 'lilac',
    name: 'Lilac',
    from: '#E9D5FF',
    to: '#FAE8FF',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #E9D5FF 0%, #FAE8FF 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
  sage: {
    key: 'sage',
    name: 'Sage',
    from: '#D9F99D',
    to: '#ECFCCB',
    angle: 135,
    cssGradient: 'linear-gradient(135deg, #D9F99D 0%, #ECFCCB 100%)',
    tone: 'light',
    darkScrimColor: 'rgba(29, 33, 37, 0.65)',
    inkTextLight: '#0F172A',
    inkTextDark: '#FFFFFF',
  },
};

export const DEFAULT_BOARD_BACKGROUND: PastelBackgroundKey = 'sky';
export const TEMPLATE_PROJECT_MANAGEMENT_BACKGROUND: PastelBackgroundKey = 'lavender';

export const PASTEL_BACKGROUND_KEYS = Object.keys(PASTEL_BACKGROUNDS) as PastelBackgroundKey[];

export function isValidPastelKey(val: unknown): val is PastelBackgroundKey {
  return typeof val === 'string' && val in PASTEL_BACKGROUNDS;
}

export function getPastelBackground(key?: string | null): BoardBackgroundDefinition {
  if (key && isValidPastelKey(key)) {
    return PASTEL_BACKGROUNDS[key];
  }
  return PASTEL_BACKGROUNDS[DEFAULT_BOARD_BACKGROUND];
}

// Migration mapper from old keys
export function mapLegacyBackgroundToPastel(oldVal?: string | null): PastelBackgroundKey {
  if (!oldVal) return 'sky';
  if (isValidPastelKey(oldVal)) return oldVal;
  const lower = oldVal.toLowerCase();
  if (lower.includes('blue') || lower === 'gradient-1') return 'sky';
  if (lower.includes('emerald') || lower.includes('teal') || lower === 'gradient-2') return 'mint';
  if (lower.includes('violet') || lower.includes('purple') || lower === 'gradient-3') return 'lavender';
  if (lower.includes('rose') || lower.includes('pink') || lower === 'gradient-4') return 'rose';
  if (lower.includes('amber') || lower.includes('orange') || lower === 'gradient-5') return 'peach';
  if (lower.includes('slate') || lower.includes('obsidian') || lower === 'gradient-6') return 'sky';
  if (lower.includes('lemon') || lower.includes('yellow')) return 'lemon';
  if (lower.includes('aqua') || lower.includes('cyan')) return 'aqua';
  if (lower.includes('coral') || lower.includes('red')) return 'coral';
  if (lower.includes('lilac')) return 'lilac';
  if (lower.includes('sage') || lower.includes('green')) return 'sage';
  return 'sky';
}
