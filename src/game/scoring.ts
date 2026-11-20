import type { GameState, Score, Target } from './types'

const TARGET_SCORES: Record<Target, Score> = {
  MISS: 0,
  TEN: 10,
  TWENTY_FIVE: 25,
  FIFTY: 50,
  HUNDRED: 100,
}

export function scoreTarget(target: Target): Score {
  return TARGET_SCORES[target]
}

export function getTotalScore(state: GameState): number {
  return state.throws.reduce((total, attempt) => total + attempt.score, 0)
}
