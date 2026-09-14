/**
 * A* 求解器：f(n) = g(n) + h(n)。
 * - 优先队列独立实现（priority-queue.ts）；
 * - 使用 admissible 且 consistent 的矩形间距启发式，保证最优解；
 * - 状态去重使用规范化状态键（等价棋子归一）；
 * - 观测：通过 onEvent 发出轻量搜索事件，不影响求解正确性。
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
  const emit = options.onEvent;
  const finish = (partial: Omit<SolveResult, 'elapsedMs'>): SolveResult => {
    emit?.({ type: 'search_end', reason: partial.reason });
    return { ...partial, elapsedMs: Date.now() - startedAt };
  };

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
  emit?.({ type: 'search_start', stateKey: startKey, depth: 0 });
  const open = new PriorityQueue<QueueNode>();
  open.enqueue({ key: startKey, state: initialState }, heuristic(initialState, puzzle));
  /** 每个规范化键已知的最小 g 值（懒删除：过期条目出队时跳过） */
  const bestG = new Map<string, number>([[startKey, 0]]);
  const parents = new Map<string, ParentRecord>();

  let expandedNodes = 0;
  let generatedNodes = 0;
  let skippedNodes = 0;
  let lastProgressAt = 0;

  const reportProgress = (depth: number) => {
    options.onProgress?.({
      visitedNodes: bestG.size,
      expandedNodes,
      depth,
      queueSize: open.size,
      generatedNodes,
      skippedNodes,
    });
  };

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
    if (g === undefined) {
      skippedNodes += 1;
      emit?.({ type: 'node_skip', stateKey: node.key });
      continue; // 懒删除：已有更优路径的过期条目
    }
    expandedNodes += 1;
    emit?.({ type: 'node_expand', stateKey: node.key, depth: g });

    if (options.onProgress && expandedNodes - lastProgressAt >= PROGRESS_INTERVAL) {
      lastProgressAt = expandedNodes;
      reportProgress(g);
    }

    for (const { move, state: next } of generateSuccessors(node.state, puzzle)) {
      const nextKey = canonicalStateKey(next, puzzle);
      const nextG = g + 1;
      generatedNodes += 1;
      const knownG = bestG.get(nextKey);
      if (knownG !== undefined && knownG <= nextG) {
        skippedNodes += 1;
        emit?.({ type: 'node_skip', stateKey: nextKey, depth: nextG });
        continue; // 已有不更优的路径
      }
      bestG.set(nextKey, nextG);
      parents.set(nextKey, { parentKey: node.key, move });
      open.enqueue({ key: nextKey, state: next }, nextG + heuristic(next, puzzle));
      emit?.({
        type: 'node_generate',
        stateKey: nextKey,
        parentKey: node.key,
        move,
        depth: nextG,
      });

      if (isSolved(next, puzzle)) {
        const moves = reconstructMoves(parents, nextKey);
        emit?.({ type: 'goal_found', stateKey: nextKey, depth: moves.length });
        reportProgress(nextG);
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
