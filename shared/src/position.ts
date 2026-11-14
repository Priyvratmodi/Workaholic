import { generateKeyBetween } from 'fractional-indexing';

/**
 * Calculates a new position string between two adjacent keys.
 * If prev is null, it generates a key before next.
 * If next is null, it generates a key after prev.
 * If both are null, it generates a default initial key.
 */
export function getPositionBetween(
  prev: string | null | undefined,
  next: string | null | undefined
): string {
  return generateKeyBetween(prev ?? null, next ?? null);
}

/**
 * Generate an array of evenly spaced fractional index keys for n items.
 */
export function generateInitialPositions(count: number): string[] {
  const positions: string[] = [];
  let lastKey: string | null = null;
  for (let i = 0; i < count; i++) {
    const key = generateKeyBetween(lastKey, null);
    positions.push(key);
    lastKey = key;
  }
  return positions;
}

/**
 * Checks whether keys need rebalancing (e.g. if key length exceeds a threshold like 48 characters)
 */
export function needsRebalance(positions: string[]): boolean {
  return positions.some((pos) => pos.length > 48);
}
