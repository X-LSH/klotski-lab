/**
 * 搜索时间线：访问 / 展开节点随时间变化的 SVG 折线图。
 */
export interface TimelinePoint {
  elapsedMs: number;
  visitedNodes: number;
  expandedNodes: number;
}

interface SearchTimelineProps {
  points: TimelinePoint[];
}

const W = 560;
const H = 120;
const PAD = 8;

export default function SearchTimeline({ points }: SearchTimelineProps) {
  if (points.length < 2) {
    return (
      <div className="search-timeline" aria-label="搜索时间线">
        <h3>搜索时间线</h3>
        <p className="search-timeline__empty">求解进行中会记录访问 / 展开节点随时间的变化。</p>
      </div>
    );
  }

  const maxT = Math.max(...points.map((p) => p.elapsedMs), 1);
  const maxV = Math.max(...points.map((p) => Math.max(p.visitedNodes, p.expandedNodes)), 1);

  const toXY = (p: TimelinePoint, key: 'visitedNodes' | 'expandedNodes') => {
    const x = PAD + (p.elapsedMs / maxT) * (W - PAD * 2);
    const y = H - PAD - (p[key] / maxV) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const visitedLine = points.map((p) => toXY(p, 'visitedNodes')).join(' ');
  const expandedLine = points.map((p) => toXY(p, 'expandedNodes')).join(' ');

  return (
    <div className="search-timeline" aria-label="搜索时间线">
      <h3>搜索时间线</h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="节点随时间变化折线图">
        <polyline points={visitedLine} className="search-timeline__line search-timeline__line--visited" />
        <polyline
          points={expandedLine}
          className="search-timeline__line search-timeline__line--expanded"
        />
      </svg>
      <div className="search-timeline__legend">
        <span className="search-timeline__dot search-timeline__dot--visited" /> 访问节点
        <span className="search-timeline__dot search-timeline__dot--expanded" /> 展开节点
      </div>
    </div>
  );
}
