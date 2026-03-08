export type HabitType = 'tree' | 'flower' | 'mountain' | 'building';

// Sub-types per category — drives distinct 3D shapes
export type TreeSubType     = 'pine' | 'palm' | 'oak' | 'cactus';
export type FlowerSubType   = 'daisy' | 'tulip' | 'lotus' | 'sunflower';
export type MountainSubType = 'peak' | 'hill' | 'glacier';
export type BuildingSubType = 'tower' | 'dome' | 'cabin' | 'skyscraper';
export type ObjectSubType   = TreeSubType | FlowerSubType | MountainSubType | BuildingSubType;

/** Map a habit icon to a deterministic sub-type */
export const ICON_TO_SUBTYPE: Record<string, ObjectSubType> = {
  // tree
  '📚': 'pine', '📖': 'oak', '🎓': 'palm', '🧠': 'cactus', '✏️': 'pine', '🔬': 'oak',
  // flower
  '🧘': 'lotus', '🌿': 'daisy', '💆': 'tulip', '🫁': 'lotus', '💜': 'tulip', '🕯️': 'sunflower',
  // mountain
  '🏃': 'peak', '💪': 'peak', '🚴': 'hill', '🏋️': 'peak', '⚽': 'hill',
  '🥊': 'peak', '🏊': 'glacier',
  // building
  '💻': 'tower', '🎯': 'skyscraper', '🔧': 'cabin', '🎨': 'dome', '📊': 'skyscraper', '🚀': 'tower',
};

export interface Habit {
  id: string;
  name: string;
  icon: string;
  type: HabitType;
  streak: number;
  createdAt: string;
}

export interface HabitEntry {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface PlanetObject {
  id: string;
  type: HabitType;
  subType?: ObjectSubType;
  position: [number, number, number];
  scale: number;
  color: string;
  rotation: number;
  milestone?: boolean; // grown from a milestone streak
}

export const HABIT_TYPE_CONFIG: Record<HabitType, {
  label: string;
  icon: string;
  description: string;
  colors: string[];
  milestoneColor: string;
}> = {
  tree: {
    label: 'Tree',
    icon: '🌳',
    description: 'Reading, Learning',
    colors: ['#2d8a4e', '#3da85f', '#4cc971', '#2a7a45', '#35a05a'],
    milestoneColor: '#a8ff78',
  },
  flower: {
    label: 'Flower',
    icon: '🌸',
    description: 'Meditation, Self-care',
    colors: ['#e879a0', '#f59bb6', '#c94f8a', '#f472b6', '#ec4899'],
    milestoneColor: '#ff9ef5',
  },
  mountain: {
    label: 'Mountain',
    icon: '⛰️',
    description: 'Exercise, Fitness',
    colors: ['#8b5e3c', '#a0714f', '#7a4f2e', '#c49a6c', '#6b4226'],
    milestoneColor: '#e8c99a',
  },
  building: {
    label: 'Building',
    icon: '🏙️',
    description: 'Coding, Work',
    colors: ['#5b8def', '#4c7de6', '#7aa3f5', '#3d6ed8', '#60a5fa'],
    milestoneColor: '#c8b8ff',
  },
};

export interface Milestone {
  streak: number;
  label: string;
  emoji: string;
  description: string;
}

export const MILESTONES: Milestone[] = [
  { streak: 7,   label: 'Week Warrior',   emoji: '🌿', description: 'Bigger trees appear' },
  { streak: 30,  label: 'Month Master',   emoji: '🦋', description: 'Butterflies appear' },
  { streak: 100, label: 'Legend',          emoji: '✨', description: 'Glowing plants bloom' },
];
