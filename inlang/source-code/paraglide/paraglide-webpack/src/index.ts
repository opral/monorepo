import {
  paraglide as unpluginParaglide,
  type UserConfig,
} from "@inlang/paraglide-unplugin";

export const paraglide: (config: UserConfig) => any = unpluginParaglide.webpack;
