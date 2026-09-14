import { describe, expect, it } from 'vitest';
import { solveAStar } from '../../src/solver/astar';
import { solveBfs } from '../../src/solver/bfs';
import { isSolved } from '../../src/core/rules';
import { createInitialState } from '../../src/core/state';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { applySolution, oneStepPuzzle, unsolvablePuzzle } from './helpers';
import { bigPiecePuzzle, tinyPuzzle } from '../core/helpers';

describe('A* 求解器', () => {
  it('能解出小谜题', () => {
    const result = solveAStar({ puzzle: tinyPuzzle(), initialState: createInitialState(tinyPuzzle()) });
    expect(result.solved).toBe(true);
  });

  it('返回最优解（深度与 BFS 一致）', () => {
    for (const puzzle of [tinyPuzzle(), bigPiecePuzzle(), oneStepPuzzle()]) {
      const initial = createInitialState(puzzle);
      const a = solveAStar({ puzzle, initialState: initial });
      const b = solveBfs({ puzzle, initialState: initial });
      expect(a.solved).toBe(true);
      expect(a.depth).toBe(b.depth);
    }
  });

  it('解执行后最终 solved', () => {
    const puzzle = tinyPuzzle();
    const initial = createInitialState(puzzle);
    const result = solveAStar({ puzzle, initialState: initial });
    expect(isSolved(applySolution(puzzle, initial, result.moves), puzzle)).toBe(true);
  });

  it('初始已完成时直接返回', () => {
    const puzzle = oneStepPuzzle();
    const state = applySolution(puzzle, createInitialState(puzzle), [
      { pieceId: 't', direction: 'right', steps: 1 },
    ]);
    const result = solveAStar({ puzzle, initialState: state });
    expect(result.solved).toBe(true);
    expect(result.reason).toBe('already-solved');
  });

  it('无解谜题返回 unsolvable', () => {
    const puzzle = unsolvablePuzzle();
    const result = solveAStar({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.solved).toBe(false);
    expect(result.reason).toBe('unsolvable');
  });

  it('经典谜题可解且与 BFS 深度一致（116 步）', () => {
    const initial = createInitialState(CLASSIC_PUZZLE);
    const result = solveAStar(
      { puzzle: CLASSIC_PUZZLE, initialState: initial },
      { maxStates: 500_000, timeoutMs: 60_000 },
    );
    expect(result.solved).toBe(true);
    expect(result.depth).toBe(116);
    expect(isSolved(applySolution(CLASSIC_PUZZLE, initial, result.moves), CLASSIC_PUZZLE)).toBe(
      true,
    );
  });

  it('状态上限与取消能安全终止', () => {
    const puzzle = tinyPuzzle();
    const limited = solveAStar(
      { puzzle, initialState: createInitialState(puzzle) },
      { maxStates: 2 },
    );
    expect(limited.reason).toBe('state-limit');

    let calls = 0;
    const cancelled = solveAStar(
      { puzzle: CLASSIC_PUZZLE, initialState: createInitialState(CLASSIC_PUZZLE) },
      { shouldCancel: () => ++calls > 1 },
    );
    expect(cancelled.reason).toBe('cancelled');
  });
});
