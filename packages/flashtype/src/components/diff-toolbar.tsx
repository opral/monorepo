import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useKeyValue } from "@/key-value/use-key-value";
import { Diff as DiffIcon, X } from "lucide-react";
import { useQuery, useLix, useQueryTakeFirstOrThrow } from "@lix-js/react-utils";
import { switchVersion, selectVersionDiff, mergeVersion } from "@lix-js/sdk";
import { DiffIndicator } from "@/components/diff-indicator";

/**
 * Diff toolbar: minimal actions for the Diff view.
 *
 * - Shows source → target pair (active → main)
 * - Displays change counts and visual bars
 * - Merge button merges source into target, then switches to target and
 *   deletes the source version
 * - Exit closes diff mode
 *
 * @example
 * <DiffToolbar />
 */
export function DiffToolbar() {
  const lix = useLix();
  const [, setOpen] = useKeyValue("flashtype_diff_open", {
    defaultVersionId: "global",
    untracked: true,
  });

  // Resolve source (active version) and target (main)
  const source = useQueryTakeFirstOrThrow(({ lix }) =>
    lix.db
      .selectFrom("active_version")
      .innerJoin("version", "active_version.version_id", "version.id")
      .selectAll("version"),
  ) 

  const target = useQueryTakeFirstOrThrow(({ lix }) =>
    lix.db.selectFrom("version").where("name", "=", "main").selectAll().limit(1),
  ) 

  // Changes for the active file between source and target
  const diffRows = useQuery(({ lix }) => {
    return selectVersionDiff({ lix, source, target })
      .where(
        "diff.file_id",
        "=",
        lix.db
          .selectFrom("key_value")
          .where("key", "=", "flashtype_active_file_id")
          .select("value"),
      )
      .selectAll();
  });

  const total = Array.isArray(diffRows) ? diffRows.length : 0;
  const added = Array.isArray(diffRows)
    ? diffRows.filter((d: any) => d.status === "added" || d.status === "modified")
        .length
    : 0;
  const removed = Array.isArray(diffRows)
    ? diffRows.filter((d: any) => d.status === "removed").length
    : 0;

  const [merging, setMerging] = React.useState(false);

  async function onMerge() {
    if (!source || !target || merging || total === 0) return;
    try {
      setMerging(true);
      await mergeVersion({ lix, source: source, target: target});
      await switchVersion({ lix, to:  target });
      await lix.db.deleteFrom("version").where("id", "=", source.id).execute();
      await setOpen(false as any);
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="w-full min-w-0 shrink border-b bg-background">
      <div className="mx-auto flex h-10 min-w-0 shrink items-center justify-center gap-2 px-2 sm:px-4 flex-wrap overflow-y-auto">
        <div className="inline-flex items-center gap-2">
          <DiffIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{source?.name} → {target?.name}</span>
        </div>
        <Separator orientation="vertical" className="mx-2 h-5" />
        <DiffIndicator added={added} removed={removed} highRange={30} showCounts={true} />

        <div className="ml-auto" />
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-7 px-2"
          onClick={() => void onMerge()}
          disabled={merging || total === 0}
          aria-label="Merge into target"
        >
          {merging ? "Merging…" : "Merge"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setOpen(false as any)}
          aria-label="Exit diff"
          title="Exit diff"
        >
          <X className="h-4 w-4" />
          <span className="ml-1">Exit</span>
        </Button>
      </div>
    </div>
  );
}
