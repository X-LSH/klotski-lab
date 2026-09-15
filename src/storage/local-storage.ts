/**
 * localStorage 持久化层。
 * - 统一带版本号的 JSON 序列化；
 * - 所有读写都有 try/catch 保护（隐私模式 / 配额不足时静默降级）；
 * - 只保存必要数据，绝不保存大型求解搜索树。
 */

const PREFIX = 'klotski-lab:v1:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as { version: number; data: T };
    if (parsed.version !== 1) return fallback; // 版本不兼容时丢弃旧数据
    return parsed.data;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ version: 1, data }));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* 忽略 */
  }
}

/* ===== 我的谜题 ===== */

export interface SavedPuzzle {
  id: string;
  name: string;
  savedAt: number;
  puzzle: import('../types').PuzzleDefinition;
}

export function loadMyPuzzles(): SavedPuzzle[] {
  return read<SavedPuzzle[]>('my-puzzles', []);
}

export function saveMyPuzzles(list: SavedPuzzle[]): boolean {
  return write('my-puzzles', list);
}

/* ===== 游戏进度（单局：继续上次未完成的对局） ===== */

export interface SavedProgress {
  puzzle: import('../types').PuzzleDefinition;
  /** 各棋子当前坐标 */
  positions: Record<string, { x: number; y: number }>;
  /** 已执行的全部移动（用于恢复撤销历史） */
  history: import('../types').Move[];
  moveCount: number;
  savedAt: number;
}

export function loadProgress(): SavedProgress | null {
  return read<SavedProgress | null>('progress', null);
}

export function saveProgress(progress: SavedProgress): boolean {
  return write('progress', progress);
}

export function clearProgress(): void {
  remove('progress');
}

/* ===== 关卡完成记录与最佳成绩 ===== */

export interface CompletionRecord {
  levelId: string;
  bestMoves: number;
  bestTimeMs: number;
  completedAt: number;
}

export function loadCompletions(): Record<string, CompletionRecord> {
  return read<Record<string, CompletionRecord>>('completions', {});
}

export function recordCompletion(record: CompletionRecord): boolean {
  const all = loadCompletions();
  const existing = all[record.levelId];
  all[record.levelId] = {
    levelId: record.levelId,
    bestMoves:
      existing && existing.bestMoves < record.bestMoves ? existing.bestMoves : record.bestMoves,
    bestTimeMs:
      existing && existing.bestTimeMs < record.bestTimeMs ? existing.bestTimeMs : record.bestTimeMs,
    completedAt: Date.now(),
  };
  return write('completions', all);
}

/* ===== 每日挑战结果 ===== */

export interface DailyRecord {
  date: string;
  completed: boolean;
  bestMoves?: number;
  bestTimeMs?: number;
}

export function loadDailyRecords(): Record<string, DailyRecord> {
  return read<Record<string, DailyRecord>>('daily', {});
}

export function recordDailyResult(record: DailyRecord): boolean {
  const all = loadDailyRecords();
  const existing = all[record.date];
  all[record.date] = {
    date: record.date,
    completed: record.completed || (existing?.completed ?? false),
    bestMoves:
      record.bestMoves !== undefined
        ? Math.min(record.bestMoves, existing?.bestMoves ?? Infinity)
        : existing?.bestMoves,
    bestTimeMs:
      record.bestTimeMs !== undefined
        ? Math.min(record.bestTimeMs, existing?.bestTimeMs ?? Infinity)
        : existing?.bestTimeMs,
  };
  return write('daily', all);
}

/* ===== 用户设置 ===== */

export interface UserSettings {
  /** 默认求解算法 */
  defaultAlgorithm?: 'bfs' | 'astar' | 'idastar';
}

export function loadSettings(): UserSettings {
  return read<UserSettings>('settings', {});
}

export function saveSettings(settings: UserSettings): boolean {
  return write('settings', settings);
}
