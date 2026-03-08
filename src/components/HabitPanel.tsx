import { useState } from 'react';
import { Habit } from '@/types/habits';
import { HABIT_TYPE_CONFIG } from '@/types/habits';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Flame, CheckCircle, Trophy } from 'lucide-react';
import { Milestone } from '@/types/habits';

interface HabitPanelProps {
  habits: Habit[];
  isCompletedToday: (id: string) => boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddHabit: () => void;
  nextMilestone?: Milestone;
  longestStreak: number;
}

export function HabitPanel({
  habits,
  isCompletedToday,
  onComplete,
  onDelete,
  onAddHabit,
  nextMilestone,
  longestStreak,
}: HabitPanelProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = (id: string) => {
    if (isCompletedToday(id)) return;
    setCompletingId(id);
    onComplete(id);
    setTimeout(() => setCompletingId(null), 900);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground font-display">
          My Habits
        </h2>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
          {habits.length}
        </span>
      </div>

      {/* Habits List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 text-5xl">🌱</div>
            <p className="text-sm font-bold text-muted-foreground">No habits yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60 max-w-[180px]">
              Add your first habit to start growing your planet!
            </p>
          </div>
        ) : (
          habits.map(habit => {
            const completed  = isCompletedToday(habit.id);
            const typeConfig = HABIT_TYPE_CONFIG[habit.type];
            const isCompleting = completingId === habit.id;

            return (
              <div
                key={habit.id}
                className={`habit-card rounded-2xl p-3 transition-all duration-300 ${
                  isCompleting ? 'completed-pulse' : ''
                } ${completed ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-2xl leading-none">{habit.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${completed ? 'text-primary' : 'text-foreground'}`}>
                      {habit.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(habit.id)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground/30 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Bottom row */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1">
                    <Flame size={11} className="text-streak-gold" />
                    <span className="text-xs font-black text-foreground/80">{habit.streak}</span>
                  </div>

                  <button
                    onClick={() => handleComplete(habit.id)}
                    disabled={completed}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all ${
                      completed
                        ? 'cursor-default bg-primary/15 text-primary'
                        : 'bg-primary/20 text-primary hover:bg-primary/35 active:scale-95'
                    }`}
                  >
                    {completed ? (
                      <><CheckCircle size={12} /> Done!</>
                    ) : (
                      <>✨ Complete Today</>
                    )}
                  </button>
                </div>

                {/* Streak milestones inline badges */}
                {habit.streak >= 7 && (
                  <div className="mt-2 flex gap-1.5">
                    {habit.streak >= 7   && <span className="text-[10px] rounded-full bg-green-500/15 text-green-400 px-1.5 py-0.5 font-bold">🌿 7d</span>}
                    {habit.streak >= 30  && <span className="text-[10px] rounded-full bg-pink-500/15 text-pink-400 px-1.5 py-0.5 font-bold">🦋 30d</span>}
                    {habit.streak >= 100 && <span className="text-[10px] rounded-full bg-yellow-400/15 text-yellow-300 px-1.5 py-0.5 font-bold">✨ 100d</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Next milestone teaser */}
      {nextMilestone && longestStreak > 0 && (
        <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy size={11} className="text-yellow-400" />
            <span className="text-[11px] font-bold text-muted-foreground">Next milestone</span>
          </div>
          <p className="text-xs font-bold text-foreground">{nextMilestone.emoji} {nextMilestone.label}</p>
          <p className="text-[10px] text-muted-foreground mb-1.5">{nextMilestone.description}</p>
          <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
              style={{ width: `${Math.min(100, (longestStreak / nextMilestone.streak) * 100)}%` }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground text-right">
            {longestStreak}/{nextMilestone.streak} days
          </p>
        </div>
      )}

      {/* Add Button */}
      <Button
        onClick={onAddHabit}
        className="w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-lg hover:bg-primary/90 glow-green transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus size={15} className="mr-1.5" />
        Add Habit
      </Button>
    </div>
  );
}
