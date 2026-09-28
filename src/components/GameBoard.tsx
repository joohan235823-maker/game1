import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Gem, MatchResult, MoveHint, ChessMoveEvaluation } from '../types/game';
import { GemGraphic } from './Gems';
import {
  GRID_SIZE,
  isValidSwap,
  findMatches,
  resolveHypercubeSwap,
  resolveSpecialSwap,
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
  onChessEval?: (evalData: ChessMoveEvaluation) => void;
  onGameOver?: (reason: string) => void;
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
  onChessEval,
  onGameOver,
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
  const [droppingCoords, setDroppingCoords] = useState<Set<string>>(new Set());
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
    async (currentBoard: (Gem | null)[][], combo = 1, initialMatchRes?: MatchResult) => {
      const matchRes: MatchResult = initialMatchRes || findMatches(currentBoard);

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
          count: 22, // Increased particle count for juicy impact!
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
      await new Promise((res) => setTimeout(res, 200));

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

      // Track newly refilled / fallen gems for drop animation
      const newlyDropped = new Set<string>();
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!newBoard[r] || !newBoard[r][c]) {
            const filler = createGem();
            filler.row = r;
            filler.col = c;
            if (!newBoard[r]) newBoard[r] = [];
            newBoard[r][c] = filler;
          }
          if (nextBoard[r][c] === null) {
            newlyDropped.add(`${r},${c}`);
          }
        }
      }

      setDroppingCoords(newlyDropped);
      setBoard(newBoard);

      // Drop settle delay
      await new Promise((res) => setTimeout(res, 260));
      setDroppingCoords(new Set());

      processCascades(newBoard, combo + 1);
    },
    [boardDimensions.width, onScoreGained, setBoard, setIsInteractive, addFloatingText]
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

      // Check special swap or standard swap validity
      const isSpecialSwap = g1.special !== 'none' || g2.special !== 'none';
      const valid = isSpecialSwap || isValidSwap(board, r1, c1, r2, c2);

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

      // Immediately notify parent app for top banner display
      if (onChessEval) {
        onChessEval(evalResult);
      }

      if (isSpecialSwap) {
        const specialMatchRes = resolveSpecialSwap(newBoard, r1, c1, r2, c2);
        if (specialMatchRes.matchedGems.length > 0) {
          processCascades(newBoard, 1, specialMatchRes);
        } else {
          setIsInteractive(true);
        }
      } else {
        const matchRes = findMatches(newBoard, { r1, c1, r2, c2 });
        if (matchRes.matchedGems.length > 0) {
          processCascades(newBoard, 1, matchRes);
        } else {
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
      className="relative w-full max-w-[min(92vw,500px)] aspect-square mx-auto select-none touch-none p-2 sm:p-3 rounded-2xl transition-all duration-300 bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] border-4 border-blue-600/80 ring-2 ring-blue-400/40"
    >
      {/* Outer metallic bezel inner line */}
      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)] bg-neutral-950">
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
              const isDropping = droppingCoords.has(`${r},${c}`);

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
                    <div className="absolute inset-1 rounded-lg border-2 border-white/80 bg-white/10 shadow-[0_0_14px_rgba(255,255,255,0.8)] z-10 pointer-events-none" />
                  )}

                  {/* Gem Graphic Component */}
                  {gem && (
                    <div
                      className={`w-[86%] h-[86%] transition-transform duration-200 z-10 ${
                        isClearing
                          ? 'scale-0 opacity-0 duration-200'
                          : isDropping
                          ? 'animate-drop-in'
                          : 'scale-100 opacity-100'
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
