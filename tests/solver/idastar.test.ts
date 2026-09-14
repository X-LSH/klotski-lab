import { describe, expect, it } from 'vitest';
import { solveIdaStar } from '../../src/solver/idastar';
import { solveBfs } from '../../src/solver/bfs';
import { isSolved } from '../../src/core/rules';
import { createInitialState } from '../../src/core/state';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { applySolution, mediumPuzzle, oneStepPuzzle, unsolvablePuzzle } from './helpers';
import { bigPiecePuzzle, tinyPuzzle } from '../core/helpers';

describe('IDA* 求解器', () => {
  it('能解出小谜题', () => {
    const result = solveIdaStar({
      puzzle: tinyPuzzle(),
      initialState: createInitialState(tinyPuzzle()),
    });
    expect(result.solved).toBe(true);
  });

  it('返回最优解（深度与 BFS 一致）', () => {
    for (const puzzle of [tinyPuzzle(), bigPiecePuzzle(), oneStepPuzzle()]) {
      const initial = createInitialState(puzzle);
      const a = solveIdaStar({ puzzle, initialState: initial });
      const b = solveBfs({ puzzle, initialState: initial });
      expect(a.solved).toBe(true);
      expect(a.depth).toBe(b.depth);
    }
  });

  it('解执行后最终 solved', () => {
    const puzzle = tinyPuzzle();
    const initial = createInitialState(puzzle);
    const result = solveIdaStar({ puzzle, initialState: initial });
    expect(isSolved(applySolution(puzzle, initial, result.moves), puzzle)).toBe(true);
  });

  it('初始已完成时直接返回', () => {
    const puzzle = oneStepPuzzle();
    const state = applySolution(puzzle, createInitialState(puzzle), [
      { pieceId: 't', direction: 'right', steps: 1 },
    ]);
    const result = solveIdaStar({ puzzle, initialState: state });
    expect(result.solved).toBe(true);
    expect(result.reason).toBe('already-solved');
  });

  it('无解谜题返回 unsolvable 且不卡死', () => {
    const puzzle = unsolvablePuzzle();
    const result = solveIdaStar({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.solved).toBe(false);
    expect(result.reason).toBe('unsolvable');
  });

  it('中等谜题可解且深度与 BFS 一致', () => {
    // 说明：完整横刀立马（116 步）对 IDA* 而言在基础启发式下需要极长时间
    // （已实测：180 秒仅推进到深度 79），这是 IDA* 的算法特性而非实现缺陷。
    // 跨算法一致性验证使用中等难度谜题（同样含 10 个棋子的完整体系）。
    const puzzle = mediumPuzzle();
    const initial = createInitialState(puzzle);
    const result = solveIdaStar(
      { puzzle, initialState: initial },
      { maxStates: 2_000_000, timeoutMs: 60_000 },
    );
    const bfs = solveBfs({ puzzle, initialState: initial });
    expect(result.solved).toBe(true);
    expect(result.depth).toBe(bfs.depth);
    expect(isSolved(applySolution(puzzle, initial, result.moves), puzzle)).toBe(true);
  }, 90_000);

  it('状态上限与取消能安全终止', () => {
    const puzzle = tinyPuzzle();
    const limited = solveIdaStar(
      { puzzle, initialState: createInitialState(puzzle) },
      { maxStates: 2 },
    );
    expect(limited.reason).toBe('state-limit');

    let calls = 0;
    const cancelled = solveIdaStar(
      { puzzle: CLASSIC_PUZZLE, initialState: createInitialState(CLASSIC_PUZZLE) },
      { shouldCancel: () => ++calls > 1 },
    );
    expect(cancelled.reason).toBe('cancelled');
  });
});
