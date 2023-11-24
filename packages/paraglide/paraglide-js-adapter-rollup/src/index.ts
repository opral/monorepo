import { paraglide as unpluginParaglide } from "@inlang/paraglide-js-adapter-unplugin"

type PluginOptions = Parameters<typeof unpluginParaglide.rollup>
export const paraglide: (...args: PluginOptions) => any = unpluginParaglide.rollup
