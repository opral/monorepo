import { createFileRoute } from "@tanstack/react-router";
import { MarkdownPage } from "../../components/markdown-page";
import { DocsLayout } from "../../components/docs-layout";
import { parse } from "@opral/markdown-wc";
import markdownPageCss from "../../components/markdown-page.style.css?url";
import pluginRegistry from "./plugin.registry.json";
import { buildPluginSidebarSections } from "../../lib/plugin-sidebar";

const pluginIndexMarkdownFiles = import.meta.glob<string>(
  "/content/plugins/index.md",
  {
    eager: true,
    import: "default",
    query: "?raw",
  }
);
const pluginIndexMarkdown =
  pluginIndexMarkdownFiles["/content/plugins/index.md"] ??
  Object.values(pluginIndexMarkdownFiles)[0];

export const Route = createFileRoute("/plugins/")({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: markdownPageCss,
      },
    ],
  }),
  loader: async () => {
    const parsed = await parse(pluginIndexMarkdown, { externalLinks: true });
    return {
      html: parsed.html,
      frontmatter: parsed.frontmatter,
      markdown: pluginIndexMarkdown,
    };
  },
  component: PluginsIndexPage,
});

/**
 * Renders the plugins landing page from markdown content.
 *
 * @example
 * <PluginsIndexPage />
 */
function PluginsIndexPage() {
  const { html, frontmatter, markdown } = Route.useLoaderData();

  return (
    <DocsLayout
      toc={{ sidebar: [] }}
      sidebarSections={buildPluginSidebarSections(pluginRegistry)}
    >
      <MarkdownPage
        html={html}
        markdown={markdown}
        imports={(frontmatter.imports as string[] | undefined) ?? undefined}
      />
    </DocsLayout>
  );
}
