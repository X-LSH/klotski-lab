import { describe, expect, it } from 'vitest';
import { dailySeed, getDailyPuzzle } from '../../src/generator/daily';
import { validatePuzzle } from '../../src/core/validator';

describe('每日挑战', () => {
  it('同一日期种子稳定', () => {
    const date = new Date(2026, 8, 14);
    expect(dailySeed(date)).toBe(dailySeed(new Date(2026, 8, 14)));
    expect(dailySeed(date)).toBe(20260914);
  });

  it('不同日期产生不同种子', () => {
    expect(dailySeed(new Date(2026, 8, 14))).not.toBe(dailySeed(new Date(2026, 8, 15)));
    expect(dailySeed(new Date(2026, 8, 14))).not.toBe(dailySeed(new Date(2026, 9, 14)));
  });

  it('同一日期的每日谜题完全一致', () => {
    const a = getDailyPuzzle(new Date(2026, 8, 14));
    const b = getDailyPuzzle(new Date(2026, 8, 14, 23, 59));
    expect(a.pieces).toEqual(b.pieces);
    expect(a.name).toBe(b.name);
  });

  it('每日谜题合法', () => {
    expect(validatePuzzle(getDailyPuzzle(new Date())).valid).toBe(true);
  });
});
