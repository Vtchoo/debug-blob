<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Blob Upload Debug Project

This project is designed to debug blob upload issues specifically in Android + Chrome environments.

## Project Structure
- `web/` - Vite React TypeScript application with axios for HTTP requests
- `server/` - Fastify Node.js server with multipart file upload support

## Key Components
- React app with blob upload functionality using FormData and axios
- Fastify server with CORS support and multipart file handling
- Health check endpoint for server status verification
- Comprehensive error handling and logging for debugging

## Development Focus
- Reproduce Network Error from axios during blob uploads
- Debug and analyze blob upload failures
- Test different blob sources (file input, URL-generated blobs)
- Monitor network requests and server responses
- Identify and fix Android + Chrome specific issues

## Usage
1. Start the server: `cd server && npm run dev`
2. Start the web app: `cd web && npm run dev`
3. Use the health check to verify server connectivity
4. Test blob uploads with different file types and sources
5. Monitor browser console and server logs for errors
