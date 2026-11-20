import { describe, expect, it } from 'vitest'
import { gameReducer, createInitialState, THROWS_PER_ROUND } from './reducer'
import { getTotalScore, scoreTarget } from './scoring'
import type { GameState, Target } from './types'

const targets: Array<[Target, number]> = [
  ['MISS', 0],
  ['TEN', 10],
  ['TWENTY_FIVE', 25],
  ['FIFTY', 50],
  ['HUNDRED', 100],
]

function startThrow(state: GameState): GameState {
  return gameReducer(state, { type: 'THROW_STARTED' })
}

function resolveThrow(state: GameState, id: string, target: Target): GameState {
  return gameReducer(state, {
    type: 'THROW_RESOLVED',
    id,
    target,
    source: 'simulated',
  })
}

describe('scoring', () => {
  it.each(targets)('scores %s as %i', (target, expected) => {
    expect(scoreTarget(target)).toBe(expected)
  })

  it('calculates the total from recorded throws', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = resolveThrow(startThrow(state), 'a', 'TEN')
    state = gameReducer(state, { type: 'CONTINUE' })
    state = resolveThrow(startThrow(state), 'b', 'FIFTY')

    expect(getTotalScore(state)).toBe(60)
    expect('totalScore' in state).toBe(false)
  })
})

describe('game reducer', () => {
  it('rejects events in invalid states', () => {
    const menu = createInitialState()
    expect(startThrow(menu)).toBe(menu)
    expect(resolveThrow(menu, 'a', 'TEN')).toBe(menu)
    expect(gameReducer(menu, { type: 'CONTINUE' })).toBe(menu)
    expect(gameReducer(menu, { type: 'RESET' })).toBe(menu)

    const waiting = gameReducer(menu, { type: 'START' })
    expect(waiting.status).toBe('WAITING_FOR_THROW')
    expect(gameReducer(waiting, { type: 'START' })).toBe(waiting)
    expect(resolveThrow(waiting, 'a', 'TEN')).toBe(waiting)

    const processing = startThrow(waiting)
    expect(processing.status).toBe('PROCESSING_THROW')
    expect(startThrow(processing)).toBe(processing)
    expect(gameReducer(processing, { type: 'CONTINUE' })).toBe(processing)

    const showing = resolveThrow(processing, 'a', 'TEN')
    expect(showing.status).toBe('SHOWING_RESULT')
    expect(resolveThrow(showing, 'b', 'FIFTY')).toBe(showing)
    expect(startThrow(showing)).toBe(showing)
    expect(gameReducer(showing, { type: 'RESET' })).toBe(showing)
  })

  it('rejects duplicate IDs from previous turns and blank IDs', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = resolveThrow(startThrow(state), 'first', 'TEN')
    state = gameReducer(state, { type: 'CONTINUE' })
    state = startThrow(state)

    expect(resolveThrow(state, 'first', 'HUNDRED')).toBe(state)
    expect(resolveThrow(state, '  ', 'HUNDRED')).toBe(state)
    expect(state.throws).toHaveLength(1)
    expect(getTotalScore(state)).toBe(10)

    const accepted = resolveThrow(state, 'second', 'FIFTY')
    expect(accepted.throws).toHaveLength(2)
    expect(accepted.throws[1].number).toBe(2)
    expect(getTotalScore(accepted)).toBe(60)
  })

  it('completes exactly five throws and can reset', () => {
    const initial = createInitialState()
    let state = gameReducer(initial, { type: 'START' })

    for (const [index, [target, score]] of targets.entries()) {
      state = startThrow(state)
      expect(state.status).toBe('PROCESSING_THROW')
      state = resolveThrow(state, `throw-${index + 1}`, target)
      expect(state.status).toBe('SHOWING_RESULT')
      expect(state.throws[index]).toMatchObject({
        id: `throw-${index + 1}`,
        number: index + 1,
        target,
        score,
      })
      state = gameReducer(state, { type: 'CONTINUE' })
      expect(state.status).toBe(
        index === THROWS_PER_ROUND - 1 ? 'ROUND_COMPLETE' : 'WAITING_FOR_THROW',
      )
    }

    expect(state.throws).toHaveLength(THROWS_PER_ROUND)
    expect(getTotalScore(state)).toBe(185)
    expect(startThrow(state)).toBe(state)
    expect(resolveThrow(state, 'sixth', 'HUNDRED')).toBe(state)
    expect(gameReducer(state, { type: 'CONTINUE' })).toBe(state)
    expect(initial).toEqual({ status: 'MENU', throws: [] })

    const reset = gameReducer(state, { type: 'RESET' })
    expect(reset).toEqual(createInitialState())
    expect(gameReducer(reset, { type: 'START' }).throws).toHaveLength(0)
  })
})
