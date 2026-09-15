/**
 * 生成质量守卫：随机谜题与每日挑战的初始状态绝不能已经处于目标状态。
 *
 * 背景：旧版随机游走从「已解模板」出发，实测 97% 的种子打乱 60 步后
 * 目标棋子仍覆盖出口 —— 打开即弹胜利结算，且重置也无法脱离。
 * 这里防止该缺陷回归。
 */
import { describe, it, expect } from 'vitest';
import { generatePuzzle, generatePuzzleAtDepth, solvedTemplate } from '../../src/generator/generator';
import { getDailyPuzzle, DAILY_DEPTH } from '../../src/generator/daily';
import { createInitialState } from '../../src/core/state';
import { isSolved } from '../../src/core/rules';
import { solveBfs } from '../../src/solver/bfs';
import { validatePuzzle } from '../../src/core/validator';

describe('生成质量：初始状态绝不能已解', () => {
  it('随机谜题：连续 60 个种子的初始状态都未解', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const puzzle = generatePuzzle({ seed, steps: 60 });
      const state = createInitialState(puzzle);
      expect(isSolved(state, puzzle), `种子 ${seed} 的初始状态已解`).toBe(false);
    }
  });

  it('每日挑战：抽样 24 天（每月 2 天）的初始状态都未解', () => {
    // 生成一次需遍历整个状态空间（约 0.7s），全量 365 天会让测试过长；
    // 「未解」由算法性质保证（depth ≥ 1 层的键都不可能是源），这里抽样防回归。
    for (let month = 0; month < 12; month++) {
      for (const day of [3, 21]) {
        const puzzle = getDailyPuzzle(new Date(2026, month, day));
        expect(
          isSolved(createInitialState(puzzle), puzzle),
          `2026-${month + 1}-${day} 的每日挑战初始已解`,
        ).toBe(false);
      }
    }
  });

  it('每日挑战：最优解深度精确等于 DAILY_DEPTH', () => {
    for (const day of [1, 15]) {
      const puzzle = getDailyPuzzle(new Date(2026, 8, day));
      const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
      expect(result.solved).toBe(true);
      expect(result.depth).toBe(DAILY_DEPTH);
    }
  });

  it('深度生成：同一种子结果一致，且最优解深度等于设定值', () => {
    const a = generatePuzzleAtDepth({ seed: 42, depth: 20 });
    const b = generatePuzzleAtDepth({ seed: 42, depth: 20 });
    expect(a.pieces).toEqual(b.pieces);

    const result = solveBfs({ puzzle: a, initialState: createInitialState(a) });
    expect(result.solved).toBe(true);
    expect(result.depth).toBe(20);
  });

  it('深度生成结果通过校验器', () => {
    const puzzle = generatePuzzleAtDepth({ seed: 7, depth: DAILY_DEPTH });
    expect(validatePuzzle(puzzle).valid).toBe(true);
  });

  it('已解模板本身是已解的（逆向 BFS 的起点约定）', () => {
    const template = solvedTemplate();
    expect(isSolved(createInitialState(template), template)).toBe(true);
  });
});
