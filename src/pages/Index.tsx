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
    getTodayCount,
  } = useHabits();

  const [showModal, setShowModal] = useState(false);

  const totalCompletions = getTotalCompletions();
  const longestStreak    = getLongestStreak();
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

          {/* Best Streak */}
          <div className="stat-chip">
            <Flame size={13} className="text-streak-gold" />
            <div className="text-center">
              <div className="text-sm font-black text-gradient-gold leading-none">{longestStreak}</div>
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
            <div className="stat-chip border-yellow-500/30 bg-yellow-500/10">
              <Trophy size={13} className="text-yellow-400" />
              <div className="text-center">
                <div className="text-xs font-black text-yellow-300 leading-none">{prevMilestone.emoji} {prevMilestone.label}</div>
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
    </div>
  );
};

export default Index;
