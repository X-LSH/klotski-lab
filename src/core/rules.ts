/**
 * 核心移动规则与目标判断。
 * 这是唯一实现游戏规则的地方：UI 与求解器都必须通过本模块，
 * 不允许在其他任何地方复制碰撞 / 越界逻辑。
 */
import type { Direction, GameState, Move, Piece, PuzzleDefinition } from '../types';
import { isBlocked, rectInBounds } from './board';
import { DIRECTION_DELTAS, ALL_DIRECTIONS } from './move';
import { rectCovers, rectOfPiece, rectsOverlap } from './piece';
import { cloneState, findPiece } from './state';

/** 构建“其他棋子”占据格子的集合（key = "x,y"），用于碰撞检测 */
function occupiedCells(state: GameState, excludeId: string): Set<string> {
  const cells = new Set<string>();
  for (const p of state.pieces) {
    if (p.id === excludeId) continue;
    for (let dy = 0; dy < p.height; dy++) {
      for (let dx = 0; dx < p.width; dx++) {
        cells.add(`${p.x + dx},${p.y + dy}`);
      }
    }
  }
  return cells;
}

/**
 * 判断一次移动是否合法：
 * - 棋子必须存在，steps ≥ 1
 * - 每一步都不能越界、不能进入封锁格、不能撞击其他棋子
 * - 只能沿水平或垂直方向移动
 */
export function canMove(state: GameState, puzzle: PuzzleDefinition, move: Move): boolean {
  if (!Number.isInteger(move.steps) || move.steps < 1) return false;
  const piece = findPiece(state, move.pieceId);
  if (!piece) return false;
  const { dx, dy } = DIRECTION_DELTAS[move.direction];
  const occupied = occupiedCells(state, piece.id);

  let x = piece.x;
  let y = piece.y;
  for (let i = 0; i < move.steps; i++) {
    x += dx;
    y += dy;
    const next = { x, y, width: piece.width, height: piece.height };
    // 不能越界
    if (!rectInBounds(puzzle.board, next)) return false;
    // 逐格检查：不能进入封锁格、不能穿过被占据的格子
    for (let gy = 0; gy < piece.height; gy++) {
      for (let gx = 0; gx < piece.width; gx++) {
        const cx = x + gx;
        const cy = y + gy;
        if (isBlocked(puzzle.board, cx, cy)) return false;
        if (occupied.has(`${cx},${cy}`)) return false;
      }
    }
  }
  return true;
}

/**
 * 枚举当前状态下的全部合法单位移动（每个棋子 × 四个方向 × 1 格）。
 * 多格位移可由连续的单位移动组合得到，保证搜索时步数统计一致。
 *
 * 性能说明：占用格集合只构建一次（cell -> pieceId），
 * 而不是像 canMove 那样每次调用都重建，求解器热路径依赖这一点。
 */
export function getLegalMoves(state: GameState, puzzle: PuzzleDefinition): Move[] {
  // cell key -> 占据它的棋子 id
  const occupancy = new Map<string, string>();
  for (const p of state.pieces) {
    for (let dy = 0; dy < p.height; dy++) {
      for (let dx = 0; dx < p.width; dx++) {
        occupancy.set(`${p.x + dx},${p.y + dy}`, p.id);
      }
    }
  }

  const moves: Move[] = [];
  for (const piece of state.pieces) {
    for (const direction of ALL_DIRECTIONS) {
      const { dx, dy } = DIRECTION_DELTAS[direction];
      const x = piece.x + dx;
      const y = piece.y + dy;
      const next = { x, y, width: piece.width, height: piece.height };
      if (!rectInBounds(puzzle.board, next)) continue;
      let legal = true;
      for (let gy = 0; gy < piece.height && legal; gy++) {
        for (let gx = 0; gx < piece.width && legal; gx++) {
          const cx = x + gx;
          const cy = y + gy;
          if (isBlocked(puzzle.board, cx, cy)) {
            legal = false;
            break;
          }
          const occupant = occupancy.get(`${cx},${cy}`);
          if (occupant !== undefined && occupant !== piece.id) legal = false;
        }
      }
      if (legal) moves.push({ pieceId: piece.id, direction, steps: 1 });
    }
  }
  return moves;
}

/**
 * 应用一次移动，返回新状态（不可变语义：不修改传入的 state）。
 * 非法移动会抛出异常，调用方应先用 canMove 判断。
 */
export function applyMove(state: GameState, puzzle: PuzzleDefinition, move: Move): GameState {
  if (!canMove(state, puzzle, move)) {
    throw new Error(`非法移动：棋子 ${move.pieceId} 无法向 ${move.direction} 移动 ${move.steps} 格`);
  }
  return applyLegalMove(state, move);
}

/**
 * 不校验合法性直接应用移动（求解器热路径专用）。
 * 调用方必须保证移动来自 getLegalMoves 或已通过 canMove 校验。
 */
export function applyLegalMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const piece = findPiece(next, move.pieceId) as Piece;
  const { dx, dy } = DIRECTION_DELTAS[move.direction];
  piece.x += dx * move.steps;
  piece.y += dy * move.steps;
  return next;
}

/**
 * 目标判断：由 PuzzleDefinition 的 goal 定义，不写死任何角色。
 * - reach-exit：目标棋子完整覆盖棋盘出口区域
 * - occupy-area：目标棋子完整覆盖指定目标区域
 */
export function isSolved(state: GameState, puzzle: PuzzleDefinition): boolean {
  const piece = findPiece(state, puzzle.goal.pieceId);
  if (!piece) return false;
  const pieceRect = rectOfPiece(piece);
  if (puzzle.goal.type === 'reach-exit') {
    return puzzle.board.exit !== undefined && rectCovers(pieceRect, puzzle.board.exit);
  }
  return puzzle.goal.area !== undefined && rectCovers(pieceRect, puzzle.goal.area);
}

/**
 * 沿某方向最多能连续移动多少格（供拖动吸附使用）。
 */
export function maxStepsInDirection(
  state: GameState,
  puzzle: PuzzleDefinition,
  pieceId: string,
  direction: Direction,
): number {
  let steps = 0;
  while (canMove(state, puzzle, { pieceId, direction, steps: steps + 1 })) {
    steps += 1;
  }
  return steps;
}

/** 两个棋子（矩形）是否重叠（供编辑器 / 校验器复用） */
export function piecesOverlap(a: Piece, b: Piece): boolean {
  return rectsOverlap(rectOfPiece(a), rectOfPiece(b));
}
