import React, { useState, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { loadModel, detectObjects, Detection } from '@/utils/detection';
import { VideoRecorder } from '@/utils/recording';
import Header from '@/components/Header';
import VideoDisplay from '@/components/VideoDisplay';
import ActionButton from '@/components/ActionButton';
import { Camera, Play, StopCircle, FileVideo } from 'lucide-react';

const Index = () => {
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [detectionActive, setDetectionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRecorderRef = useRef<VideoRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize video recorder
  useEffect(() => {
    videoRecorderRef.current = new VideoRecorder();
    
    return () => {
      // Cleanup on unmount
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      stopStreaming();
    };
  }, []);

  // Load TensorFlow model on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Starting model initialization...');
        const loadedModel = await loadModel();
        console.log('Model loaded successfully');
        setModel(loadedModel);
        setLoading(false);
        toast({
          title: "Model loaded successfully",
          description: "The object detection model is ready to use",
        });
      } catch (error) {
        console.error('Failed to load model:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load the detection model",
        });
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Start object detection processing loop
  const startDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
      console.error('Video element not found');
      return;
    }

    setDetectionActive(true);
    detectionIntervalRef.current = setInterval(async () => {
      if (videoElement.paused || videoElement.ended) return;
      
      try {
        const results = await detectObjects(videoElement);
        setDetections(results);
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 100); // Run detection 10 times per second
  };

  // Stop detection loop
  const stopDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectionActive(false);
    setDetections([]);
  };

  // Handle start webcam button
  const handleStartWebcam = async () => {
    try {
      if (stream) {
        stopStreaming();
        return;
      }

      setLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      setImageUrl(undefined);
      setLoading(false);
      
      // Start detection after a small delay to ensure video is playing
      setTimeout(() => {
        startDetectionLoop();
      }, 500);
      
      toast({
        title: "Camera started",
        description: "Your webcam is now active",
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access your webcam",
      });
      setLoading(false);
    }
  };

  // Handle stop all streaming and recording
  const stopStreaming = () => {
    // Stop recording if active
    if (isRecording && videoRecorderRef.current) {
      handleStopRecording();
    }
    
    // Stop detection loop
    stopDetectionLoop();
    
    // Stop and cleanup media stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setDetections([]);
  };

  // Handle start recording button
  const handleStartRecording = async () => {
    if (!stream) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Please start the webcam first",
      });
      return;
    }

    try {
      if (videoRecorderRef.current) {
        await videoRecorderRef.current.startRecording(stream);
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Your video is now being recorded"
        });
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Failed to start recording",
      });
    }
  };

  // Handle stop recording button
  const handleStopRecording = async () => {
    if (!isRecording || !videoRecorderRef.current) return;
    
    try {
      const recordedBlob = await videoRecorderRef.current.stopRecording();
      setIsRecording(false);
      
      // Save the recording with timestamp in filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `detection-recording-${timestamp}.webm`;
      videoRecorderRef.current.saveRecording(recordedBlob, filename);
      
      toast({
        title: "Recording Saved",
        description: `Your recording has been saved as ${filename}`,
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Failed to save recording",
      });
      setIsRecording(false);
    }
  };

  // Handle loading a video file
  const handleLoadVideo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the selected video file
  const handleVideoFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Stop any current streams/recording
    stopStreaming();
    
    // Create a URL for the video file
    const videoUrl = URL.createObjectURL(file);
    setImageUrl(videoUrl);
    
    // Wait for video to load before starting detection
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.onloadedmetadata = () => {
      // Start detection on the video
      setTimeout(() => {
        startDetectionLoop();
      }, 500);
      
      toast({
        title: "Video Loaded",
        description: `Now playing: ${file.name}`,
      });
    };
    
    // Reset the input to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Header />
      
      <main className="max-w-5xl mx-auto">
        {/* Video/Image display area */}
        <div className="mb-8 flex justify-center">
          <VideoDisplay 
            ref={videoRef}
            stream={stream}
            imageUrl={imageUrl}
            detections={detections}
            isRecording={isRecording}
          />
        </div>
        
        {/* Control buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ActionButton
            onClick={handleStartWebcam}
            color="green"
            disabled={loading}
            icon={<Camera className="w-5 h-5" />}
          >
            {stream ? "Stop Camera" : "Start Webcam"}
          </ActionButton>
          
          <ActionButton
            onClick={handleStartRecording}
            color="red"
            disabled={!stream || isRecording || loading}
            icon={<Play className="w-5 h-5" />}
          >
            Start Recording
          </ActionButton>
          
          <ActionButton
            onClick={handleStopRecording}
            color="orange"
            disabled={!isRecording || loading}
            icon={<StopCircle className="w-5 h-5" />}
          >
            Stop Recording
          </ActionButton>
          
          <ActionButton
            onClick={handleLoadVideo}
            color="blue"
            disabled={loading}
            icon={<FileVideo className="w-5 h-5" />}
          >
            Load Video
          </ActionButton>
          
          <ActionButton
            onClick={stopStreaming}
            color="gray"
            disabled={(!stream && !imageUrl) || loading}
            icon={<StopCircle className="w-5 h-5" />}
          >
            Stop All
          </ActionButton>
        </div>
        
        {/* Status indicators */}
        <div className="bg-secondary rounded-lg p-4 shadow-md">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${model ? 'bg-app-green' : 'bg-app-red'}`}></div>
              <span>Model: {model ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${stream ? 'bg-app-green' : 'bg-app-red'}`}></div>
              <span>Camera: {stream ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${detectionActive ? 'bg-app-green' : 'bg-app-red'}`}></div>
              <span>Detection: {detectionActive ? 'Running' : 'Stopped'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isRecording ? 'recording-pulse' : 'bg-app-red'}`}></div>
              <span>Recording: {isRecording ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          
          {detections.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Detected Objects ({detections.length})</h3>
              <div className="max-h-32 overflow-y-auto bg-black bg-opacity-20 rounded p-2">
                {detections.map((detection, i) => (
                  <div key={i} className="mb-1 text-sm">
                    <span className="font-bold">{detection.class}</span>
                    <span className="text-muted-foreground"> - Confidence: {(detection.score * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleVideoFileSelected}
        accept="video/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Index;
