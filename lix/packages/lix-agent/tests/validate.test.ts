import { describe, it, expect } from 'vitest';
import { validateJson, validateCsv, validateMarkdown, validateXml, validateYaml, validateContent } from '../src/validate.js';

describe('Validation Functions', () => {
  describe('validateJson', () => {
    it('should validate valid JSON', () => {
      const validJson = '{"name": "test", "version": "1.0.0", "nested": {"key": "value"}}';
      expect(validateJson(validJson)).toBe(true);
    });
    
    it('should reject invalid JSON', () => {
      const invalidJson = '{"name": "test", "version": 1.0.0}'; // missing quotes
      expect(validateJson(invalidJson)).toBe(false);
    });
    
    it('should reject incomplete JSON', () => {
      const incompleteJson = '{"name": "test"';
      expect(validateJson(incompleteJson)).toBe(false);
    });
  });
  
  describe('validateCsv', () => {
    it('should validate valid CSV', () => {
      const validCsv = 'id,name,value\n1,Item 1,100\n2,Item 2,200';
      expect(validateCsv(validCsv)).toBe(true);
    });
    
    it('should reject CSV with inconsistent columns', () => {
      const invalidCsv = 'id,name,value\n1,Item 1\n2,Item 2,200,extra';
      expect(validateCsv(invalidCsv)).toBe(false);
    });
    
    it('should handle empty CSV', () => {
      expect(validateCsv('')).toBe(false);
    });
  });
  
  describe('validateMarkdown', () => {
    it('should validate any non-empty markdown', () => {
      const markdown = '# Title\n\nThis is a paragraph.';
      expect(validateMarkdown(markdown)).toBe(true);
    });
    
    it('should reject empty markdown', () => {
      expect(validateMarkdown('')).toBe(false);
      expect(validateMarkdown('   \n  ')).toBe(false);
    });
  });
  
  describe('validateXml', () => {
    it('should validate well-formed XML', () => {
      const validXml = '<root><item id="1">Value</item><item id="2">Value 2</item></root>';
      expect(validateXml(validXml)).toBe(true);
    });
    
    it('should validate XML with comments', () => {
      const xmlWithComments = '<root><!-- This is a comment --><item>Value</item></root>';
      expect(validateXml(xmlWithComments)).toBe(true);
    });
    
    it('should validate XML with self-closing tags', () => {
      const xmlWithSelfClosing = '<root><item /><item>Value</item></root>';
      expect(validateXml(xmlWithSelfClosing)).toBe(true);
    });
    
    it('should reject XML with mismatched tags', () => {
      const invalidXml = '<root><item>Value</wrongTag></root>';
      expect(validateXml(invalidXml)).toBe(false);
    });
    
    it('should reject XML with unclosed tags', () => {
      const unclosedXml = '<root><item>Value';
      expect(validateXml(unclosedXml)).toBe(false);
    });
    
    it('should reject XML with unclosed comments', () => {
      const unclosedComment = '<root><!-- Comment without end <item>Value</item></root>';
      expect(validateXml(unclosedComment)).toBe(false);
    });
  });
  
  describe('validateYaml', () => {
    it('should validate basic YAML', () => {
      const validYaml = 'name: Test\nversion: 1.0.0\narray:\n  - item1\n  - item2';
      expect(validateYaml(validYaml)).toBe(true);
    });
    
    it('should validate YAML with comments', () => {
      const yamlWithComments = '# This is a comment\nname: Test\n# Another comment\nversion: 1.0.0';
      expect(validateYaml(yamlWithComments)).toBe(true);
    });
    
    it('should reject YAML with tab indentation', () => {
      const yamlWithTabs = 'name: Test\nobject:\n\tkey: value';
      expect(validateYaml(yamlWithTabs)).toBe(false);
    });
    
    it('should reject YAML with missing colon', () => {
      const invalidYaml = 'name Test\nversion: 1.0.0';
      expect(validateYaml(invalidYaml)).toBe(false);
    });
  });
  
  describe('validateContent', () => {
    it('should validate JSON files', () => {
      expect(validateContent('test.json', '{"name": "test"}' )).toBe(true);
      expect(validateContent('test.json', 'invalid json')).toBe(false);
    });
    
    it('should validate CSV files', () => {
      expect(validateContent('test.csv', 'id,name\n1,test')).toBe(true);
      expect(validateContent('test.csv', 'id,name\n1')).toBe(false);
    });
    
    it('should validate Markdown files', () => {
      expect(validateContent('test.md', '# Title')).toBe(true);
      expect(validateContent('readme.markdown', '# Title')).toBe(true);
      expect(validateContent('test.md', '')).toBe(false);
    });
    
    it('should validate XML files', () => {
      expect(validateContent('test.xml', '<root><item /></root>')).toBe(true);
      expect(validateContent('test.html', '<html><body>Test</body></html>')).toBe(true);
      expect(validateContent('test.svg', '<svg><circle /></svg>')).toBe(true);
      expect(validateContent('test.xml', '<root><item></root>')).toBe(false);
    });
    
    it('should validate YAML files', () => {
      expect(validateContent('test.yaml', 'name: test')).toBe(true);
      expect(validateContent('test.yml', 'name: test')).toBe(true);
      expect(validateContent('test.yaml', 'name test')).toBe(false);
    });
    
    it('should pass through other file types', () => {
      expect(validateContent('test.txt', 'any content')).toBe(true);
      expect(validateContent('test.unknown', 'any content')).toBe(true);
    });
    
    it('should reject empty content for any file type', () => {
      expect(validateContent('test.json', '')).toBe(false);
      expect(validateContent('test.csv', '')).toBe(false);
      expect(validateContent('test.txt', '')).toBe(false);
    });
  });
});