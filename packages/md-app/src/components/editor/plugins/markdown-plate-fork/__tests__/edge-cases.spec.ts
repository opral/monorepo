import { describe, it, expect } from 'vitest';
import { createTestEditor, roundtripMarkdown, normalizeMarkdown, deserializeMarkdown } from './test-helpers';

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
    
    // For the input, we expect a paragraph with a link node containing the complex URL
    const expected = [
      {
        type: 'p',
        children: [
          {
            type: 'a',
            url: 'https://example.com?q=test&param=value',
            children: [{ text: 'Link with &special= ?chars' }],
          }
        ]
      }
    ];
    
    // Check deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
    
    // Also check the roundtrip preserves the URL
    const result = roundtripMarkdown(editor, markdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });

  it('should handle nested formatting correctly', () => {
    const markdown = '**Bold text with *italic* inside**';
    
    // The expected structure with nested formatting
    const expected = [
      {
        type: 'p',
        children: [
          { text: 'Bold text with ', bold: true },
          { text: 'italic', bold: true, italic: true },
          { text: ' inside', bold: true }
        ]
      }
    ];
    
    // Test deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
    
    // Test roundtrip
    const result = roundtripMarkdown(editor, markdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });

  it('should handle code blocks with triple backticks in content', () => {
    const markdown = '```\nCode with ``` inside\n```';
    
    // We're expecting a code block with the content intact
    const expected = [
      {
        type: 'code_block',
        children: [
          {
            type: 'code_line',
            children: [{ text: 'Code with ``` inside' }]
          }
        ]
      }
    ];
    
    // Check that we got a proper code block
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
  });

  it('should handle deeply nested lists', () => {
    const markdown = '- Level 1\n  - Level 2\n    - Level 3';
    
    // The expected structure with nested lists
    const expected = [
      {
        type: 'ul',
        children: [
          {
            type: 'li',
            children: [
              {
                type: 'lic',
                children: [{ text: 'Level 1' }]
              },
              {
                type: 'ul',
                children: [
                  {
                    type: 'li',
                    children: [
                      {
                        type: 'lic',
                        children: [{ text: 'Level 2' }]
                      },
                      {
                        type: 'ul',
                        children: [
                          {
                            type: 'li',
                            children: [
                              {
                                type: 'lic',
                                children: [{ text: 'Level 3' }]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
    
    // Test deserialization
    expect(deserializeMarkdown(editor, markdown)).toEqual(expected);
  });

  it('should handle tables', () => {
    const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`;
    
    // We expect a table structure
    const result = deserializeMarkdown(editor, markdown);
    
    // Check the top level structure
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('table');
    
    // Check the rows and cells
    const tableNode = result[0] as any;
    expect(tableNode.children.length).toBe(2); // Header row and data row
    
    // Header row
    const headerRow = tableNode.children[0];
    expect(headerRow.type).toBe('tr');
    expect(headerRow.children.length).toBe(2);
    expect(headerRow.children[0].type).toBe('th');
    
    // Data row
    const dataRow = tableNode.children[1];
    expect(dataRow.type).toBe('tr');
    expect(dataRow.children.length).toBe(2);
    expect(dataRow.children[0].type).toBe('td');
  });

  it('should handle HTML content', () => {
    const markdown = '<div>HTML block</div>';
    
    // The exact output might vary based on the implementation
    // Just check that deserialization doesn't crash
    const result = deserializeMarkdown(editor, markdown);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});