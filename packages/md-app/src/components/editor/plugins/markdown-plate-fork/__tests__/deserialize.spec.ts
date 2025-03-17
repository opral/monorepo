import { describe, it, expect } from 'vitest';
import { createTestEditor, deserializeMarkdown } from './test-helpers';

describe('Markdown-Plate-Fork Plugin Deserialization Tests (Array Format)', () => {
  const editor = createTestEditor();

  it('should deserialize empty paragraphs correctly', () => {
    const input = '\n\nLine 1\n\nLine 2\n\n\nLine 3\n\n';
    
    const expected = [
      {
        children: [{ text: '' }],
        type: 'p',
      },
      {
        children: [{ text: '' }],
        type: 'p',
      },
      {
        children: [{ text: 'Line 1' }],
        type: 'p',
      },
      {
        children: [{ text: '' }],
        type: 'p',
      },
      {
        children: [{ text: 'Line 2' }],
        type: 'p',
      },
      {
        children: [{ text: '' }],
        type: 'p',
      },
      {
        children: [{ text: '' }],
        type: 'p',
      },
      {
        children: [{ text: 'Line 3' }],
        type: 'p',
      },
      {
        children: [{ text: '' }],
        type: 'p',
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize headings correctly', () => {
    const input = '# Heading 1\n## Heading 2\n### Heading 3';
    
    const expected = [
      {
        type: 'h1',
        children: [{ text: 'Heading 1' }],
      },
      {
        type: 'h2',
        children: [{ text: 'Heading 2' }],
      },
      {
        type: 'h3',
        children: [{ text: 'Heading 3' }],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize paragraphs correctly', () => {
    const input = 'This is paragraph 1.\n\nThis is paragraph 2.';
    
    const expected = [
      {
        type: 'p',
        children: [{ text: 'This is paragraph 1.' }],
      },
      {
        type: 'p',
        children: [{ text: 'This is paragraph 2.' }],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize formatting correctly', () => {
    const input = 'This has **bold** and *italic* text.';
    
    const expected = [
      {
        type: 'p',
        children: [
          { text: 'This has ' },
          { text: 'bold', bold: true },
          { text: ' and ' },
          { text: 'italic', italic: true },
          { text: ' text.' },
        ],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize links correctly', () => {
    const input = '[Example link](https://example.com)';
    
    const expected = [
      {
        type: 'p',
        children: [
          {
            type: 'a',
            url: 'https://example.com',
            children: [{ text: 'Example link' }],
          },
        ],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize blockquotes correctly', () => {
    const input = '> This is a blockquote';
    
    const expected = [
      {
        type: 'blockquote',
        children: [{ text: 'This is a blockquote' }],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize code blocks correctly', () => {
    const input = '```javascript\nconst x = 1;\n```';
    
    const expected = [
      {
        type: 'code_block',
        lang: 'javascript',
        children: [
          {
            type: 'code_line',
            children: [{ text: 'const x = 1;' }],
          },
        ],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });

  it('should deserialize lists correctly', () => {
    const input = '- Item 1\n- Item 2';
    
    const expected = [
      {
        type: 'ul',
        children: [
          {
            type: 'li',
            children: [
              {
                type: 'lic',
                children: [{ text: 'Item 1' }],
              },
            ],
          },
          {
            type: 'li',
            children: [
              {
                type: 'lic',
                children: [{ text: 'Item 2' }],
              },
            ],
          },
        ],
      },
    ];
    
    expect(deserializeMarkdown(editor, input)).toEqual(expected);
  });
});