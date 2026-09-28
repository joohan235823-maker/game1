import React from 'react';
import { ChessMoveEvaluation } from '../types/game';

interface TopChessEvaluationBannerProps {
  evaluation: ChessMoveEvaluation | null;
}

export const TopChessEvaluationBanner: React.FC<TopChessEvaluationBannerProps> = ({
  evaluation,
}) => {
  // Chess.com style icon symbol
  const getBadgeIcon = (grade: string) => {
    switch (grade) {
      case 'brilliant':
        return '!!';
      case 'great':
        return '!';
      case 'best':
        return '★';
      case 'excellent':
        return '👍';
      case 'good':
        return '✓';
      case 'inaccuracy':
        return '⁈';
      case 'mistake':
        return '?';
      case 'blunder':
        return '??';
      default:
        return '✓';
    }
  };

  const getBadgeGradient = (grade: string) => {
    switch (grade) {
      case 'brilliant':
        return 'from-cyan-400 via-teal-400 to-cyan-600 shadow-[0_0_16px_rgba(6,182,212,0.9)] text-white';
      case 'great':
        return 'from-blue-500 via-indigo-500 to-blue-700 shadow-[0_0_14px_rgba(59,130,246,0.8)] text-white';
      case 'best':
        return 'from-emerald-400 via-green-500 to-emerald-700 shadow-[0_0_14px_rgba(16,185,129,0.8)] text-white';
      case 'excellent':
        return 'from-lime-400 to-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(132,204,22,0.7)]';
      case 'good':
        return 'from-slate-400 to-slate-600 text-white';
      case 'inaccuracy':
        return 'from-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_12px_rgba(234,179,8,0.8)]';
      case 'mistake':
        return 'from-orange-500 to-amber-600 text-white shadow-[0_0_14px_rgba(249,115,22,0.8)]';
      case 'blunder':
        return 'from-red-600 via-rose-600 to-red-800 text-white shadow-[0_0_18px_rgba(239,68,68,0.9)]';
      default:
        return 'from-slate-500 to-slate-700 text-white';
    }
  };

  // Fixed container ensuring layout consistency without popping in and out
  return (
    <div className="w-full max-w-xl mx-auto px-3">
      {evaluation ? (
        <div
          className="w-full py-2 px-3 sm:px-4 rounded-xl border flex items-center justify-between gap-3 shadow-lg backdrop-blur-md transition-colors duration-200"
          style={{
            backgroundColor: evaluation.bgColor,
            borderColor: evaluation.borderColor,
            color: evaluation.color,
            boxShadow: `0 4px 18px -2px rgba(0, 0, 0, 0.5), 0 0 14px ${evaluation.borderColor}30`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Badge Icon */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${getBadgeGradient(
                evaluation.grade
              )} border-2 border-white/90 flex items-center justify-center text-xs sm:text-sm font-black shrink-0 select-none shadow-md`}
            >
              {getBadgeIcon(evaluation.grade)}
            </div>

            {/* Title & Reason */}
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-black text-xs sm:text-sm tracking-wide">
                {evaluation.titleKo}
              </span>
              <p className="text-[11px] sm:text-xs text-white/90 truncate leading-tight mt-0.5 font-medium">
                {evaluation.reason}
              </p>
            </div>
          </div>

          {/* Score delta */}
          <div className="text-right shrink-0 font-mono text-xs sm:text-sm font-bold tabular-nums pl-2 border-l border-white/20">
            <span className="block text-[10px] text-white/70 font-sans font-normal">획득</span>
            <span>+{evaluation.scoreGain}</span>
          </div>
        </div>
      ) : (
        /* Permanent steady placeholder filling the space until the first move */
        <div className="w-full py-2 px-3 sm:px-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-3 shadow-sm backdrop-blur-md text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
              ♟
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-xs text-slate-300">
                수 평가 대기
              </span>
              <p className="text-[11px] text-slate-500 leading-tight">
                보석을 교환하면 체스식 수 분석이 여기에 표시됩니다.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 font-mono text-xs text-slate-500 pl-2 border-l border-slate-800">
            <span className="block text-[10px] text-slate-600 font-sans">획득</span>
            <span>+0</span>
          </div>
        </div>
      )}
    </div>
  );
};
