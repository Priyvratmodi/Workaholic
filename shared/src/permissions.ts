export type Role = 'owner' | 'member' | 'viewer';

export const PERMISSIONS = {
  owner: ['view', 'edit', 'comment', 'manageMembers', 'deleteBoard'],
  member: ['view', 'edit', 'comment'],
  viewer: ['view'],
} as const;

export type PermissionAction =
  | 'view'
  | 'edit'
  | 'comment'
  | 'manageMembers'
  | 'deleteBoard';

export function hasPermission(role: Role, action: PermissionAction): boolean {
  const allowed = PERMISSIONS[role] as readonly string[] | undefined;
  return allowed ? allowed.includes(action) : false;
}
