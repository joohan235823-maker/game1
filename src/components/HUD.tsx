import React from 'react';
import { Volume2, VolumeX, Lightbulb, RotateCcw, HelpCircle, Pause, Play, Trophy, Sparkles } from 'lucide-react';
import { GameMode } from '../types/game';
import { sound } from '../utils/audio';

interface HUDProps {
  score: number;
  highScore: number;
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  timeLeft: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onHint: () => void;
  onRestart: () => void;
  onHelp: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  comboCount: number;
  isFeverMode?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  mode,
  setMode,
  timeLeft,
  isMuted,
  onToggleMute,
  onHint,
  onRestart,
  onHelp,
  isPaused,
  onTogglePause,
  comboCount,
  isFeverMode = false,
}) => {
  return (
    <header className="w-full max-w-xl mx-auto flex flex-col gap-1.5 px-3 pt-2 pb-0 text-white">
      {/* Top Bar Navigation: Title, High Score, Utilities */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
        {/* Brand Zone: Clean Wordmark */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-md transition-colors ${
              isFeverMode
                ? 'bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-400 animate-pulse'
                : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
              보석 매치 3
            </h1>
          </div>
        </div>

        {/* High Score & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold tabular-nums">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>최고 {highScore.toLocaleString()}</span>
          </div>

          <button
            onClick={onToggleMute}
            title={isMuted ? '소리 켜기' : '소리 끄기'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onHelp}
            title="게임 방법"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800/60 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setMode('classic');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mode === 'classic'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            클래식
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setMode('time_attack');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mode === 'time_attack'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            타임어택
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setMode('zen');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mode === 'zen'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            무제한 (Zen)
          </button>
        </div>

        {/* Action Buttons: Hint, Pause, Restart */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onHint}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all active:scale-95"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>힌트</span>
          </button>

          {mode === 'time_attack' && (
            <button
              onClick={onTogglePause}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={onRestart}
            title="새 게임"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Primary Score Board */}
      <div
        className={`grid ${
          mode === 'time_attack' ? 'grid-cols-3' : 'grid-cols-2'
        } gap-2 p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
          isFeverMode
            ? 'bg-gradient-to-r from-red-950/90 via-amber-950/80 to-red-950/90 border border-amber-500/60 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'bg-slate-900/80 border border-slate-800 shadow-md'
        }`}
      >
        {/* Current Score */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">점수</span>
            {isFeverMode && (
              <span className="text-[9px] font-black text-amber-300 bg-red-600/40 px-1 py-0.2 rounded border border-amber-400/50">
                FEVER 2X
              </span>
            )}
          </div>
          <span
            className={`text-xl sm:text-2xl font-black tabular-nums transition-colors ${
              isFeverMode ? 'text-amber-200 animate-pulse' : 'text-amber-300'
            }`}
          >
            {score.toLocaleString()}
          </span>
        </div>

        {/* Time Remaining (Time attack mode only) */}
        {mode === 'time_attack' && (
          <div className="flex flex-col text-center">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">남은 시간</span>
            <span
              className={`text-xl sm:text-2xl font-black tabular-nums ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-sky-300'
              }`}
            >
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Combo or Multiplier */}
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">연쇄 콤보</span>
          <span
            className={`text-xl sm:text-2xl font-black tabular-nums ${
              isFeverMode
                ? 'text-orange-400 animate-bounce'
                : comboCount > 1
                ? 'text-rose-400 animate-bounce'
                : 'text-slate-300'
            }`}
          >
            {isFeverMode ? `x${comboCount} (FEVER!)` : comboCount > 1 ? `x${comboCount}!` : 'x1'}
          </span>
        </div>
      </div>
    </header>
  );
};
