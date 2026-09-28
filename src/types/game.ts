export type GemType =
  | 'ruby'      // Red square
  | 'diamond'   // White brilliant cut
  | 'amber'     // Orange hexagon
  | 'sapphire'  // Blue pointed teardrop
  | 'topaz'     // Yellow rhombus
  | 'emerald'   // Green octagon
  | 'amethyst'; // Purple triangle

export type SpecialType = 'none' | 'flame' | 'star' | 'hypercube';

export interface Gem {
  id: string;
  type: GemType;
  special: SpecialType;
  row: number;
  col: number;
}

export type GameMode = 'classic' | 'time_attack' | 'zen';
export type GameStatus = 'ready' | 'playing' | 'paused' | 'game_over';

export interface MatchResult {
  matchedGems: { r: number; c: number; gem: Gem }[];
  specialCreations: { r: number; c: number; special: SpecialType; type: GemType }[];
  score: number;
  comboCount: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface MoveHint {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  evalScore?: number;
}

export type ChessEvalGrade =
  | 'brilliant' // !! Brilliant (최선의 수 이상: 5-match/Hypercube 또는 최고 밸류 수)
  | 'great'     // ! Great Move (고득점 4-match/특수보석 생성/발동)
  | 'best'      // ⭐️ Best Move (보드 위 가능한 수 중 가장 높은 점수/포텐셜)
  | 'excellent' // 👍 Excellent (차선의 우수한 수)
  | 'good'      // ✓ Good (평범하고 안정적인 3-매치)
  | 'inaccuracy'// ⁈ Inaccuracy (더 좋은 4-매치/특수수가 있었으나 놓침)
  | 'mistake'   // ? Mistake (매우 큰 기회가 있었는데 아쉬운 수)
  | 'blunder';  // ?? Blunder (5-매치/폭발 찬스를 완전히 날려버린 대실수)

export interface ChessMoveEvaluation {
  grade: ChessEvalGrade;
  titleKo: string;
  titleEn: string;
  symbol: string;
  color: string;
  bgColor: string;
  borderColor: string;
  reason: string;
  scoreGain: number;
  bestScoreGain: number;
}
