import { Kysely } from 'kysely';
import { sql } from 'kysely';
import { openLixInMemory, newLixFile, toBlob, Lix } from '@lix-js/sdk';
import path from 'path';
import fs from 'fs/promises';
import { PluginLoader } from './pluginLoader.js';
import { EventEmitter } from 'events';

export interface LixTransactionResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
}

// Define events for the LixManager
export declare interface LixManager {
  on(event: 'fileOpened', listener: (filePath: string) => void): this;
  on(event: 'fileSaved', listener: (filePath: string) => void): this;
  on(event: 'fileClosed', listener: () => void): this;
  on(event: 'contentChanged', listener: (filePath: string) => void): this;
  on(event: 'fileAdded', listener: (filePath: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

export class LixManager extends EventEmitter {
  private lix: Lix | null = null;
  private filePath: string | null = null;
  private pluginLoader: PluginLoader;
  private isBackupActive: boolean = false;
  private lastBackupTime: number = 0;
  private backupFrequency: number = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    super();
    this.pluginLoader = new PluginLoader();
  }
  
  /**
   * Get the current file path
   */
  getCurrentFilePath(): string | null {
    return this.filePath;
  }
  
  /**
   * Check if a Lix is currently open
   */
  isOpen(): boolean {
    return this.lix !== null;
  }
  
  /**
   * Enable automatic backups
   */
  enableAutoBackup(frequencyMs = 5 * 60 * 1000): void {
    this.isBackupActive = true;
    this.backupFrequency = frequencyMs;
  }
  
  /**
   * Disable automatic backups
   */
  disableAutoBackup(): void {
    this.isBackupActive = false;
  }
  
  /**
   * Create a backup of the current Lix file
   */
  async createBackup(): Promise<string | null> {
    if (!this.lix || !this.filePath) {
      return null;
    }
    
    try {
      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:T\-Z\.]/g, '');
      const dir = path.dirname(this.filePath);
      const base = path.basename(this.filePath);
      const backupPath = path.join(dir, `.${base}.backup.${timestamp}`);
      
      // Convert to blob and save
      const blob = await toBlob({ lix: this.lix });
      // Convert Blob to Buffer for fs.writeFile
      const buffer = Buffer.from(await blob.arrayBuffer());
      await fs.writeFile(backupPath, buffer);
      
      this.lastBackupTime = Date.now();
      return backupPath;
    } catch (error) {
      this.emit('error', new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`));
      return null;
    }
  }
  
  /**
   * Check if backup should be created and create it if needed
   */
  private async checkBackup(): Promise<void> {
    if (!this.isBackupActive || !this.filePath) return;
    
    const now = Date.now();
    if (now - this.lastBackupTime >= this.backupFrequency) {
      await this.createBackup();
    }
  }
  
  /**
   * Create a new empty Lix file in memory
   */
  async createNew(): Promise<void> {
    try {
      // Create a new empty Lix file
      const blob = await newLixFile();
      
      // Open it with default plugins
      const plugins = await this.pluginLoader.loadDefaultPlugins();
      
      // If blob is a Promise<Blob>, make sure to resolve it
      const resolvedBlob = blob instanceof Promise ? await blob : blob;
      
      this.lix = await openLixInMemory({ 
        blob: resolvedBlob, 
        providePlugins: plugins 
      });
      
      this.filePath = null;
      this.lastBackupTime = Date.now();
    } catch (error) {
      const err = new Error(`Failed to create new Lix file: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('error', err);
      throw err;
    }
  }
  
  /**
   * Open an existing Lix file from disk
   */
  async openFile(filePath: string): Promise<void> {
    try {
      // Ensure the file exists
      await fs.access(filePath);
      
      // Read the file as a buffer
      const fileBuffer = await fs.readFile(filePath);
      
      // Create a Blob from the buffer
      const blob = new Blob([fileBuffer]);
      
      // Determine which plugins we need based on the file extension
      // In a real implementation, we'd scan the Lix file to see what files it contains
      // For now, load default plugins
      const plugins = await this.pluginLoader.loadDefaultPlugins();
      
      // Open the Lix file
      this.lix = await openLixInMemory({ 
        blob, 
        providePlugins: plugins 
      });
      
      this.filePath = filePath;
      this.lastBackupTime = Date.now();
      
      this.emit('fileOpened', filePath);
    } catch (error) {
      const err = new Error(`Failed to open Lix file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('error', err);
      throw err;
    }
  }
  
  /**
   * Save the current Lix to disk
   */
  async saveFile(filePath?: string): Promise<void> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    // Use provided path or current path
    const targetPath = filePath || this.filePath;
    
    if (!targetPath) {
      throw new Error('No file path specified for save operation');
    }
    
    try {
      // Convert the in-memory Lix to a blob
      const blob = await toBlob({ lix: this.lix });
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      
      // Convert Blob to Buffer for fs.writeFile
      const buffer = Buffer.from(await blob.arrayBuffer());
      
      // Write the file
      await fs.writeFile(targetPath, buffer);
      
      // Update the current file path
      this.filePath = targetPath;
      this.lastBackupTime = Date.now();
      
      this.emit('fileSaved', targetPath);
    } catch (error) {
      const err = new Error(`Failed to save Lix file to ${targetPath}: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('error', err);
      throw err;
    }
  }
  
  /**
   * Execute a raw SQL query on the Lix database
   * This is a placeholder - in a real implementation, we would use Kysely to construct a proper query
   */
  async executeQuery(query: string): Promise<any> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    try {
      // This is a simplified implementation that doesn't try to use raw SQL directly
      // In a real world scenario, we'd parse the query and use Kysely's query builder appropriately
      console.warn('Raw SQL execution is not fully implemented. Using placeholder.');
      
      // Return a mock result for now
      return [{
        success: true,
        message: 'Query execution simulated (not actually executed): ' + query
      }];
    } catch (error) {
      throw new Error(`SQL query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a function in a transaction
   */
  async executeTransaction<T>(
    transactionFn: (transaction: any) => Promise<T>
  ): Promise<LixTransactionResult<T>> {
    if (!this.lix) {
      return { success: false, error: new Error('No Lix file is currently open') };
    }
    
    try {
      // Execute the transaction function with the database instance
      const result = await this.lix.db.transaction().execute(async (trx: any) => {
        return await transactionFn(trx);
      });
      
      return { success: true, result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Get the schema information from the database
   */
  getDatabaseSchema(): string {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    // This is a placeholder - in a real implementation we'd query the schema
    // For now, return a hardcoded schema based on Lix docs and examples
    return `
Tables:
- file (id, path, data)
- change (id, file_id, snapshot_id, timestamp)
- snapshot (id, file_id, content)
- version (id, name, parent_version_id)
- key_value (key, value)

Relationships:
- change.file_id -> file.id
- change.snapshot_id -> snapshot.id
- snapshot.file_id -> file.id
`;
  }
  
  /**
   * Get a list of all files tracked in this Lix
   */
  async getTrackedFilePaths(): Promise<string[]> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    try {
      // Query the file table to get paths
      const result = await this.lix.db
        .selectFrom('file')
        .select(['path'])
        .execute();
      
      return result.map(row => row.path as string);
    } catch (error) {
      throw new Error(`Failed to get tracked files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the content of a file
   */
  async getFileContent(filePath: string): Promise<string | null> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    try {
      // Query the file table to get the file data
      const result = await this.lix.db
        .selectFrom('file')
        .select(['data'])
        .where('path', '=', filePath)
        .execute();
      
      if (result.length === 0) {
        return null;
      }
      
      // Assuming data is stored as text/string in the database
      // In a real implementation, we might need to handle binary data differently
      const data = result[0].data;
      
      // Check if data is a Buffer or string
      if (Buffer.isBuffer(data)) {
        return data.toString('utf8');
      } else if (typeof data === 'string') {
        return data;
      } else {
        return JSON.stringify(data);
      }
    } catch (error) {
      throw new Error(`Failed to get file content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update the content of a tracked file
   */
  async updateFileContent(filePath: string, content: string): Promise<void> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    try {
      // Convert content to Buffer
      const contentBuffer = Buffer.from(content, 'utf8');
      
      // Update the file data in the database
      await this.lix.db
        .updateTable('file')
        .set({ data: contentBuffer })
        .where('path', '=', filePath)
        .execute();
      
      // Create a backup if needed
      await this.checkBackup();
      
      this.emit('contentChanged', filePath);
    } catch (error) {
      const err = new Error(`Failed to update file content: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('error', err);
      throw err;
    }
  }
  
  /**
   * Add a new file to track
   */
  async addFile(filePath: string, content: string): Promise<void> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    try {
      // Convert content to Buffer
      const contentBuffer = Buffer.from(content, 'utf8');
      
      // Insert the new file
      await this.lix.db
        .insertInto('file')
        .values({ 
          path: filePath, 
          data: contentBuffer 
        })
        .execute();
      
      // Create a backup if needed
      await this.checkBackup();
      
      this.emit('fileAdded', filePath);
    } catch (error) {
      const err = new Error(`Failed to add file: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('error', err);
      throw err;
    }
  }
  
  /**
   * Get information about changes to a file
   */
  async getFileChanges(filePath: string): Promise<any[]> {
    if (!this.lix) {
      throw new Error('No Lix file is currently open');
    }
    
    try {
      // First get the file id
      const fileResult = await this.lix.db
        .selectFrom('file')
        .select('id')  // Select as single column, not array
        .where('path', '=', filePath)
        .execute();
      
      if (fileResult.length === 0) {
        return [];
      }
      
      const fileId = fileResult[0].id;
      
      // Now get the changes for this file - select each column individually
      const changesResult = await this.lix.db
        .selectFrom('change')
        .select('id')
        .select('snapshot_id')
        // Note: If timestamp is not a direct column, we may need to adapt this
        // This is a simplification assuming there is a timestamp column
        .select('created_at as timestamp')  // Assuming created_at is the actual column
        .where('file_id', '=', fileId)
        .orderBy('created_at', 'desc')  // Order by created_at instead of timestamp
        .execute();
      
      return changesResult;
    } catch (error) {
      throw new Error(`Failed to get file changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Close the currently open Lix file
   */
  async close(): Promise<void> {
    this.lix = null;
    this.filePath = null;
    this.emit('fileClosed');
  }
}