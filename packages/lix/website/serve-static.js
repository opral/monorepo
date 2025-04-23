import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// Maps file extensions to MIME types
const contentTypeMap = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Get URL path
  let url = req.url;
  
  console.log(`Serving request for: ${url}`);
  
  // For all routes that don't match static assets, serve index.html
  if (!url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    console.log(`Serving index.html for SPA route: ${url}`);
    // This enables client-side routing with BrowserRouter
    const indexPath = path.join(distDir, 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server error: ${err.code}`);
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
    });
    return;
  }
  
  // Construct the file path for static assets
  const resolvedFilePath = path.join(distDir, url);
  const extension = path.extname(resolvedFilePath);
  
  // For static assets, try to serve the file
  fs.readFile(resolvedFilePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end(`Server error: ${err.code}`);
      }
      return;
    }
    
    // Set the content type
    res.setHeader('Content-Type', contentTypeMap[extension] || 'text/plain');
    res.end(data);
  });
});

const port = 3006;
server.listen(port, () => {
  console.log(`\n---------------------------------------`);
  console.log(`Static server running at: http://localhost:${port}/`);
  console.log(`Try these routes:`);
  console.log(`- Home page: http://localhost:${port}/`);
  console.log(`- File Manager: http://localhost:${port}/file-manager`);
  console.log(`---------------------------------------\n`);
  console.log(`Serving files from: ${distDir}`);
});