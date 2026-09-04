export type WorldType = 'default' | 'flat';

export type GameMode = 'survival' | 'creative' | 'hardcore';

export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';

export type BlockType = 
  | 'air'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'cobblestone'
  | 'bedrock'
  | 'sand'
  | 'wood'
  | 'leaves'
  | 'water'
  | 'glass'
  | 'brick'
  | 'plank';

export interface FlatLayer {
  block: BlockType;
  count: number;
}

export interface WorldData {
  id: string;
  name: string;
  folderName: string;
  worldType: WorldType;
  gameMode: GameMode;
  difficulty: Difficulty;
  seed: string;
  created: number;
  lastPlayed: number;
  sizeMb: number;
  version: string;
  allowCheats: boolean;
  generateStructures: boolean;
  flatLayers?: FlatLayer[];
  customNoiseScale?: number;
  modifiedBlocks?: Record<string, BlockType>;
  playerPos?: [number, number, number];
  playerYaw?: number;
  playerPitch?: number;
}

export interface FlatPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  layers: FlatLayer[];
}

export const FLAT_PRESETS: FlatPreset[] = [
  {
    id: 'classic',
    name: 'Классический плоский',
    description: '1 блок травы, 2 блока земли, 1 слой коренной породы (бедрок)',
    icon: '🌱',
    layers: [
      { block: 'grass', count: 1 },
      { block: 'dirt', count: 2 },
      { block: 'bedrock', count: 1 }
    ]
  },
  {
    id: 'miners_delight',
    name: 'Шахтерский рай',
    description: '1 трава, 5 земли, 64 камня, 1 бедрок для глубоких раскопок',
    icon: '⛏️',
    layers: [
      { block: 'grass', count: 1 },
      { block: 'dirt', count: 5 },
      { block: 'stone', count: 64 },
      { block: 'bedrock', count: 1 }
    ]
  },
  {
    id: 'desert',
    name: 'Бескрайняя пустыня',
    description: '8 блоков песка, 20 блоков песчаника/камня, 1 бедрок',
    icon: '🏜️',
    layers: [
      { block: 'sand', count: 8 },
      { block: 'stone', count: 20 },
      { block: 'bedrock', count: 1 }
    ]
  },
  {
    id: 'snowy',
    name: 'Снежная тундра',
    description: '1 слой снега/травы, 3 земли, 30 камня, 1 бедрок',
    icon: '❄️',
    layers: [
      { block: 'grass', count: 1 },
      { block: 'dirt', count: 3 },
      { block: 'stone', count: 30 },
      { block: 'bedrock', count: 1 }
    ]
  },
  {
    id: 'water_world',
    name: 'Водный мир',
    description: '30 блоков воды, 5 блоков песка, 1 бедрок',
    icon: '🌊',
    layers: [
      { block: 'water', count: 30 },
      { block: 'sand', count: 5 },
      { block: 'bedrock', count: 1 }
    ]
  }
];

export const INITIAL_WORLDS: WorldData[] = [
  {
    id: 'world-1',
    name: 'Новый мир',
    folderName: 'New World',
    worldType: 'default',
    gameMode: 'survival',
    difficulty: 'normal',
    seed: '7461982405',
    created: Date.now() - 86400000 * 3,
    lastPlayed: Date.now() - 1000 * 60 * 42,
    sizeMb: 14.8,
    version: '1.20.4 (Unity C#)',
    allowCheats: false,
    generateStructures: true,
    playerPos: [0, 12, 0]
  },
  {
    id: 'world-2',
    name: 'Суперплоский полигон',
    folderName: 'Superflat Test',
    worldType: 'flat',
    gameMode: 'creative',
    difficulty: 'peaceful',
    seed: '1337',
    created: Date.now() - 86400000 * 7,
    lastPlayed: Date.now() - 86400000 * 1,
    sizeMb: 2.1,
    version: '1.20.4 (Unity C#)',
    allowCheats: true,
    generateStructures: false,
    flatLayers: [
      { block: 'grass', count: 1 },
      { block: 'dirt', count: 2 },
      { block: 'bedrock', count: 1 }
    ],
    playerPos: [0, 5, 0]
  }
];

export const BLOCK_COLORS: Record<BlockType, { hex: string; top?: string; side?: string; bottom?: string; nameRu: string }> = {
  air: { hex: '#000000', nameRu: 'Воздух' },
  grass: { hex: '#5b8f36', top: '#67a33e', side: '#75543c', bottom: '#573d2a', nameRu: 'Дёрн (Трава)' },
  dirt: { hex: '#66452c', nameRu: 'Земля' },
  stone: { hex: '#777777', nameRu: 'Камень' },
  cobblestone: { hex: '#585858', nameRu: 'Булыжник' },
  bedrock: { hex: '#262626', nameRu: 'Бедрок (Коренная порода)' },
  sand: { hex: '#d9cd8b', nameRu: 'Песок' },
  wood: { hex: '#6b5130', top: '#9c7746', side: '#50381e', bottom: '#9c7746', nameRu: 'Древесина дуба' },
  leaves: { hex: '#376822', nameRu: 'Листва дуба' },
  water: { hex: '#2d5ea8', nameRu: 'Вода' },
  glass: { hex: '#d4eef7', nameRu: 'Стекло' },
  brick: { hex: '#8c3d31', nameRu: 'Кирпичи' },
  plank: { hex: '#a27f4d', nameRu: 'Дубовые доски' },
};
