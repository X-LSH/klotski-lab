/**
 * 搜索实时统计面板。
 *
 * 每个指标都带一句 title 说明 —— 这些是求解器的内部术语，
 * 只给数字等于没给信息（用户不知道「展开节点」和「访问节点」差在哪）。
 */
import type { SolveProgress } from '../../solver/result';

interface SearchStatsProps {
  progress: SolveProgress | null;
  elapsedMs: number;
}

export default function SearchStats({ progress, elapsedMs }: SearchStatsProps) {
  const items: { label: string; value: string; hint: string }[] = [
    {
      label: '访问节点',
      value: String(progress?.visitedNodes ?? 0),
      hint: '算法检查过的局面总数',
    },
    {
      label: '展开节点',
      value: String(progress?.expandedNodes ?? 0),
      hint: '从待处理集合中取出、并生成了后继局面的局面数',
    },
    {
      label: '生成节点',
      value: String(progress?.generatedNodes ?? 0),
      hint: '生成出的后继局面总数（包含重复的）',
    },
    {
      label: '跳过节点',
      value: String(progress?.skippedNodes ?? 0),
      hint: '因为和已访问过的局面重复而被丢弃的后继',
    },
    {
      label: '当前深度',
      value: String(progress?.depth ?? 0),
      hint: '正在处理的局面距起始局面有多少步',
    },
    {
      label: '队列大小',
      value: String(progress?.queueSize ?? 0),
      hint: '还没处理的局面数量（BFS 是普通队列，A* 是优先队列）',
    },
    {
      label: '耗时',
      value: `${(elapsedMs / 1000).toFixed(1)} 秒`,
      hint: '从点「开始搜索」到现在经过的时间',
    },
  ];

  return (
    <section className="search-stats" aria-label="搜索统计">
      <div className="panel-head">
        <h3>实时统计</h3>
        <p className="panel-head__hint">
          搜索进行中每 0.15 秒刷新一次；鼠标移到任一指标上可看解释。
        </p>
      </div>
      <div className="search-stats__grid">
        {items.map((item) => (
          <div key={item.label} className="search-stats__item" title={item.hint}>
            <span className="search-stats__label">{item.label}</span>
            <span className="search-stats__value">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
