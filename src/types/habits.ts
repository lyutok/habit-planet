export type HabitType = 'tree' | 'flower' | 'mountain' | 'building';

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
  position: [number, number, number]; // x, y, z on planet surface
  scale: number;
  color: string;
  rotation: number;
}

export const HABIT_TYPE_CONFIG: Record<HabitType, {
  label: string;
  icon: string;
  description: string;
  colors: string[];
}> = {
  tree: {
    label: 'Tree',
    icon: '🌳',
    description: 'Reading, Learning',
    colors: ['#2d8a4e', '#3da85f', '#4cc971', '#2a7a45'],
  },
  flower: {
    label: 'Flower',
    icon: '🌸',
    description: 'Meditation, Self-care',
    colors: ['#e879a0', '#f59bb6', '#c94f8a', '#f472b6'],
  },
  mountain: {
    label: 'Mountain',
    icon: '⛰️',
    description: 'Exercise, Fitness',
    colors: ['#7895b4', '#8fafc8', '#9bbad4', '#6a84a2'],
  },
  building: {
    label: 'Building',
    icon: '🏙️',
    description: 'Coding, Work',
    colors: ['#5b8def', '#4c7de6', '#7aa3f5', '#3d6ed8'],
  },
};
