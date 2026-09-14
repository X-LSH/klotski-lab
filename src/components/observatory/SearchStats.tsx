/**
 * 搜索实时统计面板。
 */
import type { SolveProgress } from '../../solver/result';

interface SearchStatsProps {
  progress: SolveProgress | null;
  elapsedMs: number;
}

export default function SearchStats({ progress, elapsedMs }: SearchStatsProps) {
  const items: { label: string; value: string }[] = [
    { label: '访问节点', value: String(progress?.visitedNodes ?? 0) },
    { label: '展开节点', value: String(progress?.expandedNodes ?? 0) },
    { label: '生成节点', value: String(progress?.generatedNodes ?? 0) },
    { label: '跳过节点', value: String(progress?.skippedNodes ?? 0) },
    { label: '当前深度', value: String(progress?.depth ?? 0) },
    { label: '队列大小', value: String(progress?.queueSize ?? 0) },
    { label: '耗时', value: `${(elapsedMs / 1000).toFixed(1)} 秒` },
  ];
  return (
    <div className="search-stats" aria-label="搜索统计">
      {items.map((item) => (
        <div key={item.label} className="search-stats__item">
          <span className="search-stats__label">{item.label}</span>
          <span className="search-stats__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
