"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import VideoEmbedPlayer from "@/components/VideoEmbedPlayer";

interface ListingGalleryProps {
  allImages: string[];
  displayTitle: string;
  videoUrl?: string | null;
}

export default function ListingGallery({ allImages, displayTitle, videoUrl }: ListingGalleryProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video'>('photos');

  // Keyboard navigation support for accessibility & premium experience
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, activeImgIndex]);

  const handleOpenLightbox = (index: number) => {
    setActiveImgIndex(index);
    setIsLightboxOpen(true);
  };

  const handleNext = () => {
    setActiveImgIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrev = () => {
    setActiveImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const hasPhotos = allImages && allImages.length > 0;
  const heroImage = hasPhotos ? allImages[0] : "";
  const sideImages = hasPhotos ? allImages.slice(1, 4) : [];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Main Content Area */}
      {activeMediaTab === 'video' && videoUrl ? (
        <VideoEmbedPlayer url={videoUrl} />
      ) : !hasPhotos ? (
        <div className="w-full relative h-[450px] bg-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col items-center justify-center text-slate-400">
          <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">No photos available</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {/* Main Image - Now spans full width with responsive mobile height */}
          <div 
            onClick={() => handleOpenLightbox(0)}
            className="relative h-[280px] sm:h-[380px] md:h-[480px] w-full bg-slate-200 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:opacity-95 transition-opacity group"
          >
            <Image 
              src={heroImage} 
              alt={displayTitle} 
              fill 
              className="object-cover group-hover:scale-[1.01] transition-transform duration-500" 
              priority
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-navy-base/80 text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-md backdrop-blur-sm">
                View Gallery
              </span>
            </div>
          </div>

          {/* Thumbnails Row Underneath (Jiji Style) - Visible on both Mobile and Desktop */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {[0, 1, 2].map((i) => {
              const hasImage = !!sideImages[i];
              const imgIndex = i + 1;
              return (
                <div 
                  key={i} 
                  onClick={() => hasImage && handleOpenLightbox(imgIndex)}
                  className={`relative h-[80px] sm:h-[110px] md:h-[140px] bg-slate-200 rounded-xl overflow-hidden shadow-sm ${
                    hasImage ? "cursor-pointer hover:opacity-90 transition-opacity group" : ""
                  }`}
                >
                  {hasImage ? (
                    <>
                      <Image 
                        src={sideImages[i]} 
                        alt={`${displayTitle} - Photo ${imgIndex + 1}`} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      {i === 2 && allImages.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm md:text-base">
                          +{allImages.length - 4} More
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Media Switcher — repositioned below gallery/no-photos area */}
      {videoUrl && (
        <div className="flex items-center gap-6 border-b border-slate-100 mt-2 pb-1">
          <button
            onClick={() => setActiveMediaTab('photos')}
            className={`relative text-sm font-bold transition-colors pb-2 ${
              activeMediaTab === 'photos'
                ? 'text-navy-base'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            📸 Photos
            {activeMediaTab === 'photos' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-base rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveMediaTab('video')}
            className={`relative text-sm font-bold transition-colors pb-2 ${
              activeMediaTab === 'video'
                ? 'text-navy-base'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🎥 Video Tour
            {activeMediaTab === 'video' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-base rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && hasPhotos && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center select-none animate-in fade-in duration-200">
          {/* Close Button */}
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20 z-50"
            aria-label="Close Lightbox"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Left Arrow */}
          {allImages.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all hover:scale-105 z-50"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Active Image Container */}
          <div className="relative w-[90vw] h-[80vh] flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
            <div className="relative max-w-full max-h-full aspect-[4/3] w-full h-full" onClick={(e) => e.stopPropagation()}>
              <Image 
                src={allImages[activeImgIndex]} 
                alt={`${displayTitle} - Full Photo ${activeImgIndex + 1}`} 
                fill 
                className="object-contain animate-in zoom-in-95 duration-200" 
              />
            </div>
          </div>

          {/* Right Arrow */}
          {allImages.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all hover:scale-105 z-50"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter/Index Indicator */}
          <div className="absolute bottom-6 text-white/80 text-sm font-semibold tracking-wide">
            {activeImgIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
