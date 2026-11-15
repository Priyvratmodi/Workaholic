import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Theme Store & Resolution (Single Light Mode Default)', () => {
  let localStorageMock: Record<string, string> = {};
  let documentAttributes: Record<string, string> = {};
  let documentClasses = new Set<string>();
  let documentStyle: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    documentAttributes = {};
    documentClasses = new Set();
    documentStyle = {};

    (global as any).localStorage = {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        localStorageMock[key] = val;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
    };

    (global as any).document = {
      documentElement: {
        setAttribute: (attr: string, val: string) => {
          documentAttributes[attr] = val;
        },
        getAttribute: (attr: string) => documentAttributes[attr],
        classList: {
          add: (cls: string) => documentClasses.add(cls),
          remove: (cls: string) => documentClasses.delete(cls),
          contains: (cls: string) => documentClasses.has(cls),
        },
        style: documentStyle,
      },
    };

    (global as any).window = {
      matchMedia: vi.fn().mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }),
    };
  });

  it('enforces light theme as single project default', async () => {
    vi.resetModules();
    const { useThemeStore } = await import('../src/stores/themeStore.js');

    expect(useThemeStore.getState().preference).toBe('light');
    expect(useThemeStore.getState().resolved).toBe('light');
    expect(documentAttributes['data-theme']).toBe('light');
    expect(documentClasses.has('light')).toBe(true);
    expect(documentClasses.has('dark')).toBe(false);

    // Attempting to set any preference still retains light mode
    useThemeStore.getState().setPreference('dark' as any);
    expect(useThemeStore.getState().preference).toBe('light');
    expect(useThemeStore.getState().resolved).toBe('light');
    expect(documentAttributes['data-theme']).toBe('light');
  });

  it('toggles reduce motion class and localStorage', async () => {
    vi.resetModules();
    const { useThemeStore } = await import('../src/stores/themeStore.js');

    useThemeStore.getState().setReduceMotion(true);
    expect(useThemeStore.getState().reduceMotion).toBe(true);
    expect(documentClasses.has('reduce-motion')).toBe(true);
    expect(localStorageMock['workaholic-reduce-motion']).toBe('true');

    useThemeStore.getState().setReduceMotion(false);
    expect(useThemeStore.getState().reduceMotion).toBe(false);
    expect(documentClasses.has('reduce-motion')).toBe(false);
    expect(localStorageMock['workaholic-reduce-motion']).toBe('false');
  });

  it('syncs reduceMotion and stays in light mode regardless of user preference', async () => {
    vi.resetModules();
    const { useThemeStore } = await import('../src/stores/themeStore.js');

    useThemeStore.getState().syncWithUser('DARK', true);
    expect(useThemeStore.getState().preference).toBe('light');
    expect(useThemeStore.getState().resolved).toBe('light');
    expect(useThemeStore.getState().reduceMotion).toBe(true);
    expect(documentAttributes['data-theme']).toBe('light');
    expect(documentClasses.has('reduce-motion')).toBe(true);
  });
});
