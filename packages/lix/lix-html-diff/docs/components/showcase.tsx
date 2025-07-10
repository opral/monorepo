import { useRef, useEffect } from "react";
import { renderHtmlDiff } from "../../src/render-html-diff";

interface ShowcaseProps {
  before: string;
  after: string;
  css?: string;
}

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

export function Showcase({ before, after, css }: ShowcaseProps) {
  return (
    <div className="max-w-7xl mx-auto my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="font-medium mb-2 text-gray-600">Before</div>
          <div className="p-4 bg-gray-50 rounded border overflow-x-auto">
            <ShadowHtml html={before} css={css} />
          </div>
        </div>
        <div>
          <div className="font-medium mb-2 text-gray-600">After</div>
          <div className="p-4 bg-gray-50 rounded border overflow-x-auto">
            <ShadowHtml html={after} css={css} />
          </div>
        </div>
      </div>
      
      <div className="font-medium mb-2 text-gray-600">Diff Result</div>
      <div className="border border-gray-200 rounded p-4 bg-white">
        <ShadowHtml
          html={renderHtmlDiff({
            beforeHtml: before,
            afterHtml: after,
          })}
          css={css}
        />
      </div>
    </div>
  );
}