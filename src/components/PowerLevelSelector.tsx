const POWER_LEVELS = [
  { value: 'flicker', label: 'Flicker', desc: 'A whisper of chaos' },
  { value: 'surge', label: 'Surge', desc: 'A solid burst of magic' },
  { value: 'cataclysm', label: 'Cataclysm', desc: 'Reality bends' },
] as const;

export type PowerLevel = (typeof POWER_LEVELS)[number]['value'];

interface PowerLevelSelectorProps {
  value: PowerLevel;
  onChange: (level: PowerLevel) => void;
}

export function PowerLevelSelector({ value, onChange }: PowerLevelSelectorProps) {
  return (
    <fieldset className="selector-group">
      <legend className="selector-label">Power Level</legend>
      <p className="selector-hint">How hard are you pushing?</p>
      <div className="power-row" role="radiogroup" aria-label="Power level">
        {POWER_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            role="radio"
            aria-checked={value === level.value}
            className={`power-btn power-${level.value} ${value === level.value ? 'active' : ''}`}
            onClick={() => onChange(level.value)}
          >
            <span className="power-label">{level.label}</span>
            <span className="power-desc">{level.desc}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export { POWER_LEVELS };
