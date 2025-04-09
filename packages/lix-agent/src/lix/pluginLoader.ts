import { LixPlugin } from '@lix-js/sdk';
import path from 'path';

/**
 * Plugin Loader for Lix
 * 
 * Loads plugins for different file types (CSV, JSON, etc.)
 * Simplifies the process of importing and using plugins with Lix
 */
export class PluginLoader {
  private loadedPlugins: Map<string, LixPlugin> = new Map();
  
  /**
   * Get all known plugins
   * This is the main method used when initializing Lix
   */
  async getAllPlugins(): Promise<LixPlugin[]> {
    const plugins: LixPlugin[] = [];
    
    // Load CSV plugin
    try {
      const csvModule = await import('@lix-js/plugin-csv');
      if (csvModule && csvModule.plugin) {
        plugins.push(csvModule.plugin);
        this.loadedPlugins.set('.csv', csvModule.plugin);
      }
    } catch (error) {
      console.warn('Failed to load CSV plugin:', error);
    }
    
    // Load JSON plugin
    try {
      const jsonModule = await import('@lix-js/plugin-json');
      if (jsonModule && jsonModule.plugin) {
        plugins.push(jsonModule.plugin);
        this.loadedPlugins.set('.json', jsonModule.plugin);
      }
    } catch (error) {
      console.warn('Failed to load JSON plugin:', error);
    }
    
    return plugins;
  }
  
  /**
   * Get plugins for a specific file extension
   */
  async getPluginForExtension(extension: string): Promise<LixPlugin | null> {
    const normalizedExt = extension.toLowerCase().startsWith('.') 
      ? extension.toLowerCase() 
      : `.${extension.toLowerCase()}`;
    
    // Check if already loaded
    if (this.loadedPlugins.has(normalizedExt)) {
      return this.loadedPlugins.get(normalizedExt) || null;
    }
    
    // Load plugin based on extension
    if (normalizedExt === '.csv') {
      try {
        const csvModule = await import('@lix-js/plugin-csv');
        if (csvModule && csvModule.plugin) {
          this.loadedPlugins.set('.csv', csvModule.plugin);
          return csvModule.plugin;
        }
      } catch (error) {
        console.warn('Failed to load CSV plugin:', error);
      }
    } else if (normalizedExt === '.json') {
      try {
        const jsonModule = await import('@lix-js/plugin-json');
        if (jsonModule && jsonModule.plugin) {
          this.loadedPlugins.set('.json', jsonModule.plugin);
          return jsonModule.plugin;
        }
      } catch (error) {
        console.warn('Failed to load JSON plugin:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Get plugins for a specific set of file paths
   */
  async getPluginsForFiles(filePaths: string[]): Promise<LixPlugin[]> {
    const plugins: LixPlugin[] = [];
    const extensions = new Set<string>();
    
    // Extract extensions from file paths
    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext) {
        extensions.add(ext);
      }
    }
    
    // Load plugins for each extension
    for (const ext of extensions) {
      const plugin = await this.getPluginForExtension(ext);
      if (plugin && !plugins.includes(plugin)) {
        plugins.push(plugin);
      }
    }
    
    return plugins;
  }
  
  /**
   * Get information about available plugins
   */
  async getPluginsInfo(): Promise<{
    available: Array<{
      key: string;
      supports: string;
      active?: boolean;
    }>;
    count: number;
  }> {
    const plugins = await this.getAllPlugins();
    
    const pluginsInfo = plugins.map(plugin => ({
      key: plugin.key,
      supports: plugin.detectChangesGlob || 'unknown',
      active: true
    }));
    
    return {
      available: pluginsInfo,
      count: pluginsInfo.length
    };
  }
}