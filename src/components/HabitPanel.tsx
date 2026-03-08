import { useState } from 'react';
import { Habit } from '@/types/habits';
import { HABIT_TYPE_CONFIG } from '@/types/habits';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Flame, CheckCircle } from 'lucide-react';

interface HabitPanelProps {
  habits: Habit[];
  isCompletedToday: (id: string) => boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddHabit: () => void;
}

export function HabitPanel({
  habits,
  isCompletedToday,
  onComplete,
  onDelete,
  onAddHabit,
}: HabitPanelProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = (id: string) => {
    if (isCompletedToday(id)) return;
    setCompletingId(id);
    onComplete(id);
    setTimeout(() => setCompletingId(null), 800);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          My Habits
        </h2>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
          {habits.length}
        </span>
      </div>

      {/* Habits List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 text-4xl">🌱</div>
            <p className="text-sm font-semibold text-muted-foreground">No habits yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Add your first habit to start growing your planet!
            </p>
          </div>
        ) : (
          habits.map(habit => {
            const completed = isCompletedToday(habit.id);
            const typeConfig = HABIT_TYPE_CONFIG[habit.type];
            const isCompleting = completingId === habit.id;

            return (
              <div
                key={habit.id}
                className={`habit-card rounded-xl p-3 ${isCompleting ? 'completed-pulse' : ''} ${
                  completed ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                {/* Top row: icon, name, delete */}
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xl leading-none">{habit.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${completed ? 'text-primary' : 'text-foreground'}`}>
                      {habit.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{typeConfig.icon} {typeConfig.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(habit.id)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Bottom row: streak + button */}
                <div className="mt-2.5 flex items-center gap-2">
                  {/* Streak */}
                  <div className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1">
                    <Flame size={11} className="text-streak-gold" style={{ color: 'hsl(40 95% 60%)' }} />
                    <span className="text-xs font-bold text-foreground/80">{habit.streak}</span>
                  </div>

                  {/* Complete button */}
                  <button
                    onClick={() => handleComplete(habit.id)}
                    disabled={completed}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all ${
                      completed
                        ? 'cursor-default bg-primary/15 text-primary'
                        : 'bg-primary/20 text-primary hover:bg-primary/30 active:scale-95'
                    }`}
                  >
                    {completed ? (
                      <>
                        <CheckCircle size={12} />
                        Done!
                      </>
                    ) : (
                      <>
                        ✨ Complete Today
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Habit Button */}
      <Button
        onClick={onAddHabit}
        className="w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-lg hover:bg-primary/90 glow-green transition-all hover:scale-[1.02]"
      >
        <Plus size={16} className="mr-1.5" />
        Add Habit
      </Button>
    </div>
  );
}
