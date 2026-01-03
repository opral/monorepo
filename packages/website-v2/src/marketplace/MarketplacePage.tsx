import { Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { MarketplacePageData } from "./marketplaceData"
import "../components/markdown-interactive"

type Heading = { id: string; text: string; level: number }

export default function MarketplacePage({
  data,
}: {
  data: MarketplacePageData
}) {
  const articleRef = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    if (!data.imports || data.imports.length === 0) return
    data.imports.forEach((url) => {
      import(/* @vite-ignore */ url)
    })
  }, [data.imports])

  useEffect(() => {
    const container = articleRef.current
    if (!container) return
    const elements = Array.from(
      container.querySelectorAll("h1, h2, h3")
    ) as HTMLElement[]
    const newHeadings = elements.map((element) => {
      const id = slugifyHeading(element.textContent || "")
      element.id = id
      return {
        id,
        text: element.textContent || "",
        level: Number.parseInt(element.tagName.replace("H", ""), 10),
      }
    })
    setHeadings(newHeadings)
  }, [data.markdown])

  return (
    <>
      <ProductHeader manifest={data.manifest} />
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex gap-6">
          <aside className="sticky top-[154px] hidden h-[calc(100vh-154px)] w-56 flex-shrink-0 lg:block">
            <div className="h-full overflow-y-auto pb-8 pr-2 pt-4">
              <DocNav manifest={data.manifest} currentRoute={data.pagePath} />
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <div
              ref={articleRef}
              className="marketplace-markdown pt-4 pb-2.5"
              onMouseDown={(event) => {
                const anchor = (event.target as HTMLElement).closest("a")
                if (anchor?.getAttribute("href")?.startsWith("#")) {
                  event.preventDefault()
                }
              }}
              dangerouslySetInnerHTML={{ __html: data.markdown }}
            />

            <div className="mt-16 rounded-xl border border-slate-200 bg-slate-50 px-6 py-6">
              <p className="text-lg font-semibold text-slate-900">
                Do you have questions?
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Join the community on Discord and we will help you out.
              </p>
              <a
                href="https://discord.gg/gdMPPWy57R"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Join Discord
              </a>
            </div>

            {data.recommends && data.recommends.length > 0 ? (
              <div className="mt-16">
                <h3 className="text-lg font-semibold text-slate-900">
                  Recommended
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {data.recommends.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="sticky top-[154px] hidden h-[calc(100vh-154px)] w-56 flex-shrink-0 xl:block">
            <div className="h-full overflow-y-auto pb-8 pl-2 pt-4">
              <DocMeta
                manifest={data.manifest}
                headings={headings}
                pagePath={data.pagePath}
              />
            </div>
          </aside>
        </div>
        </div>
      </div>
    </>
  )
}

function ProductHeader({ manifest }: { manifest: MarketplaceManifest }) {
  const displayName =
    typeof manifest.displayName === "object"
      ? manifest.displayName.en
      : manifest.displayName
  const isInstallable =
    manifest.id.includes("plugin.") || manifest.id.includes("messageLintRule.")
  const badge = typeOfIdToTitle(manifest.id)

  return (
    <div className="sticky top-[96px] z-40 border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {manifest.icon ? (
            <img
              src={manifest.icon}
              alt={displayName}
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
              {displayName[0]}
            </div>
          )}
          <h2 className="text-sm font-semibold text-slate-900">
            {displayName}
          </h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
            {badge}
          </span>
        </div>
        {manifest.website ? (
          <a
            href={manifest.website}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {isInstallable ? "Install" : "Open"}
          </a>
        ) : null}
      </div>
    </div>
  )
}

