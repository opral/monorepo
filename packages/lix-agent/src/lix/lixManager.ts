import { openLixInMemory, newLixFile, toBlob, Lix } from '@lix-js/sdk';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import { PluginLoader } from './pluginLoader.js';

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
  private pluginLoader: PluginLoader;
  
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
      
      // Load default plugins
      const plugins = await this.pluginLoader.getAllPlugins();
      
      this.lix = await openLixInMemory({ 
        blob: resolvedBlob,
        providePlugins: plugins
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
      
      // Determine which plugins to load based on file extension and content
      const plugins = await this.determinePluginsForFile(filePath, fileBuffer);
      
      // Open the Lix file with the appropriate plugins
      this.lix = await openLixInMemory({ 
        blob,
        providePlugins: plugins
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
   * Determine which plugins to load based on file content and path
   */
  private async determinePluginsForFile(filePath: string, fileBuffer: Buffer): Promise<any[]> {
    const extension = path.extname(filePath).toLowerCase();
    
    try {
      // First, try to get plugins based on file extension
      if (extension) {
        const extensionPlugin = await this.pluginLoader.getPluginForExtension(extension);
        if (extensionPlugin) {
          return [extensionPlugin];
        }
      }
      
      // If we don't have a plugin for this extension, 
      // it's better to load all available plugins as a fallback
      
      // If we get here, load all plugins as a fallback
      return await this.pluginLoader.getAllPlugins();
    } catch (error) {
      console.warn(`Error determining plugins for ${filePath}:`, error);
      // Fall back to loading all plugins in case of error
      return await this.pluginLoader.getAllPlugins();
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
  
  /**
   * Get information about loaded plugins
   */
  async getPluginsInfo(): Promise<{
    available: Array<{
      key: string;
      supports: string;
      active?: boolean;
    }>;
    count: number;
  }> {
    // Get all available plugins
    const availablePlugins = await this.pluginLoader.getAllPlugins();
    
    // Information about all available plugins
    const pluginsInfo = availablePlugins.map(plugin => ({
      key: plugin.key,
      supports: plugin.detectChangesGlob || 'unknown',
      active: false // Default to inactive
    }));
    
    // If a Lix file is open, check what plugins are active
    if (this.lix) {
      try {
        // In the actual LIX API, we would need to access active plugins somehow
        // For now, let's assume all plugins are active if they're available
        // and the Lix file is open
        pluginsInfo.forEach(plugin => {
          plugin.active = true;
        });
      } catch (error) {
        console.warn('Could not determine active plugins:', error);
      }
    }
    
    return {
      available: pluginsInfo,
      count: pluginsInfo.length
    };
  }
  
  /**
   * Get plugins for a file extension
   */
  async getPluginsForExtension(extension: string): Promise<any[]> {
    return [await this.pluginLoader.getPluginForExtension(extension)].filter(Boolean);
  }
}