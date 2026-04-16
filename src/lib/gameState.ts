import { GameState, GameAction, Question } from './types';
import { calculatePoints, getWrongPenalty } from './scoring';

export const initialGameState: GameState = {
  questions: [],
  currentQuestionIndex: 0,
  currentTokenIndex: 0,
  revealedTokens: new Set(),
  score: 0,
  streak: 0,
  bestStreak: 0,
  wrongAttempts: 0,
  totalKeywords: 0,
  correctKeywords: 0,
  startTime: Date.now(),
  keywordStartTime: Date.now(),
  level: 2,
  language: 'sql',
  ticker: '',
  objective: '',
  isComplete: false,
  keywordTimes: [],
};

function findNextKeywordIndex(question: Question, fromIndex: number): number {
  for (let i = fromIndex; i < question.tokens.length; i++) {
    if (question.tokens[i].isKeyword) {
      return i;
    }
  }
  return -1; // no more keywords — question complete
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const firstQuestion = action.questions[0];
      const firstKeywordIndex = firstQuestion
        ? findNextKeywordIndex(firstQuestion, 0)
        : 0;

      // Auto-reveal all non-keyword tokens for the first question
      const revealed = new Set<number>();
      if (firstQuestion) {
        firstQuestion.tokens.forEach((token, i) => {
          if (!token.isKeyword) revealed.add(i);
        });
      }

      return {
        ...initialGameState,
        questions: action.questions,
        level: action.level,
        language: action.language,
        ticker: action.ticker,
        objective: action.objective,
        startTime: Date.now(),
        keywordStartTime: Date.now(),
        currentTokenIndex: firstKeywordIndex,
        revealedTokens: revealed,
        totalKeywords: action.questions.reduce(
          (sum, q) => sum + q.tokens.filter(t => t.isKeyword).length,
          0
        ),
      };
    }

    case 'CORRECT_INPUT': {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      const newRevealed = new Set(state.revealedTokens);
      newRevealed.add(action.tokenIndex);

      const points = calculatePoints(state.level, action.timeMs, state.streak + 1);
      const newStreak = state.streak + 1;

      // Find next keyword
      const nextKeywordIndex = findNextKeywordIndex(
        currentQuestion,
        action.tokenIndex + 1
      );

      const questionComplete = nextKeywordIndex === -1;

      return {
        ...state,
        revealedTokens: newRevealed,
        score: state.score + points,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        correctKeywords: state.correctKeywords + 1,
        currentTokenIndex: questionComplete ? -1 : nextKeywordIndex,
        keywordStartTime: Date.now(),
        keywordTimes: [...state.keywordTimes, action.timeMs],
      };
    }

    case 'WRONG_INPUT': {
      const penalty = getWrongPenalty(state.level);
      return {
        ...state,
        score: Math.max(0, state.score + penalty),
        streak: 0,
        wrongAttempts: state.wrongAttempts + 1,
      };
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentQuestionIndex + 1;

      if (nextIndex >= state.questions.length) {
        return { ...state, isComplete: true };
      }

      const nextQuestion = state.questions[nextIndex];
      const firstKeyword = findNextKeywordIndex(nextQuestion, 0);

      // Auto-reveal non-keywords
      const revealed = new Set<number>();
      nextQuestion.tokens.forEach((token, i) => {
        if (!token.isKeyword) revealed.add(i);
      });

      return {
        ...state,
        currentQuestionIndex: nextIndex,
        currentTokenIndex: firstKeyword,
        revealedTokens: revealed,
        keywordStartTime: Date.now(),
      };
    }

    case 'COMPLETE_SESSION': {
      return { ...state, isComplete: true };
    }

    default:
      return state;
  }
}
