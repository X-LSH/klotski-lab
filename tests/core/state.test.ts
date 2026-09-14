import { describe, expect, it } from 'vitest';
import {
  cloneState,
  createInitialState,
  findPiece,
  stateEquals,
  stateKey,
} from '../../src/core/state';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { tinyPuzzle } from './helpers';

describe('游戏状态', () => {
  it('createInitialState 与谜题定义互不影响', () => {
    const puzzle = tinyPuzzle();
    const state = createInitialState(puzzle);
    state.pieces[0].x = 99;
    expect(puzzle.pieces[0].x).toBe(0);
  });

  it('cloneState 深拷贝，修改副本不影响原状态', () => {
    const state = createInitialState(tinyPuzzle());
    const copy = cloneState(state);
    copy.pieces[0].y = 2;
    expect(state.pieces[0].y).toBe(0);
  });

  it('stateKey 稳定：同一状态多次计算结果一致', () => {
    const state = createInitialState(CLASSIC_PUZZLE);
    expect(stateKey(state)).toBe(stateKey(cloneState(state)));
  });

  it('stateKey 与棋子数组顺序无关', () => {
    const state = createInitialState(tinyPuzzle());
    const reordered = { pieces: [...state.pieces].reverse() };
    expect(stateKey(state)).toBe(stateKey(reordered));
  });

  it('相同状态 equals 为 true', () => {
    const a = createInitialState(CLASSIC_PUZZLE);
    const b = cloneState(a);
    expect(stateEquals(a, b)).toBe(true);
  });

  it('不同状态 equals 为 false', () => {
    const a = createInitialState(CLASSIC_PUZZLE);
    const b = cloneState(a);
    b.pieces[0].x += 1;
    expect(stateEquals(a, b)).toBe(false);
  });

  it('findPiece 能找到棋子，找不到时返回 undefined', () => {
    const state = createInitialState(CLASSIC_PUZZLE);
    expect(findPiece(state, 'caocao')?.label).toBe('曹操');
    expect(findPiece(state, 'liubei')).toBeUndefined();
  });
});
