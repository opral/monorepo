import type { Lix } from "../lix/open-lix.js";
import { EntityRepository } from "./entity-repository.js";
import { LixFileSchema, type LixFile, type NewLixFile, type LixFileUpdate } from "../file/schema.js";
import path from "path";

/**
 * FileRepository provides a simplified API for file operations
 */
export class FileRepository extends EntityRepository<LixFile, NewLixFile, LixFileUpdate> {
  constructor(lix: Lix) {
    super(lix, LixFileSchema, "file");
  }

  /**
   * Get a file by its path
   */
  async getByPath(filePath: string): Promise<LixFile | null> {
    return this.query()
      .where("path", "=", filePath)
      .executeTakeFirst();
  }

  /**
   * Get a file by its path or throw if not found
   */
  async getByPathOrThrow(filePath: string): Promise<LixFile> {
    const file = await this.getByPath(filePath);
    if (!file) {
      throw new Error(`File with path ${filePath} not found`);
    }
    return file;
  }

  /**
   * Find files in a directory
   */
  async findInDirectory(directoryPath: string): Promise<LixFile[]> {
    // Ensure directory path ends with a slash
    const normalizedPath = directoryPath.endsWith("/") 
      ? directoryPath 
      : `${directoryPath}/`;
    
    return this.query()
      .where("path", "startsWith", normalizedPath)
      .execute();
  }

  /**
   * Find files by extension
   */
  async findByExtension(extension: string): Promise<LixFile[]> {
    // Remove the dot if it was included
    const ext = extension.startsWith(".") ? extension : `.${extension}`;
    
    return this.query()
      .where("path", "endsWith", ext)
      .execute();
  }

  /**
   * Create or update a file with the given path and content
   */
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
  
  /**
   * Delete a file by its path
   */
  async deleteByPath(filePath: string): Promise<void> {
    const file = await this.getByPath(filePath);
    if (file) {
      await this.delete(file.id);
    }
  }
  
  /**
   * Create a directory structure by ensuring all parent directories exist
   * @note This doesn't actually create directories in the DB, but rather returns the directory path
   */
  async ensureDirectoryExists(directoryPath: string): Promise<string> {
    // Normalize directory path to end with a slash
    const normalizedPath = directoryPath.endsWith("/") 
      ? directoryPath 
      : `${directoryPath}/`;
      
    // Directory existence in Lix is implicit - no directories need to be created
    // but we validate the path
    if (!normalizedPath.startsWith("/")) {
      throw new Error("Directory path must start with a slash (/)");
    }
    
    return normalizedPath;
  }
}