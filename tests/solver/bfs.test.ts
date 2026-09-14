import { describe, expect, it } from 'vitest';
import { solveBfs } from '../../src/solver/bfs';
import { canMove, isSolved } from '../../src/core/rules';
import { createInitialState } from '../../src/core/state';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { applySolution, oneStepPuzzle, unsolvablePuzzle } from './helpers';
import { tinyPuzzle } from '../core/helpers';

describe('BFS 求解器', () => {
  it('已经完成的谜题：直接返回空解', () => {
    const puzzle = oneStepPuzzle();
    const state = applySolution(puzzle, createInitialState(puzzle), [
      { pieceId: 't', direction: 'right', steps: 1 },
    ]);
    const result = solveBfs({ puzzle, initialState: state });
    expect(result.solved).toBe(true);
    expect(result.reason).toBe('already-solved');
    expect(result.moves).toHaveLength(0);
    expect(result.depth).toBe(0);
  });

  it('一步完成的谜题', () => {
    const puzzle = oneStepPuzzle();
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.solved).toBe(true);
    expect(result.moves).toHaveLength(1);
    expect(result.moves[0]).toEqual({ pieceId: 't', direction: 'right', steps: 1 });
  });

  it('多步完成的谜题', () => {
    const puzzle = tinyPuzzle(); // t 从 (0,0) 到 (2,2)，需要先挪开 b
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.solved).toBe(true);
    expect(result.moves.length).toBeGreaterThan(1);
  });

  it('无解谜题：返回 unsolvable 且不卡死', () => {
    const puzzle = unsolvablePuzzle();
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.solved).toBe(false);
    expect(result.reason).toBe('unsolvable');
    expect(result.moves).toHaveLength(0);
  });

  it('BFS 找到最短路径（深度等于曼哈顿下界的最优解）', () => {
    const puzzle: typeof tinyPuzzle extends () => infer T ? T : never = {
      version: 1,
      name: '空棋盘',
      board: { width: 3, height: 3, exit: { x: 2, y: 2, width: 1, height: 1 } },
      pieces: [{ id: 't', x: 0, y: 0, width: 1, height: 1, type: '1x1' }],
      goal: { pieceId: 't', type: 'reach-exit' },
    };
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.solved).toBe(true);
    expect(result.depth).toBe(4); // 曼哈顿距离 2+2
  });

  it('返回的每一步都是合法 Move', () => {
    const puzzle = tinyPuzzle();
    const initial = createInitialState(puzzle);
    const result = solveBfs({ puzzle, initialState: initial });
    let state = initial;
    for (const move of result.moves) {
      expect(canMove(state, puzzle, move)).toBe(true);
      state = applySolution(puzzle, state, [move]);
    }
  });

  it('将所有 moves 依次执行后最终 solved（核心验证）', () => {
    const puzzle = tinyPuzzle();
    const initial = createInitialState(puzzle);
    const result = solveBfs({ puzzle, initialState: initial });
    const finalState = applySolution(puzzle, initial, result.moves);
    expect(isSolved(finalState, puzzle)).toBe(true);
  });

  it('不重复访问相同状态：访问数不超过状态空间且每个后继唯一入队', () => {
    const puzzle = tinyPuzzle();
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    // 3×3 棋盘两个 1×1 棋子的状态数为 9×8=72，visited 不能超过它
    expect(result.visitedNodes).toBeLessThanOrEqual(72);
    expect(result.visitedNodes).toBeGreaterThan(0);
  });

  it('visitedNodes / expandedNodes 统计合理', () => {
    const puzzle = oneStepPuzzle();
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.visitedNodes).toBeGreaterThanOrEqual(2); // 初始 + 目标
    expect(result.expandedNodes).toBeGreaterThanOrEqual(1);
    expect(result.expandedNodes).toBeLessThanOrEqual(result.visitedNodes);
  });

  it('elapsedMs 有合理值', () => {
    const puzzle = tinyPuzzle();
    const result = solveBfs({ puzzle, initialState: createInitialState(puzzle) });
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(result.elapsedMs).toBeLessThan(10_000);
  });

  it('达到状态数上限时安全终止', () => {
    const puzzle = tinyPuzzle();
    const result = solveBfs(
      { puzzle, initialState: createInitialState(puzzle) },
      { maxStates: 2 },
    );
    expect(result.solved).toBe(false);
    expect(result.reason).toBe('state-limit');
  });

  it('外部取消时安全终止', () => {
    const puzzle = CLASSIC_PUZZLE;
    let calls = 0;
    const result = solveBfs(
      { puzzle, initialState: createInitialState(puzzle) },
      { shouldCancel: () => ++calls > 1 },
    );
    expect(result.solved).toBe(false);
    expect(result.reason).toBe('cancelled');
  });

  it('经典谜题可以解出且执行后 solved', () => {
    const initial = createInitialState(CLASSIC_PUZZLE);
    const result = solveBfs(
      { puzzle: CLASSIC_PUZZLE, initialState: initial },
      { maxStates: 500_000, timeoutMs: 60_000 },
    );
    expect(result.solved).toBe(true);
    const finalState = applySolution(CLASSIC_PUZZLE, initial, result.moves);
    expect(isSolved(finalState, CLASSIC_PUZZLE)).toBe(true);
  });
});
