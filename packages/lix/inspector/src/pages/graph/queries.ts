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
 * Selects change sets with conditional filtering based on selected labels
 */
export function selectChangeSets(
  lix: Lix,
  selectedLabels: string[],
  availableLabels: { id: string; name: string }[]
) {
  return lix.db
    .selectFrom("change_set")
    .$if(selectedLabels.length > 0, (eb) =>
      eb
        .leftJoin(
          "change_set_label",
          "change_set_label.change_set_id",
          "change_set.id"
        )
        .$if(true, (qb) =>
          qb.where((eb) =>
            eb.or([
              eb(
                "change_set_label.label_id",
                "in",
                availableLabels?.map((l) => l.id) ?? []
              ),
              eb.exists(
                eb
                  .selectFrom("version")
                  .whereRef(
                    "version.working_change_set_id",
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
      "id",
      jsonArrayFrom(
        eb
          .selectFrom("change_set_label")
          .innerJoin(
            "change_set_edge",
            "change_set_edge.child_id",
            "change_set.id"
          )
          .innerJoin("label", "label.id", "change_set_label.label_id")
          .where("change_set_label.change_set_id", "=", eb.ref("change_set.id"))
          .select(["label.name", "label.id"])
      ).as("labels"),
    ]);
}

/**
 * Selects change set edges for the given change set IDs
 */
export function selectChangeSetEdges(lix: Lix, changeSetIds: string[]) {
  return lix.db
    .selectFrom("change_set_edge")
    .where("parent_id", "in", changeSetIds)
    .where("child_id", "in", changeSetIds)
    .selectAll();
}
