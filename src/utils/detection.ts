import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

let model: cocossd.ObjectDetection | null = null;

export type Detection = {
  bbox: [number, number, number, number];
  class: string;
  score: number;
};

export async function loadModel(): Promise<cocossd.ObjectDetection> {
  if (model) return model;
  
  try {
    console.log('Initializing TensorFlow.js...');
    await tf.ready();
    console.log('TensorFlow.js initialized successfully');
    
    // Load the COCO-SSD model
    console.log('Loading COCO-SSD model...');
    model = await cocossd.load();
    console.log('Model loaded successfully');
    
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw new Error(`Failed to load the detection model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function detectObjects(
  imageElement: HTMLImageElement | HTMLVideoElement
): Promise<Detection[]> {
  if (!model) {
    model = await loadModel();
  }

  try {
    const predictions = await model.detect(imageElement);
    return predictions.map(prediction => ({
      bbox: prediction.bbox as [number, number, number, number],
      class: prediction.class,
      score: prediction.score
    }));
  } catch (error) {
    console.error('Detection error:', error);
    return [];
  }
}

export function drawDetections(
  canvasContext: CanvasRenderingContext2D,
  detections: Detection[],
  scale = 1
): void {
  detections.forEach(detection => {
    const [x, y, width, height] = detection.bbox;
    const scaledX = x * scale;
    const scaledY = y * scale;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    // Draw bounding box
    canvasContext.strokeStyle = '#00b894';
    canvasContext.lineWidth = 2;
    canvasContext.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    
    // Draw label background
    canvasContext.fillStyle = 'rgba(0, 184, 148, 0.7)';
    const textWidth = canvasContext.measureText(`${detection.class} ${Math.round(detection.score * 100)}%`).width;
    canvasContext.fillRect(scaledX, scaledY - 20, textWidth + 10, 20);
    
    // Draw label text
    canvasContext.fillStyle = '#ffffff';
    canvasContext.font = '14px Arial';
    canvasContext.fillText(
      `${detection.class} ${Math.round(detection.score * 100)}%`,
      scaledX + 5,
      scaledY - 5
    );
  });
}
