import type { Change, Lix, Version } from "@lix-js/sdk";
import { InspectorUI } from "./components/inspector-ui.js";
import { LixInspector, LixInspectorOptions, InspectorEvent } from "./inspector.js";

interface InspectorState {
  selectedTable: string;
  tableData: Record<string, any[]>;
  changes: Change[];
  versions: Version[];
  events: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
  snapshots: Array<{
    timestamp: number;
    state: any;
  }>;
  metrics: {
    operations: Record<string, {
      count: number;
      totalTime: number;
      avgTime: number;
      lastExecuted: number;
    }>;
    queries: Array<{
      sql: string;
      duration: number;
      timestamp: number;
    }>;
    memory: {
      databaseSize: number;
      tableCount: number;
      totalRowCount: number;
      lastUpdated: number;
    };
    timing: {
      refreshTime: number[];
      avgRefreshTime: number;
    };
  };
}

export class LixInspectorImpl implements LixInspector {
  private lix: Lix;
  private options: Required<LixInspectorOptions>;
  private state: InspectorState;
  private ui: InspectorUI | null = null;
  private miniUI: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private refreshInterval: number | null = null;
  private eventListeners: Map<InspectorEvent, Array<(data: any) => void>> = new Map();
  private isTracking: boolean = false;
  private isExpanded: boolean = false;
  
  constructor(lix: Lix, options?: LixInspectorOptions) {
    this.lix = lix;
    
    // Set default options
    this.options = {
      autoRefreshInterval: options?.autoRefreshInterval ?? 1000,
      maxHistorySize: options?.maxHistorySize ?? 50,
      theme: options?.theme ?? "light",
      position: options?.position ?? "bottom-right",
      autoAttach: options?.autoAttach ?? true,
    };
    
    // Initialize state
    this.state = {
      selectedTable: "change",
      tableData: {},
      changes: [],
      versions: [],
      events: [],
      snapshots: [],
      metrics: {
        operations: {},
        queries: [],
        memory: {
          databaseSize: 0,
          tableCount: 0,
          totalRowCount: 0,
          lastUpdated: Date.now()
        },
        timing: {
          refreshTime: [],
          avgRefreshTime: 0
        }
      }
    };
    
    // Auto-attach to body if option is enabled
    if (this.options.autoAttach && typeof document !== 'undefined') {
      // We're in a browser environment, add to document body
      this.createMiniInspector();
    }
  }
  
  /**
   * Creates a draggable mini-inspector that expands when clicked
   */
  private createMiniInspector(): void {
    // Create container for mini-inspector
    const miniInspector = document.createElement('div');
    miniInspector.className = 'lix-inspector-mini';
    miniInspector.style.position = 'fixed';
    
    // Position the mini-inspector based on options
    switch (this.options.position) {
      case 'top-left':
        miniInspector.style.top = '20px';
        miniInspector.style.left = '20px';
        break;
      case 'top-right':
        miniInspector.style.top = '20px';
        miniInspector.style.right = '20px';
        break;
      case 'bottom-left':
        miniInspector.style.bottom = '20px';
        miniInspector.style.left = '20px';
        break;
      case 'bottom-right':
      default:
        miniInspector.style.bottom = '20px';
        miniInspector.style.right = '20px';
        break;
    }
    
    miniInspector.style.width = '50px';
    miniInspector.style.height = '50px';
    miniInspector.style.backgroundColor = '#4a90e2';
    miniInspector.style.borderRadius = '50%';
    miniInspector.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    miniInspector.style.display = 'flex';
    miniInspector.style.alignItems = 'center';
    miniInspector.style.justifyContent = 'center';
    miniInspector.style.color = 'white';
    miniInspector.style.fontSize = '20px';
    miniInspector.style.cursor = 'pointer';
    miniInspector.style.zIndex = '9999';
    miniInspector.style.transition = 'all 0.3s ease';
    miniInspector.innerHTML = '<span style="font-family: sans-serif; font-weight: bold;">Lix</span>';
    
    // Make it draggable
    this.makeDraggable(miniInspector);
    
    // Add click handler to expand it
    miniInspector.addEventListener('click', () => {
      this.toggleInspector();
    });
    
    // Add notification dot for changes
    const notificationDot = document.createElement('div');
    notificationDot.className = 'lix-inspector-notification';
    notificationDot.style.position = 'absolute';
    notificationDot.style.top = '0';
    notificationDot.style.right = '0';
    notificationDot.style.width = '12px';
    notificationDot.style.height = '12px';
    notificationDot.style.backgroundColor = '#ff5252';
    notificationDot.style.borderRadius = '50%';
    notificationDot.style.display = 'none'; // Hidden by default
    
    miniInspector.appendChild(notificationDot);
    
    // Add to document body
    document.body.appendChild(miniInspector);
    this.miniUI = miniInspector;
    
    // Create main container (initially hidden)
    const container = document.createElement('div');
    container.className = 'lix-inspector-container';
    container.style.position = 'fixed';
    container.style.bottom = '80px';
    container.style.right = '20px';
    container.style.width = '800px';
    container.style.height = '500px';
    container.style.backgroundColor = 'white';
    container.style.borderRadius = '4px';
    container.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
    container.style.zIndex = '9998';
    container.style.display = 'none'; // Initially hidden
    container.style.overflow = 'hidden';
    
    document.body.appendChild(container);
    this.mount(container);
    
    // Load initial data
    this.refresh();
    
    // Subscribe to changes to update notification dot
    this.on('change', () => {
      notificationDot.style.display = 'block';
      // Pulse animation
      notificationDot.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.5)', opacity: 0.7 },
        { transform: 'scale(1)', opacity: 1 }
      ], {
        duration: 1000,
        iterations: 2
      });
      
