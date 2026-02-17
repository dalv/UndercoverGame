"use client";

import { useState, useCallback } from "react";
import {
  GameState,
  GamePhase,
  Player,
} from "@/lib/gameTypes";
import {
  createGame,
  checkWinCondition,
  tallyVotes,
  roleName,
  roleEmoji,
} from "@/lib/gameLogic";

// ─── Shared UI components ───────────────────────────────

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost:
      "bg-white/10 hover:bg-white/20 text-white border border-white/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Setup Phase ────────────────────────────────────────

function SetupPhase({ onStart }: { onStart: (names: string[], uc: number, mw: number) => void }) {
  const [playerCount, setPlayerCount] = useState(5);
  const [numUndercover, setNumUndercover] = useState(1);
  const [numMrWhite, setNumMrWhite] = useState(1);
  const [step, setStep] = useState<"config" | "names">("config");
  const [names, setNames] = useState<string[]>([]);

  const maxInfiltrators = Math.floor((playerCount - 1) / 2);

  function handleConfigNext() {
    setNames(Array.from({ length: playerCount }, () => ""));
    setStep("names");
  }

  if (step === "names") {
    return (
      <Card>
        <h2 className="text-xl font-bold mb-4 text-center">Player Names</h2>
        <div className="space-y-3 mb-6">
          {names.map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              onChange={(e) => {
                const n = [...names];
                n[i] = e.target.value;
                setNames(n);
              }}
              placeholder={`Player ${i + 1}`}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-indigo-500 text-white placeholder-white/40"
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep("config")}>
            Back
          </Button>
          <Button
            onClick={() => onStart(names.map((n, i) => n.trim() || `Player ${i + 1}`), numUndercover, numMrWhite)}
            className="flex-1"
          >
            Start Game
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-3xl font-bold text-center mb-1">Undercover</h1>
      <p className="text-white/50 text-center text-sm mb-6">Word Party Game</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-white/70 mb-2">
            Players: <span className="text-white font-bold">{playerCount}</span>
          </label>
          <input
            type="range"
            min={3}
            max={12}
            value={playerCount}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPlayerCount(v);
              const max = Math.floor((v - 1) / 2);
              if (numUndercover + numMrWhite > max) {
                setNumUndercover(Math.min(numUndercover, max));
                setNumMrWhite(Math.min(numMrWhite, Math.max(0, max - numUndercover)));
              }
            }}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">
            Undercover: <span className="text-white font-bold">{numUndercover}</span>
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(0, maxInfiltrators - numMrWhite)}
            value={numUndercover}
            onChange={(e) => setNumUndercover(Number(e.target.value))}
            className="w-full accent-red-500"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">
            Mr. White: <span className="text-white font-bold">{numMrWhite}</span>
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(0, maxInfiltrators - numUndercover)}
            value={numMrWhite}
            onChange={(e) => setNumMrWhite(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="text-sm text-white/50 text-center">
          {playerCount - numUndercover - numMrWhite} Civilians, {numUndercover} Undercover, {numMrWhite} Mr. White
        </div>
      </div>

      <Button
        onClick={handleConfigNext}
        disabled={numUndercover + numMrWhite === 0}
        className="w-full mt-6"
      >
        Next
      </Button>
      {numUndercover + numMrWhite === 0 && (
        <p className="text-red-400 text-xs text-center mt-2">
          Add at least 1 Undercover or Mr. White
        </p>
      )}
    </Card>
  );
}

// ─── Distribute Phase (pass the phone) ─────────────────

