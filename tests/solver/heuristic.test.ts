import { describe, expect, it } from 'vitest';
import { heuristic, rectGap } from '../../src/solver/heuristic';
import { solveBfs } from '../../src/solver/bfs';
import { createInitialState } from '../../src/core/state';
import { applyMove, getLegalMoves, isSolved } from '../../src/core/rules';
import { bigPiecePuzzle, tinyPuzzle } from '../core/helpers';
import { oneStepPuzzle } from './helpers';
import type { GameState, PuzzleDefinition } from '../../src/types';

/** 收集小谜题中若干可达状态（限制扩展数量） */
function sampleStates(puzzle: PuzzleDefinition, limit: number): GameState[] {
  const seen = new Set<string>();
  const queue: GameState[] = [createInitialState(puzzle)];
  const states: GameState[] = [];
  while (queue.length > 0 && states.length < limit) {
    const state = queue.shift() as GameState;
    const key = JSON.stringify(state.pieces.map((p) => [p.id, p.x, p.y]).sort());
    if (seen.has(key)) continue;
    seen.add(key);
    states.push(state);
    for (const move of getLegalMoves(state, puzzle)) {
      queue.push(applyMove(state, puzzle, move));
    }
  }
  return states;
}

describe('启发式函数', () => {
  it('目标达成时启发值为 0', () => {
    const puzzle = oneStepPuzzle();
    let state = createInitialState(puzzle);
    state = applyMove(state, puzzle, { pieceId: 't', direction: 'right', steps: 1 });
    expect(isSolved(state, puzzle)).toBe(true);
    expect(heuristic(state, puzzle)).toBe(0);
  });

  it('rectGap 计算正确', () => {
    // 已重叠 → 0
    expect(rectGap({ x: 0, y: 0, width: 2, height: 2 }, { x: 1, y: 1, width: 1, height: 1 })).toBe(0);
    // 同一行水平间距 3
    expect(rectGap({ x: 0, y: 0, width: 1, height: 1 }, { x: 3, y: 0, width: 1, height: 1 })).toBe(3);
    // 对角：水平 2 + 垂直 2
    expect(rectGap({ x: 0, y: 0, width: 1, height: 1 }, { x: 2, y: 2, width: 1, height: 1 })).toBe(4);
  });

  it('不高估：对若干可达状态，h 不大于 BFS 实际剩余步数', () => {
    for (const puzzle of [tinyPuzzle(), bigPiecePuzzle(), oneStepPuzzle()]) {
      for (const state of sampleStates(puzzle, 30)) {
        const result = solveBfs({ puzzle, initialState: state });
        if (result.solved) {
          expect(heuristic(state, puzzle)).toBeLessThanOrEqual(result.depth);
        }
      }
    }
  });

  it('一致性：任意合法移动后 h 的下降不超过 1', () => {
    for (const puzzle of [tinyPuzzle(), bigPiecePuzzle()]) {
      for (const state of sampleStates(puzzle, 20)) {
        const h = heuristic(state, puzzle);
        for (const move of getLegalMoves(state, puzzle)) {
          const next = applyMove(state, puzzle, move);
          // 一致性条件：h(n) ≤ cost(n,n') + h(n')，cost = 1
          expect(h).toBeLessThanOrEqual(1 + heuristic(next, puzzle));
        }
      }
    }
  });
});
