import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X, ZoomIn, ZoomOut, RotateCcw } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageZoomContextType {
  openImage: (src: string, alt?: string) => void;
  closeImage: () => void;
}

const ImageZoomContext = createContext<ImageZoomContextType | null>(null);

export const useImageZoom = () => {
  const context = useContext(ImageZoomContext);
  if (!context) {
    throw new Error('useImageZoom must be used within an ImageZoomProvider');
  }
  return context;
};

interface ImageZoomProviderProps {
  children: React.ReactNode;
}

export const ImageZoomProvider: React.FC<ImageZoomProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const openImage = useCallback((src: string, alt?: string) => {
    setImageSrc(src);
    setImageAlt(alt || 'Zoomed image');
    setScale(1);
    setIsLoading(true);
    setHasError(false);
    setIsOpen(true);
  }, []);

  const closeImage = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      handleReset();
    }
  }, [handleZoomIn, handleZoomOut, handleReset]);

  return (
    <ImageZoomContext.Provider value={{ openImage, closeImage }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] p-0 border-0 bg-black/95 shadow-none overflow-hidden [&>button]:hidden"
          onKeyDown={handleKeyDown}
        >
          <VisuallyHidden>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Zoomed view of {imageAlt}</DialogDescription>
          </VisuallyHidden>
          
          {/* Controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium min-w-[3.5rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleReset}
              disabled={scale === 1}
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={closeImage}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Image container - full screen */}
          <div 
            className="flex items-center justify-center w-full h-full overflow-auto p-4 cursor-pointer"
            onClick={(e) => {
              // Close if clicking on the background (not the image)
              if (e.target === e.currentTarget) {
                closeImage();
              }
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            {hasError ? (
              <div className="flex flex-col items-center justify-center p-8 text-white/70">
                <p className="text-base">Failed to load image</p>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt={imageAlt}
                className={cn(
                  "max-w-full max-h-full object-contain transition-transform duration-200 ease-out select-none",
                  isLoading ? "opacity-0" : "opacity-100"
                )}
                style={{ 
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            )}
          </div>

          {/* Alt text / caption */}
          {imageAlt && imageAlt !== 'Zoomed image' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border max-w-[90vw]">
              <p className="text-sm text-muted-foreground truncate">
                {imageAlt}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ImageZoomContext.Provider>
  );
};
