import { describe, expect, it } from 'vitest';
import { CLASSIC_PUZZLE, PRESET_PUZZLES } from '../../src/core/presets';
import { createInitialState } from '../../src/core/state';
import { getLegalMoves, isSolved } from '../../src/core/rules';
import { validatePuzzle } from '../../src/core/validator';

describe('内置预设谜题', () => {
  it('全部预设均通过校验', () => {
    for (const puzzle of PRESET_PUZZLES) {
      expect(validatePuzzle(puzzle).valid).toBe(true);
    }
  });

  it('经典谜题结构正确：4×5 棋盘、10 个棋子、底部出口', () => {
    expect(CLASSIC_PUZZLE.board).toMatchObject({ width: 4, height: 5 });
    expect(CLASSIC_PUZZLE.pieces).toHaveLength(10);
    expect(CLASSIC_PUZZLE.board.exit).toEqual({ x: 1, y: 4, width: 2, height: 1 });
    expect(CLASSIC_PUZZLE.goal).toEqual({ pieceId: 'caocao', type: 'reach-exit' });
  });

  it('经典谜题初始未 solved 且存在合法移动', () => {
    const state = createInitialState(CLASSIC_PUZZLE);
    expect(isSolved(state, CLASSIC_PUZZLE)).toBe(false);
    expect(getLegalMoves(state, CLASSIC_PUZZLE).length).toBeGreaterThan(0);
  });
});
