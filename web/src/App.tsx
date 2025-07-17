import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useReactMediaRecorder } from 'react-media-recorder'
import './App.css'

interface HealthStatus {
  status: string;
  timestamp: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  file?: {
    filename: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  };
  error?: string;
}

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || 'localhost';
  const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '3000';
  const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

  // Ref for live preview video element
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  // Video recording hook
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error: recordingError,
    previewStream,
  } = useReactMediaRecorder({ 
    video: true,
    audio: true,
    askPermissionOnMount: true,
    onStop: (blobUrl, blob) => {
      console.log('Recording stopped, auto-uploading...', { blobUrl, blob });
      if (blob) {
        const file = new File([blob], 'recorded-video.mp4');
        setSelectedFile(file);
        setUploadResult(null);
        setUploadError(null);
        console.log('Video recording file created:', file);
        // Auto-upload the recorded video
        setTimeout(() => {
          uploadFile(file);
        }, 100);
      }
    }
  });

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
    
    // Check if we're running over HTTPS (required for camera access)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('Camera access requires HTTPS or localhost');
    }
  }, []);

  // Handle live preview stream
  useEffect(() => {
    if (liveVideoRef.current && previewStream) {
      liveVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const checkServerHealth = async () => {
    try {
      console.log('Checking server health...');
      const response = await axios.get(`${SERVER_URL}/health`);
      setHealthStatus(response.data);
      setHealthError(null);
      console.log('Server health check successful:', response.data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthError(error instanceof Error ? error.message : 'Unknown error');
      setHealthStatus(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setUploadError(null);
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const createBlobFromUrl = async (url: string): Promise<Blob> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      console.log('Blob created from URL:', {
        size: blob.size,
        type: blob.type,
        url
      });
      return blob;
    } catch (error) {
      console.error('Error creating blob from URL:', error);
      throw error;
    }
  };

  const handleBlobFromUrl = async () => {
    try {
      // Using a sample image URL - you can replace this with any URL
      const imageUrl = 'https://picsum.photos/200/300';
      const blob = await createBlobFromUrl(imageUrl);
      
      // Convert blob to File object
      const file = new File([blob], 'sample-image.png', { type: blob.type });
      setSelectedFile(file);
      setUploadResult(null);
      setUploadError(null);
      console.log('Blob file created:', file);
    } catch (error) {
      console.error('Error creating blob from URL:', error);
      setUploadError('Failed to create blob from URL: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleVideoRecording = async () => {
    if (!mediaBlobUrl) return;

    try {
      // Fetch the recorded video blob
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // Convert blob to File object
      const file = new File([blob], 'recorded-video.mp4');
      setSelectedFile(file);
      setUploadResult(null);
      setUploadError(null);
      console.log('Video recording file created:', file);
    } catch (error) {
      console.error('Error creating video file:', error);
      setUploadError('Failed to create video file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearRecording = () => {
    clearBlobUrl();
    setUploadResult(null);
    setUploadError(null);
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      console.log('Permissions granted:', stream);
      // Stop the stream after getting permissions
      stream.getTracks().forEach(track => track.stop());
      setUploadError(null);
    } catch (error) {
      console.error('Permission denied:', error);
      alert(error instanceof Error ? error.message : 'Unknown error');
      setUploadError('Camera/microphone permission denied. Please allow access and try again.');
    }
  };

  const uploadFile = async (fileToUpload?: File) => {
    const fileForUpload = fileToUpload || selectedFile;
    if (!fileForUpload) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      console.log('Starting upload...', fileForUpload);
      
      const formData = new FormData();
      formData.append('file', fileForUpload);

      console.log('FormData created, making request to:', `${SERVER_URL}/upload`);

      const response = await axios.post(`${SERVER_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      console.log('Upload successful:', response.data);
      setUploadResult(response.data);
      
    } catch (error) {
      console.error('Upload failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          setUploadError('Network Error - This is the error we need to debug! Check console for details.');
        } else if (error.response) {
          setUploadError(`Server Error (${error.response.status}): ${error.response.data?.message || error.message}`);
        } else if (error.request) {
          setUploadError('No response from server - Check if server is running');
        } else {
          setUploadError('Request setup error: ' + error.message);
        }
      } else {
        setUploadError('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <h1>🐛 Blob Upload Debug Tool</h1>
      
      {/* Health Check Section */}
      <div className="section">
        <h2>Server Health Check</h2>
        <button onClick={checkServerHealth}>Check Server Health</button>
        
        {healthStatus && (
          <div className="health-status success">
            <p>✅ Server Status: {healthStatus.status}</p>
            <p>📅 Timestamp: {healthStatus.timestamp}</p>
            <p>💬 Message: {healthStatus.message}</p>
          </div>
        )}
        
        {healthError && (
          <div className="health-status error">
            <p>❌ Health Check Failed: {healthError}</p>
            <p>Make sure the server is running on port 3000</p>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="section">
        <h2>Blob Upload Test</h2>
        
        <div className="file-selection">
          <h3>Select a file:</h3>
          <input
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.txt,.docx"
          />
          
          <div className="or-divider">OR</div>
          
          <button onClick={handleBlobFromUrl}>
            Create Blob from URL (Sample Image)
          </button>

          <div className="or-divider">OR</div>

          <div className="video-recording">
            <h3>Record Video:</h3>
            <div className="recording-controls">
              <button onClick={requestPermissions}>
                🔐 Request Camera Permission
              </button>
              
              <button 
                onClick={startRecording} 
                disabled={status === 'recording'}
                className={status === 'recording' ? 'recording' : ''}
              >
                {status === 'recording' ? '🔴 Recording...' : '📹 Start Recording'}
              </button>
              
              <button 
                onClick={stopRecording} 
                disabled={status !== 'recording'}
              >
                ⏹️ Stop Recording
              </button>
              
              {mediaBlobUrl && (
                <button onClick={clearRecording}>
                  🗑️ Clear Recording
                </button>
              )}
            </div>
            
            {recordingError && (
              <div className="recording-error">
                <p>❌ Recording Error: {recordingError}</p>
                <p>Make sure you've granted camera and microphone permissions.</p>
              </div>
            )}
            
            {/* Live Preview during recording */}
            {status === 'recording' && (
              <div className="live-preview">
                <h4>🔴 Live Recording:</h4>
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  width="300"
                  height="200"
                  style={{ 
                    marginBottom: '10px',
                    border: '2px solid #dc3545',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}
            
            {mediaBlobUrl && (
              <div className="video-preview">
                <h4>Recorded Video:</h4>
                <video 
                  src={mediaBlobUrl} 
                  controls 
                  width="300" 
                  height="200"
                  style={{ marginBottom: '10px' }}
                />
                <br />
                <button onClick={handleVideoRecording}>
                  📤 Use This Video for Upload
                </button>
                <p><small>Note: Video will auto-upload when recording stops</small></p>
              </div>
            )}
            
            <p className="recording-status">
              Status: <span className={`status-${status}`}>{status}</span>
              {status === 'idle' && ' - Click "Start Recording" to begin'}
              {status === 'recording' && ' - Recording in progress...'}
              {status === 'stopped' && ' - Recording completed'}
            </p>
            
            <div className="recording-debug">
              <p><strong>Debug Info:</strong></p>
              <p>• Protocol: {location.protocol}</p>
              <p>• Hostname: {location.hostname}</p>
              <p>• Media Devices Available: {navigator.mediaDevices ? '✅' : '❌'}</p>
              <p>• getUserMedia Available: {(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') ? '✅' : '❌'}</p>
              
              {location.protocol === 'http:' && location.hostname !== 'localhost' && (
                <div className="https-warning">
                  <p><strong>⚠️ HTTPS Required for Camera Access</strong></p>
                  <p><strong>Quick Solutions:</strong></p>
                  <p>1. <strong>Use localhost:</strong> Access via <code>http://localhost:5173</code></p>
                  <p>2. <strong>Chrome flags:</strong> Go to <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></p>
                  <p>3. <strong>Add this origin:</strong> <code>http://{location.hostname}:{location.port}</code></p>
                  <p>4. <strong>Restart Chrome</strong> after making changes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="file-info">
            <h3>Selected File:</h3>
            <p>📄 Name: {selectedFile.name}</p>
            <p>📏 Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            <p>🏷️ Type: {selectedFile.type}</p>
            
            <button 
              onClick={() => uploadFile()} 
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}

        {uploadResult && (
          <div className="upload-result success">
            <h3>✅ Upload Successful!</h3>
            <p>📁 Filename: {uploadResult.file?.filename}</p>
            <p>📏 Size: {uploadResult.file?.size} bytes</p>
            <p>🏷️ Type: {uploadResult.file?.mimetype}</p>
            <p>📅 Uploaded: {uploadResult.file?.uploadedAt}</p>
          </div>
        )}

        {uploadError && (
          <div className="upload-result error">
            <h3>❌ Upload Failed!</h3>
            <p>{uploadError}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
