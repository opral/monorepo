import { createRoot, type Root } from "react-dom/client";
import CodeSnippet from "./code-snippet";

const exampleModules = import.meta.glob<any>("../docs-examples/*.ts");

const exampleSources = import.meta.glob<string>("../docs-examples/*.ts", {
  eager: true,
  import: "default",
  query: "?raw",
});

function fileBasename(path: string): string {
  const last = path.split("/").pop() ?? path;
  return last.replace(/\.ts$/, "");
}

const modulesByName = new Map<string, any>();
const sourcesByName = new Map<string, string>();

for (const [path, loader] of Object.entries(exampleModules)) {
  modulesByName.set(fileBasename(path), loader);
}
for (const [path, src] of Object.entries(exampleSources)) {
  sourcesByName.set(fileBasename(path), src);
}

function parseSectionsAttribute(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as string[];
  }
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

class DocCodeSnippetElement extends HTMLElement {
  private reactRoot: Root | null = null;
  private mountEl: HTMLDivElement | null = null;
  private renderSeq = 0;

  static get observedAttributes() {
    return ["example", "sections"];
  }

  connectedCallback() {
    if (!this.mountEl) {
      this.mountEl = document.createElement("div");
      this.appendChild(this.mountEl);
    }
    this.renderReact();
  }

  attributeChangedCallback() {
    this.renderReact();
  }

  private async renderReact() {
    if (!this.mountEl) return;

    const exampleName = this.getAttribute("example")?.trim();
    if (!exampleName) {
      throw new Error("<doc-code-snippet> requires an example attribute.");
    }

    const loader = modulesByName.get(exampleName) as
      | (() => Promise<any>)
      | undefined;
    const src = sourcesByName.get(exampleName);
    if (!loader || !src) {
      throw new Error(
        `Unknown docs example "${exampleName}". Expected one of: ${[
          ...modulesByName.keys(),
        ].join(", ")}`,
      );
    }

    const seq = ++this.renderSeq;
    const mod = await loader();
    if (seq !== this.renderSeq) return;

    const sections = parseSectionsAttribute(this.getAttribute("sections"));

    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.mountEl);
    }

    this.reactRoot.render(
      <CodeSnippet module={mod} srcCode={src} sections={sections} />,
    );
  }
}

if (typeof window !== "undefined" && !customElements.get("doc-code-snippet")) {
  customElements.define("doc-code-snippet", DocCodeSnippetElement);
}