function DocNav({
  manifest,
  currentRoute,
}: {
  manifest: MarketplaceManifest & { uniqueID: string }
  currentRoute: string
}) {
  if (!manifest.pages) return null
  const basePath = manifest.slug
    ? `/m/${manifest.uniqueID}/${manifest.slug}`
    : `/m/${manifest.uniqueID}/${manifest.id.replaceAll(".", "-")}`

  // Normalize pages structure: convert flat structure to sectioned structure
  const normalizedSections: Array<{
    title: string
    pages: Array<{ route: string; path: string; isExternal: boolean }>
  }> = []

  const entries = Object.entries(manifest.pages)
  const flatPages: Array<{ route: string; path: string; isExternal: boolean }> = []

  for (const [key, value] of entries) {
    if (typeof value === "string") {
      // Flat structure - collect into overview section
      flatPages.push({
        route: key,
        path: value,
        isExternal: !value.endsWith(".md") && !value.endsWith(".html"),
      })
    } else {
      // Nested structure - use key as section title (empty string becomes "Overview")
      const sectionTitle = key || "Overview"
      normalizedSections.push({
        title: sectionTitle,
        pages: Object.entries(value).map(([route, path]) => ({
          route,
          path: path as string,
          isExternal:
            !(path as string).endsWith(".md") &&
            !(path as string).endsWith(".html"),
        })),
      })
    }
  }

  // If we collected flat pages, add them as the first "Overview" section
  if (flatPages.length > 0) {
    normalizedSections.unshift({ title: "Overview", pages: flatPages })
  }

  return (
    <div>
      <div className="flex flex-col gap-1 text-sm text-slate-700">
        {normalizedSections.map((section, index) => (
          <div key={section.title} className={index === 0 ? "" : "pt-4"}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
            <div className="flex flex-col gap-1">
              {section.pages.map(({ route, path, isExternal }) => {
                const navTitle = route.split("/").pop() || "Introduction"
                const href = isExternal ? path : basePath + route
                const isActive = currentRoute === route

                return isExternal ? (
                  <a
                    key={route}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md px-3 py-2 text-sm capitalize text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {navTitle.replaceAll("-", " ")}
                  </a>
                ) : (
                  <Link
                    key={route}
                    to={href}
                    className={`rounded-md px-3 py-2 text-sm capitalize transition-colors ${
                      isActive
                        ? "bg-slate-200 font-semibold text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {navTitle.replaceAll("-", " ")}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DocMeta({
  manifest,
  headings,
  pagePath,
}: {
  manifest: MarketplaceManifest & { uniqueID: string }
  headings: Heading[]
  pagePath: string
}) {
  const githubLink = getGithubLink(manifest, pagePath)
  const displayName =
    typeof manifest.displayName === "object"
      ? manifest.displayName.en
      : manifest.displayName

  const authorContent = (
    <>
      {manifest.publisherIcon ? (
        <img
          src={manifest.publisherIcon}
          alt={manifest.publisherName}
          className="h-7 w-7 rounded-full"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {displayName[0]}
        </div>
      )}
      <span className="font-semibold">{manifest.publisherName}</span>
    </>
  )

  return (
    <div className="text-sm text-slate-700">
      <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Author
      </p>
      {manifest.publisherLink ? (
        <a
          href={manifest.publisherLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
        >
          {authorContent}
        </a>
      ) : (
        <div className="flex items-center gap-2 text-slate-700">
          {authorContent}
        </div>
      )}

      <div className="my-4 h-px w-full bg-slate-200" />

      <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Meta information
      </p>
      <div className="flex items-center gap-2 text-slate-600">
        <span className="text-slate-500">License</span>
        <span className="font-medium text-slate-800">{manifest.license}</span>
      </div>
      {manifest.pricing ? (
        <div className="mt-2 flex items-center gap-2 text-slate-600">
          <span className="text-slate-500">Pricing</span>
          <span className="font-medium text-slate-800">{manifest.pricing}</span>
        </div>
      ) : null}

      {manifest.keywords && manifest.keywords.length > 0 ? (
        <>
          <div className="my-4 h-px w-full bg-slate-200" />
          <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {manifest.keywords.map((keyword) => (
              <Link
                key={keyword}
                to={`/search?q=${encodeURIComponent(keyword)}`}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <div className="my-4 h-px w-full bg-slate-200" />
      {githubLink ? (
        <a
          href={githubLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          Edit this page on GitHub
        </a>
      ) : null}

      {headings.length > 0 ? (
        <>
          <div className="my-4 h-px w-full bg-slate-200" />
          <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            On this page
          </p>
          <div className="flex flex-col gap-2">
            {headings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                className={`text-left text-sm text-slate-600 hover:text-slate-900 ${
                  heading.level === 3 ? "pl-3" : heading.level === 2 ? "pl-2" : ""
                }`}
                onClick={() => scrollToAnchor(heading.id)}
              >
                {heading.text}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function RecommendationCard({
  item,
}: {
  item: MarketplaceManifest & { uniqueID?: string }
}) {
  const displayName =
    typeof item.displayName === "object" ? item.displayName.en : item.displayName
  const description =
    typeof item.description === "object" ? item.description.en : item.description
  const slug = item.id.replaceAll(".", "-")
  const href = `/m/${(item as any).uniqueID}/${slug}`

  return (
    <Link
      to={href}
      className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {item.icon ? (
          <img
            src={item.icon}
            alt={displayName}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-white">
            {displayName[0]}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  )
}

function typeOfIdToTitle(id: string) {
  if (id.includes("plugin.")) return "Plugin"
  if (id.includes("messageLintRule.")) return "Lint Rule"
  if (id.includes("library.")) return "Library"
  if (id.includes("app.")) return "App"
  return "Product"
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("/", "")
    .replace("#", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("?", "")
    .replaceAll(".", "")
    .replaceAll("@", "")
    .replaceAll(
      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
      ""
    )
    .replaceAll("✂", "")
    .replaceAll(":", "")
    .replaceAll("'", "")
}

function scrollToAnchor(anchor: string) {
  const element = document.getElementById(anchor)
  if (element && window) {
    window.scrollTo({
      top: element.offsetTop - 210,
      behavior: "smooth",
    })
  }
}

function getGithubLink(
  manifest: MarketplaceManifest,
  currentRoute: string
): string | undefined {
  let link: string | undefined
  if (manifest.pages) {
    for (const [key, value] of Object.entries(manifest.pages)) {
      if (typeof value === "string" && key === currentRoute) {
        link = value
      } else if (typeof value === "object") {
        for (const [route, path] of Object.entries(value)) {
          if (route === currentRoute) {
            link = path as string
          }
        }
      }
    }
  } else {
    link =
      typeof manifest.readme === "object"
        ? manifest.readme.en
        : manifest.readme
  }

  const isExternal = link?.includes("http")

  if (isExternal) {
    if (link?.includes("https://github.com")) {
      return link
    }
    if (link?.includes("raw.githubusercontent.com")) {
      return link
        .replace("raw.githubusercontent.com", "github.com")
        .replace("refs/heads", "blob")
    }
    if (link?.includes("https://cdn.jsdelivr.net/gh/")) {
      const owner = link.replace("https://cdn.jsdelivr.net/gh/", "").split("/")[0]
      const repoPart = link.replace("https://cdn.jsdelivr.net/gh/", "").split("/")[1]
      const repo = repoPart?.includes("@")
        ? repoPart.split("@")[0]
        : repoPart
      const rest = link
        .replace("https://cdn.jsdelivr.net/gh/", "")
        .split("/")
        .slice(2)
        .join("/")
      return `https://github.com/${owner}/${repo}/blob/main/${rest}`
    }
    if (link?.includes("https://cdn.jsdelivr.net/npm/")) {
      return undefined
    }
  }

  if (!link) return undefined
  return `https://github.com/opral/monorepo/blob/main/${link.replace("./", "")}`
}

function flattenPages(
  pages: Record<string, string> | Record<string, Record<string, string>>
) {
  const flatPages: Record<string, string> = {}
  for (const [key, value] of Object.entries(pages)) {
    if (typeof value === "string") {
      flatPages[key] = value
    } else {
      for (const [subKey, subValue] of Object.entries(value)) {
        flatPages[subKey] = subValue
      }
    }
  }
  return flatPages
}
