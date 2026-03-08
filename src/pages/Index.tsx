import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PlanetScene } from '@/components/PlanetScene';
import { HabitPanel } from '@/components/HabitPanel';
import { AddHabitModal } from '@/components/AddHabitModal';
import { useHabits } from '@/hooks/useHabits';
import { Flame, Globe, Sparkles } from 'lucide-react';

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
    addHabit,
    deleteHabit,
    completeHabit,
    isCompletedToday,
    getTotalCompletions,
    getLongestStreak,
  } = useHabits();

  const [showModal, setShowModal] = useState(false);

  const totalCompletions = getTotalCompletions();
  const longestStreak = getLongestStreak();
  const todayCompleted = habits.filter(h => isCompletedToday(h.id)).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background stars-bg">
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/50 bg-card/40 px-6 py-3 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Globe size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none tracking-tight text-gradient-primary">
              Habit Planet
            </h1>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Grow your world</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {/* Today */}
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-2 backdrop-blur-sm">
            <Sparkles size={14} className="text-primary" />
            <div className="text-center">
              <div className="text-sm font-black text-gradient-primary leading-none">{todayCompleted}/{habits.length}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Today</div>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-2 backdrop-blur-sm">
            <Flame size={14} style={{ color: 'hsl(40 95% 60%)' }} />
            <div className="text-center">
              <div className="text-sm font-black text-gradient-gold leading-none">{longestStreak}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Best streak</div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-2 backdrop-blur-sm">
            <span className="text-sm">🌟</span>
            <div className="text-center">
              <div className="text-sm font-black text-foreground leading-none">{totalCompletions}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Total</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Habits */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/50 bg-card/30 p-4 backdrop-blur-md">
          <HabitPanel
            habits={habits}
            isCompletedToday={isCompletedToday}
            onComplete={completeHabit}
            onDelete={deleteHabit}
            onAddHabit={() => setShowModal(true)}
          />
        </aside>

        {/* Planet Canvas */}
        <main className="relative flex-1">
          {/* Hint text */}
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">
              🖱️ Drag to rotate · Scroll to zoom
            </p>
          </div>

          {/* Object counter */}
          {planetObjects.length > 0 && (
            <div className="absolute right-4 top-4 z-10 rounded-xl border border-border/40 bg-card/70 px-3 py-2 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-lg font-black text-gradient-primary">{planetObjects.length}</div>
                <div className="text-xs text-muted-foreground">Objects on planet</div>
              </div>
            </div>
          )}

          {/* Welcome overlay when no habits */}
          {habits.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="rounded-2xl border border-border/40 bg-card/80 p-6 text-center backdrop-blur-sm max-w-xs pointer-events-auto">
                <div className="mb-3 text-5xl">🪐</div>
                <h2 className="mb-2 text-lg font-black text-foreground">Your planet awaits!</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add habits on the left to start growing trees, flowers, mountains and buildings on your planet.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
                >
                  🌱 Plant First Habit
                </button>
              </div>
            </div>
          )}

          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            shadows
            style={{ background: 'transparent' }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <PlanetScene
                planetObjects={planetObjects}
                newObjectId={newObjectId}
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
