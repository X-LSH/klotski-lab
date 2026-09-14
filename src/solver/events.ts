/**
 * 搜索事件模型（观测层专用）。
 *
 * 轻量原则：事件只携带 stateKey / depth / move 等小字段，
 * 绝不把完整 GameState 无限制发送给 UI；
 * 事件量最大的 node_skip 由 Worker 层负责节流 / 计数转发。
 */
import type { Move } from '../types';
import type { SolveEndReason } from './result';

export type SearchEventType =
  | 'search_start'
  | 'node_expand'
  | 'node_generate'
  | 'node_skip'
  | 'goal_found'
  | 'search_end';

export interface SearchEvent {
  type: SearchEventType;
  /** 当前节点（规范化状态键） */
  stateKey?: string;
  /** 父节点（node_generate 时携带） */
  parentKey?: string;
  /** 导致该节点的移动（node_generate 时携带） */
  move?: Move;
  depth?: number;
  /** search_end 时携带结束原因 */
  reason?: SolveEndReason;
}
