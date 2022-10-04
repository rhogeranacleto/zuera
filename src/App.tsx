import { useEffect, useReducer, useRef, useState } from 'react';
import { clearTimeout } from 'timers';
import './App.css';
import memes from './memes.json';

interface IMeme {
  name: string;
  src: string;
}

interface Player {
  name: string;
  score: number;
}

const getRandomizedList = (list: IMeme[]) =>
  list.map<[IMeme, number]>(item => [item, Math.random()])
    .sort(([, a], [, b]) => a - b)
    .map(([item]) => item);

const randomMemes = getRandomizedList(memes);

interface IState {
  playlist: IMeme[];
  current: IMeme;
  round: number;
  player?: Player;
  players: Player[];
  newPlayer: string;
  amountOfTime: number;
  timeRemaining: number;
}

type Action = { type: 'add_to_playlist', item: IMeme } | { type: 'merge', state: Partial<IState> } | { type: 'add_player', player: Player } | { type: 'decrese_time' } | { type: 'next_round' } | { type: 'suffle' } | { type: 'score' }

const reducer = (state: IState, action: Action): IState => {
  switch (action.type) {
    case 'merge': return {
      ...state,
      ...action.state
    }
    case 'add_to_playlist': return {
      ...state,
      playlist: [...state.playlist, action.item]
    }
    case 'add_player': return {
      ...state,
      players: [...state.players, action.player]
    }
    case 'decrese_time': return {
      ...state,
      timeRemaining: state.timeRemaining - 1
    }
    case 'next_round': return {
      ...state,
      round: state.round + 1,
      playlist: getRandomizedList(state.playlist)
    }
    case 'suffle': return {
      ...state,
      playlist: getRandomizedList(state.playlist)
    }
    case 'score':
      const player = { ...state.player!, score: (state.player?.score ?? 0) + 1 }
      return {
        ...state,
        player: player,
        players: state.players.map(p =>
          p === state.player ? player : p
        )
      }

    default: return state
  }
}

function App() {
  const [{
    playlist,
    current,
    round,
    players,
    player,
    newPlayer,
    amountOfTime,
    timeRemaining
  }, dispatch] = useReducer(reducer, {
    playlist: [],
    current: randomMemes[0],
    round: 0,
    players: [],
    newPlayer: '',
    amountOfTime: 90,
    timeRemaining: 0
  });

  const timeout = useRef<any>();

  const next = (score?: boolean) => {
    const list = round > 1 ? playlist : randomMemes;
    if (round === 1) {
      dispatch({ type: 'add_to_playlist', item: current });
    }

    dispatch({
      type: 'merge', state: {
        current: list[list.indexOf(current) + 1] ?? list[0]
      }
    });
    dispatch({
      type: 'suffle'
    });

    if (score) {
      dispatch({
        type: 'score'
      })
    }
  }

  useEffect(() => {
    if (timeRemaining === amountOfTime) {
      timeout.current = setInterval(() => {
        dispatch({ type: 'decrese_time' });
      }, 1000);
    }

    if (timeRemaining === 0) {
      clearInterval(timeout.current);
    }
  }, [timeRemaining, amountOfTime]);

  const nextPlayer = players[players.indexOf(player!) + 1];

  useEffect(() => {
    if (timeRemaining === 0 && player && players.indexOf(player) === players.length - 1) {
      debugger;
      dispatch({
        type: 'merge', state: {
          player: undefined,
        }
      });
      dispatch({
        type: 'next_round'
      });
    }
  }, [player, timeRemaining, players]);

  const panels: Record<number, JSX.Element> = {
    0: <main className='initial'>
      <header>
        <h1>Zuera</h1>
        Total de memes {memes.length}

      </header>
      <section>
        <ul>
          {players.map(player => <li key={player.name}>{player.name}</li>)}
          <li>
            <input type="text" value={newPlayer} onChange={e => dispatch({ type: 'merge', state: { newPlayer: e.target.value } })} />
          </li>
        </ul>
        <button onClick={() => {
          dispatch({ type: 'merge', state: { newPlayer: '' } });
          dispatch({ type: 'add_player', player: { name: newPlayer, score: 0 } })
        }}>Adicionar player</button>
      </section>
      <footer>
        <div>
          {amountOfTime} Segundos
          <input type="range" min={90} max={5 * 60} value={amountOfTime} onChange={e => dispatch({ type: 'merge', state: { amountOfTime: Number(e.target.value) } })} />
        </div>
        <button onClick={() => dispatch({ type: 'merge', state: { round: 1 } })}>Começar</button>
      </footer>
    </main>,
    4: <main>
      <header>
        <h1>Cabô</h1>
      </header>
      <ul>
        {players.map(p => <li key={p.name}>{p.name} fez {p.score} pontos</li>)}
      </ul>
      <footer>
        <button onClick={() => window.location.reload()}>De novo</button>
      </footer>
    </main>
  }

  return (
    <div className="App">
      {panels[round] ?? <>
        {timeRemaining ?
          <main>
            <header>
              <sub>Round {round} | {timeRemaining} segundos</sub>
              <h5>{player?.name} está jogando: {player?.score} pontos</h5>
              <h1>{current.name}</h1>
            </header>
            <section style={{ backgroundImage: `url("${current.src}")` }} />
            <footer>
              <button onClick={next.bind(undefined, false)} disabled={round === 3}>Passa</button>
              <button onClick={next.bind(undefined, true)} className="success">Acertou!</button>
            </footer>
          </main>
          :
          <main>
            <header>
              <sub>
                Round {round}
              </sub>
            </header>
            <section>
              <h1>Proximo jogador: {nextPlayer?.name}</h1>
            </section>
            <footer>
              <button className='success' onClick={() => {
                dispatch({
                  type: 'merge', state: {
                    player: nextPlayer,
                    timeRemaining: amountOfTime
                  }
                });
              }}>Start</button>
            </footer>
          </main>
        }
      </>}
    </div>
  );
}

export default App;
