import {
  paraglide as unpluginParaglide,
  type UserConfig,
} from "@inlang/paraglide-unplugin";

// Vite is notorious for Plugin-TypeErrors between different versions
// The plugins still work, but the types are not compatible
// It's better not to annotate the Plugin type here,
// so that the user can use the plugin regardless of their vite version
export const paraglide: (config: UserConfig) => any = unpluginParaglide.vite;
