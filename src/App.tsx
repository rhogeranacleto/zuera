import { FC, useEffect, useReducer, useRef } from 'react';
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
  currentIndex: number;
  round: number;
  playerIndex: number;
  players: Player[];
  newPlayer: string;
  amountOfTime: number;
  timeRemaining: number;
  rounds: number;
}

type Action = { type: 'add_to_playlist' } | { type: 'merge', state: Partial<IState> } | { type: 'add_player', player: Player } | { type: 'decrease_time' } | { type: 'next', score: boolean; } | { type: 'score' } | { type: 'next_player' } | { type: 'increase_player_score' } | { type: 'increase_index' } | { type: 'shuffle' }

const pipe = (actions: Action[]) => (state: IState) => actions.reduce((prevState, action) => reducer(prevState, action), state);



const reducer = (state: IState, action: Action): IState => {
  switch (action.type) {
    case 'merge': return {
      ...state,
      ...action.state
    }
    case 'add_to_playlist': return {
      ...state,
      playlist: [...state.playlist, randomMemes[state.currentIndex]]
    }
    case 'add_player': return {
      ...state,
      players: [...state.players, action.player]
    }
    case 'decrease_time': {
      const timeRemaining = state.timeRemaining - 1;

      if (timeRemaining) {
        return {
          ...state,
          timeRemaining
        }
      }

      const pipeline = pipe([{ type: 'next', score: false }, { type: 'next_player' }])

      return pipeline({
        ...state,
        timeRemaining
      });
    }

    case 'next_player': {
      const playerIndex = state.playerIndex + 1 === state.players.length ? 0 : state.playerIndex + 1

      if (playerIndex === 0) {
        return {
          ...state,
          playerIndex,
          round: state.round + 1,
          playlist: getRandomizedList(state.playlist),
          currentIndex: 0,
        }
      }

      return {
        ...state,
        playerIndex,
      }
    }

    case 'increase_player_score': return {
      ...state,
      players: state.players.map((player, i) => i === state.playerIndex ? { ...player, score: player.score + 1 } : player)
    }

    case 'increase_index': return {
      ...state,
      currentIndex: state.currentIndex + 1 === (state.round > 1 ? state.playlist : randomMemes).length ? 0 : state.currentIndex + 1,
    }

    case 'shuffle': return {
      ...state,
      playlist: getRandomizedList(state.playlist)
    }

    case 'next': {
      const actions: Action[] = [];

      if (action.score) actions.push({ type: 'increase_player_score' });

      actions.push({ type: 'increase_index' });

      if (state.round === 1) actions.push({ type: 'add_to_playlist' });

      const list = state.round > 1 ? state.playlist : randomMemes;

      if (state.currentIndex + 1 === list.length) actions.push({ type: 'shuffle' })

      return pipe(actions)(state);
    }

    default: return state
  }
}

const Iniital: FC<Pick<IState, 'players' | 'newPlayer' | 'amountOfTime' | 'rounds'> & { dispatch: React.Dispatch<Action> }> = ({
  dispatch,
  players,
  newPlayer,
  amountOfTime,
  rounds
}) => <main className='initial'>
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
        Rounds
        <input type='number' min={3} value={rounds} onChange={e => dispatch({ type: 'merge', state: { rounds: Number(e.target.value) } })} />
      </div>
      <button onClick={() => dispatch({ type: 'merge', state: { round: 1 } })}>Começar</button>
    </footer>
  </main>;

const FinalScore: FC<Pick<IState, 'players'>> = ({ players }) => <main>
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

const Game: FC<Pick<IState, 'playlist' | 'currentIndex' | 'round' | 'players' | 'playerIndex' | 'timeRemaining'> & { dispatch: React.Dispatch<Action> }> = ({
  dispatch,
  playlist,
  currentIndex,
  round,
  players,
  playerIndex,
  timeRemaining,
}) => {
  const list = round === 1 ? randomMemes : playlist;

  return <main>
    <header>
      <sub>Round {round} | {timeRemaining} segundos</sub>
      <h5>{players[playerIndex].name} está jogando: {players[playerIndex].score} pontos</h5>
      <h1>{list[currentIndex].name}</h1>
    </header>
    <section style={{ backgroundImage: `url("${list[currentIndex].src}")` }} />
    <footer>
      <button onClick={dispatch.bind(undefined, { type: 'next', score: false })} >Passa</button>
      <button onClick={dispatch.bind(undefined, { type: 'next', score: true })} className="success">Acertou!</button>
    </footer>
  </main>
}

const RoundScreen: FC<Pick<IState, 'round' | 'players' | 'playerIndex' | 'amountOfTime'> & { dispatch: React.Dispatch<Action> }> = ({
  round,
  players,
  playerIndex,
  amountOfTime,
  dispatch
}) => <main>
    <header>
      <sub>
        Round {round}
      </sub>
    </header>
    <section>
      <h1>Proximo jogador: {players[playerIndex].name}</h1>
    </section>
    <footer>
      <button className='success' onClick={() => {
        dispatch({
          type: 'merge', state: {
            timeRemaining: amountOfTime
          }
        });
      }}>Start</button>
    </footer>
  </main>

function App() {
  const [{
    playlist,
    currentIndex,
    round,
    players,
    playerIndex,
    newPlayer,
    amountOfTime,
    timeRemaining,
    rounds
  }, dispatch] = useReducer(reducer, {
    playlist: [],
    round: 0,
    players: [],
    newPlayer: '',
    amountOfTime: 10,
    timeRemaining: 0,
    rounds: 3,
    playerIndex: 0,
    currentIndex: 0
  });

  const timeout = useRef<any>();

  useEffect(() => {
    if (timeRemaining === amountOfTime) {
      timeout.current = setInterval(() => {
        dispatch({ type: 'decrease_time' });
      }, 1000);
    }

    if (timeRemaining === 0) {
      clearInterval(timeout.current);
    }
  }, [timeRemaining, amountOfTime]);

  const panels: Record<number, JSX.Element> = {
    0: <Iniital {...{ amountOfTime, dispatch, newPlayer, players, rounds }} />,
    [rounds + 1]: <FinalScore {...{ players }} />
  }

  return (
    <div className="App">
      {panels[round] ?? <>
        {timeRemaining ?
          <Game {...{ currentIndex, dispatch, playerIndex, players, playlist, round, timeRemaining }} />
          :
          <RoundScreen {...{ amountOfTime, dispatch, playerIndex, players, round }} />
        }
      </>}
    </div>
  );
}

export default App;