      // Hide after a while
      setTimeout(() => {
        notificationDot.style.display = 'none';
      }, 3000);
    });
  }
  
  /**
   * Makes an element draggable
   */
  private makeDraggable(element: HTMLElement): void {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e: MouseEvent) {
      e.preventDefault();
      // Get the mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // Call a function whenever the cursor moves
      document.onmousemove = elementDrag;
    }
    
    function elementDrag(e: MouseEvent) {
      e.preventDefault();
      // Calculate the new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // Set the element's new position
      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;
      
      // Apply boundary constraints
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      element.style.top = `${Math.max(0, Math.min(maxY, newTop))}px`;
      element.style.left = `${Math.max(0, Math.min(maxX, newLeft))}px`;
      
      // If was positioned with bottom/right, switch to top/left
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    }
    
    function closeDragElement() {
      // Stop moving when mouse button is released
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  
  /**
   * Toggles the inspector between expanded and collapsed states
   */
  private toggleInspector(): void {
    this.isExpanded = !this.isExpanded;
    
    if (this.container) {
      this.container.style.display = this.isExpanded ? 'block' : 'none';
      
      if (this.isExpanded) {
        // Animation for opening
        this.container.animate([
          { transform: 'scale(0.8)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ], {
          duration: 200,
          easing: 'ease-out',
          fill: 'forwards'
        });
        
        // Make container draggable too
        this.makeDraggable(this.container);
        
        // Refresh data when opening
        this.refresh();
        
        // Add close button if it doesn't exist
        if (!this.container.querySelector('.lix-inspector-close')) {
          const closeBtn = document.createElement('div');
          closeBtn.className = 'lix-inspector-close';
          closeBtn.style.position = 'absolute';
          closeBtn.style.top = '10px';
          closeBtn.style.right = '10px';
          closeBtn.style.width = '20px';
          closeBtn.style.height = '20px';
          closeBtn.style.display = 'flex';
          closeBtn.style.alignItems = 'center';
          closeBtn.style.justifyContent = 'center';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.color = '#999';
          closeBtn.style.fontSize = '20px';
          closeBtn.innerHTML = '×';
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleInspector();
          });
          this.container.appendChild(closeBtn);
        }
      }
    }
    
    // Update mini UI appearance
    if (this.miniUI) {
      this.miniUI.style.backgroundColor = this.isExpanded ? '#ccc' : '#4a90e2';
      this.miniUI.style.transform = this.isExpanded ? 'scale(0.9)' : 'scale(1)';
    }
  }
  
  mount(container: HTMLElement): void {
    if (this.ui) {
      this.unmount();
    }
    
    this.container = container;
    
    // Create UI
    const ui = new InspectorUI({
      lix: this.lix,
      theme: this.options.theme,
      onRefresh: () => this.refresh(),
      onTableSelect: (tableName) => this.selectTable(tableName),
      onEventFilter: (events) => this.filterEvents(events),
      data: this.state,
    });
    
    // Listen for snapshot restore events
    ui.addEventListener('restore-snapshot', (event: CustomEvent) => {
      if (event && event.detail) {
        const { snapshot, index } = event.detail;
        if (snapshot && typeof index === 'number') {
          this.restoreSnapshot(snapshot, index);
        }
      }
    });
    
    this.ui = ui;
    
    // Append to container
    container.appendChild(ui);
    
    // Initial data load
    this.refresh();
    
    // Start auto-refresh if enabled
    if (this.options.autoRefreshInterval > 0) {
      this.startTracking();
    }
  }
  
  unmount(): void {
    if (this.ui && this.container) {
      this.container.removeChild(this.ui);
      this.ui = null;
    }
    
    this.stopTracking();
    
    // Clean up mini UI if it exists
    if (this.miniUI && document.body.contains(this.miniUI)) {
      document.body.removeChild(this.miniUI);
      this.miniUI = null;
    }
    
    // Clean up container if it was auto-created
    if (this.container && this.options.autoAttach && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
  
  async refresh(): Promise<void> {
    const startTime = performance.now();
    
    // Track this operation
    this.trackOperation('refresh', startTime);
    
    await Promise.all([
      this.loadTableData(),
      this.loadChanges(),
      this.loadVersions(),
      this.collectMemoryMetrics()
    ]);
    
    // Record refresh timing
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.recordRefreshTime(duration);
    
    // Update UI
    if (this.ui) {
      this.ui.updateData(this.state);
    }
    
    // Update mini UI with summary data
    this.updateMiniUI();
  }
  
  /**
   * Updates the mini UI with summary information
   */
  private updateMiniUI(): void {
    if (!this.miniUI || this.isExpanded) return;
    
    // Add tooltip with summary info
    const changeCount = this.state.changes.length;
    const versionCount = this.state.versions.length;
    
    this.miniUI.title = `Changes: ${changeCount} | Versions: ${versionCount}`;
    
    // Update content with counts
    if (changeCount > 0 || versionCount > 0) {
      this.miniUI.innerHTML = `<span style="font-size: 10px; font-family: sans-serif;">
        ${changeCount}<br>${versionCount}
      </span>`;
    } else {
      this.miniUI.innerHTML = '<span style="font-family: sans-serif; font-weight: bold;">Lix</span>';
    }
  }
  
  /**
   * Records performance data for Lix operations
   */
  private trackOperation(operationName: string, startTimeMs: number): void {
    const endTime = performance.now();
    const duration = endTime - startTimeMs;
    
    // Initialize if this is the first time seeing this operation
    if (!this.state.metrics.operations[operationName]) {
      this.state.metrics.operations[operationName] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        lastExecuted: Date.now()
      };
    }
    
    const op = this.state.metrics.operations[operationName];
    op.count++;
    op.totalTime += duration;
    op.avgTime = op.totalTime / op.count;
    op.lastExecuted = Date.now();
  }
  
  /**
   * Records SQL query execution time
   */
  private trackQuery(sql: string, durationMs: number): void {
    // Add to the queries list
    this.state.metrics.queries.unshift({
      sql,
      duration: durationMs,
      timestamp: Date.now()
    });
    
    // Keep only the most recent queries (limit to 50)
    if (this.state.metrics.queries.length > 50) {
      this.state.metrics.queries = this.state.metrics.queries.slice(0, 50);
    }
  }
  
  /**
   * Records refresh timing data
   */
  private recordRefreshTime(durationMs: number): void {
    const timing = this.state.metrics.timing;
    
    // Add to the refresh time history
    timing.refreshTime.push(durationMs);
    
    // Keep only the most recent timings (limit to 20)
    if (timing.refreshTime.length > 20) {
      timing.refreshTime = timing.refreshTime.slice(-20);
    }
    
    // Calculate average refresh time
    timing.avgRefreshTime = timing.refreshTime.reduce((sum, time) => sum + time, 0) / timing.refreshTime.length;
  }
  
  /**
   * Collects memory usage statistics
   */
  private async collectMemoryMetrics(): Promise<void> {
    try {
      // Make sure we have a valid db connection
      if (!this.lix || !this.lix.db) {
        console.error("Cannot collect metrics: No valid Lix database connection");
        return;
      }

      // Get table counts for all tables
      const tables = [
        "change", "version", "snapshot", "change_edge",
        "change_set", "change_set_element", "change_conflict"
      ];
      
      let totalRowCount = 0;
      
      // Count rows in each table
      for (const table of tables) {
        try {
          const startTime = performance.now();
          
          // Use a proper Kysely query instead of raw SQL
          const result = await this.lix.db
            .selectFrom(table as any)
            .select(eb => eb.fn.count<number>('*').as('count'))
            .executeTakeFirst();
          
          const duration = performance.now() - startTime;
          this.trackQuery(`SELECT COUNT(*) as count FROM ${table}`, duration);
          
          if (result) {
            totalRowCount += (result.count as number) || 0;
          }
        } catch (error) {
          console.error(`Error getting row count for ${table}:`, error);
          // Continue with other tables
        }
      }
      
      // Update metrics
      this.state.metrics.memory = {
        databaseSize: this.estimateDatabaseSize(totalRowCount),
        tableCount: tables.length,
        totalRowCount,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error("Error collecting memory metrics:", error);
    }
  }
  
  /**
   * Rough estimate of database size based on row count
   * In a real implementation, this would use actual DB size if available
   */
  private estimateDatabaseSize(rowCount: number): number {
    // Rough estimate: average row size * row count
    const avgRowSizeBytes = 200; // Rough estimate
    return rowCount * avgRowSizeBytes;
  }
  
  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.refreshInterval = window.setInterval(() => {
      this.refresh();
    }, this.options.autoRefreshInterval);
    
    // Take initial snapshot
    this.takeSnapshot();
  }
  
  stopTracking(): void {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    if (this.refreshInterval !== null) {
      window.clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  on(event: InspectorEvent, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)?.push(callback);
  }
  
  off(event: InspectorEvent, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  private async loadTableData(): Promise<void> {
    // Get all table names
    const tables = [
      "change", "version", "snapshot", "change_edge", 
      "change_set", "change_set_element", "change_conflict"
    ];
    
    // Load data for each table
    for (const table of tables) {
      try {
        const data = await this.lix.db
          .selectFrom(table as any)
          .selectAll()
          .limit(100) // Limit to avoid loading too much data
          .execute();
        
        this.state.tableData[table] = data;
      } catch (error) {
        console.error(`Error loading table ${table}:`, error);
        this.state.tableData[table] = [];
      }
    }
    
    this.emitEvent("table-update", this.state.tableData);
  }
  
  private async loadChanges(): Promise<void> {
    try {
      const changes = await this.lix.db
        .selectFrom("change")
        .selectAll()
        .orderBy("created_at", "desc")
        .limit(100)
        .execute();
      
      // Check if changes have changed
      const hasChanges = this.state.changes.length !== changes.length || 
        JSON.stringify(this.state.changes) !== JSON.stringify(changes);
      
      if (hasChanges) {
        this.state.changes = changes;
        // Emit event
        this.emitEvent("change", changes);
      }
    } catch (error) {
      console.error("Error loading changes:", error);
    }
  }
  
  private async loadVersions(): Promise<void> {
    try {
      const versions = await this.lix.db
        .selectFrom("version")
        .selectAll()
        .execute();
      
      // Check if versions have changed
      const hasChanges = this.state.versions.length !== versions.length || 
        JSON.stringify(this.state.versions) !== JSON.stringify(versions);
      
      if (hasChanges) {
        this.state.versions = versions;
        // Emit event
        this.emitEvent("version", versions);
      }
    } catch (error) {
      console.error("Error loading versions:", error);
    }
  }
  
  private selectTable(tableName: string): void {
    this.state.selectedTable = tableName;
    
    // Update UI
    if (this.ui) {
      this.ui.updateData(this.state);
    }
  }
  
  private filterEvents(events: string[]): void {
    // This is handled by the UI component
  }
  
  /**
   * Restores the application state from a historical snapshot
   * This allows time-travel debugging
   */
  private async restoreSnapshot(snapshot: any, index: number): Promise<void> {
    try {
      // Record this operation
      const startTime = performance.now();
      
      // Create a temporary view of the data at this snapshot
      const temporaryState = {
        tableData: { ...snapshot.state.tableData },
        changes: [...snapshot.state.changes],
        versions: [...snapshot.state.versions],
      };
      
      // Update the UI with the snapshot state
      if (this.ui) {
        // Create a special "traveling back in time" state
        const timeStateMessage = {
          ...this.state,
          ...temporaryState,
          isHistoricalView: true,
          snapshotIndex: index,
          snapshotTimestamp: snapshot.timestamp,
          originalState: { ...this.state }
        };
        
        this.ui.updateData(timeStateMessage);
      }
      
      // Create a special snapshot event
      this.emitEvent('snapshot', {
        action: 'restore',
        timestamp: Date.now(),
        snapshotIndex: index,
        snapshotTimestamp: snapshot.timestamp
      });
      
      // Track this operation
      this.trackOperation('restoreSnapshot', startTime);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error restoring snapshot:", error);
      return Promise.reject(error);
    }
  }
  
  private emitEvent(event: InspectorEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
    
    // Add to events log
    this.state.events.unshift({
      type: event,
      timestamp: Date.now(),
      data,
    });
    
    // Trim events log if needed
    if (this.state.events.length > this.options.maxHistorySize) {
      this.state.events = this.state.events.slice(0, this.options.maxHistorySize);
    }
  }
  
  private takeSnapshot(): void {
    // Create a snapshot of the current state
    const snapshot = {
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify({
        tableData: this.state.tableData,
        changes: this.state.changes,
        versions: this.state.versions,
      })),
    };
    
    this.state.snapshots.unshift(snapshot);
    
    // Trim snapshots if needed
    if (this.state.snapshots.length > this.options.maxHistorySize) {
      this.state.snapshots = this.state.snapshots.slice(0, this.options.maxHistorySize);
    }
    
    this.emitEvent("snapshot", snapshot);
  }
}