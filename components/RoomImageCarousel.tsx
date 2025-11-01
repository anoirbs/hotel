'use client';

import { useState } from 'react';
import Image from 'next/image';

interface RoomImageCarouselProps {
  images: string[];
  roomName: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function RoomImageCarousel({ 
  images, 
  roomName, 
  width = 400, 
  height = 250,
  className = "w-full h-64 object-cover"
}: RoomImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const roomImages = images && images.length > 0 ? images : [];

  if (roomImages.length === 0) {
    return (
      <div className={`${className.replace('object-cover', '')} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
        <span className="text-gray-500 text-lg">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      {roomImages.length > 0 ? (
        <>
          <Image
            src={roomImages[currentImageIndex]}
            alt={`${roomName} - Image ${currentImageIndex + 1}`}
            width={width}
            height={height}
            className={className}
          />
          {roomImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all z-10"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all z-10"
                aria-label="Next image"
              >
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {roomImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

