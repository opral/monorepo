import type { Lix } from "@lix-js/sdk";

export interface InspectorUIProps {
  lix: Lix;
  theme: "light" | "dark" | "auto";
  onRefresh: () => void;
  onTableSelect: (tableName: string) => void;
  onEventFilter: (events: string[]) => void;
  data?: any; // Inspector state data
}

export class InspectorUI extends HTMLElement {
  // Using a better approach for shadowRoot
  private root: ShadowRoot;
  private props: InspectorUIProps;
  
  // UI state
  private selectedTable: string = "change";
  private selectedTab: "tables" | "events" | "graph" | "history" | "metrics" = "tables";
  private filterEvents: string[] = ["change", "conflict"];

  constructor(props: InspectorUIProps) {
    super();
    this.props = props;
    this.root = this.attachShadow({ mode: "open" });
    this.render();
  }

  private render() {
    const theme = this.props.theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : this.props.theme;
    
    // Define CSS
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --bg-color: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
        --text-color: ${theme === 'dark' ? '#e0e0e0' : '#333333'};
        --border-color: ${theme === 'dark' ? '#555555' : '#dddddd'};
        --accent-color: #3d7aed;
        --selection-color: #4d8afd;
        --hover-color: ${theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
        
        display: block;
        width: 100%;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        color: var(--text-color);
        background-color: var(--bg-color);
        overflow: hidden;
        border-radius: 4px;
        border: 1px solid var(--border-color);
      }

      .inspector-container {
        display: grid;
        grid-template-columns: 200px 1fr;
        grid-template-rows: auto 1fr auto;
        height: 100%;
      }

      .inspector-header {
        grid-column: 1 / 3;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-color);
      }

      .inspector-sidebar {
        grid-column: 1;
        border-right: 1px solid var(--border-color);
        overflow-y: auto;
        padding: 8px 0;
      }
      
      .inspector-content {
        grid-column: 2;
        overflow: auto;
        padding: 16px;
      }
      
      .inspector-footer {
        grid-column: 1 / 3;
        display: flex;
        justify-content: space-between;
        padding: 8px 16px;
        border-top: 1px solid var(--border-color);
        font-size: 12px;
      }
      
      .inspector-tab {
        padding: 8px 16px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      
      .inspector-tab.active {
        border-bottom-color: var(--selection-color);
        font-weight: 500;
      }

      .sidebar-section {
        margin-bottom: 16px;
      }
      
      .sidebar-title {
        font-weight: 500;
        padding: 4px 16px;
        text-transform: uppercase;
        font-size: 12px;
        color: ${theme === 'dark' ? '#999999' : '#666666'};
      }
      
      .sidebar-item {
        padding: 6px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      
      .sidebar-item:hover {
        background-color: var(--hover-color);
      }
      
      .sidebar-item.active {
        background-color: var(--selection-color);
        color: white;
      }
      
      .checkbox {
        margin-right: 8px;
      }
      
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .table th, .table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }
      
      .table th {
        font-weight: 500;
        position: sticky;
        top: 0;
        background-color: var(--bg-color);
        z-index: 1;
        border-bottom: 2px solid var(--border-color);
      }
      
      .event-timeline {
        margin-top: 16px;
      }
      
      .event-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 4px;
        background-color: var(--hover-color);
      }
      
      .event-time {
        font-size: 12px;
        color: ${theme === 'dark' ? '#999999' : '#666666'};
        margin-right: 8px;
      }
      
      .event-type {
        font-weight: 500;
        margin-right: 8px;
        text-transform: uppercase;
        font-size: 12px;
        background-color: var(--accent-color);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
      }
      
      .event-data {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background-color: var(--accent-color);
        color: white;
        cursor: pointer;
      }
      
      .btn:hover {
        opacity: 0.9;
      }
      
