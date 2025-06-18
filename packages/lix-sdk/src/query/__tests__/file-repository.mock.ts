/**
 * Mock implementation of FileRepository for testing
 */

import { MockEntityRepository } from "./entity-repository.mock.js";
import type { LixFile, NewLixFile, LixFileUpdate } from "../../file/schema.js";

export class MockFileRepository extends MockEntityRepository<LixFile, NewLixFile, LixFileUpdate> {
  constructor() {
    super("file");
  }
  
  async getByPath(filePath: string): Promise<LixFile | null> {
    const files = await this.findAll();
    return files.find(file => file.path === filePath) || null;
  }
  
  async getByPathOrThrow(filePath: string): Promise<LixFile> {
    const file = await this.getByPath(filePath);
    if (!file) {
      throw new Error(`File with path ${filePath} not found`);
    }
    return file;
  }
  
  async findInDirectory(directoryPath: string): Promise<LixFile[]> {
    const normalizedPath = directoryPath.endsWith("/") 
      ? directoryPath 
      : `${directoryPath}/`;
    
    const files = await this.findAll();
    return files.filter(file => file.path.startsWith(normalizedPath));
  }
  
  async findByExtension(extension: string): Promise<LixFile[]> {
    const ext = extension.startsWith(".") ? extension : `.${extension}`;
    
    const files = await this.findAll();
    return files.filter(file => file.path.endsWith(ext));
  }
  
  async createOrUpdate(filePath: string, data: Uint8Array, metadata: Record<string, any> | null = null): Promise<LixFile> {
    const existingFile = await this.getByPath(filePath);
    
    if (existingFile) {
      return this.update(existingFile.id, { data, metadata });
    } else {
      return this.create({
        path: filePath,
        data,
        metadata,
      });
    }
  }
  
  async deleteByPath(filePath: string): Promise<void> {
    const file = await this.getByPath(filePath);
    if (file) {
      await this.delete(file.id);
    }
  }
  
  async ensureDirectoryExists(directoryPath: string): Promise<string> {
    const normalizedPath = directoryPath.endsWith("/") 
      ? directoryPath 
      : `${directoryPath}/`;
      
    if (!normalizedPath.startsWith("/")) {
      throw new Error("Directory path must start with a slash (/)");
    }
    
    return normalizedPath;
  }
}