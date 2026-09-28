import React from 'react';
import { Trophy, X, RotateCcw, Flame, Sparkles, Zap, Smartphone, MousePointer } from 'lucide-react';
import { GemGraphic } from './Gems';
import { ChessEvalGrade } from '../types/game';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewHigh: boolean;
  highestCombo: number;
  evalCounts?: Record<ChessEvalGrade, number>;
  reason?: string | null;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewHigh,
  highestCombo,
  evalCounts,
  reason,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-center flex flex-col items-center gap-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {isNewHigh ? '🎉 새로운 최고 기록!' : '게임 종료'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {reason || (isNewHigh ? '축하합니다! 최고 점수를 갱신했습니다.' : '멋진 플레이였습니다!')}
          </p>
        </div>

        <div className="w-full py-3 px-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>최종 점수</span>
            <span className="text-base font-bold text-amber-300 tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>최고 연쇄 콤보</span>
            <span className="text-sm font-semibold text-rose-400 tabular-nums">
              x{highestCombo}
            </span>
          </div>

          {/* Highlighted Chess Score Summary: Brilliant & Blunder with intelligent fallbacks */}
          {evalCounts && (() => {
            // Determine Best Category (Brilliant -> Great -> Best -> Excellent -> Good)
            let bestTitle = '브릴리언트 수';
            let bestIcon = '!!';
            let bestCount = evalCounts.brilliant;
            let bestSubtext = '상위 1% 최고의 묘수';

            if (bestCount === 0) {
              if (evalCounts.great > 0) {
                bestTitle = '훌륭한 수';
                bestIcon = '!';
                bestCount = evalCounts.great;
                bestSubtext = '차선: 특수 보석 생성 & 전술적 수';
              } else if (evalCounts.best > 0) {
                bestTitle = '최선의 수';
                bestIcon = '⭐';
                bestCount = evalCounts.best;
                bestSubtext = '차선: 보드 최고 점수 수';
              } else if (evalCounts.excellent > 0) {
                bestTitle = '우수한 수';
                bestIcon = '👍';
                bestCount = evalCounts.excellent;
                bestSubtext = '차선: 상위권 선택';
              } else {
                bestTitle = '좋은 수';
                bestIcon = '✓';
                bestCount = evalCounts.good;
                bestSubtext = '기본 안정적인 수';
              }
            }

            // Determine Worst Category (Blunder -> Mistake -> Inaccuracy -> None)
            let worstTitle = '블런더';
            let worstIcon = '??';
            let worstCount = evalCounts.blunder;
            let worstSubtext = '결정적 기회 상실 / 최악의 수';

            if (worstCount === 0) {
              if (evalCounts.mistake > 0) {
                worstTitle = '실수';
                worstIcon = '?';
                worstCount = evalCounts.mistake;
                worstSubtext = '차악: 고득점 찬스 놓침';
              } else if (evalCounts.inaccuracy > 0) {
                worstTitle = '부정확함';
                worstIcon = '⁈';
                worstCount = evalCounts.inaccuracy;
                worstSubtext = '차악: 아쉬운 선택';
              } else {
                worstTitle = '블런더 없음';
                worstIcon = '🛡️';
                worstCount = 0;
                worstSubtext = '실수 없는 완벽한 플레이!';
              }
            }

            return (
              <div className="border-t border-slate-700/60 pt-2.5 mt-1 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>체스식 최종 수 평가 분석</span>
                  <span className="text-[10px] text-slate-400 font-normal">최고의 수 vs 최악의 수</span>
                </div>

                {/* Best vs Worst Badges with Fallbacks */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {/* Best Moves card */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950/70 to-emerald-950/70 border border-cyan-500/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[10px] font-black">{bestIcon}</span>
                        <span className="truncate">{bestTitle}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">{bestSubtext}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-xl font-black text-cyan-300 tabular-nums">
                        {bestCount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">회</span>
                    </div>
                  </div>

                  {/* Worst Moves card */}
                  <div
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      worstCount > 0
                        ? 'bg-gradient-to-br from-red-950/70 to-orange-950/70 border-red-500/40'
                        : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div>
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          worstCount > 0 ? 'text-rose-300' : 'text-emerald-300'
                        }`}
                      >
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                            worstCount > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
                          }`}
                        >
                          {worstIcon}
                        </span>
                        <span className="truncate">{worstTitle}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">{worstSubtext}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span
                        className={`text-xl font-black tabular-nums ${
                          worstCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {worstCount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">회</span>
                    </div>
                  </div>
                </div>

                {/* Collapsed mini row showing all evaluation categories */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5 border-t border-slate-800/80">
                  <span>브릴: {evalCounts.brilliant}</span>
                  <span>훌륭: {evalCounts.great}</span>
                  <span>최선: {evalCounts.best}</span>
                  <span>실수: {evalCounts.mistake}</span>
                  <span>블런더: {evalCounts.blunder}</span>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/60 pt-1.5 mt-0.5">
            <span>역대 최고 기록</span>
            <span className="text-sm font-semibold text-slate-300 tabular-nums">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>다시 플레이하기</span>
        </button>
      </div>
    </div>
  );
};

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-white flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">게임 방법 & 규칙</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            조작 방법 (모바일 & PC)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">스와이프 드래그</span>
                <span>보석을 원하는 방향으로 쓸어 넘기면 즉시 교환됩니다.</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">탭 & 클릭</span>
                <span>보석을 터치해 선택한 뒤, 인접한 보석을 터치해 교환합니다.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Gems */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            7가지 기본 보석
          </h3>
          <div className="grid grid-cols-7 gap-1 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            {(['ruby', 'diamond', 'amber', 'sapphire', 'topaz', 'emerald', 'amethyst'] as const).map(
              (gemType) => (
                <div key={gemType} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8">
                    <GemGraphic type={gemType} />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate w-full text-center">
                    {gemType === 'ruby'
                      ? '루비'
                      : gemType === 'diamond'
                      ? '다이아'
                      : gemType === 'amber'
                      ? '호박'
                      : gemType === 'sapphire'
                      ? '사파이어'
                      : gemType === 'topaz'
                      ? '토파즈'
                      : gemType === 'emerald'
                      ? '에메랄드'
                      : '자수정'}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Special Gems */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            특수 보석 조합
          </h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-amber-500/30 flex items-center gap-3">
              <div className="w-9 h-9 shrink-0">
                <GemGraphic type="ruby" special="flame" />
              </div>
              <div>
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> 화염 보석 (Flame Gem)
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  직선으로 4개의 보석을 연결하면 생성. 매치 시 3x3 주변 보석을 일제히 폭발시킵니다.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-sky-500/30 flex items-center gap-3">
              <div className="w-9 h-9 shrink-0">
                <GemGraphic type="sapphire" special="star" />
              </div>
              <div>
                <span className="font-semibold text-sky-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-sky-400" /> 스타 보석 (Star Gem)
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  T자 또는 L자로 5개 이상 교차 매치 시 생성. 십자 광선으로 전체 행과 열을 파괴합니다.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-purple-500/30 flex items-center gap-3">
              <div className="w-9 h-9 shrink-0">
                <GemGraphic type="amethyst" special="hypercube" />
              </div>
              <div>
                <span className="font-semibold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 하이퍼큐브 (Hypercube)
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  직선으로 5개 보석을 연결하면 생성. 인접한 아무 보석과 교환 시 보드 위의 같은 색상 보석을 모두 소멸시킵니다!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chess Move Evaluation Guide */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            체스식 실시간 수 분석 (Move Evaluation)
          </h3>
          <p className="text-[11px] text-slate-400">
            매 수마다 보드의 모든 가능한 경우의 수를 인공지능 엔진이 분석하여 평가합니다:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 flex items-start gap-2">
              <span className="font-black text-sm text-cyan-400">!!</span>
              <div>
                <span className="font-bold block">브릴리언트 (Brilliant)</span>
                <span className="text-[10px] text-cyan-300/80">하이퍼큐브(5-매치)나 보드 전체를 뒤흔드는 압도적인 묘수</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-200 flex items-start gap-2">
              <span className="font-black text-sm text-blue-400">!</span>
              <div>
                <span className="font-bold block">훌륭한 수 (Great Move)</span>
                <span className="text-[10px] text-blue-300/80">스타/화염 보석 생성 및 전술적 우위 확보</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-start gap-2">
              <span className="font-black text-sm text-emerald-400">⭐</span>
              <div>
                <span className="font-bold block">최선의 수 (Best Move)</span>
                <span className="text-[10px] text-emerald-300/80">현재 보드 상황에서 가장 높은 득점의 완벽한 수</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-2">
              <span className="font-black text-sm text-yellow-400">⁈</span>
              <div>
                <span className="font-bold block">부정확함 (Inaccuracy)</span>
                <span className="text-[10px] text-amber-300/80">나쁘진 않으나 더 유리한 수가 존재했던 경우</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-orange-950/40 border border-orange-500/40 text-orange-200 flex items-start gap-2">
              <span className="font-black text-sm text-orange-400">?</span>
              <div>
                <span className="font-bold block">실수 (Mistake)</span>
                <span className="text-[10px] text-orange-300/80">4-매치 화염 기회나 고득점 찬스를 놓친 아쉬운 수</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 text-rose-200 flex items-start gap-2">
              <span className="font-black text-sm text-rose-400">??</span>
              <div>
                <span className="font-bold block">블런더 (Blunder)</span>
                <span className="text-[10px] text-rose-300/80">5-매치 하이퍼큐브 등 결정적 찬스를 엉뚱한 3-매치로 날려버린 치명적 실수</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
};
