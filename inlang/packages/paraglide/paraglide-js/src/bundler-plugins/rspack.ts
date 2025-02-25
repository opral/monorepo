import { createRspackPlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideRspackPlugin = createRspackPlugin(unpluginFactory);
