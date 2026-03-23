import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitEntry, PlanetObject, HabitType, ObjectSubType, HABIT_TYPE_CONFIG, ICON_TO_SUBTYPE } from '@/types/habits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const HABITS_KEY = 'habitplanet_habits_v2';
const ENTRIES_KEY = 'habitplanet_entries_v2';
const PLANET_KEY = 'habitplanet_objects_v2';

// Keys for last viewed data when logged out
const LAST_VIEWED_HABITS_KEY = 'habitplanet_last_viewed_habits';
const LAST_VIEWED_ENTRIES_KEY = 'habitplanet_last_viewed_entries';
const LAST_VIEWED_PLANET_KEY = 'habitplanet_last_viewed_objects';

function uid() {
  return Math.random().toString(36).substring(2, 11);
}

function surfacePoint(radius = 1.6): [number, number, number] {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
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

const VALID_OBJECT_SUBTYPES = new Set<ObjectSubType>(Object.values(ICON_TO_SUBTYPE));

function parseObjectSubType(value: string | null): ObjectSubType | undefined {
  if (!value) return undefined;
  return VALID_OBJECT_SUBTYPES.has(value as ObjectSubType) ? (value as ObjectSubType) : undefined;
}

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch { return fallback; }
}

interface UseRemoteHabitsOptions {
  getToday?: () => string;
}