      .graph-container {
        height: 400px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-top: 16px;
      }
    `;
    
    // Create main container structure
    const container = document.createElement('div');
    container.className = 'inspector-container';
    
    // Header
    const header = document.createElement('div');
    header.className = 'inspector-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Lix Inspector';
    title.style.margin = '0';
    
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.addEventListener('click', () => this.props.onRefresh());
    
    header.appendChild(title);
    header.appendChild(refreshBtn);
    
    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'inspector-sidebar';
    
    // Content area
    const content = document.createElement('div');
    content.className = 'inspector-content';
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'inspector-footer';
    
    const versionInfo = document.createElement('div');
    versionInfo.textContent = 'Lix Inspector v0.1.0';
    
    footer.appendChild(versionInfo);
    
    // Assemble main structure
    container.appendChild(header);
    container.appendChild(sidebar);
    container.appendChild(content);
    container.appendChild(footer);
    
    // Add tabs
    const tabs = ['Tables', 'Events', 'Graph', 'History', 'Metrics'];
    const tabsContainer = document.createElement('div');
    tabsContainer.style.display = 'flex';
    tabsContainer.style.borderBottom = `1px solid var(--border-color)`;
    
    tabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = `inspector-tab ${this.selectedTab === tab.toLowerCase() ? 'active' : ''}`;
      tabElement.textContent = tab;
      tabElement.addEventListener('click', () => {
        this.selectedTab = tab.toLowerCase() as any;
        this.render();
      });
      
      tabsContainer.appendChild(tabElement);
    });
    
    content.appendChild(tabsContainer);
    
    // Render content based on selected tab
    const contentBody = document.createElement('div');
    contentBody.style.padding = '16px 0';
    
    switch (this.selectedTab) {
      case 'tables':
        sidebar.appendChild(this.renderTableList());
        contentBody.appendChild(this.renderTableView());
        break;
      case 'events':
        sidebar.appendChild(this.renderEventFilters());
        contentBody.appendChild(this.renderEventTimeline());
        break;
      case 'graph':
        contentBody.appendChild(this.renderChangeGraph());
        break;
      case 'history':
        sidebar.appendChild(this.renderHistoryList());
        contentBody.appendChild(this.renderHistoryView());
        break;
      case 'metrics':
        sidebar.appendChild(this.renderMetricsCategories());
        contentBody.appendChild(this.renderPerformanceMetrics());
        break;
    }
    
    content.appendChild(contentBody);
    
    // Set shadow DOM content
    this.root.innerHTML = '';
    this.root.appendChild(style);
    this.root.appendChild(container);
  }
  
  private renderTableList() {
    const section = document.createElement('div');
    section.className = 'sidebar-section';
    
    const title = document.createElement('div');
    title.className = 'sidebar-title';
    title.textContent = 'Database Tables';
    
    section.appendChild(title);
    
    const tables = [
      'change', 'version', 'snapshot', 'change_edge',
      'change_set', 'change_set_element', 'change_conflict'
    ];
    
    tables.forEach(table => {
      const item = document.createElement('div');
      item.className = `sidebar-item ${this.selectedTable === table ? 'active' : ''}`;
      item.textContent = table;
      item.addEventListener('click', () => {
        this.selectedTable = table;
        this.props.onTableSelect(table);
        this.render();
      });
      
      section.appendChild(item);
    });
    
    return section;
  }
  
  private renderTableView() {
    const tableView = document.createElement('div');
    
    const data = this.props.data?.tableData?.[this.selectedTable] || [];
    const heading = document.createElement('h3');
    heading.textContent = `Table: ${this.selectedTable}`;
    heading.style.marginTop = '0';
    tableView.appendChild(heading);
    
    if (data.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = `No data in ${this.selectedTable} table.`;
      tableView.appendChild(emptyMessage);
      return tableView;
    }
    
    const table = document.createElement('table');
    table.className = 'table';
    
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    
    // Get column names from the first row
    const columns = Object.keys(data[0]);
    
    columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      tr.appendChild(th);
    });
    
    thead.appendChild(tr);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    // Add rows from the actual data
    data.forEach(row => {
      const tr = document.createElement('tr');
      
      columns.forEach(column => {
        const td = document.createElement('td');
        const value = row[column];
        
        // Format the value for display
        if (value === null) {
          td.textContent = 'null';
          td.style.color = '#999';
        } else if (typeof value === 'object') {
          td.textContent = JSON.stringify(value);
        } else {
          td.textContent = String(value);
        }
        
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    tableView.appendChild(table);
    
    return tableView;
  }
  
  private renderEventFilters() {
    const section = document.createElement('div');
    section.className = 'sidebar-section';
    
    const title = document.createElement('div');
    title.className = 'sidebar-title';
    title.textContent = 'Event Types';
    
    section.appendChild(title);
    
    const events = ['change', 'conflict', 'version', 'snapshot'];
    
    events.forEach(event => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox';
      checkbox.checked = this.filterEvents.includes(event);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.filterEvents.push(event);
        } else {
          const index = this.filterEvents.indexOf(event);
          if (index !== -1) {
            this.filterEvents.splice(index, 1);
          }
        }
        
        this.props.onEventFilter(this.filterEvents);
      });
      
      const label = document.createElement('span');
      label.textContent = event;
      
      item.appendChild(checkbox);
      item.appendChild(label);
      section.appendChild(item);
    });
    
    return section;
  }
  
  private renderEventTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'event-timeline';
    
    const events = this.props.data?.events || [];
    
    if (events.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No events recorded yet.';
      timeline.appendChild(emptyMessage);
      return timeline;
    }
    
    // Filter events based on selected types
    const filteredEvents = events.filter(event => 
      this.filterEvents.includes(event.type)
    );
    
    filteredEvents.forEach(event => {
      const eventItem = document.createElement('div');
      eventItem.className = 'event-item';
      
      const time = document.createElement('div');
      time.className = 'event-time';
      const date = new Date(event.timestamp);
      time.textContent = date.toLocaleTimeString();
      
      const type = document.createElement('div');
      type.className = 'event-type';
      type.textContent = event.type;
      
      const data = document.createElement('div');
      data.className = 'event-data';
      data.textContent = JSON.stringify(event.data).substring(0, 100);
      
      eventItem.appendChild(time);
      eventItem.appendChild(type);
      eventItem.appendChild(data);
      
      timeline.appendChild(eventItem);
    });
    
    return timeline;
  }
  
  private renderChangeGraph() {
    const container = document.createElement('div');
    
    const heading = document.createElement('h3');
    heading.textContent = 'Change Graph';
    heading.style.marginTop = '0';
    
    const graph = document.createElement('div');
    graph.className = 'graph-container';
    
    // If we have real data, we'd render a proper graph here based on changes and their relationships
    const changes = this.props.data?.changes || [];
    const changeEdges = this.props.data?.tableData?.change_edge || [];
    
    if (changes.length === 0) {
      graph.innerHTML = '<p style="text-align: center; padding: 20px;">No changes available to display.</p>';
    } else {
      // Create a simple SVG visualization
      graph.innerHTML = this.generateChangeGraphSvg(changes, changeEdges);
    }
    
    container.appendChild(heading);
    container.appendChild(graph);
    
    return container;
  }
  
  private generateChangeGraphSvg(changes: any[], edges: any[]): string {
    // Improved force-directed layout algorithm for the change graph
    const nodeMap = new Map();
    const nodeWidth = 80;
    const nodeHeight = 40;
    const width = 800;
    const height = 400;
    const padding = 50;
    
    // Create a graph data structure
    type Node = {
      id: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      level: number;
      change: any;
    };
    
    type Edge = {
      source: string;
      target: string;
    };
    
    // Build a level-based directed graph
    const graph: { nodes: Node[]; edges: Edge[] } = {
      nodes: [],
      edges: []
    };
    
    // Create a parent-child map for quick lookups
    const parentMap = new Map<string, string[]>();
    const childMap = new Map<string, string[]>();
    
    // Process edges to determine parent-child relationships
    edges.forEach(edge => {
      if (!parentMap.has(edge.child_id)) {
        parentMap.set(edge.child_id, []);
      }
      parentMap.get(edge.child_id)?.push(edge.parent_id);
      
      if (!childMap.has(edge.parent_id)) {
        childMap.set(edge.parent_id, []);
      }
      childMap.get(edge.parent_id)?.push(edge.child_id);
      
      graph.edges.push({
        source: edge.parent_id,
        target: edge.child_id
      });
    });
    
    // Find root nodes (changes with no parents in this set of edges)
    const rootNodes = changes.filter(change => 
      !parentMap.has(change.id) || parentMap.get(change.id)?.length === 0
    ).map(change => change.id);
    
    // Assign levels to nodes using BFS
    const assignedLevels = new Map<string, number>();
    const queue: { id: string; level: number }[] = rootNodes.map(id => ({ id, level: 0 }));
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      // If already processed with a lower or equal level, skip
      if (assignedLevels.has(id) && assignedLevels.get(id)! <= level) {
        continue;
      }
      
      assignedLevels.set(id, level);
      
      // Process children
      const children = childMap.get(id) || [];
      children.forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });
    }
    
    // Create node objects with initial positions
    changes.forEach(change => {
      const level = assignedLevels.get(change.id) || 0;
      const initialX = padding + Math.random() * (width - 2 * padding);
      const initialY = padding + (level * 80) + Math.random() * 40;
      
      graph.nodes.push({
        id: change.id,
        x: initialX,
        y: initialY,
        vx: 0,
        vy: 0,
        level,
        change
      });
      
      nodeMap.set(change.id, {
        x: initialX,
        y: initialY,
        change
      });
    });
    
    // Simple force-directed layout simulation (limited iterations for performance)
    // Handle case with no nodes or just one node specially
    if (graph.nodes.length === 0) {
      return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
        <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="var(--text-color)">No changes to display</text>
      </svg>`;
    }
    
    if (graph.nodes.length === 1) {
      // Single node, center it
      const node = graph.nodes[0];
      node.x = width / 2;
      node.y = height / 2;
      nodeMap.set(node.id, { x: node.x, y: node.y, change: node.change });
    } else {
      // Multiple nodes, use force-directed layout
      const iterations = Math.min(100, graph.nodes.length * 3);
      const repulsionForce = 1000;
      const attractionForce = 0.05;
      const levelForce = 0.2;
      
      for (let i = 0; i < iterations; i++) {
        // Apply repulsion forces between all nodes
        for (let a = 0; a < graph.nodes.length; a++) {
          for (let b = a + 1; b < graph.nodes.length; b++) {
            const nodeA = graph.nodes[a];
            const nodeB = graph.nodes[b];
            
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            if (distance < 150) {
              const force = repulsionForce / (distance * distance);
              const forceX = dx / distance * force;
              const forceY = dy / distance * force;
              
              nodeA.vx -= forceX;
              nodeA.vy -= forceY;
              nodeB.vx += forceX;
              nodeB.vy += forceY;
            }
          }
        }
        
        // Apply attraction forces along edges
        for (const edge of graph.edges) {
          const sourceNode = graph.nodes.find(n => n.id === edge.source);
          const targetNode = graph.nodes.find(n => n.id === edge.target);
          
          if (sourceNode && targetNode) {
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const force = distance * attractionForce;
            const forceX = dx / distance * force;
            const forceY = dy / distance * force;
            
            sourceNode.vx += forceX;
            sourceNode.vy += forceY;
            targetNode.vx -= forceX;
            targetNode.vy -= forceY;
          }
        }
        
        // Apply level forces to ensure nodes stay roughly in their level
        for (const node of graph.nodes) {
          const targetY = padding + (node.level * 80) + 20;
          const dy = targetY - node.y;
          node.vy += dy * levelForce;
        }
        
        // Update positions with velocity
        for (const node of graph.nodes) {
          node.x += node.vx * 0.1;
          node.y += node.vy * 0.1;
          
          // Apply damping
          node.vx *= 0.9;
          node.vy *= 0.9;
          
          // Boundary constraints
          node.x = Math.max(padding, Math.min(width - padding, node.x));
          node.y = Math.max(padding, Math.min(height - padding, node.y));
          
          // Update nodeMap for edge rendering
          nodeMap.set(node.id, { x: node.x, y: node.y, change: node.change });
        }
      }
    }
    
    // Generate SVG
    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">`;
    
    // Add edges first so they're behind nodes
    for (const edge of graph.edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      
      if (sourceNode && targetNode) {
        // Calculate control points for curved edges
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const isSameLevel = graph.nodes.find(n => n.id === edge.source)?.level === 
                           graph.nodes.find(n => n.id === edge.target)?.level;
        
        if (isSameLevel) {
          // Straight line for same level
          svg += `<line x1="${sourceNode.x}" y1="${sourceNode.y}" x2="${targetNode.x}" y2="${targetNode.y}" stroke="#666" stroke-width="1.5" />`;
        } else {
          // Curved path for different levels
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          const cpX = midX;
          const cpY = midY - 30;
          
          svg += `<path d="M${sourceNode.x},${sourceNode.y} Q${cpX},${cpY} ${targetNode.x},${targetNode.y}" stroke="#666" stroke-width="1.5" fill="none" />`;
          
          // Add arrow marker
          const angle = Math.atan2(targetNode.y - cpY, targetNode.x - cpX);
          const arrowLength = 10;
          const arrowX = targetNode.x - arrowLength * Math.cos(angle);
          const arrowY = targetNode.y - arrowLength * Math.sin(angle);
          
          svg += `<polygon points="${targetNode.x},${targetNode.y} ${arrowX - 5 * Math.sin(angle)},${arrowY + 5 * Math.cos(angle)} ${arrowX + 5 * Math.sin(angle)},${arrowY - 5 * Math.cos(angle)}" fill="#666" />`;
        }
      }
    }
    
    // Add nodes
    for (const [id, node] of nodeMap.entries()) {
      const nodeObj = graph.nodes.find(n => n.id === id);
      const level = nodeObj?.level || 0;
      const fillColor = this.getNodeColor(level);
      
      svg += `
        <g class="node" data-id="${id}">
          <rect x="${node.x - nodeWidth/2}" y="${node.y - nodeHeight/2}" width="${nodeWidth}" height="${nodeHeight}" rx="5" fill="${fillColor}" />
          <text x="${node.x}" y="${node.y - 5}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12px">${id.substring(0, 8)}</text>
          <text x="${node.x}" y="${node.y + 10}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="10px">L: ${level}</text>
        </g>
      `;
    }
    
    svg += `</svg>`;
    return svg;
  }
  
  private getNodeColor(level: number): string {
    // Color palette for different levels
    const colors = [
      '#3d7aed', // blue
      '#ed3d7a', // red
      '#7aed3d', // green
      '#ed7a3d', // orange
      '#7a3ded', // purple
      '#3ded7a', // teal
    ];
    
    return colors[level % colors.length];
  }
  
  private renderHistoryList() {
    const section = document.createElement('div');
    section.className = 'sidebar-section';
    
    const title = document.createElement('div');
    title.className = 'sidebar-title';
    title.textContent = 'History Snapshots';
    
    section.appendChild(title);
    
    const snapshots = this.props.data?.snapshots || [];
    
    if (snapshots.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'sidebar-item';
      emptyItem.textContent = 'No snapshots available';
      section.appendChild(emptyItem);
      return section;
    }
    
    // Add snapshot items with timestamp
    snapshots.forEach((snapshot, index) => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      
      const date = new Date(snapshot.timestamp);
      item.textContent = `${date.toLocaleTimeString()} - Snapshot ${index + 1}`;
      
      // Make snapshot items clickable
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        // Set selected snapshot index in a custom attribute
        this.setAttribute('data-selected-snapshot', index.toString());
        this.render();
      });
      
      // Highlight the selected snapshot
      const selectedIndex = parseInt(this.getAttribute('data-selected-snapshot') || '-1');
      if (selectedIndex === index) {
        item.classList.add('active');
      }
      
      section.appendChild(item);
    });
    
    // Add time control buttons
    const controls = document.createElement('div');
    controls.style.padding = '12px';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'btn';
    prevButton.textContent = '◀ Previous';
    prevButton.style.fontSize = '12px';
    prevButton.addEventListener('click', () => {
      const currentIndex = parseInt(this.getAttribute('data-selected-snapshot') || '0');
      if (currentIndex > 0) {
        this.setAttribute('data-selected-snapshot', (currentIndex - 1).toString());
        this.render();
      }
    });
    
    const nextButton = document.createElement('button');
    nextButton.className = 'btn';
    nextButton.textContent = 'Next ▶';
    nextButton.style.fontSize = '12px';
    nextButton.addEventListener('click', () => {
      const currentIndex = parseInt(this.getAttribute('data-selected-snapshot') || '0');
      if (currentIndex < snapshots.length - 1) {
        this.setAttribute('data-selected-snapshot', (currentIndex + 1).toString());
        this.render();
      }
    });
    
    controls.appendChild(prevButton);
    controls.appendChild(nextButton);
    section.appendChild(controls);
    
    return section;
  }
  
  private renderHistoryView() {
    const container = document.createElement('div');
    
    const heading = document.createElement('h3');
    heading.textContent = 'History Snapshot';
    heading.style.marginTop = '0';
    
    container.appendChild(heading);
    
    const snapshots = this.props.data?.snapshots || [];
    const selectedIndex = parseInt(this.getAttribute('data-selected-snapshot') || '-1');
    
    if (selectedIndex === -1 || !snapshots[selectedIndex]) {
      const info = document.createElement('p');
      info.textContent = 'Select a snapshot from the sidebar to view the state at that point in time.';
      container.appendChild(info);
      return container;
    }
    
    const snapshot = snapshots[selectedIndex];
    
    // Create snapshot details
    const detailsContainer = document.createElement('div');
    detailsContainer.style.marginBottom = '20px';
    
    const timestamp = document.createElement('div');
    timestamp.innerHTML = `<strong>Timestamp:</strong> ${new Date(snapshot.timestamp).toLocaleString()}`;
    
    detailsContainer.appendChild(timestamp);
    container.appendChild(detailsContainer);
    
    // Create restore button
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn';
    restoreBtn.textContent = 'Restore this Snapshot State';
    restoreBtn.style.marginBottom = '20px';
    restoreBtn.addEventListener('click', () => {
      // Dispatch a custom event for restoring the snapshot
      const event = new CustomEvent('restore-snapshot', { detail: { snapshot, index: selectedIndex } });
      this.dispatchEvent(event);
    });
    
    container.appendChild(restoreBtn);
    
    // Show snapshot state data
    const tabsContainer = document.createElement('div');
    tabsContainer.style.display = 'flex';
    tabsContainer.style.borderBottom = '1px solid var(--border-color)';
    
    // Check that the snapshot has the expected structure before proceeding
    if (!snapshot.state || typeof snapshot.state !== 'object') {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error: Invalid snapshot format - cannot display data';
      errorMessage.style.color = 'red';
      container.appendChild(errorMessage);
      return container;
    }
    
    const snapshotTabs = ['Tables', 'Changes', 'Versions'];
    
    // Initialize selected tab if not already set
    if (!this.getAttribute('data-snapshot-tab')) {
      this.setAttribute('data-snapshot-tab', 'tables');
    }
    
    const selectedTab = this.getAttribute('data-snapshot-tab') || 'tables';
    
    snapshotTabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = `inspector-tab ${selectedTab === tab.toLowerCase() ? 'active' : ''}`;
      tabElement.textContent = tab;
      tabElement.addEventListener('click', () => {
        this.setAttribute('data-snapshot-tab', tab.toLowerCase());
        this.render();
      });
      
      tabsContainer.appendChild(tabElement);
    });
    
    container.appendChild(tabsContainer);
    
    // Render tab content based on selected tab
    const tabContent = document.createElement('div');
    tabContent.style.padding = '16px 0';
    
    switch (selectedTab) {
      case 'tables':
        // Get a list of tables in the snapshot
        const tables = Object.keys(snapshot.state.tableData || {});
        if (tables.length === 0) {
          const emptyMessage = document.createElement('p');
          emptyMessage.textContent = 'No table data in this snapshot.';
          tabContent.appendChild(emptyMessage);
        } else {
          // Create a dropdown to select tables
          const selectContainer = document.createElement('div');
          selectContainer.style.marginBottom = '16px';
          
          const label = document.createElement('label');
          label.textContent = 'Select Table: ';
          
          const select = document.createElement('select');
          tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            select.appendChild(option);
          });
          
          // Set default selected table
          if (!this.getAttribute('data-snapshot-table')) {
            this.setAttribute('data-snapshot-table', tables[0]);
          }
          select.value = this.getAttribute('data-snapshot-table') || tables[0];
          
          select.addEventListener('change', () => {
            this.setAttribute('data-snapshot-table', select.value);
            this.render();
          });
          
          selectContainer.appendChild(label);
          selectContainer.appendChild(select);
          tabContent.appendChild(selectContainer);
          
          // Show the selected table data
          const selectedTable = this.getAttribute('data-snapshot-table') || tables[0];
          const tableData = snapshot.state.tableData[selectedTable] || [];
          
          if (tableData.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = `No data in table "${selectedTable}" for this snapshot.`;
            tabContent.appendChild(emptyMessage);
          } else {
            // Render table
            const table = document.createElement('table');
            table.className = 'table';
            
            const thead = document.createElement('thead');
            const tr = document.createElement('tr');
            
            // Get columns from first row
            const columns = Object.keys(tableData[0]);
            
            columns.forEach(column => {
              const th = document.createElement('th');
              th.textContent = column;
              tr.appendChild(th);
            });
            
            thead.appendChild(tr);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            
            tableData.forEach(row => {
              const tr = document.createElement('tr');
              
              columns.forEach(column => {
                const td = document.createElement('td');
                const value = row[column];
                
                if (value === null) {
                  td.textContent = 'null';
                  td.style.color = '#999';
                } else if (typeof value === 'object') {
                  td.textContent = JSON.stringify(value);
                } else {
                  td.textContent = String(value);
                }
                
                tr.appendChild(td);
              });
              
              tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            tabContent.appendChild(table);
          }
        }
        break;
      
      case 'changes':
        // Show changes in this snapshot
        const changes = snapshot.state.changes || [];
        
        if (changes.length === 0) {
          const emptyMessage = document.createElement('p');
          emptyMessage.textContent = 'No changes recorded in this snapshot.';
          tabContent.appendChild(emptyMessage);
        } else {
          // Create a table of changes
          const table = document.createElement('table');
          table.className = 'table';
          
          const thead = document.createElement('thead');
          const tr = document.createElement('tr');
          
          // Define columns manually for changes
          const columns = ['id', 'entity_id', 'parent_id', 'created_at', 'snapshot_id'];
          
          columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            tr.appendChild(th);
          });
          
          thead.appendChild(tr);
          table.appendChild(thead);
          
          const tbody = document.createElement('tbody');
          
          changes.forEach(change => {
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
              const td = document.createElement('td');
              const value = change[column as keyof typeof change];
              
              if (value === null) {
                td.textContent = 'null';
                td.style.color = '#999';
              } else if (typeof value === 'object') {
                td.textContent = JSON.stringify(value);
              } else {
                td.textContent = String(value);
              }
              
              tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
          });
          
          table.appendChild(tbody);
          tabContent.appendChild(table);
        }
        break;
      
      case 'versions':
        // Show versions in this snapshot
        const versions = snapshot.state.versions || [];
        
        if (versions.length === 0) {
          const emptyMessage = document.createElement('p');
          emptyMessage.textContent = 'No versions recorded in this snapshot.';
          tabContent.appendChild(emptyMessage);
        } else {
          // Create a table of versions
          const table = document.createElement('table');
          table.className = 'table';
          
          const thead = document.createElement('thead');
          const tr = document.createElement('tr');
          
          // Define columns manually for versions
          const columns = ['id', 'name', 'created_at'];
          
          columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            tr.appendChild(th);
          });
          
          thead.appendChild(tr);
          table.appendChild(thead);
          
          const tbody = document.createElement('tbody');
          
          versions.forEach(version => {
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
              const td = document.createElement('td');
              const value = version[column as keyof typeof version];
              
              if (value === null) {
                td.textContent = 'null';
                td.style.color = '#999';
              } else if (typeof value === 'object') {
                td.textContent = JSON.stringify(value);
              } else {
                td.textContent = String(value);
              }
              
              tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
          });
          
          table.appendChild(tbody);
          tabContent.appendChild(table);
        }
        break;
    }
    
    container.appendChild(tabContent);
    
    return container;
  }
  
  private renderMetricsCategories() {
    const section = document.createElement('div');
    section.className = 'sidebar-section';
    
    const title = document.createElement('div');
    title.className = 'sidebar-title';
    title.textContent = 'Metric Categories';
    
    section.appendChild(title);
    
    const categories = [
      { id: 'operations', name: 'Operations' },
      { id: 'queries', name: 'SQL Queries' },
      { id: 'memory', name: 'Memory Usage' },
      { id: 'timing', name: 'Timing' }
    ];
    
    categories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.textContent = category.name;
      
      section.appendChild(item);
    });
    
    return section;
  }
  
  private renderPerformanceMetrics() {
    const container = document.createElement('div');
    
    const heading = document.createElement('h3');
    heading.textContent = 'Performance Metrics';
    heading.style.marginTop = '0';
    
    const description = document.createElement('p');
    description.textContent = 'Real-time performance statistics for Lix operations and queries.';
    
    container.appendChild(heading);
    container.appendChild(description);
    
    // Get metrics data from the inspector state
    const metrics = this.props.data?.metrics || {
      operations: {},
      queries: [],
      memory: {},
      timing: {}
    };
    
    // Operation Metrics
    const operationsHeading = document.createElement('h4');
    operationsHeading.textContent = 'Operations';
    container.appendChild(operationsHeading);
    
    const operationsContainer = document.createElement('div');
    operationsContainer.className = 'metrics-container';
    
    // Create operation metrics cards
    const operations = metrics.operations || {};
    if (Object.keys(operations).length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No operation metrics recorded yet.';
      operationsContainer.appendChild(emptyMessage);
    } else {
      // Create metrics cards for operations
      Object.entries(operations).forEach(([key, value]) => {
        const card = this.createMetricCard(key, value as any);
        operationsContainer.appendChild(card);
      });
    }
    
    container.appendChild(operationsContainer);
    
    // Query Metrics
    const queriesHeading = document.createElement('h4');
    queriesHeading.textContent = 'Recent SQL Queries';
    container.appendChild(queriesHeading);
    
    // Query timing table
    const queryTable = document.createElement('table');
    queryTable.className = 'table';
    
    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Query', 'Duration (ms)', 'Timestamp'].forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    queryTable.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    const queries = metrics.queries || [];
    if (queries.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 3;
      emptyCell.textContent = 'No SQL queries recorded yet.';
      emptyCell.style.textAlign = 'center';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      queries.forEach(query => {
        const row = document.createElement('tr');
        
        const queryCell = document.createElement('td');
        queryCell.textContent = query.sql.substring(0, 80) + (query.sql.length > 80 ? '...' : '');
        row.appendChild(queryCell);
        
        const durationCell = document.createElement('td');
        durationCell.textContent = query.duration.toFixed(2);
        row.appendChild(durationCell);
        
        const timestampCell = document.createElement('td');
        timestampCell.textContent = new Date(query.timestamp).toLocaleTimeString();
        row.appendChild(timestampCell);
        
        tbody.appendChild(row);
      });
    }
    queryTable.appendChild(tbody);
    container.appendChild(queryTable);
    
    // Memory Usage
    const memoryHeading = document.createElement('h4');
    memoryHeading.textContent = 'Memory Usage';
    container.appendChild(memoryHeading);
    
    const memoryMetrics = metrics.memory || {};
    const memoryContainer = document.createElement('div');
    memoryContainer.className = 'metrics-container';
    
    if (Object.keys(memoryMetrics).length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No memory metrics available.';
      memoryContainer.appendChild(emptyMessage);
    } else {
      // Create memory usage visualization
      // This could be a chart in a real implementation
      const memoryUsageEl = document.createElement('div');
      memoryUsageEl.className = 'memory-usage';
      memoryUsageEl.style.padding = '16px';
      memoryUsageEl.style.background = '#f5f5f5';
      memoryUsageEl.style.borderRadius = '4px';
      
      const dbSizeEl = document.createElement('div');
      dbSizeEl.textContent = `Database Size: ${this.formatBytes(memoryMetrics.databaseSize || 0)}`;
      memoryUsageEl.appendChild(dbSizeEl);
      
      const totalTablesEl = document.createElement('div');
      totalTablesEl.textContent = `Total Tables: ${memoryMetrics.tableCount || 0}`;
      memoryUsageEl.appendChild(totalTablesEl);
      
      const totalRowsEl = document.createElement('div');
      totalRowsEl.textContent = `Total Rows: ${memoryMetrics.totalRowCount || 0}`;
      memoryUsageEl.appendChild(totalRowsEl);
      
      memoryContainer.appendChild(memoryUsageEl);
    }
    
    container.appendChild(memoryContainer);
    
    return container;
  }
  
  private createMetricCard(title: string, data: { count: number, avgTime: number }) {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.style.padding = '12px';
    card.style.margin = '8px';
    card.style.borderRadius = '4px';
    card.style.background = '#f5f5f5';
    card.style.display = 'inline-block';
    card.style.minWidth = '150px';
    
    const titleEl = document.createElement('div');
    titleEl.style.fontWeight = 'bold';
    titleEl.textContent = this.formatOperationName(title);
    
    const countEl = document.createElement('div');
    countEl.textContent = `Count: ${data.count}`;
    
    const timeEl = document.createElement('div');
    timeEl.textContent = `Avg Time: ${data.avgTime.toFixed(2)}ms`;
    
    card.appendChild(titleEl);
    card.appendChild(countEl);
    card.appendChild(timeEl);
    
    return card;
  }
  
  private formatOperationName(name: string): string {
    // Convert camelCase or snake_case to Title Case with spaces
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase());
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Updates the UI with new data from the inspector state
   */
  updateData(data: any) {
    this.props.data = data;
    this.render();
  }
}

// Register the custom element if we are in a browser environment
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  // Check if element is already defined to avoid errors on hot reload
  if (!customElements.get('lix-inspector')) {
    customElements.define('lix-inspector', InspectorUI);
  }
}