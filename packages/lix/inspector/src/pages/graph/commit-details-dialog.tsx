import { useState, useContext } from "react";
import { useQuery } from "@lix-js/react-utils";
import { ChevronDown, ChevronRight, ChevronLeft, ChevronRight as Next } from "lucide-react";
import type { ExtendedCommit } from "./index";
import { FloatingWindow } from "../../components/floating-window";
import { createPortal } from "react-dom";
import { Context } from "../../context";

interface CommitDetailsDialogProps {
  commit: ExtendedCommit;
  onClose: () => void;
}

export function CommitDetailsDialog({ commit, onClose }: CommitDetailsDialogProps) {
  const { rootContainer } = useContext(Context);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Fetch change set elements for the commit's change set
  const changeSetElements = useQuery((lix) =>
    lix.db
      .selectFrom("change_set_element")
      .innerJoin("change", "change.id", "change_set_element.change_id")
      .where("change_set_element.change_set_id", "=", commit.change_set_id)
      .select([
        "change_set_element.change_id",
        "change_set_element.entity_id",
        "change_set_element.schema_key",
        "change_set_element.file_id",
        "change.snapshot_content",
        "change.created_at",
      ])
      .orderBy("change.created_at", "desc")
  );

  // Fetch parent commit info
  const parentCommit = useQuery((lix) =>
    lix.db
      .selectFrom("commit_edge")
      .where("child_id", "=", commit.id)
      .innerJoin("commit", "commit.id", "commit_edge.parent_id")
      .select(["commit.id", "commit.change_set_id"])
  )?.at(0);

  // Fetch commit creation time from the underlying change
  const commitChange = useQuery((lix) =>
    lix.db
      .selectFrom("change")
      .where("change.id", "=", commit.lixcol_change_id)
      .select(["change.created_at"])
  )?.at(0);

  const toggleElement = (elementId: string) => {
    const newExpanded = new Set(expandedElements);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedElements(newExpanded);
  };

  const totalElements = changeSetElements?.length || 0;
  const totalPages = Math.ceil(totalElements / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalElements);
  const currentElements = changeSetElements?.slice(startIndex, endIndex) || [];

  // Format snapshot content for preview
  const getSnapshotPreview = (content: any) => {
    if (!content) return "null";
    const str = JSON.stringify(content);
    if (str.length > 50) {
      return str.substring(0, 47) + "...";
    }
    return str;
  };

  // Format full snapshot content
  const formatSnapshot = (content: any) => {
    if (!content) return "null";
    return JSON.stringify(content, null, 2);
  };

  // Create the window content
  const windowContent = (
    <FloatingWindow
      title={`Commit ${commit.id.substring(0, 20)}...`}
      isOpen={true}
      onClose={onClose}
      initialSize={{ width: 900, height: 800 }}
    >
      <div className="space-y-4">

        {/* Commit Information */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Commit Information</h4>
          <div className="bg-base-200 p-3 rounded">
            <div className="space-y-1 text-sm">
              <div className="flex">
                <span className="font-medium w-24">ID:</span>
                <span className="font-mono text-xs">{commit.id}</span>
              </div>
              {parentCommit && (
                <div className="flex">
                  <span className="font-medium w-24">Parent:</span>
                  <span className="font-mono text-xs text-primary cursor-pointer hover:underline">
                    {parentCommit.id}
                  </span>
                </div>
              )}
              {commit.labels && commit.labels.length > 0 && (
                <div className="flex">
                  <span className="font-medium w-24">Labels:</span>
                  <div className="flex gap-1">
                    {commit.labels.map((label, idx) => (
                      <span key={idx} className="badge badge-sm badge-primary">
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {commitChange && (
                <div className="flex">
                  <span className="font-medium w-24">Created:</span>
                  <span className="text-xs">
                    {new Date(commitChange.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Set Info */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">
            Change Set: <span className="font-mono text-xs">{commit.change_set_id}</span>
          </h4>
        </div>

        {/* Change Set Elements Table */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">
            Change Set Elements ({totalElements} total)
          </h4>
          <div className="overflow-x-auto">
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th>Schema Key</th>
                  <th>Entity ID</th>
                  <th>File</th>
                  <th>Snapshot Preview</th>
                  <th className="w-10 text-center"></th>
                </tr>
              </thead>
            <tbody>
              {currentElements.map((element) => {
                const isExpanded = expandedElements.has(element.change_id);
                return (
                  <>
                    <tr 
                      key={element.change_id} 
                      className="hover cursor-pointer transition-colors hover:bg-base-200"
                      onClick={() => toggleElement(element.change_id)}
                    >
                      <td>{element.schema_key}</td>
                      <td className="font-mono text-xs">{element.entity_id}</td>
                      <td>{element.file_id}</td>
                      <td className="font-mono text-xs">
                        {getSnapshotPreview(element.snapshot_content)}
                      </td>
                      <td>
                        <div className="flex justify-center text-base-content/50">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-base-200 p-3">
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Snapshot Content:</h5>
                            <pre className="text-xs overflow-x-auto bg-base-300 p-3 rounded">
                              {formatSnapshot(element.snapshot_content)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">
              [{startIndex + 1}-{endIndex} of {totalElements}]
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next <Next size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </FloatingWindow>
  );

  // Get the shadow root from the container
  const portalTarget = rootContainer?.shadowRoot;

  // Create the portal
  return createPortal(windowContent, portalTarget!);
}