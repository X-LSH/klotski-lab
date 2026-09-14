/**
 * 观测台共享文案。
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
