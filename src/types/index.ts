/**
 * 全局共享类型定义。
 * 说明：本文件只包含纯数据类型，不包含任何逻辑，也不依赖 React / DOM。
 */

/** 移动方向：仅支持水平或垂直 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** 单元格坐标（x 列、y 行，从 0 开始） */
export interface Cell {
  x: number;
  y: number;
}

/** 矩形区域（左上角 + 宽高，单位为格） */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 棋子类型：按几何尺寸描述，不写死经典角色 */
export type PieceType = '1x1' | '1x2' | '2x1' | '2x2' | 'custom';

/** 棋子：支持任意矩形 */
export interface Piece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PieceType;
  /** 可选的显示名称（如经典谜题中的“曹操”），核心逻辑不依赖它 */
  label?: string;
}

/** 棋盘定义：尺寸不写死为 4×5 */
export interface BoardDef {
  width: number;
  height: number;
  /** 出口区域（可选），供 reach-exit 目标使用 */
  exit?: Rect;
  /** 被封锁、不可进入的格子（可选） */
  blocked?: Cell[];
}

/** 目标类型：棋子到达出口 / 棋子占据目标区域 */
export type GoalType = 'reach-exit' | 'occupy-area';

/** 目标定义：由 PuzzleDefinition 描述，不写死具体角色 */
export interface GoalDef {
  /** 目标棋子的 id */
  pieceId: string;
  type: GoalType;
  /** occupy-area 类型的目标区域 */
  area?: Rect;
}

/** 谜题定义：核心与编辑器的唯一数据源 */
export interface PuzzleDefinition {
  /** 结构版本号，用于导入 / 分享时的兼容判断 */
  version: 1;
  name: string;
  board: BoardDef;
  pieces: Piece[];
  goal: GoalDef;
}

/** 游戏状态：只保存所有棋子的位置信息，不含任何 UI 数据 */
export interface GameState {
  pieces: Piece[];
}

/** 一次完整合法位移（steps ≥ 1，沿单一方向） */
export interface Move {
  pieceId: string;
  direction: Direction;
  steps: number;
}
