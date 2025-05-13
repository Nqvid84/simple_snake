import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tile } from "./component/tile";

const height = 15;
const width = 15;
const MOVE_DELAY = 150; // Constant for movement delay
const OBSTACLE_COUNT = 10; // Constant for movement delay

interface point {
  x: number;
  y: number;
}

type movement = "w" | "a" | "s" | "d";

const initial_point = { x: Math.floor(width / 2), y: Math.floor(height / 2) };

const App = () => {
  const [tiles, setTiles] = useState<number[][]>(() => {
    const initialTiles = [];
    for (let i = 0; i < height; i++) {
      initialTiles.push(new Array(width).fill(2));
    }
    return initialTiles;
  });
  const [player, setPlayer] = useState<point[]>([initial_point]);
  const [food, setFood] = useState<point>({ x: 0, y: 0 });
  const [obstacles, setObstacles] = useState<point[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem("highScore") || "0", 10);
  });

  const directionRef = useRef<movement>("w");
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const generateObstacles = useCallback(() => {
    const obstacleCount = OBSTACLE_COUNT;
    const newObstacles: point[] = [];

    while (newObstacles.length < obstacleCount) {
      const obstacle = {
        x: Math.floor(Math.random() * height),
        y: Math.floor(Math.random() * width),
      };

      const isOccupied = player.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
        food.x === obstacle.x && food.y === obstacle.y ||
        newObstacles.some(o => o.x === obstacle.x && o.y === obstacle.y);

      if (!isOccupied) {
        newObstacles.push(obstacle);
      }
    }

    setObstacles(newObstacles);
  }, [player, food]);

  const generateFood = useCallback(() => {
    let newFood: point;
    do {
      newFood = {
        x: Math.floor(Math.random() * height),
        y: Math.floor(Math.random() * width),
      };
    } while (player.some(segment => (segment.x === newFood.x && segment.y === newFood.y) && (tiles[newFood.x][newFood.y] === 1)));
    setFood(newFood);
  }, [player, tiles]);

  const resetGame = useCallback(() => {
    const initial = [initial_point];
    setPlayer(initial);
    setScore(0);
    directionRef.current = "w";
    setIsPaused(false);
    generateFood();
    generateObstacles();
    setTiles(() => {
      const initialTiles = Array.from({ length: height }, () => new Array(width).fill(2));
      return initialTiles;
    });
  }, [generateFood, generateObstacles]);

  const insertSnake = useCallback(() => {
    const updatedTiles = Array.from({ length: height }, () => new Array(width).fill(2));

    // Insert the snake's body
    player.forEach(segment => {
      updatedTiles[segment.x][segment.y] = 0;
    });

    // Insert the food
    updatedTiles[food.x][food.y] = -1;

    // Insert obstacles
    obstacles.forEach(obstacle => {
      updatedTiles[obstacle.x][obstacle.y] = 1; // Use 1 to represent obstacles
    });

    setTiles(updatedTiles);
  }, [player, food, obstacles]);

  const changeDirection = (newDirection: movement) => {
    const opposite: Record<movement, movement> = { w: "s", s: "w", a: "d", d: "a" };
    if (directionRef.current !== opposite[newDirection]) {
      directionRef.current = newDirection;
    }
  };

  const hasSelfCollision = (head: point, body: point[]) => body.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

  const isOutOfBounds = (point: point) => point.x < 0 || point.x >= height || point.y < 0 || point.y >= width;

  const moveHead = (head: point, direction: movement): point => {
    const newHead = { ...head };
    if (direction === "w") newHead.x -= 1;
    else if (direction === "a") newHead.y -= 1;
    else if (direction === "s") newHead.x += 1;
    else if (direction === "d") newHead.y += 1;
    return newHead;
  };

  const handleSnakeMove = useCallback(() => {
    const newPlayer = [...player];
    for (let i = newPlayer.length - 1; i > 0; i--) {
      newPlayer[i] = { ...newPlayer[i - 1] };
    }
    const head = moveHead(newPlayer[0], directionRef.current);

    setPlayer(newPlayer);
    insertSnake();

    if (isOutOfBounds(head) || hasSelfCollision(head, newPlayer)) {
      setIsPaused(true);
      alert("💀 Game Over!");
      resetGame();
      return;
    }

    // Check for collision with obstacles
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
      setIsPaused(true);
      alert("💀 Game Over! You hit an obstacle!");
      resetGame();
      return;
    }

    newPlayer[0] = head;

    if (head.x === food.x && head.y === food.y) {
      newPlayer.push({ ...newPlayer[newPlayer.length - 1] });
      setScore(prev => prev + 10);

      // Check and set high score
      setHighScore(prevHigh => {
        const newScore = score + 10;
        if (newScore > prevHigh) {
          localStorage.setItem("highScore", newScore.toString());
          return newScore;
        }
        return prevHigh;
      });

      generateFood();
    }
  }, [player, food, obstacles, insertSnake, generateFood, resetGame]);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        handleSnakeMove();
      }, MOVE_DELAY);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isPaused, handleSnakeMove]);

  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    const handleKeyDown = (e: KeyboardEvent) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const key = e.key.toLowerCase();
        if (["w", "a", "s", "d"].includes(key)) {
          changeDirection(key as movement);
        } else if (key == "escape") {
          setIsPaused(prev => !prev);
        }
      }, 50);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveGame = () => {
    const gameState = {
      player,
      food,
      obstacles,
      direction: directionRef.current,
      score,
      highScore,
    };

    localStorage.setItem("snakeGameSave", JSON.stringify(gameState));
    alert("Game saved!");
  };

  const loadGame = () => {
    const saved = localStorage.getItem("snakeGameSave");
    if (!saved) {
      alert("No saved game found.");
      return;
    }

    try {
      const gameState = JSON.parse(saved);
      setPlayer(gameState.player);
      setFood(gameState.food);
      setObstacles(gameState.obstacles);
      directionRef.current = gameState.direction;
      setScore(gameState.score);
      setHighScore(gameState.highScore);
      setIsPaused(true); // Paused on load to let the user resume manually
      alert("Game loaded! Press Resume to continue.");
    } catch (err) {
      alert("Failed to load game.");
      console.error(err);
    }
  };

  return (
    <main className="bg-neutral-950 w-[100vw] overflow-hidden h-[100vh] flex flex-col gap-5 justify-center items-center">
      <div className="text-white text-lg mt-2">
        <div>Score: {score}</div>
        <div>High Score: {highScore}</div>
      </div>
      {!!tiles.length && (
        <div
          className="bg-neutral-900 shadow-lg rounded-lg gap-1 p-2 overflow-hidden grid relative"
          style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
        >
          {
            isPaused && <div className="absolute w-full h-full bg-neutral-950 z-50 bg-opacity-85"/>
          }
          {tiles.map((tile, rowIndex) =>
            tile.map((row_tile, colIndex) => (
              <Tile key={`${rowIndex}-${colIndex}`} value={row_tile} />
            ))
          )}
        </div>
      )}
      <div className="w-64 h-64 rounded-lg absolute right-8 bottom-8 flex flex-col text-neonBlue">
        <div className="w-full h-full flex justify-center items-center">
          <button
            onClick={() => changeDirection("w")}
            className="w-20 h-20 bg-neutral-900 rounded flex justify-center items-center"
            aria-label="Move Up"
          >
            {"W"}
          </button>
        </div>
        <div className="w-full h-full flex justify-between items-center">
          <button
            onClick={() => changeDirection("a")}
            className="w-20 h-20 bg-neutral-900 rounded flex justify-center items-center"
            aria-label="Move Left"
          >
            {"A"}
          </button>
          <button
            onClick={() => changeDirection("d")}
            className="w-20 h-20 bg-neutral-900 rounded flex justify-center items-center"
            aria-label="Move Right"
          >
            {"D"}
          </button>
        </div>
        <div className="w-full h-full flex justify-center items-center">
          <button
            onClick={() => changeDirection("s")}
            className="w-20 h-20 bg-neutral-900 rounded flex justify-center items-center"
            aria-label="Move Down"
          >
            {"S"}
          </button>
        </div>
      </div>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="mt-4 px-4 py-2 bg-neutral-900 text-neonBlue rounded"
      >
        {isPaused ? "Resume" : "Pause"}
      </button>

      <div className="absolute top-8 left-8 flex flex-col gap-2">
        <button
          onClick={saveGame}
          className="px-4 py-2 bg-neutral-900 text-neonGreen rounded"
        >
          Save
        </button>
        <button
          onClick={loadGame}
          className="px-4 py-2 bg-neutral-900 text-neonYellow rounded"
        >
          Load
        </button>
      </div>

    </main>
  );
};

export default App;