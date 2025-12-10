import { loader } from "fumadocs-core/source";
import * as icons from "lucide-react";
import { createElement } from "react";
import { docs } from "fumadocs-mdx:collections/server";

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: "/docs",
  icon(icon) {
    if (!icon) {
      return;
    }

    if (icon in icons) {
      const Icon = icons[icon as keyof typeof icons];
      return createElement(Icon);
    }
  },
});
