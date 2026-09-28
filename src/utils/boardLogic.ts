import { Gem, GemType, MatchResult, MoveHint, SpecialType } from '../types/game';

export const GRID_SIZE = 8;
export const GEM_TYPES: GemType[] = [
  'ruby',
  'diamond',
  'amber',
  'sapphire',
  'topaz',
  'emerald',
  'amethyst',
];

let gemCounter = 0;
export function createGem(type?: GemType, special: SpecialType = 'none'): Gem {
  gemCounter++;
  const randomType = type || GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
  return {
    id: `gem-${gemCounter}-${Math.random().toString(36).substring(2, 7)}`,
    type: randomType,
    special,
    row: 0,
    col: 0,
  };
}

/**
 * Creates an empty 8x8 board
 */
export function createEmptyBoard(): (Gem | null)[][] {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
}

/**
 * Generate an initial board with NO initial matches and at least 3 valid moves.
 */
export function generateInitialBoard(): Gem[][] {
  let board: Gem[][] = [];
  let attempts = 0;

  while (attempts < 200) {
    attempts++;
    board = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Gem[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        // Pick gem type that doesn't create match with left or top neighbors
        const forbiddenTypes = new Set<GemType>();

        // Check horizontal 2-in-a-row
        if (c >= 2 && row[c - 1].type === row[c - 2].type) {
          forbiddenTypes.add(row[c - 1].type);
        }
        // Check vertical 2-in-a-row
        if (r >= 2 && board[r - 1][c].type === board[r - 2][c].type) {
          forbiddenTypes.add(board[r - 1][c].type);
        }

        const validTypes = GEM_TYPES.filter((t) => !forbiddenTypes.has(t));
        const selectedType = validTypes[Math.floor(Math.random() * validTypes.length)];
        const gem = createGem(selectedType);
        gem.row = r;
        gem.col = c;
        row.push(gem);
      }
      board.push(row);
    }

    const possibleMoves = checkPossibleMoves(board);
    if (possibleMoves.length >= 3) {
      return board;
    }
  }

  return board;
}

/**
 * Check whether swapping (r1, c1) and (r2, c2) is a valid move
 */
