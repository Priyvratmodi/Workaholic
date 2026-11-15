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

describe('Theme Compliance: No Hard-Coded Hex Colors in Components', () => {
  const componentsDir = path.resolve(__dirname, '../src/components');
  const componentFiles = getFilesRecursively(componentsDir);

  it('scans all UI components in client/src/components', () => {
    expect(componentFiles.length).toBeGreaterThan(10);
  });

  const hexColorPattern = /#[0-9a-fA-F]{3,8}\b/g;

  componentFiles.forEach((filePath) => {
    const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);

    it(`ensures ${relativePath} does not use hard-coded hex colors`, () => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const violations: Array<{ line: number; text: string; hex: string[] }> = [];

      lines.forEach((line, index) => {
        const matches = line.match(hexColorPattern);
        if (matches) {
          violations.push({
            line: index + 1,
            text: line.trim(),
            hex: matches,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map((v) => `Line ${v.line}: "${v.text}" matches ${v.hex.join(', ')}`)
          .join('\n');
        expect.fail(`Found hard-coded hex color in ${relativePath}:\n${message}`);
      }

      expect(violations).toHaveLength(0);
    });
  });
});
