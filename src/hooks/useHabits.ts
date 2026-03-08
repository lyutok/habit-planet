import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitEntry, PlanetObject, HabitType, HABIT_TYPE_CONFIG, ICON_TO_SUBTYPE } from '@/types/habits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface UseHabitsOptions {
  getToday?: () => string;
}

export function useHabits({ getToday }: UseHabitsOptions = {}) {
  const { user } = useAuth();
  const todayFn = useCallback(
    () => getToday ? getToday() : new Date().toISOString().split('T')[0],
    [getToday]
  );

  const [habits,        setHabits]        = useState<Habit[]>([]);
  const [entries,       setEntries]        = useState<HabitEntry[]>([]);
  const [planetObjects, setPlanetObjects] = useState<PlanetObject[]>([]);
  const [newObjectId,   setNewObjectId]   = useState<string | null>(null);
  const [sparklePos,    setSparklePos]    = useState<[number, number, number] | null>(null);
  const [loading,       setLoading]        = useState(true);

  // ── Load all data for user ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setEntries([]);
      setPlanetObjects([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const [habitsRes, entriesRes, objectsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('habit_entries').select('*').eq('user_id', user.id),
        supabase.from('planet_objects').select('*').eq('user_id', user.id).order('created_at'),
      ]);

      if (habitsRes.data) {
        setHabits(habitsRes.data.map(h => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          type: h.type as HabitType,
          streak: h.streak,
          createdAt: h.created_at,
        })));
      }
      if (entriesRes.data) {
        setEntries(entriesRes.data.map(e => ({
          habitId: e.habit_id,
          date: e.date,
          completed: e.completed,
        })));
      }
      if (objectsRes.data) {
        setPlanetObjects(objectsRes.data.map(o => ({
          id: o.id,
          type: o.type as HabitType,
          subType: o.sub_type as any,
          position: [o.position_x, o.position_y, o.position_z] as [number, number, number],
          scale: o.scale,
          color: o.color,
          rotation: o.rotation,
          milestone: o.milestone,
        })));
      }
      setLoading(false);
    };

    load();
  }, [user]);

  const isCompletedToday = useCallback((habitId: string) => {
    const t = todayFn();
    return entries.some(e => e.habitId === habitId && e.date === t && e.completed);
  }, [entries, todayFn]);

  const addHabit = useCallback(async (name: string, type: HabitType, icon: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('habits').insert({
      user_id: user.id, name, icon, type, streak: 0,
    }).select().single();
    if (!error && data) {
      setHabits(prev => [...prev, {
        id: data.id, name: data.name, icon: data.icon,
        type: data.type as HabitType, streak: data.streak, createdAt: data.created_at,
      }]);
    }
  }, [user]);

  const deleteHabit = useCallback(async (habitId: string) => {
    if (!user) return;
    await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
    // planet_objects and habit_entries cascade via FK
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setEntries(prev => prev.filter(e => e.habitId !== habitId));
    setPlanetObjects(prev => prev.filter(o => {
      // can't easily filter by habit here; keep all planet objects (they're permanent anyway)
      return true;
    }));
  }, [user]);

  const completeHabit = useCallback(async (habitId: string) => {
    if (!user || isCompletedToday(habitId)) return;

    const t = todayFn();

    // Insert entry
    await supabase.from('habit_entries').insert({
      user_id: user.id, habit_id: habitId, date: t, completed: true,
    });
    setEntries(prev => [...prev, { habitId, date: t, completed: true }]);

    // Update streak
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newStreak = habit.streak + 1;
    await supabase.from('habits').update({ streak: newStreak }).eq('id', habitId).eq('user_id', user.id);
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, streak: newStreak } : h));

    const isMilestone = [7, 30, 100].includes(newStreak);
    const pos   = surfacePoint(isMilestone ? 1.62 : 1.58);
    const objId = uid();
    const scale = isMilestone ? 0.28 + Math.random() * 0.14 : 0.13 + Math.random() * 0.12;
    const color = randomColor(habit.type, isMilestone);
    const rotation = Math.random() * Math.PI * 2;
    const subType = ICON_TO_SUBTYPE[habit.icon];

    const { data: objData } = await supabase.from('planet_objects').insert({
      user_id: user.id,
      type: habit.type,
      sub_type: subType,
      position_x: pos[0],
      position_y: pos[1],
      position_z: pos[2],
      scale,
      color,
      rotation,
      milestone: isMilestone,
    }).select().single();

    const newObj: PlanetObject = {
      id: objData?.id ?? objId,
      type: habit.type,
      subType,
      position: pos,
      scale,
      color,
      rotation,
      milestone: isMilestone,
    };

    setPlanetObjects(prev => [...prev, newObj]);
    setNewObjectId(newObj.id);
    setSparklePos(pos);
    setTimeout(() => setNewObjectId(null), 2000);
    setTimeout(() => setSparklePos(null), 2000);
  }, [user, habits, isCompletedToday, todayFn]);

  const resetAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      supabase.from('planet_objects').delete().eq('user_id', user.id),
      supabase.from('habit_entries').delete().eq('user_id', user.id),
      supabase.from('habits').delete().eq('user_id', user.id),
    ]);
    setHabits([]);
    setEntries([]);
    setPlanetObjects([]);
    setNewObjectId(null);
    setSparklePos(null);
  }, [user]);

  const getTotalCompletions = useCallback(() =>
    entries.filter(e => e.completed).length, [entries]);

  const getLongestStreak = useCallback(() =>
    habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak), 0), [habits]);

  const getCurrentStreak = useCallback(() =>
    habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak), 0), [habits]);

  const getTodayCount = useCallback(() =>
    habits.filter(h => isCompletedToday(h.id)).length, [habits, isCompletedToday]);

  const simulateStreak = useCallback(async (days: number) => {
    if (!user || habits.length === 0) return;

    const baseDate = new Date(todayFn());
    const newEntries: HabitEntry[] = [];
    const newObjects: PlanetObject[] = [];
    const dbEntries: { user_id: string; habit_id: string; date: string; completed: boolean }[] = [];
    const dbObjects: { user_id: string; type: string; sub_type: string | undefined; position_x: number; position_y: number; position_z: number; scale: number; color: string; rotation: number; milestone: boolean }[] = [];

    habits.forEach(habit => {
      const currentStreak = habit.streak;
      for (let d = 1; d <= days; d++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        const alreadyDone = entries.some(e => e.habitId === habit.id && e.date === dateStr);
        if (alreadyDone) continue;

        newEntries.push({ habitId: habit.id, date: dateStr, completed: true });
        dbEntries.push({ user_id: user.id, habit_id: habit.id, date: dateStr, completed: true });

        const streakAtDay = currentStreak + d;
        const isMilestone = [7, 30, 100].includes(streakAtDay);
        const pos   = surfacePoint(isMilestone ? 1.62 : 1.58);
        const scale = isMilestone ? 0.28 + Math.random() * 0.14 : 0.13 + Math.random() * 0.12;
        const color = randomColor(habit.type, isMilestone);
        const rotation = Math.random() * Math.PI * 2;
        const subType = ICON_TO_SUBTYPE[habit.icon];

        const obj: PlanetObject = {
          id: uid(),
          type: habit.type,
          subType,
          position: pos,
          scale,
          color,
          rotation,
          milestone: isMilestone,
        };
        newObjects.push(obj);
        dbObjects.push({
          user_id: user.id,
          type: habit.type,
          sub_type: subType,
          position_x: pos[0],
          position_y: pos[1],
          position_z: pos[2],
          scale,
          color,
          rotation,
          milestone: isMilestone,
        });
      }
    });

    if (dbEntries.length > 0) await supabase.from('habit_entries').insert(dbEntries);
    if (dbObjects.length > 0) await supabase.from('planet_objects').insert(dbObjects);

    // Update streaks
    await Promise.all(habits.map(h =>
      supabase.from('habits').update({ streak: h.streak + days }).eq('id', h.id).eq('user_id', user.id)
    ));

    setEntries(prev => [...prev, ...newEntries]);
    setPlanetObjects(prev => [...prev, ...newObjects]);
    setHabits(prev => prev.map(h => ({ ...h, streak: h.streak + days })));
  }, [user, habits, entries, todayFn]);

  return {
    habits, entries, planetObjects,
    newObjectId, sparklePos, loading,
    addHabit, deleteHabit, completeHabit, isCompletedToday,
    getTotalCompletions, getLongestStreak, getCurrentStreak, getTodayCount,
    simulateStreak, resetAll,
  };
}
