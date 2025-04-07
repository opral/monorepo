import { useContext } from "react";
import type { Lix } from "@lix-js/sdk";
import { Context } from "@/context";

// Custom hook remains the same
export const useLix = (): Lix => {
  const context = useContext(Context);
  if (context === null) {
    throw new Error("useLix must be used within a Provider");
  }
  return context.lix;
};
