"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";

import { config } from "~/components/providers/WagmiProvider";
import { PurpleButton } from "~/components/ui/PurpleButton";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

function PixelPursuitGame() {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gridSize = 15;
  const cellSize = 20;

  const initialPlayerPos = { x: 7, y: 7 };
  const [playerPos, setPlayerPos] = useState(initialPlayerPos);
  const [ghosts, setGhosts] = useState([
    { x: 2, y: 2 },
    { x: 12, y: 2 },
    { x: 2, y: 12 },
    { x: 12, y: 12 }
  ]);

  const [dots, setDots] = useState(() => {
    const dots = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (Math.random() > 0.3) {
          dots.push({ x, y });
        }
      }
    }
    return dots;
  });

  const movePlayer = useCallback((dx: number, dy: number) => {
    setPlayerPos(prev => {
      const newX = Math.min(Math.max(prev.x + dx, 0), gridSize - 1);
      const newY = Math.min(Math.max(prev.y + dy, 0), gridSize - 1);
      
      // Check for dot collection
      setDots(prevDots => {
        const collectedDotIndex = prevDots.findIndex(dot => 
          dot.x === newX && dot.y === newY
        );
        if (collectedDotIndex !== -1) {
          setScore(prevScore => prevScore + 10);
          return prevDots.filter((_, i) => i !== collectedDotIndex);
        }
        return prevDots;
      });

      return { x: newX, y: newY };
    });
  }, []);

  const moveGhosts = useCallback(() => {
    setGhosts(prevGhosts => 
      prevGhosts.map(ghost => {
        const dx = Math.random() > 0.5 ? 1 : -1;
        const dy = Math.random() > 0.5 ? 1 : -1;
        return {
          x: Math.min(Math.max(ghost.x + dx, 0), gridSize - 1),
          y: Math.min(Math.max(ghost.y + dy, 0), gridSize - 1)
        };
      })
    );
  }, []);

  // Check for collisions
  useEffect(() => {
    const collision = ghosts.some(ghost => 
      ghost.x === playerPos.x && ghost.y === playerPos.y
    );
    if (collision) {
      setGameOver(true);
    }
  }, [playerPos, ghosts]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    
    const ghostInterval = setInterval(moveGhosts, 1000);
    return () => clearInterval(ghostInterval);
  }, [moveGhosts, gameOver]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, gameOver]);

  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-neutral-900">PixelPursuit Adventure</CardTitle>
        <CardDescription className="text-neutral-600">
          Score: {score} | Use arrow keys to move
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="relative"
          style={{ 
            width: gridSize * cellSize,
            height: gridSize * cellSize,
            backgroundColor: '#111',
            border: '2px solid #333'
          }}
        >
          {/* Dots */}
          {dots.map((dot, i) => (
            <div
              key={i}
              className="absolute bg-yellow-400 rounded-full"
              style={{
                width: 4,
                height: 4,
                left: dot.x * cellSize + cellSize/2 - 2,
                top: dot.y * cellSize + cellSize/2 - 2
              }}
            />
          ))}

          {/* Player */}
          <div
            className="absolute bg-yellow-400 rounded-full"
            style={{
              width: cellSize - 4,
              height: cellSize - 4,
              left: playerPos.x * cellSize + 2,
              top: playerPos.y * cellSize + 2,
              transition: 'all 0.1s'
            }}
          />

          {/* Ghosts */}
          {ghosts.map((ghost, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: cellSize - 4,
                height: cellSize - 4,
                left: ghost.x * cellSize + 2,
                top: ghost.y * cellSize + 2,
                backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff'][i],
                transition: 'all 0.1s'
              }}
            />
          ))}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75">
              <div className="text-white text-2xl font-bold">
                Game Over! Score: {score}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Frame(
  { title }: { title?: string } = { title: PROJECT_TITLE }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900">{title}</h1>
        <PixelPursuitGame />
      </div>
    </div>
  );
}
