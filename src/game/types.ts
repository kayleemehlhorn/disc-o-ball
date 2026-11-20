export type Score = 0 | 10 | 25 | 50 | 100

// A target is a game-level result. A future TechDisc adapter can map flight
// coordinates to one of these targets without changing the scoring rules.
export type Target = 'MISS' | 'TEN' | 'TWENTY_FIVE' | 'FIFTY' | 'HUNDRED'

export type ThrowSource = 'simulated' | 'techdisc'

export type Throw = {
  id: string
  number: number
  target: Target
  score: Score
  source: ThrowSource
}

export type GameStatus =
  | 'MENU'
  | 'WAITING_FOR_THROW'
  | 'PROCESSING_THROW'
  | 'SHOWING_RESULT'
  | 'ROUND_COMPLETE'

export type GameState = {
  status: GameStatus
  throws: Throw[]
}

export type GameEvent =
  | { type: 'START' }
  | { type: 'THROW_STARTED' }
  | { type: 'THROW_RESOLVED'; id: string; target: Target; source: ThrowSource }
  | { type: 'CONTINUE' }
  | { type: 'RESET' }