export function isValidSwap(
  board: (Gem | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  // Only adjacent orthogonal moves
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  if (dr + dc !== 1) return false;

  const g1 = board[r1]?.[c1];
  const g2 = board[r2]?.[c2];
  if (!g1 || !g2) return false;

  // Hypercube can swap with ANY adjacent gem!
  if (g1.special === 'hypercube' || g2.special === 'hypercube') {
    return true;
  }

  // Create temporary board copy with swapped gems
  const tempBoard = board.map((row) => [...row]);
  tempBoard[r1][c1] = g2;
  tempBoard[r2][c2] = g1;

  // Check if this results in any 3-match
  return checkHasMatches(tempBoard);
}

/**
 * Fast check if board has any 3-matches without full special calculation
 */
export function checkHasMatches(board: (Gem | null)[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const type = board[r][c]?.type;
      if (!type) continue;

      // Horizontal check
      if (
        c <= GRID_SIZE - 3 &&
        board[r][c + 1]?.type === type &&
        board[r][c + 2]?.type === type
      ) {
        return true;
      }

      // Vertical check
      if (
        r <= GRID_SIZE - 3 &&
        board[r + 1][c]?.type === type &&
        board[r + 2][c]?.type === type
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find all possible valid moves on the board
 */
export function checkPossibleMoves(board: (Gem | null)[][]): MoveHint[] {
  const moves: MoveHint[] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Right swap
      if (c < GRID_SIZE - 1 && isValidSwap(board, r, c, r, c + 1)) {
        moves.push({ r1: r, c1: c, r2: r, c2: c + 1 });
      }
      // Down swap
      if (r < GRID_SIZE - 1 && isValidSwap(board, r, c, r + 1, c)) {
        moves.push({ r1: r, c1: c, r2: r + 1, c2: c });
      }
    }
  }

  return moves;
}

/**
 * Detailed Match Detection:
 * - Detects horizontal & vertical lines
 * - Handles 4-match (Flame Gem), 5-match (Hypercube), T/L-match (Star Gem)
 * - Resolves special gem explosions (Flame: 3x3 blast, Star: row+col blast, Hypercube)
 */
export function findMatches(
  board: (Gem | null)[][],
  lastSwap?: { r1: number; c1: number; r2: number; c2: number }
): MatchResult {
  const matchedCoords = new Set<string>();
  const specialCreations: { r: number; c: number; special: SpecialType; type: GemType }[] = [];

  // Track horizontal line clusters
  const hLines: { r: number; startC: number; endC: number; type: GemType; length: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    let matchStart = 0;
    while (matchStart < GRID_SIZE) {
      const type = board[r][matchStart]?.type;
      if (!type) {
        matchStart++;
        continue;
      }
      let matchEnd = matchStart + 1;
      while (matchEnd < GRID_SIZE && board[r][matchEnd]?.type === type) {
        matchEnd++;
      }
      const length = matchEnd - matchStart;
      if (length >= 3) {
        hLines.push({ r, startC: matchStart, endC: matchEnd - 1, type, length });
        for (let c = matchStart; c < matchEnd; c++) {
          matchedCoords.add(`${r},${c}`);
        }
      }
      matchStart = matchEnd;
    }
  }

  // Track vertical line clusters
  const vLines: { c: number; startR: number; endR: number; type: GemType; length: number }[] = [];
  for (let c = 0; c < GRID_SIZE; c++) {
    let matchStart = 0;
    while (matchStart < GRID_SIZE) {
      const type = board[matchStart][c]?.type;
      if (!type) {
        matchStart++;
        continue;
      }
      let matchEnd = matchStart + 1;
      while (matchEnd < GRID_SIZE && board[matchEnd][c]?.type === type) {
        matchEnd++;
      }
      const length = matchEnd - matchStart;
      if (length >= 3) {
        vLines.push({ c, startR: matchStart, endR: matchEnd - 1, type, length });
        for (let r = matchStart; r < matchEnd; r++) {
          matchedCoords.add(`${r},${c}`);
        }
      }
      matchStart = matchEnd;
    }
  }

  // Helper to determine optimal placement for newly created special gem
  const chooseSpecialCoord = (
    cells: { r: number; c: number }[]
  ): { r: number; c: number } => {
    if (lastSwap) {
      const hit = cells.find(
        (cell) =>
          (cell.r === lastSwap.r1 && cell.c === lastSwap.c1) ||
          (cell.r === lastSwap.r2 && cell.c === lastSwap.c2)
      );
      if (hit) return hit;
    }
    // Return middle cell
    return cells[Math.floor(cells.length / 2)];
  };

  // Check intersections for T / L shapes -> Star Gem
  const handledCells = new Set<string>();
  for (const h of hLines) {
    for (const v of vLines) {
      if (h.type === v.type && v.c >= h.startC && v.c <= h.endC && h.r >= v.startR && h.r <= v.endR) {
        // Intersection detected!
        const interR = h.r;
        const interC = v.c;
        const key = `${interR},${interC}`;
        if (!handledCells.has(key)) {
          handledCells.add(key);
          specialCreations.push({
            r: interR,
            c: interC,
            special: 'star',
            type: h.type,
          });
        }
      }
    }
  }

  // Check 5-match -> Hypercube
  for (const h of hLines) {
    if (h.length >= 5) {
      const cells: { r: number; c: number }[] = [];
      for (let c = h.startC; c <= h.endC; c++) cells.push({ r: h.r, c });
      const target = chooseSpecialCoord(cells);
      const key = `${target.r},${target.c}`;
      if (!handledCells.has(key)) {
        handledCells.add(key);
        specialCreations.push({
          r: target.r,
          c: target.c,
          special: 'hypercube',
          type: h.type,
        });
      }
    }
  }
  for (const v of vLines) {
    if (v.length >= 5) {
      const cells: { r: number; c: number }[] = [];
      for (let r = v.startR; r <= v.endR; r++) cells.push({ r, c: v.c });
      const target = chooseSpecialCoord(cells);
      const key = `${target.r},${target.c}`;
      if (!handledCells.has(key)) {
        handledCells.add(key);
        specialCreations.push({
          r: target.r,
          c: target.c,
          special: 'hypercube',
          type: v.type,
        });
      }
    }
  }

  // Check 4-match -> Flame Gem
  for (const h of hLines) {
    if (h.length === 4) {
      const cells: { r: number; c: number }[] = [];
      for (let c = h.startC; c <= h.endC; c++) cells.push({ r: h.r, c });
      const target = chooseSpecialCoord(cells);
      const key = `${target.r},${target.c}`;
      if (!handledCells.has(key)) {
        handledCells.add(key);
        specialCreations.push({
          r: target.r,
          c: target.c,
          special: 'flame',
          type: h.type,
        });
      }
    }
  }
  for (const v of vLines) {
    if (v.length === 4) {
      const cells: { r: number; c: number }[] = [];
      for (let r = v.startR; r <= v.endR; r++) cells.push({ r, c: v.c });
      const target = chooseSpecialCoord(cells);
      const key = `${target.r},${target.c}`;
      if (!handledCells.has(key)) {
        handledCells.add(key);
        specialCreations.push({
          r: target.r,
          c: target.c,
          special: 'flame',
          type: v.type,
        });
      }
    }
  }

  // EXPAND FOR SPECIAL EXPLOSIONS (Flame 3x3, Star row+col)
  const finalMatched = new Set<string>(matchedCoords);
  const queue = Array.from(matchedCoords);
  const processedSpecials = new Set<string>();

  while (queue.length > 0) {
    const coord = queue.pop()!;
    if (processedSpecials.has(coord)) continue;
    processedSpecials.add(coord);

    const [r, c] = coord.split(',').map(Number);
    const gem = board[r]?.[c];
    if (!gem) continue;

    if (gem.special === 'flame') {
      // 3x3 explosion
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            const nCoord = `${nr},${nc}`;
            if (!finalMatched.has(nCoord)) {
              finalMatched.add(nCoord);
              queue.push(nCoord);
            }
          }
        }
      }
    } else if (gem.special === 'star') {
      // Row and Column laser cross
      for (let col = 0; col < GRID_SIZE; col++) {
        const nCoord = `${r},${col}`;
        if (!finalMatched.has(nCoord)) {
          finalMatched.add(nCoord);
          queue.push(nCoord);
        }
      }
      for (let row = 0; row < GRID_SIZE; row++) {
        const nCoord = `${row},${c}`;
        if (!finalMatched.has(nCoord)) {
          finalMatched.add(nCoord);
          queue.push(nCoord);
        }
      }
    }
  }

  const matchedGems: { r: number; c: number; gem: Gem }[] = [];
  finalMatched.forEach((coord) => {
    const [r, c] = coord.split(',').map(Number);
    const gem = board[r]?.[c];
    if (gem) {
      matchedGems.push({ r, c, gem });
    }
  });

  const baseScore = matchedGems.length * 50;
  const bonus = specialCreations.length * 150;

  return {
    matchedGems,
    specialCreations,
    score: baseScore + bonus,
    comboCount: 1,
  };
}

