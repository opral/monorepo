import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
  // Ensure the output directory exists
  fs.ensureDirSync(path.resolve(__dirname, 'dist'));

  // Read the index.html template
  const template = fs.readFileSync(
    path.resolve(__dirname, 'dist/index.html'),
    'utf-8'
  );

  // Process template to inject environment variables
  const posthogToken = process.env.PUBLIC_LIX_POSTHOG_TOKEN || '';
  const processedTemplate = template
    .replace('%%PUBLIC_LIX_POSTHOG_TOKEN%%', posthogToken);

  // Define our routes - we'll manually list all routes to prerender
  const routesToRender = [
    '/',
    '/file-manager'
  ];

  // For each route
  for (const url of routesToRender) {
    try {
      // Create a minimal HTML page with the base content
      let html = processedTemplate;
      
      // Add minimal placeholder - this is not server-side rendering
      // We just need something in the root div for the client to attach to
      html = html.replace('<!--app-html-->', '');
      
      // Fix asset paths for nested routes
      if (url !== '/') {
        const depth = url.split('/').filter(Boolean).length;
        const prefix = '../'.repeat(depth);
        
        // Adjust paths to be relative
        html = html
          .replace(/src="\.\//g, `src="${prefix}`)
          .replace(/href="\.\//g, `href="${prefix}`)
          // Also fix any image paths that don't already have the ./ prefix
          .replace(/src="images\//g, `src="${prefix}images/`);
      }
      
      // Create the output path
      let outputPath;
      if (url === '/') {
        outputPath = path.resolve(__dirname, 'dist/index.html');
      } else {
        // Create directory if it doesn't exist
        const dirPath = path.resolve(__dirname, 'dist', url.slice(1));
        fs.ensureDirSync(dirPath);
        outputPath = path.resolve(dirPath, 'index.html');
      }
      
      // Write the file
      fs.writeFileSync(outputPath, html);
      
      console.log(`Pre-rendered: ${url} -> ${outputPath}`);
    } catch (error) {
      console.error(`Error pre-rendering ${url}:`, error);
    }
  }

  console.log('Pre-rendering complete!');
}

await prerender();