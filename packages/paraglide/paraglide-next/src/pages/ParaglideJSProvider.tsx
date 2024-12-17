import React from "react";
import Header from "./Header";
import {
  isAvailableLanguageTag,
  setLanguageTag,
  sourceLanguageTag,
  availableLanguageTags,
} from "$paraglide/runtime.js";
import { useRouter } from "next/router";

export default function ParaglideJS(props: {
  children: React.ReactNode;
}): React.ReactNode {
  const { locale } = useRouter();

  if (isAvailableLanguageTag(locale)) {
    setLanguageTag(locale);
  } else {
    // dev only log
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[paraglide]: "${locale}" is not one of the available language tags. Falling back to "${sourceLanguageTag}"`,
      );
    }

    setLanguageTag(sourceLanguageTag);
  }

  return (
    <>
      <Header
        availableLanguageTags={availableLanguageTags}
        sourceLanguageTag={sourceLanguageTag}
      />
      {props.children}
    </>
  );
}
