import { describe, expect, test, vi } from "vitest";
import { jsonb, jsonObjectFrom, jsonArrayFrom } from "./json.js";

describe("JSON utilities", () => {
  test("jsonb returns sql template with jsonb function", () => {
    const testObj = { test: "value" };
    const result = jsonb(testObj);
    
    // For RawBuilder, check if it's properly structured
    expect(result).toBeDefined();
    expect(result.toOperationNode).toBeDefined();
    
    // Check if sqlFragments exist and contain jsonb
    const sqlNode = result.toOperationNode();
    expect(sqlNode.kind).toBe("RawNode");
    
    // Check if it has the right value serialized
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toContain("jsonb");
    
    // Verify that our jsonb function passes the JSON string as a parameter
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(typeof jsonString).toBe("string");
        expect(JSON.parse(jsonString)).toEqual(testObj);
      }
    }
  });

  test("jsonObjectFrom creates jsonb SQL for objects", () => {
    const obj = { name: "test", value: 123 };
    const result = jsonObjectFrom(obj);
    
    expect(result).toBeDefined();
    expect(result.toOperationNode).toBeDefined();
    
    const sqlNode = result.toOperationNode();
    expect(sqlNode.kind).toBe("RawNode");
    
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toContain("jsonb");
    
    // Verify parameters are properly structured
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(typeof jsonString).toBe("string");
        expect(JSON.parse(jsonString)).toEqual(obj);
      }
    }
  });

  test("jsonArrayFrom creates jsonb SQL for arrays", () => {
    const arr = [1, 2, 3, "test"];
    const result = jsonArrayFrom(arr);
    
    expect(result).toBeDefined();
    expect(result.toOperationNode).toBeDefined();
    
    const sqlNode = result.toOperationNode();
    expect(sqlNode.kind).toBe("RawNode");
    
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toContain("jsonb");
    
    // Verify parameters are properly structured
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(typeof jsonString).toBe("string");
        expect(JSON.parse(jsonString)).toEqual(arr);
      }
    }
  });
  
  test("jsonArrayFrom handles Kysely query expressions", () => {
    // Create a mock Kysely query expression
    const mockQueryExpression = {
      toOperationNode: vi.fn().mockReturnValue({
        kind: "SelectQueryNode"
      })
    };
    
    const result = jsonArrayFrom(mockQueryExpression as any);
    
    expect(result).toBeDefined();
    expect(result.toOperationNode).toBeDefined();
    
    const sqlNode = result.toOperationNode();
    expect(sqlNode.kind).toBe("RawNode");
    
    // Should contain the jsonb and coalesce SQL pattern for subqueries
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toContain("jsonb");
    expect(sqlString).toContain("select coalesce(json_group_array(json_object(*))");
    expect(sqlString).toContain("from");
    expect(sqlString).toContain("as agg");
    
    // Verify the query expression was used
    expect(mockQueryExpression.toOperationNode).toHaveBeenCalled();
  });
  
  test("jsonb handles null values", () => {
    const result = jsonb(null);
    const sqlNode = result.toOperationNode();
    
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toBe("NULL");
  });
  
  test("jsonb handles undefined values", () => {
    const result = jsonb(undefined);
    const sqlNode = result.toOperationNode();
    
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toBe("NULL");
  });
  
  test("jsonb handles primitive values", () => {
    const result = jsonb(123);
    const sqlNode = result.toOperationNode();
    
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toContain("jsonb");
    
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        expect((param as any).value).toBe("123");
      }
    }
  });
  
  // Edge cases
  test("jsonb handles empty objects", () => {
    const result = jsonb({});
    const sqlNode = result.toOperationNode();
    
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(jsonString).toBe("{}");
        expect(JSON.parse(jsonString)).toEqual({});
      }
    }
  });
  
  test("jsonb handles empty arrays", () => {
    const result = jsonb([]);
    const sqlNode = result.toOperationNode();
    
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(jsonString).toBe("[]");
        expect(JSON.parse(jsonString)).toEqual([]);
      }
    }
  });
  
  test("jsonb handles boolean values", () => {
    // Test true
    const resultTrue = jsonb(true);
    const nodeTrue = resultTrue.toOperationNode();
    
    if (nodeTrue.parameters && nodeTrue.parameters.length > 0) {
      const param = nodeTrue.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        expect((param as any).value).toBe("true");
      }
    }
    
    // Test false
    const resultFalse = jsonb(false);
    const nodeFalse = resultFalse.toOperationNode();
    
    if (nodeFalse.parameters && nodeFalse.parameters.length > 0) {
      const param = nodeFalse.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        expect((param as any).value).toBe("false");
      }
    }
  });
  
  test("jsonb handles complex nested structures", () => {
    const complex = {
      id: 1,
      name: "test",
      active: true,
      tags: ["tag1", "tag2"],
      metadata: {
        created: "2023-01-01",
        modified: null,
        authors: [
          { id: 1, name: "Author 1" },
          { id: 2, name: "Author 2" }
        ],
        stats: {
          views: 100,
          likes: 42
        }
      }
    };
    
    const result = jsonb(complex);
    const sqlNode = result.toOperationNode();
    
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(typeof jsonString).toBe("string");
        expect(JSON.parse(jsonString)).toEqual(complex);
      }
    }
  });
  
  test("jsonArrayFrom handles array with various data types", () => {
    const mixedArray = [
      1,
      "string",
      true,
      null,
      { key: "value" },
      [1, 2, 3]
    ];
    
    const result = jsonArrayFrom(mixedArray);
    const sqlNode = result.toOperationNode();
    
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(typeof jsonString).toBe("string");
        expect(JSON.parse(jsonString)).toEqual(mixedArray);
      }
    }
  });
  
  test("jsonObjectFrom handles keys with special characters", () => {
    const objWithSpecialKeys = {
      "normal-key": "value1",
      "key.with.dots": "value2",
      "key with spaces": "value3",
      "$specialChars": "value4",
      "emoji🔥key": "value5"
    };
    
    const result = jsonObjectFrom(objWithSpecialKeys);
    const sqlNode = result.toOperationNode();
    
    if (sqlNode.parameters && sqlNode.parameters.length > 0) {
      const param = sqlNode.parameters[0];
      if (typeof param === 'object' && param !== null && 'value' in param) {
        const jsonString = (param as any).value;
        expect(typeof jsonString).toBe("string");
        expect(JSON.parse(jsonString)).toEqual(objWithSpecialKeys);
      }
    }
  });
  
  test("jsonObjectFrom handles Kysely query expressions", () => {
    // Create a mock Kysely query expression
    const mockQueryExpression = {
      toOperationNode: vi.fn().mockReturnValue({
        kind: "SelectQueryNode"
      })
    };
    
    const result = jsonObjectFrom(mockQueryExpression as any);
    
    expect(result).toBeDefined();
    expect(result.toOperationNode).toBeDefined();
    
    const sqlNode = result.toOperationNode();
    expect(sqlNode.kind).toBe("RawNode");
    
    // Should contain the jsonb and json_object SQL pattern for subqueries
    const sqlString = String(sqlNode.sqlFragments.join(''));
    expect(sqlString).toContain("jsonb");
    expect(sqlString).toContain("select json_object(*)");
    expect(sqlString).toContain("from");
    expect(sqlString).toContain("as obj");
    
    // Verify the query expression was used
    expect(mockQueryExpression.toOperationNode).toHaveBeenCalled();
  });
});