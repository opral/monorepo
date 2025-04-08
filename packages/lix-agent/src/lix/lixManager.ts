import { openLixInMemory, newLixFile, toBlob, Lix } from '@lix-js/sdk';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

// Define events for the LixManager
export declare interface LixManager {
  on(event: 'fileOpened', listener: (filePath: string) => void): this;
  on(event: 'fileSaved', listener: (filePath: string) => void): this;
  on(event: 'fileClosed', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

export class LixManager extends EventEmitter {
  private lix: Lix | null = null;
  private filePath: string | null = null;
  
  constructor() {
    super();
  }
  
  /**
   * Get the current file path
   */
  getCurrentFilePath(): string | null {
    return this.filePath;
  }
  
  /**
   * Get direct access to the Lix object
   */
  getLixObject(): Lix | null {
    return this.lix;
  }
  
  /**
   * Check if a Lix is currently open
   */
  isOpen(): boolean {
    return this.lix !== null;
  }
  
  /**
   * Create a new empty Lix file in memory
   */
  async createNew(): Promise<void> {
    try {
      // Create a new empty Lix file
      const blob = await newLixFile();
      
      // If blob is a Promise<Blob>, make sure to resolve it
      const resolvedBlob = blob instanceof Promise ? await blob : blob;
      
      this.lix = await openLixInMemory({ 
        blob: resolvedBlob
      });
      
      this.filePath = null;
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
      
      // Open the Lix file
      this.lix = await openLixInMemory({ 
        blob
      });
      
      this.filePath = filePath;
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
      
      this.emit('fileSaved', targetPath);
    } catch (error) {
      const err = new Error(`Failed to save Lix file to ${targetPath}: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('error', err);
      throw err;
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