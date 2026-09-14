/**
 * 步数与最优解统计。
 */
interface MoveCounterProps {
  moves: number;
  optimal: number | null;
}

export default function MoveCounter({ moves, optimal }: MoveCounterProps) {
  return (
    <div className="move-counter" aria-label="步数统计">
      <div className="move-counter__item">
        <span className="move-counter__label">步数</span>
        <span className="move-counter__value">{moves}</span>
      </div>
      <div className="move-counter__item">
        <span className="move-counter__label">最优</span>
        <span className="move-counter__value">{optimal ?? '—'}</span>
      </div>
      <div className="move-counter__item">
        <span className="move-counter__label">效率</span>
        <span className="move-counter__value">
          {optimal !== null && moves > 0 ? `${Math.round((optimal / moves) * 100)}%` : '—'}
        </span>
      </div>
    </div>
  );
}
