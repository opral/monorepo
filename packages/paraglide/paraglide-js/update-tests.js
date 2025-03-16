import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to replace the old project definition with the new one
function updateFile(filePath) {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Add the import for newProject if it's not already there
  if (!content.includes('import { newProject }')) {
    content = content.replace(
      /import { createParaglide } from ["']\.\.\/create-paraglide\.js["'];/,
      'import { createParaglide } from "../create-paraglide.js";\nimport { newProject } from "@inlang/sdk";'
    );
  }

  // Replace all baseLocale/locales with project
  content = content.replace(
    /const \w+ = await createParaglide\(\{\s*baseLocale: ["']([^"']+)["'],\s*locales: \[([^\]]+)\](,\s*compilerOptions: \{[^}]+\})?\s*\}\);/g,
    (match, baseLocale, locales, compilerOptions) => {
      return `const runtime = await createParaglide({\n\tproject: await newProject({\n\t\tsettings: {\n\t\t\tbaseLocale: "${baseLocale}",\n\t\t\tlocales: [${locales}],\n\t\t}\n\t})${compilerOptions || ''}\n});`;
    }
  );

  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Get all test files
const testDir = path.join(__dirname, 'src', 'compiler');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (
      file.endsWith('.test.ts') &&
      file !== 'create-paraglide.test.ts' &&
      file !== 'assert-is-locale.test.ts' &&
      file !== 'extract-locale-from-cookie.test.ts' &&
      file !== 'create-paraglide-module.test.ts'
    ) {
      // Check if the file contains createParaglide with baseLocale
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('baseLocale:') && content.includes('createParaglide')) {
        updateFile(filePath);
      }
    }
  }
}

processDirectory(testDir);