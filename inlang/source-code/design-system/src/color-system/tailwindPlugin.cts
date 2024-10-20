import plugin from "tailwindcss/plugin";
import { generateTokens } from "./generateTokens.cjs";
import type { Config } from "./types/config.cjs";

/**
 * Entrypoint for the colorsystem.
 *
 * The colorsystem has default values. Defining every property
 * in the config is not required.
 */
export function configure(config: Config) {
  // merge mutates default config
  // this line allows the user to specify a partial config
  // and only change the primary color for example.
  USED_COLOR_SYSTEM_CONFIG = config;
  const tokens = generateTokens(USED_COLOR_SYSTEM_CONFIG);
  // @ts-ignore
  return plugin(() => undefined, {
    theme: {
      extend: {
        colors: tokens,
      },
    },
  });
}

/**
 * The config that has been used by the plugin to generate the tokens.
 *
 * This variable defines defaults and is used by other elements of the design
 * system to generate accompanying classes.
 */
// TODO - better default values
export let USED_COLOR_SYSTEM_CONFIG: Config;