function DistributePhase({
  players,
  currentIndex,
  onNext,
  onDone,
}: {
  players: Player[];
  currentIndex: number;
  onNext: () => void;
  onDone: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const player = players[currentIndex];
  const isLast = currentIndex === players.length - 1;

  return (
    <Card className="text-center">
      {!revealed ? (
        <>
          <p className="text-white/50 text-sm mb-2">
            Pass the phone to:
          </p>
          <h2 className="text-2xl font-bold mb-6">{player.name}</h2>
          <Button onClick={() => setRevealed(true)}>
            Tap to See Your Word
          </Button>
        </>
      ) : (
        <>
          {player.role === "mrwhite" ? (
            <>
              <p className="text-white/50 text-sm mb-1">
                {player.name}, you are:
              </p>
              <div className="text-4xl mb-2">{roleEmoji(player.role)}</div>
              <p className="text-lg font-semibold text-purple-400 mb-4">
                Mr. White
              </p>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-lg text-white/60">
                  You have no word. Bluff your way through!
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-white/50 text-sm mb-2">
                {player.name}, your word is:
              </p>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-2xl font-bold">{player.word}</p>
              </div>
            </>
          )}
          <p className="text-xs text-white/30 mb-4">
            Memorize your word, then pass the phone.
          </p>
          <Button
            onClick={() => {
              setRevealed(false);
              if (isLast) onDone();
              else onNext();
            }}
          >
            {isLast ? "Everyone Ready — Start!" : "Pass Phone to Next Player"}
          </Button>
        </>
      )}
      <div className="mt-4 text-xs text-white/30">
        {currentIndex + 1} / {players.length}
      </div>
    </Card>
  );
}

// ─── Describe Phase ─────────────────────────────────────

function DescribePhase({
  players,
  currentIndex,
  round,
  onNext,
  onDone,
}: {
  players: Player[];
  currentIndex: number;
  round: number;
  onNext: () => void;
  onDone: () => void;
}) {
  const alivePlayers = players.filter((p) => p.alive);
  const player = alivePlayers[currentIndex];
  const isLast = currentIndex === alivePlayers.length - 1;

  return (
    <Card className="text-center">
      <p className="text-xs text-white/40 mb-1">Round {round} — Description</p>
      <h2 className="text-xl font-bold mb-2">{player.name}&apos;s Turn</h2>
      <p className="text-white/60 text-sm mb-6">
        Say one word or a short phrase that describes your secret word.
        <br />
        <span className="text-white/40">
          (Give enough info for allies to find you, but not enough for enemies!)
        </span>
      </p>
      <Button
        onClick={() => {
          if (isLast) onDone();
          else onNext();
        }}
      >
        {isLast ? "Everyone Described — Discuss!" : "Next Player"}
      </Button>
      <div className="mt-4 text-xs text-white/30">
        {currentIndex + 1} / {alivePlayers.length}
      </div>
    </Card>
  );
}

// ─── Discussion Phase ───────────────────────────────────

function DiscussPhase({ onDone }: { onDone: () => void }) {
  return (
    <Card className="text-center">
      <h2 className="text-xl font-bold mb-2">Discussion Time</h2>
      <p className="text-white/60 text-sm mb-6">
        Debate who you think the Undercover or Mr. White might be.
        <br />
        Build alliances. Question each other. Be suspicious!
      </p>
      <Button onClick={onDone}>Proceed to Vote</Button>
    </Card>
  );
}

// ─── Vote Phase ─────────────────────────────────────────

function VotePhase({
  players,
  votes,
  onVote,
  onDone,
}: {
  players: Player[];
  votes: Record<number, number>;
  onVote: (voterId: number, targetId: number) => void;
  onDone: () => void;
}) {
  const alive = players.filter((p) => p.alive);
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [voted, setVoted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);

  const currentVoter = alive[currentVoterIdx];
  const isLast = currentVoterIdx === alive.length - 1;

  if (voted && isLast) {
    return (
      <Card className="text-center">
        <h2 className="text-xl font-bold mb-4">All Votes Cast</h2>
        <Button onClick={onDone}>Reveal Results</Button>
      </Card>
    );
  }

  if (voted) {
    return (
      <Card className="text-center">
        <p className="text-white/50 text-sm mb-2">Pass the phone to:</p>
        <h2 className="text-2xl font-bold mb-6">{alive[currentVoterIdx + 1].name}</h2>
        <Button
          onClick={() => {
            setCurrentVoterIdx((i) => i + 1);
            setVoted(false);
            setSelectedTarget(null);
          }}
        >
          Ready to Vote
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs text-white/40 text-center mb-1">Voting</p>
      <h2 className="text-xl font-bold text-center mb-4">
        {currentVoter.name}, who do you vote to eliminate?
      </h2>
      <div className="space-y-2 mb-4">
        {alive
          .filter((p) => p.id !== currentVoter.id)
          .map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedTarget(p.id)}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                selectedTarget === p.id
                  ? "bg-red-600/30 border-red-500 border"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              {p.name}
            </button>
          ))}
      </div>
      <Button
        variant="danger"
        disabled={selectedTarget === null}
        onClick={() => {
          if (selectedTarget !== null) {
            onVote(currentVoter.id, selectedTarget);
            setVoted(true);
          }
        }}
        className="w-full"
      >
        Confirm Vote
      </Button>
      <div className="mt-3 text-xs text-white/30 text-center">
        {currentVoterIdx + 1} / {alive.length}
      </div>
    </Card>
  );
}

