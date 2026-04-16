import React from 'react';

interface IPhoneMockupProps {
  children: React.ReactNode;
  className?: string;
  color?: 'desert-titanium' | 'natural-titanium' | 'black-titanium' | 'white-titanium';
}

const colorSchemes = {
  'desert-titanium': {
    frame: 'linear-gradient(145deg, #c4a882 0%, #b8996e 15%, #a8875a 35%, #c4a882 55%, #d4b892 75%, #b8996e 90%, #a8875a 100%)',
    buttons: ['#a8875a', '#c4a882', '#b8996e'],
    highlight: 'rgba(255,240,220,0.5)',
    innerRing: '#8a7048',
  },
  'natural-titanium': {
    frame: 'linear-gradient(145deg, #8a8a8c 0%, #6e6e70 15%, #5a5a5c 35%, #7a7a7c 55%, #8a8a8c 75%, #6e6e70 90%, #5a5a5c 100%)',
    buttons: ['#5a5a5c', '#8a8a8c', '#6e6e70'],
    highlight: 'rgba(255,255,255,0.4)',
    innerRing: '#4a4a4c',
  },
  'black-titanium': {
    frame: 'linear-gradient(145deg, #3a3a3c 0%, #2c2c2e 15%, #1c1c1e 35%, #2c2c2e 55%, #3a3a3c 75%, #2c2c2e 90%, #1c1c1e 100%)',
    buttons: ['#1c1c1e', '#3a3a3c', '#2c2c2e'],
    highlight: 'rgba(255,255,255,0.2)',
    innerRing: '#1c1c1e',
  },
  'white-titanium': {
    frame: 'linear-gradient(145deg, #e8e8ed 0%, #d4d4d9 15%, #c0c0c5 35%, #d8d8dd 55%, #e8e8ed 75%, #d4d4d9 90%, #c0c0c5 100%)',
    buttons: ['#c0c0c5', '#e8e8ed', '#d4d4d9'],
    highlight: 'rgba(255,255,255,0.6)',
    innerRing: '#b0b0b5',
  },
};

export default function IPhoneMockup({ children, className = '', color = 'desert-titanium' }: IPhoneMockupProps) {
  const scheme = colorSchemes[color];

  return (
    <div className={`relative ${className}`}>
      {/* Main device frame - iPhone 16 Pro style */}
      <div 
        className="relative w-[300px] h-[620px]"
        style={{
          borderRadius: '52px',
          background: scheme.frame,
          boxShadow: `
            0 0 0 1px ${scheme.highlight},
            inset 0 0 0 1.5px rgba(0,0,0,0.1),
            0 2px 4px rgba(0,0,0,0.15),
            0 8px 16px rgba(0,0,0,0.12),
            0 16px 32px rgba(0,0,0,0.08),
            inset 0 1px 2px ${scheme.highlight}
          `,
          padding: '4px',
        }}
      >
        {/* Top edge highlight */}
        <div 
          className="absolute top-0 left-[20%] right-[20%] h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${scheme.highlight}, transparent)`,
          }}
        />

        {/* Volume buttons */}
        <div 
          className="absolute -left-[2.5px] top-[100px] w-[3px] h-[28px] rounded-l-sm"
          style={{
            background: `linear-gradient(90deg, ${scheme.buttons[0]}, ${scheme.buttons[1]}, ${scheme.buttons[2]})`,
            boxShadow: '-1px 0 2px rgba(0,0,0,0.3)',
          }}
        />
        <div 
          className="absolute -left-[2.5px] top-[142px] w-[3px] h-[28px] rounded-l-sm"
          style={{
            background: `linear-gradient(90deg, ${scheme.buttons[0]}, ${scheme.buttons[1]}, ${scheme.buttons[2]})`,
            boxShadow: '-1px 0 2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Action button */}
        <div 
          className="absolute -left-[2.5px] top-[62px] w-[3px] h-[18px] rounded-l-sm"
          style={{
            background: `linear-gradient(90deg, ${scheme.buttons[0]}, ${scheme.buttons[1]}, ${scheme.buttons[2]})`,
            boxShadow: '-1px 0 2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Power button */}
        <div 
          className="absolute -right-[2.5px] top-[115px] w-[3px] h-[45px] rounded-r-sm"
          style={{
            background: `linear-gradient(90deg, ${scheme.buttons[2]}, ${scheme.buttons[1]}, ${scheme.buttons[0]})`,
            boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Inner bezel */}
        <div 
          className="absolute inset-[3px] rounded-[49px] pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 1px ${scheme.innerRing}`,
          }}
        />

        {/* Screen container */}
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: '48px',
            background: '#000',
          }}
        >
          {/* Dynamic Island - smaller size */}
          <div 
            className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[80px] h-[26px] bg-black rounded-full z-30 flex items-center justify-end pr-[10px]"
            style={{
              boxShadow: '0 0 0 3px #000',
            }}
          >
            {/* Front camera */}
            <div 
              className="w-[8px] h-[8px] rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #2d2d4a 0%, #0a0a15 100%)',
                boxShadow: 'inset 0 0 1px rgba(255,255,255,0.15)',
              }}
            />
          </div>

          {/* Screen content */}
          <div className="w-full h-full overflow-hidden rounded-[48px]">
            {children}
          </div>

          {/* Screen glass reflection - very subtle */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-[48px] z-20"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
