import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameMode, Gem, MoveHint, ChessEvalGrade, ChessMoveEvaluation } from './types/game';
import { generateInitialBoard, checkPossibleMoves } from './utils/boardLogic';
import { sound } from './utils/audio';
import { HUD } from './components/HUD';
import { GameBoard } from './components/GameBoard';
import { GameOverModal, HelpModal } from './components/Modals';
import { TopChessEvaluationBanner } from './components/TopChessEvaluationBanner';

const initialEvalCounts: Record<ChessEvalGrade, number> = {
  brilliant: 0,
  great: 0,
  best: 0,
  excellent: 0,
  good: 0,
  inaccuracy: 0,
  mistake: 0,
  blunder: 0,
};

export default function App() {
  const [board, setBoard] = useState<Gem[][]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [mode, setMode] = useState<GameMode>('classic');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [highestCombo, setHighestCombo] = useState(1);
  const [currentCombo, setCurrentCombo] = useState(1);
  const [isInteractive, setIsInteractive] = useState(false);
  const [hint, setHint] = useState<MoveHint | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Latest chess move evaluation displayed on the board top
  const [topChessEval, setTopChessEval] = useState<ChessMoveEvaluation | null>(null);
  const [evalCounts, setEvalCounts] = useState<Record<ChessEvalGrade, number>>(initialEvalCounts);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize board and load high score
  useEffect(() => {
    const savedHigh = localStorage.getItem('jewel_match_highscore');
    if (savedHigh) {
      setHighScore(parseInt(savedHigh, 10) || 0);
    }
    setIsMuted(sound.getMuted());

    const initialBoard = generateInitialBoard();
    setBoard(initialBoard);
    setIsInteractive(true);
  }, []);

  // Clear hint on action
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setHint(null);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Time Attack Timer loop
  useEffect(() => {
    if (mode !== 'time_attack' || isPaused || isGameOver) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current!);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [mode, isPaused, isGameOver]);

  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

  // Trigger Game Over
  const handleGameOver = (reason?: string) => {
    setIsGameOver(true);
    setIsInteractive(false);
    if (reason) {
      setGameOverReason(reason);
    }
    sound.playGameOver();

    // Check high score
    setHighScore((prevHigh) => {
      if (score > prevHigh) {
        localStorage.setItem('jewel_match_highscore', String(score));
        setIsNewHigh(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        return score;
      }
      setIsNewHigh(false);
      return prevHigh;
    });
  };

  // Score handler
  const handleScoreGained = useCallback(
    (gainedScore: number, combo: number) => {
      resetIdleTimer();
      setCurrentCombo(combo);
      setHighestCombo((prev) => Math.max(prev, combo));

      // In Time Attack, add time bonuses for combos and big matches
      if (mode === 'time_attack') {
        const bonusSeconds = combo > 1 ? combo : gainedScore >= 300 ? 2 : 0;
        if (bonusSeconds > 0) {
          setTimeLeft((prev) => Math.min(120, prev + bonusSeconds));
        }
      }

      setScore((prevScore) => {
        const newScore = prevScore + gainedScore;
        // Update high score immediately
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('jewel_match_highscore', String(newScore));
        }
        return newScore;
      });
    },
    [highScore, mode, resetIdleTimer]
  );

  // Manual Hint action (costs 100 points)
  const handleHint = () => {
    if (!isInteractive || isGameOver) return;
    const HINT_COST = 100;
    if (score < HINT_COST) {
      return;
    }
    sound.playHint();
    const moves = checkPossibleMoves(board);
    if (moves.length > 0) {
      const chosen = moves[Math.floor(Math.random() * moves.length)];
      setScore((prev) => Math.max(0, prev - HINT_COST));
      setHint(chosen);
    }
  };

  // Handle incoming chess move evaluation (persists indefinitely until next evaluation)
  const handleChessEval = useCallback((evalData: ChessMoveEvaluation) => {
    // Instantly update to newest evaluation and stay active permanently until next move
    setTopChessEval(evalData);

    setEvalCounts((prev) => ({
      ...prev,
      [evalData.grade]: prev[evalData.grade] + 1,
    }));

    // If brilliant, celebrate with small confetti!
    if (evalData.grade === 'brilliant') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });
    }
  }, []);

  // Restart Game
  const handleRestart = () => {
    sound.playClick();
    setIsGameOver(false);
    setIsNewHigh(false);
    setScore(0);
    setTimeLeft(60);
    setCurrentCombo(1);
    setHighestCombo(1);
    setHint(null);
    setTopChessEval(null);
    setEvalCounts(initialEvalCounts);
    setGameOverReason(null);

    const freshBoard = generateInitialBoard();
    setBoard(freshBoard);
    setIsInteractive(true);
    resetIdleTimer();
  };

  // Change Game Mode
  const handleSetMode = (newMode: GameMode) => {
    setMode(newMode);
    handleRestart();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative min-h-screen w-full text-slate-100 flex flex-col items-center justify-between select-none overflow-x-hidden p-2 sm:p-4 bg-neutral-950">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-[120px] bg-blue-600/10" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[100px] bg-indigo-600/10" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center flex-1 justify-start gap-1">
        {/* Top HUD Controls & Scores */}
        <HUD
          score={score}
          highScore={highScore}
          mode={mode}
          setMode={handleSetMode}
          timeLeft={timeLeft}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onHint={handleHint}
          onRestart={handleRestart}
          onHelp={() => setShowHelp(true)}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          comboCount={currentCombo}
        />

        {/* Real-time Top Chess Evaluation Banner (Balanced gap matching board gap) */}
        <div className="w-full my-0.5">
          <TopChessEvaluationBanner evaluation={topChessEval} />
        </div>

        {/* Center: 8x8 Jewel Board */}
        <main className="w-full flex-1 flex items-start sm:items-center justify-center pt-0.5">
          <GameBoard
            board={board}
            setBoard={setBoard}
            onScoreGained={handleScoreGained}
            hint={hint}
            clearHint={() => setHint(null)}
            isInteractive={isInteractive && !isGameOver && !isPaused}
            setIsInteractive={setIsInteractive}
            onChessEval={handleChessEval}
            onGameOver={handleGameOver}
          />
        </main>

        {/* Quiet Footer */}
        <footer className="w-full text-center text-[11px] text-slate-500 py-1 flex items-center justify-center gap-3">
          <span>8x8 Jewel Match Puzzle</span>
          <span>·</span>
          <span>모바일 터치 & 스와이프 지원</span>
        </footer>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          score={score}
          highScore={highScore}
          isNewHigh={isNewHigh}
          highestCombo={highestCombo}
          evalCounts={evalCounts}
          reason={gameOverReason}
          onRestart={handleRestart}
        />
      )}

      {/* How To Play Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
