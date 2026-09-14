/**
 * 游戏状态的不可变操作。
 * GameState 只保存棋子位置，不包含 React 状态 / DOM / CSS / Canvas 等 UI 数据。
 */
import type { GameState, Piece, PuzzleDefinition } from '../types';

/** 由谜题定义创建初始游戏状态（深拷贝，互不影响） */
export function createInitialState(puzzle: PuzzleDefinition): GameState {
  return {
    pieces: puzzle.pieces.map((p) => ({ ...p })),
  };
}

/** 深拷贝状态（棋子为扁平对象，逐个复制即可） */
export function cloneState(state: GameState): GameState {
  return {
    pieces: state.pieces.map((p) => ({ ...p })),
  };
}

/**
 * 生成确定性状态键：
 * 先按棋子 id 排序，再拼接 “id:x,y”，因此同样的棋盘状态必然得到完全一致的 key。
 */
export function stateKey(state: GameState): string {
  return state.pieces
    .map((p: Piece) => `${p.id}:${p.x},${p.y}`)
    .sort()
    .join('|');
}

/** 状态相等性判断（基于确定性 stateKey，与棋子数组顺序无关） */
export function stateEquals(a: GameState, b: GameState): boolean {
  return stateKey(a) === stateKey(b);
}

/** 在状态中查找棋子（不存在时返回 undefined） */
export function findPiece(state: GameState, pieceId: string): Piece | undefined {
  return state.pieces.find((p) => p.id === pieceId);
}
