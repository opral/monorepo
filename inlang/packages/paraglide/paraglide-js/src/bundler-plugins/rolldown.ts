import { createRolldownPlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideRolldownPlugin = createRolldownPlugin(unpluginFactory);
