import { expect, test, describe } from "vitest";
import { DiffComponent } from "./diff.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";

describe("HTML Diff Integration", () => {
  test("converts markdown entity to HTML", () => {
    const component = new DiffComponent();
    
    const entity = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'Hello world' }],
      mdast_id: 'para-123'
    };
    
    const html = component['convertEntityToHtml'](entity, 'para-123');
    
    expect(html).toContain('data-diff-key="para-123"');
    expect(html).toContain('Hello world');
  });

  test("handles entity with direct value property", () => {
    const component = new DiffComponent();
    
    const entity = {
      type: 'paragraph',
      value: 'Direct value content',
      mdast_id: 'para-456'
    };
    
    const html = component['convertEntityToHtml'](entity, 'para-456');
    
    expect(html).toContain('data-diff-key="para-456"');
    expect(html).toContain('Direct value content');
    expect(html).toBe('<p data-diff-key="para-456">Direct value content</p>');
  });
  
  test("generates HTML diff for entities", () => {
    const component = new DiffComponent();
    
    const mockDiffs: UiDiffComponentProps["diffs"] = [
      {
        entity_id: "para-1",
        schema_key: "lix_plugin_md_node",
        plugin_key: "lix_plugin_md",
        snapshot_content_before: {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Original text' }],
          mdast_id: 'para-1'
        },
        snapshot_content_after: {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Updated text' }],
          mdast_id: 'para-1'
        }
      }
    ];
    
    const diffHtml = component['generateHtmlDiff'](mockDiffs);
    
    expect(diffHtml).toBeDefined();
    expect(diffHtml).toContain('Updated text');
  });
  
  test("handles entities without content", () => {
    const component = new DiffComponent();
    
    const entity = null;
    const html = component['convertEntityToHtml'](entity, 'test-id');
    
    expect(html).toBe('');
  });
  
  test("adds data-diff-key to HTML elements", () => {
    const component = new DiffComponent();
    
    const htmlInput = '<p>Test content</p>';
    const result = component['addDataDiffKey'](htmlInput, 'test-123');
    
    expect(result).toContain('data-diff-key="test-123"');
    expect(result).toContain('Test content');
  });
  
  test("handles HTML with existing attributes", () => {
    const component = new DiffComponent();
    
    const htmlInput = '<p class="test-class">Test content</p>';
    const result = component['addDataDiffKey'](htmlInput, 'test-123');
    
    expect(result).toContain('data-diff-key="test-123"');
    expect(result).toContain('class="test-class"');
    expect(result).toContain('Test content');
  });
});