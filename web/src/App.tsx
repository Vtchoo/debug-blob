import { useState, useEffect } from 'react'
import axios from 'axios'
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

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

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

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      console.log('Starting upload...', selectedFile);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

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
        </div>

        {selectedFile && (
          <div className="file-info">
            <h3>Selected File:</h3>
            <p>📄 Name: {selectedFile.name}</p>
            <p>📏 Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            <p>🏷️ Type: {selectedFile.type}</p>
            
            <button 
              onClick={uploadFile} 
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
