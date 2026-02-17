export type Role = "civilian" | "undercover" | "mrwhite";

export interface Player {
  id: number;
  name: string;
  role: Role;
  word: string | null; // null for Mr. White
  alive: boolean;
}

export type GamePhase =
  | "setup"           // Configure players & roles
  | "names"           // Enter player names
  | "distribute"      // Pass phone to see your word
  | "describe"        // Each player describes their word
  | "discuss"         // Free discussion
  | "vote"            // Vote to eliminate
  | "reveal"          // Show who was eliminated & their role
  | "mrwhite-guess"   // Mr. White gets a last chance to guess
  | "gameover";       // Show winner

export interface GameState {
  phase: GamePhase;
  players: Player[];
  civilianWord: string;
  undercoverWord: string;
  numUndercover: number;
  numMrWhite: number;
  currentPlayerIndex: number; // For distribute / describe phases
  votes: Record<number, number>; // voterId -> targetId
  eliminatedPlayerId: number | null;
  winner: "civilians" | "infiltrators" | "mrwhite" | null;
  round: number;
}
