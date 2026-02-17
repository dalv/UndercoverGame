import { GameState, Player, Role } from "./gameTypes";
import { wordPairs } from "./wordPairs";

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(
  playerNames: string[],
  numUndercover: number,
  numMrWhite: number
): GameState {
  const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  // Randomly decide which word goes to civilians vs undercover
  const [civilianWord, undercoverWord] =
    Math.random() < 0.5 ? pair : [pair[1], pair[0]];

  // Assign roles
  const roles: Role[] = [];
  for (let i = 0; i < numUndercover; i++) roles.push("undercover");
  for (let i = 0; i < numMrWhite; i++) roles.push("mrwhite");
  while (roles.length < playerNames.length) roles.push("civilian");
  const shuffledRoles = shuffle(roles);

  const players: Player[] = playerNames.map((name, i) => ({
    id: i,
    name,
    role: shuffledRoles[i],
    word:
      shuffledRoles[i] === "civilian"
        ? civilianWord
        : shuffledRoles[i] === "undercover"
        ? undercoverWord
        : null,
    alive: true,
  }));

  return {
    phase: "distribute",
    players,
    civilianWord,
    undercoverWord,
    numUndercover,
    numMrWhite,
    currentPlayerIndex: 0,
    votes: {},
    eliminatedPlayerId: null,
    winner: null,
    round: 1,
  };
}

export function checkWinCondition(state: GameState): GameState["winner"] {
  const alive = state.players.filter((p) => p.alive);
  const aliveCivilians = alive.filter((p) => p.role === "civilian");
  const aliveInfiltrators = alive.filter(
    (p) => p.role === "undercover" || p.role === "mrwhite"
  );

  // Infiltrators win if civilians are outnumbered or equal
  if (aliveInfiltrators.length >= aliveCivilians.length) {
    return "infiltrators";
  }

  // Civilians win if all infiltrators are eliminated
  if (aliveInfiltrators.length === 0) {
    return "civilians";
  }

  return null;
}

export function tallyVotes(state: GameState): number {
  const counts: Record<number, number> = {};
  for (const targetId of Object.values(state.votes)) {
    counts[targetId] = (counts[targetId] || 0) + 1;
  }

  let maxVotes = 0;
  let eliminatedId = -1;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = Number(id);
    }
  }
  return eliminatedId;
}

export function getAlivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.alive);
}

export function roleName(role: Role): string {
  switch (role) {
    case "civilian":
      return "Civilian";
    case "undercover":
      return "Undercover";
    case "mrwhite":
      return "Mr. White";
  }
}

export function roleEmoji(role: Role): string {
  switch (role) {
    case "civilian":
      return "\u{1F9D1}";
    case "undercover":
      return "\u{1F575}\uFE0F";
    case "mrwhite":
      return "\u{1F47B}";
  }
}
