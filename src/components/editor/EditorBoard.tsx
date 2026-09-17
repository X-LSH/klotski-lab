/**
 * 编辑器棋盘：放置 / 选择 / 拖动棋子，设置出口。
 * 编辑过程允许暂时非法（重叠、越界），最终合法性由 validatePuzzle 裁决。
 * 编辑器操作的唯一数据源就是 PuzzleDefinition。
 */
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Piece, PuzzleDefinition } from '../../types';
import { rectsOverlap, rectOfPiece } from '../../core/piece';

/** 编辑器工具 */
export type EditorTool = 'select' | 'erase' | 'exit' | 'add-1x1' | 'add-1x2' | 'add-2x1' | 'add-2x2';

interface EditorBoardProps {
  puzzle: PuzzleDefinition;
  tool: EditorTool;
  selectedId: string | null;
  onSelect: (pieceId: string | null) => void;
  onAddPiece: (width: number, height: number, x: number, y: number) => void;
  onMovePiece: (pieceId: string, x: number, y: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onSetExit: (x: number, y: number) => void;
}

interface DragInfo {
  pieceId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  boardRect: DOMRect;
}

const ADD_SIZES: Record<string, { width: number; height: number }> = {
  'add-1x1': { width: 1, height: 1 },
  'add-1x2': { width: 1, height: 2 },
  'add-2x1': { width: 2, height: 1 },
  'add-2x2': { width: 2, height: 2 },
};

export default function EditorBoard({
  puzzle,
  tool,
  selectedId,
  onSelect,
  onAddPiece,
  onMovePiece,
  onRemovePiece,
  onSetExit,
}: EditorBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const { width: boardW, height: boardH } = puzzle.board;

  /** 把指针坐标换算为棋盘格子坐标 */
  const cellFromEvent = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = Math.floor(((clientX - rect.left) / rect.width) * boardW);
    const y = Math.floor(((clientY - rect.top) / rect.height) * boardH);
    return { x, y };
  };

  /** 找出与给定棋子重叠的其他棋子 id（用于红色警示边框） */
  const overlappingIds = new Set<string>();
  for (let i = 0; i < puzzle.pieces.length; i++) {
    for (let j = i + 1; j < puzzle.pieces.length; j++) {
      if (rectsOverlap(rectOfPiece(puzzle.pieces[i]), rectOfPiece(puzzle.pieces[j]))) {
        overlappingIds.add(puzzle.pieces[i].id);
        overlappingIds.add(puzzle.pieces[j].id);
      }
    }
  }

  const handleBoardClick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const { x, y } = cellFromEvent(event.clientX, event.clientY, rect);
    if (x < 0 || y < 0 || x >= boardW || y >= boardH) return;
    const addSize = ADD_SIZES[tool];
    if (addSize) {
      onAddPiece(addSize.width, addSize.height, x, y);
    } else if (tool === 'exit') {
      onSetExit(x, y);
    } else if (tool === 'select') {
      onSelect(null);
    }
  };

  const handlePiecePointerDown = (piece: Piece, event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (tool === 'erase') {
      onRemovePiece(piece.id);
      return;
    }
    if (tool !== 'select') return;
    onSelect(piece.id);
    if (!boardRef.current) return;
    // 指针捕获让拖动在指针离开元素后仍能持续；
    // jsdom 与部分旧 WebView 不实现该 API，缺失时跳过 —— 选中与拖动逻辑不依赖它
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pieceId: piece.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: piece.x,
      originY: piece.y,
      boardRect: boardRef.current.getBoundingClientRect(),
    };
  };

  const handlePiecePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const info = dragRef.current;
    if (!info) return;
    const cellW = info.boardRect.width / boardW;
    const cellH = info.boardRect.height / boardH;
    const dx = Math.round((event.clientX - info.startClientX) / cellW);
    const dy = Math.round((event.clientY - info.startClientY) / cellH);
    if (dx === 0 && dy === 0) return;
    dragRef.current = { ...info, startClientX: event.clientX, startClientY: event.clientY };
    const piece = puzzle.pieces.find((p) => p.id === info.pieceId);
    if (!piece) return;
    // 拖动只限制在棋盘范围内；重叠留给 Validate 报告
    const nx = Math.min(Math.max(piece.x + dx, 0), boardW - piece.width);
    const ny = Math.min(Math.max(piece.y + dy, 0), boardH - piece.height);
    if (nx !== piece.x || ny !== piece.y) onMovePiece(info.pieceId, nx, ny);
  };

  const handlePiecePointerUp = () => {
    dragRef.current = null;
  };

  const exit = puzzle.board.exit;

  return (
    <div
      ref={boardRef}
      className="board editor-board"
      style={{ aspectRatio: `${boardW} / ${boardH}` }}
      data-testid="editor-board"
      onPointerDown={handleBoardClick}
    >
      <div
        className="board__grid"
        aria-hidden="true"
        style={{ gridTemplateColumns: `repeat(${boardW}, 1fr)` }}
      >
        {Array.from({ length: boardW * boardH }, (_, i) => (
          <div key={i} className="board__cell" />
        ))}
      </div>
      {exit && (
        <div
          className="board__exit"
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
      {puzzle.pieces.map((piece) => {
        const isSelected = piece.id === selectedId;
        const classes = [
          'piece',
          // 编辑器的棋子可点选 / 可拖动，需要悬停提示
          'piece--editable',
          piece.id === puzzle.goal.pieceId ? 'piece--goal' : '',
          isSelected ? 'piece--selected' : '',
          overlappingIds.has(piece.id) ? 'piece--overlap' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={piece.id}
            className={classes}
            role="button"
            /* 把「已选中」也告诉辅助技术：视觉之外再多一条通路 */
            aria-pressed={isSelected}
            aria-label={`编辑棋子 ${piece.label ?? piece.id}`}
            style={{
              left: `${(piece.x / boardW) * 100}%`,
              top: `${(piece.y / boardH) * 100}%`,
              width: `${(piece.width / boardW) * 100}%`,
              height: `${(piece.height / boardH) * 100}%`,
            }}
            onPointerDown={(e) => handlePiecePointerDown(piece, e)}
            onPointerMove={handlePiecePointerMove}
            onPointerUp={handlePiecePointerUp}
            onPointerCancel={handlePiecePointerUp}
          >
            <span className="piece__label">{piece.label ?? piece.id}</span>
          </div>
        );
      })}
    </div>
  );
}
