/** @jsx jsxt */

import { describe, it, expect } from 'vitest';
import { createTestEditor, roundtripMarkdown, normalizeMarkdown, testCases } from './test-helpers';
import { jsxt } from '@udecode/plate-test-utils';

// This is necessary for JSX to work
jsxt;

describe('Markdown-Plate-Fork Plugin Roundtrip Tests', () => {
  const editor = createTestEditor();

  // Test for each individual feature
  it('should roundtrip headings', () => {
    const result = roundtripMarkdown(editor, testCases.heading);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.heading));
  });

  it('should roundtrip paragraphs', () => {
    const result = roundtripMarkdown(editor, testCases.paragraph);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.paragraph));
  });

  it('should roundtrip emphasis and formatting', () => {
    const result = roundtripMarkdown(editor, testCases.emphasis);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.emphasis));
  });

  it('should roundtrip lists', () => {
    const result = roundtripMarkdown(editor, testCases.lists);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.lists));
  });

  it('should roundtrip links', () => {
    const result = roundtripMarkdown(editor, testCases.links);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.links));
  });

  it('should roundtrip blockquotes', () => {
    const result = roundtripMarkdown(editor, testCases.blockquotes);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.blockquotes));
  });

  it('should roundtrip code blocks', () => {
    const result = roundtripMarkdown(editor, testCases.codeBlocks);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.codeBlocks));
  });

  it('should roundtrip horizontal rules', () => {
    const result = roundtripMarkdown(editor, testCases.horizontalRule);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(testCases.horizontalRule));
  });

  // Test for complete GFM document
  it('should successfully roundtrip a complete GFM document', async () => {
    // Combining all test cases to make a complete document
    const completeMarkdown = Object.values(testCases).join('\n\n');
    
    const result = roundtripMarkdown(editor, completeMarkdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(completeMarkdown));
  });
});