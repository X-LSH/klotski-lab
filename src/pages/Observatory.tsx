/**
 * 算法观测台：可视化求解器的搜索过程。
 * 观测层只读取求解器事件与统计，求解正确性不依赖本页面。
 *
 * 性能设计：
 * - 搜索事件先写入 ref（不触发渲染），由 150ms 节流定时器统一刷新 UI；
 * - 树节点数量受 MAX_VISUALIZATION_NODES 限制，超限后只统计不画新节点；
 * - 暂停暂不支持（Worker 无法可靠暂停），按规范不假装支持。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialState } from '../core/state';
import { LEVELS } from '../generator/presets';
import { DIFFICULTY_LABELS } from '../components/copy';
import { solvePuzzleWithHandle } from '../solver/solver-service';
import type { SolveHandle } from '../solver/solver-client';
import type { SolveProgress, SolveResult } from '../solver/result';
import type { AlgorithmName } from '../solver/registry';
import { ALGORITHM_LABELS } from '../solver/registry';
import type { SearchEvent } from '../solver/events';
import {
  applySearchEvent,
  createSearchTree,
  type SearchTree as SearchTreeData,
} from '../observatory/tree';
import { raceAlgorithms, type RaceEntry } from '../observatory/race';
import AlgorithmSelector from '../components/observatory/AlgorithmSelector';
import SearchStats from '../components/observatory/SearchStats';
import SearchTimeline, { type TimelinePoint } from '../components/observatory/SearchTimeline';
import SearchTree from '../components/observatory/SearchTree';
import AlgorithmComparison from '../components/observatory/AlgorithmComparison';
import NodeInspector from '../components/observatory/NodeInspector';
import { ALGORITHM_HINTS, END_REASON_LABELS } from '../components/observatory/labels';

const MAX_VISUALIZATION_NODES = 800;
const FLUSH_INTERVAL_MS = 150;

/**
 * 可观察的谜题。
 * 默认选较小的题：观测台的目的是「看懂算法怎么走」，
 * 而经典横刀立马最优解 116 步，前 800 个局面只覆盖最浅的几层，树看不出全貌。
 */
const DEFAULT_SUBJECT_ID = 'warmup';
/** 最优解超过这个步数，搜索树就画不完整了（只能覆盖浅层） */
const DEEP_SOLUTION_THRESHOLD = 40;

