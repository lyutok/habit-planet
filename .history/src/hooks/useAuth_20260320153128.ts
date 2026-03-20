import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAnonymous: true, // Start as anonymous
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAnonymous: !session,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAnonymous: !session,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    // If sign-up successful and user is now authenticated, migrate data
    if (data.user) {
      await migrateAnonymousData(data.user.id);
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // For anonymous users, generate a temporary ID (stored in localStorage)
  const getAnonymousUserId = () => {
    let id = localStorage.getItem('anonymous_user_id');
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous_user_id', id);
    }
    return id;
  };

  const getCurrentUserId = () => {
    return authState.user?.id ?? getAnonymousUserId();
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    getCurrentUserId, // Returns authenticated user ID or anonymous ID
  };
}

// Add this function to useAuth.ts
const migrateAnonymousData = async (newUserId: string) => {
  try {
    // Load anonymous data from localStorage
    const habits = loadHabits();
    const entries = loadEntries();
    const objects = loadObjects();

    if (habits.length > 0) {
      // Insert habits with new user_id
      const habitsToInsert = habits.map(h => ({
        id: h.id,
        user_id: newUserId,
        name: h.name,
        icon: h.icon,
        type: h.type,
        created_at: h.createdAt,
        updated_at: new Date().toISOString(),
      }));
      const { error: habitsError } = await supabase.from('habits').insert(habitsToInsert);
      if (habitsError) throw habitsError;
    }

    if (entries.length > 0) {
      // Insert entries with new user_id
      const entriesToInsert = entries.map(e => ({
        habit_id: e.habitId,
        user_id: newUserId,
        date: e.date,
        completed: e.completed,
      }));
      const { error: entriesError } = await supabase.from('habit_entries').insert(entriesToInsert);
      if (entriesError) throw entriesError;
    }

    if (objects.length > 0) {
      // Insert objects with new user_id
      const objectsToInsert = objects.map(o => ({
        id: o.id,
        user_id: newUserId,
        habit_id: o.habitId || null, // May be null if not linked
        type: o.type,
        sub_type: o.subType,
        position_x: o.position[0],
        position_y: o.position[1],
        position_z: o.position[2],
        scale: o.scale,
        color: o.color,
        rotation: o.rotation,
        milestone: o.milestone,
      }));
      const { error: objectsError } = await supabase.from('planet_objects').insert(objectsToInsert);
      if (objectsError) throw objectsError;
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(PLANET_KEY);
    localStorage.removeItem('anonymous_user_id'); // Clear anonymous ID too

  } catch (error) {
    console.error('Migration failed:', error);
    // Don't throw; let sign-up succeed even if migration fails
  }
};

// Helper functions (add these)
const HABITS_KEY = 'habitplanet_habits_v2';
const ENTRIES_KEY = 'habitplanet_entries_v2';
const PLANET_KEY = 'habitplanet_objects_v2';

function loadHabits() {
  try {
    const s = localStorage.getItem(HABITS_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function loadEntries() {
  try {
    const s = localStorage.getItem(ENTRIES_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function loadObjects() {
  try {
    const s = localStorage.getItem(PLANET_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}