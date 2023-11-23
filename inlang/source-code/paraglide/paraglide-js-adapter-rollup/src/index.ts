import { paraglide as unpluginParaglide } from "@inlang/paraglide-js-adapter-unplugin"
import type { Plugin } from "rollup"

type PluginOptions = Parameters<typeof unpluginParaglide.rollup>
export const paraglide: (...args: PluginOptions) => Plugin | Plugin[] = unpluginParaglide.rollup
