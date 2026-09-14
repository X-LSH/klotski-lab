/**
 * 算法竞速（观测层）：对同一问题并行执行全部算法并汇总结果。
 * 每个算法独立 Worker，互不阻塞；超时的算法如实标记，不伪造数据。
 */
import { ALL_ALGORITHMS, type AlgorithmName } from '../solver/registry';
import { solvePuzzleWithHandle } from '../solver/solver-service';
import type { SolveProblem, SolveResult } from '../solver/result';

export interface RaceEntry {
  algorithm: AlgorithmName;
  result: SolveResult;
}

/** 竞速统一超时（毫秒）：IDA* 在大谜题上可能超时，属预期行为 */
export const RACE_TIMEOUT_MS = 60_000;

/**
 * 并行执行全部算法。
 * @param onProgress 可选：每个算法完成时回调（增量更新 UI）
 */
export async function raceAlgorithms(
  problem: SolveProblem,
  onEntry?: (entry: RaceEntry) => void,
  timeoutMs: number = RACE_TIMEOUT_MS,
): Promise<RaceEntry[]> {
  const runs = ALL_ALGORITHMS.map((algorithm) =>
    solvePuzzleWithHandle(problem, algorithm, { timeoutMs }).promise.then(
      (result): RaceEntry => {
        const entry = { algorithm, result };
        onEntry?.(entry);
        return entry;
      },
    ),
  );
  return Promise.all(runs);
}
