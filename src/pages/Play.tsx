/**
 * 游戏页：棋盘 + 操作 + 求解（Worker，支持进度 / 停止 / 算法对比）+ 回放 + 胜利结算。
 * React 只管理状态与展示，所有移动合法性都经由 core 判断。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Move } from '../types';
import { CLASSIC_PUZZLE } from '../core/presets';
import { createInitialState } from '../core/state';
import { useGame } from '../hooks/useGame';
import { solvePuzzle, solvePuzzleWithHandle } from '../solver/solver-service';
import type { SolveHandle } from '../solver/solver-client';
import type { SolveProgress, SolveResult } from '../solver/result';
import { ALL_ALGORITHMS, type AlgorithmName } from '../solver/registry';
import { buildReplaySession, clampIndex, intervalForSpeed } from '../replay/replay';
import type { ReplaySession } from '../replay/replay';
import Board from '../components/Board';
import GameControls from '../components/GameControls';
import ReplayControls from '../components/ReplayControls';
import MoveCounter from '../components/MoveCounter';
import SolverPanel, { type ComparisonEntry } from '../components/SolverPanel';

export default function Play() {
  const puzzle = CLASSIC_PUZZLE;
  const game = useGame(puzzle);

  const [mode, setMode] = useState<'play' | 'replay'>('play');
  const [algorithm, setAlgorithm] = useState<AlgorithmName>('bfs');
  const [solving, setSolving] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonEntry[] | null>(null);
  const [stopped, setStopped] = useState(false);
  const solveHandleRef = useRef<SolveHandle | null>(null);

  const [session, setSession] = useState<ReplaySession | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const [started, setStarted] = useState(false);
  const startedAtRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [optimal, setOptimal] = useState<number | null>(null);

  // 回放自动播放定时器（组件卸载时清理）
  useEffect(() => {
    if (!replayPlaying || !session) return;
    const timer = setInterval(() => {
      setReplayIndex((index) => {
        const next = clampIndex(index + 1, session.moves.length);
        if (next >= session.moves.length) setReplayPlaying(false);
        return next;
      });
    }, intervalForSpeed(replaySpeed));
    return () => clearInterval(timer);
  }, [replayPlaying, replaySpeed, session]);

  // 游玩计时器
  useEffect(() => {
    if (!started || game.solved) return;
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, game.solved]);

  // 页面离开时终止未完成的求解，避免 Worker 泄漏
  useEffect(() => {
    return () => solveHandleRef.current?.cancel();
  }, []);

  const handleReset = useCallback(() => {
    game.reset();
    setStarted(false);
    setElapsedMs(0);
    setOptimal(null);
    setSolveResult(null);
    setComparison(null);
    setStopped(false);
  }, [game]);

  const handleMove = useCallback(
    (move: Move): boolean => {
      if (!started) {
        setStarted(true);
        startedAtRef.current = Date.now();
      }
      const ok = game.doMove(move);
      if (ok) {
        setSolveResult(null);
        setComparison(null);
      }
      return ok;
    },
    [game, started],
  );

  const handleSolve = useCallback(() => {
    setSolving(true);
    setStopped(false);
    setProgress(null);
    setSolveResult(null);
    setComparison(null);
    const stateAtSolve = game.state;
    const handle = solvePuzzleWithHandle(
      { puzzle, initialState: stateAtSolve },
      algorithm,
      { onProgress: setProgress },
    );
    solveHandleRef.current = handle;
    handle.promise.then((result) => {
      solveHandleRef.current = null;
      setSolving(false);
      setSolveResult(result);
      if (result.solved) {
        setSession(buildReplaySession(puzzle, stateAtSolve, result.moves));
        setReplayIndex(0);
        setReplayPlaying(false);
        setMode('replay');
      }
    });
  }, [puzzle, game.state, algorithm]);

  const handleStop = useCallback(() => {
    solveHandleRef.current?.cancel();
    solveHandleRef.current = null;
    setSolving(false);
    setStopped(true);
  }, []);

  const handleCompare = useCallback(async () => {
    setComparing(true);
    setComparison(null);
    setSolveResult(null);
    const entries: ComparisonEntry[] = [];
    // 顺序执行，保证耗时对比公平
    for (const name of ALL_ALGORITHMS) {
      const result = await solvePuzzle({ puzzle, initialState: game.state }, name);
      entries.push({ algorithm: name, result });
      setComparison([...entries]);
    }
    setComparing(false);
  }, [puzzle, game.state]);

  // 胜利结算：从初始状态求最优解
  useEffect(() => {
    if (!game.solved || optimal !== null) return;
    let cancelled = false;
    solvePuzzle({ puzzle, initialState: createInitialState(puzzle) }, 'bfs').then((result) => {
      if (!cancelled && result.solved) setOptimal(result.depth);
    });
    return () => {
      cancelled = true;
    };
  }, [game.solved, optimal, puzzle]);

  const exitReplay = useCallback(() => {
    setMode('play');
    setReplayPlaying(false);
  }, []);

  const boardState = mode === 'replay' && session ? session.states[replayIndex] : game.state;

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
  };

  const replayTotal = session?.moves.length ?? 0;

  return (
    <main className="play">
      <section className="play__board-area">
        <Board
          puzzle={puzzle}
          state={boardState}
          interactive={mode === 'play' && !game.solved && !solving}
          onMove={handleMove}
        />
      </section>

      <aside className="play__side">
        <h2 className="play__puzzle-name">{puzzle.name}</h2>
        <MoveCounter moves={game.moveCount} optimal={solveResult?.depth ?? null} />

        {mode === 'play' ? (
          <>
            <GameControls
              canUndo={game.canUndo}
              canRedo={game.canRedo}
              onUndo={game.undo}
              onRedo={game.redo}
              onReset={handleReset}
            />
            <SolverPanel
              algorithm={algorithm}
              solving={solving}
              comparing={comparing}
              progress={progress}
              result={solveResult}
              comparison={comparison}
              onAlgorithmChange={setAlgorithm}
              onSolve={handleSolve}
              onStop={handleStop}
              onCompare={handleCompare}
            />
            {stopped && <p className="play__unsolvable">已停止求解。</p>}
            {solveResult && !solveResult.solved && (
              <p className="play__unsolvable">当前局面无解或达到搜索上限。</p>
            )}
          </>
        ) : (
          session && (
            <ReplayControls
              playing={replayPlaying}
              index={replayIndex}
              total={replayTotal}
              speed={replaySpeed}
              onPlayPause={() => setReplayPlaying((p) => !p)}
              onFirst={() => {
                setReplayPlaying(false);
                setReplayIndex(0);
              }}
              onPrev={() => setReplayIndex((i) => clampIndex(i - 1, replayTotal))}
              onNext={() => setReplayIndex((i) => clampIndex(i + 1, replayTotal))}
              onLast={() => {
                setReplayPlaying(false);
                setReplayIndex(replayTotal);
              }}
              onSpeedChange={setReplaySpeed}
              onExit={exitReplay}
            />
          )
        )}
      </aside>

      {game.solved && mode === 'play' && (
        <div className="victory" role="dialog" aria-label="完成结算">
          <h2>已解开</h2>
          <dl className="victory__stats">
            <div>
              <dt>步数</dt>
              <dd>{game.moveCount}</dd>
            </div>
            <div>
              <dt>最优</dt>
              <dd>{optimal ?? '计算中…'}</dd>
            </div>
            <div>
              <dt>效率</dt>
              <dd>
                {optimal !== null && game.moveCount > 0
                  ? `${Math.round((optimal / game.moveCount) * 100)}%`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>用时</dt>
              <dd>{formatTime(elapsedMs)}</dd>
            </div>
          </dl>
          <button type="button" onClick={handleReset}>
            再来一局
          </button>
        </div>
      )}
    </main>
  );
}
