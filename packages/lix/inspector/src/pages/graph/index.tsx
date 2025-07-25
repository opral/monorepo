import { useQuery } from "@lix-js/react-utils";
import {
  selectVersions,
  selectAvailableLabels,
  selectCommits,
  selectCommitEdges,
} from "./queries";
import {
  ReactFlow,
  type Node,
  type Edge,
  MarkerType,
  Controls,
  Background,
  ConnectionLineType,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { type LixNodeData, lixNodeTypes } from "./nodes";

export interface ExtendedCommit {
  id: string;
  change_set_id: string;
  labels?: { name: string }[];
  [key: string]: any;
}

export default function Graph() {
  const reactFlowInstanceRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const versions = useQuery(selectVersions);
  const availableLabels = useQuery(selectAvailableLabels);

  // Direct approach preserves type inference
  const commits = useQuery((lix) =>
    selectCommits(lix, selectedLabels, availableLabels || [])
  );

  const commitEdges = useQuery((lix) =>
    selectCommitEdges(lix, commits?.map((commit) => commit.id) ?? [])
  );

  // Toggle label selection
  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) => {
      if (prev.includes(labelName)) {
        return prev.filter((name) => name !== labelName);
      } else {
        return [...prev, labelName];
      }
    });
  };

  // Clear all selected labels
  const clearLabelFilters = () => {
    setSelectedLabels([]);
  };

  // Calculate layout using useMemo to prevent infinite loops
  const { nodes, edges } = useMemo(() => {
    const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "TB", // Top to bottom layout - versions at top, commits flow downward
      nodesep: 150, // Increased horizontal separation for working commits
      ranksep: 180, // Large vertical gap between ranks (versions and commits)
      ranker: "network-simplex", // Better for aligning nodes at same level
      marginx: 40,
      marginy: 40,
      edgesep: 50, // Increased edge separation for cleaner layout
      align: "UL", // Align nodes to up-left
    });

    const commitNodeWidth = 200;
    const commitNodeHeight = 80;
    const versionNodeWidth = 180;
    const versionNodeHeight = 60;

    // First add regular commits (non-working commits)
    for (const commit of commits || []) {
      const isWorkingCommit = (versions || []).some(v => v.working_commit_id === commit.id);
      if (!isWorkingCommit) {
        g.setNode(commit.id, {
          label: "commit",
          width: commitNodeWidth,
          height: commitNodeHeight,
        });
      }
    }
    
    // Then add working commits (this helps dagre place them on the right)
    for (const commit of commits || []) {
      const isWorkingCommit = (versions || []).some(v => v.working_commit_id === commit.id);
      if (isWorkingCommit) {
        g.setNode(commit.id, {
          label: "commit",
          width: commitNodeWidth,
          height: commitNodeHeight,
        });
      }
    }


    for (const v of versions || []) {
      // Use a consistent prefix for version nodes to avoid ID conflicts
      const versionNodeId = `version_${v.id}`;
      g.setNode(versionNodeId, {
        label: "version",
        width: versionNodeWidth,
        height: versionNodeHeight,
        // Store metadata as a custom property
        customData: { originalId: v.id },
        // Force all versions to be at the same rank (top level)
        rank: 0,
      });
    }

    // Add edges to the graph for layout calculation
    for (const commitEdge of commitEdges || []) {
      // Only add edges if both nodes exist in the filtered set
      if (
        (commits || []).some((commit) => commit.id === commitEdge.parent_id) &&
        (commits || []).some((commit) => commit.id === commitEdge.child_id)
      ) {
        g.setEdge(commitEdge.child_id, commitEdge.parent_id);
      }
    }

    // First add edges to regular commits
    for (const v of versions || []) {
      const versionNodeId = `version_${v.id}`;
      
      // Add edge from version to commit (for layout purposes)
      if ((commits || []).some((commit) => commit.id === v.commit_id)) {
        g.setEdge(versionNodeId, v.commit_id);
      }
    }
    
    // Then add edges to working commits (this helps dagre place them on the right)
    for (const v of versions || []) {
      const versionNodeId = `version_${v.id}`;
      
      // Add edge from version to working commit (for layout purposes)
      if (v.working_commit_id && (commits || []).some((commit) => commit.id === v.working_commit_id)) {
        g.setEdge(versionNodeId, v.working_commit_id);
      }
    }

    // Calculate the layout
    dagre.layout(g);

    // Map Dagre nodes to React Flow nodes
    const nodes: Node<LixNodeData>[] = g.nodes().map((nodeId) => {
      const node = g.node(nodeId); // Get node for position
      const label = node.label || "";

      // Find the entity based on the node ID
      let entity: any;
      let originalId: string | undefined;

      if (nodeId.startsWith("version_")) {
        // For version nodes, find by the original ID
        // Access custom data safely with type assertion
        const nodeAny = node as any;
        originalId = nodeAny.customData?.originalId;
        entity = (versions || []).find((v) => v.id === originalId);
      } else {
        // For commit nodes, find directly
        entity = (commits || []).find((commit) => commit.id === nodeId);
      }

      // Check if this commit is a working commit
      let isWorkingCommit = false;
      if (label === "commit" && entity) {
        isWorkingCommit = (versions || []).some(v => v.working_commit_id === entity.id);
      }

      // Create the node with proper typing
      return {
        id: nodeId,
        type: "lixNode",
        position: { x: node.x - node.width / 2, y: node.y - node.height / 2 },
        data: {
          tableName: label,
          entity: entity,
          originalId: originalId,
          title: label === "commit" ? (isWorkingCommit ? "working commit" : "commit") : "version",
          isWorkingCommit: isWorkingCommit,
        },
        style: {
          border: "1px solid #ccc",
        },
      } as Node<LixNodeData>;
    });

    // Create edges with proper routing
    const allEdges: Edge[] = [];

    for (const commitEdge of commitEdges || []) {
      // Only add edges if both nodes exist in the filtered set
      if (
        (commits || []).some((commit) => commit.id === commitEdge.parent_id) &&
        (commits || []).some((commit) => commit.id === commitEdge.child_id)
      ) {
        // Check if the child (source) is a working commit
        const isChildWorkingCommit = (versions || []).some(v => v.working_commit_id === commitEdge.child_id);
        
        allEdges.push({
          id: `e_${commitEdge.parent_id}-${commitEdge.child_id}`,
          source: commitEdge.child_id,
          target: commitEdge.parent_id,
          markerEnd: { type: MarkerType.Arrow }, // Arrow points from child to parent
          type: "straight", // Use straight edges for cleaner vertical layout
          animated: false,
          style: isChildWorkingCommit ? { strokeDasharray: "5 5" } : undefined, // Dashed line for working commit edges
        });
      }
    }

    for (const v of versions || []) {
      const versionNodeId = `version_${v.id}`;
      
      // Add edge from version to commit (pointing up)
      if ((commits || []).some((commit) => commit.id === v.commit_id)) {
        allEdges.push({
          id: `ve_${v.id}_${v.commit_id}`,
          source: versionNodeId,
          target: v.commit_id,
          markerEnd: { type: MarkerType.Arrow },
          type: "straight",
          animated: false,
        });
      }
      
      // Add edge from version to working commit (pointing up)
      if (v.working_commit_id && (commits || []).some((commit) => commit.id === v.working_commit_id)) {
        allEdges.push({
          id: `ve_wc_${v.id}_${v.working_commit_id}`,
          source: versionNodeId,
          target: v.working_commit_id,
          markerEnd: { type: MarkerType.Arrow },
          type: "straight",
          animated: false,
          style: { strokeDasharray: "5 5" }, // Dashed line for working commit
        });
      }
    }

    return { nodes, edges: allEdges };
  }, [commits, commitEdges, versions]);

  // Function to focus on a specific node
  const focusNode = useCallback((nodeId: string) => {
    const instance = reactFlowInstanceRef.current;
    if (!instance) {
      console.error("ReactFlow instance not ready");
      return;
    }


    // Use setCenter for more reliable focusing
    setTimeout(() => {
      const nodeWithWidth = instance.getNode(nodeId);
      if (nodeWithWidth) {
        const x = nodeWithWidth.position.x + (nodeWithWidth.width || 0) / 2;
        const y = nodeWithWidth.position.y + (nodeWithWidth.height || 0) / 2;
        instance.setCenter(x, y, { zoom: 1.2, duration: 800 });
      } else {
        // Fallback to fitView
        instance.fitView({
          padding: 0.5,
          includeHiddenNodes: false,
          nodes: [{ id: nodeId }],
          duration: 800,
        });
      }
    }, 100);
  }, []);

  // Refit view when container size changes or nodes change
  useEffect(() => {
    if (reactFlowInstanceRef.current) {
      setTimeout(() => {
        (reactFlowInstanceRef.current as any)?.fitView({
          padding: 0.2,
          includeHiddenNodes: false,
        });
      }, 100);
    }
  }, [nodes]);

  return (
    <div className="flex flex-col h-full w-full" style={{ height: "100%" }}>
      {/* Version Menu Bar */}
      <div className="p-2 border-b flex flex-wrap gap-2 items-center">
        <span className="font-bold mr-2">Focus version:</span>
        <div className="join">
          {(versions || []).map((version) => (
            <button
              key={version.id}
              onClick={() => {
                // Directly focus on the version node
                focusNode(`version_${version.id}`);
              }}
              className="join-item btn btn-xs"
              title={`Jump to ${version.name || version.id}`}
            >
              {version.name || version.id.substring(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Label Filter Bar */}
      <div className="p-2 border-b flex flex-wrap gap-2 items-center">
        <span className="font-bold mr-2 flex items-center">
          Filter commits by labels:
        </span>
        <div className="flex flex-wrap gap-1">
          {(availableLabels || []).map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.name)}
              className={`btn btn-xs ${
                selectedLabels.includes(label.name)
                  ? "btn-active"
                  : "btn-outline"
              }`}
              title={`Filter by ${label.name}`}
            >
              {label.name}
            </button>
          ))}
          {selectedLabels.length > 0 && (
            <button
              onClick={clearLabelFilters}
              className="btn btn-xs btn-outline"
              title="Clear all label filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        className="flex-1"
        style={{
          height: "calc(100% - 84px)", // Adjusted for two menu bars
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={lixNodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "straight",
            style: { strokeWidth: 1.5 },
          }}
          connectionLineType={ConnectionLineType.Straight}
          onInit={(instance: any) => {
            reactFlowInstanceRef.current = instance;
            // Initial fit view
            setTimeout(() => {
              instance.fitView({
                padding: 0.2,
                includeHiddenNodes: false,
              });
            }, 100);
          }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
