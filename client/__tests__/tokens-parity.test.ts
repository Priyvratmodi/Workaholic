import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('tokens.css parity and semantics', () => {
  const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');
  const css = fs.readFileSync(tokensPath, 'utf8');

  function extractVariables(selectorRegex: RegExp): string[] {
    const match = css.match(selectorRegex);
    if (!match) return [];
    return match[1].match(/--[a-zA-Z0-9_-]+(?=:)/g) || [];
  }

  const darkVars = extractVariables(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/);
  const lightVars = extractVariables(/:root\[data-theme="light"\]\s*\{([^}]+)\}/);

  it('both dark and light themes define a non-empty list of variables', () => {
    expect(darkVars.length).toBeGreaterThan(30);
    expect(lightVars.length).toBeGreaterThan(30);
  });

  it('all variables in dark theme also exist in light theme', () => {
    const missingInLight = darkVars.filter((v) => !lightVars.includes(v));
    expect(missingInLight).toEqual([]);
  });

  it('all variables in light theme also exist in dark theme', () => {
    const missingInDark = lightVars.filter((v) => !darkVars.includes(v));
    expect(missingInDark).toEqual([]);
  });

  it('required semantic core tokens exist in both blocks', () => {
    const requiredSemantic = [
      '--color-bg-page',
      '--color-surface-sidebar',
      '--color-surface-panel',
      '--color-surface-list',
      '--color-surface-card',
      '--color-surface-card-hover',
      '--color-border',
      '--color-text-primary',
      '--color-text-body',
      '--color-text-muted',
      '--color-text-on-primary',
      '--color-accent',
      '--color-accent-subtle',
      '--color-danger',
      '--color-warning',
      '--color-success',
    ];

    for (const v of requiredSemantic) {
      expect(darkVars).toContain(v);
      expect(lightVars).toContain(v);
    }
  });
});
