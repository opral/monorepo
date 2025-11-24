import { useEffect, useId, useState } from "react";
import mermaid, { type MermaidConfig } from "mermaid";

interface MermaidProps {
  code: string;
  config?: MermaidConfig;
}

let mermaidInitialized = false;

/**
 * Renders a Mermaid diagram from fenced code blocks.
 *
 * @example
 * <Mermaid code="graph TD; A-->B;" />
 */
export default function Mermaid({ code, config }: MermaidProps) {
  const [svg, setSvg] = useState("");
  const [hasError, setHasError] = useState(false);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    if (mermaidInitialized) return;

    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
    mermaidInitialized = true;
  }, []);

  useEffect(() => {
    const theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "default";

    const mergedConfig: MermaidConfig = {
      startOnLoad: false,
      securityLevel: "loose",
      theme,
      ...config,
    };

    const definition = `%%{init: ${JSON.stringify(mergedConfig)}}%%\n${code}`;

    Promise.resolve()
      .then(() => {
        return mermaid.render(id, definition);
      })
      .then(({ svg }) => {
        setSvg(svg);
        setHasError(false);
      })
      .catch(() => setHasError(true));
  }, [code, config, id]);

  if (hasError) {
    return null;
  }

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
