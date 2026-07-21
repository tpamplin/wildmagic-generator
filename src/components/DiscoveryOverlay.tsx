import { useEffect, useState } from 'react';

interface DiscoveryOverlayProps {
  spellId: number;
  spellName: string;
  keywords: string[];
  impulse: string;
  onDismiss: () => void;
}

export function DiscoveryOverlay({ spellId, spellName, keywords, impulse, onDismiss }: DiscoveryOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for fade-out
    }, 2200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`discovery-overlay ${visible ? 'discovery-enter' : 'discovery-exit'}`}
      onClick={handleClick}
      role="alert"
      aria-live="assertive"
    >
      <div className="discovery-content">
        <div className="discovery-sparkle">✨</div>
        <h2 className="discovery-title">New Spell Discovered!</h2>
        <div className="discovery-spell-id">#{spellId}</div>
        <div className="discovery-spell-name">{spellName}</div>
        {keywords.length > 0 && (
          <div className="discovery-tags">
            <span className="discovery-keywords">
              🌀 {keywords.join(' · ')}
            </span>
          </div>
        )}
        <div className="discovery-impulse">⚡ Impulse: {impulse}</div>
        <p className="discovery-hint">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
