/**
 * 算法竞速对比：同一道题依次跑全部算法，对比它们「找解的过程有多费劲」。
 * 数据全部来自真实求解，不做估算；内存占用无法准确测量，因此不展示。
 */
import { ALGORITHM_LABELS } from '../../solver/registry';
import { END_REASON_LABELS } from './labels';
import type { RaceEntry } from '../../observatory/race';

interface AlgorithmComparisonProps {
  entries: RaceEntry[];
  running: boolean;
}

const BAR_MAX_W = 220;

/** 把表格里的数字变成一句结论 —— 只给三行数据，用户还得自己对比，价值打折 */
function buildSummary(entries: RaceEntry[]): string | null {
  const solved = entries.filter((e) => e.result.solved);
  if (solved.length < 2) return null;
  const least = solved.reduce((a, b) => (b.result.visitedNodes < a.result.visitedNodes ? b : a));
  const most = solved.reduce((a, b) => (b.result.visitedNodes > a.result.visitedNodes ? b : a));
  if (most.result.visitedNodes === 0) return null;
  const ratio = Math.round((least.result.visitedNodes / most.result.visitedNodes) * 100);
  const sameDepth = solved.every((e) => e.result.depth === solved[0].result.depth);
  const head = `${ALGORITHM_LABELS[least.algorithm]} 访问的局面最少：${least.result.visitedNodes} 个，只有 ${ALGORITHM_LABELS[most.algorithm]}（${most.result.visitedNodes} 个）的 ${ratio}%`;
  return sameDepth ? `${head}；两者都找到了 ${solved[0].result.depth} 步的最优解。` : `${head}。`;
}

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
      <div className="algorithm-comparison" aria-label="算法竞速对比">
        <h3>算法竞速对比</h3>
        <p className="algorithm-comparison__empty">
          {running
            ? '竞速进行中…'
            : '点「三算法竞速对比」：用同一道题依次跑 BFS / A* / IDA*，对比它们各自访问了多少局面、花了多长时间。'}
        </p>
        <p className="algorithm-comparison__empty algorithm-comparison__empty--hint">
          三种算法的差异只有在同一道题上才能看出来 —— 这也是这一页存在的理由。
        </p>
      </div>
    );
  }

  const summary = running ? null : buildSummary(entries);

  return (
    <div className="algorithm-comparison" aria-label="算法竞速对比">
      <h3>算法竞速对比{running ? '（进行中…）' : ''}</h3>
      <p className="algorithm-comparison__lead">
        「访问」是算法检查过的局面总数，越少说明它越「有的放矢」；「深度」是它找到的解的步数。
      </p>
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
      {summary && <p className="algorithm-comparison__summary">{summary}</p>}
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
