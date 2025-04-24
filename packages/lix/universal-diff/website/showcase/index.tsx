import React, { useRef, useEffect, useState } from "react";
import { renderUniversalDiff } from "../../src/render-universal-diff.js";

// Type for showcase entry
interface ShowcaseEntry {
  key: string;
  before: string;
  after: string;
}

// Use Vite's glob import to import all before/after HTML files as raw text, eagerly
// @ts-expect-error - glob is not a property of ImportMeta
const beforeModules = import.meta.glob<{ default: string }>(
  "./**/before.html",
  { as: "raw", eager: true },
);
// @ts-expect-error - glob is not a property of ImportMeta
const afterModules = import.meta.glob<{ default: string }>("./**/after.html", {
  as: "raw",
  eager: true,
});
// @ts-expect-error - glob is not a property of ImportMeta
const cssModules = import.meta.glob<{ default: string }>("./**/styles.css", {
  as: "raw",
  eager: true,
});

// Build the showcases array at the top level using the eagerly imported modules
const showcases: ShowcaseEntry[] = Object.keys(beforeModules)
  .map((path) => {
    const match = path.match(/\.\/(.+)\/before\.html$/);
    if (!match) return undefined;
    const key = match[1];
    const before = (beforeModules[path] as string) || "";
    const after = (afterModules[`./${key}/after.html`] as string) || "";
    return { key, before, after };
  })
  .filter((entry): entry is ShowcaseEntry => Boolean(entry));

// ShadowHtml component for style isolation
function ShadowHtml({ html, css }: { html: string; css?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Attach shadow root if not already
    let shadow = ref.current.shadowRoot;
    if (!shadow) {
      shadow = ref.current.attachShadow({ mode: "open" });
    }
    // Clear previous content
    shadow.innerHTML = "";
    // Inject styles (if any)
    if (css) {
      const style = document.createElement("style");
      style.textContent = css;
      shadow.appendChild(style);
    }
    // Inject HTML
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    shadow.appendChild(wrapper);
  }, [html, css]);

  return <div ref={ref} style={{ minHeight: 40 }} />;
}

export function Showcase() {
  const [activeKey, setActiveKey] = useState<string>(showcases[0]?.key || "");
  const current = showcases.find((s) => s.key === activeKey);
  // Load CSS for the current showcase
  const css = cssModules[`./${activeKey}/styles.css`] as string | undefined;

  return (
    <div className="max-w-7xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6">Rich Text Document Diff</h2>
      <div className="mb-4">
        {showcases.length > 1 && (
          <select
            value={activeKey}
            onChange={(e) => setActiveKey(e.target.value)}
            className="border rounded p-1"
          >
            {showcases.map((s) => (
              <option key={s.key} value={s.key}>
                {s.key.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        )}
      </div>
      {current && (
        <div className="">
          <h3 className="text-lg font-semibold mb-3">
            {current.key.replace(/-/g, " ")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <div className="font-medium mb-1 text-gray-600">Before</div>
              <div className="p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                <ShadowHtml html={current.before} css={css} />
              </div>
            </div>
            <div>
              <div className="font-medium mb-1 text-gray-600">After</div>
              <div className="p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                <ShadowHtml html={current.after} css={css} />
              </div>
            </div>
          </div>
          <div className="font-medium mb-1 text-gray-600">Diff</div>
          <div className="relative border border-gray-200 rounded p-3 mt-4">
            <h4 className="text-md font-medium mb-2 mt-1">Diff Result</h4>
            {/* Toolbar or buttons can be added here if needed */}
            <div className="mt-6">
              <div className="min-h-[60px] bg-white">
                <ShadowHtml
                  html={renderUniversalDiff({
                    beforeHtml: current.before,
                    afterHtml: current.after,
                  })}
                  css={css}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
