import { paraglide as unpluginParaglide } from "@inlang/paraglide-unplugin";

type PluginOptions = Parameters<typeof unpluginParaglide.rollup>;
export const paraglide: (...args: PluginOptions) => any =
  unpluginParaglide.rollup;
