/** @jsx jsxt */

import { describe, it, expect } from 'vitest';
import { createTestEditor, roundtripMarkdown, normalizeMarkdown, deserializeMarkdown } from './test-helpers';
import { jsxt } from '@udecode/plate-test-utils';

// This is necessary for JSX to work
jsxt;

describe('Markdown-Plate-Fork Plugin Edge Cases', () => {
  const editor = createTestEditor();

  it('should handle empty documents', () => {
    const markdown = '';
    const result = roundtripMarkdown(editor, markdown);
    expect(result).toBe('');
  });

  it('should handle documents with only whitespace', () => {
    const markdown = '   \n   \n   ';
    const result = roundtripMarkdown(editor, markdown);
    // Might normalize to empty string or preserve some whitespace
    expect(normalizeMarkdown(result)).toBe('');
  });

  it('should handle backslash escapes properly', () => {
    const markdown = 'This has escaped \\*asterisks\\* and \\`backticks\\`';
    const result = roundtripMarkdown(editor, markdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });

  it('should handle URLs and special characters in links', () => {
    const markdown = '[Link with &special= ?chars](https://example.com?q=test&param=value)';
    
    // For the input, we expect a link node with the complex URL
    const expected = (
      <fragment>
        <hp>
          <ha url="https://example.com?q=test&param=value">Link with &special= ?chars</ha>
        </hp>
      </fragment>
    );
    
    // Check deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
    
    // Also check the roundtrip preserves the URL
    const result = roundtripMarkdown(editor, markdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });

  it('should handle nested formatting correctly', () => {
    const markdown = '**Bold text with *italic* inside**';
    
    // The expected structure with nested formatting
    const expected = (
      <fragment>
        <hp>
          <htext bold>Bold text with </htext>
          <htext bold italic>italic</htext>
          <htext bold> inside</htext>
        </hp>
      </fragment>
    );
    
    // Test deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
    
    // Test roundtrip
    const result = roundtripMarkdown(editor, markdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });

  it('should handle code blocks with triple backticks in content', () => {
    const markdown = '```\nCode with ``` inside\n```';
    
    // We're expecting a code block with the content intact
    const expected = (
      <fragment>
        <hcodeblock>
          <hcodeline>Code with ``` inside</hcodeline>
        </hcodeblock>
      </fragment>
    );
    
    // Check that we got a proper code block
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
  });

  it('should handle deeply nested lists', () => {
    const markdown = '- Level 1\n  - Level 2\n    - Level 3';
    
    // The expected structure with nested lists
    const expected = (
      <fragment>
        <hul>
          <hli>
            <hlic>Level 1</hlic>
            <hul>
              <hli>
                <hlic>Level 2</hlic>
                <hul>
                  <hli>
                    <hlic>Level 3</hlic>
                  </hli>
                </hul>
              </hli>
            </hul>
          </hli>
        </hul>
      </fragment>
    );
    
    // Test deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
  });

  it('should handle tables', () => {
    const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`;
    
    // The expected structure for a table
    const expected = (
      <fragment>
        <htable>
          <htr>
            <hth>
              <hp>Header 1</hp>
            </hth>
            <hth>
              <hp>Header 2</hp>
            </hth>
          </htr>
          <htr>
            <htd>
              <hp>Cell 1</hp>
            </htd>
            <htd>
              <hp>Cell 2</hp>
            </htd>
          </htr>
        </htable>
      </fragment>
    );
    
    // Test deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
  });

  it('should handle HTML content', () => {
    const markdown = '<div>HTML block</div>';
    
    // The exact output might vary based on the implementation
    // Just check that deserialization doesn't crash
    const result = deserializeMarkdown(editor, markdown);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});