import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { TagIcon, Radar } from "lucide-react";
import { useQuery } from "@lix-js/react-utils";
import { CommitDetailsWindow } from "./commit-details-window";

// Define a generic data structure for our Lix nodes
export interface LixNodeData {
  tableName: string; // e.g., 'change_set', 'version'
  entity: any;
  originalId?: string; // Added for version nodes to store original ID
  title?: string; // Custom title for the node
  isWorkingCommit?: boolean; // Flag to indicate if this is a working commit
  [key: string]: any;
}



// Commit Node Component
const CommitNode = ({ id, entity, title }: { id: string; entity: any; title?: string }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Fetch change count for this commit
  const changeSetElements = useQuery((lix) =>
    lix.db
      .selectFrom("change_set_element")
      .where("change_set_element.change_set_id", "=", entity.change_set_id)
      .select(lix.db.fn.count("change_set_element.change_id").as("count"))
  );

  const changeCount = changeSetElements?.[0]?.count || 0;

  return (
    <>
      <div className="card card-compact bg-base-100 shadow-sm min-w-[200px] text-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-sm capitalize border-b mb-2">{title || "commit"}</h3>
          <div className="space-y-1">
            {Object.entries(entity).map(([key, value]) => {
              // Skip rendering labels array and changeCount in the regular properties list
              if (
                key === "labels" ||
                key === "changeCount" ||
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

          {/* Display change count */}
          <div className="mt-2 flex items-center gap-1 text-neutral-600">
            <Radar className="h-3 w-3" />
            <span>{changeCount} changes</span>
          </div>

          {/* Display labels if they exist */}
          {entity.labels && entity.labels.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-neutral-600">
                <TagIcon className="h-3 w-3" />
                <span className="text-sm">
                  {entity.labels.map((label: { name: string }) => label.name).join(", ")}
                </span>
              </div>
            </div>
          )}

          <div className="mt-2">
            <button 
              className="btn btn-xs btn-ghost w-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              View Details
            </button>
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

      {/* Commit Details Window */}
      {showDetails && (
        <CommitDetailsWindow
          commit={entity}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

// Version Node Component
const VersionNode = ({ id, entity }: { id: string; entity: any }) => {
  return (
    <div className="card card-compact bg-base-100 shadow-sm min-w-[180px] text-sm">
      <div className="card-body p-4">
        <h3 className="card-title text-sm capitalize border-b mb-2">version</h3>
        <div className="space-y-1">
          {Object.entries(entity).map(([key, value]) => {
            // Hide lixcol properties and null/undefined/empty values
            if (key.startsWith('lixcol_') || value === null || value === undefined || value === "")
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
  const { tableName, entity, title } = data as LixNodeData;

  // Render the appropriate node type based on tableName
  if (tableName === "version") {
    return <VersionNode id={id} entity={entity} />;
  } else if (tableName === "commit") {
    return <CommitNode id={id} entity={entity} title={title} />;
  }

  // Fallback for any other node types
  return (
    <div className="card card-compact bg-base-100 shadow-sm min-w-[180px] text-sm">
      <div className="card-body p-4">
        <h3 className="card-title text-sm capitalize border-b mb-2">
          {title || tableName.replace("_", " ")}
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
