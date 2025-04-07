import React, { createContext, useContext } from "react";
import type { Lix } from "@lix-js/sdk";

// Create the context with a default value (null)
// Fixing the previous 'null as any' to provide a proper default
const LixContext = createContext<Lix>(null as any);

export function LixProvider({
  children,
  lixInstance,
}: {
  children: React.ReactNode;
  lixInstance: Lix;
}): React.ReactElement {
  // Equivalent to: <LixContext.Provider value={lixInstance}>{children}</LixContext.Provider>
  return React.createElement(
    LixContext.Provider,
    { value: lixInstance },
    children
  );
}

// Custom hook remains the same
export const useLix = (): Lix => {
  const context = useContext(LixContext);
  if (context === null) {
    throw new Error("useLix must be used within a LixProvider");
  }
  return context;
};
