import React, { useState } from "react";
import type { Lix } from "@lix-js/sdk";

interface ContextValue {
  lix: Lix;
  setLix: (lix: Lix) => void;
  rootContainer: HTMLElement | null;
}

export const Context = React.createContext<ContextValue>({
  lix: null as unknown as Lix,
  setLix: () => {},
  rootContainer: null,
});

export function Provider({
  children,
  lix: initialLix,
  rootContainer,
}: {
  children: React.ReactNode;
  lix: Lix;
  rootContainer: HTMLElement;
}) {
  const [lix, setLix] = useState<Lix>(initialLix);

  return (
    <Context.Provider
      value={{
        lix,
        setLix,
        rootContainer,
      }}
    >
      {children}
    </Context.Provider>
  );
}
