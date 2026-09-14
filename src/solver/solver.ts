/**
 * 求解器统一接口：所有算法实现同一签名，UI / Worker 只依赖本接口。
 */
import type { SolveOptions, SolveProblem, SolveResult } from './result';

export interface Solver {
  /** 算法标识（如 'bfs' / 'astar' / 'idastar'） */
  readonly name: string;
  solve(problem: SolveProblem, options?: SolveOptions): SolveResult;
}
