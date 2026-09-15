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

  /** 像素位移换算为主轴方向与格数（未截断，可超出合法范围） */
  const rawDragCells = (info: DragInfo, clientX: number, clientY: number) => {
    const cellW = info.boardRect.width / boardW;
    const cellH = info.boardRect.height / boardH;
    const deltaX = (clientX - info.startClientX) / cellW;
    const deltaY = (clientY - info.startClientY) / cellH;
    const axis: 'x' | 'y' = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
    const raw = axis === 'x' ? deltaX : deltaY;
    const direction: Direction =
      axis === 'x' ? (raw > 0 ? 'right' : 'left') : raw > 0 ? 'down' : 'up';
    return { axis, direction, raw };
  };

  /** 唯一决定「实际移动几格」的硬截断 */
  const clampCells = (raw: number, maxSteps: number) =>
    Math.sign(raw) * Math.min(Math.abs(raw), maxSteps);

  /**
   * 橡胶缓冲（对齐 Apple「边界使用橡胶缓冲，而非硬截断」）：
   * 超出合法范围后仍可继续拖动，但位移按双曲衰减、渐近收敛到 RUBBER_MAX_CELLS，
   * 而不是硬生生卡住不动。松手时仍以硬截断结果落子，因此视觉余量不影响移动合法性。
   */
  const RUBBER_MAX_CELLS = 1.6;
  const rubberBand = (overflow: number) => {
    const x = (overflow * 0.55) / RUBBER_MAX_CELLS;
    return (1 - 1 / (x + 1)) * RUBBER_MAX_CELLS;
  };

  /** 视觉位移：合法范围内 1:1 跟随，超出部分走橡胶衰减 */
  const visualCells = (raw: number, maxSteps: number) => {
    const clamped = clampCells(raw, maxSteps);
    const overflow = Math.abs(raw) - Math.abs(clamped);
    if (overflow <= 0) return clamped;
    return clamped + Math.sign(raw) * rubberBand(overflow);
  };

  /** 当前拖拽在该方向上的合法步数上限 */
  const maxStepsFor = (pieceId: string, direction: Direction) =>
    maxStepsInDirection(state, puzzle, pieceId, direction);

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
    const { axis, direction, raw } = rawDragCells(info, event.clientX, event.clientY);
    const cells = visualCells(raw, maxStepsFor(info.pieceId, direction));
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
    // 落子步数取硬截断结果（不含橡胶余量），合法性仍由 core 最终裁决
    const { direction, raw } = rawDragCells(info, event.clientX, event.clientY);
    const steps = Math.round(Math.abs(clampCells(raw, maxStepsFor(info.pieceId, direction))));
    if (steps < 1) return; // 未移动一格，直接回弹
    // 失败则自然回弹（状态不变）
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
            dragOffset?.pieceId === piece.id ? { dx: dragOffset.dx, dy: dragOffset.dy } : null
          }
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
