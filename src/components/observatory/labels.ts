/**
 * 求解结束原因的共享文案。
 * 游戏页与观测台都要把 SolveResult.reason 翻译成给人看的话，因此在组件层共享，
 * 避免在两处各维护一份映射。
 */
import type { SolveEndReason } from '../../solver/result';

export const END_REASON_LABELS: Record<SolveEndReason, string> = {
  solved: '已解出',
  'already-solved': '初始即完成',
  unsolvable: '无解',
  'state-limit': '达到状态上限',
  timeout: '超时',
  cancelled: '已取消',
};

/**
 * 未解出时给用户的完整解释。
 * 关键：**超时 ≠ 无解**。把超时显示成「无解」是对用户的误导，
 * 必须按 reason 分别如实说明。
 */
export const UNRESOLVED_HINTS: Record<
  Exclude<SolveEndReason, 'solved' | 'already-solved'>,
  string
> = {
  unsolvable: '当前局面无解：搜索空间已穷尽，目标棋子无法到达出口。',
  'state-limit': '已达到状态数上限，未能在上限内解出。可改用其他算法重试。',
  timeout:
    '求解超时：该算法在这个谜题上耗时过长。建议改用 BFS 或 A*（两者在经典谜题上通常只需数百毫秒）。',
  cancelled: '已停止求解。',
};

/** 未解出时的说明文案；若原因本身表示已解出则返回空串。用于 UI 的 !solved 分支。 */
export function unresolvedHint(reason: SolveEndReason): string {
  if (reason === 'solved' || reason === 'already-solved') return '';
  return UNRESOLVED_HINTS[reason];
}

