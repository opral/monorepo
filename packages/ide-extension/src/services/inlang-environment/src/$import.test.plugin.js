/* eslint-disable */
// @ts-nocheck
/**
 * This plugin is used to test the $import function
 *
 * Taken from https://raw.githubusercontent.com/samuelstroschein/inlang-plugin-json/3e322bf01763fc6d8c9f9f9489be889ae96ca6f2/dist/index.js
 *
 * ----------------------------------
 */

var Ne = Object.create
var X = Object.defineProperty
var Ee = Object.getOwnPropertyDescriptor
var Me = Object.getOwnPropertyNames
var Re = Object.getPrototypeOf,
	Fe = Object.prototype.hasOwnProperty
var ze = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports)
var Ue = (e, t, n, r) => {
	if ((t && typeof t == "object") || typeof t == "function")
		for (let i of Me(t))
			!Fe.call(e, i) &&
				i !== n &&
				X(e, i, { get: () => t[i], enumerable: !(r = Ee(t, i)) || r.enumerable })
	return e
}
var De = (e, t, n) => (
	(n = e != undefined ? Ne(Re(e)) : {}),
	Ue(t || !e || !e.__esModule ? X(n, "default", { value: e, enumerable: !0 }) : n, e)
)
var $e = ze((S, w) => {
	var Le = 200,
		se = "__lodash_hash_undefined__",
		Be = 800,
		Je = 16,
		oe = 9007199254740991,
		ue = "[object Arguments]",
		Ge = "[object Array]",
		He = "[object AsyncFunction]",
		We = "[object Boolean]",
		Ve = "[object Date]",
		qe = "[object Error]",
		le = "[object Function]",
		Ke = "[object GeneratorFunction]",
		Xe = "[object Map]",
		Ye = "[object Number]",
		Ze = "[object Null]",
		fe = "[object Object]",
		Qe = "[object Proxy]",
		ke = "[object RegExp]",
		et = "[object Set]",
		tt = "[object String]",
		nt = "[object Undefined]",
		rt = "[object WeakMap]",
		it = "[object ArrayBuffer]",
		at = "[object DataView]",
		st = "[object Float32Array]",
		ot = "[object Float64Array]",
		ut = "[object Int8Array]",
		lt = "[object Int16Array]",
		ft = "[object Int32Array]",
		ct = "[object Uint8Array]",
		gt = "[object Uint8ClampedArray]",
		pt = "[object Uint16Array]",
		dt = "[object Uint32Array]",
		ht = /[\\^$.*+?()[\]{}|]/g,
		yt = /^\[object .+?Constructor\]$/,
		mt = /^(?:0|[1-9]\d*)$/,
		f = {}
	f[st] = f[ot] = f[ut] = f[lt] = f[ft] = f[ct] = f[gt] = f[pt] = f[dt] = !0
	f[ue] =
		f[Ge] =
		f[it] =
		f[We] =
		f[at] =
		f[Ve] =
		f[qe] =
		f[le] =
		f[Xe] =
		f[Ye] =
		f[fe] =
		f[ke] =
		f[et] =
		f[tt] =
		f[rt] =
			!1
	var ce =
			typeof globalThis == "object" && globalThis && globalThis.Object === Object && globalThis,
		_t = typeof self == "object" && self && self.Object === Object && self,
		A = ce || _t || Function("return this")(),
		ge = typeof S == "object" && S && !S.nodeType && S,
		$ = ge && typeof w == "object" && w && !w.nodeType && w,
		pe = $ && $.exports === ge,
		U = pe && ce.process,
		Z = (function () {
			try {
				var e = $ && $.require && $.require("util").types
				return e || (U && U.binding && U.binding("util"))
			} catch {}
		})(),
		Q = Z && Z.isTypedArray
	function bt(e, t, n) {
		switch (n.length) {
			case 0:
				return e.call(t)
			case 1:
				return e.call(t, n[0])
			case 2:
				return e.call(t, n[0], n[1])
			case 3:
				return e.call(t, n[0], n[1], n[2])
		}
		return e.apply(t, n)
	}
	function wt(e, t) {
		for (var n = -1, r = Array(e); ++n < e; ) r[n] = t(n)
		return r
	}
	function vt(e) {
		return function (t) {
			return e(t)
		}
	}
	function Tt(e, t) {
		return e?.[t]
	}
	function xt(e, t) {
		return function (n) {
			return e(t(n))
		}
	}
	var St = Array.prototype,
		$t = Function.prototype,
		I = Object.prototype,
		D = A["__core-js_shared__"],
		N = $t.toString,
		g = I.hasOwnProperty,
		k = (function () {
			var e = /[^.]+$/.exec((D && D.keys && D.keys.IE_PROTO) || "")
			return e ? "Symbol(src)_1." + e : ""
		})(),
		de = I.toString,
		Pt = N.call(Object),
		At = RegExp(
			"^" +
				N.call(g)
					.replace(ht, "\\$&")
					.replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") +
				"$",
		),
		j = pe ? A.Buffer : void 0,
		ee = A.Symbol,
		te = A.Uint8Array,
		ne = j ? j.allocUnsafe : void 0,
		he = xt(Object.getPrototypeOf, Object),
		re = Object.create,
		Ot = I.propertyIsEnumerable,
		jt = St.splice,
		m = ee ? ee.toStringTag : void 0,
		C = (function () {
			try {
				var e = W(Object, "defineProperty")
				return e({}, "", {}), e
			} catch {}
		})(),
		Ct = j ? j.isBuffer : void 0,
		ie = Math.max,
		It = Date.now,
		ye = W(A, "Map"),
		P = W(Object, "create"),
		Nt = (function () {
			function e() {}
			return function (t) {
				if (!b(t)) return {}
				if (re) return re(t)
				e.prototype = t
				var n = new e()
				return (e.prototype = void 0), n
			}
		})()
	function _(e) {
		var t = -1,
			n = e == undefined ? 0 : e.length
		for (this.clear(); ++t < n; ) {
			var r = e[t]
			this.set(r[0], r[1])
		}
	}
	function Et() {
		;(this.__data__ = P ? P(null) : {}), (this.size = 0)
	}
	function Mt(e) {
		var t = this.has(e) && delete this.__data__[e]
		return (this.size -= t ? 1 : 0), t
	}
	function Rt(e) {
		var t = this.__data__
		if (P) {
			var n = t[e]
			return n === se ? void 0 : n
		}
		return g.call(t, e) ? t[e] : void 0
	}
	function Ft(e) {
		var t = this.__data__
		return P ? t[e] !== void 0 : g.call(t, e)
	}
	function zt(e, t) {
		var n = this.__data__
		return (this.size += this.has(e) ? 0 : 1), (n[e] = P && t === void 0 ? se : t), this
	}
	_.prototype.clear = Et
	_.prototype.delete = Mt
	_.prototype.get = Rt
	_.prototype.has = Ft
	_.prototype.set = zt
	function p(e) {
		var t = -1,
			n = e == undefined ? 0 : e.length
		for (this.clear(); ++t < n; ) {
			var r = e[t]
			this.set(r[0], r[1])
		}
	}
	function Ut() {
		;(this.__data__ = []), (this.size = 0)
	}
	function Dt(e) {
		var t = this.__data__,
			n = E(t, e)
		if (n < 0) return !1
		var r = t.length - 1
		return n == r ? t.pop() : jt.call(t, n, 1), --this.size, !0
	}
	function Lt(e) {
		var t = this.__data__,
			n = E(t, e)
		return n < 0 ? void 0 : t[n][1]
	}
	function Bt(e) {
		return E(this.__data__, e) > -1
	}
	function Jt(e, t) {
		var n = this.__data__,
			r = E(n, e)
		return r < 0 ? (++this.size, n.push([e, t])) : (n[r][1] = t), this
	}
	p.prototype.clear = Ut
	p.prototype.delete = Dt
	p.prototype.get = Lt
	p.prototype.has = Bt
	p.prototype.set = Jt
	function v(e) {
		var t = -1,
			n = e == undefined ? 0 : e.length
		for (this.clear(); ++t < n; ) {
			var r = e[t]
			this.set(r[0], r[1])
		}
	}
	function Gt() {
		;(this.size = 0), (this.__data__ = { hash: new _(), map: new (ye || p)(), string: new _() })
	}
	function Ht(e) {
		var t = R(this, e).delete(e)
		return (this.size -= t ? 1 : 0), t
	}
	function Wt(e) {
		return R(this, e).get(e)
	}
	function Vt(e) {
		return R(this, e).has(e)
	}
	function qt(e, t) {
		var n = R(this, e),
			r = n.size
		return n.set(e, t), (this.size += n.size == r ? 0 : 1), this
	}
	v.prototype.clear = Gt
	v.prototype.delete = Ht
	v.prototype.get = Wt
	v.prototype.has = Vt
	v.prototype.set = qt
	function T(e) {
		var t = (this.__data__ = new p(e))
		this.size = t.size
	}
	function Kt() {
		;(this.__data__ = new p()), (this.size = 0)
	}
	function Xt(e) {
		var t = this.__data__,
			n = t.delete(e)
		return (this.size = t.size), n
	}
	function Yt(e) {
		return this.__data__.get(e)
	}
	function Zt(e) {
		return this.__data__.has(e)
	}
	function Qt(e, t) {
		var n = this.__data__
		if (n instanceof p) {
			var r = n.__data__
			if (!ye || r.length < Le - 1) return r.push([e, t]), (this.size = ++n.size), this
			n = this.__data__ = new v(r)
		}
		return n.set(e, t), (this.size = n.size), this
	}
	T.prototype.clear = Kt
	T.prototype.delete = Xt
	T.prototype.get = Yt
	T.prototype.has = Zt
	T.prototype.set = Qt
	function kt(e, t) {
		var n = G(e),
			r = !n && J(e),
			i = !n && !r && we(e),
			a = !n && !r && !i && Te(e),
			s = n || r || i || a,
			o = s ? wt(e.length, String) : [],
			u = o.length
		for (var l in e)
			(t || g.call(e, l)) &&
				!(
					s &&
					(l == "length" ||
						(i && (l == "offset" || l == "parent")) ||
						(a && (l == "buffer" || l == "byteLength" || l == "byteOffset")) ||
						_e(l, u))
				) &&
				o.push(l)
		return o
	}
	function L(e, t, n) {
		;((n !== void 0 && !F(e[t], n)) || (n === void 0 && !(t in e))) && H(e, t, n)
	}
	function en(e, t, n) {
		var r = e[t]
		;(!(g.call(e, t) && F(r, n)) || (n === void 0 && !(t in e))) && H(e, t, n)
	}
	function E(e, t) {
		for (var n = e.length; n--; ) if (F(e[n][0], t)) return n
		return -1
	}
	function H(e, t, n) {
		t == "__proto__" && C
			? C(e, t, { configurable: !0, enumerable: !0, value: n, writable: !0 })
			: (e[t] = n)
	}
	var tn = hn()
	function M(e) {
		return e == undefined ? (e === void 0 ? nt : Ze) : m && m in Object(e) ? yn(e) : Tn(e)
	}
	function ae(e) {
		return O(e) && M(e) == ue
	}
	function nn(e) {
		if (!b(e) || wn(e)) return !1
		var t = q(e) ? At : yt
		return t.test(Pn(e))
	}
	function rn(e) {
		return O(e) && ve(e.length) && !!f[M(e)]
	}
	function an(e) {
		if (!b(e)) return vn(e)
		var t = be(e),
			n = []
		for (var r in e) (r == "constructor" && (t || !g.call(e, r))) || n.push(r)
		return n
	}
	function me(e, t, n, r, i) {
		e !== t &&
			tn(
				t,
				function (a, s) {
					if ((i || (i = new T()), b(a))) sn(e, t, s, n, me, r, i)
					else {
						var o = r ? r(B(e, s), a, s + "", e, t, i) : void 0
						o === void 0 && (o = a), L(e, s, o)
					}
				},
				xe,
			)
	}
	function sn(e, t, n, r, i, a, s) {
		var o = B(e, n),
			u = B(t, n),
			l = s.get(u)
		if (l) {
			L(e, n, l)
			return
		}
		var c = a ? a(o, u, n + "", e, t, s) : void 0,
			d = c === void 0
		if (d) {
			var x = G(u),
				h = !x && we(u),
				y = !x && !h && Te(u)
			;(c = u),
				x || h || y
					? G(o)
						? (c = o)
						: An(o)
						? (c = gn(o))
						: h
						? ((d = !1), (c = ln(u, !0)))
						: y
						? ((d = !1), (c = cn(u, !0)))
						: (c = [])
					: On(u) || J(u)
					? ((c = o), J(o) ? (c = jn(o)) : (!b(o) || q(o)) && (c = mn(u)))
					: (d = !1)
		}
		d && (s.set(u, c), i(c, u, r, a, s), s.delete(u)), L(e, n, c)
	}
	function on(e, t) {
		return Sn(xn(e, t, Se), e + "")
	}
	var un = C
		? function (e, t) {
				return C(e, "toString", { configurable: !0, enumerable: !1, value: In(t), writable: !0 })
		  }
		: Se
	function ln(e, t) {
		if (t) return [...e]
		var n = e.length,
			r = ne ? ne(n) : new e.constructor(n)
		return e.copy(r), r
	}
	function fn(e) {
		var t = new e.constructor(e.byteLength)
		return new te(t).set(new te(e)), t
	}
	function cn(e, t) {
		var n = t ? fn(e.buffer) : e.buffer
		return new e.constructor(n, e.byteOffset, e.length)
	}
	function gn(e, t) {
		var n = -1,
			r = e.length
		for (t || (t = Array(r)); ++n < r; ) t[n] = e[n]
		return t
	}
	function pn(e, t, n, r) {
		var i = !n
		n || (n = {})
		for (var a = -1, s = t.length; ++a < s; ) {
			var o = t[a],
				u = r ? r(n[o], e[o], o, n, e) : void 0
			u === void 0 && (u = e[o]), i ? H(n, o, u) : en(n, o, u)
		}
		return n
	}
	function dn(e) {
		return on(function (t, n) {
			var r = -1,
				i = n.length,
				a = i > 1 ? n[i - 1] : void 0,
				s = i > 2 ? n[2] : void 0
			for (
				a = e.length > 3 && typeof a == "function" ? (i--, a) : void 0,
					s && _n(n[0], n[1], s) && ((a = i < 3 ? void 0 : a), (i = 1)),
					t = Object(t);
				++r < i;

			) {
				var o = n[r]
				o && e(t, o, r, a)
			}
			return t
		})
	}
	function hn(e) {
		return function (t, n, r) {
			for (var i = -1, a = Object(t), s = r(t), o = s.length; o--; ) {
				var u = s[e ? o : ++i]
				if (n(a[u], u, a) === !1) break
			}
			return t
		}
	}
	function R(e, t) {
		var n = e.__data__
		return bn(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map
	}
	function W(e, t) {
		var n = Tt(e, t)
		return nn(n) ? n : void 0
	}
	function yn(e) {
		var t = g.call(e, m),
			n = e[m]
		try {
			e[m] = void 0
			var r = !0
		} catch {}
		var i = de.call(e)
		return r && (t ? (e[m] = n) : delete e[m]), i
	}
	function mn(e) {
		return typeof e.constructor == "function" && !be(e) ? Nt(he(e)) : {}
	}
	function _e(e, t) {
		var n = typeof e
		return (
			(t = t ?? oe),
			!!t && (n == "number" || (n != "symbol" && mt.test(e))) && e > -1 && e % 1 == 0 && e < t
		)
	}
	function _n(e, t, n) {
		if (!b(n)) return !1
		var r = typeof t
		return (r == "number" ? V(n) && _e(t, n.length) : r == "string" && t in n) ? F(n[t], e) : !1
	}
	function bn(e) {
		var t = typeof e
		return t == "string" || t == "number" || t == "symbol" || t == "boolean"
			? e !== "__proto__"
			: e === null
	}
	function wn(e) {
		return !!k && k in e
	}
	function be(e) {
		var t = e && e.constructor,
			n = (typeof t == "function" && t.prototype) || I
		return e === n
	}
	function vn(e) {
		var t = []
		if (e != undefined) for (var n in Object(e)) t.push(n)
		return t
	}
	function Tn(e) {
		return de.call(e)
	}
	function xn(e, t, n) {
		return (
			(t = ie(t === void 0 ? e.length - 1 : t, 0)),
			function () {
				for (var r = arguments, i = -1, a = ie(r.length - t, 0), s = Array(a); ++i < a; )
					s[i] = r[t + i]
				i = -1
				for (var o = Array(t + 1); ++i < t; ) o[i] = r[i]
				return (o[t] = n(s)), bt(e, this, o)
			}
		)
	}
	function B(e, t) {
		if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__") return e[t]
	}
	var Sn = $n(un)
	function $n(e) {
		var t = 0,
			n = 0
		return function () {
			var r = It(),
				i = Je - (r - n)
			if (((n = r), i > 0)) {
				if (++t >= Be) return arguments[0]
			} else t = 0
			return e.apply(void 0, arguments)
		}
	}
	function Pn(e) {
		if (e != undefined) {
			try {
				return N.call(e)
			} catch {}
			try {
				return e + ""
			} catch {}
		}
		return ""
	}
	function F(e, t) {
		return e === t || (e !== e && t !== t)
	}
	var J = ae(
			(function () {
				return arguments
			})(),
		)
			? ae
			: function (e) {
					return O(e) && g.call(e, "callee") && !Ot.call(e, "callee")
			  },
		G = Array.isArray
	function V(e) {
		return e != undefined && ve(e.length) && !q(e)
	}
	function An(e) {
		return O(e) && V(e)
	}
	var we = Ct || Nn
	function q(e) {
		if (!b(e)) return !1
		var t = M(e)
		return t == le || t == Ke || t == He || t == Qe
	}
	function ve(e) {
		return typeof e == "number" && e > -1 && e % 1 == 0 && e <= oe
	}
	function b(e) {
		var t = typeof e
		return e != undefined && (t == "object" || t == "function")
	}
	function O(e) {
		return e != undefined && typeof e == "object"
	}
	function On(e) {
		if (!O(e) || M(e) != fe) return !1
		var t = he(e)
		if (t === null) return !0
		var n = g.call(t, "constructor") && t.constructor
		return typeof n == "function" && n instanceof n && N.call(n) == Pt
	}
	var Te = Q ? vt(Q) : rn
	function jn(e) {
		return pn(e, xe(e))
	}
	function xe(e) {
		return V(e) ? kt(e, !0) : an(e)
	}
	var Cn = dn(function (e, t, n) {
		me(e, t, n)
	})
	function In(e) {
		return function () {
			return e
		}
	}
	function Se(e) {
		return e
	}
	function Nn() {
		return !1
	}
	w.exports = Cn
})
function z(e) {
	return (t) => (n) => e({ settings: t, env: n })
}
function Y(e) {
	if (e.pathPattern === void 0)
		throw new Error(
			"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
		)
	if (e.pathPattern.includes("{language}") === !1)
		throw new Error(
			"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
		)
	if (e.pathPattern.endsWith(".json") === !1)
		throw new Error(
			"The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'.",
		)
}
var je = De($e(), 1),
	En = z(({ settings: e, env: t }) => ({
		id: "samuelstroschein.inlangPluginJson",
		async config() {
			return (
				Y(e),
				{
					languages: await Ce({ $fs: t.$fs, settings: e }),
					readResources: async (n) => Mn({ ...n, $fs: t.$fs, settings: e }),
					writeResources: async (n) => Fn({ ...n, $fs: t.$fs, settings: e }),
				}
			)
		},
	}))
async function Ce(e) {
	let [t, n] = e.settings.pathPattern.split("{language}"),
		r = await e.$fs.readdir(t),
		i = []
	for (let a of r)
		if (a.includes("."))
			a.endsWith(".json") &&
				!e.settings.ignore?.some((s) => s === a) &&
				i.push(a.replace(".json", ""))
		else {
			let s = await e.$fs.readdir(`${t}${a}`)
			if (s.length === 0) i.push(a)
			else
				for (let o of s)
					o.endsWith(".json") &&
						!e.settings.ignore?.some((u) => u === a) &&
						!i.includes(a) &&
						i.push(a)
		}
	return i
}
async function Mn(e) {
	let t = [],
		n = await Ce(e)
	for (let r of n) {
		let i = e.settings.pathPattern.replace("{language}", r)
		try {
			let a = await e.$fs.readFile(i, { encoding: "utf-8" }),
				s = Ae(await e.$fs.readFile(i, { encoding: "utf-8" })),
				o = K(JSON.parse(a)),
				u = {}
			o.map((l) => {
				u = { ...u, [l.id]: { value: l.value, parents: l.parents, keyName: l.keyName } }
			}),
				t.push(Pe(u, r, s, e.settings.variableReferencePattern))
		} catch {
			let a = {},
				s = `${i.replace("/*.json", "")}`,
				o = await e.$fs.readdir(s),
				u = o.length === 0 ? 2 : Ae(await e.$fs.readFile(`${s}/${o[0]}`, { encoding: "utf-8" }))
			if (o.length !== 0)
				for (let l of o) {
					let c = await e.$fs.readFile(`${s}/${l}`, { encoding: "utf-8" }),
						d = l.replace(".json", ""),
						x = K(JSON.parse(c), [], d),
						h = {}
					x.map((y) => {
						h = {
							...h,
							[y.id]: { value: y.value, parents: y.parents, fileName: d, keyName: y.keyName },
						}
					}),
						(a = { ...a, ...h })
				}
			t.push(Pe(a, r, u, e.settings.variableReferencePattern))
		}
	}
	return t
}
function Pe(e, t, n, r) {
	return {
		type: "Resource",
		metadata: { space: n },
		languageTag: { type: "LanguageTag", name: t },
		body: Object.entries(e).map(([i, a]) => Rn(i, a, r)),
	}
}
function Rn(e, t, n) {
	let r =
			n &&
			(n[1] ? new RegExp(`(\\${n[0]}[^\\${n[1]}]+\\${n[1]})`, "g") : new RegExp(`(${n}\\w+)`, "g")),
		i = []
	if (r) {
		let a = t.value.split(r)
		for (let s = 0; s < a.length; s++)
			r.test(a[s])
				? i.push({
						type: "Placeholder",
						body: {
							type: "VariableReference",
							name: n[1] ? a[s].slice(n[0].length, n[1].length * -1) : a[s].slice(n[0].length),
						},
				  })
				: a[s] !== "" && i.push({ type: "Text", value: a[s] })
	} else i.push({ type: "Text", value: t.value })
	return {
		type: "Message",
		metadata: {
			...(t.fileName !== void 0 && { fileName: t.fileName }),
			...(t.parents !== void 0 && { parentKeys: t.parents }),
			...(t.keyName !== void 0 && { keyName: t.keyName }),
		},
		id: { type: "Identifier", name: e },
		pattern: { type: "Pattern", elements: i },
	}
}
var K = (e, t = [], n) => {
		let r = []
		if (typeof e == "string")
			r.push({
				value: e,
				parents: t.length > 1 ? t.slice(0, -1) : void 0,
				id: n ? n + "." + t.join(".") : t.join("."),
				keyName: t.at(-1),
			})
		else if (typeof e == "object" && e !== null) {
			for (let i in e)
				if (e.hasOwnProperty(i)) {
					let a = [...t, i],
						s = K(e[i], a, n)
					r.push(...s)
				}
		}
		return r
	},
	Ae = (e) => {
		let t = [
			{ spacing: 1, regex: /^{\n {1}[^ ]+.*$/m },
			{ spacing: 2, regex: /^{\n {2}[^ ]+.*$/m },
			{ spacing: 3, regex: /^{\n {3}[^ ]+.*$/m },
			{ spacing: 4, regex: /^{\n {4}[^ ]+.*$/m },
			{ spacing: 6, regex: /^{\n {6}[^ ]+.*$/m },
			{ spacing: 8, regex: /^{\n {8}[^ ]+.*$/m },
			{ spacing: "	", regex: /^{\n\t[^ ]+.*$/m },
		]
		for (let { spacing: n, regex: r } of t) if (r.test(e)) return n
		return 2
	}
async function Fn(e) {
	for (let t of e.resources) {
		let n = e.settings.pathPattern.replace("{language}", t.languageTag.name),
			r = t.metadata?.space || 2
		if (t.body.length === 0)
			n.split(t.languageTag.name.toString())[1].includes("/")
				? (await e.$fs.mkdir(n.replace(n.split(t.languageTag.name.toString())[1].toString(), "")),
				  n.includes("/*.json") || (await e.$fs.writeFile(n, JSON.stringify({}, null, r))))
				: await e.$fs.writeFile(n, JSON.stringify({}, null, r))
		else if (n.includes("/*.json")) {
			let i = t.body.length === 0 ? {} : JSON.parse(JSON.stringify(t.body)),
				a = []
			i.map((s) => {
				s.metadata?.fileName
					? s.metadata?.fileName &&
					  !a.includes(s.metadata?.fileName) &&
					  a.push(s.metadata?.fileName)
					: a.push(s.id.name.split(".")[0])
			})
			for (let s of a) {
				let o = i
						.filter((l) => l.id.name.startsWith(s))
						.map((l) => ({ ...l, id: { ...l.id, name: l.id.name.replace(`${s}.`, "") } })),
					u = { type: t.type, languageTag: t.languageTag, body: o }
				await e.$fs.writeFile(n.replace("*", s), Oe(u, r, e.settings.variableReferencePattern))
			}
		} else await e.$fs.writeFile(n, Oe(t, r, e.settings.variableReferencePattern))
	}
}
function Oe(e, t, n) {
	let r = {}
	return (
		e.body.forEach((i) => {
			let a = zn(i, n)
			;(0, je.default)(r, a)
		}),
		JSON.stringify(r, null, t)
	)
}
var zn = (e, t) => {
		let n = []
		for (let a of e.pattern.elements)
			a.type === "Text" || !t
				? n.push(a.value)
				: a.type === "Placeholder" &&
				  (t[1] ? n.push(`${t[0]}${a.body.name}${t[1]}`) : n.push(`${t[0]}${a.body.name}`))
		let r = n.join(""),
			i = {}
		return (
			e.metadata?.keyName
				? Ie(i, e.metadata?.parentKeys, e.metadata?.keyName, r)
				: e.metadata?.fileName
				? (i[e.id.name.split(".").slice(1).join(".")] = r)
				: (i[e.id.name] = r),
			i
		)
	},
	Ie = (e, t, n, r) => {
		!t || t.length === 0
			? (e[n] = r)
			: t.length === 1
			? (e[t[0]] = { [n]: r })
			: (e[t[0]] || (e[t[0]] = {}), Ie(e[t[0]], t.slice(1), n, r))
	}
export { En as default }
/*! Bundled license information:

@inlang/core/dist/plugin/pluginBuildConfig.js:
  (*! DON'T TOP-LEVEL IMPORT ESBUILD PLUGINS. USE DYNAMIC IMPORTS. *)
  (*! See https://github.com/inlang/inlang/issues/486 *)
*/
