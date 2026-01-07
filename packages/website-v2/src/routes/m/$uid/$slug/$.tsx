import { createFileRoute } from "@tanstack/react-router"
import MarketplacePage from "../../../../marketplace/MarketplacePage"
import { loadMarketplacePage } from "../../../../marketplace/marketplaceData"
import {
  buildMarketplaceTitle,
  extractOgMeta,
  extractTwitterMeta,
  buildMarketplaceJsonLd,
  buildMarketplaceBreadcrumbJsonLd,
  getMarketplaceSubpageTitle,
  extractMarkdownDescription,
  buildMarketplaceSoftwareJsonLd,
  buildMarketplaceArticleJsonLd,
} from "../../../../marketplace/seo"

export const Route = createFileRoute("/m/$uid/$slug/$")({
  loader: async ({ params }) =>
    loadMarketplacePage({
      uid: params.uid,
      slug: params.slug,
      splat: params._splat,
    }),
  head: ({ loaderData }) =>
    loaderData ? buildMarketplaceHead(loaderData) : {},
  component: () => {
    const data = Route.useLoaderData();
    if (!data) return null;
    return <MarketplacePage data={data} />;
  },
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
  const subpageTitle = getMarketplaceSubpageTitle({
    displayName,
    frontmatter: data.frontmatter,
    pagePath: data.pagePath,
    rawMarkdown: data.rawMarkdown,
  })
  const metaDescription =
    (data.frontmatter?.description as string | undefined) ||
    extractMarkdownDescription(data.rawMarkdown) ||
    description
  const ogMeta = extractOgMeta(data.frontmatter)
  const twitterMeta = extractTwitterMeta(data.frontmatter)
  const image =
    data.manifest.gallery && data.manifest.gallery.length > 0
      ? data.manifest.gallery[0]
      : "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg"
  const canonicalSlug = data.manifest.slug
    ? data.manifest.slug.replaceAll(".", "-")
    : data.manifest.id.replaceAll(".", "-")
  const itemPath = `/m/${data.manifest.uniqueID}/${canonicalSlug}`
  const canonicalPath =
    data.pagePath === "/" ? itemPath : `${itemPath}${data.pagePath}`
  const canonicalUrl = `https://inlang.com${canonicalPath}`
  const baseCanonicalUrl = `https://inlang.com${itemPath}`
  const jsonLd = buildMarketplaceJsonLd({
    displayName,
    description: metaDescription,
    canonicalUrl,
    image,
    frontmatter: data.frontmatter,
    pagePath: data.pagePath,
    rawMarkdown: data.rawMarkdown,
  })
  const breadcrumbJsonLd = buildMarketplaceBreadcrumbJsonLd({
    displayName,
    canonicalUrl,
    canonicalBaseUrl: baseCanonicalUrl,
    subpageTitle,
  })
  const articleJsonLd =
    subpageTitle &&
    buildMarketplaceArticleJsonLd({
      headline: subpageTitle,
      description: metaDescription,
      canonicalUrl,
      image,
    })
  const softwareJsonLd = buildMarketplaceSoftwareJsonLd({
    id: data.manifest.id,
    displayName,
    description: metaDescription,
    canonicalUrl,
    image,
    publisherName: data.manifest.publisherName,
    publisherLink: data.manifest.publisherLink,
    publisherIcon: data.manifest.publisherIcon,
    license: data.manifest.license,
    repository: data.manifest.repository,
    website: data.manifest.website,
    frontmatter: data.frontmatter,
  })

  return {
    links: [{ rel: "canonical", href: canonicalUrl }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd),
      },
      ...(articleJsonLd
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(articleJsonLd),
            },
          ]
        : []),
      ...(softwareJsonLd
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(softwareJsonLd),
            },
          ]
        : []),
    ],
    meta: [
      { title: pageTitle },
      { name: "description", content: metaDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: metaDescription },
      { property: "og:url", content: canonicalUrl },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "inlang" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: image },
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
