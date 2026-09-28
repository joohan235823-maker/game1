import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Gem, MatchResult, MoveHint, ChessMoveEvaluation } from '../types/game';
import { GemGraphic } from './Gems';
import {
  GRID_SIZE,
  isValidSwap,
  findMatches,
  resolveHypercubeSwap,
  applyGravityAndRefill,
  shuffleBoard,
  checkPossibleMoves,
  evaluatePlayerMove,
  createGem,
} from '../utils/boardLogic';
import { sound } from '../utils/audio';
import { ParticleCanvas, ParticleTrigger } from './ParticleCanvas';

interface GameBoardProps {
  board: Gem[][];
  setBoard: React.Dispatch<React.SetStateAction<Gem[][]>>;
  onScoreGained: (score: number, combo: number) => void;
  hint: MoveHint | null;
  clearHint: () => void;
  isInteractive: boolean;
  setIsInteractive: React.Dispatch<React.SetStateAction<boolean>>;
  onShowMessage: (text: string) => void;
  onChessEval?: (evalData: ChessMoveEvaluation) => void;
  onGameOver?: (reason: string) => void;
  isFeverMode?: boolean;
}

interface FloatingTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  setBoard,
  onScoreGained,
  hint,
  clearHint,
  isInteractive,
  setIsInteractive,
  onShowMessage,
  onChessEval,
  onGameOver,
  isFeverMode = false,
}) => {
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const [boardDimensions, setBoardDimensions] = useState({ width: 440, height: 440 });
  const [selectedGem, setSelectedGem] = useState<{ r: number; c: number } | null>(null);
  const [swappingPair, setSwappingPair] = useState<{
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    isReverting?: boolean;
  } | null>(null);
  const [clearingCoords, setClearingCoords] = useState<Set<string>>(new Set());
  const [particleTriggers, setParticleTriggers] = useState<ParticleTrigger[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);

  // Keep track of the last player swap to detect game-ending blunders
  const lastPlayerMoveRef = useRef<{
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    priorBoard: Gem[][];
  } | null>(null);
  const evalBadgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track touch/pointer drag
  const dragStartRef = useRef<{ x: number; y: number; r: number; c: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Resize observer to keep canvas matched with board size
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBoardDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Vibrate helper for mobile
  const vibrate = (ms: number | number[] = 25) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Add floating floating score text
  const addFloatingText = useCallback((text: string, x: number, y: number, color = '#fef08a') => {
    const id = `float-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 900);
  }, []);

  // Process Cascades recursively
  const processCascades = useCallback(
    async (currentBoard: (Gem | null)[][], combo = 1) => {
      const matchRes: MatchResult = findMatches(currentBoard);

      if (matchRes.matchedGems.length === 0) {
        // Board is stable!
        // Check if any moves remain
        const possibleMoves = checkPossibleMoves(currentBoard as Gem[][]);
        if (possibleMoves.length === 0) {
          // Check if previous move was a blunder that exhausted moves
          if (lastPlayerMoveRef.current) {
            const { r1, c1, r2, c2, priorBoard } = lastPlayerMoveRef.current;
            const blunderEval = evaluatePlayerMove(priorBoard, r1, c1, r2, c2, 0);

            if (blunderEval.grade === 'blunder') {
              sound.playBlunder();
              if (onChessEval) onChessEval(blunderEval);
            }
          }

          onShowMessage('이동할 수 있는 보석이 없습니다! 게임 종료.');
          sound.playGameOver();
          vibrate([30, 60, 100]);

          setTimeout(() => {
            if (onGameOver) {
              onGameOver('더 이상 이동할 수 있는 보석이 없어 게임이 종료되었습니다.');
            }
          }, 1200);
          return;
        }

        setIsInteractive(true);
        return;
      }

      // Combo announcements
      if (combo === 2) onShowMessage('Good!');
      else if (combo === 3) onShowMessage('Great!!');
      else if (combo === 4) onShowMessage('Awesome!!!');
      else if (combo >= 5) onShowMessage('INCREDIBLE!!!!');

      // Play chime with combo scale
      sound.playMatch(combo);
      vibrate(30 + combo * 10);

      // Score bonus based on combo
      const comboMultiplier = Math.min(combo, 8);
      const totalScore = matchRes.score * comboMultiplier;
      onScoreGained(totalScore, combo);

      // Trigger particles & clearing coordinates
      const matchedSet = new Set<string>();
      const triggers: ParticleTrigger[] = [];
      const tileSize = boardDimensions.width / GRID_SIZE;

      matchRes.matchedGems.forEach(({ r, c, gem }) => {
        matchedSet.add(`${r},${c}`);
        triggers.push({
          x: c * tileSize + tileSize / 2,
          y: r * tileSize + tileSize / 2,
          type: gem.type,
          count: 14,
          isSpecial: gem.special !== 'none' ? gem.special : null,
        });
      });

      if (matchRes.matchedGems.length > 0) {
        const centerGem = matchRes.matchedGems[Math.floor(matchRes.matchedGems.length / 2)];
        addFloatingText(
          combo > 1 ? `+${totalScore} (x${combo})` : `+${totalScore}`,
          centerGem.c * tileSize + tileSize / 2,
          centerGem.r * tileSize + tileSize / 4,
          combo > 2 ? '#f43f5e' : combo === 2 ? '#38bdf8' : '#fef08a'
        );
      }

      setParticleTriggers(triggers);
      setClearingCoords(matchedSet);

      // Wait for pop animation
      await new Promise((res) => setTimeout(res, 220));

      // Remove matched gems and place any created special gems
      const nextBoard = currentBoard.map((row) => [...row]);
      matchedSet.forEach((coord) => {
        const [r, c] = coord.split(',').map(Number);
        nextBoard[r][c] = null;
      });

      matchRes.specialCreations.forEach((sc) => {
        const gem = {
          id: `spec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: sc.type,
          special: sc.special,
          row: sc.r,
          col: sc.c,
        };
        nextBoard[sc.r][sc.c] = gem;
        if (sc.special === 'flame') sound.playFlameExplosion();
        if (sc.special === 'hypercube') sound.playHypercube();
      });

      setClearingCoords(new Set());

      // Gravity & refill with failsafe check
      let { newBoard } = applyGravityAndRefill(nextBoard);

      // Failsafe: if any cell remains null/empty for any reason, refill completely
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!newBoard[r] || !newBoard[r][c]) {
            const filler = createGem();
            filler.row = r;
            filler.col = c;
            if (!newBoard[r]) newBoard[r] = [];
            newBoard[r][c] = filler;
          }
        }
      }

      setBoard(newBoard);

      // Drop settle delay before checking next cascade
      await new Promise((res) => setTimeout(res, 240));
      processCascades(newBoard, combo + 1);
    },
    [boardDimensions.width, onScoreGained, onShowMessage, setBoard, setIsInteractive, addFloatingText]
  );

  // Execute swap attempt
  const executeSwap = useCallback(
    async (r1: number, c1: number, r2: number, c2: number) => {
      if (!isInteractive) return;
      setIsInteractive(false);
      clearHint();
      setSelectedGem(null);

      const g1 = board[r1]?.[c1];
      const g2 = board[r2]?.[c2];
      if (!g1 || !g2) {
        setIsInteractive(true);
        return;
      }

      // Check Hypercube direct swap
      const isHypercube = g1.special === 'hypercube' || g2.special === 'hypercube';
      const valid = isHypercube || isValidSwap(board, r1, c1, r2, c2);

      // Show swap animation
      setSwappingPair({ r1, c1, r2, c2 });
      sound.playSwap();

      await new Promise((res) => setTimeout(res, 180));

      if (!valid) {
        // Invalid: bounce back
        setSwappingPair({ r1, c1, r2, c2, isReverting: true });
        sound.playInvalid();
        vibrate([15, 30, 15]);

        await new Promise((res) => setTimeout(res, 180));
        setSwappingPair(null);
        setIsInteractive(true);
        return;
      }

      // Apply swap to board
      const newBoard: (Gem | null)[][] = board.map((row) => [...row]);
      newBoard[r1][c1] = { ...g2, row: r1, col: c1 };
      newBoard[r2][c2] = { ...g1, row: r2, col: c2 };
      setBoard(newBoard as Gem[][]);
      setSwappingPair(null);

      // Record this move for subsequent game-over blunder check
      lastPlayerMoveRef.current = {
        r1,
        c1,
        r2,
        c2,
        priorBoard: board.map((r) => [...r]),
      };

      // Perform Chess Move Evaluation on the original board before cascade
      const evalResult = evaluatePlayerMove(board, r1, c1, r2, c2);

      // Play corresponding Chess audio cue
      if (evalResult.grade === 'brilliant') {
        sound.playBrilliant();
      } else if (evalResult.grade === 'blunder') {
        sound.playBlunder();
      } else if (evalResult.grade === 'best') {
        sound.playBestMove();
      } else if (evalResult.grade === 'mistake') {
        sound.playMistake();
      }

      // Immediately notify parent app for top banner display (always updates with latest move)
      if (onChessEval) {
        onChessEval(evalResult);
      }

      const tileSize = boardDimensions.width / GRID_SIZE;

      if (isHypercube) {
        // Special hypercube resolution
        sound.playHypercube();
        const hyperMatch = resolveHypercubeSwap(newBoard, r1, c1, r2, c2);

        const matchedSet = new Set<string>();
        const triggers: ParticleTrigger[] = [];
        hyperMatch.matchedGems.forEach(({ r, c, gem }) => {
          matchedSet.add(`${r},${c}`);
          triggers.push({
            x: c * tileSize + tileSize / 2,
            y: r * tileSize + tileSize / 2,
            type: gem.type,
            count: 18,
            isSpecial: 'hypercube',
          });
        });

        setParticleTriggers(triggers);
        setClearingCoords(matchedSet);
        onScoreGained(hyperMatch.score, 1);
        addFloatingText(
          `HYPER BLAST! +${hyperMatch.score}`,
          c2 * tileSize + tileSize / 2,
          r2 * tileSize + tileSize / 2,
          '#a855f7'
        );

        await new Promise((res) => setTimeout(res, 280));

        matchedSet.forEach((coord) => {
          const [r, c] = coord.split(',').map(Number);
          newBoard[r][c] = null;
        });
        setClearingCoords(new Set());

        let { newBoard: refilled } = applyGravityAndRefill(newBoard);
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (!refilled[r] || !refilled[r][c]) {
              const filler = createGem();
              filler.row = r;
              filler.col = c;
              if (!refilled[r]) refilled[r] = [];
              refilled[r][c] = filler;
            }
          }
        }
        setBoard(refilled);
        await new Promise((res) => setTimeout(res, 220));
        processCascades(refilled, 2);
      } else {
        // Standard cascade flow with swap coordinates
        const matchRes = findMatches(newBoard, { r1, c1, r2, c2 });
        if (matchRes.matchedGems.length > 0) {
          processCascades(newBoard, 1);
        } else {
          // Fallback check
          setIsInteractive(true);
        }
      }
    },
    [
      isInteractive,
      setIsInteractive,
      clearHint,
      board,
      setBoard,
      boardDimensions.width,
      onScoreGained,
      addFloatingText,
      processCascades,
    ]
  );

  // Click / Tap handler
  const handleGemClick = (r: number, c: number) => {
    if (!isInteractive) return;

    if (!selectedGem) {
      sound.playClick();
      setSelectedGem({ r, c });
      return;
    }

    if (selectedGem.r === r && selectedGem.c === c) {
      // Tap again to deselect
      sound.playClick();
      setSelectedGem(null);
      return;
    }

    // Check adjacency
    const dr = Math.abs(selectedGem.r - r);
    const dc = Math.abs(selectedGem.c - c);

    if (dr + dc === 1) {
      // Adjacent: initiate swap!
      executeSwap(selectedGem.r, selectedGem.c, r, c);
    } else {
      // Non-adjacent: select this one instead
      sound.playClick();
      setSelectedGem({ r, c });
    }
  };

  // Pointer / Touch down handler
  const handlePointerDown = (e: React.PointerEvent, r: number, c: number) => {
    if (!isInteractive) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, r, c };
    isDraggingRef.current = true;
  };

  // Pointer / Touch move handler (swipe detection)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current || !isInteractive) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const threshold = 22; // px

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      isDraggingRef.current = false;
      const { r, c } = dragStartRef.current;
      dragStartRef.current = null;

      let targetR = r;
      let targetC = c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC += dx > 0 ? 1 : -1;
      } else {
        targetR += dy > 0 ? 1 : -1;
      }

      if (targetR >= 0 && targetR < GRID_SIZE && targetC >= 0 && targetC < GRID_SIZE) {
        executeSwap(r, c, targetR, targetC);
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
  };

  return (
    <div
      ref={boardContainerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative w-full max-w-[min(92vw,500px)] aspect-square mx-auto select-none touch-none p-2 sm:p-3 rounded-2xl transition-all duration-300 ${
        isFeverMode
          ? 'bg-gradient-to-b from-red-950 via-rose-900 to-amber-950 shadow-[0_0_50px_rgba(239,68,68,0.7),inset_0_2px_8px_rgba(255,200,0,0.6)] border-4 border-rose-500 ring-4 ring-amber-400/80 animate-pulse'
          : 'bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] border-4 border-blue-600/80 ring-2 ring-blue-400/40'
      }`}
    >
      {/* Outer metallic bezel inner line */}
      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)] bg-neutral-950">
        {/* Fever Mode Flame Embers Floating within the Board */}
        {isFeverMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/15 via-orange-500/10 to-transparent mix-blend-screen" />
            <div className="absolute bottom-2 left-6 w-3 h-3 rounded-full bg-amber-400 blur-[1px] animate-rise-ember" />
            <div className="absolute bottom-4 left-1/4 w-2.5 h-2.5 rounded-full bg-rose-500 blur-[1px] animate-rise-ember [animation-delay:0.4s]" />
            <div className="absolute bottom-1 left-1/2 w-3.5 h-3.5 rounded-full bg-yellow-300 blur-[1px] animate-rise-ember [animation-delay:0.8s]" />
            <div className="absolute bottom-3 left-3/4 w-2 h-2 rounded-full bg-orange-400 blur-[1px] animate-rise-ember [animation-delay:1.2s]" />
            <div className="absolute bottom-5 right-8 w-3 h-3 rounded-full bg-red-400 blur-[1px] animate-rise-ember [animation-delay:1.6s]" />
          </div>
        )}

        {/* Big Bouncing FEVERTIME Text in Center of Board */}
        {isFeverMode && (
          <div className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none select-none">
            <div className="flex flex-col items-center">
              <span className="font-black text-4xl sm:text-5xl md:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-red-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-fever-bounce scale-110">
                FEVERTIME
              </span>
              <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-amber-200 bg-red-950/80 px-2 py-0.5 rounded-full border border-amber-400/60 shadow-lg mt-1">
                점수 2배 보너스! 🔥
              </span>
            </div>
          </div>
        )}
        {/* Particle Canvas Overlay */}
        <ParticleCanvas
          triggers={particleTriggers}
          width={boardDimensions.width}
          height={boardDimensions.height}
        />

        {/* Floating Scores & Combo Text */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute z-30 font-black text-sm sm:text-base pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-float-fade"
            style={{
              left: `${ft.x}px`,
              top: `${ft.y}px`,
              color: ft.color,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {ft.text}
          </div>
        ))}

        {/* 8x8 Board Checkerboard Grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {board.map((row, r) =>
            row.map((gem, c) => {
              const isEvenCell = (r + c) % 2 === 0;
              const isSelected = selectedGem?.r === r && selectedGem?.c === c;
              const isHinted =
                (hint?.r1 === r && hint?.c1 === c) || (hint?.r2 === r && hint?.c2 === c);
              const isClearing = clearingCoords.has(`${r},${c}`);

              // Swapping offset calculations for smooth visual swap
              let transformStyle = '';
              if (swappingPair) {
                const { r1, c1, r2, c2 } = swappingPair;
                if (r === r1 && c === c1) {
                  const dr = (r2 - r1) * 100;
                  const dc = (c2 - c1) * 100;
                  transformStyle = `translate(${dc}%, ${dr}%)`;
                } else if (r === r2 && c === c2) {
                  const dr = (r1 - r2) * 100;
                  const dc = (c1 - c2) * 100;
                  transformStyle = `translate(${dc}%, ${dr}%)`;
                }
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={(e) => handlePointerDown(e, r, c)}
                  onClick={() => handleGemClick(r, c)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                    isEvenCell
                      ? 'bg-slate-900/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
                      : 'bg-neutral-900/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]'
                  } border-[0.5px] border-slate-800/40`}
                >
                  {/* Selection Indicator Glow Box */}
                  {isSelected && (
                    <div className="absolute inset-0.5 rounded-lg border-2 border-yellow-400 bg-yellow-400/20 shadow-[0_0_12px_rgba(250,204,21,0.6)] z-10 animate-pulse pointer-events-none" />
                  )}

                  {/* Hint Pulsing Box */}
                  {isHinted && !isSelected && (
                    <div className="absolute inset-1 rounded-lg border-2 border-white/80 bg-white/10 shadow-[0_0_14px_rgba(255,255,255,0.8)] z-10 animate-ping pointer-events-none" />
                  )}

                  {/* Gem Graphic Component */}
                  {gem && (
                    <div
                      className={`w-[86%] h-[86%] transition-transform duration-200 z-10 ${
                        isClearing ? 'scale-0 opacity-0 duration-200' : 'scale-100 opacity-100'
                      }`}
                      style={{
                        transform: transformStyle || undefined,
                        willChange: 'transform',
                      }}
                    >
                      <GemGraphic
                        type={gem.type}
                        special={gem.special}
                        isSelected={isSelected}
                        isHint={isHinted}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
