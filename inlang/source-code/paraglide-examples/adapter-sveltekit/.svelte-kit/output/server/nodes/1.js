

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.440c9acf.js","_app/immutable/chunks/scheduler.b51ce850.js","_app/immutable/chunks/index.562a46f0.js","_app/immutable/chunks/stores.afe7c894.js","_app/immutable/chunks/singletons.1cd9a504.js"];
export const stylesheets = [];
export const fonts = [];
