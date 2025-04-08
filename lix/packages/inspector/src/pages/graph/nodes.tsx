import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { ChangeSetElementsDialog } from "./change-set-elements-dialog";

// Define a generic data structure for our Lix nodes
export interface LixNodeData {
  tableName: string; // e.g., 'change_set', 'version_v2'
  entity: any;
  id: string;
  position: { x: number; y: number };
  data: any;
  [key: string]: any;
}

// Change Set Node Component
const ChangeSetNode = ({ id, entity }: { id: string; entity: any }) => {
  return (
    <div className="p-2 border rounded text-xs min-w-[170px] bg-white">
      <div className="font-bold border-b mb-1 capitalize">
        change set
      </div>
      <div className="space-y-0.5">
        {Object.entries(entity).map(([key, value]) => {
          // Skip rendering labels array in the regular properties list
          if (key === "labels" || value === null || value === undefined || value === "")
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
      
      {/* Display labels if they exist */}
      {entity.labels && entity.labels.length > 0 && (
        <div className="mt-2 pt-1 border-t">
          <div className="flex flex-wrap gap-1">
            {entity.labels.map((label: { name: string }, index: number) => (
              <span
                key={index}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded border"
                title={label.name}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <ChangeSetElementsDialog changeSetId={entity.id} onClose={() => {}} />
      
      {/* Handles for connections */}
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

// Version Node Component
const VersionNode = ({ id, entity }: { id: string; entity: any }) => {
  return (
    <div className="p-2 border rounded text-xs min-w-[150px] bg-white">
      <div className="font-bold border-b mb-1 capitalize">
        version
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
      
      {/* Handles for connections */}
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

// Generic Node Component that delegates to specialized components
const GenericLixNodeComponent = ({ id, data }: NodeProps<LixNodeData>) => {
  const { tableName, entity } = data as LixNodeData;

  // Render the appropriate node type based on tableName
  if (tableName === "change_set") {
    return <ChangeSetNode id={id} entity={entity} />;
  } else if (tableName === "version_v2") {
    return <VersionNode id={id} entity={entity} />;
  }

  // Fallback for any other node types
  return (
    <div className="p-2 border rounded text-xs min-w-[150px] bg-white">
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

      {/* Handles for connections */}
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
