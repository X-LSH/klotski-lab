/**
 * 求解客户端：React 与 Web Worker 之间的桥。
 * - 每次求解启动独立 Worker，求解完毕或取消后立即终止，避免泄漏；
 * - cancel() 通过 terminate() 立即终止搜索，不需要等 Solver 自己跑完；
 * - 在 Worker 不可用的环境（如单元测试）自动降级为主线程执行。
 */
import { getSolver, type AlgorithmName } from './registry';
import type { SolveOptions, SolveProblem, SolveResult } from './result';
import type { SolveRequest, WorkerResponse } from './worker';

export interface SolveHandle {
  promise: Promise<SolveResult>;
  cancel: () => void;
}

/** Worker 抽象（便于测试注入 FakeWorker） */
export interface WorkerLike {
  postMessage(message: SolveRequest): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: never) => void) | null;
}

export interface WorkerFactory {
  (): WorkerLike;
}

function defaultWorkerFactory(): WorkerLike {
  // 真实 Worker 的事件签名较宽，这里收窄到项目协议所需的形状
  return new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  }) as unknown as WorkerLike;
}

export interface SolverClient {
  solve: (
    problem: SolveProblem,
    algorithm: AlgorithmName,
    options?: SolveOptions,
  ) => SolveHandle;
}

/**
 * 创建求解客户端。
 * @param workerFactory 可选注入（测试用）；缺省且环境无 Worker 时走主线程降级。
 */
export function createSolverClient(workerFactory?: WorkerFactory): SolverClient {
  const factory =
    workerFactory ?? (typeof Worker !== 'undefined' ? defaultWorkerFactory : null);

  if (!factory) {
    // 主线程降级：取消通过 shouldCancel 标志实现
    return {
      solve(problem, algorithm, options = {}) {
        let cancelled = false;
        const promise = new Promise<SolveResult>((resolve) => {
          setTimeout(() => {
            const solver = getSolver(algorithm);
            resolve(
              solver.solve(problem, { ...options, shouldCancel: () => cancelled }),
            );
          }, 0);
        });
        return {
          promise,
          cancel: () => {
            cancelled = true;
          },
        };
      },
    };
  }

  return {
    solve(problem, algorithm, options = {}) {
      const worker = factory();
      const id = Date.now() + Math.floor(Math.random() * 1000);
      let settled = false;

      const promise = new Promise<SolveResult>((resolve, reject) => {
        worker.onmessage = (event) => {
          const message = event.data;
          if (message.id !== id) return;
          if (message.type === 'progress') {
            options.onProgress?.(message.progress);
          } else if (message.type === 'result') {
            settled = true;
            worker.terminate();
            resolve(message.result);
          }
        };
        worker.onerror = () => {
          if (settled) return;
          settled = true;
          worker.terminate();
          reject(new Error('求解 Worker 发生错误'));
        };
        worker.postMessage({
          type: 'solve',
          id,
          algorithm,
          problem,
          options: { maxStates: options.maxStates, timeoutMs: options.timeoutMs },
        });
      });

      return {
        promise,
        cancel: () => {
          if (settled) return;
          settled = true;
          worker.terminate();
        },
      };
    },
  };
}
