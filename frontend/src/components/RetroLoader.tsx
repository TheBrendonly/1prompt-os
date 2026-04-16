import React from 'react';

const RetroLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-foreground"
              style={{
                animation: 'saving-bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <p
          className="text-foreground"
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: '22px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          LOADING SYSTEM
        </p>
        <style>{`
          @keyframes saving-bounce {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default RetroLoader;
