import React from "react";
import type { Lix } from "@lix-js/sdk";

interface ContextValue {
  lix: Lix;
  rootContainer: HTMLElement | null;
}

export const Context = React.createContext<ContextValue>({
  lix: null as unknown as Lix,
  rootContainer: null,
});

export function Provider({
  children,
  lix,
  rootContainer,
}: {
  children: React.ReactNode;
  lix: Lix;
  rootContainer: HTMLElement;
}) {
  return (
    <Context.Provider
      value={{
        lix,
        rootContainer,
      }}
    >
      {children}
    </Context.Provider>
  );
}