/**
 * Handle direct Hypercube swap resolution
 */
export function resolveHypercubeSwap(
  board: (Gem | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): MatchResult {
  const g1 = board[r1][c1];
  const g2 = board[r2][c2];
  const matchedGems: { r: number; c: number; gem: Gem }[] = [];

  if (!g1 || !g2) {
    return { matchedGems: [], specialCreations: [], score: 0, comboCount: 1 };
  }

  // Double Hypercube swap! Destroys everything on board!
  if (g1.special === 'hypercube' && g2.special === 'hypercube') {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const gem = board[r][c];
        if (gem) {
          matchedGems.push({ r, c, gem });
        }
      }
    }
    return {
      matchedGems,
      specialCreations: [],
      score: 5000,
      comboCount: 2,
    };
  }

  // Hypercube swapped with a normal or special gem
  const targetType = g1.special === 'hypercube' ? g2.type : g1.type;
  // Always include both swapped gems
  matchedGems.push({ r: r1, c: c1, gem: g1 });
  matchedGems.push({ r: r2, c: c2, gem: g2 });

  // Find all gems of targetType
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const gem = board[r][c];
      if (gem && gem.type === targetType) {
        if (!matchedGems.some((m) => m.r === r && m.c === c)) {
          matchedGems.push({ r, c, gem });
        }
      }
    }
  }

  return {
    matchedGems,
    specialCreations: [],
    score: matchedGems.length * 100,
    comboCount: 1,
  };
}

/**
 * Drops gems downwards into empty cells, then spawns new gems at the top.
 * Returns the new board state.
 */
