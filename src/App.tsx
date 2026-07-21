import { useState, useRef } from 'react';
import { selectEffectChaos } from './engine/chaosEngine';
import { effects } from './data/effects';
import { KeywordSelector } from './components/KeywordSelector';
import { ImpulseSelector } from './components/ImpulseSelector';
import type { Impulse } from './components/ImpulseSelector';
import { PowerLevelSelector } from './components/PowerLevelSelector';
import type { PowerLevel } from './components/PowerLevelSelector';
import { SpaceBackground } from './components/SpaceBackground';
import { DiscoveryOverlay } from './components/DiscoveryOverlay';
import { SpellBrowser } from './components/SpellBrowser';
import { useDiscoveredSpells } from './hooks/useDiscoveredSpells';
import { getEffectTags, getPowerLabel } from './utils/effectTags';
import { getNarrative } from './utils/narrative';
import type { Effect } from './types/effect';

type AppMode = 'cast' | 'browse';

/** Spells so powerful they resist discovery — 2/3 fizzle chance when undiscovered. */
const FIZZLE_SPELLS = new Set([95, 98, 99, 100]);

/** 2-in-3 chance a fizzle-eligible spell fails to manifest. */
const FIZZLE_CHANCE = 2 / 3;

function App() {
  const [mode, setMode] = useState<AppMode>('cast');
  const [keywords, setKeywords] = useState<(string | null)[]>([null, null, null]);
  const [impulse, setImpulse] = useState<Impulse>('help');
  const [powerLevel, setPowerLevel] = useState<PowerLevel>('surge');
  const [adversity, setAdversity] = useState(0);
  const [result, setResult] = useState<Effect | null>(null);
  const [fizzled, setFizzled] = useState(false);
  const [adversityGained, setAdversityGained] = useState(0);
  const [showOverlay, setShowOverlay] = useState<{
    id: number;
    name: string;
    keywords: string[];
    impulse: string;
  } | null>(null);
  const [newThisSession, setNewThisSession] = useState<Set<number>>(new Set());
  const pendingResult = useRef<Effect | null>(null);

  const { isDiscovered, discovered, discover, resetAll, exportToFile, importFromFile, discoveredCount } =
    useDiscoveredSpells();

  const handleCast = () => {
    const { effect } = selectEffectChaos(effects, keywords, impulse, powerLevel, adversity);
    // Adversity tokens: +1 if power level differs from what you asked for,
    // +1 if the spell has zero (or negative) affinity for your selected impulse.
    let gained = 0;
    // Compare the spell's *actual* power tier to what was requested.
    // (Not effectivePowerLevel — that only flips on crit fail, missing
    //  cases where e.g. a wild power roll gives you a surge on a flicker cast.)
    if (getPowerLabel(effect.powerTier) !== powerLevel) gained += 1;
    // Impulse check: only penalise if the spell truly has no connection
    // to your intent, rather than requiring it to be the #1 impulse.
    const impulseScore = effect.impulseScores[impulse] ?? 0;
    if (impulseScore <= 0) gained += 1;
    setAdversityGained(gained);
    castSpell(effect, gained);
  };

  /**
   * Shared cast logic — used by both engine cast and pick-from-list cast.
   * @param adversitySoFar — tokens already earned from power/impulse mismatches
   *   before any fizzle check. On fizzle, an extra +1 is added.
   */
  const castSpell = (effect: Effect, adversitySoFar: number = 0) => {
    // Top-tier spells resist discovery — 2/3 chance of fizzling when unknown
    if (FIZZLE_SPELLS.has(effect.id) && !isDiscovered(effect.id)) {
      if (Math.random() < FIZZLE_CHANCE) {
        // Fizzle awards an extra +1 adversity token on top of any mismatch tokens
        const totalGained = adversitySoFar + 1;
        setAdversityGained(totalGained);
        setFizzled(true);
        return;
      }
    }

    if (!isDiscovered(effect.id)) {
      pendingResult.current = effect;
      const tags = getEffectTags(effect);
      setShowOverlay({ id: effect.id, name: effect.name, keywords: tags.keywords, impulse: tags.impulse });
      return;
    }

    setResult(effect);
  };

  const handlePickSpell = (effect: Effect) => {
    setMode('cast');
    castSpell(effect);
  };

  const handlePowerChange = (level: PowerLevel) => {
    setPowerLevel(level);
    // Cataclysm costs 2 adversity tokens minimum
    if (level === 'cataclysm' && adversity < 2) {
      setAdversity(2);
    }
  };

  const handleOverlayDismiss = () => {
    if (showOverlay) {
      discover(showOverlay.id);
      setNewThisSession((prev) => new Set(prev).add(showOverlay.id));
    }
    setShowOverlay(null);
    // Now reveal the card — the spell is already discovered, so it shows fully
    if (pendingResult.current) {
      setResult(pendingResult.current);
      pendingResult.current = null;
    }
  };

  const handleCastAgain = () => {
    setResult(null);
    setFizzled(false);
    setAdversityGained(0);
  };

  const handleResetAll = () => {
    setKeywords([null, null, null]);
    setImpulse('help');
    setPowerLevel('surge');
    setAdversity(0);
    setResult(null);
    setFizzled(false);
    setAdversityGained(0);
  };

  // ---- Browse mode ----
  if (mode === 'browse') {
    return (
      <div className="app app-browse">
        <SpaceBackground />
        <div className="mode-tabs">
          <button className="mode-tab" onClick={() => setMode('cast')}>
            ← Cast
          </button>
          <button className="mode-tab active">Browse</button>
        </div>
        <SpellBrowser
          discovered={discovered}
          newThisSession={newThisSession}
          onExport={exportToFile}
          onImport={importFromFile}
          onReset={resetAll}
          onCastSpell={handlePickSpell}
          discoveredCount={discoveredCount}
        />
      </div>
    );
  }

  // ---- Cast mode: fizzle ----
  if (fizzled) {
    return (
      <div className="app app-result">
        <SpaceBackground />
        <div className="result-card fizzle-card result-enter">
          <div className="fizzle-icon">⚡</div>
          <h2 className="effect-name fizzle-name">Wild Surge Fizzled!</h2>
          <p className="effect-description fizzle-desc">
            You reached for something immense — a power beyond reckoning — but the magic
            slipped through your grasp, sputtering into nothing. The weave trembles,
            but yields nothing… this time.
          </p>
          {adversityGained > 0 && (
            <div className="adversity-gained" role="status" aria-live="polite">
              +{adversityGained} adversity {adversityGained === 1 ? 'token' : 'tokens'}
            </div>
          )}
          <button className="cast-again-btn" onClick={handleCastAgain}>
            CAST AGAIN
          </button>
        </div>
      </div>
    );
  }

  // ---- Cast mode: result ----
  if (result) {
    const pt = result.powerTier;
    const resultTier = pt < 0.33 ? 'flicker' : pt < 0.67 ? 'surge' : 'cataclysm';

    return (
      <div className="app app-result">
        <SpaceBackground />

        <div className={`result-card power-border-${resultTier} result-enter`}>
          <p className="result-narrative">
            {getNarrative(result, keywords, powerLevel)}
          </p>
          {adversityGained > 0 && (
            <div className="adversity-gained" role="status" aria-live="polite">
              +{adversityGained} adversity {adversityGained === 1 ? 'token' : 'tokens'}
            </div>
          )}
          <div className="spell-number known" role="status" aria-label={`Spell ${result.id}, discovered`}>
            #{result.id}
          </div>
          <h2 className="effect-name">{result.name}</h2>
          <p className="effect-description">{result.description}</p>
          <button className="cast-again-btn" onClick={handleCastAgain}>
            CAST AGAIN
          </button>
        </div>
      </div>
    );
  }

  // ---- Cast mode: input ----
  const sliderMin = powerLevel === 'cataclysm' ? 2 : 0;
  return (
    <div className="app app-input">
      <SpaceBackground />

      {showOverlay && (
        <DiscoveryOverlay
          spellId={showOverlay.id}
          spellName={showOverlay.name}
          keywords={showOverlay.keywords}
          impulse={showOverlay.impulse}
          onDismiss={handleOverlayDismiss}
        />
      )}

      <div className="mode-tabs">
        <button className="mode-tab active">Cast</button>
        <button className="mode-tab" onClick={() => setMode('browse')}>
          Browse →
        </button>
      </div>
      <h1 className="title">Wild Magic</h1>
      <p className="subtitle">Reach into the chaos</p>
      <div className="input-panel" role="form" aria-label="Wild magic cast configuration">
        <KeywordSelector keywords={keywords} onChange={setKeywords} />
        <ImpulseSelector value={impulse} onChange={setImpulse} />
        <PowerLevelSelector value={powerLevel} onChange={handlePowerChange} />

        <div className="selector-group">
          <label className="selector-label" htmlFor="adversity-slider">
            Adversity Tokens: {adversity}
          </label>
          <span className="selector-hint">
            Spend tokens to bend chaos toward your will.
          </span>
          <input
            id="adversity-slider"
            type="range"
            min={sliderMin}
            max={9}
            value={adversity}
            onChange={(e) => setAdversity(Number(e.target.value))}
            className="adversity-slider"
          />
          <div className="adversity-labels">
            {Array.from({ length: 10 - sliderMin }, (_, i) => sliderMin + i).map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <button
            className="pick-spell-btn"
            type="button"
            onClick={() => setMode('browse')}
          >
            🎯 Pick Spell
          </button>
        </div>

        <button className="cast-btn" onClick={handleCast}>
          CAST
        </button>
        <button className="reset-btn" onClick={handleResetAll} type="button">
          Reset
        </button>
      </div>
    </div>
  );
}

export default App;
