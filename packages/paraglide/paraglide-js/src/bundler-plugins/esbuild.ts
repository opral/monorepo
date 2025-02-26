import { createEsbuildPlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideEsbuildPlugin = createEsbuildPlugin(unpluginFactory);
