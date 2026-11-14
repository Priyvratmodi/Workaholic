import { describe, it, expect } from 'vitest';
import { hasPermission, PERMISSIONS, Role, PermissionAction } from '../src/permissions.js';

describe('Permissions Matrix Unit Tests', () => {
  it('Owner should have all permissions', () => {
    const ownerActions: PermissionAction[] = [
      'view',
      'edit',
      'comment',
      'manageMembers',
      'deleteBoard',
    ];
    for (const action of ownerActions) {
      expect(hasPermission('owner', action)).toBe(true);
    }
  });

  it('Member should have view, edit, comment, but NOT manageMembers or deleteBoard', () => {
    expect(hasPermission('member', 'view')).toBe(true);
    expect(hasPermission('member', 'edit')).toBe(true);
    expect(hasPermission('member', 'comment')).toBe(true);

    expect(hasPermission('member', 'manageMembers')).toBe(false);
    expect(hasPermission('member', 'deleteBoard')).toBe(false);
  });

  it('Viewer should ONLY have view permission', () => {
    expect(hasPermission('viewer', 'view')).toBe(true);

    expect(hasPermission('viewer', 'edit')).toBe(false);
    expect(hasPermission('viewer', 'comment')).toBe(false);
    expect(hasPermission('viewer', 'manageMembers')).toBe(false);
    expect(hasPermission('viewer', 'deleteBoard')).toBe(false);
  });

  it('Unknown role or invalid role should have NO permissions', () => {
    expect(hasPermission('guest' as Role, 'view')).toBe(false);
  });
});
