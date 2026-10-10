import { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetScene } from '@/components/PlanetScene';
import { HabitPanel } from '@/components/HabitPanel';
import { AddHabitModal } from '@/components/AddHabitModal';
import { calculateStreak, useRemoteHabits } from '@/hooks/useRemoteHabits';
import { useDevDate } from '@/hooks/useDevDate';
import { useIsMobile } from '@/hooks/use-mobile';
import { MilestoneCelebrationDialog } from '@/components/MilestoneCelebrationDialog';
import { StreakResetDialog } from '@/components/StreakResetDialog';
import { Flame, Sparkles, Trophy, FlaskConical, ChevronLeft, ChevronRight, RotateCcw, ChevronUp, ChevronDown, Trash2, Palette, X, Share2 } from 'lucide-react';
import { getCrossedMilestone, MILESTONES, type Milestone } from '@/types/habits';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function LoadingPlanet() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-3 text-4xl animate-spin">🌏</div>
        <p className="text-sm text-muted-foreground">Growing your planet...</p>
      </div>
    </div>
  );
}

const Index = () => {
  const { dayOffset, advanceDay, resetOffset, getToday, jumpDays } = useDevDate();
  const [showDevPanel, setShowDevPanel] = useState(false);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [habitsPanelOpen, setHabitsPanelOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const [planetStyle, setPlanetStyle] = useState<'earth' | 'classic'>(() => {
    return localStorage.getItem('habitplanet_style') === 'earth' ? 'earth' : 'classic';
  });

  const { user, isAnonymous, signIn, signUp, signOut, isAdmin } = useAuth();

  const effectiveToday = useCallback(
    () => getToday(),
    [getToday],
  );
  const {
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
  } = useRemoteHabits({ getToday: effectiveToday, isSimulatedDate: isAdmin && dayOffset > 0 });

  const [showModal, setShowModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState<{ milestone: Milestone; habitName: string; habitId: string } | null>(null);
  const [streakReset, setStreakReset] = useState<{ lostStreak: number; habitName: string } | null>(null);

  const handleCompleteHabit = async (habitId: string) => {
    const habit = habits.find(item => item.id === habitId);
    const completedStreak = calculateStreak(
      habitId,
      [...entries, { habitId, date: getToday(), completed: true }],
      getToday(),
    );
    const previousStreak = calculateStreak(habitId, entries, getToday());
    const milestone = habit ? getCrossedMilestone(previousStreak, completedStreak) : undefined;

    // Detect streak reset: the habit had a streak but a gap broke it
    const wasStreakReset = previousStreak > 0 && completedStreak === 1;

    await completeHabit(habitId);

    if (habit && wasStreakReset) {
      setStreakReset({ lostStreak: previousStreak, habitName: habit.name });
    } else if (habit && milestone) {
      setMilestoneCelebration({ milestone, habitName: habit.name, habitId });
    }
  };

  // Toggle dev panel with 'D' key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setShowDevPanel(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const totalCompletions = getTotalCompletions();
  const longestStreak = getLongestStreak();
  const currentStreak = getCurrentStreak();
  const todayCompleted = getTodayCount();

  // Next milestone
  const nextMilestone = MILESTONES.find(m => longestStreak < m.streak);
  const prevMilestone = [...MILESTONES].reverse().find(m => longestStreak >= m.streak);

  const clearAuthForm = () => {
    setEmail('');
    setPassword('');
    setAuthError(null);
  };

  const getReadableAuthError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    const normalized = message.toLowerCase();

    if (normalized.includes('email rate limit exceeded')) {
      return 'Too many email attempts. Please wait a minute and try again.';
    }

    if (normalized.includes('already exists')) {
      return 'This email already exists. Try signing in instead.';
    }

    return message;
  };

  const togglePlanetStyle = () => {
    setPlanetStyle(current => {
      const next = current === 'earth' ? 'classic' : 'earth';
      localStorage.setItem('habitplanet_style', next);
      return next;
    });
  };

  const handleSignIn = async () => {
    setAuthPending(true);
    setAuthError(null);
    try {
      const timeoutMs = 15_000;
      await Promise.race([
        signIn(email.trim(), password),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sign in timed out. Check your connection and try again.')), timeoutMs)
        ),
      ]);
      clearAuthForm();
      setAuthOpen(false);
    } catch (error) {
      setAuthError(getReadableAuthError(error, 'Unable to sign in.'));
    } finally {
      setAuthPending(false);
    }
  };

  const handleSignUp = async () => {
    setAuthPending(true);
    setAuthError(null);
    try {
      await signUp(email.trim(), password);
      clearAuthForm();
      setAuthOpen(false);
    } catch (error) {
      setAuthError(getReadableAuthError(error, 'Unable to sign up.'));
    } finally {
      setAuthPending(false);
    }
  };

  const handleSignOut = async () => {
    setAuthPending(true);
    setAuthError(null);
    try {
      clearLocalData();
      await signOut();
      setAuthOpen(false);
      clearAuthForm();
    } catch (error) {
      setAuthError(getReadableAuthError(error, 'Unable to sign out.'));
    } finally {
      setAuthPending(false);
    }
  };

  const handleDeleteAccount = () => {
    setConfirmDeleteOpen(true);
  };

  const handleDeleteAccountConfirmed = async () => {
    setConfirmDeleteOpen(false);
    setAuthPending(true);
    setAuthError(null);
    try {
      // Delete all data tables (cascade) + remove the auth user account
      await resetAll();
      clearLocalData();
      await supabase.rpc('delete_current_user');
      await signOut();
      setAuthOpen(false);
      clearAuthForm();
    } catch (error) {
      setAuthError(getReadableAuthError(error, 'Unable to delete account.'));
    } finally {
      setAuthPending(false);
    }
  };

  const handleShare = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      // Create a temporary canvas to composite the dark blue background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      // Fill with the app's dark blue background
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the planet scene over it
      ctx.drawImage(canvas, 0, 0);

      const dataUrl = tempCanvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'seed-planet.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Look at my planet!',
          text: "I'm growing my planet by completing daily habits. Join me on Seed Planet! https://seed-planet.page.dev",
          files: [file],
        });
      } else {
        // Fallback for desktop/unsupported browsers: trigger download
        const a = document.createElement('a');
        a.download = 'seed-planet.png';
        a.href = dataUrl;
        a.click();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-card/30 px-3 py-2 backdrop-blur-xl sm:px-5 sm:py-3">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* <img
            src="/image/planet_icon.png"
            alt="Seed Planet"
            className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9"
          /> */}
          <div className="flex flex-col">
            <div className="flex items-center gap-0.5">
              <h1 className="whitespace-nowrap text-base font-black leading-none tracking-tight text-gradient-primary font-display sm:text-lg">
                Seed Planet
              </h1>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/30 bg-card/40 text-[11px] font-bold text-muted-foreground/40 transition-colors hover:bg-card/80 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="How Seed Planet works"
                    aria-label="How Seed Planet works"
                  >
                    ?
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
                  <h2 className="mb-3 text-sm font-black text-foreground">How your planet grows</h2>

                  <section className="mb-3">
                    <h3 className="mb-1 text-xs font-bold text-primary">Small habits, a growing world</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Complete a habit once a day to add something to your planet: trees, flowers, mountains, or buildings that match the habit. Your completed growth stays on your world.
                    </p>
                  </section>

                  <section className="mb-3">
                    <h3 className="mb-1 text-xs font-bold text-primary">What is a streak?</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      A streak counts consecutive calendar days you complete the same habit. Yesterday&apos;s count stays visible while today is still open; complete it today to continue the run.
                    </p>
                  </section>

                  <section className="mb-3">
                    <h3 className="mb-1 text-xs font-bold text-primary">Streak milestones</h3>
                    <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                      <li><span className="font-semibold text-foreground">7 days:</span> bigger trees 🌿</li>
                      <li><span className="font-semibold text-foreground">30 days:</span> butterflies and animals 🦋</li>
                      <li><span className="font-semibold text-foreground">100 days:</span> glowing plants ✨</li>
                    </ul>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      These planet-wide decorations unlock from your longest single-habit streak.
                    </p>
                  </section>

                  <section className="mb-3">
                    <h3 className="mb-1 text-xs font-bold text-primary">Your progress</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Add habits for routines you want to build, then check each one off daily. Progress is saved on this device; sign in to sync it to your account.
                    </p>
                  </section>

                  <section className="mb-3">
                    <h3 className="mb-1 text-xs font-bold text-primary">Clear all</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Removes all your habits and planet objects, resetting your world to a blank slate. Your account stays intact and you remain signed in — only the data is erased.
                    </p>
                  </section>

                  <section className="mb-3">
                    <h3 className="mb-1 text-xs font-bold text-destructive">Delete this account</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Permanently deletes your account and all associated data — habits, entries, and planet objects. You will be signed out immediately and this action cannot be undone.
                    </p>
                  </section>

                  <section>
                    <h3 className="mb-1 text-xs font-bold text-primary">Support</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Contact us at <a href="mailto:helloapps.studio@outlook.com" className="text-primary hover:underline">helloapps.studio@outlook.com</a>
                    </p>
                  </section>
                </PopoverContent>
              </Popover>
            </div>
            <p className="hidden text-[11px] text-muted-foreground leading-none mt-0.5 sm:block">Start small. Grow your world.</p>
          </div>
        </div>

        {/* Stats + Clear button row */}
        <div className="min-w-0 max-w-[calc(100vw-5.5rem)] overflow-x-auto pb-1 sm:max-w-none sm:overflow-visible sm:pb-0">
          <div className="flex min-w-max items-center gap-1.5 sm:gap-2">
            <Dialog
              open={authOpen}
              onOpenChange={(open) => {
                setAuthOpen(open);
                if (!open) clearAuthForm();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    isAnonymous
                      ? 'h-8 px-2 text-xs sm:h-9 sm:px-3 glow-green bg-primary text-primary-foreground hover:bg-primary/90 border-0'
                      : 'h-8 px-2 text-xs sm:h-9 sm:px-3 border border-primary/30 bg-primary/10 text-primary font-bold hover:bg-primary/20'
                  }
                >
                  {isAnonymous ? 'Login' : 'Log Out'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{isAnonymous ? 'Login to Seed Planet' : 'Account'}</DialogTitle>
                  <DialogDescription>
                    {isAnonymous
                      ? 'Sign in to save your planet in the cloud.'
                      : 'You are signed in and syncing your progress.'}
                  </DialogDescription>
                </DialogHeader>

                {isAnonymous ? (
                  <div className="space-y-3">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      autoComplete="email"
                      disabled={authPending}
                    />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      autoComplete="current-password"
                      disabled={authPending}
                    />
                    {authError && (
                      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {authError}
                      </p>
                    )}
                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={handleSignUp}
                        disabled={authPending || !email.trim() || password.length < 6}
                      >
                        {authPending ? 'Working...' : 'Sign up'}
                      </Button>
                      <Button
                        onClick={handleSignIn}
                        disabled={authPending || !email.trim() || password.length < 6}
                      >
                        {authPending ? 'Working...' : 'Sign in'}
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      Signed in as <span className="font-semibold">{user?.email ?? 'unknown user'}</span>
                    </div>
                    {authError && (
                      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {authError}
                      </p>
                    )}
                    <DialogFooter className="sm:justify-between w-full mt-4">
                      <Button variant="link" onClick={handleDeleteAccount} disabled={authPending} className="text-destructive hover:text-destructive/80 px-0">
                        Delete this account
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={handleSignOut} 
                        disabled={authPending}
                        className="border border-primary/30 bg-primary/10 text-primary font-bold hover:bg-primary/20"
                      >
                        {authPending ? 'Signing out...' : 'Sign out'}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Today */}
            <div className="stat-chip">
              <Sparkles size={12} className="text-primary" />
              <div className="text-center">
                <div className="text-xs font-black text-gradient-primary leading-none sm:text-sm">{todayCompleted}/{habits.length}</div>
                <div className="stat-label">Today</div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="stat-chip">
              <Flame size={12} className="text-streak-gold" />
              <div className="text-center">
                <div className="text-xs font-black text-gradient-gold leading-none sm:text-sm">{currentStreak}</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>

            {/* Longest Streak — hidden on very small screens */}
            <div className="stat-chip border-yellow-500/30 bg-yellow-500/10 hidden xs:flex sm:flex">
              <Trophy size={12} className="text-yellow-400" />
              <div className="text-center">
                <div className="text-xs font-black text-yellow-300 leading-none sm:text-sm">{longestStreak}</div>
                <div className="stat-label">Best</div>
              </div>
            </div>

            {/* Total — hidden on mobile */}
            <div className="stat-chip hidden sm:flex">
              <span className="text-sm">🌟</span>
              <div className="text-center">
                <div className="text-sm font-black text-foreground leading-none">{totalCompletions}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>

            {/* Active milestone badge — hidden on mobile */}
            {prevMilestone && (
              <div className="stat-chip border-primary/30 bg-primary/10 hidden md:flex">
                <span className="text-sm">{prevMilestone.emoji}</span>
                <div className="text-center">
                  <div className="text-xs font-black text-primary leading-none">{prevMilestone.label}</div>
                  <div className="stat-label">{prevMilestone.description}</div>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/70 h-8 px-3 text-xs font-bold backdrop-blur-sm text-muted-foreground/80 hover:text-foreground hover:bg-card/90 transition-all hover:scale-105"
              title="Share Planet"
            >
              <Share2 size={13} />
              <span className="uppercase tracking-wider text-[10px]">Share</span>
            </Button>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel — desktop only */}
        {!isMobile && (
          <div className={`relative h-full shrink-0 transition-[width] duration-300 ease-in-out ${habitsPanelOpen ? 'w-72' : 'w-0'}`}>
            <div className="h-full w-full overflow-hidden">
              <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border/40 bg-card/20 p-4 backdrop-blur-xl">
                <HabitPanel
                  habits={habits}
                  isCompletedToday={isCompletedToday}
                  onComplete={handleCompleteHabit}
                  onDelete={deleteHabit}
                  onAddHabit={() => setShowModal(true)}
                  nextMilestone={nextMilestone}
                  longestStreak={longestStreak}
                  onClearAll={() => { resetAll(); }}
                />
              </aside>
            </div>
            <button
              onClick={() => setHabitsPanelOpen(open => !open)}
              className="absolute right-0 top-1/2 z-20 flex h-10 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-r-md border border-border/50 bg-card/90 text-muted-foreground shadow-md backdrop-blur transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={habitsPanelOpen ? 'Hide habits panel' : 'Show habits panel'}
              aria-expanded={habitsPanelOpen}
              title={habitsPanelOpen ? 'Hide habits panel' : 'Show habits panel'}
            >
              {habitsPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        )}

        {/* 3D Canvas */}
        <main className="relative min-w-0 flex-1">
          {loading && (
            <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm">
              <LoadingPlanet />
            </div>
          )}

          {/* Bottom hint */}
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 backdrop-blur-sm pointer-events-none">
            <p className="text-xs text-muted-foreground">
              {isMobile ? '👆 Drag to rotate · Pinch to zoom' : '🖱️ Drag to rotate · Scroll to zoom'}
            </p>
          </div>

          {/* Object counter */}
          {planetObjects.length > 0 && (
            <div className="absolute right-4 top-4 z-10 rounded-2xl border border-border/40 bg-card/70 px-3 py-2 backdrop-blur-sm text-center">
              <div className="text-lg font-black text-gradient-primary">{planetObjects.length}</div>
              <div className="text-[11px] text-muted-foreground">Objects</div>
            </div>
          )}

          {/* Next milestone progress */}
          {nextMilestone && longestStreak > 0 && (
            <div className="absolute left-4 top-4 z-10 rounded-2xl border border-border/40 bg-card/70 px-3 py-2.5 backdrop-blur-sm w-40 sm:w-44">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{nextMilestone.emoji}</span>
                <span className="text-[11px] font-bold text-foreground/80">{nextMilestone.label}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, (longestStreak / nextMilestone.streak) * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {longestStreak} / {nextMilestone.streak} days
              </div>
            </div>
          )}

          {/* Welcome overlay */}
          {habits.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
              <div className="rounded-3xl border border-border/40 bg-card/90 p-6 sm:p-8 text-center backdrop-blur-md max-w-sm w-full shadow-2xl animate-scale-in">
                <div className="mb-3 text-6xl">🌱</div>
                <h2 className="mb-1.5 text-2xl font-black text-foreground font-display">Your planet awaits</h2>
                <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                  Every habit you complete grows something new on your world — trees, flowers, mountains, buildings. The longer your streak, the more it transforms.
                </p>

                {/* Milestone preview */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                  {[
                    { image: '/image/7_days.png', days: '7 days', desc: 'Trees grow' },
                    { image: '/image/30_days.png', days: '30 days', desc: 'Animals appear' },
                    { image: '/image/100_days.png', days: '100 days', desc: 'World evolves' },
                  ].map(m => (
                    <div key={m.days} className="flex flex-col items-center gap-2">
                      <div className="w-full aspect-square rounded-2xl border border-border/30 bg-muted/30 overflow-hidden shadow-sm">
                        <img
                          src={m.image}
                          alt={`Seed Planet after ${m.days}`}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <span className="text-[10px] font-black text-primary leading-none">{m.days}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{m.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-lg glow-green"
                >
                  🌱 Plant Your First Habit
                </button>

                {(!user || isAnonymous) && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                    >
                      Sign in
                    </button>{' '}
                    to keep your data.
                  </p>
                )}
              </div>
            </div>
          )}

          <Canvas
            camera={{ position: [0, 1.5, isMobile ? 7.5 : 5.8], fov: 46 }}
            shadows
            style={{ background: 'transparent' }}
            gl={{
              antialias: true,
              alpha: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
              preserveDrawingBuffer: true,
            }}
          >
            <Suspense fallback={null}>
              <PlanetScene
                planetObjects={planetObjects}
                newObjectId={newObjectId}
                sparklePos={sparklePos}
                longestStreak={longestStreak}
                planetStyle={planetStyle}
              />
            </Suspense>
          </Canvas>
        </main>
      </div>

      {/* Mobile Bottom Drawer */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {drawerOpen && (
            <div
              className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
          )}

          {/* Drawer */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl border-t border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4rem)]'
              }`}
            style={{ maxHeight: '80vh' }}
          >
            {/* Drag handle + toggle */}
            <div className="flex items-end gap-2 px-3 pb-2 pt-3">
              <button
                onClick={() => setDrawerOpen(v => !v)}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5 active:bg-muted/20 transition-colors"
              >
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">My Habits</span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{habits.length}</span>
                  {drawerOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
                </div>
              </button>
              <button
                onClick={togglePlanetStyle}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/40 bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground backdrop-blur-sm transition-all hover:bg-card hover:text-foreground active:scale-95"
                title={`Switch to ${planetStyle === 'earth' ? 'classic' : 'Earth'} planet`}
                aria-label={`Switch to ${planetStyle === 'earth' ? 'classic' : 'Earth'} planet`}
              >
                <Palette size={13} />
                <span>{planetStyle === 'earth' ? 'Classic' : 'Earth'}</span>
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <HabitPanel
                habits={habits}
                isCompletedToday={isCompletedToday}
                onComplete={handleCompleteHabit}
                onDelete={deleteHabit}
                onAddHabit={() => { setShowModal(true); setDrawerOpen(false); }}
                nextMilestone={nextMilestone}
                longestStreak={longestStreak}
                onClearAll={() => { resetAll(); setDrawerOpen(false); }}
              />
            </div>
          </div>
        </>
      )}

      {/* Add Habit Modal */}
      {showModal && (
        <AddHabitModal
          onClose={() => setShowModal(false)}
          onAdd={addHabit}
          disabled={loading}
        />
      )}

      {/* Planet style control */}
      <button
        onClick={togglePlanetStyle}
        className="fixed bottom-5 right-16 z-50 hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground backdrop-blur-sm transition-all hover:bg-card hover:text-foreground hover:scale-105 sm:flex"
        title={`Switch to ${planetStyle === 'earth' ? 'classic' : 'Earth'} planet`}
        aria-label={`Switch to ${planetStyle === 'earth' ? 'classic' : 'Earth'} planet`}
      >
        <Palette size={13} />
        <span>{planetStyle === 'earth' ? 'Classic' : 'Earth'}</span>
      </button>

      {/* Dev Panel — admin users only */}
      {isAdmin && (
        <>
          <div
            className={`fixed bottom-20 right-5 z-50 transition-all duration-300 sm:bottom-5 ${showDevPanel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
          >
            <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-4 w-56">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} className="text-primary" />
                  <span className="text-xs font-black text-foreground/80 uppercase tracking-wider">Dev Mode</span>
                </div>
                <button
                  onClick={() => setShowDevPanel(false)}
                  className="rounded-lg p-1 text-muted-foreground/50 transition-colors hover:bg-muted/40 hover:text-foreground"
                  aria-label="Close dev panel"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2 mb-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-0.5">Simulated date</div>
                <div className="text-sm font-black text-foreground">{getToday()}</div>
                {dayOffset > 0 && (
                  <div className="text-[10px] text-primary mt-0.5">+{dayOffset} day{dayOffset !== 1 ? 's' : ''} ahead</div>
                )}
              </div>
              <button
                onClick={advanceDay}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 hover:bg-primary/35 text-primary text-xs font-bold py-2 transition-all active:scale-95 mb-3"
              >
                <ChevronRight size={13} /> Advance 1 Day
              </button>

              <div className="mb-1">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Simulate streak</p>
                <div className="flex flex-col gap-1.5">
                  {([
                    { days: 7, label: '🌿 7 days', hint: 'Bigger trees' },
                    { days: 30, label: '🦋 30 days', hint: 'Animals appear' },
                    { days: 100, label: '✨ 100 days', hint: 'Glow plants' },
                  ] as const).map(({ days, label, hint }) => (
                    <button
                      key={days}
                      onClick={async () => {
                        try {
                          await simulateStreak(days);
                          jumpDays(days);
                        } catch (error) {
                          const databaseError = error as { message?: string; code?: string };
                          toast.error('Simulation could not sync', {
                            description: [databaseError.message, databaseError.code].filter(Boolean).join(' | '),
                          });
                        }
                      }}
                      disabled={habits.length === 0}
                      className="flex w-full items-center justify-between rounded-xl bg-accent/20 hover:bg-accent/35 text-accent-foreground text-xs font-bold px-3 py-1.5 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span>{label}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={resetOffset}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground text-xs font-bold py-2 transition-all active:scale-95 mt-1"
              >
                <RotateCcw size={12} /> Reset to Today
              </button>

              <div className="mt-2 border-t border-destructive/20 pt-2">
                {confirmReset ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { resetAll(); resetOffset(); setConfirmReset(false); }}
                      className="flex-1 rounded-xl bg-destructive text-destructive-foreground text-xs font-black py-2 transition-all active:scale-95 hover:bg-destructive/90"
                    >
                      ☠️ Confirm
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground text-xs font-bold py-2 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold py-2 transition-all active:scale-95"
                  >
                    🗑️ Reset All Data
                  </button>
                )}
              </div>
            </div>
          </div>

          {!showDevPanel && (
            <button
              onClick={() => setShowDevPanel(true)}
              className="fixed bottom-20 right-5 z-50 rounded-full border border-border/40 bg-card/70 p-2.5 backdrop-blur-sm text-muted-foreground/40 hover:text-muted-foreground transition-all hover:scale-110 sm:bottom-5"
              title="Dev panel (D)"
            >
              <FlaskConical size={14} />
            </button>
          )}
        </>
      )}

      {milestoneCelebration && (
        <MilestoneCelebrationDialog
          milestone={milestoneCelebration.milestone}
          habitName={milestoneCelebration.habitName}
          habitId={milestoneCelebration.habitId}
          onClose={() => setMilestoneCelebration(null)}
          onDeleteHabit={async (id) => {
            await deleteHabit(id);
            setMilestoneCelebration(null);
          }}
        />
      )}

      {streakReset && (
        <StreakResetDialog
          lostStreak={streakReset.lostStreak}
          habitName={streakReset.habitName}
          onClose={() => setStreakReset(null)}
        />
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="sm:max-w-sm border-destructive/30 bg-background">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                <Trash2 size={18} className="text-destructive" />
              </div>
              <AlertDialogTitle className="text-base font-bold">Delete account data?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground pl-[52px]">
              Your account, all habits, entries and planet objects will be permanently deleted. You will be signed out and cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <Button
              variant="ghost"
              className="border border-border/50"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccountConfirmed}
              disabled={authPending}
            >
              {authPending ? 'Deleting...' : 'Delete everything'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
