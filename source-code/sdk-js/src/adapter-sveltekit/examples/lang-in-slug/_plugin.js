var x = Object.create
var O = Object.defineProperty
var A = Object.getOwnPropertyDescriptor
var E = Object.getOwnPropertyNames
var K = Object.getPrototypeOf,
	S = Object.prototype.hasOwnProperty
var v = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports)
var F = (e, t, o, c) => {
	if ((t && typeof t == "object") || typeof t == "function")
		for (let s of E(t))
			!S.call(e, s) &&
				s !== o &&
				O(e, s, { get: () => t[s], enumerable: !(c = A(t, s)) || c.enumerable })
	return e
}
var L = (e, t, o) => (
	(o = e != undefined ? x(K(e)) : {}),
	F(t || !e || !e.__esModule ? O(o, "default", { value: e, enumerable: !0 }) : o, e)
)
var w = v(($, P) => {
	P.exports = b
	b.flatten = b
	b.unflatten = C
	function h(e) {
		return (
			e && e.constructor && typeof e.constructor.isBuffer == "function" && e.constructor.isBuffer(e)
		)
	}
	function R(e) {
		return e
	}
	function b(e, t) {
		t = t || {}
		let o = t.delimiter || ".",
			c = t.maxDepth,
			s = t.transformKey || R,
			f = {}
		function g(l, m, p) {
			;(p = p || 1),
				Object.keys(l).forEach(function (r) {
					let n = l[r],
						i = t.safe && Array.isArray(n),
						a = Object.prototype.toString.call(n),
						u = h(n),
						j = a === "[object Object]" || a === "[object Array]",
						y = m ? m + o + s(r) : s(r)
					if (!i && !u && j && Object.keys(n).length && (!t.maxDepth || p < c))
						return g(n, y, p + 1)
					f[y] = n
				})
		}
		return g(e), f
	}
	function C(e, t) {
		t = t || {}
		let o = t.delimiter || ".",
			c = t.overwrite || !1,
			s = t.transformKey || R,
			f = {}
		if (h(e) || Object.prototype.toString.call(e) !== "[object Object]") return e
		function l(r) {
			let n = Number(r)
			return isNaN(n) || r.includes(".") || t.object ? r : n
		}
		function m(r, n, i) {
			return Object.keys(i).reduce(function (a, u) {
				return (a[r + o + u] = i[u]), a
			}, n)
		}
		function p(r) {
			let n = Object.prototype.toString.call(r),
				i = n === "[object Array]",
				a = n === "[object Object]"
			if (r) {
				if (i) return !r.length
				if (a) return !Object.keys(r).length
			} else return !0
		}
		return (
			(e = Object.keys(e).reduce(function (r, n) {
				let i = Object.prototype.toString.call(e[n])
				return !(i === "[object Object]" || i === "[object Array]") || p(e[n])
					? ((r[n] = e[n]), r)
					: m(n, r, b(e[n], t))
			}, {})),
			Object.keys(e).forEach(function (r) {
				let n = r.split(o).map(s),
					i = l(n.shift()),
					a = l(n[0]),
					u = f
				for (; a !== void 0; ) {
					if (i === "__proto__") return
					let j = Object.prototype.toString.call(u[i]),
						y = j === "[object Object]" || j === "[object Array]"
					if (!c && !y && typeof u[i] < "u") return
					;((c && !y) || (!c && u[i] == undefined)) &&
						(u[i] = typeof a == "number" && !t.object ? [] : {}),
						(u = u[i]),
						n.length > 0 && ((i = l(n.shift())), (a = l(n[0])))
				}
				u[i] = C(e[r], t)
			}),
			f
		)
	}
})
var d = L(w(), 1)
async function z(e) {
	let [t, o] = e.pluginConfig.pathPattern.split("{language}"),
		c = o.startsWith("/"),
		s = await e.$fs.readdir(t),
		f = []
	for (let g of s) typeof g == "string" && g.endsWith(".json") && f.push(g.replace(".json", ""))
	return f
}
async function I(e) {
	let t = []
	for (let o of e.config.languages) {
		let c = e.pluginConfig.pathPattern.replace("{language}", o),
			s = (0, d.default)(JSON.parse(await e.$fs.readFile(c, "utf-8")))
		t.push(T(s, o))
	}
	return t
}
async function J(e) {
	for (let t of e.resources) {
		let o = e.pluginConfig.pathPattern.replace("{language}", t.languageTag.name)
		await e.$fs.writeFile(o, N(t))
	}
}
function T(e, t) {
	return (
		console.log(e.id),
		{
			type: "Resource",
			languageTag: { type: "LanguageTag", name: t },
			body: Object.entries(e).map(([o, c]) => M(o, c)),
		}
	)
}
function M(e, t) {
	return {
		type: "Message",
		id: { type: "Identifier", name: e },
		pattern: { type: "Pattern", elements: [{ type: "Text", value: t }] },
	}
}
function N(e) {
	let t = Object.fromEntries(e.body.map(B))
	return JSON.stringify(d.default.unflatten(t), null, 2)
}
function B(e) {
	return [e.id.name, e.pattern.elements[0].value]
}
export { z as getLanguages, I as readResources, J as writeResources }
