const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');

// Register CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: true, // Allow all origins for network access
  credentials: true
});

// Register multipart plugin
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is healthy and ready to receive blob uploads'
  };
});

// Upload endpoint
fastify.post('/upload', async (request, reply) => {
  try {
    console.log('Upload request received');
    
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({
        error: 'No file provided'
      });
    }

    console.log('File details:', {
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file to uploads directory
    const filename = `${Date.now()}-${data.filename || 'blob-file'}`;
    const filePath = path.join(uploadsDir, filename);
    
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      data.file.pipe(writeStream);
      
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stats = fs.statSync(filePath);
    
    console.log('File uploaded successfully:', {
      filename,
      size: stats.size,
      path: filePath
    });

    return {
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename,
        size: stats.size,
        mimetype: data.mimetype,
        uploadedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return reply.code(500).send({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  console.error('Server error:', error);
  reply.code(500).send({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');
    console.log('📊 Health check: http://localhost:3000/health');
    console.log('📤 Upload endpoint: http://localhost:3000/upload');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
