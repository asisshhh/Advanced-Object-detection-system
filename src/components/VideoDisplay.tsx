import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { Detection } from '@/utils/detection';
import DetectionCanvas from './DetectionCanvas';

type VideoDisplayProps = {
  stream?: MediaStream | null;
  imageUrl?: string;
  detections: Detection[];
  isRecording?: boolean;
};

const VideoDisplay = forwardRef<HTMLVideoElement, VideoDisplayProps>(({
  stream,
  imageUrl,
  detections,
  isRecording = false,
}, ref) => {
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [isLoading, setIsLoading] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine the forwarded ref with our local ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(videoRef.current);
      } else {
        ref.current = videoRef.current;
      }
    }
  }, [ref]);

  useEffect(() => {
    const video = videoRef.current;
    const img = imageRef.current;
    const container = containerRef.current;

    const updateDimensions = (width: number, height: number) => {
      if (!container) return;

      const maxWidth = container.clientWidth;
      const maxHeight = container.clientHeight;
      
      let newWidth = width;
      let newHeight = height;
      
      if (newWidth > maxWidth) {
        newHeight = (newHeight * maxWidth) / newWidth;
        newWidth = maxWidth;
      }
      
      if (newHeight > maxHeight) {
        newWidth = (newWidth * maxHeight) / newHeight;
        newHeight = maxHeight;
      }
      
      setDimensions({ 
        width: Math.floor(newWidth), 
        height: Math.floor(newHeight) 
      });
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      if (video) {
        updateDimensions(video.videoWidth, video.videoHeight);
      }
    };

    const handleError = (error: Event) => {
      console.error('Error loading media:', error);
      setIsLoading(false);
    };

    // Reset state when source changes
    setIsImage(false);
    setIsLoading(true);

    if (stream) {
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => updateDimensions(video.videoWidth, video.videoHeight);
        video.play().catch(err => console.error('Error playing video:', err));
      }
    } else if (imageUrl) {
      // Check if the URL points to an image
      const isImageFile = /\.(jpg|jpeg|png|gif|bmp)$/i.test(imageUrl);
      setIsImage(isImageFile);

      if (isImageFile) {
        // For images
        const tempImg = new Image();
        tempImg.onload = () => {
          updateDimensions(tempImg.naturalWidth, tempImg.naturalHeight);
          setIsLoading(false);
        };
        tempImg.src = imageUrl;
      } else {
        // For videos
        if (video) {
          video.src = imageUrl;
          video.onloadstart = handleLoadStart;
          video.onloadeddata = handleLoadedData;
          video.onerror = handleError;
          video.load();
        }
      }
    } else {
      if (video) {
        video.srcObject = null;
        video.src = '';
      }
    }

    return () => {
      if (video) {
        video.pause();
        video.srcObject = null;
        video.src = '';
        video.onloadstart = null;
        video.onloadeddata = null;
        video.onerror = null;
      }
    };
  }, [stream, imageUrl]);

  return (
    <div 
      ref={containerRef}
      className="relative mx-auto overflow-hidden bg-black rounded-lg shadow-xl animate-fade-in" 
      style={{ width: '100%', maxWidth: '640px', height: '480px' }}
    >
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-white"></div>
        </div>
      )}
      
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center z-20 bg-black bg-opacity-60 px-3 py-1 rounded-full">
          <div className="recording-pulse"></div>
          <span className="text-white text-sm font-medium">Recording</span>
        </div>
      )}
      
      <div className="relative w-full h-full">
        {isImage && imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              ref={imageRef}
              src={imageUrl}
              alt="Detection preview"
              className="max-w-full max-h-full object-contain"
              style={{ 
                width: 'auto', 
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onError={(e) => console.error('Image load error:', e)}
            />
          </div>
        ) : (
          <video 
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
            muted
            autoPlay
          />
        )}
        
        {detections.length > 0 && (
          <DetectionCanvas 
            videoRef={videoRef}
            imageRef={imageRef}
            isImage={isImage}
            detections={detections} 
            width={dimensions.width} 
            height={dimensions.height}
          />
        )}
      </div>
      
      {!stream && !imageUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-lg">No media source selected</p>
        </div>
      )}
    </div>
  );
});

VideoDisplay.displayName = 'VideoDisplay';

export default VideoDisplay;
