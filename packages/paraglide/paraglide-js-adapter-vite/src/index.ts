import { paraglide as unpluginParaglide } from "@inlang/paraglide-js-adapter-unplugin"
import type { Plugin } from "vite"

type PluginOptions = Parameters<typeof unpluginParaglide.vite>
export const paraglide: (...args: PluginOptions) => Plugin | Plugin[] = unpluginParaglide.vite
