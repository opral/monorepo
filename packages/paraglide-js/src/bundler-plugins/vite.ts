import { createVitePlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideVite = createVitePlugin(unpluginFactory);
