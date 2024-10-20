// tests/UI5Parser.test.ts
import { describe, it, expect } from "vitest";
import { parse } from "./messageReferenceMatchers.js";

describe("UI5 Parser", () => {
  it("parses i18n brace expressions correctly", () => {
    const sourceCode = "{i18n>exampleKey}";
    const result = parse(sourceCode);
    expect(result).toEqual([
      {
        messageId: "exampleKey",
        position: {
          start: { line: 1, character: 7 },
          end: { line: 1, character: 17 },
        },
      },
    ]);
  });

  it("parses getResourceBundle expressions correctly", () => {
    const sourceCode = 'getResourceBundle().getText("exampleKey")';
    const result = parse(sourceCode);
    expect(result).toEqual([
      {
        messageId: "exampleKey",
        position: {
          start: { line: 1, character: 30 },
          end: { line: 1, character: 40 },
        },
      },
    ]);
  });

  it("parses double brace expressions correctly", () => {
    const sourceCode = "{{exampleKey}}";
    const result = parse(sourceCode);
    expect(result).toEqual([
      {
        messageId: "exampleKey",
        position: {
          start: { line: 1, character: 3 },
          end: { line: 1, character: 13 },
        },
      },
    ]);
  });

  // parse multiple expressions with different quotes
  it("parses multiple different expressions correctly", () => {
    const sourceCode = `{i18n>key1} getResourceBundle().getText('key2') {{key3}}`;
    const result = parse(sourceCode);
    expect(result.length).toBe(3);
    expect(result).toEqual([
      {
        messageId: "key1",
        position: {
          start: { line: 1, character: 7 },
          end: { line: 1, character: 11 },
        },
      },
      {
        messageId: "key2",
        position: {
          start: { line: 1, character: 42 },
          end: { line: 1, character: 46 },
        },
      },
      {
        messageId: "key3",
        position: {
          start: { line: 1, character: 51 },
          end: { line: 1, character: 55 },
        },
      },
    ]);
  });

  it("parses multiple different expressions correctly", () => {
    const sourceCode = `
		import thisCode from "thisCode"
		
		// some code comment
		const helloWorld = {i18n>key1}
		
		// antoher whitespace
		getResourceBundle().getText("key2") 
		
		<span>{{key3}}</span>`;
    const result = parse(sourceCode);
    expect(result.length).toBe(3);
    expect(result).toEqual([
      {
        messageId: "key1",
        position: {
          start: { line: 5, character: 28 },
          end: { line: 5, character: 32 },
        },
      },
      {
        messageId: "key2",
        position: {
          start: { line: 8, character: 32 },
          end: { line: 8, character: 36 },
        },
      },
      {
        messageId: "key3",
        position: {
          start: { line: 10, character: 11 },
          end: { line: 10, character: 15 },
        },
      },
    ]);
  });

  it("handles input with no matches", () => {
    const sourceCode = "Hello, world!";
    const result = parse(sourceCode);
    expect(result).toEqual([]);
  });

  it("ignores incorrect formats", () => {
    const sourceCode = '{i18n>noEnd getResourceBundle.getText("missingParen)';
    const result = parse(sourceCode);
    expect(result).toEqual([]);
  });
});
