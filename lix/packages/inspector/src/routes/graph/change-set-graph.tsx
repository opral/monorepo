import {
  ReactFlow,
  type Node,
  type Edge,
  MiniMap,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  Controls,
  Background,
  type NodeTypes,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css"; // Import styles
import { useMemo } from "react"; // Import useMemo
import type { ChangeSet, ChangeSetEdge, VersionV2 } from "@lix-js/sdk"; // Add VersionV2

// Define DATA interfaces for nodes
interface ChangeSetNodeData {
  changeSet: ChangeSet;
  highlighted: boolean;
  [key: string]: any; // Add index signature
}

interface VersionNodeData {
  version: VersionV2;
  [key: string]: any; // Add index signature
} // This interface structure implicitly satisfies Record<string, unknown>

interface ChangeSetGraphProps {
  changeSets: ChangeSet[];
  edges: ChangeSetEdge[];
  versions: VersionV2[]; // Accept VersionV2 array
  highlightedChangeSetIds?: string[];
}

export const ChangeSetGraph = ({
  changeSets,
  edges,
  versions, // Use VersionV2 array
  highlightedChangeSetIds = [],
}: ChangeSetGraphProps) => {
  // Calculate layout using useMemo to prevent infinite loops
  const { nodes, edges: layoutEdges } = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 50 });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Add nodes to Dagre
    changeSets.forEach((cs) => {
      const { width, height } = calculateChangeSetNodeDimensions(cs);
      dagreGraph.setNode(`cs_${cs.id}`, { label: cs.id, width, height });
    });
    versions.forEach((v) => {
      const { width, height } = calculateVersionNodeDimensions(v);
      dagreGraph.setNode(`v_${v.id}`, { label: v.id, width, height });
    });

    // Add edges to Dagre
    edges.forEach((edge) => {
      if (
        dagreGraph.hasNode(`cs_${edge.child_id}`) &&
        dagreGraph.hasNode(`cs_${edge.parent_id}`)
      ) {
        dagreGraph.setEdge(`cs_${edge.child_id}`, `cs_${edge.parent_id}`);
      }
    });
    versions.forEach((v) => {
      if (
        v.change_set_id &&
        dagreGraph.hasNode(`v_${v.id}`) &&
        dagreGraph.hasNode(`cs_${v.change_set_id}`)
      ) {
        dagreGraph.setEdge(`v_${v.id}`, `cs_${v.change_set_id}`);
      }
    });

    // Run Dagre layout
    dagre.layout(dagreGraph);

    // Map Dagre nodes to React Flow nodes
    const finalNodes: Node<ChangeSetNodeData | VersionNodeData>[] = [];
    changeSets.forEach((cs) => {
      const nodeWithPosition = dagreGraph.node(`cs_${cs.id}`);
      if (!nodeWithPosition) return;
      const isHighlighted = highlightedChangeSetIds.includes(cs.id as string);
      finalNodes.push({
        id: `cs_${cs.id}`,
        type: "changeSetNode", // Add type property
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
        data: { changeSet: cs, highlighted: isHighlighted },
        style: {
          opacity: isHighlighted || !highlightedChangeSetIds.length ? 1 : 0.3,
          width: nodeWithPosition.width,
          height: nodeWithPosition.height,
        },
      });
    });
    versions.forEach((v) => {
      const nodeWithPosition = dagreGraph.node(`v_${v.id}`);
      if (!nodeWithPosition) return;
      const isHighlighted =
        v.change_set_id && highlightedChangeSetIds.includes(v.change_set_id);
      finalNodes.push({
        id: `v_${v.id}`,
        type: "versionNode", // Add type property
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
        data: { version: v },
        style: {
          opacity: isHighlighted || !highlightedChangeSetIds.length ? 1 : 0.3,
          width: nodeWithPosition.width,
          height: nodeWithPosition.height,
        },
      });
    });

    // Map Dagre edges to React Flow edges
    const finalEdges: Edge[] = [];
    edges.forEach((edge) => {
      const sourceId = `cs_${edge.child_id}`;
      const targetId = `cs_${edge.parent_id}`;
      if (
        finalNodes.some((n) => n.id === sourceId) &&
        finalNodes.some((n) => n.id === targetId)
      ) {
        const isHighlighted =
          highlightedChangeSetIds.includes(edge.child_id as string) &&
          highlightedChangeSetIds.includes(edge.parent_id as string);
        finalEdges.push({
          id: `e_${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            strokeWidth: 1,
            opacity: isHighlighted || !highlightedChangeSetIds.length ? 1 : 0.3,
          },
        });
      }
    });
    versions.forEach((v) => {
      if (v.change_set_id) {
        const sourceId = `v_${v.id}`;
        const targetId = `cs_${v.change_set_id}`;
        if (
          finalNodes.some((n) => n.id === sourceId) &&
          finalNodes.some((n) => n.id === targetId)
        ) {
          const isHighlighted = highlightedChangeSetIds.includes(
            v.change_set_id
          );
          finalEdges.push({
            id: `e_${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            markerEnd: { type: MarkerType.ArrowClosed },
            type: "straight",
            style: {
              stroke: "#aaa",
              strokeWidth: 1,
              opacity:
                isHighlighted || !highlightedChangeSetIds.length ? 1 : 0.3,
            },
          });
        }
      }
    });

    return { nodes: finalNodes, edges: finalEdges };
  }, [changeSets, edges, versions, highlightedChangeSetIds]);

  // Define node types map using the created components
  const nodeTypes = {
    changeSetNode: ChangeSetNode,
    versionNode: VersionNode,
  } satisfies NodeTypes;

  return (
    <div style={{ height: "600px", border: "1px solid #ccc" }}>
      <ReactFlow
        nodes={nodes}
        edges={layoutEdges} // Use the calculated edges
        nodesDraggable={false} // Optional: make nodes non-draggable
        fitView // Automatically fit the view to the graph
        nodeTypes={nodeTypes} // Pass custom node types
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

// --- Custom Node Components ---

// ChangeSet Node (Simplified)
function ChangeSetNode({ id, data }: NodeProps) {
  // Cast data to the specific interface
  const { highlighted, changeSet } = data as ChangeSetNodeData;
  // Extract the original ID without the prefix for display
  const displayId = id.startsWith("cs_") ? id.substring(3) : id;
  return (
    <div
      className={`p-2 border rounded text-xs min-w-[120px] ${
        highlighted ? "border-blue-500 bg-blue-100" : "border-gray-400 bg-white"
      }`}
    >
      <div className="font-medium truncate" title={id}>
        CS: {displayId} {/* Maybe show changeSet.timestamp or change count? */}
      </div>
      {/* Add other change set details if needed */}
      {/* e.g., <div className="text-neutral-500">Timestamp: ...</div> */}
      {/* Handles for edges (React Flow connects based on node ID, prefix included) */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
    </div>
  );
}

// Version Node
function VersionNode({ id, data }: NodeProps) {
  // Cast data to the specific interface
  const { version } = data as VersionNodeData;
  // Extract the original ID without the prefix for display
  const displayId = id.startsWith("v_") ? id.substring(2) : id;
  // Use optional chaining and provide a fallback for potentially null name
  const versionName = version.name ?? "Unnamed";
  const displayVersionName =
    versionName.substring(0, 15) + (versionName.length > 15 ? "..." : "");
  return (
    <div className="p-2 border border-green-500 rounded bg-green-100 text-xs min-w-[100px]">
      <div className="font-medium truncate text-green-800" title={id}>
        Ver: {displayId}
      </div>
      <div className="text-green-700 truncate" title={versionName}>
        {displayVersionName}
      </div>
      {/* Handles for edges (React Flow connects based on node ID, prefix included) */}
      <Handle
        type="target" // Versions likely only targets, not sources in this model
        position={Position.Top}
        id={`${id}-target`}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
      <Handle
        type="source" // Source handle to point to change set
        position={Position.Bottom}
        id={`${id}-source`}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
    </div>
  );
}

// --- Node Dimension Calculations ---

// Simplified calculation - adjust as needed
const calculateChangeSetNodeDimensions = (cs: ChangeSet) => {
  const width = Math.max(100, (cs.id ? cs.id.length : 10) * 7 + 30); // Base width + ID length factor
  const height = 40; // Fixed height for simplicity
  return { width, height };
};

// Simplified calculation - adjust as needed
const calculateVersionNodeDimensions = (v: VersionV2) => {
  const width = Math.max(80, (v.id ? v.id.length : 10) * 7 + 25); // Base width + ID length factor
  const height = v.name ? 55 : 40; // Taller if name exists
  return { width, height };
};
