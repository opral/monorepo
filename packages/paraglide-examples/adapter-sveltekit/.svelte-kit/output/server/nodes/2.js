

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_lang_/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.bde74dc0.js","_app/immutable/chunks/scheduler.b51ce850.js","_app/immutable/chunks/index.562a46f0.js","_app/immutable/chunks/runtime.04c82781.js"];
export const stylesheets = [];
export const fonts = [];
