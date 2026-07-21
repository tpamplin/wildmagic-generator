const IMPULSES = [
  { value: 'help', label: 'Help', desc: 'Aid, protect, support' },
  { value: 'hurt', label: 'Hurt', desc: 'Damage, attack, weaken' },
  { value: 'heal', label: 'Heal', desc: 'Restore, cure, mend' },
  { value: 'stop', label: 'Stop', desc: 'Halt, block, prevent' },
  { value: 'move', label: 'Move', desc: 'Travel, escape, flee' },
  { value: 'know', label: 'Know', desc: 'Learn, reveal, discover' },
  { value: 'change', label: 'Change', desc: 'Transform, alter, mutate' },
  { value: 'make', label: 'Make', desc: 'Create, summon, conjure' },
] as const;

export type Impulse = (typeof IMPULSES)[number]['value'];

interface ImpulseSelectorProps {
  value: Impulse;
  onChange: (impulse: Impulse) => void;
}

export function ImpulseSelector({ value, onChange }: ImpulseSelectorProps) {
  return (
    <fieldset className="selector-group">
      <legend className="selector-label">Impulse</legend>
      <p className="selector-hint">What are you trying to do?</p>
      <div className="impulse-grid" role="radiogroup" aria-label="Impulse">
        {IMPULSES.map((imp) => (
          <button
            key={imp.value}
            type="button"
            role="radio"
            aria-checked={value === imp.value}
            className={`impulse-btn ${value === imp.value ? 'active' : ''}`}
            onClick={() => onChange(imp.value)}
          >
            {imp.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export { IMPULSES };
