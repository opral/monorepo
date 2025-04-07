/**
 * Plugin loader for dynamically loading Lix plugins
 */
export class PluginLoader {
  // A mapping of file extensions to plugin packages
  private pluginMap: Record<string, string> = {
    '.json': '@lix-js/plugin-json',
    '.csv': '@lix-js/plugin-csv'
    // Add more mappings as plugins become available
  };
  
  // Cache loaded plugins to avoid loading the same one multiple times
  private loadedPlugins: Record<string, any> = {};
  
  /**
   * Load default plugins (JSON and CSV)
   */
  async loadDefaultPlugins(): Promise<any[]> {
    try {
      // For initial implementation, load JSON and CSV plugins by default
      const plugins = [];
      
      // Try to load JSON plugin
      try {
        const jsonPlugin = await this.loadPlugin('@lix-js/plugin-json');
        if (jsonPlugin) plugins.push(jsonPlugin);
      } catch (error) {
        console.warn(`Warning: JSON plugin not available: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Try to load CSV plugin
      try {
        const csvPlugin = await this.loadPlugin('@lix-js/plugin-csv');
        if (csvPlugin) plugins.push(csvPlugin);
      } catch (error) {
        console.warn(`Warning: CSV plugin not available: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      return plugins;
    } catch (error) {
      throw new Error(`Failed to load default plugins: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load plugins based on file extensions
   */
  async loadPluginsForExtensions(extensions: string[]): Promise<any[]> {
    try {
      const plugins = [];
      const packageNames = new Set<string>();
      
      // Collect unique package names for the extensions
      for (const ext of extensions) {
        const packageName = this.pluginMap[ext];
        if (packageName) {
          packageNames.add(packageName);
        }
      }
      
      // Load each unique plugin
      for (const packageName of packageNames) {
        try {
          const plugin = await this.loadPlugin(packageName);
          if (plugin) plugins.push(plugin);
        } catch (error) {
          console.warn(`Warning: Plugin ${packageName} not available: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return plugins;
    } catch (error) {
      throw new Error(`Failed to load plugins for extensions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load a specific plugin by package name
   */
  async loadPlugin(packageName: string): Promise<any> {
    // Check if plugin is already loaded
    if (this.loadedPlugins[packageName]) {
      return this.loadedPlugins[packageName];
    }
    
    try {
      // Dynamically import the plugin package
      const pluginModule = await import(packageName);
      
      // Get the plugin object
      const plugin = pluginModule.plugin;
      
      if (!plugin) {
        throw new Error(`Plugin module does not export a 'plugin' object`);
      }
      
      // Cache the plugin
      this.loadedPlugins[packageName] = plugin;
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin ${packageName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Register a new plugin mapping
   */
  registerPluginMapping(extension: string, packageName: string): void {
    this.pluginMap[extension] = packageName;
  }
  
  /**
   * Get available plugin mappings
   */
  getPluginMappings(): Record<string, string> {
    return { ...this.pluginMap };
  }
}