// ─── Reveal Phase ───────────────────────────────────────

function RevealPhase({
  player,
  onContinue,
}: {
  player: Player;
  onContinue: () => void;
}) {
  return (
    <Card className="text-center">
      <h2 className="text-xl font-bold mb-2">Eliminated!</h2>
      <div className="text-5xl mb-2">{roleEmoji(player.role)}</div>
      <p className="text-2xl font-bold mb-1">{player.name}</p>
      <p className="text-indigo-400 font-semibold mb-4">
        was {roleName(player.role)}
      </p>
      {player.word && (
        <p className="text-white/50 text-sm mb-4">
          Their word was: <span className="text-white font-semibold">{player.word}</span>
        </p>
      )}
      <Button onClick={onContinue}>Continue</Button>
    </Card>
  );
}

// ─── Mr. White Guess Phase ──────────────────────────────

function MrWhiteGuessPhase({
  player,
  civilianWord,
  onGuess,
}: {
  player: Player;
  civilianWord: string;
  onGuess: (correct: boolean) => void;
}) {
  const [guess, setGuess] = useState("");

  return (
    <Card className="text-center">
      <div className="text-4xl mb-2">{"\u{1F47B}"}</div>
      <h2 className="text-xl font-bold mb-2">Mr. White&apos;s Last Chance!</h2>
      <p className="text-white/60 text-sm mb-4">
        {player.name}, you were caught! But you can still win
        by guessing the Civilians&apos; word.
      </p>
      <input
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Type your guess..."
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-white/40 text-center text-lg mb-4"
      />
      <Button
        variant="danger"
        disabled={!guess.trim()}
        onClick={() => {
          const correct =
            guess.trim().toLowerCase() === civilianWord.toLowerCase();
          onGuess(correct);
        }}
        className="w-full"
      >
        Submit Guess
      </Button>
    </Card>
  );
}

// ─── Game Over Phase ────────────────────────────────────

