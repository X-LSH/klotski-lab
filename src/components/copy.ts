/**
 * 界面共享文案。
 * 难度分档在多个页面都要显示（首页关卡一览、游戏页谜题切换器），
 * 集中在这里，避免各处各写一份映射。
 */
import type { DifficultyTier } from '../generator/difficulty';

export const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  easy: '入门',
  normal: '进阶',
  hard: '困难',
  expert: '专家',
};
