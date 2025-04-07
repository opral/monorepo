import {
  ReactFlow,
  type Node,
  type Edge,
  MiniMap,
  MarkerType,
  Controls,
  Background,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { type LixNodeData, lixNodeTypes } from "./nodes"; // Updated path

interface ChangeSetGraphProps {
  changeSets: any[];
  edges: any[];
  versions: any[];
}

export function ChangeSetGraph({
  changeSets,
  edges,
  versions,
}: ChangeSetGraphProps) {
  // Calculate layout using useMemo to prevent infinite loops
  const { nodes, edges: layoutEdges } = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({})); // Setup default edge label function
    // Increase vertical separation (ranksep), decrease horizontal (nodesep)
    dagreGraph.setGraph({ rankdir: "TB", nodesep: 10, ranksep: 100 });

    // Create maps for efficient lookups
    const changeSetMap = new Map(changeSets.map((cs) => [cs.id, cs]));
    const versionMap = new Map(versions.map((v) => [v.id, v]));

    // Fixed node dimensions (can be dynamic later)
    const changeSetNodeWidth = 170;
    const changeSetNodeHeight = 60;
    const versionNodeWidth = 150;
    const versionNodeHeight = 40;

    // Add nodes to Dagre
    changeSets.forEach((cs) => {
      dagreGraph.setNode(cs.id, {
        width: changeSetNodeWidth,
        height: changeSetNodeHeight,
      });
    });
    versions.forEach((v) => {
      dagreGraph.setNode(v.id, {
        width: versionNodeWidth,
        height: versionNodeHeight,
      });
    });

    // Run Dagre layout
    dagre.layout(dagreGraph);

    // Map Dagre nodes to React Flow nodes
    const finalNodes: Node<LixNodeData>[] = dagreGraph.nodes().map((nodeId) => {
      // Use maps for type checking and entity lookup
      const isVersionNode = versionMap.has(nodeId);
      const originalEntity = isVersionNode
        ? versionMap.get(nodeId)
        : changeSetMap.get(nodeId);

      if (!originalEntity) {
        console.warn(`Could not find original entity for node ID: ${nodeId}`);
        // Return a placeholder or handle error appropriately
        const node = dagreGraph.node(nodeId); // Get node for position even if entity missing
        return {
          id: nodeId,
          type: "lixNode",
          // Position adjustments might be needed based on node anchor point
          position: {
            x: node?.x - (node?.width ?? changeSetNodeWidth) / 2,
            y: node?.y - (node?.height ?? changeSetNodeHeight) / 2,
          }, // Center position, fallback dimensions
          data: {
            tableName: "error",
            entity: { id: nodeId, error: "Original entity not found" },
          },
        } as Node<LixNodeData>; // Type assertion needed here
      }

      const node = dagreGraph.node(nodeId); // Get node for position
      return {
        id: nodeId,
        type: "lixNode",
        position: { x: node.x - node.width / 2, y: node.y - node.height / 2 },
        data: {
          tableName: isVersionNode ? "version_v2" : "change_set",
          entity: originalEntity,
        },
        style: {
          border: "1px solid #ccc",
          // Add other styles if needed
        },
      } as Node<LixNodeData>; // Type assertion needed here
    });

    // Build edges directly from input data
    const finalEdges: Edge[] = [];

    // Add edges based on the ChangeSetEdge data (before -> after)
    edges.forEach((e) => {
      finalEdges.push({
        id: `e_${e.before_change_set_id}-${e.after_change_set_id}`, // Use original IDs in edge ID
        source: e.before_change_set_id, // Use original ID
        target: e.after_change_set_id, // Use original ID
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    });

    // Add edges from versions to their change sets
    versions.forEach((v) => {
      if (v.change_set_id) {
        finalEdges.push({
          id: `ve_${v.id}_${v.change_set_id}`, // Use original IDs in edge ID
          source: v.id,
          target: v.change_set_id,
          style: { stroke: "#cccccc", strokeDasharray: "5 5" },
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#cccccc" },
        });
      }
    });

    return { nodes: finalNodes, edges: finalEdges };
  }, [changeSets, edges, versions]);

  return (
    <div style={{ height: "800px", width: "100%", border: "1px solid #eee" }}>
      <ReactFlow nodes={nodes} edges={layoutEdges} nodeTypes={lixNodeTypes}>
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
