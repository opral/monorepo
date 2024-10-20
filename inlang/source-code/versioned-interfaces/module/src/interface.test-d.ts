import type { InlangModule } from "./interface.js";

// test: an inlang module should have a settingsSchema
const module: InlangModule["default"] = {} as any;
module.settingsSchema;
