import { describe, expect, it } from 'vitest';
import {
  applyMove,
  canMove,
  getLegalMoves,
  isSolved,
  maxStepsInDirection,
} from '../../src/core/rules';
import { createInitialState, findPiece } from '../../src/core/state';
import { validatePuzzle } from '../../src/core/validator';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { bigPiecePuzzle, blockedPuzzle, tinyPuzzle } from './helpers';

describe('移动规则', () => {
  it('经典谜题初始状态合法', () => {
    expect(validatePuzzle(CLASSIC_PUZZLE).valid).toBe(true);
    expect(isSolved(createInitialState(CLASSIC_PUZZLE), CLASSIC_PUZZLE)).toBe(false);
  });

  it('棋子能正确移动', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'down', steps: 1 })).toBe(true);
    const next = applyMove(state, puzzle, { pieceId: 't', direction: 'down', steps: 1 });
    expect(findPiece(next, 't')).toMatchObject({ x: 0, y: 1 });
  });

  it('被其他棋子挡住时不能移动', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle); // t 在 (0,0)，b 在 (1,0)
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'right', steps: 1 })).toBe(false);
  });

  it('越界不能移动', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'up', steps: 1 })).toBe(false);
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'left', steps: 1 })).toBe(false);
  });

  it('多格棋子碰撞判断正确：2×2 棋子任一边被挡都不能移动', () => {
    const puzzle = bigPiecePuzzle(); // big 2×2 在 (0,0)，s 在 (3,0)
    const state = createInitialState(puzzle);
    expect(canMove(state, puzzle, { pieceId: 'big', direction: 'right', steps: 1 })).toBe(true);
    // 把 s 挪到 big 右侧第二行 (2,1)，挡住 big 的右下角
    const moved = applyMove(state, puzzle, { pieceId: 's', direction: 'left', steps: 1 });
    const moved2 = applyMove(moved, puzzle, { pieceId: 's', direction: 'down', steps: 1 });
    expect(findPiece(moved2, 's')).toMatchObject({ x: 2, y: 1 });
    expect(canMove(moved2, puzzle, { pieceId: 'big', direction: 'right', steps: 1 })).toBe(false);
  });

  it('不能穿过被占据的格子（多步移动逐格检查）', () => {
    const puzzle = tinyPuzzle(); // t(0,0) b(1,0)
    const state = createInitialState(puzzle);
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'right', steps: 2 })).toBe(false);
    // 连续两格为空时可以一次移动多步
    const after = applyMove(state, puzzle, { pieceId: 'b', direction: 'down', steps: 2 });
    expect(findPiece(after, 'b')).toMatchObject({ x: 1, y: 2 });
  });

  it('applyMove 后状态正确且不修改原状态（不可变语义）', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    const next = applyMove(state, puzzle, { pieceId: 't', direction: 'down', steps: 1 });
    expect(findPiece(state, 't')).toMatchObject({ x: 0, y: 0 });
    expect(findPiece(next, 't')).toMatchObject({ x: 0, y: 1 });
  });

  it('非法移动时 applyMove 抛出异常', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    expect(() => applyMove(state, puzzle, { pieceId: 't', direction: 'up', steps: 1 })).toThrow();
    expect(() =>
      applyMove(state, puzzle, { pieceId: 'ghost', direction: 'down', steps: 1 }),
    ).toThrow();
  });

  it('getLegalMoves 只包含合法移动', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    const moves = getLegalMoves(state, puzzle);
    // t 只能向下（上/左越界，右被 b 挡）；b 可以向下和向右
    expect(moves).toContainEqual({ pieceId: 't', direction: 'down', steps: 1 });
    expect(moves).toContainEqual({ pieceId: 'b', direction: 'down', steps: 1 });
    expect(moves).toContainEqual({ pieceId: 'b', direction: 'right', steps: 1 });
    expect(moves).toHaveLength(3);
  });

  it('不能进入封锁格', () => {
    const puzzle = blockedPuzzle(); // (1,0) 被封锁
    const state = createInitialState(puzzle);
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'right', steps: 1 })).toBe(false);
    expect(canMove(state, puzzle, { pieceId: 't', direction: 'down', steps: 1 })).toBe(true);
  });

  it('maxStepsInDirection 返回最大连续步数', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    expect(maxStepsInDirection(state, puzzle, 't', 'down')).toBe(2);
    expect(maxStepsInDirection(state, puzzle, 't', 'right')).toBe(0);
  });
});

describe('目标判断', () => {
  it('reach-exit：棋子覆盖出口即为完成', () => {
    const puzzle = tinyPuzzle();
    let state = createInitialState(puzzle);
    expect(isSolved(state, puzzle)).toBe(false);
    state = applyMove(state, puzzle, { pieceId: 't', direction: 'down', steps: 2 });
    state = applyMove(state, puzzle, { pieceId: 't', direction: 'right', steps: 2 });
    expect(isSolved(state, puzzle)).toBe(true);
  });

  it('occupy-area：棋子覆盖目标区域即为完成', () => {
    const puzzle = bigPiecePuzzle();
    let state = createInitialState(puzzle);
    expect(isSolved(state, puzzle)).toBe(false);
    // 先把小兵沿右列、底行移到左下角，给 2×2 棋子让出路线
    state = applyMove(state, puzzle, { pieceId: 's', direction: 'down', steps: 3 });
    state = applyMove(state, puzzle, { pieceId: 's', direction: 'left', steps: 3 });
    state = applyMove(state, puzzle, { pieceId: 'big', direction: 'right', steps: 2 });
    state = applyMove(state, puzzle, { pieceId: 'big', direction: 'down', steps: 2 });
    expect(isSolved(state, puzzle)).toBe(true);
  });
});
