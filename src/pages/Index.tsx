import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetScene } from '@/components/PlanetScene';
import { HabitPanel } from '@/components/HabitPanel';
import { AddHabitModal } from '@/components/AddHabitModal';
import { useHabits } from '@/hooks/useHabits';
import { useDevDate } from '@/hooks/useDevDate';
import { Flame, Globe, Sparkles, Trophy, FlaskConical, ChevronRight, RotateCcw } from 'lucide-react';
import { MILESTONES } from '@/types/habits';

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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/40 bg-card/30 px-5 py-3 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
            <Globe size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none tracking-tight text-gradient-primary font-display">
              Habit Planet
            </h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Grow your world, one habit at a time</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2">
          {/* Today */}
          <div className="stat-chip">
            <Sparkles size={13} className="text-primary" />
            <div className="text-center">
              <div className="text-sm font-black text-gradient-primary leading-none">{todayCompleted}/{habits.length}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="stat-chip">
            <Flame size={13} className="text-streak-gold" />
            <div className="text-center">
              <div className="text-sm font-black text-gradient-gold leading-none">{currentStreak}</div>
              <div className="stat-label">Current</div>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="stat-chip border-yellow-500/30 bg-yellow-500/10">
            <Trophy size={13} className="text-yellow-400" />
            <div className="text-center">
              <div className="text-sm font-black text-yellow-300 leading-none">{longestStreak}</div>
              <div className="stat-label">Best streak</div>
            </div>
          </div>

          {/* Total */}
          <div className="stat-chip">
            <span className="text-sm">🌟</span>
            <div className="text-center">
              <div className="text-sm font-black text-foreground leading-none">{totalCompletions}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>

          {/* Active milestone badge */}
          {prevMilestone && (
            <div className="stat-chip border-primary/30 bg-primary/10">
              <span className="text-sm">{prevMilestone.emoji}</span>
              <div className="text-center">
                <div className="text-xs font-black text-primary leading-none">{prevMilestone.label}</div>
                <div className="stat-label">{prevMilestone.description}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/40 bg-card/20 p-4 backdrop-blur-xl">
          <HabitPanel
            habits={habits}
            isCompletedToday={isCompletedToday}
            onComplete={completeHabit}
            onDelete={deleteHabit}
            onAddHabit={() => setShowModal(true)}
            nextMilestone={nextMilestone}
            longestStreak={longestStreak}
          />
        </aside>

        {/* 3D Canvas */}
        <main className="relative flex-1">
          {/* Bottom hint */}
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 backdrop-blur-sm pointer-events-none">
            <p className="text-xs text-muted-foreground">
              🖱️ Drag to rotate · Scroll to zoom
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
            <div className="absolute left-4 top-4 z-10 rounded-2xl border border-border/40 bg-card/70 px-3 py-2.5 backdrop-blur-sm w-44">
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
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-3xl border border-border/40 bg-card/85 p-8 text-center backdrop-blur-md max-w-xs shadow-2xl animate-scale-in">
                <div className="mb-4 text-6xl">🪐</div>
                <h2 className="mb-2 text-xl font-black text-foreground font-display">Your planet awaits!</h2>
                <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                  Add habits to grow trees, flowers, mountains &amp; buildings on your very own world.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-lg glow-green"
                >
                  🌱 Plant First Habit
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

      {/* Add Habit Modal */}
      {showModal && (
        <AddHabitModal
          onClose={() => setShowModal(false)}
          onAdd={addHabit}
        />
      )}

      {/* Dev Panel — toggle with 'D' key */}
      <div
        className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${
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

          {/* Streak simulation shortcuts */}
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
          <p className="mt-3 text-[10px] text-muted-foreground/50 text-center">Press D to hide</p>
        </div>
      </div>

      {/* Dev panel hint (bottom-right when hidden) */}
      {!showDevPanel && (
        <button
          onClick={() => setShowDevPanel(true)}
          className="fixed bottom-5 right-5 z-50 rounded-full border border-border/40 bg-card/70 p-2.5 backdrop-blur-sm text-muted-foreground/40 hover:text-muted-foreground transition-all hover:scale-110"
          title="Dev panel (D)"
        >
          <FlaskConical size={14} />
        </button>
      )}
    </div>
  );
};

export default Index;
