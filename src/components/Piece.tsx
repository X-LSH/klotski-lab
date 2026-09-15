/**
 * 棋子组件：纯展示 + 拖动事件透传，不包含任何规则逻辑。
 */
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Piece as PieceData } from '../types';

interface PieceProps {
  piece: PieceData;
  boardWidth: number;
  boardHeight: number;
  isGoal: boolean;
  interactive: boolean;
  /** 拖动中的视觉偏移（单位：格，可为小数，也可因橡胶缓冲略超出合法范围） */
  dragOffset: { dx: number; dy: number } | null;
  onDragStart: (pieceId: string, event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export default function Piece({
  piece,
  boardWidth,
  boardHeight,
  isGoal,
  interactive,
  dragOffset,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PieceProps) {
  const width = (piece.width / boardWidth) * 100;
  const height = (piece.height / boardHeight) * 100;

  // 位置与拖拽位移统一由 transform 表达，这是让动效成立的关键：
  // translate 的百分比以元素自身尺寸为基准，而元素宽度 = 棋盘宽 × (piece.width / boardWidth)，
  // 所以 1 格恰好等于自身宽度的 (100 / piece.width)%，即 x 格 = (x / piece.width) × 100%。
  // 于是「落子」与「拖动」共用同一个属性，释放瞬间浏览器从手指离开时的真实位置
  // 连续收敛到目标格，无需任何额外的中间状态；位移不足一格时自然表现为橡胶回弹。
  const tx = ((piece.x + (dragOffset?.dx ?? 0)) / piece.width) * 100;
  const ty = ((piece.y + (dragOffset?.dy ?? 0)) / piece.height) * 100;

  const style: CSSProperties = {
    left: 0,
    top: 0,
    width: `${width}%`,
    height: `${height}%`,
    // scale 只负责「棋子与格线之间留白」以及按下 / 拎起的反馈，由 CSS 变量控制；
    // 它围绕元素中心缩放，因此不会破坏上面算出的格位对齐。
    transform: `translate(${tx}%, ${ty}%) scale(var(--piece-scale, 0.94))`,
  };

  const className = [
    'piece',
    `piece--${piece.width}x${piece.height}`,
    isGoal ? 'piece--goal' : '',
    dragOffset ? 'piece--dragging' : '',
    interactive ? 'piece--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      style={style}
      role="button"
      aria-label={`棋子 ${piece.label ?? piece.id}`}
      data-piece-id={piece.id}
      onPointerDown={(e) => onDragStart(piece.id, e)}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <span className="piece__label">{piece.label ?? piece.id}</span>
    </div>
  );
}
