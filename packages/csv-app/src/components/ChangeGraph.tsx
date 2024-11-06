import {
	ReactFlow,
	Node,
	Edge,
	MiniMap,
	NodeProps,
	Handle,
	Position,
	MarkerType,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { Change, ChangeGraphEdge, Snapshot } from "@lix-js/sdk";



export const ChangeGraph = (props: {
	changes: Array<Change & { snapshot_content: Snapshot["content"] }>;
	edges: ChangeGraphEdge[];
}) => {
	const dagreGraph = useMemo(
		() => new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})),
		[]
	);
	const { nodes, edges } = layoutElements(
		dagreGraph,
		props.changes,
		props.edges
	);
	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			nodesConnectable={false}
			fitView
			nodeTypes={{ row: Row }}
		>
			<MiniMap></MiniMap>
		</ReactFlow>
	);
};

/**
 * Layouting is required to calculate the position of the nodes and edges.
 */
const layoutElements = (
	dagreGraph: dagre.graphlib.Graph,
	changes: Array<Change & { snapshot_content: Snapshot["content"] }>,
	edges: ChangeGraphEdge[],
	direction: "TB" | "LR" = "TB"
) => {
	dagreGraph.setGraph({ rankdir: direction });

	for (const change of changes) {
		const dimensions = calculateNodeDimensions(
			change.snapshot_content?.text ?? "deleted"
		);
		dagreGraph.setNode(change.id, dimensions);
	}
	for (const edge of edges) {
		dagreGraph.setEdge(edge.child_id, edge.parent_id);
	}

	dagre.layout(dagreGraph);

	// need to map to node and edge type for the react flow component
	const nodesMappedToFlow = changes.map((change) => {
		const text = change.snapshot_content?.text;
		const nodeWithPosition = dagreGraph.node(change.id);
		return {
			id: change.id,
			data: { text },
			type: "row",
			position: {
				x: nodeWithPosition.x - nodeWithPosition.width / 2,
				y: nodeWithPosition.y - nodeWithPosition.height / 2,
			},
			style: {
				width: nodeWithPosition.width,
				height: nodeWithPosition.height,
			},
		} satisfies Node;
	});

	const edgesMappedToFlow = edges.map((edge) => {
		return {
			id: `${edge.parent_id}-${edge.child_id}`,
			source: edge.child_id,
			target: edge.parent_id,
			markerEnd: {
				type: MarkerType.ArrowClosed,
			},
		} satisfies Edge;
	});

	return { nodes: nodesMappedToFlow, edges: edgesMappedToFlow };
};

const calculateNodeDimensions = (text: string) => {
	const nodePadding = 20;
	const lines = text.split("\n");
	const width = Math.max(...lines.map((line) => line.length)) * 9 + nodePadding;
	const height = lines.length * 20 + nodePadding;
	return { width, height };
};

function Row({ id, data }: NodeProps<Node<{ text: string }>>) {
	return (
		<div className="p-2 flex items-center justify-center border-gray-400 border justify-between rounded">
			<div>
				{data.text ?? "deleted"}
				<p className="mt-1 text-gray-300 text-xs">{id}</p>
			</div>
			<Handle
				style={{ visibility: "hidden" }}
				type="target"
				position={Position.Top}
			/>
			<Handle
				style={{ visibility: "hidden" }}
				type="source"
				position={Position.Bottom}
			/>
		</div>
	);
}
