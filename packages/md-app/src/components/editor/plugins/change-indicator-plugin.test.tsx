import { NodeApi } from '@udecode/plate';
import { describe, expect, it } from 'vitest';

// Test the getBlockText function with mock Plate elements
const getBlockText = (element: any): string => {
  try {
    // Use NodeApi.string to properly extract text from Plate elements
    return NodeApi.string(element) || '';
  } catch {
    // Fallback: if element has text property directly
    if (element?.text) {
      return element.text;
    }
    // Final fallback
    return '';
  }
};

describe('getBlockText', () => {
  it('should extract text from a simple text element', () => {
    const element = {
      type: 'text',
      text: 'Hello, world!'
    };

    const result = getBlockText(element);
    console.log('Simple text element result:', result);
    expect(result).toBe('Hello, world!');
  });

  it('should extract text from a paragraph element with children', () => {
    const element = {
      type: 'p',
      children: [
        { text: 'This is ' },
        { text: 'a paragraph', bold: true },
        { text: ' with multiple text nodes.' }
      ]
    };

    const result = getBlockText(element);
    console.log('Paragraph element result:', result);
    expect(result).toBe('This is a paragraph with multiple text nodes.');
  });

  it('should handle empty elements', () => {
    const element = {
      type: 'p',
      children: []
    };

    const result = getBlockText(element);
    console.log('Empty element result:', result);
    expect(result).toBe('');
  });

  it('should handle elements with nested structure', () => {
    const element = {
      type: 'blockquote',
      children: [
        {
          type: 'p',
          children: [
            { text: 'This is a quote' }
          ]
        }
      ]
    };

    const result = getBlockText(element);
    console.log('Nested element result:', result);
    expect(result).toBe('This is a quote');
  });
});
