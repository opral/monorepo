/**
 * Validation utilities for change proposals
 */

/**
 * Validate that JSON content is valid
 */
export function validateJson(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Basic validation for CSV format
 * Checks that all rows have the same number of columns
 */
export function validateCsv(content: string): boolean {
  try {
    const trimmedContent = content.trim();
    
    // Empty CSV is invalid
    if (trimmedContent === '') {
      return false;
    }
    
    const lines = trimmedContent.split('\n');
    
    if (lines.length === 0) {
      return false;
    }
    
    // Count commas in the first line to get column count
    const commasInFirstLine = (lines[0].match(/,/g) || []).length;
    
    // Check that all lines have the same number of commas
    for (let i = 1; i < lines.length; i++) {
      const commasInLine = (lines[i].match(/,/g) || []).length;
      if (commasInLine !== commasInFirstLine) {
        return false;
      }
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validate Markdown - not much to validate, but check for basic structure
 */
export function validateMarkdown(content: string): boolean {
  // Markdown is very forgiving, but we can check basic things
  return content.trim().length > 0;
}

/**
 * Basic XML validation - check for well-formedness
 */
export function validateXml(content: string): boolean {
  try {
    // Check for matching opening/closing tags
    const openTags: string[] = [];
    const tagRegex = /<\/?([^\s>]+)(\s[^>]*)?>|<!--|-->/g;
    let match;
    let inComment = false;
    
    while ((match = tagRegex.exec(content)) !== null) {
      const tag = match[0];
      
      // Handle comments
      if (tag === '<!--') {
        inComment = true;
        continue;
      }
      if (tag === '-->' && inComment) {
        inComment = false;
        continue;
      }
      if (inComment) continue;
      
      // Handle self-closing tags
      if (tag.match(/\/>/)) continue;
      
      // Handle opening tags
      if (!tag.startsWith('</')) {
        const tagName = match[1];
        openTags.push(tagName);
      } 
      // Handle closing tags
      else {
        const tagName = match[1];
        const lastOpenTag = openTags.pop();
        
        if (lastOpenTag !== tagName) {
          return false; // Mismatched tags
        }
      }
    }
    
    // All tags should be closed
    return openTags.length === 0 && !inComment;
  } catch (e) {
    return false;
  }
}

/**
 * Validate YAML content
 * Basic structure check - more thorough validation would require a YAML parser
 */
export function validateYaml(content: string): boolean {
  try {
    // Check for common YAML formatting issues
    const lines = content.split('\n');
    
    // Check for missing colons in key-value pairs
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      // Check key-value formatting
      if (!trimmed.includes(':') && 
          !trimmed.startsWith('-') && 
          !trimmed.startsWith(' ') &&
          !trimmed.startsWith('\t')) {
        return false;
      }
      
      // Check for tab indentation (YAML forbids tabs)
      if (line.startsWith('\t')) {
        return false;
      }
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validate content based on file type
 */
export function validateContent(filePath: string, content: string): boolean {
  // Ensure we have content
  if (!content || content.trim() === '') {
    return false;
  }
  
  // Get file extension
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  // Check file type and perform specific validations
  switch (extension) {
    case 'json':
      return validateJson(content);
    
    case 'csv':
      return validateCsv(content);
      
    case 'md':
    case 'markdown':
      return validateMarkdown(content);
      
    case 'xml':
    case 'html':
    case 'svg':
      return validateXml(content);
      
    case 'yaml':
    case 'yml':
      return validateYaml(content);
    
    // For other file types, assume they're valid
    default:
      return true;
  }
}