import { Link as MetaLink, Title, Meta } from "@solidjs/meta";
import { For } from "solid-js";
import tableOfContents from "../../../../../blog/tableOfContents.json";
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import Link from "#src/renderer/Link.jsx";
import { i18nRouting } from "#src/renderer/+onBeforeRoute.js";
import { currentPageContext } from "#src/renderer/state.js";

export default function Page() {
  return (
    <>
      <Title>inlang Blog - Globalization infrastructure for software</Title>
      <Meta
        name="description"
        content="Posts that revolve around inlang, git, and globalization (i18n)."
      />
      <Meta
        name="og:image"
        content="/images/opengraph/inlang-social-image.jpg"
      />
      <MetaLink
        href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
        rel="canonical"
      />
      <MarketplaceLayout>
        <div class="flex-row min-h-full w-full items-center justify-center mx-auto md:max-w-2xl divide-y divide-solid divide-outline">
          <For each={Object.entries(tableOfContents)}>
            {([, page]) => (
              <div class="py-12">
                <Link
                  href={"/blog/" + page.slug}
                  class="text-ellipsis space-y-4"
                >
                  <h2 class="text-xl font-bold tracking-tight text-on-backround truncate">
                    {page.title}
                  </h2>
                  <p>{page.description}</p>
                  {/* using link-primary and text-primary to render the link color by default in primary 
							but also get hover effects from link-primary */}
                  <p class="link text-primary link-primary">Read more…</p>
                </Link>
              </div>
            )}
          </For>
        </div>
      </MarketplaceLayout>
    </>
  );
}
