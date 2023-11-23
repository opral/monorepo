export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.db89b828.js","app":"_app/immutable/entry/app.569211f7.js","imports":["_app/immutable/entry/start.db89b828.js","_app/immutable/chunks/scheduler.b51ce850.js","_app/immutable/chunks/singletons.1cd9a504.js","_app/immutable/entry/app.569211f7.js","_app/immutable/chunks/scheduler.b51ce850.js","_app/immutable/chunks/index.562a46f0.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/[lang]",
				pattern: /^\/([^/]+?)\/?$/,
				params: [{"name":"lang","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
