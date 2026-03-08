import { useState } from 'react';
import { HabitType, HABIT_TYPE_CONFIG } from '@/types/habits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface AddHabitModalProps {
  onClose: () => void;
  onAdd: (name: string, type: HabitType, icon: string) => void;
}

const PRESET_ICONS: Record<HabitType, string[]> = {
  tree: ['📚', '📖', '🎓', '🧠', '✏️'],
  flower: ['🧘', '🌿', '💆', '🫁', '💜'],
  mountain: ['🏃', '💪', '🚴', '🏋️', '⚽'],
  building: ['💻', '🎯', '🔧', '🎨', '📊'],
};

export function AddHabitModal({ onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>('tree');
  const [icon, setIcon] = useState('📚');

  const handleTypeChange = (t: HabitType) => {
    setType(t);
    setIcon(PRESET_ICONS[t][0]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), type, icon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">New Habit</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Habit Name */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-semibold text-foreground/80">
            Habit Name
          </label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Read 30 minutes..."
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Habit Type */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-semibold text-foreground/80">
            Growth Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(HABIT_TYPE_CONFIG) as [HabitType, typeof HABIT_TYPE_CONFIG[HabitType]][]).map(([t, cfg]) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                  type === t
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <span className="text-xl">{cfg.icon}</span>
                <div>
                  <div className="text-xs font-bold">{cfg.label}</div>
                  <div className="text-xs opacity-70">{cfg.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-foreground/80">
            Pick an Icon
          </label>
          <div className="flex gap-2">
            {PRESET_ICONS[type].map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all ${
                  icon === ic
                    ? 'border-primary bg-primary/10 scale-110'
                    : 'border-border bg-muted/30 hover:border-primary/40 hover:scale-105'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          🌱 Plant Habit
        </Button>
      </div>
    </div>
  );
}
