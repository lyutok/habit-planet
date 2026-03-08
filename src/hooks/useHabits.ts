import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitEntry, PlanetObject, HabitType } from '@/types/habits';

const HABITS_KEY = 'habitplanet_habits';
const ENTRIES_KEY = 'habitplanet_entries';
const PLANET_OBJECTS_KEY = 'habitplanet_objects';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function getRandomSurfacePosition(radius = 1.55): [number, number, number] {
  // Random point on sphere surface
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return [x, y, z];
}

function getRandomColor(type: HabitType): string {
  const colors: Record<HabitType, string[]> = {
    tree: ['#2d8a4e', '#3da85f', '#4cc971', '#2a7a45', '#35a05a'],
    flower: ['#e879a0', '#f59bb6', '#c94f8a', '#f472b6', '#ec4899'],
    mountain: ['#7895b4', '#8fafc8', '#9bbad4', '#6a84a2', '#8ba5bf'],
    building: ['#5b8def', '#4c7de6', '#7aa3f5', '#3d6ed8', '#60a5fa'],
  };
  const arr = colors[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(HABITS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [entries, setEntries] = useState<HabitEntry[]>(() => {
    try {
      const stored = localStorage.getItem(ENTRIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [planetObjects, setPlanetObjects] = useState<PlanetObject[]>(() => {
    try {
      const stored = localStorage.getItem(PLANET_OBJECTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newObjectId, setNewObjectId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(PLANET_OBJECTS_KEY, JSON.stringify(planetObjects));
  }, [planetObjects]);

  const addHabit = useCallback((name: string, type: HabitType, icon: string) => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      icon,
      type,
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setEntries(prev => prev.filter(e => e.habitId !== habitId));
  }, []);

  const isCompletedToday = useCallback((habitId: string) => {
    const today = getTodayStr();
    return entries.some(e => e.habitId === habitId && e.date === today && e.completed);
  }, [entries]);

  const completeHabit = useCallback((habitId: string) => {
    if (isCompletedToday(habitId)) return;

    const today = getTodayStr();
    const newEntry: HabitEntry = {
      habitId,
      date: today,
      completed: true,
    };

    setEntries(prev => [...prev, newEntry]);

    // Update streak
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      return { ...h, streak: h.streak + 1 };
    }));

    // Spawn planet object
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const objId = generateId();
      const newObj: PlanetObject = {
        id: objId,
        type: habit.type,
        position: getRandomSurfacePosition(),
        scale: 0.15 + Math.random() * 0.15,
        color: getRandomColor(habit.type),
        rotation: Math.random() * Math.PI * 2,
      };
      setPlanetObjects(prev => [...prev, newObj]);
      setNewObjectId(objId);
      setTimeout(() => setNewObjectId(null), 1500);
    }
  }, [habits, isCompletedToday]);

  const getTotalCompletions = useCallback(() => {
    return entries.filter(e => e.completed).length;
  }, [entries]);

  const getLongestStreak = useCallback(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak), 0);
  }, [habits]);

  return {
    habits,
    entries,
    planetObjects,
    newObjectId,
    addHabit,
    deleteHabit,
    completeHabit,
    isCompletedToday,
    getTotalCompletions,
    getLongestStreak,
  };
}
