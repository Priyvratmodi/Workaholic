import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx') || (fullPath.endsWith('.ts') && !fullPath.endsWith('.d.ts'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Theme Compliance: No Tailwind Raw Palette Classes in Components', () => {
  const componentsDir = path.resolve(__dirname, '../src/components');
  const componentFiles = getFilesRecursively(componentsDir);

  // Checks for raw slate, gray, zinc, neutral, stone classes that bypass our theme tokens
  const rawPalettePattern = /\b(bg|text|border)-(slate|zinc|stone|neutral|gray)-(50|100|200|300|400|500|600|700|800|900|950)\b/g;

  componentFiles.forEach((filePath) => {
    const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);

    it(`ensures ${relativePath} does not use hardcoded Tailwind palette classes`, () => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const violations: Array<{ line: number; text: string; matches: string[] }> = [];

      lines.forEach((line, index) => {
        const matches = line.match(rawPalettePattern);
        if (matches) {
          violations.push({
            line: index + 1,
            text: line.trim(),
            matches,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map((v) => `Line ${v.line}: "${v.text}" matches ${v.matches.join(', ')}`)
          .join('\n');
        expect.fail(`Found hard-coded palette class in ${relativePath}:\n${message}`);
      }

      expect(violations).toHaveLength(0);
    });
  });
});
