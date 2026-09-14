/**
 * 算法注册表：统一按名称获取求解器实例。
 */
import { bfsSolver } from './bfs';
import { astarSolver } from './astar';
import { idastarSolver } from './idastar';
import type { Solver } from './solver';

export type AlgorithmName = 'bfs' | 'astar' | 'idastar';

export const ALGORITHM_LABELS: Record<AlgorithmName, string> = {
  bfs: 'BFS（广度优先）',
  astar: 'A*',
  idastar: 'IDA*',
};

export const ALL_ALGORITHMS: readonly AlgorithmName[] = ['bfs', 'astar', 'idastar'];

const SOLVERS: Record<AlgorithmName, Solver> = {
  bfs: bfsSolver,
  astar: astarSolver,
  idastar: idastarSolver,
};

export function getSolver(name: AlgorithmName): Solver {
  return SOLVERS[name];
}