export default function Observatory() {
  const [subjectId, setSubjectId] = useState(DEFAULT_SUBJECT_ID);
  const subject = LEVELS.find((level) => level.id === subjectId) ?? LEVELS[0];
  const puzzle = subject.puzzle;
  const deepSolution = (subject.optimalDepth ?? 0) >= DEEP_SOLUTION_THRESHOLD;
  const [algorithm, setAlgorithm] = useState<AlgorithmName>('bfs');
  const [running, setRunning] = useState(false);
  const [racing, setRacing] = useState(false);
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [raceEntries, setRaceEntries] = useState<RaceEntry[]>([]);
  // 树与版本计数：树本体在 ref 中高频更新，版本号低频触发渲染
  const treeRef = useRef<SearchTreeData>(createSearchTree());
  const [treeVersion, setTreeVersion] = useState(0);
  const timelineRef = useRef<TimelinePoint[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const handleRef = useRef<SolveHandle | null>(null);
  const startedAtRef = useRef(0);

  // 节流刷新：求解进行中每 150ms 把 ref 中的最新数据刷到 UI
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
      setTreeVersion((v) => v + 1);
      setTimelineVersion((v) => v + 1);
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [running]);

  // 页面离开时终止未完成的搜索，避免 Worker 泄漏
  useEffect(() => {
    return () => handleRef.current?.cancel();
  }, []);

  const handleEvent = useCallback((event: SearchEvent) => {
    applySearchEvent(treeRef.current, event, MAX_VISUALIZATION_NODES);
  }, []);

  const handleProgress = useCallback((p: SolveProgress) => {
    setProgress(p);
    timelineRef.current.push({
      elapsedMs: Date.now() - startedAtRef.current,
      visitedNodes: p.visitedNodes,
      expandedNodes: p.expandedNodes,
    });
  }, []);

  const handleStart = useCallback(() => {
    handleRef.current?.cancel();
    treeRef.current = createSearchTree();
    timelineRef.current = [];
    setProgress(null);
    setResult(null);
    setSelectedKey(null);
    setRaceEntries([]);
    setElapsedMs(0);
    startedAtRef.current = Date.now();
    setRunning(true);
    const handle = solvePuzzleWithHandle(
      { puzzle, initialState: createInitialState(puzzle) },
      algorithm,
      { onProgress: handleProgress, onEvent: handleEvent, timeoutMs: 120_000 },
    );
    handleRef.current = handle;
    handle.promise.then((r) => {
      handleRef.current = null;
      setRunning(false);
      setResult(r);
      setElapsedMs(Date.now() - startedAtRef.current);
      setTreeVersion((v) => v + 1);
      setTimelineVersion((v) => v + 1);
    });
  }, [puzzle, algorithm, handleProgress, handleEvent]);

  const handleStop = useCallback(() => {
    handleRef.current?.cancel();
    handleRef.current = null;
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    handleRef.current?.cancel();
    handleRef.current = null;
    treeRef.current = createSearchTree();
    timelineRef.current = [];
    setRunning(false);
    setProgress(null);
    setResult(null);
    setSelectedKey(null);
    setElapsedMs(0);
    setRaceEntries([]);
    setTreeVersion((v) => v + 1);
    setTimelineVersion((v) => v + 1);
  }, []);

  /** 换观察对象：旧树与旧统计对新题没有意义，直接清空 */
  const handleSubjectChange = useCallback(
    (id: string) => {
      setSubjectId(id);
      handleReset();
    },
    [handleReset],
  );

  const handleRace = useCallback(async () => {
    handleRef.current?.cancel();
    setRunning(false);
    setRacing(true);
    setRaceEntries([]);
    setResult(null);
    treeRef.current = createSearchTree();
    timelineRef.current = [];
    setTreeVersion((v) => v + 1);
    setTimelineVersion((v) => v + 1);
    const entries = await raceAlgorithms(
      { puzzle, initialState: createInitialState(puzzle) },
      (entry) => setRaceEntries((prev) => [...prev, entry]),
    );
    setRaceEntries(entries);
    setRacing(false);
  }, [puzzle]);

  const selectedNode = selectedKey ? (treeRef.current.nodes.get(selectedKey) ?? null) : null;
  // timelineRef 是原地 push 的数组，组件每次渲染都会重算折线，这里只需触发重渲染
  void timelineVersion;

  return (
    <main className="observatory">
      <header className="observatory__intro">
        <h2 className="observatory__title">算法观测台</h2>
        {/* 这个页面此前只有标题就直接是工具栏，用户不知道在观察什么、按钮会做什么。
            现在先讲清三件事：看什么、看的是哪道题、这道题能看到多少。 */}
        <p className="observatory__lead">
          把搜索算法的「思考过程」画出来：树里的<strong>每个圆点是一个局面</strong>，
          <strong>连线是走一步</strong>。算法每访问一个局面，这里就多一个点。
        </p>

        <div className="observatory__subject">
          <label className="observatory__subject-picker">
            <span>观察对象</span>
            <select
              value={subjectId}
              disabled={running || racing}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              {LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name} · {DIFFICULTY_LABELS[level.difficulty]} ·{' '}
                  {level.puzzle.board.width}×{level.puzzle.board.height}
                  {level.optimalDepth !== undefined ? ` · 最优 ${level.optimalDepth} 步` : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="observatory__subject-note">
            {subject.description}
            {deepSolution
              ? ' 这道题的最优解很深，搜索树只能覆盖最浅的几层；目标局面仍会单独标出来。想看完整个搜索过程，换一道较小的谜题。'
              : ' 这道题规模不大，搜索树通常能完整画出来。'}
          </p>
        </div>
      </header>

      <div className="observatory__toolbar">
        <div className="observatory__picker">
          <AlgorithmSelector algorithm={algorithm} disabled={running || racing} onChange={setAlgorithm} />
          <p className="observatory__algorithm-hint">{ALGORITHM_HINTS[algorithm]}</p>
        </div>
        <div className="observatory__actions">
          {running ? (
            <button type="button" onClick={handleStop} aria-label="停止搜索" title="中断当前搜索">
              停止搜索
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={racing}
              aria-label="开始搜索"
              title={`用 ${ALGORITHM_LABELS[algorithm]} 搜索这道题，实时画出搜索树与统计`}
            >
              开始搜索
            </button>
          )}
          <button type="button" onClick={handleReset} aria-label="重置" title="清空搜索树、统计与结果">
            重置
          </button>
          <button
            type="button"
            className="observatory__race"
            onClick={handleRace}
            disabled={running || racing}
            aria-label="三算法竞速对比"
            title="依次用 BFS / A* / IDA* 跑同一道题，对比访问节点数与耗时"
          >
            {racing ? '竞速中…' : '三算法竞速对比'}
          </button>
        </div>
      </div>

      <SearchStats progress={progress} elapsedMs={elapsedMs} />
      {result && (
        <p className="observatory__result" role="status">
          {result.solved
            ? `已解出：${result.depth} 步，访问 ${result.visitedNodes} 节点，耗时 ${(result.elapsedMs / 1000).toFixed(2)} 秒`
            : `未解出：${END_REASON_LABELS[result.reason]}`}
        </p>
      )}

      <div className="observatory__grid">
        {/* version 必须传：树是原地更新的 Map，仅靠引用变化无法触发布局重算 */}
        <SearchTree
          tree={treeRef.current}
          version={treeVersion}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
        <div className="observatory__side">
          <NodeInspector node={selectedNode} />
          <SearchTimeline points={timelineRef.current} />
        </div>
      </div>

      <AlgorithmComparison entries={raceEntries} running={racing} />
    </main>
  );
}
