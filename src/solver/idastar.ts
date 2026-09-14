/**
 * IDA*（迭代加深 A*）求解器。
 * - 以 f(n) = g(n) + h(n) 为阈值迭代加深；
 * - 每轮深度优先搜索，f 超过阈值的节点剪枝，并记录下一轮的新阈值（bound）；
 * - 使用“当前路径”集合避免环，另用 transposition table 记录每轮最小 g；
 * - 递归深度不超过解的深度，经典谜题（116 步）远低于栈上限。
 */
import type { GameState, Move } from '../types';
import { isSolved } from '../core/rules';
import { canonicalStateKey } from './state-key';
import { generateSuccessors } from './move-generator';
import { heuristic } from './heuristic';
import type { Solver } from './solver';
import {
  DEFAULT_MAX_STATES,
  type SolveOptions,
  type SolveProblem,
  type SolveResult,
} from './result';

const CHECK_INTERVAL = 512;
const PROGRESS_INTERVAL = 1024;
const INF = Number.POSITIVE_INFINITY;

interface SearchContext {
  puzzle: SolveProblem['puzzle'];
  options: SolveOptions;
  startedAt: number;
  maxStates: number;
  visitedKeys: Set<string>;
  expandedNodes: number;
  lastProgressAt: number;
  /** 每轮迭代中各规范化键遇到的最小 g */
  bestG: Map<string, number>;
  /** 终止标记：null 表示继续 */
  halt: 'state-limit' | 'timeout' | 'cancelled' | null;
}

interface DfsResult {
  /** 找到的解（移动序列），未找到为 null */
  solution: Move[] | null;
  /** 超过当前阈值的 f 中的最小值（下一轮 bound） */
  nextBound: number;
}

function dfs(
  state: GameState,
  g: number,
  bound: number,
  path: Move[],
  pathKeys: Set<string>,
  ctx: SearchContext,
): DfsResult {
  const f = g + heuristic(state, ctx.puzzle);
  if (f > bound) return { solution: null, nextBound: f };
  if (isSolved(state, ctx.puzzle)) return { solution: [...path], nextBound: INF };

  if (ctx.expandedNodes % CHECK_INTERVAL === 0) {
    if (ctx.options.shouldCancel?.()) ctx.halt = 'cancelled';
    else if (
      ctx.options.timeoutMs !== undefined &&
      Date.now() - ctx.startedAt > ctx.options.timeoutMs
    )
      ctx.halt = 'timeout';
    else if (ctx.visitedKeys.size >= ctx.maxStates) ctx.halt = 'state-limit';
    if (ctx.halt) return { solution: null, nextBound: INF };
  }
  ctx.expandedNodes += 1;

  if (ctx.options.onProgress && ctx.expandedNodes - ctx.lastProgressAt >= PROGRESS_INTERVAL) {
    ctx.lastProgressAt = ctx.expandedNodes;
    ctx.options.onProgress({
      visitedNodes: ctx.visitedKeys.size,
      expandedNodes: ctx.expandedNodes,
      depth: g,
      queueSize: 0,
    });
  }

  let minNext = INF;
  // 按 f 升序展开后继：让最后一轮迭代更早触达目标（不影响正确性）
  const successors = generateSuccessors(state, ctx.puzzle)
    .map((s) => ({ ...s, f: g + 1 + heuristic(s.state, ctx.puzzle) }))
    .sort((a, b) => a.f - b.f);
  for (const { move, state: next } of successors) {
    const nextKey = canonicalStateKey(next, ctx.puzzle);
    if (pathKeys.has(nextKey)) continue; // 当前路径上去环
    const knownG = ctx.bestG.get(nextKey);
    if (knownG !== undefined && knownG <= g + 1) continue; // 本轮已有不更优路径

    ctx.bestG.set(nextKey, g + 1);
    ctx.visitedKeys.add(nextKey);
    // 状态数上限：插入时立即检查，保证及时安全终止
    if (ctx.visitedKeys.size >= ctx.maxStates) {
      ctx.halt = 'state-limit';
      path.pop();
      pathKeys.delete(nextKey);
      return { solution: null, nextBound: INF };
    }
    path.push(move);
    pathKeys.add(nextKey);

    const result = dfs(next, g + 1, bound, path, pathKeys, ctx);

    path.pop();
    pathKeys.delete(nextKey);

    if (result.solution) return result;
    if (ctx.halt) return { solution: null, nextBound: INF };
    if (result.nextBound < minNext) minNext = result.nextBound;
  }
  return { solution: null, nextBound: minNext };
}

export function solveIdaStar(problem: SolveProblem, options: SolveOptions = {}): SolveResult {
  const { puzzle, initialState } = problem;
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

  const ctx: SearchContext = {
    puzzle,
    options,
    startedAt,
    maxStates: options.maxStates ?? DEFAULT_MAX_STATES,
    visitedKeys: new Set(),
    expandedNodes: 0,
    lastProgressAt: 0,
    bestG: new Map(),
    halt: null,
  };

  const startKey = canonicalStateKey(initialState, puzzle);
  ctx.visitedKeys.add(startKey);
  let bound = heuristic(initialState, puzzle);

  // 迭代加深：每轮把阈值提高到上一轮超界节点中的最小 f
  while (!ctx.halt) {
    ctx.bestG = new Map([[startKey, 0]]);
    const result = dfs(initialState, 0, bound, [], new Set([startKey]), ctx);

    if (result.solution) {
      options.onProgress?.({
        visitedNodes: ctx.visitedKeys.size,
        expandedNodes: ctx.expandedNodes,
        depth: result.solution.length,
        queueSize: 0,
      });
      return finish({
        solved: true,
        moves: result.solution,
        depth: result.solution.length,
        visitedNodes: ctx.visitedKeys.size,
        expandedNodes: ctx.expandedNodes,
        reason: 'solved',
      });
    }
    if (ctx.halt) break;
    if (result.nextBound === INF) {
      // 没有更大的 f：搜索空间已耗尽，无解
      return finish({
        solved: false,
        moves: [],
        depth: 0,
        visitedNodes: ctx.visitedKeys.size,
        expandedNodes: ctx.expandedNodes,
        reason: 'unsolvable',
      });
    }
    bound = result.nextBound;
  }

  return finish({
    solved: false,
    moves: [],
    depth: 0,
    visitedNodes: ctx.visitedKeys.size,
    expandedNodes: ctx.expandedNodes,
    reason: ctx.halt ?? 'unsolvable',
  });
}

/** IDA* 求解器（统一接口形式） */
export const idastarSolver: Solver = {
  name: 'idastar',
  solve: solveIdaStar,
};
