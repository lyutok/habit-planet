import { useState, useEffect, useCallback, useRef } from 'react';
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
  return crypto.randomUUID();
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

function previousDate(date: string): string {
  try {
    const value = new Date(`${date}T00:00:00Z`);
    if (isNaN(value.getTime())) return '';
    value.setUTCDate(value.getUTCDate() - 1);
    return value.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().split('T')[0];
}

export function calculateStreak(habitId: string, entries: HabitEntry[], today: string): number {
  if (!today) return 0;

  const completedDates = new Set(
    entries
      .filter(entry => entry.habitId === habitId && entry.completed && entry.date)
      .map(entry => String(entry.date).split('T')[0])
      .filter(d => d !== 'undefined' && d !== 'null' && d !== ''),
  );

  const todayStr = String(today).split('T')[0];

  const latestCompletedDate = [...completedDates]
    .filter(date => date <= todayStr)
    .sort()
    .at(-1);
  if (!latestCompletedDate) return 0;

  if (latestCompletedDate !== todayStr && latestCompletedDate !== previousDate(todayStr)) {
    return 0; // Streak is broken
  }

  let streak = 0;
  let date = latestCompletedDate;
  while (completedDates.has(date)) {
    streak += 1;
    date = previousDate(date);
  }
  return streak;
}

interface UseRemoteHabitsOptions {
  getToday?: () => string;
  isSimulatedDate?: boolean;
}

export function useRemoteHabits({ getToday, isSimulatedDate = false }: UseRemoteHabitsOptions = {}) {
  const { user, isAnonymous, loading: authLoading, getCurrentUserId } = useAuth();
  const todayFn = useCallback(() => getToday ? getToday() : new Date().toISOString().split('T')[0], [getToday]);
  const currentDate = todayFn();

  // Keep a ref so loadFromDB can always read the latest date without
  // being listed as a useEffect dependency (which caused an infinite
  // re-render / polling loop on desktop browsers).
  const currentDateRef = useRef(currentDate);
  currentDateRef.current = currentDate;

  const [habits, setHabits] = useState<Habit[]>(() => load(HABITS_KEY, []));
  const [entries, setEntries] = useState<HabitEntry[]>(() => load(ENTRIES_KEY, []));
  const [planetObjects, setPlanetObjects] = useState<PlanetObject[]>(() => load(PLANET_KEY, []));
  const [newObjectId, setNewObjectId] = useState<string | null>(null);
  const [sparklePos, setSparklePos] = useState<[number, number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const syncingSimulation = useRef(false);
  const dataRevision = useRef(0);
  // Ref to latest habits so the streak-recalc effect can read them without
  // listing `habits` as a dependency (which caused an infinite update loop).
  const habitsRef = useRef<Habit[]>([]);
  // Keep habitsRef in sync on every render (same pattern as currentDateRef).
  habitsRef.current = habits;

  // Load data from Supabase on auth change
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    let active = true;

    const loadFromDB = async () => {
      const revisionAtStart = dataRevision.current;
      if (isAnonymous) {
        if (!active) return;

        // Anonymous mode starts from the local store; logout clears it first.
        setHabits(load(HABITS_KEY, []));
        setEntries(load(ENTRIES_KEY, []));
        setPlanetObjects(load(PLANET_KEY, []));
        setLoading(false);
        return;
      }

      // Load from DB for authenticated users
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? user?.id;
      if (!active || !userId) return; // Safety check

      try {
        const [habitsRes, entriesRes, objectsRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
          supabase.from('habit_entries').select('*').eq('user_id', userId),
          supabase.from('planet_objects').select('*').eq('user_id', userId),
        ]);

        if (habitsRes.error) throw habitsRes.error;
        if (entriesRes.error) throw entriesRes.error;
        if (objectsRes.error) throw objectsRes.error;

        const dbEntries = entriesRes.data.map(e => ({
          habitId: e.habit_id,
          date: String(e.date).split('T')[0],
          completed: e.completed,
        }));

        // Read date via ref so this closure doesn't need currentDate as a dep
        const todayForCalc = currentDateRef.current;
        const dbHabits = habitsRes.data.map(h => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          type: h.type as HabitType,
          streak: calculateStreak(h.id, dbEntries, todayForCalc),
          createdAt: h.created_at,
        }));

        const dbObjects = objectsRes.data.map(o => ({
          id: o.id,
          habitId: o.habit_id ?? undefined,
          type: o.type as HabitType,
          subType: parseObjectSubType(o.sub_type),
          position: [o.position_x, o.position_y, o.position_z] as [number, number, number],
          scale: o.scale,
          color: o.color,
          rotation: o.rotation,
          milestone: o.milestone,
        }));

        if (active && !syncingSimulation.current && revisionAtStart === dataRevision.current) {
          setHabits(dbHabits);
          setEntries(dbEntries);
          setPlanetObjects(dbObjects);
        }
      } catch (error) {
        console.error('[RemoteHabits] Error loading from DB:', error);
        if (active) {
          setHabits([]);
          setEntries([]);
          setPlanetObjects([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFromDB();

    if (isAnonymous) return;

    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') void loadFromDB();
    };
    const refreshInterval = window.setInterval(() => void loadFromDB(), 5000);

    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);

    // Setup Supabase Realtime channel for instant cross-device sync
    const currentUserId = user?.id;
    const channel = currentUserId
      ? supabase
          .channel(`user-sync-${currentUserId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${currentUserId}` },
            () => { void loadFromDB(); },
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'habit_entries', filter: `user_id=eq.${currentUserId}` },
            () => { void loadFromDB(); },
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'planet_objects', filter: `user_id=eq.${currentUserId}` },
            () => { void loadFromDB(); },
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
      if (channel) void supabase.removeChannel(channel);
    };
    // NOTE: currentDate and getCurrentUserId intentionally excluded from deps.
    // currentDate is read via currentDateRef; getCurrentUserId changes reference
    // on every auth update which would restart the polling interval needlessly.
  }, [user?.id, isAnonymous, authLoading]);

  // Save to localStorage for anonymous users
  useEffect(() => { if (isAnonymous) localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); }, [habits, isAnonymous]);
  useEffect(() => { if (isAnonymous) localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)); }, [entries, isAnonymous]);
  useEffect(() => { if (isAnonymous) localStorage.setItem(PLANET_KEY, JSON.stringify(planetObjects)); }, [planetObjects, isAnonymous]);

  useEffect(() => {
    // Read latest habits via ref to avoid having `habits` as a dep
    // (which would cause this effect to re-trigger every time it calls setHabits).
    const currentHabits = habitsRef.current;
    if (currentHabits.length === 0) return;
    const nextHabits = currentHabits.map(habit => ({
      ...habit,
      streak: calculateStreak(habit.id, entries, currentDate),
    }));
    const changed = nextHabits.some((habit, index) => habit.streak !== currentHabits[index].streak);
    if (changed) {
      habitsRef.current = nextHabits;
      setHabits(nextHabits);
    }
  }, [entries, currentDate]);

  const isCompletedToday = useCallback((habitId: string) => {
    return entries.some(e => e.habitId === habitId && String(e.date).split('T')[0] === currentDate && e.completed);
  }, [entries, currentDate]);

  const addHabit = useCallback(async (name: string, type: HabitType, icon: string) => {
    console.log('[addHabit] Starting addHabit function');
    const currentUserId = getCurrentUserId();
    console.log('[addHabit] Current auth state:', { currentUserId, isAnonymous, user: user?.id });

    const { data: { session } } = await supabase.auth.getSession();
    const hasValidSession = !!session && !!session.user && !!session.user.id;
    console.log('[addHabit] Session check:', { hasValidSession, sessionExists: !!session, userExists: !!session?.user, userIdExists: !!session?.user?.id });
    console.log('[addHabit] Session user ID:', session?.user?.id);
    console.log('[addHabit] Auth state user ID:', user?.id);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    console.log('[addHabit] getUser() result:', currentUser ? { id: currentUser.id, email: currentUser.email } : null);

    const newHabit = {
      id: uid(),
      name,
      icon,
      type,
      streak: 0,
      createdAt: new Date().toISOString(),
    };

    if (hasValidSession) {
      console.log('[addHabit] User has valid session, saving to DB');
      const sessionUserId = session?.user?.id;
      const authUserId = getCurrentUserId();
      const userIdToUse = currentUser?.id || sessionUserId || authUserId;
      console.log('[addHabit] Using user ID:', userIdToUse);

      if (!userIdToUse) {
        console.log('[addHabit] No user ID available, skipping');
        return;
      }

      try {
        console.log('[addHabit] About to insert with user_id:', userIdToUse, 'type:', typeof userIdToUse);
        const { error, data } = await supabase.from('habits').insert({
          id: newHabit.id,
          user_id: userIdToUse,
          name,
          icon,
          type,
          created_at: newHabit.createdAt,
          updated_at: newHabit.createdAt,
        });

        if (error) {
          console.error('[addHabit] DB insertion error:', error);
          throw error;
        }

        console.log('[addHabit] DB insertion successful:', data);
        setHabits(prev => [...prev, newHabit]);
        console.log('[addHabit] Local state updated');
      } catch (err) {
        console.error('[addHabit] Exception during DB insertion:', err);
        setHabits(prev => [...prev, newHabit]);
      }
    } else {
      console.log('[addHabit] No valid session, saving locally');
      setHabits(prev => [...prev, newHabit]);
    }
  }, [getCurrentUserId, isAnonymous, user]);

  const deleteHabit = useCallback(async (habitId: string) => {
    if (!isAnonymous) {
      const { error: objectsError } = await supabase
        .from('planet_objects')
        .delete()
        .eq('habit_id', habitId);
      if (objectsError) throw objectsError;

      const { error } = await supabase.from('habits').delete().eq('id', habitId);
      if (error) throw error;
    }
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setEntries(prev => prev.filter(e => e.habitId !== habitId));
    setPlanetObjects(prev => prev.filter(object => object.habitId !== habitId));
  }, [isAnonymous]);

  const completeHabit = useCallback(async (habitId: string) => {
    if (isCompletedToday(habitId)) return;

    const t = todayFn();
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = isAnonymous ? getCurrentUserId() : session?.user?.id ?? user?.id;
    if (!currentUserId) return;

    const newEntry = { habitId, date: t, completed: true };

    if (isAnonymous) {
      setEntries(prev => [...prev.filter(e => !(e.habitId === habitId && e.date === t)), newEntry]);
    } else {
      const { error } = await supabase.from('habit_entries').upsert({
        habit_id: habitId,
        user_id: currentUserId,
        date: t,
        completed: true,
      }, { onConflict: 'habit_id,date' });
      if (error) throw error;
      setEntries(prev => [...prev.filter(e => !(e.habitId === habitId && e.date === t)), newEntry]);
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    let completionHistory = [...entries.filter(e => !(e.habitId === habitId && e.date === t)), newEntry];
    if (!isAnonymous) {
      const { data: persistedEntries, error: entriesError } = await supabase
        .from('habit_entries')
        .select('date, completed')
        .eq('habit_id', habitId)
        .eq('user_id', currentUserId)
        .eq('completed', true)
        .lte('date', t);
      if (entriesError) throw entriesError;
      completionHistory = persistedEntries.map(entry => ({
        habitId,
        date: String(entry.date).split('T')[0],
        completed: entry.completed,
      }));
    }

    const newStreak = calculateStreak(habitId, completionHistory, t);
    if (!isAnonymous) {
      const { data: laterEntries, error: laterEntriesError } = await supabase
        .from('habit_entries')
        .select('date')
        .eq('habit_id', habitId)
        .eq('user_id', currentUserId)
        .eq('completed', true)
        .gt('date', t)
        .limit(1);

      if (isSimulatedDate || (!laterEntriesError && laterEntries.length === 0)) {
        const { error } = await supabase
          .from('habits')
          .update({
            streak: newStreak,
            updated_at: new Date().toISOString(),
          })
          .eq('id', habitId)
          .eq('user_id', currentUserId);
        if (error && error.code !== 'PGRST204') throw error;
      }
    }

    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      return { ...h, streak: newStreak };
    }));

    const currentStreak = newStreak;
    const isMilestone = [7, 30, 100].includes(currentStreak);

    const pos = surfacePoint(isMilestone ? 1.62 : 1.58);
    const objId = uid();
    const scale = isMilestone ? 0.28 + Math.random() * 0.14 : 0.13 + Math.random() * 0.12;

    const newObj: PlanetObject = {
      id: objId,
      habitId,
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
        user_id: currentUserId,
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
  }, [habits, entries, isCompletedToday, todayFn, isAnonymous, isSimulatedDate, getCurrentUserId, user?.id]);

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

  const clearLocalData = useCallback(() => {
    setHabits([]);
    setEntries([]);
    setPlanetObjects([]);
    setNewObjectId(null);
    setSparklePos(null);
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(PLANET_KEY);
    localStorage.removeItem(LAST_VIEWED_HABITS_KEY);
    localStorage.removeItem(LAST_VIEWED_ENTRIES_KEY);
    localStorage.removeItem(LAST_VIEWED_PLANET_KEY);
  }, []);

  const simulateStreak = useCallback(async (days: number, localOnly = false) => {
    if (habits.length === 0) return;

    const startDate = todayFn();
    const finalDate = addDays(startDate, days);
    const newEntries: HabitEntry[] = [];
    const newObjects: PlanetObject[] = [];

    habits.forEach(habit => {
      const currentStreak = habit.streak;
      for (let d = 1; d <= days; d++) {
        const dateStr = addDays(startDate, d);

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
          habitId: habit.id,
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

    dataRevision.current += 1;
    syncingSimulation.current = true;
    try {
      if (!isAnonymous && !localOnly) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id ?? user?.id;
        if (!userId) throw new Error('Unable to identify the signed-in user for simulation.');

        if (newEntries.length > 0) {
          const { error } = await supabase.from('habit_entries').upsert(
            newEntries.map(entry => ({
              habit_id: entry.habitId,
              user_id: userId,
              date: entry.date,
              completed: entry.completed,
            })),
            { onConflict: 'habit_id,date' },
          );
          if (error) throw error;
        }

        if (newObjects.length > 0) {
          const { error } = await supabase.from('planet_objects').insert(
            newObjects.map(object => ({
              id: object.id,
              user_id: userId,
              habit_id: object.habitId,
              type: object.type,
              sub_type: object.subType,
              position_x: object.position[0],
              position_y: object.position[1],
              position_z: object.position[2],
              scale: object.scale,
              color: object.color,
              rotation: object.rotation,
              milestone: object.milestone,
            })),
          );
          if (error) throw error;
        }

        const { error: habitsError } = await supabase.from('habits').upsert(
          habits.map(habit => ({
            id: habit.id,
            user_id: userId,
            name: habit.name,
            icon: habit.icon,
            type: habit.type,
            streak: calculateStreak(habit.id, [...entries, ...newEntries], finalDate),
            created_at: habit.createdAt,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'id' },
        );
        if (habitsError) throw habitsError;
      }

      setEntries(prev => [...prev, ...newEntries]);
      setPlanetObjects(prev => [...prev, ...newObjects]);
      setHabits(prev => prev.map(h => ({
        ...h,
        streak: calculateStreak(h.id, [...entries, ...newEntries], finalDate),
      })));
    } finally {
      syncingSimulation.current = false;
    }
  }, [habits, entries, todayFn, isAnonymous, user?.id]);

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
    clearLocalData,
  };
}