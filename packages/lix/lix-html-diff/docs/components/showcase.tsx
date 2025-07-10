import { useEffect } from "react";
import { renderHtmlDiff } from "../../src/render-html-diff";
import { TabbedContentViewer } from "./tabbed-content-viewer";

interface ShowcaseProps {
  before: string;
  after: string;
  css?: string;
  editable?: boolean;
  onBeforeChange?: (content: string) => void;
  onAfterChange?: (content: string) => void;
}

export function Showcase({ before, after, css, editable = false, onBeforeChange, onAfterChange }: ShowcaseProps) {
  const diff = renderHtmlDiff({
    beforeHtml: before,
    afterHtml: after,
  });

  // Generate unique container ID for scoping CSS
  const containerId = `showcase-${Math.random().toString(36).substring(2, 9)}`;

  // Apply custom CSS if provided, scoped to this container
  useEffect(() => {
    if (!css) return;
    
    const styleId = `showcase-styles-${containerId}`;
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    
    // Scope all CSS rules to this container
    const scopedCss = css.replace(/([^{}]+){/g, (match, selector) => {
      // Don't scope if selector already starts with #showcase- (avoid double scoping)
      if (selector.trim().startsWith(`#${containerId}`)) return match;
      return `#${containerId} ${selector.trim()} {`;
    });
    
    styleElement.textContent = scopedCss;
    document.head.appendChild(styleElement);
    
    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        document.head.removeChild(element);
      }
    };
  }, [css, containerId]);

  return (
    <div id={containerId} className="max-w-7xl mx-auto my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TabbedContentViewer
          title="Before"
          htmlContent={before}
          onContentChange={onBeforeChange}
          editable={editable}
          showTitle={true}
          defaultTab={editable ? "code" : "rendered"}
        />
        <TabbedContentViewer
          title="After"
          htmlContent={after}
          onContentChange={onAfterChange}
          editable={editable}
          showTitle={true}
          defaultTab={editable ? "code" : "rendered"}
        />
      </div>
      
      <TabbedContentViewer
        title="Diff Result"
        htmlContent={diff}
        showTitle={true}
        defaultTab="rendered"
      />
    </div>
  );
}