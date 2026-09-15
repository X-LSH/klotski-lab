/**
 * 游戏状态管理 hook。
 * 只负责状态桥接：所有移动合法性都经由 core 的 canMove / applyMove 判断，
 * 不在组件层复制任何规则逻辑。
 *
 * 使用 useReducer 保证：同一批次内的多次 dispatch 都基于最新状态校验，
 * 且 StrictMode 下不会出现重复应用移动的副作用。
 */
import { useCallback, useMemo, useReducer } from 'react';
import type { GameState, Move, PuzzleDefinition } from '../types';
import { applyMove, canMove, isSolved } from '../core/rules';
import { oppositeDirection } from '../core/move';
import { createInitialState } from '../core/state';
import type { SavedProgress } from '../storage/local-storage';

interface GameStore {
  state: GameState;
  undoStack: Move[];
  redoStack: Move[];
}

type GameAction =
  | { type: 'move'; move: Move }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' };

function createStore(puzzle: PuzzleDefinition, restore?: SavedProgress | null): GameStore {
  if (restore && restore.history) {
    // 从存档恢复：以初始状态为底，套用保存的坐标与历史
    const state = createInitialState(puzzle);
    state.pieces = state.pieces.map((piece) => {
      const saved = restore.positions[piece.id];
      return saved ? { ...piece, x: saved.x, y: saved.y } : piece;
    });
    return { state, undoStack: restore.history, redoStack: [] };
  }
  return { state: createInitialState(puzzle), undoStack: [], redoStack: [] };
}

function gameReducer(puzzle: PuzzleDefinition, store: GameStore, action: GameAction): GameStore {
  switch (action.type) {
    case 'move': {
      // 非法移动：状态不变（reducer 基于最新状态校验，杜绝过期闭包）
      if (!canMove(store.state, puzzle, action.move)) return store;
      return {
        state: applyMove(store.state, puzzle, action.move),
        undoStack: [...store.undoStack, action.move],
        // 新 Move 执行以后清空 Redo Stack
        redoStack: [],
      };
    }
    case 'undo': {
      const last = store.undoStack[store.undoStack.length - 1];
      if (!last) return store;
      const inverse: Move = {
        pieceId: last.pieceId,
        direction: oppositeDirection(last.direction),
        steps: last.steps,
      };
      return {
        state: applyMove(store.state, puzzle, inverse),
        undoStack: store.undoStack.slice(0, -1),
        redoStack: [...store.redoStack, last],
      };
    }
    case 'redo': {
      const next = store.redoStack[store.redoStack.length - 1];
      if (!next) return store;
      return {
        state: applyMove(store.state, puzzle, next),
        undoStack: [...store.undoStack, next],
        redoStack: store.redoStack.slice(0, -1),
      };
    }
    case 'reset':
      return createStore(puzzle);
  }
}

export interface UseGameResult {
  state: GameState;
  moveCount: number;
  canUndo: boolean;
  canRedo: boolean;
  solved: boolean;
  /** 已执行的全部移动（按顺序），用于进度存档 */
  history: Move[];
  /** 执行一次移动；基于当前状态预判，reducer 会基于最新状态再次校验 */
  doMove: (move: Move) => boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export function useGame(puzzle: PuzzleDefinition, restore?: SavedProgress | null): UseGameResult {
  const [store, dispatch] = useReducer(
    (store: GameStore, action: GameAction) => gameReducer(puzzle, store, action),
    puzzle,
    (p: PuzzleDefinition) => createStore(p, restore),
  );

  const doMove = useCallback(
    (move: Move): boolean => {
      // 返回值基于当前渲染状态预判；reducer 会基于最新状态再次校验，
      // 因此同一批次内的连续移动也能正确生效。
      const legal = canMove(store.state, puzzle, move);
      dispatch({ type: 'move', move });
      return legal;
    },
    [store.state, puzzle],
  );

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const solved = useMemo(() => isSolved(store.state, puzzle), [store.state, puzzle]);

  return {
    state: store.state,
    moveCount: store.undoStack.length,
    canUndo: store.undoStack.length > 0,
    canRedo: store.redoStack.length > 0,
    solved,
    history: store.undoStack,
    doMove,
    undo,
    redo,
    reset,
  };
}
