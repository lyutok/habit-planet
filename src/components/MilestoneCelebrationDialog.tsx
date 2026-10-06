import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { Milestone } from '@/types/habits';

interface MilestoneCelebrationDialogProps {
  milestone: Milestone;
  habitName: string;
  habitId: string;
  onClose: () => void;
  onDeleteHabit: (habitId: string) => Promise<void>;
}

const milestoneMessages: Record<number, { message: string; encouragement: string }> = {
  7: { message: 'Your planet is taking root.', encouragement: 'Small steps. Real change. Keep going!' },
  30: { message: 'Your world is starting to bloom.', encouragement: 'Consistency is rare. You have it!' },
  100: { message: 'Your world has come a long way.', encouragement: 'This habit is part of you now. Good job!' },
};

export function MilestoneCelebrationDialog({ milestone, habitName, habitId, onClose, onDeleteHabit }: MilestoneCelebrationDialogProps) {
  const copy = milestoneMessages[milestone.streak];
  const is100 = milestone.streak === 100;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm overflow-hidden border-primary/20 bg-card p-0">
        <div className="bg-gradient-to-b from-primary/10 via-card to-card px-6 pb-6 pt-8 text-center sm:px-8">
          <span aria-hidden="true" className="mb-3 block text-5xl">{milestone.emoji}</span>
          <DialogTitle className="text-xs font-black tracking-widest text-primary">
            {milestone.streak} DAYS
          </DialogTitle>
          <p className="mt-2 text-xl font-black text-foreground">{milestone.label}</p>
          <p className="mt-1 text-sm font-bold text-foreground/80">{milestone.description}</p>
          <DialogDescription className="mt-2 text-sm italic text-muted-foreground">
            {copy.message}
          </DialogDescription>

          <div className="mt-5 min-w-0 border-y border-border/50 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Habit</p>
            <p
              className="truncate text-sm font-semibold text-foreground"
              title={habitName}
              aria-label={`Habit: ${habitName}`}
            >
              {habitName}
            </p>
          </div>

          <p className="mt-4 text-sm font-bold text-primary">{copy.encouragement}</p>
          <DialogFooter className={`mt-5 gap-2 ${is100 ? 'sm:justify-between' : 'sm:justify-center'}`}>
            {is100 && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40"
                onClick={() => onDeleteHabit(habitId)}
              >
                <Trash2 size={13} />
                Remove habit
              </Button>
            )}
            <Button onClick={onClose} className={is100 ? '' : 'w-full sm:w-auto'}>Continue</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}