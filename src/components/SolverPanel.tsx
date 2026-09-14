/**
 * 求解面板：算法选择、进度、结果统计与三算法对比表。
 */
import { ALGORITHM_LABELS, ALL_ALGORITHMS, type AlgorithmName } from '../solver/registry';
import type { SolveProgress, SolveResult } from '../solver/result';

export interface ComparisonEntry {
  algorithm: AlgorithmName;
  result: SolveResult;
}

interface SolverPanelProps {
  algorithm: AlgorithmName;
  solving: boolean;
  comparing: boolean;
  progress: SolveProgress | null;
  result: SolveResult | null;
  comparison: ComparisonEntry[] | null;
  onAlgorithmChange: (algorithm: AlgorithmName) => void;
  onSolve: () => void;
  onStop: () => void;
  onCompare: () => void;
}

export default function SolverPanel({
  algorithm,
  solving,
  comparing,
  progress,
  result,
  comparison,
  onAlgorithmChange,
  onSolve,
  onStop,
  onCompare,
}: SolverPanelProps) {
  return (
    <div className="solver-panel" aria-label="求解面板">
      <div className="solver-panel__row">
        <label className="solver-panel__field">
          算法
          <select
            value={algorithm}
            disabled={solving || comparing}
            onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmName)}
            aria-label="选择算法"
          >
            {ALL_ALGORITHMS.map((name) => (
              <option key={name} value={name}>
                {ALGORITHM_LABELS[name]}
              </option>
            ))}
          </select>
        </label>
        {solving ? (
          <button type="button" onClick={onStop} aria-label="停止求解">
            停止
          </button>
        ) : (
          <button
            type="button"
            className="game-controls__solve"
            onClick={onSolve}
            disabled={comparing}
            aria-label="求解"
          >
            求解
          </button>
        )}
        <button
          type="button"
          onClick={onCompare}
          disabled={solving || comparing}
          aria-label="对比三种算法"
        >
          {comparing ? '对比中…' : '对比三种算法'}
        </button>
      </div>

      {solving && progress && (
        <div className="solver-panel__progress" aria-label="求解进度">
          <span>访问 {progress.visitedNodes}</span>
          <span>展开 {progress.expandedNodes}</span>
          <span>深度 {progress.depth}</span>
          {progress.queueSize > 0 && <span>队列 {progress.queueSize}</span>}
        </div>
      )}

      {result && (
        <dl className="solver-panel__stats" aria-label="求解统计">
          <div>
            <dt>结果</dt>
            <dd>{result.solved ? `已解出（${result.depth} 步）` : '未解出'}</dd>
          </div>
          <div>
            <dt>访问节点</dt>
            <dd>{result.visitedNodes}</dd>
          </div>
          <div>
            <dt>展开节点</dt>
            <dd>{result.expandedNodes}</dd>
          </div>
          <div>
            <dt>耗时</dt>
            <dd>{result.elapsedMs} 毫秒</dd>
          </div>
        </dl>
      )}

      {comparison && (
        <table className="solver-panel__table" aria-label="算法对比">
          <thead>
            <tr>
              <th>算法</th>
              <th>深度</th>
              <th>访问</th>
              <th>展开</th>
              <th>耗时</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(({ algorithm: name, result: r }) => (
              <tr key={name}>
                <td>{ALGORITHM_LABELS[name]}</td>
                <td>{r.solved ? r.depth : '—'}</td>
                <td>{r.visitedNodes}</td>
                <td>{r.expandedNodes}</td>
                <td>{r.elapsedMs} 毫秒</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
