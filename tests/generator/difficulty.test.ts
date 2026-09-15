import { describe, expect, it } from 'vitest';
import { calculateDifficulty } from '../../src/generator/difficulty';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { LEVELS } from '../../src/generator/presets';
import { validatePuzzle } from '../../src/core/validator';
import { tinyPuzzle } from '../core/helpers';

describe('难度评估', () => {
  it('结果稳定：同一谜题两次评估一致', () => {
    const a = calculateDifficulty(tinyPuzzle());
    const b = calculateDifficulty(tinyPuzzle());
    expect(a.score).toBe(b.score);
    expect(a.tier).toBe(b.tier);
  });

  it('简单谜题评级为 easy，经典横刀立马评级为 expert', () => {
    expect(calculateDifficulty(tinyPuzzle()).tier).toBe('easy');
    const classic = calculateDifficulty(CLASSIC_PUZZLE);
    expect(classic.tier).toBe('expert');
    expect(classic.optimalDepth).toBe(116);
    expect(classic.solvable).toBe(true);
  });

  it('评分包含搜索空间信息', () => {
    const result = calculateDifficulty(tinyPuzzle());
    expect(result.stateCount).toBeGreaterThan(0);
    expect(result.branchingFactor).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it('全部内置关卡定义合法', () => {
    for (const level of LEVELS) {
      expect(validatePuzzle(level.puzzle).valid).toBe(true);
    }
  });
});
