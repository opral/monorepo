import * as React from 'react';

interface MermaidRendererProps {
  code: string;
  className?: string;
}

export function MermaidRenderer({ code, className }: MermaidRendererProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const renderDiagram = async () => {
      if (!containerRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('Mermaid code received:', JSON.stringify(code));

        // Dynamic import to ensure mermaid loads properly
        const mermaid = (await import('mermaid')).default;

        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'inherit'
        });

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram with original code (no cleaning needed)
        const { svg } = await mermaid.render(id, code.trim());
        
        console.log('Mermaid render successful, SVG length:', svg.length);

        // Only update if component is still mounted
        if (mounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      mounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className={`p-4 border border-red-200 rounded-md bg-red-50 ${className || ''}`}>
        <p className="text-sm text-red-600">Error rendering Mermaid diagram:</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className={`mermaid-container overflow-auto ${className || ''}`}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">Rendering diagram...</p>
        </div>
      )}
    </div>
  );
}