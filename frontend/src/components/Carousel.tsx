import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface CarouselProps {
  children: React.ReactNode[];
  itemsPerView?: number;
}

export function Carousel({ children, itemsPerView = 4 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = Math.max(0, children.length - itemsPerView);

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < maxIndex;

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  return (
    <div className="relative w-full">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out gap-4"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {children.map((child, index) => (
            <div 
              key={index}
              className={`flex-shrink-0 transition-opacity duration-300 ${
                index < currentIndex || index >= currentIndex + itemsPerView
                  ? 'opacity-30 blur-[2px]'
                  : 'opacity-100'
              }`}
              style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {canGoLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full shadow-lg bg-background hover:bg-accent"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {canGoRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full shadow-lg bg-background hover:bg-accent"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
