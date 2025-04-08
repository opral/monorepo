import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { ChangeSetElementsWindow } from "./change-set-elements-dialog";

// Define a generic data structure for our Lix nodes
export interface LixNodeData {
  tableName: string; // e.g., 'change_set', 'version_v2'
  entity: any;
  originalId?: string; // Added for version nodes to store original ID
  [key: string]: any;
}

// Change Set Node Component
const ChangeSetNode = ({ id, entity }: { id: string; entity: any }) => {
  return (
    <div className="card card-compact bg-base-100 shadow-sm min-w-[200px] text-sm">
      <div className="card-body p-4">
        <h3 className="card-title text-sm capitalize border-b mb-2">
          change set
        </h3>
        <div className="space-y-1">
          {Object.entries(entity).map(([key, value]) => {
            // Skip rendering labels array in the regular properties list
            if (
              key === "labels" ||
              value === null ||
              value === undefined ||
              value === ""
            )
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
                  className="badge badge-sm badge-outline"
                  title={label.name}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <ChangeSetElementsWindow changeSetId={entity.id} onClose={() => {}} />

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
    </div>
  );
};

// Version Node Component
const VersionNode = ({ id, entity }: { id: string; entity: any }) => {
  return (
    <div className="card card-compact bg-base-100 shadow-sm min-w-[180px] text-sm">
      <div className="card-body p-4">
        <h3 className="card-title text-sm capitalize border-b mb-2">
          version
        </h3>
        <div className="space-y-1">
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
    </div>
  );
};

// Generic Node Component that delegates to specialized components
const GenericLixNodeComponent = ({ id, data }: NodeProps) => {
  const { tableName, entity } = data as LixNodeData;

  // Render the appropriate node type based on tableName
  if (tableName === "change_set") {
    return <ChangeSetNode id={id} entity={entity} />;
  } else if (tableName === "version_v2") {
    return <VersionNode id={id} entity={entity} />;
  }

  // Fallback for any other node types
  return (
    <div className="card card-compact bg-base-100 shadow-sm min-w-[180px] text-sm">
      <div className="card-body p-4">
        <h3 className="card-title text-sm capitalize border-b mb-2">
          {tableName.replace("_", " ")}
        </h3>
        <div className="space-y-1">
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
    </div>
  );
};

// Memoize the component for performance
export const GenericLixNode = memo(GenericLixNodeComponent);

// Define the node type mapping
export const lixNodeTypes = {
  lixNode: GenericLixNode,
};
