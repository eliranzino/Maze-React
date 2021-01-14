import React, { useCallback, useEffect, useReducer } from "react";
import styles from "./App.module.css";
import useInterval from "@use-it/interval";
import Header from "./Header";
import Notification from "./Notification";
import MazeGenerator from "./maze/MazeGenerator";
import Board from "./Board";

const ROUND_TIME = 60;
const ROWS = 17;
const COLS = 33;
const CLEAR_TIMER_MS = 3000;

function reducer(state, action) {
  switch (action.type) {
    case "startGame": {
      const startAudio = new Audio("/audio/maze.mp3");

      if (typeof startAudio.loop == "boolean") {
        startAudio.loop = true;
      } else {
        startAudio.addEventListener(
          "ended",
          function () {
            this.currentTime = 0;
            this.play();
          },
          false
        );
      }
      startAudio.play();
      return {
        ...state,
        startAudio,
        maze: action.payload.maze,
        currentCell: action.payload.maze.startCell,
        time: ROUND_TIME,
        round: state.round + 1,
      };
    }
    
    case "decrementTime": {
      const { time, isLollipopAppeared, isIceCreamAppeared } = state;
      if (time === ROUND_TIME - 30 && !isLollipopAppeared) {
        return {
          ...state,
          time: time - 1,
          isLollipop: true,
          isLollipopAppeared: true,
        };
      }
      if (time === 15 && !isIceCreamAppeared) {
        return {
          ...state,
          time: time - 1,
          isIceCream: true,
          isIceCreamAppeared: true,
        };
      }
      return {
        ...state,
        time: time - 1,
      };
    }
    case "moveCell": {
      const { points } = state;
      return {
        ...state,
        currentCell: action.payload.nextCell,
        points: points + 10,
      };
    }
    case "clearLollipop": {
      return {
        ...state,
        isGotLollipop: false,
      };
    }
    case "clearIceCream": {
      return {
        ...state,
        isGotIceCream: false,
      };
    }
    case "getLollipop": {
      return {
        ...state,
        points: state.points + 5000,
        time: state.time + 15,
        isLollipop: false,
        isGotLollipop: true,
      };
    }
    case "getIceCream": {
      return {
        ...state,
        points: state.points + 10000,
        time: state.time + 30,
        isIceCream: false,
        isGotIceCream: true,
      };
    }
    case "endGame": {
      const { startAudio, round, time } = state;
      startAudio.pause();
      const calculateWinning = round * time * 100;
      const points = calculateWinning;
      return {
        ...state,
        time: 0,
        hiScore: Math.max(state.hiScore, state.points),
        points,
        isIceCream: false,
        isLollipop: false,
        isLollipopAppeared: false,
        isIceCreamAppeared: false,
        isGotLollipop: false,
        isGotIceCream: false,
      };
    }
    default:
      throw new Error("Unknown action");
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, {
    points: 0,
    round: 0,
    hiScore: 0,
    time: undefined,
    maze: undefined,
    currentCell: undefined,
    startAudio: undefined,
    isIceCream: false,
    isLollipop: false,
    isLollipopAppeared: false,
    isIceCreamAppeared: false,
    isGotLollipop: false,
    isGotIceCream: false,
  });

  const handleGetLollipop = useCallback(
    (randomCellLollipop) => {
      if (
        randomCellLollipop[0] === state.currentCell[0] &&
        randomCellLollipop[1] === state.currentCell[1]
      ) {
        dispatch({ type: "getLollipop" });
        setTimeout(() => {
          dispatch({ type: "clearLollipop" });
        }, CLEAR_TIMER_MS);
      }
    },
    [state.currentCell]
  );

  const handleGetIceCream = useCallback(
    (randomCellIceCream) => {
      if (
        randomCellIceCream[0] === state.currentCell[0] &&
        randomCellIceCream[1] === state.currentCell[1]
      ) {
        dispatch({ type: "getIceCream" });
        setTimeout(() => {
          dispatch({ type: "clearIceCream" });
        }, CLEAR_TIMER_MS);
      }
    },
    [state.currentCell]
  );

  const handleOnEnterKeyPressed = useCallback(() => {
    if (!state.time) {
      dispatch({
        type: "startGame",
        payload: {
          maze: new MazeGenerator(ROWS, COLS).generate(),
        },
      });
    }
  }, [state.time]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (state.time === 0) {
        return;
      }
      if (e.keyCode === 13) {
        handleOnEnterKeyPressed();
      }
      if (!state.maze) {
        return;
      }

      const row = state.currentCell[1];
      const col = state.currentCell[0];
      const currentCell = state.maze.cells[row * state.maze.cols + col];

      switch (e.keyCode) {
        case 37: {
          const nextCell = [state.currentCell[0] - 1, state.currentCell[1]];

          if (nextCell[0] < 0) {
            return;
          }
          if (currentCell[3]) {
            return;
          }

          dispatch({
            type: "moveCell",
            payload: {
              nextCell,
            },
          });
          break;
        }

        case 39: {
          const nextCell = [state.currentCell[0] + 1, state.currentCell[1]];

          if (nextCell[0] > state.maze.cols - 1) {
            return;
          }
          if (currentCell[1]) {
            return;
          }
          checkIfWin(nextCell);

          dispatch({
            type: "moveCell",
            payload: {
              nextCell,
            },
          });
          break;
        }
        case 38: {
          const nextCell = [state.currentCell[0], state.currentCell[1] - 1];

          if (nextCell[1] < 0) {
            return;
          }
          if (currentCell[0]) {
            return;
          }

          dispatch({
            type: "moveCell",
            payload: {
              nextCell,
            },
          });
          break;
        }
        case 40: {
          const nextCell = [state.currentCell[0], state.currentCell[1] + 1];

          if (currentCell[2]) {
            return;
          }

          checkIfWin(nextCell);

          dispatch({
            type: "moveCell",
            payload: {
              nextCell,
            },
          });
          break;
        }
        default: {
          return;
        }
      }
    };
    function checkIfWin(nextCell) {
      if (nextCell[0] === COLS - 1 && nextCell[1] === ROWS - 1) {
        dispatch({
          type: "endGame",
        });
        const EndAudio = new Audio("/audio/level_end.mp3");
        EndAudio.play();
        setTimeout(() => {
          handleOnEnterKeyPressed();
        }, 3000);
      }
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleOnEnterKeyPressed, state.currentCell, state.maze, state.time]);

  useInterval(
    () => {
      dispatch({ type: "decrementTime" });
    },
    state.time ? 1000 : null
  );

  useEffect(() => {
    if (state.time === 0) {
      dispatch({ type: "endGame" });
      setTimeout(() => {
        handleOnEnterKeyPressed();
      }, 3000);
    }
  }, [state.time, handleOnEnterKeyPressed]);

  return (
    <div className={styles.root}>
      <Header
        hiScore={state.hiScore}
        points={state.points}
        time={state.time}
        round={state.round}
      />
      <Board
        maze={state.maze}
        currentCell={state.currentCell}
        isLollipop={state.isLollipop}
        isIceCream={state.isIceCream}
        time={state.time}
        handleGetLollipop={handleGetLollipop}
        handleGetIceCream={handleGetIceCream}
        isGotLollipop={state.isGotLollipop}
        isGotIceCream={state.isGotIceCream}
      />
      <Notification show={!state.time} gameOver={state.time === 0} />
    </div>
  );
}

export default App;
