import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { ChangeSetElementsDialog } from "./change-set-elements-dialog";

// Define a generic data structure for our Lix nodes
export interface LixNodeData {
  tableName: string; // e.g., 'change_set', 'version', 'label'
  entity: any;
  id: string;
  position: { x: number; y: number };
  data: any;
  [key: string]: any;
}

// Define the generic node component
const GenericLixNodeComponent = ({ id, data }: NodeProps<LixNodeData>) => {
  const { tableName, entity } = data as LixNodeData;

  return (
    <div className={`p-2 border rounded text-xs min-w-[150px] bg-white`}>
      <div className="font-bold border-b mb-1 capitalize">
        {tableName.replace("_", " ")}
      </div>
      <div className="space-y-0.5">
        {Object.entries(entity).map(([key, value]) => {
          if (value === null || value === undefined || value === "")
            return null;
          const displayValue =
            typeof value === "string"
              ? value.substring(0, 20) + (value.length > 20 ? "..." : "")
              : String(value);

          return (
            <div key={key} className="flex justify-between text-neutral-600">
              <span className="font-medium mr-2">{key}:</span>
              <span title={String(value)} className="truncate">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
      {tableName === "change_set" && (
        <ChangeSetElementsDialog changeSetId={entity.id} onClose={() => {}} />
      )}
      {/* Standard hidden handles */}
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
};

// Memoize the component for performance
export const GenericLixNode = memo(GenericLixNodeComponent);

// Define the node type mapping
export const lixNodeTypes = {
  lixNode: GenericLixNode,
};
