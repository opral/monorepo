import React, { useEffect, useRef } from 'react';
import type { Lix } from '@lix-js/sdk';
import { createLixInspector, LixInspectorOptions } from '../inspector.js';
// Importing the interface separately to avoid merged declaration errors
import type { LixInspector as LixInspectorInterface } from '../inspector.js';

interface LixInspectorProps {
  lix: Lix;
  options?: LixInspectorOptions;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * React component for Lix Inspector
 * 
 * @example
 * Standard usage:
 * ```tsx
 * <LixInspector 
 *   lix={lix}
 *   options={{ theme: 'dark' }}
 *   style={{ height: '500px' }}
 * />
 * ```
 * 
 * With auto-attach mini-view:
 * ```tsx
 * <LixInspector 
 *   lix={lix}
 *   options={{ 
 *     theme: 'light',
 *     autoAttach: true,
 *     position: 'bottom-right'
 *   }}
 * />
 * ```
 */
export const LixInspector: React.FC<LixInspectorProps> = ({ 
  lix, 
  options,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<LixInspectorInterface | null>(null);
  
  useEffect(() => {
    // Create the inspector
    const inspector = createLixInspector(lix, options);
    inspectorRef.current = inspector;
    
    // If autoAttach is enabled, we don't need to mount it explicitly
    // The inspector will auto-attach to document.body
    if (!options?.autoAttach && containerRef.current) {
      inspector.mount(containerRef.current);
    }
    
    // Clean up on unmount
    return () => {
      if (inspectorRef.current) {
        inspectorRef.current.unmount();
        inspectorRef.current = null;
      }
    };
  }, [lix, options]);
  
  // Only apply styles and render container if not using autoAttach
  if (options?.autoAttach) {
    // If auto-attach is enabled, we don't need to render a container
    // The inspector will create its own container
    return null;
  }
  
  // Apply default styles for standard usage
  const defaultStyle: React.CSSProperties = {
    width: '100%',
    height: '500px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    overflow: 'hidden',
    ...style
  };
  
  return (
    <div 
      ref={containerRef} 
      className={`lix-inspector-container ${className}`} 
      style={defaultStyle} 
    />
  );
};