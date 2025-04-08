import { useLix } from "../../hooks/use-lix";
import {
  type ChangeSet,
  type ChangeSetEdge,
  type VersionV2,
} from "@lix-js/sdk";
import { useQuery } from "../../hooks/use-query";
import { ChangeSetGraph } from "./change-set-graph";

export default function Route() {
  const lix = useLix();

  const [versions] = useQuery<VersionV2[]>(async () => {
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

  const [changeSets] = useQuery<ChangeSet[]>(async () => {
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

  const [changeSetEdges] = useQuery<ChangeSetEdge[]>(async () => {
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

  console.log({
    versions,
    changeSets,
    changeSetEdges,
  });

  return (
    <div className="container mx-auto p-4">
      <ChangeSetGraph
        changeSets={changeSets ?? []}
        changeSetEdges={changeSetEdges ?? []}
        versions={versions ?? []}
      />
    </div>
  );
}
