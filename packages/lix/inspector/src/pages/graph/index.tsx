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
      rankdir: "BT", // Bottom to top layout - version at bottom pointing up
      nodesep: 300, // Horizontal separation between nodes
      ranksep: 150, // Increased vertical separation between ranks
      ranker: "network-simplex", // Better for complex graphs
      marginx: 50,
      marginy: 50,
      edgesep: 50, // Separation between edges
    });

    const commitNodeWidth = 170;
    const commitNodeHeight = 60;
    const versionNodeWidth = 150;
    const versionNodeHeight = 40;
    const changeSetNodeWidth = 180; // Slightly larger for working change sets
    const changeSetNodeHeight = 70;

    // Add nodes to the graph for commits
    for (const commit of commits || []) {
      g.setNode(commit.id, {
        label: "commit",
        width: commitNodeWidth,
        height: commitNodeHeight,
      });
    }

    // Collect all unique working change sets from versions
    const workingChangeSets = new Set<string>();
    for (const v of versions || []) {
      if (v.working_change_set_id) {
        workingChangeSets.add(v.working_change_set_id);
      }
    }

    // Add nodes for working change sets
    for (const changeSetId of workingChangeSets) {
      g.setNode(`working_changeset_${changeSetId}`, {
        label: "working_change_set",
        width: changeSetNodeWidth,
        height: changeSetNodeHeight,
        customData: { originalId: changeSetId },
      });
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
      });
    }

    // Add edges to the graph for layout calculation
    for (const commitEdge of commitEdges || []) {
      // Only add edges if both nodes exist in the filtered set
      if (
        (commits || []).some((commit) => commit.id === commitEdge.parent_id) &&
        (commits || []).some((commit) => commit.id === commitEdge.child_id)
      ) {
        g.setEdge(commitEdge.parent_id, commitEdge.child_id);
      }
    }

    for (const v of versions || []) {
      const versionNodeId = `version_${v.id}`;
      
      // Add edge from version to its commit
      if ((commits || []).some((commit) => commit.id === v.commit_id)) {
        g.setEdge(versionNodeId, v.commit_id);
      }
      
      // Add edge from version to its working change set
      if (v.working_change_set_id && workingChangeSets.has(v.working_change_set_id)) {
        g.setEdge(versionNodeId, `working_changeset_${v.working_change_set_id}`);
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
      } else if (nodeId.startsWith("working_changeset_")) {
        // For working change set nodes, create a synthetic entity
        const nodeAny = node as any;
        originalId = nodeAny.customData?.originalId;
        entity = {
          id: originalId,
          type: "working_change_set",
        };
      } else {
        // For commit nodes, find directly
        entity = (commits || []).find((commit) => commit.id === nodeId);
      }

      // Create the node with proper typing
      return {
        id: nodeId,
        type: "lixNode",
        position: { x: node.x - node.width / 2, y: node.y - node.height / 2 },
        data: {
          tableName: label === "working_change_set" ? "change_set" : label,
          entity: entity,
          originalId: originalId,
          title: label === "commit" ? "commit" : 
                 label === "working_change_set" ? "working change set" : "version",
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
        allEdges.push({
          id: `e_${commitEdge.parent_id}-${commitEdge.child_id}`,
          source: commitEdge.parent_id,
          target: commitEdge.child_id,
          markerEnd: { type: MarkerType.Arrow }, // Arrow at the end (target)
          type: "smoothstep", // Use smoothstep for curved edges
          animated: false,
        });
      }
    }

    for (const v of versions || []) {
      const versionNodeId = `version_${v.id}`;
      
      // Add edge from version to its commit
      if ((commits || []).some((commit) => commit.id === v.commit_id)) {
        allEdges.push({
          id: `ve_${v.id}_${v.commit_id}`,
          source: v.commit_id,
          target: versionNodeId,
          markerStart: { type: MarkerType.Arrow },
          type: "smoothstep",
          animated: false,
        });
      }
      
      // Add edge from version to its working change set
      if (v.working_change_set_id && nodes.some(n => n.id === `working_changeset_${v.working_change_set_id}`)) {
        allEdges.push({
          id: `ve_wcs_${v.id}_${v.working_change_set_id}`,
          source: `working_changeset_${v.working_change_set_id}`,
          target: versionNodeId,
          markerStart: { type: MarkerType.Arrow },
          type: "smoothstep",
          animated: false,
          style: { strokeDasharray: "5 5" }, // Dashed line for working change set
        });
      }
    }

    return { nodes, edges: allEdges };
  }, [commits, commitEdges, versions]);

  // Function to focus on a specific node
  const focusNode = useCallback(
    (nodeId: string) => {
      const instance = reactFlowInstanceRef.current;
      if (!instance) return;

      console.log("Focusing on node:", nodeId);

      // Find the node
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        console.warn(`Node with ID ${nodeId} not found in graph`);
        return;
      }

      console.log("Found node:", node);
      console.log("Node position:", node.position);

      // Use fitView to focus on a specific node
      setTimeout(() => {
        instance.fitView({
          padding: 0.5,
          includeHiddenNodes: false,
          nodes: [node],
          duration: 800,
        });

        // Add a visual highlight to the focused node
        const updatedNodes = nodes.map((n: Node<LixNodeData>) => ({
          ...n,
          style: {
            ...n.style,
            boxShadow:
              n.id === nodeId
                ? "0 0 15px 5px rgba(66, 153, 225, 0.6)"
                : undefined,
            zIndex: n.id === nodeId ? 1000 : undefined,
          },
        }));

        // Update nodes with highlight
        instance.setNodes(updatedNodes);
      }, 50);
    },
    [nodes]
  );

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
                console.log("Version button clicked:", version);
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
          Filter by labels:
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
            type: "smoothstep",
            style: { strokeWidth: 1.5 },
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
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