export function useRemoteHabits({ getToday }: UseRemoteHabitsOptions = {}) {
  const { user, isAnonymous, getCurrentUserId } = useAuth();
  const todayFn = useCallback(() => getToday ? getToday() : new Date().toISOString().split('T')[0], [getToday]);

  const [habits, setHabits] = useState<Habit[]>(() => load(HABITS_KEY, []));
  const [entries, setEntries] = useState<HabitEntry[]>(() => load(ENTRIES_KEY, []));
  const [planetObjects, setPlanetObjects] = useState<PlanetObject[]>(() => load(PLANET_KEY, []));
  const [newObjectId, setNewObjectId] = useState<string | null>(null);
  const [sparklePos, setSparklePos] = useState<[number, number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on auth change
  useEffect(() => {
    const loadFromDB = async () => {
      if (isAnonymous) {
        // For anonymous users, prefer last viewed data (from logout), otherwise regular data
        const lastViewedHabits = load(LAST_VIEWED_HABITS_KEY, null);
        const lastViewedEntries = load(LAST_VIEWED_ENTRIES_KEY, null);
        const lastViewedObjects = load(LAST_VIEWED_PLANET_KEY, null);
        
        if (lastViewedHabits !== null) {
          // User just logged out, show their last viewed data
          setHabits(lastViewedHabits);
          setEntries(lastViewedEntries || []);
          setPlanetObjects(lastViewedObjects || []);
        } else {
          // New anonymous user, start with regular localStorage (should be empty)
          setHabits(load(HABITS_KEY, []));
          setEntries(load(ENTRIES_KEY, []));
          setPlanetObjects(load(PLANET_KEY, []));
        }
        setLoading(false);
        return;
      }

      // Load from DB for authenticated users
      const userId = getCurrentUserId();
      if (!userId) return; // Safety check

      try {
        const [habitsRes, entriesRes, objectsRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', userId),
          supabase.from('habit_entries').select('*').eq('user_id', userId),
          supabase.from('planet_objects').select('*').eq('user_id', userId),
        ]);

        if (habitsRes.error) throw habitsRes.error;
        if (entriesRes.error) throw entriesRes.error;
        if (objectsRes.error) throw objectsRes.error;

        const dbHabits = habitsRes.data.map(h => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          type: h.type as HabitType,
          streak: h.streak || 0,
          createdAt: h.created_at,
        }));

        const dbEntries = entriesRes.data.map(e => ({
          habitId: e.habit_id,
          date: e.date,
          completed: e.completed,
        }));

        const dbObjects = objectsRes.data.map(o => ({
          id: o.id,
          type: o.type as HabitType,
          subType: parseObjectSubType(o.sub_type),
          position: [o.position_x, o.position_y, o.position_z] as [number, number, number],
          scale: o.scale,
          color: o.color,
          rotation: o.rotation,
          milestone: o.milestone,
        }));

        setHabits(dbHabits);
        setEntries(dbEntries);
        setPlanetObjects(dbObjects);
      } catch (error) {
        console.error('[RemoteHabits] Error loading from DB:', error);
        // Fallback to localStorage
        setHabits(load(HABITS_KEY, []));
        setEntries(load(ENTRIES_KEY, []));
        setPlanetObjects(load(PLANET_KEY, []));
      } finally {
        setLoading(false);
      }
    };

    loadFromDB();
  }, [user, isAnonymous, getCurrentUserId]);

  // Save to localStorage for anonymous users
  useEffect(() => { if (isAnonymous) localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); }, [habits, isAnonymous]);
  useEffect(() => { if (isAnonymous) localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)); }, [entries, isAnonymous]);
  useEffect(() => { if (isAnonymous) localStorage.setItem(PLANET_KEY, JSON.stringify(planetObjects)); }, [planetObjects, isAnonymous]);

  const isCompletedToday = useCallback((habitId: string) => {
    const t = todayFn();
    return entries.some(e => e.habitId === habitId && e.date === t && e.completed);
  }, [entries, todayFn]);

  const addHabit = useCallback(async (name: string, type: HabitType, icon: string) => {
    const userId = getCurrentUserId();

    const newHabit = {
      id: uid(),
      name,
      icon,
      type,
      streak: 0,
      createdAt: new Date().toISOString(),
    };

    if (isAnonymous) {
      setHabits(prev => [...prev, newHabit]);
    } else {
      if (!userId || loading) return; // Safety check for authenticated users and prevent during loading
      const { error } = await supabase.from('habits').insert({
        id: newHabit.id,
        user_id: userId,
        name,
        icon,
        type,
      });
      if (error) throw error;
      setHabits(prev => [...prev, newHabit]);
    }
  }, [isAnonymous, getCurrentUserId, loading]);

  const deleteHabit = useCallback(async (habitId: string) => {
    if (!isAnonymous) {
      const { error } = await supabase.from('habits').delete().eq('id', habitId);
      if (error) throw error;
    }
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setEntries(prev => prev.filter(e => e.habitId !== habitId));
  }, [isAnonymous]);

  const completeHabit = useCallback(async (habitId: string) => {
    if (isCompletedToday(habitId)) return;

    const t = todayFn();
    const userId = getCurrentUserId();
    if (!userId) return; // Safety check

    const newEntry = { habitId, date: t, completed: true };

    if (isAnonymous) {
      setEntries(prev => [...prev, newEntry]);
    } else {
      const { error } = await supabase.from('habit_entries').insert({
        habit_id: habitId,
        user_id: userId,
        date: t,
        completed: true,
      });
      if (error) throw error;
      setEntries(prev => [...prev, newEntry]);
    }

    let newStreak = 0;
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      newStreak = h.streak + 1;
      return { ...h, streak: newStreak };
    }));

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentStreak = (habits.find(h => h.id === habitId)?.streak ?? 0) + 1;
    const isMilestone = [7, 30, 100].includes(currentStreak);

    const pos = surfacePoint(isMilestone ? 1.62 : 1.58);
    const objId = uid();
    const scale = isMilestone ? 0.28 + Math.random() * 0.14 : 0.13 + Math.random() * 0.12;

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

    if (isAnonymous) {
      setPlanetObjects(prev => [...prev, newObj]);
    } else {
      const { error } = await supabase.from('planet_objects').insert({
        id: objId,
        user_id: userId,
        habit_id: habitId,
        type: habit.type,
        sub_type: newObj.subType,
        position_x: pos[0],
        position_y: pos[1],
        position_z: pos[2],
        scale,
        color: newObj.color,
        rotation: newObj.rotation,
        milestone: isMilestone,
      });
      if (error) throw error;
      setPlanetObjects(prev => [...prev, newObj]);
    }

    setNewObjectId(objId);
    setSparklePos(pos);
    setTimeout(() => setNewObjectId(null), 2000);
    setTimeout(() => setSparklePos(null), 2000);
  }, [habits, isCompletedToday, todayFn, isAnonymous, getCurrentUserId]);

  const resetAll = useCallback(async () => {
    if (!isAnonymous) {
      const userId = getCurrentUserId();
      if (userId) {
        await Promise.all([
          supabase.from('habits').delete().eq('user_id', userId),
          supabase.from('habit_entries').delete().eq('user_id', userId),
          supabase.from('planet_objects').delete().eq('user_id', userId),
        ]);
      }
    }
    setHabits([]);
    setEntries([]);
    setPlanetObjects([]);
    setNewObjectId(null);
    setSparklePos(null);
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(PLANET_KEY);
  }, [isAnonymous, getCurrentUserId]);

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
        const pos = surfacePoint(isMilestone ? 1.62 : 1.58);
        const scale = isMilestone
          ? 0.28 + Math.random() * 0.14
          : 0.13 + Math.random() * 0.12;

        newObjects.push({
          id: uid(),
          type: habit.type,
          subType: ICON_TO_SUBTYPE[habit.icon],
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

  const getTotalCompletions = useCallback(() => entries.filter(e => e.completed).length, [entries]);
  const getLongestStreak = useCallback(() => habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak), 0), [habits]);
  const getCurrentStreak = useCallback(() => habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak), 0), [habits]);
  const getTodayCount = useCallback(() => habits.filter(h => isCompletedToday(h.id)).length, [habits, isCompletedToday]);

  return {
    habits,
    entries,
    planetObjects,
    newObjectId,
    sparklePos,
    loading,
    addHabit,
    deleteHabit,
    completeHabit,
    isCompletedToday,
    getTotalCompletions,
    getLongestStreak,
    getCurrentStreak,
    getTodayCount,
    simulateStreak,
    resetAll,
  };
}