export function applyGravityAndRefill(
  board: (Gem | null)[][]
): { newBoard: Gem[][]; droppedGemsCount: number } {
  const newBoard: (Gem | null)[][] = createEmptyBoard();
  let droppedGemsCount = 0;

  for (let c = 0; c < GRID_SIZE; c++) {
    // Collect existing gems in this column from bottom to top
    const existingColGems: Gem[] = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const g = board[r][c];
      if (g !== null) {
        existingColGems.push(g);
      }
    }

    // Place existing gems from bottom up
    let writeRow = GRID_SIZE - 1;
    for (const gem of existingColGems) {
      if (gem.row !== writeRow) {
        droppedGemsCount++;
      }
      gem.row = writeRow;
      gem.col = c;
      newBoard[writeRow][c] = gem;
      writeRow--;
    }

    // Refill remaining top empty cells with new gems
    while (writeRow >= 0) {
      droppedGemsCount++;
      const newGem = createGem();
      newGem.row = writeRow;
      newGem.col = c;
      newBoard[writeRow][c] = newGem;
      writeRow--;
    }
  }

  return {
    newBoard: newBoard as Gem[][],
    droppedGemsCount,
  };
}

/**
 * Shuffles current gems on board until at least 3 moves are available with no instant matches.
 */
export function shuffleBoard(board: Gem[][]): Gem[][] {
  const allGems: Gem[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      allGems.push(board[r][c]);
    }
  }

  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    // Fisher-Yates shuffle
    for (let i = allGems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
    }

    const shuffledBoard: Gem[][] = [];
    let idx = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Gem[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const gem = { ...allGems[idx], row: r, col: c };
        row.push(gem);
        idx++;
      }
      shuffledBoard.push(row);
    }

    if (!checkHasMatches(shuffledBoard) && checkPossibleMoves(shuffledBoard).length >= 2) {
      return shuffledBoard;
    }
  }

  // Fallback to freshly generated board if shuffle stuck
  return generateInitialBoard();
}

/**
 * Evaluates the immediate and secondary value of a specific move.
 * Returns estimated score and special gem creations.
 */
