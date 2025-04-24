import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// Define all routes that should have their own HTML files
const routes = [
  '/file-manager'
];

async function prepareRoutes() {
  console.log('Preparing static HTML files for routes...');
  
  // Read the main index.html template
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: index.html not found in dist directory');
    process.exit(1);
  }
  
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  
  // For each route
  for (const route of routes) {
    // Create the directory if it doesn't exist (for nested routes)
    const dirPath = path.join(distDir, route.slice(1));
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Create the index.html file for this route
    const routeHtmlPath = path.join(dirPath, 'index.html');
    fs.writeFileSync(routeHtmlPath, indexHtml);
    
    console.log(`Created static HTML file for: ${route}`);
  }
  
  console.log('Static HTML files preparation complete!');
}

prepareRoutes().catch(error => {
  console.error('Error preparing routes:', error);
  process.exit(1);
});