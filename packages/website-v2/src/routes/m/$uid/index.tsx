import { createFileRoute, redirect } from "@tanstack/react-router"
import { registry } from "@inlang/marketplace-registry"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

export const Route = createFileRoute("/m/$uid/")({
  loader: async ({ params }) => {
    const item = registry.find(
      (entry: any) => entry.uniqueID === params.uid
    ) as (MarketplaceManifest & { uniqueID: string }) | undefined

    if (!item) {
      throw redirect({ to: "/not-found" })
    }

    // Compute the canonical slug from the item
    const canonicalSlug = item.slug
      ? item.slug.replaceAll(".", "-")
      : item.id.replaceAll(".", "-")

    // Redirect to the full URL with the slug
    throw redirect({ to: `/m/${item.uniqueID}/${canonicalSlug}` })
  },
})

