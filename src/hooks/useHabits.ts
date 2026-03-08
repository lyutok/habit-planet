import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitEntry, PlanetObject, HabitType, HABIT_TYPE_CONFIG, ICON_TO_SUBTYPE } from '@/types/habits';

const HABITS_KEY = 'habitplanet_habits_v2';
const ENTRIES_KEY = 'habitplanet_entries_v2';
const PLANET_KEY  = 'habitplanet_objects_v2';

function uid() {
  return Math.random().toString(36).substring(2, 11);
}
function surfacePoint(radius = 1.6): [number, number, number] {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ];
}
function randomColor(type: HabitType, milestone = false): string {
  const cfg = HABIT_TYPE_CONFIG[type];
  if (milestone) return cfg.milestoneColor;
  const arr = cfg.colors;
  return arr[Math.floor(Math.random() * arr.length)];
}

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch { return fallback; }
}

interface UseHabitsOptions {
  /** Override today's date string (YYYY-MM-DD) for testing */
  getToday?: () => string;
}

export function useHabits({ getToday }: UseHabitsOptions = {}) {
  const todayFn = useCallback(
    () => getToday ? getToday() : new Date().toISOString().split('T')[0],
    [getToday]
  );

  const [habits,        setHabits]        = useState<Habit[]>       (() => load(HABITS_KEY, []));
  const [entries,       setEntries]        = useState<HabitEntry[]> (() => load(ENTRIES_KEY, []));
  const [planetObjects, setPlanetObjects] = useState<PlanetObject[]>(() => load(PLANET_KEY, []));
  const [newObjectId,   setNewObjectId]   = useState<string | null>(null);
  const [sparklePos,    setSparklePos]    = useState<[number, number, number] | null>(null);

  useEffect(() => { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); },        [habits]);
  useEffect(() => { localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)); },       [entries]);
  useEffect(() => { localStorage.setItem(PLANET_KEY,  JSON.stringify(planetObjects)); }, [planetObjects]);

  const isCompletedToday = useCallback((habitId: string) => {
    const t = todayFn();
    return entries.some(e => e.habitId === habitId && e.date === t && e.completed);
  }, [entries, todayFn]);

  const addHabit = useCallback((name: string, type: HabitType, icon: string) => {
    setHabits(prev => [...prev, {
      id: uid(), name, icon, type, streak: 0, createdAt: new Date().toISOString(),
    }]);
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setEntries(prev => prev.filter(e => e.habitId !== habitId));
  }, []);

  const completeHabit = useCallback((habitId: string) => {
    if (isCompletedToday(habitId)) return;

    const t = todayFn();
    setEntries(prev => [...prev, { habitId, date: t, completed: true }]);

    let newStreak = 0;
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      newStreak = h.streak + 1;
      return { ...h, streak: newStreak };
    }));

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Determine if milestone
    const currentStreak = (habits.find(h => h.id === habitId)?.streak ?? 0) + 1;
    const isMilestone = [7, 30, 100].includes(currentStreak);

    const pos   = surfacePoint(isMilestone ? 1.62 : 1.58);
    const objId = uid();
    const scale = isMilestone
      ? 0.28 + Math.random() * 0.14
      : 0.13 + Math.random() * 0.12;

    const newObj: PlanetObject = {
      id: objId,
      type: habit.type,
      subType: ICON_TO_SUBTYPE[habit.icon],
      position: pos,
      scale,
      color: randomColor(habit.type, isMilestone),
      rotation: Math.random() * Math.PI * 2,
      milestone: isMilestone,
    };

    setPlanetObjects(prev => [...prev, newObj]);
    setNewObjectId(objId);
    setSparklePos(pos);
    setTimeout(() => setNewObjectId(null), 2000);
    setTimeout(() => setSparklePos(null), 2000);
  }, [habits, isCompletedToday, todayFn]);

  const resetAll = useCallback(() => {
    setHabits([]);
    setEntries([]);
    setPlanetObjects([]);
    setNewObjectId(null);
    setSparklePos(null);
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(PLANET_KEY);
  }, []);

  const getTotalCompletions = useCallback(() =>
    entries.filter(e => e.completed).length, [entries]);

  const getLongestStreak = useCallback(() =>
    habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak), 0), [habits]);

  /** The highest current streak among all habits */
  const getCurrentStreak = useCallback(() =>
    habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak), 0), [habits]);

  const getTodayCount = useCallback(() =>
    habits.filter(h => isCompletedToday(h.id)).length, [habits, isCompletedToday]);

  /**
   * Simulate `days` consecutive days of completing all habits.
   * Adds entries for each (habit, day) pair and spawns planet objects.
   * Returns the number of days advanced so the caller can update dayOffset.
   */
  const simulateStreak = useCallback((days: number) => {
    if (habits.length === 0) return;

    const baseDate = new Date(todayFn());
    const newEntries: HabitEntry[] = [];
    const newObjects: PlanetObject[] = [];

    habits.forEach(habit => {
      const currentStreak = habit.streak;
      for (let d = 1; d <= days; d++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];

        // Skip if already has an entry for this date
        const alreadyDone = entries.some(e => e.habitId === habit.id && e.date === dateStr);
        if (alreadyDone) continue;

        newEntries.push({ habitId: habit.id, date: dateStr, completed: true });

        const streakAtDay = currentStreak + d;
        const isMilestone = [7, 30, 100].includes(streakAtDay);
        const pos   = surfacePoint(isMilestone ? 1.62 : 1.58);
        const scale = isMilestone
          ? 0.28 + Math.random() * 0.14
          : 0.13 + Math.random() * 0.12;

        newObjects.push({
          id: uid(),
          type: habit.type,
          position: pos,
          scale,
          color: randomColor(habit.type, isMilestone),
          rotation: Math.random() * Math.PI * 2,
          milestone: isMilestone,
        });
      }
    });

    setEntries(prev => [...prev, ...newEntries]);
    setPlanetObjects(prev => [...prev, ...newObjects]);
    setHabits(prev => prev.map(h => ({ ...h, streak: h.streak + days })));
  }, [habits, entries, todayFn]);

  return {
    habits, entries, planetObjects,
    newObjectId, sparklePos,
    addHabit, deleteHabit, completeHabit, isCompletedToday,
    getTotalCompletions, getLongestStreak, getCurrentStreak, getTodayCount,
    simulateStreak, resetAll,
  };
}
