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

  // Apply custom CSS if provided
  useEffect(() => {
    if (!css) return;
    
    const styleId = `showcase-styles-${Math.random().toString(36).substring(2, 9)}`;
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        document.head.removeChild(element);
      }
    };
  }, [css]);

  return (
    <div className="max-w-7xl mx-auto my-8">
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