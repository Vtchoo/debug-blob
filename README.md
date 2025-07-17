# Blob Upload Debug Tool

A comprehensive debugging setup for investigating blob upload issues in Android + Chrome environments.

## Project Structure

```
debug-blob/
├── web/          # Vite React TypeScript client
├── server/       # Fastify Node.js server
└── README.md     # This file
```

## Features

### Web Application (React + Vite)
- 🔍 Server health check display
- 📁 File selection from device
- 🌐 Blob creation from URL
- 📤 FormData upload with axios
- 🐛 Detailed error logging and display
- 📊 Upload result visualization

### Server (Fastify + Node.js)
- 🏥 Health check endpoint (`/health`)
- 📤 File upload endpoint (`/upload`)
- 🔄 CORS support for development
- 📝 Comprehensive logging
- 💾 File storage with metadata

## Quick Start

### 1. Start the Server
```bash
cd server
npm install
npm run dev
```
Server will run on: http://localhost:3000

### 2. Start the Web App
```bash
cd web
npm install
cp .env.example .env
# Edit .env file with your server IP address
npm run dev
```
Web app will run on: http://localhost:5173

**Environment Configuration:**
- Copy `.env.example` to `.env` in the web directory
- Update `VITE_SERVER_HOST` with your server's IP address (use `localhost` for local development)
- Update `VITE_SERVER_PORT` if using a different port (default: 3000)

### 3. Test the Setup
1. Open http://localhost:5173 in your browser
2. Click "Check Server Health" to verify connectivity
3. Select a file or create a blob from URL
4. Click "Upload File" to test the upload process

## Debugging Network Errors

This tool is specifically designed to help debug the "Network Error" that occurs with axios during blob uploads in Android + Chrome. 

### Common Issues to Investigate:
- CORS configuration problems
- Request timeout issues
- FormData serialization problems
- Mobile browser specific bugs
- Network connectivity issues

### Debugging Steps:
1. Check browser console for detailed error messages
2. Monitor Network tab in developer tools
3. Review server logs for request processing
4. Test with different blob sources and file types
5. Compare behavior between desktop and mobile browsers

## Server Endpoints

### Health Check
- **GET** `/health`
- Returns server status and timestamp

### File Upload
- **POST** `/upload`
- Accepts multipart/form-data with file field
- Returns upload success/failure with file metadata

## Development

### Dependencies

**Web App:**
- React 18 with TypeScript
- Vite for fast development
- Axios for HTTP requests

**Server:**
- Fastify for fast HTTP server
- @fastify/multipart for file upload handling
- @fastify/cors for CORS support

### Scripts

**Server:**
- `npm start` - Production server
- `npm run dev` - Development with nodemon

**Web App:**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Troubleshooting

### Server Not Starting
- Check if port 3000 is available
- Verify all dependencies are installed
- Check server logs for specific errors

### CORS Issues
- Ensure web app is running on localhost:5173
- Verify CORS configuration in server/index.js
- Check browser console for CORS errors

### Upload Failures
- Check file size limits (current: 100MB)
- Verify file type is supported
- Monitor network requests in browser dev tools
- Check server logs for processing errors

## Contributing

When debugging issues:
1. Enable detailed logging in both client and server
2. Test with minimal file sizes first
3. Use browser dev tools to monitor network requests
4. Document specific error messages and conditions
5. Test across different browsers and devices