function GameOverPhase({
  state,
  onPlayAgain,
}: {
  state: GameState;
  onPlayAgain: () => void;
}) {
  const winnerLabel =
    state.winner === "civilians"
      ? "Civilians Win!"
      : state.winner === "mrwhite"
      ? "Mr. White Wins!"
      : "Infiltrators Win!";

  return (
    <Card className="text-center">
      <h2 className="text-2xl font-bold mb-4">{winnerLabel}</h2>
      <div className="mb-4 space-y-1 text-sm">
        <p>
          Civilian word: <span className="font-bold text-green-400">{state.civilianWord}</span>
        </p>
        <p>
          Undercover word: <span className="font-bold text-red-400">{state.undercoverWord}</span>
        </p>
      </div>
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <h3 className="text-sm text-white/50 mb-2">Players</h3>
        <div className="space-y-1">
          {state.players.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className={p.alive ? "text-white" : "text-white/40 line-through"}>
                {p.name}
              </span>
              <span className="text-white/60">
                {roleEmoji(p.role)} {roleName(p.role)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={onPlayAgain} className="w-full">
        Play Again
      </Button>
    </Card>
  );
}

// ─── Main Game Controller ───────────────────────────────

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null);

  const updateGame = useCallback(
    (updater: (prev: GameState) => Partial<GameState>) => {
      setGame((prev) => (prev ? { ...prev, ...updater(prev) } : prev));
    },
    []
  );

  // Setup → create game
  function handleStart(names: string[], uc: number, mw: number) {
    setGame(createGame(names, uc, mw));
  }

  if (!game) {
    return <SetupPhase onStart={handleStart} />;
  }

  switch (game.phase) {
    case "distribute":
      return (
        <DistributePhase
          players={game.players}
          currentIndex={game.currentPlayerIndex}
          onNext={() =>
            updateGame((g) => ({ currentPlayerIndex: g.currentPlayerIndex + 1 }))
          }
          onDone={() =>
            updateGame(() => ({ phase: "describe" as GamePhase, currentPlayerIndex: 0 }))
          }
        />
      );

    case "describe":
      return (
        <DescribePhase
          players={game.players}
          currentIndex={game.currentPlayerIndex}
          round={game.round}
          onNext={() =>
            updateGame((g) => ({ currentPlayerIndex: g.currentPlayerIndex + 1 }))
          }
          onDone={() => updateGame(() => ({ phase: "discuss" as GamePhase }))}
        />
      );

    case "discuss":
      return (
        <DiscussPhase
          onDone={() =>
            updateGame(() => ({ phase: "vote" as GamePhase, votes: {} }))
          }
        />
      );

    case "vote":
      return (
        <VotePhase
          players={game.players}
          votes={game.votes}
          onVote={(voterId, targetId) =>
            updateGame((g) => ({
              votes: { ...g.votes, [voterId]: targetId },
            }))
          }
          onDone={() => {
            // Tally votes and eliminate
            const eliminatedId = tallyVotes(game);
            const updatedPlayers = game.players.map((p) =>
              p.id === eliminatedId ? { ...p, alive: false } : p
            );
            const eliminated = game.players.find((p) => p.id === eliminatedId)!;

            // If Mr. White, give them a chance to guess
            if (eliminated.role === "mrwhite") {
              setGame({
                ...game,
                players: updatedPlayers,
                eliminatedPlayerId: eliminatedId,
                phase: "mrwhite-guess",
              });
              return;
            }

            // Check win condition with updated players
            const tempState = { ...game, players: updatedPlayers };
            const winner = checkWinCondition(tempState);
            if (winner) {
              setGame({
                ...game,
                players: updatedPlayers,
                eliminatedPlayerId: eliminatedId,
                winner,
                phase: "reveal",
              });
            } else {
              setGame({
                ...game,
                players: updatedPlayers,
                eliminatedPlayerId: eliminatedId,
                phase: "reveal",
              });
            }
          }}
        />
      );

    case "reveal": {
      const eliminated = game.players.find(
        (p) => p.id === game.eliminatedPlayerId
      )!;
      return (
        <RevealPhase
          player={eliminated}
          onContinue={() => {
            if (game.winner) {
              updateGame(() => ({ phase: "gameover" as GamePhase }));
            } else {
              // Next round
              updateGame((g) => ({
                phase: "describe" as GamePhase,
                currentPlayerIndex: 0,
                votes: {},
                eliminatedPlayerId: null,
                round: g.round + 1,
              }));
            }
          }}
        />
      );
    }

    case "mrwhite-guess": {
      const mrWhite = game.players.find(
        (p) => p.id === game.eliminatedPlayerId
      )!;
      return (
        <MrWhiteGuessPhase
          player={mrWhite}
          civilianWord={game.civilianWord}
          onGuess={(correct) => {
            if (correct) {
              setGame({
                ...game,
                winner: "mrwhite",
                phase: "gameover",
              });
            } else {
              // Check if civilians have won now
              const winner = checkWinCondition(game);
              if (winner) {
                setGame({ ...game, winner, phase: "gameover" });
              } else {
                // Continue the game
                setGame({
                  ...game,
                  phase: "describe",
                  currentPlayerIndex: 0,
                  votes: {},
                  eliminatedPlayerId: null,
                  round: game.round + 1,
                });
              }
            }
          }}
        />
      );
    }

    case "gameover":
      return (
        <GameOverPhase state={game} onPlayAgain={() => setGame(null)} />
      );

    default:
      return null;
  }
}
