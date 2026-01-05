import { createFileRoute } from "@tanstack/react-router"
import MarketplacePage from "../../../../marketplace/MarketplacePage"
import { loadMarketplacePage } from "../../../../marketplace/marketplaceData"
import {
  buildMarketplaceTitle,
  extractOgMeta,
  extractTwitterMeta,
} from "../../../../marketplace/seo"

export const Route = createFileRoute("/m/$uid/$slug/$")({
  loader: async ({ params }) =>
    loadMarketplacePage({
      uid: params.uid,
      slug: params.slug,
      splat: params._splat,
    }),
  head: ({ loaderData }) => buildMarketplaceHead(loaderData),
  component: () => <MarketplacePage data={Route.useLoaderData()} />,
})

function buildMarketplaceHead(data: Awaited<ReturnType<typeof loadMarketplacePage>>) {
  const displayName =
    typeof data.manifest.displayName === "object"
      ? data.manifest.displayName.en
      : data.manifest.displayName
  const description =
    typeof data.manifest.description === "object"
      ? data.manifest.description.en
      : data.manifest.description
  const pageTitle = buildMarketplaceTitle({
    displayName,
    frontmatter: data.frontmatter,
    pagePath: data.pagePath,
    rawMarkdown: data.rawMarkdown,
  })
  const metaDescription =
    (data.frontmatter?.description as string | undefined) || description
  const ogMeta = extractOgMeta(data.frontmatter)
  const twitterMeta = extractTwitterMeta(data.frontmatter)
  const image =
    data.manifest.gallery && data.manifest.gallery.length > 0
      ? data.manifest.gallery[0]
      : "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg"

  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: metaDescription },
      { name: "og:title", content: pageTitle },
      { name: "og:description", content: metaDescription },
      { name: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: image },
      {
        name: "twitter:image:alt",
        content: "inlang's ecosystem helps organizations to go global.",
      },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: metaDescription },
      { name: "twitter:site", content: "@inlanghq" },
      { name: "twitter:creator", content: "@inlanghq" },
      ...ogMeta,
      ...twitterMeta,
    ],
  }
}
