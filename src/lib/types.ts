export type Level = 1 | 2 | 3;
export type Language = 'sql' | 'python';

export interface Question {
  id: string;
  prompt: string;
  language: Language;
  answer: string;
  keywords: string[];
  nonKeywords: string[]; // literals like "'TSLA'", "315", "*", commas
  tokens: Token[];       // full ordered sequence for rendering
  difficulty_tags: string[];
}

export interface Token {
  text: string;
  isKeyword: boolean;
  index: number;        // position in the full token array
  keywordIndex?: number; // position among keywords only (for scoring)
}

export interface GameState {
  questions: Question[];
  currentQuestionIndex: number;
  currentTokenIndex: number;
  revealedTokens: Set<number>;
  score: number;
  streak: number;
  bestStreak: number;
  wrongAttempts: number;
  totalKeywords: number;
  correctKeywords: number;
  startTime: number;
  keywordStartTime: number;
  level: Level;
  language: Language;
  ticker: string;
  objective: string;
  isComplete: boolean;
  keywordTimes: number[];
}

export type GameAction =
  | { type: 'START_GAME'; questions: Question[]; level: Level; language: Language; ticker: string; objective: string }
  | { type: 'CORRECT_INPUT'; tokenIndex: number; timeMs: number }
  | { type: 'WRONG_INPUT' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_SESSION' };
