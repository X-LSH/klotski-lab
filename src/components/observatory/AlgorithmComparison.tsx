/**
 * 算法对比：结果表格 + SVG 柱状图（访问节点对比、执行时间对比）。
 * 内存占用无法准确测量，按规范不展示，不伪造。
 */
import { ALGORITHM_LABELS } from '../../solver/registry';
import { END_REASON_LABELS } from './labels';
import type { RaceEntry } from '../../observatory/race';

interface AlgorithmComparisonProps {
  entries: RaceEntry[];
  running: boolean;
}

const BAR_MAX_W = 220;

function BarChart({ title, values }: { title: string; values: { label: string; value: number }[] }) {
  const max = Math.max(...values.map((v) => v.value), 1);
  return (
    <div className="algorithm-bars" aria-label={title}>
      <h4>{title}</h4>
      {values.map((v) => (
        <div key={v.label} className="algorithm-bars__row">
          <span className="algorithm-bars__label">{v.label}</span>
          <svg width={BAR_MAX_W + 10} height={16} role="img" aria-label={`${v.label} ${v.value}`}>
            <rect
              x={0}
              y={2}
              width={Math.max((v.value / max) * BAR_MAX_W, 2)}
              height={12}
              rx={3}
              className="algorithm-bars__bar"
            />
          </svg>
          <span className="algorithm-bars__value">{v.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AlgorithmComparison({ entries, running }: AlgorithmComparisonProps) {
  if (entries.length === 0) {
    return (
      <div className="algorithm-comparison" aria-label="算法对比">
        <h3>算法竞速</h3>
        <p className="algorithm-comparison__empty">
          {running ? '竞速进行中…' : '点击「竞速全部算法」同时执行 BFS / A* / IDA* 并对比。'}
        </p>
      </div>
    );
  }

  return (
    <div className="algorithm-comparison" aria-label="算法对比">
      <h3>算法竞速{running ? '（进行中…）' : ''}</h3>
      <table className="solver-panel__table">
        <thead>
          <tr>
            <th>算法</th>
            <th>结果</th>
            <th>深度</th>
            <th>访问</th>
            <th>展开</th>
            <th>耗时</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ algorithm, result }) => (
            <tr key={algorithm}>
              <td>{ALGORITHM_LABELS[algorithm]}</td>
              <td>{result.solved ? '已解出' : END_REASON_LABELS[result.reason]}</td>
              <td>{result.solved ? result.depth : '—'}</td>
              <td>{result.visitedNodes}</td>
              <td>{result.expandedNodes}</td>
              <td>{(result.elapsedMs / 1000).toFixed(2)} 秒</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="algorithm-comparison__charts">
        <BarChart
          title="访问节点对比"
          values={entries.map((e) => ({
            label: ALGORITHM_LABELS[e.algorithm],
            value: e.result.visitedNodes,
          }))}
        />
        <BarChart
          title="执行时间对比（毫秒）"
          values={entries.map((e) => ({
            label: ALGORITHM_LABELS[e.algorithm],
            value: e.result.elapsedMs,
          }))}
        />
      </div>
    </div>
  );
}
