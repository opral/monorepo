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
import { useMemo, useCallback, useRef, useEffect } from "react";
import { type LixNodeData, lixNodeTypes } from "./nodes"; // Updated path
import type { ChangeSet, ChangeSetEdge, VersionV2 } from "@lix-js/sdk";

interface ChangeSetGraphProps {
  changeSets: ChangeSet[];
  changeSetEdges: ChangeSetEdge[];
  versions: VersionV2[];
}

export function ChangeSetGraph({
  changeSets,
  changeSetEdges,
  versions,
}: ChangeSetGraphProps) {
  const reactFlowInstanceRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate layout using useMemo to prevent infinite loops
  const { nodes, edges } = useMemo(() => {
    const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "TB",
      nodesep: 150, // Increased node separation
      ranksep: 100, // Add rank separation
      ranker: "network-simplex",
      marginx: 50,
      marginy: 50,
    });

    const changeSetNodeWidth = 170;
    const changeSetNodeHeight = 60;
    const versionNodeWidth = 150;
    const versionNodeHeight = 40;

    // Add nodes to the graph
    for (const cs of changeSets) {
      g.setNode(cs.id, {
        label: "change_set",
        width: changeSetNodeWidth,
        height: changeSetNodeHeight,
      });
    }

    for (const v of versions) {
      g.setNode(v.id, {
        label: "version_v2",
        width: versionNodeWidth,
        height: versionNodeHeight,
      });
    }

    // Add edges to the graph for layout calculation
    for (const cse of changeSetEdges) {
      g.setEdge(cse.parent_id, cse.child_id);
    }

    for (const v of versions) {
      g.setEdge(v.change_set_id, v.id);
    }

    // Calculate the layout
    dagre.layout(g);

    // Map Dagre nodes to React Flow nodes
    const nodes: Node<LixNodeData>[] = g.nodes().map((nodeId) => {
      const node = g.node(nodeId); // Get node for position
      const label = node.label;
      return {
        id: nodeId,
        type: "lixNode",
        position: { x: node.x - node.width / 2, y: node.y - node.height / 2 },
        data: {
          tableName: label,
          entity:
            versions.find((v) => v.id === nodeId) ??
            changeSets.find((cs) => cs.id === nodeId),
        },
        style: {
          border: "1px solid #ccc",
        },
      } as Node<LixNodeData>;
    });

    // Create edges with proper routing
    const allEdges: Edge[] = [];

    for (const cse of changeSetEdges) {
      allEdges.push({
        id: `e_${cse.parent_id}-${cse.child_id}`,
        source: cse.parent_id,
        target: cse.child_id,
        markerStart: { type: MarkerType.Arrow },
        type: "smoothstep", // Use smoothstep for curved edges
        animated: false,
      });
    }

    for (const v of versions) {
      allEdges.push({
        id: `ve_${v.id}_${v.change_set_id}`,
        source: v.change_set_id,
        target: v.id,
        markerStart: { type: MarkerType.Arrow },
        type: "smoothstep", // Use smoothstep for curved edges
        animated: false,
      });
    }

    return { nodes, edges: allEdges };
  }, [changeSets, changeSetEdges, versions]);

  // Refit view when container size changes or nodes change
  useEffect(() => {
    if (reactFlowInstanceRef.current) {
      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView({
          padding: 0.2,
          includeHiddenNodes: false,
        });
      }, 100);
    }
  }, [nodes]);

  // Function to focus on a specific node
  const focusNode = useCallback(
    (nodeId: string) => {
      const instance = reactFlowInstanceRef.current;
      if (!instance) return;

      // Find the node
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Center the view on the node with some zoom
      instance.setViewport(
        {
          x: -node.position.x + window.innerWidth / 2 - 85,
          y: -node.position.y + window.innerHeight / 2 - 30,
          zoom: 1.5,
        },
        { duration: 800 }
      );
    },
    [nodes]
  );

  return (
    <div className="flex flex-col h-full w-full" style={{ height: "100%" }}>
      {/* Version Menu Bar */}
      <div className="p-2 border-b flex flex-wrap gap-2 items-center">
        <span className="font-bold mr-2">Versions:</span>
        <div className="join">
          {versions.map((version) => (
            <button
              key={version.id}
              onClick={() => focusNode(version.id)}
              className="join-item btn btn-xs"
              title={`Jump to ${version.name || version.id}`}
            >
              {version.name || version.id.substring(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        className="flex-1"
        style={{
          height: "calc(100% - 42px)",
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
          onInit={(instance) => {
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
          {/* <MiniMap /> */}
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
