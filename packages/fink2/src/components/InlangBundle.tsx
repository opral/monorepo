import { createComponent } from "@lit/react";
import { InlangBundle as LitInlangBundle } from "@inlang/bundle-component"
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { projectAtom } from "../state.ts";
import { poll } from "../poll.ts";
import { Database, NestedBundle } from "@inlang/sdk2";
import { SelectQueryBuilder } from "kysely";

export const ReactBundle = createComponent({
  tagName: "inlang-bundle",
  elementClass: LitInlangBundle,
  react: React,
  events: {
    changeMessageBundle: "change-message-bundle",
    insertMessage: "insert-message",
    updateMessage: "update-message",

    insertVariant: "insert-variant",
    updateVariant: "update-variant",
    deleteVariant: "delete-variant",
    fixLint: "fix-lint",
  },
})

const InlangBundle = (props: { bundleId: string }) => {
  const [project] = useAtom(projectAtom);
  const [bundle, setBundle] = useState<NestedBundle | undefined>(undefined);

  const populateMessages = (bundleSelect: SelectQueryBuilder<Database, "bundle", object>) => {
    return bundleSelect.select((eb) => [
      // select all columns from bundle
      "id",
      "alias",
      // select all columns from messages as "messages"
      jsonArrayFrom(
        populateVariants(
          eb
            .selectFrom("message"))
          .whereRef("message.bundleId", "=", "bundle.id" as any)
      ).as("messages"),
    ])
  }

  const populateVariants = (
    messageSelect: SelectQueryBuilder<Database, "message", object>
  ) => {
    return messageSelect.select((eb) => [
      // select all columns from message
      "id",
      "bundleId",
      "locale",
      "declarations",
      "selectors",
      // select all columns from variants as "variants"
      jsonArrayFrom(
        eb
          .selectFrom("variant")
          .select(["id", "messageId", "match", "pattern"])
          .whereRef("variant.messageId", "=", "message.id")
      ).as("variants"),
    ])
  }

  const getBundleById = async (bundleId: string) => {
    // query the bundle by id and set it to the state
    if (!project) return
    populateMessages(project?.db.selectFrom("bundle"))
      .where("bundle.id", "=", bundleId)
      .execute()
      .then((bundle: any) => {
        setBundle(bundle);
        console.log("loadedBundle:", bundle);
      })
  }

  useEffect(() => {
    if (!project) return
    poll({
      every: 2000,
      fn: async () => {
        console.log("poll: " + props.bundleId)
        getBundleById(props.bundleId);
      }
    })
  }, [])

  return (
    <>
      {bundle && (
        <ReactBundle
          bundle={bundle}
          settings={project?.settings.get()}
        />
      )}
    </>
  )
}

export default InlangBundle;