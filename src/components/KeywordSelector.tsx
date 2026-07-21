import type { ChangeEvent } from 'react';

const KEYWORD_CATEGORIES: Record<string, string[]> = {
  Elemental: ['Fire', 'Ice', 'Lightning', 'Wind', 'Water', 'Earth', 'Void', 'Light', 'Shadow'],
  Action: ['Escape', 'Protect', 'Destroy', 'Heal', 'Hide', 'Fly', 'Transform', 'Reveal', 'Bind', 'Break'],
  Concept: ['Time', 'Memory', 'Dreams', 'Truth', 'Fear', 'Hunger', 'Gravity', 'Sound', 'Silence', 'Chaos'],
  Object: ['Weapon', 'Shield', 'Door', 'Bridge', 'Feast', 'Mirror', 'Crown', 'Key', 'Bell', 'Chain'],
};

interface KeywordSelectorProps {
  keywords: (string | null)[];
  onChange: (keywords: (string | null)[]) => void;
}

export function KeywordSelector({ keywords, onChange }: KeywordSelectorProps) {
  const handleChange = (index: number, e: ChangeEvent<HTMLSelectElement>) => {
    const next = [...keywords];
    next[index] = e.target.value || null;
    onChange(next);
  };

  // Filter out already-selected keywords instead of using `disabled` on <option>
  // (disabled on <option> is unreliable on iOS/Safari).
  const selectedInOtherSlots = (slotIndex: number): Set<string> => {
    const selected = new Set<string>();
    keywords.forEach((k, i) => {
      if (i !== slotIndex && k !== null) selected.add(k);
    });
    return selected;
  };

  return (
    <fieldset className="selector-group">
      <legend className="selector-label">Keywords</legend>
      <p className="selector-hint" id="keyword-hint">What are you reaching for? (up to 3)</p>
      <div className="keyword-row">
        {[0, 1, 2].map((i) => {
          const taken = selectedInOtherSlots(i);
          return (
            <select
              key={i}
              className="selector keyword-select"
              value={keywords[i] ?? ''}
              onChange={(e) => handleChange(i, e)}
              aria-label={`Keyword ${i + 1}`}
              aria-describedby="keyword-hint"
            >
              <option value="">— any —</option>
              {Object.entries(KEYWORD_CATEGORIES).map(([category, words]) => {
                const available = words.filter((word) => !taken.has(word));
                if (available.length === 0) return null;
                return (
                  <optgroup key={category} label={category}>
                    {available.map((word) => (
                      <option key={word} value={word}>
                        {word}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          );
        })}
      </div>
    </fieldset>
  );
}

export { KEYWORD_CATEGORIES };
