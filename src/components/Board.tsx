/**
 * 棋盘组件：响应式渲染 + 鼠标 / 触摸拖动。
 * 拖动只负责“意图识别”（方向与步数），是否可移动完全由 core 判断；
 * 释放时若目标位置非法则回弹，UI 绝不直接修改棋子坐标。
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Direction, GameState, Move, PuzzleDefinition } from '../types';
import { maxStepsInDirection } from '../core/rules';
import Piece from './Piece';

interface BoardProps {
  puzzle: PuzzleDefinition;
  state: GameState;
  interactive: boolean;
  /** 执行移动；返回是否成功（非法时组件回弹） */
  onMove: (move: Move) => boolean;
}

interface DragInfo {
  pieceId: string;
  startClientX: number;
  startClientY: number;
  boardRect: DOMRect;
}

export default function Board({ puzzle, state, interactive, onMove }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const [dragOffset, setDragOffset] = useState<{
    pieceId: string;
    dx: number;
    dy: number;
  } | null>(null);

  const { width: boardW, height: boardH } = puzzle.board;

  /** 把像素位移换算为格数，并按主轴方向截断到合法范围 */
  const computeClampedCells = (info: DragInfo, clientX: number, clientY: number) => {
    const cellW = info.boardRect.width / boardW;
    const cellH = info.boardRect.height / boardH;
    const deltaX = (clientX - info.startClientX) / cellW;
    const deltaY = (clientY - info.startClientY) / cellH;
    const axis: 'x' | 'y' = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
    const raw = axis === 'x' ? deltaX : deltaY;
    const direction: Direction =
      axis === 'x' ? (raw > 0 ? 'right' : 'left') : raw > 0 ? 'down' : 'up';
    const maxSteps = maxStepsInDirection(state, puzzle, info.pieceId, direction);
    const clamped = Math.sign(raw) * Math.min(Math.abs(raw), maxSteps);
    return { axis, direction, cells: clamped };
  };

  const handleDragStart = (pieceId: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || !boardRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pieceId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      boardRect: boardRef.current.getBoundingClientRect(),
    };
    setDragOffset({ pieceId, dx: 0, dy: 0 });
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const info = dragRef.current;
    if (!info) return;
    const { axis, cells } = computeClampedCells(info, event.clientX, event.clientY);
    setDragOffset({
      pieceId: info.pieceId,
      dx: axis === 'x' ? cells : 0,
      dy: axis === 'y' ? cells : 0,
    });
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const info = dragRef.current;
    if (!info) return;
    dragRef.current = null;
    setDragOffset(null);
    const { direction, cells } = computeClampedCells(info, event.clientX, event.clientY);
    const steps = Math.round(Math.abs(cells));
    if (steps < 1) return; // 未移动一格，直接回弹
    // 合法性由 core 最终裁决；失败则自然回弹（状态不变）
    onMove({ pieceId: info.pieceId, direction, steps });
  };

  const exit = puzzle.board.exit;

  return (
    <div
      ref={boardRef}
      className="board"
      style={{ aspectRatio: `${boardW} / ${boardH}` }}
      data-testid="board"
    >
      {/* 背景格子 */}
      <div
        className="board__grid"
        aria-hidden="true"
        style={{ gridTemplateColumns: `repeat(${boardW}, 1fr)` }}
      >
        {Array.from({ length: boardW * boardH }, (_, i) => (
          <div key={i} className="board__cell" />
        ))}
      </div>
      {/* 出口标记 */}
      {exit && (
        <div
          className="board__exit"
          aria-label="出口"
          style={{
            left: `${(exit.x / boardW) * 100}%`,
            top: `${(exit.y / boardH) * 100}%`,
            width: `${(exit.width / boardW) * 100}%`,
            height: `${(exit.height / boardH) * 100}%`,
          }}
        >
          出口
        </div>
      )}
      {/* 棋子 */}
      {state.pieces.map((piece) => (
        <Piece
          key={piece.id}
          piece={piece}
          boardWidth={boardW}
          boardHeight={boardH}
          isGoal={piece.id === puzzle.goal.pieceId}
          interactive={interactive}
          dragOffset={
            dragOffset && dragOffset.pieceId === piece.id
              ? { dx: dragOffset.dx / piece.width, dy: dragOffset.dy / piece.height }
              : null
          }
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
