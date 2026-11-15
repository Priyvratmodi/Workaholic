import React, { useState } from 'react';

export interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 24 | 28 | 32 | 40 | number;
  className?: string;
  title?: string;
  role?: string;
}

// Stable 10-pastel palette classes for avatars (matching pastel board colors)
const AVATAR_PASTEL_CLASSES = [
  'bg-pastel-sky',
  'bg-pastel-mint',
  'bg-pastel-lavender',
  'bg-pastel-peach',
  'bg-pastel-rose',
  'bg-pastel-lemon',
  'bg-pastel-aqua',
  'bg-pastel-coral',
  'bg-pastel-lilac',
  'bg-pastel-sage',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarClass(name: string): string {
  const index = hashName(name || 'User') % AVATAR_PASTEL_CLASSES.length;
  return AVATAR_PASTEL_CLASSES[index];
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 28,
  className = '',
  title,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getInitials(name);
  const pastelClass = getAvatarClass(name);

  const dimensionPx = typeof size === 'number' ? size : 28;
  const fontSizePx = Math.max(10, Math.floor(dimensionPx * 0.4));

  const sizeStyle: React.CSSProperties = {
    width: `${dimensionPx}px`,
    height: `${dimensionPx}px`,
    aspectRatio: '1 / 1',
    borderRadius: '9999px',
    flexShrink: 0,
    fontSize: `${fontSizePx}px`,
    lineHeight: 1,
    overflow: 'hidden',
  };

  const showImage = avatarUrl && !imageFailed;

  return (
    <div
      data-avatar="true"
      title={title || name}
      style={sizeStyle}
      className={`inline-flex items-center justify-center font-bold select-none ring-2 ring-surface text-text-primary ${pastelClass} ${className}`.trim()}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9999px' }}
        />
      ) : (
        <span style={{ lineHeight: 1, letterSpacing: '-0.02em' }}>{initials}</span>
      )}
    </div>
  );
};

export interface AvatarStackProps {
  users: Array<{ id?: string; name: string; avatarUrl?: string | null }>;
  max?: number;
  size?: 24 | 28 | 32 | 40;
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  max = 4,
  size = 28,
  className = '',
}) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  const dimensionPx = size;
  const fontSizePx = Math.max(10, Math.floor(dimensionPx * 0.38));

  return (
    <div className={`flex items-center -space-x-1.5 ${className}`.trim()}>
      {visible.map((u, i) => (
        <Avatar key={u.id || `${u.name}-${i}`} name={u.name} avatarUrl={u.avatarUrl} size={size} />
      ))}
      {remaining > 0 && (
        <div
          title={`${remaining} more`}
          style={{
            width: `${dimensionPx}px`,
            height: `${dimensionPx}px`,
            aspectRatio: '1 / 1',
            borderRadius: '9999px',
            fontSize: `${fontSizePx}px`,
            lineHeight: 1,
          }}
          className="inline-flex items-center justify-center font-bold bg-surface-container-high text-text-primary ring-2 ring-surface shrink-0 select-none"
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
