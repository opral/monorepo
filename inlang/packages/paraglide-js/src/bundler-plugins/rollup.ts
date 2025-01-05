import { createRollupPlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideRollupPlugin = createRollupPlugin(unpluginFactory);
