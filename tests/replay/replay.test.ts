import { describe, expect, it } from 'vitest';
import {
  BASE_STEP_INTERVAL_MS,
  buildReplaySession,
  clampIndex,
  intervalForSpeed,
} from '../../src/replay/replay';
import { createInitialState, findPiece } from '../../src/core/state';
import { isSolved } from '../../src/core/rules';
import { tinyPuzzle } from '../core/helpers';
import type { Move } from '../../src/types';

describe('解法回放', () => {
  const puzzle = tinyPuzzle();
  const moves: Move[] = [
    { pieceId: 't', direction: 'down', steps: 2 },
    { pieceId: 't', direction: 'right', steps: 2 },
  ];

  it('状态序列顺序正确：states[0] 为初始状态，逐步应用 moves', () => {
    const initial = createInitialState(puzzle);
    const session = buildReplaySession(puzzle, initial, moves);
    expect(session.states).toHaveLength(3);
    expect(findPiece(session.states[0], 't')).toMatchObject({ x: 0, y: 0 });
    expect(findPiece(session.states[1], 't')).toMatchObject({ x: 0, y: 2 });
    expect(findPiece(session.states[2], 't')).toMatchObject({ x: 2, y: 2 });
  });

  it('回放末态与直接执行全部移动一致（最终 solved）', () => {
    const initial = createInitialState(puzzle);
    const session = buildReplaySession(puzzle, initial, moves);
    const last = session.states[session.states.length - 1];
    expect(isSolved(last, puzzle)).toBe(true);
  });

  it('空移动序列只有初始状态', () => {
    const session = buildReplaySession(puzzle, createInitialState(puzzle), []);
    expect(session.states).toHaveLength(1);
  });

  it('clampIndex 限制游标范围', () => {
    expect(clampIndex(-5, 10)).toBe(0);
    expect(clampIndex(3, 10)).toBe(3);
    expect(clampIndex(99, 10)).toBe(10);
  });

  it('倍速间隔计算正确', () => {
    expect(intervalForSpeed(1)).toBe(BASE_STEP_INTERVAL_MS);
    expect(intervalForSpeed(2)).toBe(BASE_STEP_INTERVAL_MS / 2);
    expect(intervalForSpeed(0.5)).toBe(BASE_STEP_INTERVAL_MS * 2);
    expect(intervalForSpeed(0.25)).toBe(BASE_STEP_INTERVAL_MS * 4);
    expect(intervalForSpeed(4)).toBe(BASE_STEP_INTERVAL_MS / 4);
  });
});
