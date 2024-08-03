import { createComponent } from "@lit/react";
import { InlangBundle as LitInlangBundle } from "@inlang/bundle-component"
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { projectAtom } from "../state.ts";
import { BundleNested } from "@inlang/sdk2";
import { getNestedBundleById } from "../helper/getNestedBundleById.ts";

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
  const [bundle, setBundle] = useState<BundleNested | undefined>(undefined);

  useEffect(() => {
    if (!project) return
    setTimeout(async () => {
			const bundle = await getNestedBundleById(
				project.db.selectFrom("bundle"),
				props.bundleId
			);
			setBundle(bundle);
		}, 2000);
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