import { describe, expect, it } from 'vitest';
import { generatePuzzle, MAX_GENERATE_STEPS } from '../../src/generator/generator';
import { createRng, randomWalk } from '../../src/generator/shuffle';
import { validatePuzzle } from '../../src/core/validator';
import { createInitialState } from '../../src/core/state';
import { isSolved } from '../../src/core/rules';
import { solveBfs } from '../../src/solver/bfs';
import { applySolution } from '../solver/helpers';
import { CLASSIC_PUZZLE } from '../../src/core/presets';

describe('谜题生成器', () => {
  it('相同种子生成相同谜题', () => {
    const a = generatePuzzle({ seed: 12345, steps: 40 });
    const b = generatePuzzle({ seed: 12345, steps: 40 });
    expect(a).toEqual(b);
  });

  it('不同种子通常产生不同谜题', () => {
    const a = generatePuzzle({ seed: 1, steps: 40 });
    const b = generatePuzzle({ seed: 2, steps: 40 });
    expect(a.pieces).not.toEqual(b.pieces);
  });

  it('生成结果合法（通过 validatePuzzle）', () => {
    for (const seed of [1, 42, 999, 20260914]) {
      const puzzle = generatePuzzle({ seed, steps: 50 });
      const result = validatePuzzle(puzzle);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it('生成结果可被求解器解出（较小步数保证测试可执行）', () => {
    for (const seed of [7, 123, 2026]) {
      const puzzle = generatePuzzle({ seed, steps: 20 });
      const initial = createInitialState(puzzle);
      const result = solveBfs(
        { puzzle, initialState: initial },
        { maxStates: 300_000, timeoutMs: 30_000 },
      );
      expect(result.solved).toBe(true);
      expect(isSolved(applySolution(puzzle, initial, result.moves), puzzle)).toBe(true);
    }
  }, 120_000);

  it('打乱步数被限制在上限内', () => {
    // 不直接暴露 steps，通过结果一致性验证：超过上限的输入与上限等价
    const a = generatePuzzle({ seed: 5, steps: MAX_GENERATE_STEPS });
    const b = generatePuzzle({ seed: 5, steps: 99999 });
    expect(a.pieces).toEqual(b.pieces);
  });

  it('种子 RNG 确定性：同一序列', () => {
    const rngA = createRng(42);
    const rngB = createRng(42);
    const seqA = Array.from({ length: 10 }, () => rngA());
    const seqB = Array.from({ length: 10 }, () => rngB());
    expect(seqA).toEqual(seqB);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it('随机游走只产生合法状态（每步都是合法移动）', () => {
    const rng = createRng(7);
    const state = randomWalk(CLASSIC_PUZZLE, createInitialState(CLASSIC_PUZZLE), 30, rng);
    // 游走后的状态代入谜题仍应通过重叠 / 越界校验
    const puzzle = { ...CLASSIC_PUZZLE, pieces: state.pieces };
    expect(validatePuzzle(puzzle).valid).toBe(true);
  });
});
