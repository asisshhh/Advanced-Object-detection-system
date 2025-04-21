
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  constructor() {
    this.recordedChunks = [];
  }
  
  public async startRecording(stream: MediaStream): Promise<void> {
    try {
      this.stream = stream;
      this.recordedChunks = [];
      
      // Create a MediaRecorder instance to record the stream
      const options = { mimeType: 'video/webm;codecs=vp9' };
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      // Event handler for when data is available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      // Start recording
      this.mediaRecorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording');
    }
  }
  
  public stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        try {
          // Create a single blob from all recorded chunks
          const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.recordedChunks = [];
          console.log('Recording stopped, created blob of size:', videoBlob.size);
          resolve(videoBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  public isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
  
  public saveRecording(blob: Blob, filename: string = 'recording.webm'): void {
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
