import { createFileRoute, notFound } from "@tanstack/react-router";
import { MarkdownPage } from "../../components/markdown-page";
import { DocsLayout } from "../../components/docs-layout";
import { parse } from "@opral/markdown-wc";
import markdownPageCss from "../../components/markdown-page.style.css?url";
import pluginRegistry from "./plugin.registry.json";
import { buildPluginSidebarSections } from "../../lib/plugin-sidebar";

const pluginMarkdown = import.meta.glob<string>("/content/plugins/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

type PluginEntry = {
  key: string;
};

/**
 * Finds a plugin entry by key.
 *
 * @example
 * findPluginEntry("plugin_md")
 */
function findPluginEntry(pluginKey: string): PluginEntry | undefined {
  const plugins = Array.isArray(pluginRegistry.plugins)
    ? pluginRegistry.plugins
    : [];
  return plugins.find((plugin) => plugin.key === pluginKey);
}

/**
 * Loads the raw markdown for a plugin.
 *
 * @example
 * loadPluginMarkdown("plugin_md")
 */
function loadPluginMarkdown(pluginKey: string): string | undefined {
  const directMatch = pluginMarkdown[`/content/plugins/${pluginKey}.md`];
  if (directMatch) {
    return directMatch;
  }

  const suffix = `/content/plugins/${pluginKey}.md`;
  const fallbackKey = Object.keys(pluginMarkdown).find((key) =>
    key.endsWith(suffix),
  );
  return fallbackKey ? pluginMarkdown[fallbackKey] : undefined;
}

export const Route = createFileRoute("/plugins/$pluginKey")({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: markdownPageCss,
      },
    ],
  }),
  loader: async ({ params }) => {
    const plugin = findPluginEntry(params.pluginKey);
    if (!plugin) {
      throw notFound();
    }

    const markdown = loadPluginMarkdown(params.pluginKey);
    if (!markdown) {
      throw notFound();
    }

    const parsed = await parse(markdown, { externalLinks: true });
    return {
      html: parsed.html,
      frontmatter: parsed.frontmatter,
      markdown,
    };
  },
  component: PluginPage,
});

/**
 * Renders a plugin README page.
 *
 * @example
 * <PluginPage />
 */
function PluginPage() {
  const { html, frontmatter, markdown } = Route.useLoaderData();
  const { pluginKey } = Route.useParams();

  return (
    <DocsLayout
      toc={{ sidebar: [] }}
      sidebarSections={buildPluginSidebarSections(pluginRegistry)}
      activeRelativePath={pluginKey}
    >
      <MarkdownPage
        html={html}
        markdown={markdown}
        imports={(frontmatter.imports as string[] | undefined) ?? undefined}
      />
    </DocsLayout>
  );
}
