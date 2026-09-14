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
  /** 拖动中的视觉偏移（格，可为小数） */
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
  const left = (piece.x / boardWidth) * 100;
  const top = (piece.y / boardHeight) * 100;
  const width = (piece.width / boardWidth) * 100;
  const height = (piece.height / boardHeight) * 100;

  const style: CSSProperties = {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    transform: dragOffset
      ? `translate(${dragOffset.dx * 100}%, ${dragOffset.dy * 100}%)`
      : undefined,
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
