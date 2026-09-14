/**
 * A* 求解器：f(n) = g(n) + h(n)。
 * - 优先队列独立实现（priority-queue.ts）；
 * - 使用 admissible 且 consistent 的矩形间距启发式，保证最优解；
 * - 状态去重使用规范化状态键（等价棋子归一）。
 */
import type { GameState, Move } from '../types';
import { isSolved } from '../core/rules';
import { canonicalStateKey } from './state-key';
import { generateSuccessors } from './move-generator';
import { heuristic } from './heuristic';
import { PriorityQueue } from './priority-queue';
import type { Solver } from './solver';
import {
  DEFAULT_MAX_STATES,
  type SolveOptions,
  type SolveProblem,
  type SolveResult,
} from './result';

const CHECK_INTERVAL = 512;
const PROGRESS_INTERVAL = 1024;

interface ParentRecord {
  parentKey: string;
  move: Move;
}

interface QueueNode {
  key: string;
  state: GameState;
}

function reconstructMoves(parents: Map<string, ParentRecord>, goalKey: string): Move[] {
  const moves: Move[] = [];
  let key = goalKey;
  while (parents.has(key)) {
    const record = parents.get(key) as ParentRecord;
    moves.push(record.move);
    key = record.parentKey;
  }
  return moves.reverse();
}

export function solveAStar(problem: SolveProblem, options: SolveOptions = {}): SolveResult {
  const { puzzle, initialState } = problem;
  const maxStates = options.maxStates ?? DEFAULT_MAX_STATES;
  const startedAt = Date.now();
  const finish = (partial: Omit<SolveResult, 'elapsedMs'>): SolveResult => ({
    ...partial,
    elapsedMs: Date.now() - startedAt,
  });

  if (isSolved(initialState, puzzle)) {
    return finish({
      solved: true,
      moves: [],
      depth: 0,
      visitedNodes: 1,
      expandedNodes: 0,
      reason: 'already-solved',
    });
  }

  const startKey = canonicalStateKey(initialState, puzzle);
  const open = new PriorityQueue<QueueNode>();
  open.enqueue({ key: startKey, state: initialState }, heuristic(initialState, puzzle));
  /** 每个规范化键已知的最小 g 值（懒删除：过期条目出队时跳过） */
  const bestG = new Map<string, number>([[startKey, 0]]);
  const parents = new Map<string, ParentRecord>();

  let expandedNodes = 0;
  let lastProgressAt = 0;

  while (!open.isEmpty()) {
    if (expandedNodes % CHECK_INTERVAL === 0) {
      if (options.shouldCancel?.()) {
        return finish({
          solved: false,
          moves: [],
          depth: 0,
          visitedNodes: bestG.size,
          expandedNodes,
          reason: 'cancelled',
        });
      }
      if (options.timeoutMs !== undefined && Date.now() - startedAt > options.timeoutMs) {
        return finish({
          solved: false,
          moves: [],
          depth: 0,
          visitedNodes: bestG.size,
          expandedNodes,
          reason: 'timeout',
        });
      }
    }

    const node = open.dequeue() as QueueNode;
    const g = bestG.get(node.key);
    if (g === undefined) continue;
    expandedNodes += 1;

    if (options.onProgress && expandedNodes - lastProgressAt >= PROGRESS_INTERVAL) {
      lastProgressAt = expandedNodes;
      options.onProgress({
        visitedNodes: bestG.size,
        expandedNodes,
        depth: g,
        queueSize: open.size,
      });
    }

    for (const { move, state: next } of generateSuccessors(node.state, puzzle)) {
      const nextKey = canonicalStateKey(next, puzzle);
      const nextG = g + 1;
      const knownG = bestG.get(nextKey);
      if (knownG !== undefined && knownG <= nextG) continue; // 已有不更优的路径
      bestG.set(nextKey, nextG);
      parents.set(nextKey, { parentKey: node.key, move });
      open.enqueue({ key: nextKey, state: next }, nextG + heuristic(next, puzzle));

      if (isSolved(next, puzzle)) {
        const moves = reconstructMoves(parents, nextKey);
        options.onProgress?.({
          visitedNodes: bestG.size,
          expandedNodes,
          depth: nextG,
          queueSize: open.size,
        });
        return finish({
          solved: true,
          moves,
          depth: moves.length,
          visitedNodes: bestG.size,
          expandedNodes,
          reason: 'solved',
        });
      }

      if (bestG.size >= maxStates) {
        return finish({
          solved: false,
          moves: [],
          depth: 0,
          visitedNodes: bestG.size,
          expandedNodes,
          reason: 'state-limit',
        });
      }
    }
  }

  return finish({
    solved: false,
    moves: [],
    depth: 0,
    visitedNodes: bestG.size,
    expandedNodes,
    reason: 'unsolvable',
  });
}

/** A* 求解器（统一接口形式） */
export const astarSolver: Solver = {
  name: 'astar',
  solve: solveAStar,
};
