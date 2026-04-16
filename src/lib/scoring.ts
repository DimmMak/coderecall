import { Level } from './types';

const BASE_POINTS: Record<Level, number> = {
  1: 5,
  2: 10,
  3: 25,
};

const WRONG_PENALTY: Record<Level, number> = {
  1: 0,   // training wheels
  2: -1,
  3: -3,  // interview mode
};

const STREAK_MULTIPLIERS: [number, number][] = [
  [20, 3.0],
  [10, 2.0],
  [5, 1.5],
];

export function calculatePoints(level: Level, timeMs: number, streak: number): number {
  let points = BASE_POINTS[level];

  // Speed bonus
  if (timeMs < 2000) points += 3;
  else if (timeMs < 5000) points += 1;

  // Streak multiplier
  for (const [threshold, multiplier] of STREAK_MULTIPLIERS) {
    if (streak >= threshold) {
      points = Math.round(points * multiplier);
      break;
    }
  }

  return points;
}

export function getWrongPenalty(level: Level): number {
  return WRONG_PENALTY[level];
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 20) return '🔥🔥🔥';
  if (streak >= 10) return '🔥🔥';
  if (streak >= 5) return '🔥';
  return '';
}
