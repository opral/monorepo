/**
 * Tests for the query API implementation using mocks
 */

import { describe, expect, it } from "vitest";
import { MockFileRepository } from "./file-repository.mock.js";
import { MockKeyValueRepository } from "./key-value-repository.mock.js";
import { MockQueryManager } from "./query-manager.mock.js";

describe("Query API", () => {
  describe("FileRepository", () => {
    it("should create and retrieve a file", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      const fileData = new TextEncoder().encode("# Test Content");
      
      // Act
      const file = await fileRepo.create({
        path: "/test.md",
        data: fileData,
        metadata: { test: true },
      });
      
      // Assert
      expect(file.path).toBe("/test.md");
      expect(file.metadata).toEqual({ test: true });
      
      // Retrieve the file
      const retrievedFile = await fileRepo.getByPath("/test.md");
      expect(retrievedFile).not.toBeNull();
      expect(retrievedFile?.id).toBe(file.id);
      expect(retrievedFile?.data).toEqual(fileData);
    });
    
    it("should update a file", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      const originalData = new TextEncoder().encode("# Original Content");
      const file = await fileRepo.create({
        path: "/test.md",
        data: originalData,
      });
      
      // Act
      const updatedData = new TextEncoder().encode("# Updated Content");
      const updated = await fileRepo.update(file.id, {
        data: updatedData,
      });
      
      // Assert
      expect(updated.id).toBe(file.id);
      expect(updated.data).toEqual(updatedData);
    });
    
    it("should create or update a file", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      const originalData = new TextEncoder().encode("# Original Content");
      
      // Act - Create
      const file = await fileRepo.createOrUpdate("/test.md", originalData);
      
      // Assert
      expect(file.path).toBe("/test.md");
      expect(file.data).toEqual(originalData);
      
      // Act - Update
      const updatedData = new TextEncoder().encode("# Updated Content");
      const updated = await fileRepo.createOrUpdate("/test.md", updatedData);
      
      // Assert
      expect(updated.id).toBe(file.id);
      expect(updated.data).toEqual(updatedData);
    });
    
    it("should find files by extension", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      
      await fileRepo.create({
        path: "/test1.md",
        data: new TextEncoder().encode("# Test 1"),
      });
      
      await fileRepo.create({
        path: "/test2.md",
        data: new TextEncoder().encode("# Test 2"),
      });
      
      await fileRepo.create({
        path: "/data.json",
        data: new TextEncoder().encode("{}"),
      });
      
      // Act
      const mdFiles = await fileRepo.findByExtension("md");
      
      // Assert
      expect(mdFiles.length).toBe(2);
      expect(mdFiles.map(f => f.path).sort()).toEqual(["/test1.md", "/test2.md"]);
    });
    
    it("should find files in a directory", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      
      await fileRepo.create({
        path: "/docs/readme.md",
        data: new TextEncoder().encode("# Readme"),
      });
      
      await fileRepo.create({
        path: "/docs/guide.md",
        data: new TextEncoder().encode("# Guide"),
      });
      
      await fileRepo.create({
        path: "/src/index.ts",
        data: new TextEncoder().encode("// Code"),
      });
      
      // Act
      const docsFiles = await fileRepo.findInDirectory("/docs");
      
      // Assert
      expect(docsFiles.length).toBe(2);
      expect(docsFiles.map(f => f.path).sort()).toEqual(["/docs/guide.md", "/docs/readme.md"]);
    });
    
    it("should delete a file by path", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      
      await fileRepo.create({
        path: "/to-delete.md",
        data: new TextEncoder().encode("# Will be deleted"),
      });
      
      // Verify it exists
      let file = await fileRepo.getByPath("/to-delete.md");
      expect(file).not.toBeNull();
      
      // Act
      await fileRepo.deleteByPath("/to-delete.md");
      
      // Assert
      file = await fileRepo.getByPath("/to-delete.md");
      expect(file).toBeNull();
    });
    
    it("should validate directory paths", async () => {
      // Arrange
      const fileRepo = new MockFileRepository();
      
      // Act & Assert
      await expect(fileRepo.ensureDirectoryExists("/valid/path")).resolves.toBe("/valid/path/");
      await expect(fileRepo.ensureDirectoryExists("/valid/path/")).resolves.toBe("/valid/path/");
      await expect(fileRepo.ensureDirectoryExists("invalid/path")).rejects.toThrow("must start with a slash");
    });
  });
  
  describe("KeyValueRepository", () => {
    it("should set and get a value", async () => {
      // Arrange
      const kvRepo = new MockKeyValueRepository();
      
      // Act
      await kvRepo.set("test:key", "test value");
      const value = await kvRepo.get("test:key");
      
      // Assert
      expect(value).toBe("test value");
    });
    
    it("should update an existing value", async () => {
      // Arrange
      const kvRepo = new MockKeyValueRepository();
      
      // Act
      await kvRepo.set("test:key", "original value");
      await kvRepo.set("test:key", "updated value");
      const value = await kvRepo.get("test:key");
      
      // Assert
      expect(value).toBe("updated value");
    });
    
    it("should return null for non-existent keys", async () => {
      // Arrange
      const kvRepo = new MockKeyValueRepository();
      
      // Act
      const value = await kvRepo.get("non:existent");
      
      // Assert
      expect(value).toBeNull();
    });
    
    it("should find entries by key prefix", async () => {
      // Arrange
      const kvRepo = new MockKeyValueRepository();
      
      await kvRepo.set("user:prefs:theme", "dark");
      await kvRepo.set("user:prefs:fontSize", 14);
      await kvRepo.set("app:version", "1.0.0");
      
      // Act
      const userPrefs = await kvRepo.findByKeyPrefix("user:prefs:");
      
      // Assert
      expect(userPrefs.length).toBe(2);
      expect(userPrefs.map(kv => kv.key).sort()).toEqual(["user:prefs:fontSize", "user:prefs:theme"]);
    });
    
    it("should delete a key", async () => {
      // Arrange
      const kvRepo = new MockKeyValueRepository();
      
      await kvRepo.set("to-delete", "delete me");
      
      // Verify it exists
      let value = await kvRepo.get("to-delete");
      expect(value).toBe("delete me");
      
      // Act
      await kvRepo.deleteKey("to-delete");
      
      // Assert
      value = await kvRepo.get("to-delete");
      expect(value).toBeNull();
    });
    
    it("should throw when getting non-existent key with getOrThrow", async () => {
      // Arrange
      const kvRepo = new MockKeyValueRepository();
      
      // Act & Assert
      await expect(kvRepo.getOrThrow("missing:key")).rejects.toThrow("not found");
    });
  });
  
  describe("QueryManager", () => {
    it("should provide access to entity queries", () => {
      // Arrange & Act
      const queryManager = new MockQueryManager();
      
      // Assert
      expect(queryManager.files).toBeInstanceOf(MockFileRepository);
      expect(queryManager.keyValues).toBeInstanceOf(MockKeyValueRepository);
    });
    
    it("should allow interoperability between entities", async () => {
      // Arrange
      const queryManager = new MockQueryManager();
      
      // Act - Create a file
      const file = await queryManager.files.create({
        path: "/test.md",
        data: new TextEncoder().encode("# Test"),
      });
      
      // Store file reference in key-value store
      await queryManager.keyValues.set("file:id", file.id);
      
      // Retrieve file using the stored ID
      const fileId = await queryManager.keyValues.get("file:id");
      const retrievedFile = await queryManager.files.findOne(fileId);
      
      // Assert
      expect(retrievedFile).not.toBeNull();
      expect(retrievedFile?.id).toBe(file.id);
    });
  });
});