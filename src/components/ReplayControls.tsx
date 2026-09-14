/**
 * 回放控制条：播放 / 暂停 / 上一步 / 下一步 / 首步 / 末步 / 进度 / 倍速。
 */
import { REPLAY_SPEEDS } from '../replay/replay';

interface ReplayControlsProps {
  playing: boolean;
  index: number;
  total: number;
  speed: number;
  onPlayPause: () => void;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onSpeedChange: (speed: number) => void;
  onExit: () => void;
}

export default function ReplayControls({
  playing,
  index,
  total,
  speed,
  onPlayPause,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onSpeedChange,
  onExit,
}: ReplayControlsProps) {
  return (
    <div className="replay-controls" role="toolbar" aria-label="回放控制">
      <div className="replay-controls__row">
        <button type="button" onClick={onFirst} aria-label="首步">
          « 首步
        </button>
        <button type="button" onClick={onPrev} disabled={index <= 0} aria-label="上一步">
          ‹ 上一步
        </button>
        <button type="button" onClick={onPlayPause} aria-label={playing ? '暂停' : '播放'}>
          {playing ? '暂停' : '播放'}
        </button>
        <button type="button" onClick={onNext} disabled={index >= total} aria-label="下一步">
          下一步 ›
        </button>
        <button type="button" onClick={onLast} aria-label="末步">
          末步 »
        </button>
        <button type="button" onClick={onExit} aria-label="退出回放">
          退出回放
        </button>
      </div>
      <div className="replay-controls__row">
        <span className="replay-controls__progress" aria-label="回放进度">
          {index} / {total}
        </span>
        <label className="replay-controls__speed">
          倍速
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            aria-label="回放倍速"
          >
            {REPLAY_SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
