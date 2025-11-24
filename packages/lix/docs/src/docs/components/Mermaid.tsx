import { useEffect, useId, useRef, useState } from "react";
import mermaid, { type MermaidConfig } from "mermaid";

interface MermaidProps {
  code: string;
  config?: MermaidConfig;
}

let mermaidInitialized = false;
let mermaidInitPromise: Promise<void> | null = null;

const ensureMermaidInitialized = () => {
  if (mermaidInitialized) return mermaidInitPromise as Promise<void>;

  mermaidInitialized = true;
  mermaidInitPromise = Promise.resolve().then(() =>
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" })
  );

  return mermaidInitPromise;
};

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
  const renderRequestRef = useRef(0);

  useEffect(() => {
    ensureMermaidInitialized();
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
    let isCancelled = false;
    const renderId = renderRequestRef.current + 1;
    renderRequestRef.current = renderId;

    ensureMermaidInitialized()
      ?.then(() => mermaid.render(id, definition))
      .then(({ svg }) => {
        if (isCancelled || renderId !== renderRequestRef.current) return;

        setSvg(svg);
        setHasError(false);
      })
      .catch(() => {
        if (isCancelled || renderId !== renderRequestRef.current) return;

        setHasError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [code, config, id]);

  if (hasError) {
    return null;
  }

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
