import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

interface StreakResetDialogProps {
  lostStreak: number;
  habitName: string;
  onClose: () => void;
}

export function StreakResetDialog({ lostStreak, habitName, onClose }: StreakResetDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm overflow-hidden border-primary/10 bg-card p-0">
        <div className="bg-gradient-to-b from-primary/5 via-card to-card px-6 pb-6 pt-8 text-center sm:px-8">
          <span aria-hidden="true" className="mb-3 block text-5xl">🌱</span>
          <DialogTitle className="text-xs font-black tracking-widest text-orange-400">
            STREAK RESET
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your <span className="font-bold text-foreground">{lostStreak}-day</span> streak
            on <span className="font-bold text-foreground">{habitName}</span> ended
            after a break. Today starts a new streak. Keep going.
          </DialogDescription>

          <p className="mt-5 text-sm font-bold text-primary">Every day is a fresh start</p>
          <DialogFooter className="mt-5 sm:justify-center">
            <Button onClick={onClose} className="w-full sm:w-auto">Continue</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
