import { useLix } from "../../hooks/use-lix";
import type { ChangeSet, ChangeSetEdge, VersionV2 } from "@lix-js/sdk";
import { ChangeSetGraph } from "./change-set-graph";
import { useQuery } from "../../hooks/use-query";
import { useMemo } from "react";

export default function Route() {
  const lix = useLix();

  // Fetch change sets
  const [changeSetsResult /* changeSetsLoading */, , changeSetsError] =
    useQuery<ChangeSet[]>(async () => {
      if (!lix) return [];
      try {
        const result = await lix.db
          .selectFrom("change_set")
          .selectAll()
          .execute();
        return result;
      } catch (error) {
        console.error("Error fetching change sets:", error);
        return [];
      }
    }, [lix]);

  // Fetch change set edges
  const [edgesResult /* edgesLoading */, , edgesError] = useQuery<
    ChangeSetEdge[]
  >(async () => {
    if (!lix) return [];
    try {
      const result = await lix.db
        .selectFrom("change_set_edge")
        .selectAll()
        .execute();
      return result;
    } catch (error) {
      console.error("Error fetching change set edges:", error);
      return [];
    }
  }, [lix]);

  // Fetch version_v2 data
  const [versionsResult, , versionsError] = useQuery<VersionV2[]>(async () => {
    if (!lix) return [];
    try {
      const result = await lix.db
        .selectFrom("version_v2")
        .selectAll()
        .execute();
      return result;
    } catch (error) {
      console.error("Error fetching versions:", error);
      return [];
    }
  }, [lix]);

  // Memoize the results to prevent unnecessary re-renders in ChangeSetGraph
  const memoizedChangeSets = useMemo(
    () => changeSetsResult,
    [changeSetsResult]
  );
  const memoizedEdges = useMemo(() => edgesResult, [edgesResult]);
  const memoizedVersions = useMemo(() => versionsResult, [versionsResult]);

  return (
    <div className="container mx-auto p-4">
      {/* Removed h1 header */}
      {/* Simplified loading/error handling based on Lix being local-first */}
      {!lix ? (
        <div>Loading Lix instance...</div>
      ) : changeSetsError ? (
        <div className="text-red-500">
          Error loading change sets: {changeSetsError.message}
        </div>
      ) : edgesError ? (
        <div className="text-red-500">
          Error loading change set edges: {edgesError.message}
        </div>
      ) : versionsError ? (
        <div className="text-red-500">
          Error loading versions: {versionsError.message}
        </div>
      ) : memoizedChangeSets && memoizedEdges && memoizedVersions ? (
        <ChangeSetGraph
          changeSets={memoizedChangeSets}
          edges={memoizedEdges}
          versions={memoizedVersions}
        />
      ) : // Show loading only if data hasn't arrived yet (results are undefined)
      changeSetsResult === undefined ||
        edgesResult === undefined ||
        versionsResult === undefined ? (
        <div>Loading graph data...</div>
      ) : (
        <div>No data available to render the graph.</div>
      )}
    </div>
  );
}
