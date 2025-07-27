import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

interface WindowManagerContextType {
  focusedWindow: string | null;
  getZIndex: (windowId: string) => number;
  focusWindow: (windowId: string) => void;
  clearFocus: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export function useWindowManager() {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
}

interface WindowManagerProviderProps {
  children: ReactNode;
}

export function WindowManagerProvider({ children }: WindowManagerProviderProps) {
  const [focusedWindow, setFocusedWindow] = useState<string | null>(null);
  const [windowZIndexes, setWindowZIndexes] = useState<Record<string, number>>({});
  const [zIndexCounter, setZIndexCounter] = useState(1000);
  
  // Use refs to track current values without causing re-renders
  const windowZIndexesRef = useRef<Record<string, number>>({});
  const zIndexCounterRef = useRef(1000);
  
  // Sync refs with state
  useEffect(() => {
    windowZIndexesRef.current = windowZIndexes;
  }, [windowZIndexes]);
  
  useEffect(() => {
    zIndexCounterRef.current = zIndexCounter;
  }, [zIndexCounter]);

  const focusWindow = useCallback((windowId: string) => {
    // Always assign a new z-index to bring window to front, even if already focused
    const newZIndex = zIndexCounterRef.current + 1;
    
    // Update refs immediately
    zIndexCounterRef.current = newZIndex;
    windowZIndexesRef.current = {
      ...windowZIndexesRef.current,
      [windowId]: newZIndex,
    };
    
    // Update state
    setZIndexCounter(newZIndex);
    setWindowZIndexes(windowZIndexesRef.current);
    setFocusedWindow(windowId);
  }, []);

  const getZIndex = useCallback((windowId: string) => {
    // Return existing z-index or a default high z-index for new windows
    return windowZIndexesRef.current[windowId] || 1100;
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedWindow(null);
  }, []);

  const value = {
    focusedWindow,
    getZIndex,
    focusWindow,
    clearFocus,
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}