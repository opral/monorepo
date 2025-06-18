/**
 * Tests for the QueryBuilder implementation using the mock
 */

import { describe, expect, it } from "vitest";
import { MockQueryBuilder } from "./entity-repository.mock.js";

describe("QueryBuilder", () => {
  it("should filter results with where clause", async () => {
    // Arrange
    const items = [
      { id: "1", name: "Item 1", type: "A" },
      { id: "2", name: "Item 2", type: "B" },
      { id: "3", name: "Item 3", type: "A" },
    ];
    
    const queryBuilder = new MockQueryBuilder(items);
    
    // Act
    const results = await queryBuilder
      .where("type", "=", "A")
      .execute();
    
    // Assert
    expect(results.length).toBe(2);
    expect(results.map(item => item.id).sort()).toEqual(["1", "3"]);
  });
  
  it("should apply multiple where clauses", async () => {
    // Arrange
    const items = [
      { id: "1", name: "Item 1", type: "A", active: true },
      { id: "2", name: "Item 2", type: "B", active: true },
      { id: "3", name: "Item 3", type: "A", active: false },
      { id: "4", name: "Item 4", type: "B", active: true },
    ];
    
    const queryBuilder = new MockQueryBuilder(items);
    
    // Act
    const results = await queryBuilder
      .where("type", "=", "B")
      .where("active", "=", true)
      .execute();
    
    // Assert
    expect(results.length).toBe(2);
    expect(results.map(item => item.id).sort()).toEqual(["2", "4"]);
  });
  
  it("should support string pattern matching operators", async () => {
    // Arrange
    const items = [
      { id: "1", path: "/docs/readme.md" },
      { id: "2", path: "/docs/guide.md" },
      { id: "3", path: "/src/index.ts" },
      { id: "4", path: "/src/utils.md" },
    ];
    
    const queryBuilder = new MockQueryBuilder(items);
    
    // Act - startsWith
    const docsFiles = await queryBuilder
      .where("path", "startsWith", "/docs/")
      .execute();
    
    // Assert
    expect(docsFiles.length).toBe(2);
    expect(docsFiles.map(item => item.id).sort()).toEqual(["1", "2"]);
    
    // Act - endsWith
    const mdFiles = await new MockQueryBuilder(items)
      .where("path", "endsWith", ".md")
      .execute();
    
    // Assert
    expect(mdFiles.length).toBe(3);
    expect(mdFiles.map(item => item.id).sort()).toEqual(["1", "2", "4"]);
    
    // Act - contains
    const containsDocs = await new MockQueryBuilder(items)
      .where("path", "contains", "docs")
      .execute();
    
    // Assert
    expect(containsDocs.length).toBe(2);
    expect(containsDocs.map(item => item.id).sort()).toEqual(["1", "2"]);
  });
  
  it("should sort results with orderBy", async () => {
    // Arrange
    const items = [
      { id: "3", name: "C Item" },
      { id: "1", name: "A Item" },
      { id: "2", name: "B Item" },
    ];
    
    const queryBuilder = new MockQueryBuilder(items);
    
    // Act - Ascending
    const ascResults = await queryBuilder
      .orderBy("name", "asc")
      .execute();
    
    // Assert
    expect(ascResults.map(item => item.id)).toEqual(["1", "2", "3"]);
    
    // Act - Descending
    const descResults = await new MockQueryBuilder(items)
      .orderBy("name", "desc")
      .execute();
    
    // Assert
    expect(descResults.map(item => item.id)).toEqual(["3", "2", "1"]);
  });
  
  it("should apply pagination with limit and offset", async () => {
    // Arrange
    const items = [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
      { id: "3", name: "Item 3" },
      { id: "4", name: "Item 4" },
      { id: "5", name: "Item 5" },
    ];
    
    // Act - Limit only
    const limitResults = await new MockQueryBuilder(items)
      .orderBy("id", "asc")
      .limit(3)
      .execute();
    
    // Assert
    expect(limitResults.length).toBe(3);
    expect(limitResults.map(item => item.id)).toEqual(["1", "2", "3"]);
    
    // Act - Offset only
    const offsetResults = await new MockQueryBuilder(items)
      .orderBy("id", "asc")
      .offset(2)
      .execute();
    
    // Assert
    expect(offsetResults.length).toBe(3);
    expect(offsetResults.map(item => item.id)).toEqual(["3", "4", "5"]);
    
    // Act - Limit and offset
    const paginatedResults = await new MockQueryBuilder(items)
      .orderBy("id", "asc")
      .limit(2)
      .offset(2)
      .execute();
    
    // Assert
    expect(paginatedResults.length).toBe(2);
    expect(paginatedResults.map(item => item.id)).toEqual(["3", "4"]);
  });
  
  it("should provide take first and count methods", async () => {
    // Arrange
    const items = [
      { id: "1", type: "A" },
      { id: "2", type: "B" },
      { id: "3", type: "A" },
    ];
    
    // Act - executeTakeFirst
    const first = await new MockQueryBuilder(items)
      .where("type", "=", "A")
      .orderBy("id", "asc")
      .executeTakeFirst();
    
    // Assert
    expect(first).not.toBeNull();
    expect(first?.id).toBe("1");
    
    // Act - executeTakeFirst with no results
    const noResult = await new MockQueryBuilder(items)
      .where("type", "=", "C")
      .executeTakeFirst();
    
    // Assert
    expect(noResult).toBeNull();
    
    // Act - executeCount
    const count = await new MockQueryBuilder(items)
      .where("type", "=", "A")
      .executeCount();
    
    // Assert
    expect(count).toBe(2);
  });
});