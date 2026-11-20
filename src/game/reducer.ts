import { scoreTarget } from './scoring'
import type { GameEvent, GameState, Throw } from './types'

export const THROWS_PER_ROUND = 5

export function createInitialState(): GameState {
  return { status: 'MENU', throws: [] }
}

// Invalid events leave the state untouched. The caller can safely ignore
// repeated or out-of-order device events without changing the round.
export function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START':
      return state.status === 'MENU'
        ? { status: 'WAITING_FOR_THROW', throws: [] }
        : state

    case 'THROW_STARTED':
      return state.status === 'WAITING_FOR_THROW' &&
        state.throws.length < THROWS_PER_ROUND
        ? { ...state, status: 'PROCESSING_THROW' }
        : state

    case 'THROW_RESOLVED': {
      if (
        state.status !== 'PROCESSING_THROW' ||
        state.throws.length >= THROWS_PER_ROUND ||
        event.id.trim().length === 0 ||
        state.throws.some((attempt) => attempt.id === event.id)
      ) {
        return state
      }

      const attempt: Throw = {
        id: event.id,
        number: state.throws.length + 1,
        target: event.target,
        score: scoreTarget(event.target),
        source: event.source,
      }

      return {
        status: 'SHOWING_RESULT',
        throws: [...state.throws, attempt],
      }
    }

    case 'CONTINUE':
      if (state.status !== 'SHOWING_RESULT') return state
      return {
        ...state,
        status:
          state.throws.length === THROWS_PER_ROUND
            ? 'ROUND_COMPLETE'
            : 'WAITING_FOR_THROW',
      }

    case 'RESET':
      return state.status === 'ROUND_COMPLETE' ? createInitialState() : state
  }
}
