import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Known material icon names used in Workaholic and Stitch designs
const KNOWN_ICON_NAMES = [
  'add',
  'alarm',
  'alternate_email',
  'archive',
  'arrow_back',
  'arrow_downward',
  'arrow_forward',
  'attach_file',
  'auto_awesome',
  'auto_stories',
  'calendar_month',
  'calendar_today',
  'calendar_view_week',
  'campaign',
  'chat_bubble',
  'chat_bubble_outline',
  'check',
  'check_box',
  'check_circle',
  'checklist',
  'close',
  'cloud_upload',
  'code',
  'commit',
  'content_copy',
  'conversion_path',
  'dashboard',
  'dashboard_customize',
  'delete',
  'description',
  'drag_indicator',
  'drive_file_move',
  'edit',
  'error',
  'event_repeat',
  'expand_more',
  'filter_list',
  'format_bold',
  'format_italic',
  'format_list_bulleted',
  'format_list_numbered',
  'forum',
  'grid_view',
  'groups',
  'help_outline',
  'history',
  'hub',
  'image',
  'info',
  'insights',
  'ios_share',
  'keyboard_arrow_down',
  'label',
  'link',
  'lock',
  'logout',
  'mail',
  'mode_comment',
  'more_horiz',
  'more_vert',
  'notifications',
  'notifications_active',
  'palette',
  'person',
  'person_add',
  'person_remove',
  'priority_high',
  'radio_button_unchecked',
  'rocket_launch',
  'schedule',
  'search',
  'security',
  'send',
  'sentiment_satisfied',
  'settings',
  'share',
  'sort',
  'south',
  'space_dashboard',
  'star',
  'star_border',
  'subject',
  'swap_horiz',
  'task_alt',
  'terminal',
  'tune',
  'unfold_more',
  'verified',
  'view_kanban',
  'view_timeline',
  'visibility',
  'visibility_off',
  'warning',
  'web',
];

function getTsxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Icon Regression Prevention Tests', () => {
  const clientSrc = path.resolve(__dirname, '../src');
  const tsxFiles = getTsxFiles(clientSrc);

  it('scans all tsx components and ensures no raw material-symbols class exists outside Icon.tsx', () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of tsxFiles) {
      if (file.endsWith(path.join('ui', 'Icon.tsx'))) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (
          line.includes('material-symbols') ||
          line.includes('material-icons')
        ) {
          violations.push({
            file: path.relative(clientSrc, file),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found raw material-symbols outside <Icon />:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });

  it('ensures no known icon ligature name is rendered as raw text child inside HTML tags outside Icon.tsx', () => {
    const violations: { file: string; line: number; icon: string; match: string }[] = [];

    // Icon ligatures are strictly lowercase in Material Symbols (e.g. >add<, >space_dashboard<, >auto_stories<).
    // Text labels in buttons (e.g. <span>Share</span>, <span>Checklist</span>) are capitalized words.
    for (const file of tsxFiles) {
      if (file.endsWith(path.join('ui', 'Icon.tsx'))) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Exclude lines with <Icon ... />
        if (line.includes('<Icon')) return;

        for (const iconName of KNOWN_ICON_NAMES) {
          // Exactly matches >icon_name< or >{icon_name}< inside JSX (case-sensitive)
          const tagPattern = new RegExp(`>\\s*['"]?${iconName}['"]?\\s*<`);
          if (tagPattern.test(line)) {
            // Filter out common prose words like "in", "to", etc., but catch all snake_case or icon identifiers
            const rawChildPattern = new RegExp(`<(span|i|div|em|strong|p|b)[^>]*>\\s*['"]?${iconName}['"]?\\s*</\\1>`);
            if (rawChildPattern.test(line) || line.includes(`>${iconName}<`) || line.includes(`>'${iconName}'<`)) {
              violations.push({
                file: path.relative(clientSrc, file),
                line: index + 1,
                icon: iconName,
                match: line.trim(),
              });
            }
          }
        }
      });
    }

    expect(
      violations,
      `Found raw icon ligature names rendered as plain text children outside <Icon>:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });

  it('ensures lucide-react is not imported in client components', () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('from \'lucide-react\'') || line.includes('from "lucide-react"')) {
          violations.push({
            file: path.relative(clientSrc, file),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found forbidden lucide-react imports:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });
});
