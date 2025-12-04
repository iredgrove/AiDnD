export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export type AppMode = 'LOBBY' | 'CREATOR' | 'GAME';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  notes: string;
  stats?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
}

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRollResult {
  die: DiceType;
  value: number;
  timestamp: number;
}