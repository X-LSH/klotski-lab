/**
 * 广度优先搜索（BFS）求解器：保证返回最短解（按单位移动步数计）。
 *
 * 设计要点：
 * - 不保存整条路径到每个节点，只用 parent map（stateKey -> 父状态 + 移动）回溯解法；
 * - 状态去重使用规范化状态键（等价棋子归一）；
 * - 状态保持不可变语义，绝不修改传入的 GameState；
 * - 终止条件：已解 / 找到解 / 无解 / 状态数上限 / 超时 / 外部取消；
 * - 观测：通过 onEvent 发出轻量搜索事件，不影响求解正确性。
 */
import type { GameState, Move } from '../types';
import { isSolved } from '../core/rules';
import { canonicalStateKey } from './state-key';
import { generateSuccessors } from './move-generator';
import type { Solver } from './solver';
import {
  DEFAULT_MAX_STATES,
  type SolveOptions,
  type SolveProblem,
  type SolveResult,
} from './result';

/** 每隔多少次循环检查一次时间 / 取消（降低 Date.now 调用开销） */
const CHECK_INTERVAL = 512;
/** 每隔多少次扩展发送一次进度 */
const PROGRESS_INTERVAL = 1024;

interface ParentRecord {
  parentKey: string;
  move: Move;
}

/** 沿 parent map 回溯，得到从初始状态到目标状态的移动序列 */
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

export function solveBfs(problem: SolveProblem, options: SolveOptions = {}): SolveResult {
  const { puzzle, initialState } = problem;
  const maxStates = options.maxStates ?? DEFAULT_MAX_STATES;
  const startedAt = Date.now();
  const emit = options.onEvent;

  const finish = (partial: Omit<SolveResult, 'elapsedMs'>): SolveResult => {
    emit?.({ type: 'search_end', reason: partial.reason });
    return { ...partial, elapsedMs: Date.now() - startedAt };
  };

  // 终止条件 1：初始状态已经 solved
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
  // 队列只存 stateKey，状态本体放在 states map 中，避免重复持有大对象
  const queue: string[] = [startKey];
  let queueHead = 0;
  const states = new Map<string, GameState>([[startKey, initialState]]);
  const depths = new Map<string, number>([[startKey, 0]]);
  const parents = new Map<string, ParentRecord>();

  let expandedNodes = 0;
  let generatedNodes = 0;
  let skippedNodes = 0;
  let lastProgressAt = 0;

  const reportProgress = (depth: number) => {
    options.onProgress?.({
      visitedNodes: states.size,
      expandedNodes,
      depth,
      queueSize: queue.length - queueHead,
      generatedNodes,
      skippedNodes,
    });
  };

  while (queueHead < queue.length) {
    // 终止条件 4 / 5 / 取消：周期性检查，避免死循环卡住
    if (expandedNodes % CHECK_INTERVAL === 0) {
      if (options.shouldCancel?.()) {
        return finish({
          solved: false,
          moves: [],
          depth: 0,
          visitedNodes: states.size,
          expandedNodes,
          reason: 'cancelled',
        });
      }
      if (options.timeoutMs !== undefined && Date.now() - startedAt > options.timeoutMs) {
        return finish({
          solved: false,
          moves: [],
          depth: 0,
          visitedNodes: states.size,
          expandedNodes,
          reason: 'timeout',
        });
      }
    }

    const currentKey = queue[queueHead++];
    const current = states.get(currentKey) as GameState;
    const currentDepth = depths.get(currentKey) as number;
    expandedNodes += 1;
    emit?.({ type: 'node_expand', stateKey: currentKey, depth: currentDepth });

    if (options.onProgress && expandedNodes - lastProgressAt >= PROGRESS_INTERVAL) {
      lastProgressAt = expandedNodes;
      reportProgress(currentDepth);
    }

    // 每层扩展：生成全部合法后继
    for (const { move, state: next } of generateSuccessors(current, puzzle)) {
      const nextKey = canonicalStateKey(next, puzzle);
      generatedNodes += 1;
      if (states.has(nextKey)) {
        skippedNodes += 1;
        emit?.({ type: 'node_skip', stateKey: nextKey, depth: currentDepth + 1 });
        continue;
      }
      states.set(nextKey, next);
      depths.set(nextKey, currentDepth + 1);
      parents.set(nextKey, { parentKey: currentKey, move });
      queue.push(nextKey);
      emit?.({
        type: 'node_generate',
        stateKey: nextKey,
        parentKey: currentKey,
        move,
        depth: currentDepth + 1,
      });

      // 终止条件 2：找到目标后停止，BFS 保证此时为最短解
      if (isSolved(next, puzzle)) {
        const moves = reconstructMoves(parents, nextKey);
        emit?.({ type: 'goal_found', stateKey: nextKey, depth: moves.length });
        reportProgress(moves.length);
        return finish({
          solved: true,
          moves,
          depth: moves.length,
          visitedNodes: states.size,
          expandedNodes,
          reason: 'solved',
        });
      }

      // 终止条件 4：状态数达到配置上限，立即安全终止
      if (states.size >= maxStates) {
        return finish({
          solved: false,
          moves: [],
          depth: 0,
          visitedNodes: states.size,
          expandedNodes,
          reason: 'state-limit',
        });
      }
    }
  }

  // 终止条件 3：队列为空仍未找到目标，无解
  return finish({
    solved: false,
    moves: [],
    depth: 0,
    visitedNodes: states.size,
    expandedNodes,
    reason: 'unsolvable',
  });
}

/** BFS 求解器（统一接口形式） */
export const bfsSolver: Solver = {
  name: 'bfs',
  solve: solveBfs,
};
