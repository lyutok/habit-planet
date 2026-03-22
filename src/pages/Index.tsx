import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetScene } from '@/components/PlanetScene';
import { HabitPanel } from '@/components/HabitPanel';
import { AddHabitModal } from '@/components/AddHabitModal';
import { useHabits } from '@/hooks/useHabits';
import { useDevDate } from '@/hooks/useDevDate';
import { useIsMobile } from '@/hooks/use-mobile';
import { Flame, Globe, Sparkles, Trophy, FlaskConical, ChevronRight, RotateCcw, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { MILESTONES } from '@/types/habits';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function LoadingPlanet() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-3 text-4xl animate-spin">🪐</div>
        <p className="text-sm text-muted-foreground">Growing your planet...</p>
      </div>
    </div>
  );
}

const Index = () => {
  const { dayOffset, advanceDay, resetOffset, getToday, jumpDays } = useDevDate();
  const [showDevPanel, setShowDevPanel] = useState(false);
  const isMobile = useIsMobile();
  const isDev = import.meta.env.DEV;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);

  const { user, isAnonymous, signIn, signUp, signOut, isAdmin } = useAuth();

  const {
    habits,
    planetObjects,
    newObjectId,
    sparklePos,
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
  } = useHabits({ getToday });

  const [showModal, setShowModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Toggle dev panel with 'D' key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setShowDevPanel(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const totalCompletions = getTotalCompletions();
  const longestStreak    = getLongestStreak();
  const currentStreak    = getCurrentStreak();
  const todayCompleted   = getTodayCount();

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

    return message;
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
      await signOut();
      clearAuthForm();
    } catch (error) {
      setAuthError(getReadableAuthError(error, 'Unable to sign out.'));
    } finally {
      setAuthPending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/40 bg-card/30 px-3 py-2 backdrop-blur-xl sm:px-5 sm:py-3">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30 sm:h-9 sm:w-9">
            <Globe size={16} className="text-primary sm:size-[18px]" />
          </div>
          <div>
            <h1 className="text-base font-black leading-none tracking-tight text-gradient-primary font-display sm:text-lg">
              Habit Planet
            </h1>
            <p className="hidden text-[11px] text-muted-foreground leading-none mt-0.5 sm:block">Grow your world, one habit at a time</p>
          </div>
        </div>

        {/* Stats + Clear button row */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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
                <DialogTitle>{isAnonymous ? 'Login to Habit Planet' : 'Account'}</DialogTitle>
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
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleSignOut} disabled={authPending}>
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

          {/* Clear All button — desktop only; mobile gets it in drawer */}
          {habits.length > 0 && (
            confirmClear ? (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => { resetAll(); setConfirmClear(false); }}
                  className="rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-black text-destructive-foreground transition-all active:scale-95 hover:bg-destructive/90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-all active:scale-95 hover:bg-muted/40"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11px] font-bold text-destructive transition-all hover:bg-destructive/20 active:scale-95"
                title="Clear all data"
              >
                <Trash2 size={11} />
                <span>Clear All</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel — desktop only */}
        {!isMobile && (
          <aside className="flex w-72 shrink-0 flex-col border-r border-border/40 bg-card/20 p-4 backdrop-blur-xl">
            <HabitPanel
              habits={habits}
              isCompletedToday={isCompletedToday}
              onComplete={completeHabit}
              onDelete={deleteHabit}
              onAddHabit={() => setShowModal(true)}
              nextMilestone={nextMilestone}
              longestStreak={longestStreak}
              onClearAll={() => { resetAll(); }}
            />
          </aside>
        )}

        {/* 3D Canvas */}
        <main className="relative flex-1">
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
                <div className="mb-3 text-6xl">🪐</div>
                <h2 className="mb-1.5 text-2xl font-black text-foreground font-display">Your planet awaits</h2>
                <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                  Every habit you complete grows something new on your world — trees, flowers, mountains, buildings. The longer your streak, the more it transforms.
                </p>

                {/* Milestone preview */}
                <div className="mb-5 grid grid-cols-3 gap-2 text-left">
                  {[
                    { emoji: '🌿', days: '7 days', title: 'Week Warrior', desc: 'Bigger trees' },
                    { emoji: '🦋', days: '30 days', title: 'Month Master', desc: 'Animals appear' },
                    { emoji: '✨', days: '100 days', title: 'Legend', desc: 'Glowing plants' },
                  ].map(m => (
                    <div key={m.days} className="rounded-2xl border border-border/30 bg-muted/30 px-2 py-2.5 flex flex-col items-center gap-1">
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[10px] font-black text-primary leading-none">{m.days}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight text-center">{m.desc}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-lg glow-green"
                >
                  🌱 Plant Your First Habit
                </button>
              </div>
            </div>
          )}

          <Canvas
            camera={{ position: [0, 1.5, 5.8], fov: 46 }}
            shadows
            style={{ background: 'transparent' }}
            gl={{
              antialias: true,
              alpha: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
          >
            <Suspense fallback={null}>
              <PlanetScene
                planetObjects={planetObjects}
                newObjectId={newObjectId}
                sparklePos={sparklePos}
                longestStreak={longestStreak}
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
            className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl border-t border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out ${
              drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4rem)]'
            }`}
            style={{ maxHeight: '80vh' }}
          >
            {/* Drag handle + toggle */}
            <button
              onClick={() => setDrawerOpen(v => !v)}
              className="flex w-full flex-col items-center gap-1.5 pb-2 pt-3 active:bg-muted/20 transition-colors"
            >
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">My Habits</span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{habits.length}</span>
                {drawerOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
              </div>
            </button>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <HabitPanel
                habits={habits}
                isCompletedToday={isCompletedToday}
                onComplete={completeHabit}
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
        />
      )}

      {/* Dev Panel — in development builds or for admin users */}
      {(isDev || isAdmin) && (
        <>
          <div
            className={`fixed bottom-20 right-5 z-50 transition-all duration-300 sm:bottom-5 ${
              showDevPanel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-4 w-56">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={14} className="text-primary" />
                <span className="text-xs font-black text-foreground/80 uppercase tracking-wider">Dev Mode</span>
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
                    { days: 7,   label: '🌿 7 days',   hint: 'Bigger trees' },
                    { days: 30,  label: '🦋 30 days',  hint: 'Animals appear' },
                    { days: 100, label: '✨ 100 days', hint: 'Glow plants' },
                  ] as const).map(({ days, label, hint }) => (
                    <button
                      key={days}
                      onClick={() => { simulateStreak(days); jumpDays(days); }}
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
    </div>
  );
};

export default Index;
