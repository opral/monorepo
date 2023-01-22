import type { OnBeforeRender } from "@src/renderer/types.js";
import type { PageProps } from "./index.page.jsx";
import { marked } from "marked";
import README from "../../../../../README.md?raw";

const markdown = marked.parse(README);

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async () => {
  return {
    pageContext: {
      pageProps: {
        markdown: markdown,
      },
    },
  };
};
