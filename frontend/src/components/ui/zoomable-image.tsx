import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, ZoomIn } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useImageZoom } from '@/contexts/ImageZoomContext';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  /** Max height constraint for the image */
  maxHeight?: string;
  /** Whether to show zoom indicator on hover */
  showZoomIndicator?: boolean;
  /** Whether to lazy load the image */
  lazyLoad?: boolean;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

/**
 * A reusable image component with lazy loading and click-to-zoom functionality.
 * Must be used within an ImageZoomProvider context.
 */
export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  maxHeight = '380px',
  showZoomIndicator = true,
  lazyLoad = true,
  rootMargin = '100px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { openImage } = useImageZoom();

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) return;
    
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(container);
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [lazyLoad, rootMargin]);

  const handleClick = useCallback(() => {
    openImage(src, alt);
  }, [openImage, src, alt]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-lg overflow-hidden border border-border/50 relative bg-muted/30 group cursor-zoom-in",
        containerClassName
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`View ${alt} in full size`}
    >
      {/* Loading spinner */}
      {!isLoaded && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center min-h-[80px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Image */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-auto object-contain transition-all duration-200",
            "group-hover:brightness-95",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={{ maxHeight }}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Zoom indicator overlay */}
      {showZoomIndicator && isLoaded && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <ZoomIn className="h-5 w-5 text-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoomableImage;
