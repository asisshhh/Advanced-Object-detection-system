import React, { useRef, useEffect } from 'react';
import { Detection, drawDetections } from '@/utils/detection';

type DetectionCanvasProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  imageRef?: React.RefObject<HTMLImageElement>;
  isImage?: boolean;
  detections: Detection[];
  width: number;
  height: number;
};

const DetectionCanvas: React.FC<DetectionCanvasProps> = ({ 
  videoRef, 
  imageRef,
  isImage = false,
  detections, 
  width, 
  height 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Determine which media element to use
    const mediaElement = isImage ? imageRef?.current : videoRef.current;
    if (!mediaElement) return;
    
    // Calculate scale factor if media dimensions don't match canvas
    let scaleX = 1;
    let scaleY = 1;
    
    if (isImage && imageRef?.current) {
      scaleX = width / imageRef.current.naturalWidth;
      scaleY = height / imageRef.current.naturalHeight;
    } else if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
      scaleX = width / videoRef.current.videoWidth;
      scaleY = height / videoRef.current.videoHeight;
    }
    
    // Draw the detection boxes with proper scaling
    const scale = Math.min(scaleX, scaleY);
    drawDetections(ctx, detections, scale);
    
  }, [detections, videoRef, imageRef, isImage, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 z-10 pointer-events-none"
    />
  );
};

export default DetectionCanvas;
