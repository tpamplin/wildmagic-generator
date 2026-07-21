import { useState } from 'react';
import { effects } from '../data/effects';
import { getEffectTags, getPowerLabel, getSpellCost } from '../utils/effectTags';
import type { Effect } from '../types/effect';

interface SpellBrowserProps {
  discovered: Set<number>;
  newThisSession: Set<number>;
  onExport: () => void;
  onImport: (file: File) => Promise<number>;
  onReset: () => void;
  onCastSpell: (effect: Effect) => void;
  discoveredCount: number;
}

export function SpellBrowser({
  discovered,
  newThisSession,
  onExport,
  onImport,
  onReset,
  onCastSpell,
  discoveredCount,
}: SpellBrowserProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const added = await onImport(file);
      setImportMessage(`Imported ${added} new spell${added !== 1 ? 's' : ''}.`);
      setTimeout(() => setImportMessage(null), 3000);
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Failed to import.');
      setTimeout(() => setImportMessage(null), 4000);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="spell-browser">
      <div className="browser-header">
        <h2 className="browser-title">Spell Collection</h2>
        <span className="browser-count">
          {discoveredCount} / 100 discovered
        </span>
      </div>

      <div className="browser-list">
        {effects.map((effect) => {
          const isFound = discovered.has(effect.id);
          const isNew = newThisSession.has(effect.id);
          const isOpen = expanded === effect.id;

          return (
            <div
              key={effect.id}
              className={`browser-item ${isFound ? 'found' : 'locked'} ${isOpen ? 'open' : ''}`}
            >
              <button
                className="browser-item-header"
                onClick={() => setExpanded(isOpen ? null : effect.id)}
                type="button"
              >
                <span className="browser-item-icon">
                  {isFound ? '👁' : '🔒'}
                </span>
                <span className="browser-item-label">
                  {isFound ? (
                    <>
                      #{effect.id} {effect.name}
                      {isNew && <span className="browser-new-badge">✨ new</span>}
                    </>
                  ) : (
                    <>Spell #{effect.id} — Undiscovered</>
                  )}
                </span>
                {isFound && (
                  <span className={`power-badge power-${getPowerLabel(effect.powerTier)}`}>
                    ⚡ {getPowerLabel(effect.powerTier)}
                  </span>
                )}
                <span className="browser-item-chevron">
                  {isOpen ? '▾' : '▸'}
                </span>
              </button>
              {isOpen && (
                <div className="browser-item-desc">
                  {isFound ? (
                    <>
                      {effect.description}
                      {(() => {
                        const tags = getEffectTags(effect);
                        return (
                          <div className="browser-item-tags">
                            {tags.keywords.length > 0 && (
                              <span className="browser-tag-keywords">
                                🌀 {tags.keywords.join(' · ')}
                              </span>
                            )}
                            <span className="browser-tag-impulse">
                              ⚡ Impulse: {tags.impulse}
                            </span>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <p className="browser-unknown-desc">
                      The nature of this spell remains shrouded in chaos. Its effects
                      are unknown until you cast it. Spend 10 adversity tokens to choose
                      this spell and discover what it does.
                    </p>
                  )}
                  <button
                    className="browser-cast-btn"
                    onClick={() => onCastSpell(effect)}
                    type="button"
                  >
                    🎯 Cast Spell ({getSpellCost(isFound, effect.powerTier)} tokens)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="browser-footer">
        <button className="browser-action-btn" onClick={onExport}>
          💾 Save
        </button>
        <label className="browser-action-btn">
          📂 Load
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
        <button
          className="browser-action-btn browser-reset-btn"
          onClick={() => setShowResetConfirm(true)}
          type="button"
        >
          🗑 Reset
        </button>
      </div>

      {importMessage && (
        <div className="browser-import-msg" role="status">
          {importMessage}
        </div>
      )}

      {showResetConfirm && (
        <div className="reset-modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="reset-modal-title">Reset All Discoveries?</h3>
            <p className="reset-modal-body">
              This will lock all 100 spells again. Your saved file won't be affected,
              but you'll lose all progress in this browser. This cannot be undone.
            </p>
            <div className="reset-modal-actions">
              <button
                className="reset-modal-cancel"
                onClick={() => setShowResetConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="reset-modal-confirm"
                onClick={() => {
                  onReset();
                  setShowResetConfirm(false);
                }}
                type="button"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
