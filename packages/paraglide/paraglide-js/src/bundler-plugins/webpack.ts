import { createWebpackPlugin } from "unplugin";
import { unpluginFactory } from "./unplugin.js";

export const paraglideWebpackPlugin = createWebpackPlugin(unpluginFactory);
