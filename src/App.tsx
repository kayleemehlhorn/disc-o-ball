import { useReducer, useRef } from 'react'
import { createInitialState, gameReducer, THROWS_PER_ROUND } from './game/reducer'
import { getTotalScore } from './game/scoring'
import type { GameStatus, Target } from './game/types'
import './App.css'

const targets: Target[] = ['MISS', 'TEN', 'TWENTY_FIVE', 'FIFTY', 'HUNDRED']

const statusLabels: Record<GameStatus, string> = {
  MENU: 'Ready to start',
  WAITING_FOR_THROW: 'Ready to throw',
  PROCESSING_THROW: 'Processing throw',
  SHOWING_RESULT: 'Throw result',
  ROUND_COMPLETE: 'Round complete',
}

function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const throwSequence = useRef(0)
  const score = getTotalScore(game)
  const throwsRemaining = THROWS_PER_ROUND - game.throws.length
  const lastThrow = game.throws.at(-1)

  function simulateThrow() {
    const target = targets[Math.floor(Math.random() * targets.length)]
    const id = `simulated-${++throwSequence.current}`

    dispatch({ type: 'THROW_STARTED' })
    dispatch({ type: 'THROW_RESOLVED', id, target, source: 'simulated' })
  }

  function playAgain() {
    dispatch({ type: 'RESET' })
    dispatch({ type: 'START' })
  }

  return (
    <main className="game">
      <h1>Disc-O-Ball</h1>
      <dl className="scoreboard">
        <div>
          <dt>Score</dt>
          <dd>{score}</dd>
        </div>
        <div>
          <dt>Throws remaining</dt>
          <dd>{throwsRemaining}</dd>
        </div>
      </dl>

      <div className="round-status" role="status" aria-atomic="true">
        <p>{statusLabels[game.status]}</p>
        {game.status === 'SHOWING_RESULT' && lastThrow && (
          <p className="outcome">
            Throw {lastThrow.number} · {lastThrow.target === 'MISS' ? 'Miss' : 'Hit'} · {lastThrow.score} points
          </p>
        )}
        {game.status === 'ROUND_COMPLETE' && (
          <p className="outcome">Final score · {score} points</p>
        )}
      </div>

      {game.status === 'MENU' && (
        <button type="button" onClick={() => dispatch({ type: 'START' })}>Start Game</button>
      )}
      {game.status === 'WAITING_FOR_THROW' && (
        <button type="button" onClick={simulateThrow}>Simulate Throw</button>
      )}
      {game.status === 'SHOWING_RESULT' && (
        <button type="button" onClick={() => dispatch({ type: 'CONTINUE' })}>
          {throwsRemaining === 0 ? 'Show Final Score' : 'Continue'}
        </button>
      )}
      {game.status === 'ROUND_COMPLETE' && (
        <button type="button" onClick={playAgain}>Play Again</button>
      )}
    </main>
  )
}

export default App
