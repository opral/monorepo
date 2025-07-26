import { jsonArrayFrom, type Lix } from "@lix-js/sdk";

/**
 * Selects all versions from the database
 */
export function selectVersions(lix: Lix) {
  return lix.db.selectFrom("version").selectAll();
}

/**
 * Selects all available labels
 */
export function selectAvailableLabels(lix: Lix) {
  return lix.db.selectFrom("label").select(["id", "name"]);
}

/**
 * Selects commits and their associated change sets with conditional filtering based on selected labels
 */
export function selectCommits(
  lix: Lix,
  selectedLabels: string[],
  availableLabels: { id: string; name: string }[]
) {
  return lix.db
    .selectFrom("commit")
    .innerJoin("change_set", "change_set.id", "commit.change_set_id")
    .$if(selectedLabels.length > 0, (eb) =>
      eb
        .leftJoin(
          "entity_label",
          "entity_label.entity_id",
          "commit.id"
        )
        .$if(true, (qb) =>
          qb.where((eb) =>
            eb.or([
              eb(
                "entity_label.label_id",
                "in",
                availableLabels?.map((l) => l.id) ?? []
              ),
              eb.exists(
                eb
                  .selectFrom("version")
                  .innerJoin("commit", "version.working_commit_id", "commit.id")
                  .whereRef(
                    "commit.change_set_id",
                    "=",
                    "change_set.id"
                  )
                  .select("version.id")
              ),
            ])
          )
        )
    )
    .select((eb) => [
      "commit.id",
      "commit.change_set_id",
      jsonArrayFrom(
        eb
          .selectFrom("entity_label")
          .innerJoin("label", "label.id", "entity_label.label_id")
          .where("entity_label.entity_id", "=", eb.ref("commit.id"))
          .select(["label.name", "label.id"])
      ).as("labels"),
    ]);
}

/**
 * Selects commit edges for the given commit IDs
 */
export function selectCommitEdges(lix: Lix, commitIds: string[]) {
  return lix.db
    .selectFrom("commit_edge")
    .where("parent_id", "in", commitIds)
    .where("child_id", "in", commitIds)
    .selectAll();
}

/**
 * Selects change set elements for a given change set ID
 */
export function selectChangeSetElements(lix: Lix, changeSetId: string) {
  return lix.db
    .selectFrom("change_set_element")
    .innerJoin("change", "change.id", "change_set_element.change_id")
    .where("change_set_element.change_set_id", "=", changeSetId)
    .select([
      "change_set_element.change_id",
      "change_set_element.entity_id",
      "change_set_element.schema_key",
      "change_set_element.file_id",
      "change.snapshot_content",
      "change.created_at",
    ])
    .orderBy("change.created_at", "desc");
}
