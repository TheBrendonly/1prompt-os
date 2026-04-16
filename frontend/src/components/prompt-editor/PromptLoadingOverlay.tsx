import React, { useState, useEffect } from 'react';

const LOADING_PHRASES = [
  'Analyzing prompt structure...',
  'Evaluating tone consistency...',
  'Reviewing section boundaries...',
  'Matching behavioral patterns...',
  'Optimizing conversation flow...',
  'Checking identity rules...',
  'Refining response patterns...',
  'Aligning with personality...',
  'Finalizing modifications...',
];

interface PromptLoadingOverlayProps {
  isVisible: boolean;
}

export const PromptLoadingOverlay: React.FC<PromptLoadingOverlayProps> = ({ isVisible }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setPhraseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: 'pulse 1.4s infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <p
          className="text-primary animate-pulse"
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: '22px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          REGENERATING PROMPT
        </p>
      </div>
    </div>
  );
};
