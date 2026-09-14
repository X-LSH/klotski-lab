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
import { CLASSIC_PUZZLE } from '../core/presets';
import { createInitialState } from '../core/state';
import { solvePuzzleWithHandle } from '../solver/solver-service';
import type { SolveHandle } from '../solver/solver-client';
import type { SolveProgress, SolveResult } from '../solver/result';
import type { AlgorithmName } from '../solver/registry';
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
import { END_REASON_LABELS } from '../components/observatory/labels';

const MAX_VISUALIZATION_NODES = 800;
const FLUSH_INTERVAL_MS = 150;

export default function Observatory() {
  const puzzle = CLASSIC_PUZZLE;
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
  // treeVersion / timelineVersion 仅用于触发重渲染，数据本体在 ref 中
  void treeVersion;
  void timelineVersion;

  return (
    <main className="observatory">
      <h2 className="observatory__title">算法观测台</h2>
      <div className="observatory__toolbar">
        <AlgorithmSelector algorithm={algorithm} disabled={running || racing} onChange={setAlgorithm} />
        <div className="observatory__actions">
          {running ? (
            <button type="button" onClick={handleStop} aria-label="停止">
              停止
            </button>
          ) : (
            <button type="button" onClick={handleStart} disabled={racing} aria-label="开始">
              开始
            </button>
          )}
          <button type="button" onClick={handleReset} aria-label="重置">
            重置
          </button>
          <button
            type="button"
            className="observatory__race"
            onClick={handleRace}
            disabled={running || racing}
            aria-label="竞速全部算法"
          >
            {racing ? '竞速中…' : '竞速全部算法'}
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
        <SearchTree tree={treeRef.current} selectedKey={selectedKey} onSelect={setSelectedKey} />
        <div className="observatory__side">
          <NodeInspector node={selectedNode} />
          <SearchTimeline points={timelineRef.current} />
        </div>
      </div>

      <AlgorithmComparison entries={raceEntries} running={racing} />
    </main>
  );
}
