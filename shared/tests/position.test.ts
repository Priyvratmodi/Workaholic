import { describe, it, expect } from 'vitest';
import {
  getPositionBetween,
  generateInitialPositions,
  needsRebalance,
} from '../src/position.js';

describe('Fractional Indexing Unit Tests', () => {
  it('generates an initial key when both bounds are null', () => {
    const key = getPositionBetween(null, null);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('inserts before an existing key', () => {
    const first = getPositionBetween(null, null);
    const beforeFirst = getPositionBetween(null, first);
    expect(beforeFirst < first).toBe(true);
  });

  it('inserts after an existing key', () => {
    const first = getPositionBetween(null, null);
    const afterFirst = getPositionBetween(first, null);
    expect(first < afterFirst).toBe(true);
  });

  it('inserts between two existing keys', () => {
    const first = getPositionBetween(null, null);
    const third = getPositionBetween(first, null);
    const second = getPositionBetween(first, third);

    expect(first < second).toBe(true);
    expect(second < third).toBe(true);
  });

  it('generates initial positions in strictly ascending order', () => {
    const count = 10;
    const positions = generateInitialPositions(count);
    expect(positions).toHaveLength(count);

    for (let i = 0; i < count - 1; i++) {
      expect(positions[i] < positions[i + 1]).toBe(true);
    }
  });

  it('handles 20 repeated inserts between the same two items without collision', () => {
    let lower = getPositionBetween(null, null);
    const upper = getPositionBetween(lower, null);

    const inserted: string[] = [];
    for (let i = 0; i < 20; i++) {
      const mid = getPositionBetween(lower, upper);
      expect(lower < mid).toBe(true);
      expect(mid < upper).toBe(true);
      inserted.push(mid);
      lower = mid; // insert immediately next to it
    }

    // Verify all are strictly ordered
    for (let i = 0; i < inserted.length - 1; i++) {
      expect(inserted[i] < inserted[i + 1]).toBe(true);
    }
  });

  it('detects when rebalancing is needed', () => {
    const normalKeys = ['a0', 'a1', 'a2'];
    expect(needsRebalance(normalKeys)).toBe(false);

    const longKey = 'a'.repeat(50);
    expect(needsRebalance([...normalKeys, longKey])).toBe(true);
  });
});
