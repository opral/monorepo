import React from "react";
import { languageTag, setLanguageTag } from "$paraglide/runtime.js";
import { ClientLanguageProvider } from "./ClientLanguageProvider";
import { getLanguage } from "../getLanguage.server";

// avoid flash of wrong language on startup
setLanguageTag(getLanguage);

//If we can reliably call setLanguageTag() from middleware.tsx, we can probably get rid of this component
export default function LanguageProvider(props: {
  children: React.ReactNode;
}): React.ReactElement {
  setLanguageTag(getLanguage);

  //we make the client side language provider a sibling of the children
  //That way the entire app isn't turned into a client component
  return (
    <>
      {/* Pass the language tag to the client */}
      <ClientLanguageProvider language={languageTag()} />
      {/* Re-render if the language changes */}
      <React.Fragment key={languageTag()}>{props.children}</React.Fragment>
    </>
  );
}
