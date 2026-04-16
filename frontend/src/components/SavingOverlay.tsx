import React from 'react';
import ReactDOM from 'react-dom';

interface SavingOverlayProps {
  isVisible: boolean;
  message?: string;
  /** 'absolute' (default) for dialogs, 'fixed' for full work-area contexts */
  variant?: 'absolute' | 'fixed';
  /** When true with variant="fixed", covers the entire viewport including the header */
  fullPage?: boolean;
  /** When true, uses a fully opaque background instead of semi-transparent */
  opaque?: boolean;
}

const SavingOverlay: React.FC<SavingOverlayProps> = ({ isVisible, message = 'Saving changes...', variant = 'absolute', fullPage = false, opaque = false }) => {
  const [rect, setRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!isVisible || variant !== 'fixed') return;
    const scrollContainer = (document.querySelector('[data-client-scroll-container]') || document.querySelector('main.flex-1')) as HTMLElement | null;
    if (scrollContainer) {
      scrollContainer.style.overflow = 'hidden';
      const update = () => {
        const r = scrollContainer.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      };
      update();
      window.addEventListener('resize', update);
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
      window.addEventListener('beforeunload', handler);
      return () => {
        scrollContainer.style.overflow = '';
        window.removeEventListener('resize', update);
        window.removeEventListener('beforeunload', handler);
      };
    }
  }, [isVisible, variant]);

  if (!isVisible) return null;

  if (variant === 'fixed') {
    const overlayStyle: React.CSSProperties = fullPage
      ? { position: 'fixed', inset: 0, zIndex: 9999 }
      : {
          position: 'fixed',
          top: 0,
          left: rect?.left ?? 0,
          width: rect?.width ?? '100%',
          height: '100vh',
          zIndex: 50,
        };

    return ReactDOM.createPortal(
      <div
        className={`flex items-center justify-center ${opaque ? 'bg-background' : 'bg-background/70'} backdrop-blur-[2px]`}
        style={overlayStyle}
      >
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
            {message}
          </p>
          <style>{`
            @keyframes saving-bounce {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
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
          {message}
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

export default SavingOverlay;