export function evaluateMovePotential(
  board: (Gem | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): { score: number; specialType: SpecialType; matchedCount: number } {
  const g1 = board[r1]?.[c1];
  const g2 = board[r2]?.[c2];
  if (!g1 || !g2) return { score: 0, specialType: 'none', matchedCount: 0 };

  // Hypercube resolution
  if (g1.special === 'hypercube' || g2.special === 'hypercube') {
    const res = resolveHypercubeSwap(board, r1, c1, r2, c2);
    return {
      score: res.score + 500, // High strategic value
      specialType: 'hypercube',
      matchedCount: res.matchedGems.length,
    };
  }

  // Regular swap evaluation
  const tempBoard = board.map((row) => [...row]);
  tempBoard[r1][c1] = { ...g2, row: r1, col: c1 };
  tempBoard[r2][c2] = { ...g1, row: r2, col: c2 };

  const matchRes = findMatches(tempBoard, { r1, c1, r2, c2 });
  if (matchRes.matchedGems.length === 0) {
    return { score: 0, specialType: 'none', matchedCount: 0 };
  }

  let highestSpecial: SpecialType = 'none';
  if (matchRes.specialCreations.some((s) => s.special === 'hypercube')) {
    highestSpecial = 'hypercube';
  } else if (matchRes.specialCreations.some((s) => s.special === 'star')) {
    highestSpecial = 'star';
  } else if (matchRes.specialCreations.some((s) => s.special === 'flame')) {
    highestSpecial = 'flame';
  }

  // Bonus weight for creating or setting off specials
  let value = matchRes.score;
  if (highestSpecial === 'hypercube') value += 800;
  else if (highestSpecial === 'star') value += 500;
  else if (highestSpecial === 'flame') value += 300;

  return {
    score: value,
    specialType: highestSpecial,
    matchedCount: matchRes.matchedGems.length,
  };
}

/**
 * Evaluates all valid moves on the current board and grades the player's chosen move in Chess.com style
 * with statistical percentile ranking, blunder detection, and full explanation.
 */
export function evaluatePlayerMove(
  board: (Gem | null)[][],
  chosenR1: number,
  chosenC1: number,
  chosenR2: number,
  chosenC2: number,
  movesLeftAfterThis?: number
): import('../types/game').ChessMoveEvaluation {
  // Find all possible moves
  const allMoves = checkPossibleMoves(board);

  // Evaluate each possible move to create distribution
  let bestScore = 0;
  let hasHypercubeOpportunity = false;
  let hasStarOpportunity = false;
  let hasFlameOpportunity = false;
  const flameOpportunityMoves: MoveHint[] = [];
  const hypercubeOpportunityMoves: MoveHint[] = [];
  const moveScores: number[] = [];

  for (const move of allMoves) {
    const evalResult = evaluateMovePotential(board, move.r1, move.c1, move.r2, move.c2);
    move.evalScore = evalResult.score;
    moveScores.push(evalResult.score);
    if (evalResult.score > bestScore) {
      bestScore = evalResult.score;
    }
    if (evalResult.specialType === 'hypercube') {
      hasHypercubeOpportunity = true;
      hypercubeOpportunityMoves.push(move);
    }
    if (evalResult.specialType === 'star') hasStarOpportunity = true;
    if (evalResult.specialType === 'flame') {
      hasFlameOpportunity = true;
      flameOpportunityMoves.push(move);
    }
  }

  // Sort scores descending for statistical percentile analysis
  moveScores.sort((a, b) => b - a);

  // Evaluate chosen move
  const chosenEval = evaluateMovePotential(board, chosenR1, chosenC1, chosenR2, chosenC2);
  const myScore = chosenEval.score;
  const isBestMove = myScore >= bestScore && myScore > 0;
  const scoreRatio = bestScore > 0 ? myScore / bestScore : 1;

  // Check if player's chosen move disrupted the opportunities
  // (i.e. did the move destroy or preserve the tiles involved in making the special gem?)
  const isDisruptingFlame = flameOpportunityMoves.some(
    (m) =>
      m.r1 === chosenR1 ||
      m.c1 === chosenC1 ||
      m.r2 === chosenR2 ||
      m.c2 === chosenC2 ||
      Math.abs(m.r1 - chosenR1) <= 1
  );
  const isDisruptingHypercube = hypercubeOpportunityMoves.some(
    (m) =>
      m.r1 === chosenR1 ||
      m.c1 === chosenC1 ||
      m.r2 === chosenR2 ||
      m.c2 === chosenC2 ||
      Math.abs(m.r1 - chosenR1) <= 1
  );

  // Statistical rank: 1 is the best move, 2 is second best, etc.
  const rank = moveScores.indexOf(myScore) + 1;
  const totalOptions = moveScores.length;
  // Percentile: 100% means top of all moves
  const percentile = totalOptions > 1 ? Math.round(((totalOptions - rank) / (totalOptions - 1)) * 100) : 100;

  // CRITICAL BLUNDER: The move led directly to GAME OVER (0 valid moves left), but another move could have preserved the game!
  if (movesLeftAfterThis === 0 && totalOptions > 1) {
    return {
      grade: 'blunder',
      titleKo: '블런더?? (게임 오버)',
      titleEn: 'Game Over Blunder??',
      symbol: '??',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.25)',
      borderColor: '#f87171',
      reason: `치명적인 실수! 이어갈 수 있는 다른 수가 ${totalOptions - 1}개 있었지만, 이 수로 인해 둘 수 있는 수가 모두 소진되어 게임이 끝났습니다!`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 1. Brilliant (!!)
  // Creates a Hypercube (5-match) OR captures an elusive top 1% combination with enormous score
  if (chosenEval.specialType === 'hypercube' || (myScore >= 700 && isBestMove)) {
    return {
      grade: 'brilliant',
      titleKo: '브릴리언트!! (Brilliant)',
      titleEn: 'Brilliant!!',
      symbol: '!!',
      color: '#06b6d4', // Cyan-teal
      bgColor: 'rgba(6, 182, 212, 0.22)',
      borderColor: '#22d3ee',
      reason: `통계 상위 1%의 묘수! 하이퍼큐브 5-매치 또는 압도적인 고득점 기회를 완벽하게 성공시켰습니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 2. Great Move (!)
  // Creates a Star Gem (T/L shape) or Flame Gem (4-match) or activates massive explosion
  if (
    chosenEval.specialType === 'star' ||
    chosenEval.specialType === 'flame' ||
    (myScore >= 400 && isBestMove)
  ) {
    return {
      grade: 'great',
      titleKo: '훌륭한 수! (Great Move)',
      titleEn: 'Great Move!',
      symbol: '!',
      color: '#3b82f6', // Chess Great Blue
      bgColor: 'rgba(59, 130, 246, 0.22)',
      borderColor: '#60a5fa',
      reason:
        chosenEval.specialType === 'star'
          ? 'T/L 교차 매치로 십자 레이저 스타 보석을 생성했습니다!'
          : chosenEval.specialType === 'flame'
          ? '4개 직선 매치로 3x3 폭발 화염 보석을 생성했습니다!'
          : `가능한 ${totalOptions}개 수 중 상위 ${Math.max(5, 100 - percentile)}%의 전술적 우위를 점하는 강력한 수입니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 3. Best Move (⭐)
  // Highest evaluated move on board
  if (isBestMove) {
    return {
      grade: 'best',
      titleKo: '최선의 수 (Best Move)',
      titleEn: 'Best Move',
      symbol: '⭐',
      color: '#10b981', // Chess Best Green
      bgColor: 'rgba(16, 185, 129, 0.22)',
      borderColor: '#34d399',
      reason: `보드의 가능한 ${totalOptions}가지 수 중 가장 높은 점수(+${bestScore})를 내는 1위 수입니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 4. Blunder (??)
  // Severe blunder: Directly disrupted and ruined a 5-match Hypercube opportunity
  if (hasHypercubeOpportunity && isDisruptingHypercube && myScore <= 200) {
    return {
      grade: 'blunder',
      titleKo: '블런더?? (Blunder)',
      titleEn: 'Blunder??',
      symbol: '??',
      color: '#ef4444', // Red
      bgColor: 'rgba(239, 68, 68, 0.24)',
      borderColor: '#f87171',
      reason: `대실수! 보드에 5개 보석을 연결해 하이퍼큐브를 만들 수 있는 결정적 기회를 날렸습니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }
  if (hasStarOpportunity && myScore <= 150 && bestScore >= 500) {
    return {
      grade: 'blunder',
      titleKo: '블런더?? (Blunder)',
      titleEn: 'Blunder??',
      symbol: '??',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.24)',
      borderColor: '#f87171',
      reason: `치명적 실수! 특수 보석 폭발 찬스(+${bestScore}점)를 놓치고 일반 매치를 두었습니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 5. Mistake (?)
  // Directly disrupted a 4-match flame opportunity, OR scored far below potential (< 35%)
  if (hasFlameOpportunity && isDisruptingFlame && myScore <= 150) {
    return {
      grade: 'mistake',
      titleKo: '실수? (Mistake)',
      titleEn: 'Mistake?',
      symbol: '?',
      color: '#f97316', // Orange
      bgColor: 'rgba(249, 115, 22, 0.22)',
      borderColor: '#fb923c',
      reason: `화염 보석(4-매치)을 만들 수 있는 찬스를 깨뜨리고 일반 매치를 두었습니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }
  if (scoreRatio < 0.45 && bestScore >= 300) {
    return {
      grade: 'mistake',
      titleKo: '실수? (Mistake)',
      titleEn: 'Mistake?',
      symbol: '?',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.22)',
      borderColor: '#fb923c',
      reason: `훨씬 더 좋은 수(+${bestScore}점)가 있었으나 아쉬운 수를 두었습니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 6. Inaccuracy (⁈)
  if (scoreRatio < 0.75) {
    return {
      grade: 'inaccuracy',
      titleKo: '부정확함⁈ (Inaccuracy)',
      titleEn: 'Inaccuracy⁈',
      symbol: '⁈',
      color: '#eab308', // Yellow
      bgColor: 'rgba(234, 179, 8, 0.22)',
      borderColor: '#facc15',
      reason: `나쁘진 않지만, 더 효과적인 수(+${bestScore}점)가 존재했습니다.`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 7. Excellent (👍)
  if (scoreRatio >= 0.85) {
    return {
      grade: 'excellent',
      titleKo: '우수한 수 (Excellent)',
      titleEn: 'Excellent',
      symbol: '👍',
      color: '#84cc16', // Lime
      bgColor: 'rgba(132, 204, 22, 0.22)',
      borderColor: '#a3e635',
      reason: `최선의 수에 근접한 아주 좋은 선택입니다. (상위 ${Math.max(5, 100 - percentile)}%)`,
      scoreGain: myScore,
      bestScoreGain: bestScore,
    };
  }

  // 8. Good (✓)
  return {
    grade: 'good',
    titleKo: '좋은 수 (Good)',
    titleEn: 'Good',
    symbol: '✓',
    color: '#94a3b8', // Gray/Slate
    bgColor: 'rgba(148, 163, 184, 0.18)',
    borderColor: '#cbd5e1',
    reason: `안정적인 기본 3-매치 수입니다.`,
    scoreGain: myScore,
    bestScoreGain: bestScore,
  };
}
