import { createVitePlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideVitePlugin = createVitePlugin(unpluginFactory);
