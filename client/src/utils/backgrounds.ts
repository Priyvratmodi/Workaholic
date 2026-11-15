import React from 'react';
import {
  PASTEL_BACKGROUNDS,
  PASTEL_BACKGROUND_KEYS,
  PastelBackgroundKey,
  getPastelBackground,
  mapLegacyBackgroundToPastel,
  BoardBackgroundDefinition,
} from '@workaholic/shared';

export interface BackgroundOption {
  id: PastelBackgroundKey;
  name: string;
  className: string;
  previewClass: string;
  from: string;
  to: string;
  cssGradient: string;
  tone: 'light';
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = PASTEL_BACKGROUND_KEYS.map((key) => {
  const bg = PASTEL_BACKGROUNDS[key];
  return {
    id: key,
    name: bg.name,
    className: `bg-pastel-${key}`,
    previewClass: `bg-pastel-${key}`,
    from: bg.from,
    to: bg.to,
    cssGradient: bg.cssGradient,
    tone: bg.tone,
  };
});

export function getBackgroundClass(id?: string | null): string {
  const key = mapLegacyBackgroundToPastel(id);
  return `bg-pastel-${key}`;
}

export function getBackgroundPreviewClass(id?: string | null): string {
  const key = mapLegacyBackgroundToPastel(id);
  return `bg-pastel-${key}`;
}

export function getBackgroundGradientStyle(id?: string | null): React.CSSProperties {
  const key = mapLegacyBackgroundToPastel(id);
  const def = getPastelBackground(key);
  return {
    background: def.cssGradient,
  };
}

export {
  PASTEL_BACKGROUNDS,
  PASTEL_BACKGROUND_KEYS,
  getPastelBackground,
  mapLegacyBackgroundToPastel,
};
export type { PastelBackgroundKey, BoardBackgroundDefinition };
