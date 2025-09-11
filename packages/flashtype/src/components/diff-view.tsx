import * as React from "react";
import { useKeyValue } from "@/key-value/use-key-value";
import { useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import { selectVersionDiff } from "@lix-js/sdk";
import { Diff } from "@/components/diff";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

type ViewMode = "unified" | "side-by-side";

/**
 * Read-only Diff View that mirrors editor layout and renders plugin-based diffs.
 * Base is 'main', head is the active version; scoped to the active file.
 *
 * @example
 * <DiffView />
 */
export function DiffView() {
  const [view] = useKeyValue("flashtype_diff_view", {
    defaultVersionId: "global",
    untracked: true,
  });
  const mode: ViewMode = (view as ViewMode) ?? "unified";

  const activeVersion = useQueryTakeFirst(({ lix }) =>
    lix.db.selectFrom("active_version").select(["version_id"]).limit(1),
  );
  const mainVersion = useQueryTakeFirst(({ lix }) =>
    lix.db
      .selectFrom("version")
      .where("name", "=", "main")
      .select(["id"]) // use concrete id string
      .limit(1),
  );

  // Build the diff query once both version ids are known
  const diffs = useQuery(({ lix }) => {
    const q = selectVersionDiff({
      lix,
      source: { id: (activeVersion!.version_id as unknown) as string }, // head
      target: { id: (mainVersion!.id as unknown) as string }, // base (main)
    })
      .where("diff.status", "!=", "unchanged")
      // Restrict to active file
      .where(
        "diff.file_id",
        "=",
        lix.db
          .selectFrom("key_value")
          .where("key", "=", "flashtype_active_file_id")
          .select("value"),
      )
      .orderBy("diff.entity_id")
      .innerJoin("change as after", "after.id", "after_change_id")
      .leftJoin("change as before", "before.id", "before_change_id")
      .where("after.plugin_key", "=", mdPlugin.key)
      .select([
        "diff.entity_id",
        "diff.schema_key",
        (eb) => eb.ref("after.plugin_key").as("plugin_key"),
        (eb) => eb.ref("before.snapshot_content").as("snapshot_content_before"),
        (eb) => eb.ref("after.snapshot_content").as("snapshot_content_after"),
      ]);

    return q;
  });

  const hasRows = Array.isArray(diffs) && (diffs?.length ?? 0) > 0;

  return (
    <div>
      <div className="w-full bg-background px-3 py-0">
        <div className="w-full max-w-5xl mx-auto">
          {!hasRows ? (
            <div className="text-sm text-muted-foreground p-3">
              No differences for this file between this version and main.
            </div>
          ) : (
            // Plugin-rendered diff component
            <Diff diffs={diffs as any} contentClassName={mode === "unified" ? "ProseMirror" : "ProseMirror"} />
          )}
        </div>
      </div>
    </div>
  );
}
