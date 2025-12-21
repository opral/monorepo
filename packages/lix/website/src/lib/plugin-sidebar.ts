import type { SidebarSection } from "../components/docs-layout";

type PluginRegistry = {
  plugins?: Array<{
    key: string;
    name?: string;
  }>;
};

/**
 * Builds sidebar sections for plugin pages.
 *
 * @example
 * buildPluginSidebarSections(registry)
 */
export function buildPluginSidebarSections(
  registry: PluginRegistry,
): SidebarSection[] {
  const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
  const items = plugins.map((plugin) => ({
    label: plugin.name ?? plugin.key,
    href: `/plugins/${plugin.key}`,
    relativePath: plugin.key,
  }));

  return items.length > 0
    ? [
        {
          label: "Plugins",
          items,
        },
      ]
    : [];
}
