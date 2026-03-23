import { useState } from 'react';
import { HabitType, HABIT_TYPE_CONFIG } from '@/types/habits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface AddHabitModalProps {
  onClose: () => void;
  onAdd: (name: string, type: HabitType, icon: string) => void;
  disabled?: boolean;
}

const PRESET_ICONS: Record<HabitType, string[]> = {
  tree:     ['📚', '📖', '🎓', '🧠', '✏️', '🔬'],
  flower:   ['🧘', '🌿', '💆', '🫁', '💜', '🕯️'],
  mountain: ['🏃', '💪', '🚴', '🏋️', '⚽', '🥊', '🏊'],
  building: ['💻', '🎯', '🔧', '🎨', '📊', '🚀'],
};

const TYPE_GRADIENTS: Record<HabitType, string> = {
  tree:     'from-green-500/20 to-emerald-500/10 border-green-500/30',
  flower:   'from-pink-500/20 to-fuchsia-500/10 border-pink-500/30',
  mountain: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
  building: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
};

export function AddHabitModal({ onClose, onAdd, disabled = false }: AddHabitModalProps) {
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
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card/95 p-6 shadow-2xl animate-scale-in backdrop-blur-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground font-display">New Habit</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Grow your planet every day</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Habit Name */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-bold text-foreground/80">
            Habit Name
          </label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Read 30 minutes..."
            className="rounded-xl border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        {/* Habit Type */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-bold text-foreground/80">
            Growth Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(HABIT_TYPE_CONFIG) as [HabitType, typeof HABIT_TYPE_CONFIG[HabitType]][]).map(([t, cfg]) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all bg-gradient-to-br ${
                  type === t
                    ? `${TYPE_GRADIENTS[t]} scale-[1.02] shadow-lg`
                    : 'border-border/40 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                }`}
              >
                <span className="text-2xl">{cfg.icon}</span>
                <div>
                  <div className={`text-xs font-black ${type === t ? 'text-foreground' : ''}`}>{cfg.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{cfg.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold text-foreground/80">
            Pick an Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_ICONS[type].map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all ${
                  icon === ic
                    ? 'border-primary bg-primary/15 scale-110 shadow-md'
                    : 'border-border/40 bg-muted/30 hover:border-primary/40 hover:scale-105 hover:bg-muted/60'
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
          className="w-full rounded-2xl bg-primary py-3 font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-40 glow-green transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
        >
          🌱 Plant Habit
        </Button>
      </div>
    </div>
  );
}
