import { paraglide as unpluginParaglide } from "@inlang/paraglide-js-adapter-unplugin"

// Vite is notorious for Plugin-Typeerrors between different versions
// The plugins still work, but the types are not compatible
// It's better not to annotate the type here, so that the user can use the plugin regardless of the vite version
export const paraglide: any = unpluginParaglide.vite
