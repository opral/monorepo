const yn = Object.create
const We = Object.defineProperty
const In = Object.getOwnPropertyDescriptor
const gn = Object.getOwnPropertyNames
const On = Object.getPrototypeOf,
	bn = Object.prototype.hasOwnProperty
const mn = (a, t) => () => (t || a((t = { exports: {} }).exports, t), t.exports)
const Un = (a, t, s, T) => {
	if ((t && typeof t == "object") || typeof t == "function")
		for (const c of gn(t))
			!bn.call(a, c) &&
				c !== s &&
				We(a, c, { get: () => t[c], enumerable: !(T = In(t, c)) || T.enumerable })
	return a
}
const Pn = (a, t, s) => (
	(s = a != undefined ? yn(On(a)) : {}),
	Un(t || !a || !a.__esModule ? We(s, "default", { value: a, enumerable: !0 }) : s, a)
)
const Ge = mn((i) => {
	"use strict"
	Object.defineProperty(i, "__esModule", { value: !0 })
	i.Type =
		i.JsonType =
		i.JavaScriptTypeBuilder =
		i.JsonTypeBuilder =
		i.TypeBuilder =
		i.TypeBuilderError =
		i.TransformEncodeBuilder =
		i.TransformDecodeBuilder =
		i.TemplateLiteralDslParser =
		i.TemplateLiteralGenerator =
		i.TemplateLiteralGeneratorError =
		i.TemplateLiteralFinite =
		i.TemplateLiteralFiniteError =
		i.TemplateLiteralParser =
		i.TemplateLiteralParserError =
		i.TemplateLiteralResolver =
		i.TemplateLiteralPattern =
		i.TemplateLiteralPatternError =
		i.UnionResolver =
		i.KeyArrayResolver =
		i.KeyArrayResolverError =
		i.KeyResolver =
		i.ObjectMap =
		i.Intrinsic =
		i.IndexedAccessor =
		i.TypeClone =
		i.TypeExtends =
		i.TypeExtendsResult =
		i.TypeExtendsError =
		i.ExtendsUndefined =
		i.TypeGuard =
		i.TypeGuardUnknownTypeError =
		i.ValueGuard =
		i.FormatRegistry =
		i.TypeBoxError =
		i.TypeRegistry =
		i.PatternStringExact =
		i.PatternNumberExact =
		i.PatternBooleanExact =
		i.PatternString =
		i.PatternNumber =
		i.PatternBoolean =
		i.Kind =
		i.Hint =
		i.Optional =
		i.Readonly =
		i.Transform =
			void 0
	i.Transform = Symbol.for("TypeBox.Transform")
	i.Readonly = Symbol.for("TypeBox.Readonly")
	i.Optional = Symbol.for("TypeBox.Optional")
	i.Hint = Symbol.for("TypeBox.Hint")
	i.Kind = Symbol.for("TypeBox.Kind")
	i.PatternBoolean = "(true|false)"
	i.PatternNumber = "(0|[1-9][0-9]*)"
	i.PatternString = "(.*)"
	i.PatternBooleanExact = `^${i.PatternBoolean}$`
	i.PatternNumberExact = `^${i.PatternNumber}$`
	i.PatternStringExact = `^${i.PatternString}$`
	let Be
	;(function (a) {
		const t = new Map()
		function s() {
			return new Map(t)
		}
		a.Entries = s
		function T() {
			return t.clear()
		}
		a.Clear = T
		function c(m) {
			return t.delete(m)
		}
		a.Delete = c
		function l(m) {
			return t.has(m)
		}
		a.Has = l
		function u(m, I) {
			t.set(m, I)
		}
		a.Set = u
		function d(m) {
			return t.get(m)
		}
		a.Get = d
	})(Be || (i.TypeRegistry = Be = {}))
	const M = class extends Error {
		constructor(t) {
			super(t)
		}
	}
	i.TypeBoxError = M
	let Ye
	;(function (a) {
		const t = new Map()
		function s() {
			return new Map(t)
		}
		a.Entries = s
		function T() {
			return t.clear()
		}
		a.Clear = T
		function c(m) {
			return t.delete(m)
		}
		a.Delete = c
		function l(m) {
			return t.has(m)
		}
		a.Has = l
		function u(m, I) {
			t.set(m, I)
		}
		a.Set = u
		function d(m) {
			return t.get(m)
		}
		a.Get = d
	})(Ye || (i.FormatRegistry = Ye = {}))
	let y
	;(function (a) {
		function t(I) {
			return Array.isArray(I)
		}
		a.IsArray = t
		function s(I) {
			return typeof I == "bigint"
		}
		a.IsBigInt = s
		function T(I) {
			return typeof I == "boolean"
		}
		a.IsBoolean = T
		function c(I) {
			return I === null
		}
		a.IsNull = c
		function l(I) {
			return typeof I == "number"
		}
		a.IsNumber = l
		function u(I) {
			return typeof I == "object" && I !== null
		}
		a.IsObject = u
		function d(I) {
			return typeof I == "string"
		}
		a.IsString = d
		function m(I) {
			return I === void 0
		}
		a.IsUndefined = m
	})(y || (i.ValueGuard = y = {}))
	const ke = class extends M {}
	i.TypeGuardUnknownTypeError = ke
	let o
	;(function (a) {
		function t(r) {
			try {
				return new RegExp(r), !0
			} catch {
				return !1
			}
		}
		function s(r) {
			if (!y.IsString(r)) return !1
			for (let w = 0; w < r.length; w++) {
				const B = r.charCodeAt(w)
				if ((B >= 7 && B <= 13) || B === 27 || B === 127) return !1
			}
			return !0
		}
		function T(r) {
			return u(r) || C(r)
		}
		function c(r) {
			return y.IsUndefined(r) || y.IsBigInt(r)
		}
		function l(r) {
			return y.IsUndefined(r) || y.IsNumber(r)
		}
		function u(r) {
			return y.IsUndefined(r) || y.IsBoolean(r)
		}
		function d(r) {
			return y.IsUndefined(r) || y.IsString(r)
		}
		function m(r) {
			return y.IsUndefined(r) || (y.IsString(r) && s(r) && t(r))
		}
		function I(r) {
			return y.IsUndefined(r) || (y.IsString(r) && s(r))
		}
		function g(r) {
			return y.IsUndefined(r) || C(r)
		}
		function U(r) {
			return R(r, "Any") && d(r.$id)
		}
		a.TAny = U
		function j(r) {
			return (
				R(r, "Array") &&
				r.type === "array" &&
				d(r.$id) &&
				C(r.items) &&
				l(r.minItems) &&
				l(r.maxItems) &&
				u(r.uniqueItems) &&
				g(r.contains) &&
				l(r.minContains) &&
				l(r.maxContains)
			)
		}
		a.TArray = j
		function f(r) {
			return R(r, "AsyncIterator") && r.type === "AsyncIterator" && d(r.$id) && C(r.items)
		}
		a.TAsyncIterator = f
		function O(r) {
			return (
				R(r, "BigInt") &&
				r.type === "bigint" &&
				d(r.$id) &&
				c(r.exclusiveMaximum) &&
				c(r.exclusiveMinimum) &&
				c(r.maximum) &&
				c(r.minimum) &&
				c(r.multipleOf)
			)
		}
		a.TBigInt = O
		function P(r) {
			return R(r, "Boolean") && r.type === "boolean" && d(r.$id)
		}
		a.TBoolean = P
		function N(r) {
			return (
				R(r, "Constructor") &&
				r.type === "Constructor" &&
				d(r.$id) &&
				y.IsArray(r.parameters) &&
				r.parameters.every((w) => C(w)) &&
				C(r.returns)
			)
		}
		a.TConstructor = N
		function S(r) {
			return (
				R(r, "Date") &&
				r.type === "Date" &&
				d(r.$id) &&
				l(r.exclusiveMaximumTimestamp) &&
				l(r.exclusiveMinimumTimestamp) &&
				l(r.maximumTimestamp) &&
				l(r.minimumTimestamp) &&
				l(r.multipleOfTimestamp)
			)
		}
		a.TDate = S
		function v(r) {
			return (
				R(r, "Function") &&
				r.type === "Function" &&
				d(r.$id) &&
				y.IsArray(r.parameters) &&
				r.parameters.every((w) => C(w)) &&
				C(r.returns)
			)
		}
		a.TFunction = v
		function F(r) {
			return (
				R(r, "Integer") &&
				r.type === "integer" &&
				d(r.$id) &&
				l(r.exclusiveMaximum) &&
				l(r.exclusiveMinimum) &&
				l(r.maximum) &&
				l(r.minimum) &&
				l(r.multipleOf)
			)
		}
		a.TInteger = F
		function K(r) {
			return (
				R(r, "Intersect") &&
				!(y.IsString(r.type) && r.type !== "object") &&
				y.IsArray(r.allOf) &&
				r.allOf.every((w) => C(w) && !re(w)) &&
				d(r.type) &&
				(u(r.unevaluatedProperties) || g(r.unevaluatedProperties)) &&
				d(r.$id)
			)
		}
		a.TIntersect = K
		function Te(r) {
			return R(r, "Iterator") && r.type === "Iterator" && d(r.$id) && C(r.items)
		}
		a.TIterator = Te
		function R(r, w) {
			return G(r) && r[i.Kind] === w
		}
		a.TKindOf = R
		function G(r) {
			return y.IsObject(r) && i.Kind in r && y.IsString(r[i.Kind])
		}
		a.TKind = G
		function h(r) {
			return J(r) && y.IsString(r.const)
		}
		a.TLiteralString = h
		function le(r) {
			return J(r) && y.IsNumber(r.const)
		}
		a.TLiteralNumber = le
		function Fe(r) {
			return J(r) && y.IsBoolean(r.const)
		}
		a.TLiteralBoolean = Fe
		function J(r) {
			return (
				R(r, "Literal") &&
				d(r.$id) &&
				(y.IsBoolean(r.const) || y.IsNumber(r.const) || y.IsString(r.const))
			)
		}
		a.TLiteral = J
		function ce(r) {
			return R(r, "Never") && y.IsObject(r.not) && Object.getOwnPropertyNames(r.not).length === 0
		}
		a.TNever = ce
		function $(r) {
			return R(r, "Not") && C(r.not)
		}
		a.TNot = $
		function ee(r) {
			return R(r, "Null") && r.type === "null" && d(r.$id)
		}
		a.TNull = ee
		function ne(r) {
			return (
				R(r, "Number") &&
				r.type === "number" &&
				d(r.$id) &&
				l(r.exclusiveMaximum) &&
				l(r.exclusiveMinimum) &&
				l(r.maximum) &&
				l(r.minimum) &&
				l(r.multipleOf)
			)
		}
		a.TNumber = ne
		function H(r) {
			return (
				R(r, "Object") &&
				r.type === "object" &&
				d(r.$id) &&
				y.IsObject(r.properties) &&
				T(r.additionalProperties) &&
				l(r.minProperties) &&
				l(r.maxProperties) &&
				Object.entries(r.properties).every(([w, B]) => s(w) && C(B))
			)
		}
		a.TObject = H
		function te(r) {
			return R(r, "Promise") && r.type === "Promise" && d(r.$id) && C(r.item)
		}
		a.TPromise = te
		function pe(r) {
			return (
				R(r, "Record") &&
				r.type === "object" &&
				d(r.$id) &&
				T(r.additionalProperties) &&
				y.IsObject(r.patternProperties) &&
				((w) => {
					const B = Object.getOwnPropertyNames(w.patternProperties)
					return (
						B.length === 1 &&
						t(B[0]) &&
						y.IsObject(w.patternProperties) &&
						C(w.patternProperties[B[0]])
					)
				})(r)
			)
		}
		a.TRecord = pe
		function Ae(r) {
			return y.IsObject(r) && i.Hint in r && r[i.Hint] === "Recursive"
		}
		a.TRecursive = Ae
		function de(r) {
			return R(r, "Ref") && d(r.$id) && y.IsString(r.$ref)
		}
		a.TRef = de
		function fe(r) {
			return (
				R(r, "String") &&
				r.type === "string" &&
				d(r.$id) &&
				l(r.minLength) &&
				l(r.maxLength) &&
				m(r.pattern) &&
				I(r.format)
			)
		}
		a.TString = fe
		function ye(r) {
			return R(r, "Symbol") && r.type === "symbol" && d(r.$id)
		}
		a.TSymbol = ye
		function V(r) {
			return (
				R(r, "TemplateLiteral") &&
				r.type === "string" &&
				y.IsString(r.pattern) &&
				r.pattern[0] === "^" &&
				r.pattern.at(-1) === "$"
			)
		}
		a.TTemplateLiteral = V
		function Ie(r) {
			return R(r, "This") && d(r.$id) && y.IsString(r.$ref)
		}
		a.TThis = Ie
		function re(r) {
			return y.IsObject(r) && i.Transform in r
		}
		a.TTransform = re
		function A(r) {
			return (
				R(r, "Tuple") &&
				r.type === "array" &&
				d(r.$id) &&
				y.IsNumber(r.minItems) &&
				y.IsNumber(r.maxItems) &&
				r.minItems === r.maxItems &&
				((y.IsUndefined(r.items) && y.IsUndefined(r.additionalItems) && r.minItems === 0) ||
					(y.IsArray(r.items) && r.items.every((w) => C(w))))
			)
		}
		a.TTuple = A
		function ge(r) {
			return R(r, "Undefined") && r.type === "undefined" && d(r.$id)
		}
		a.TUndefined = ge
		function Ce(r) {
			return q(r) && r.anyOf.every((w) => h(w) || le(w))
		}
		a.TUnionLiteral = Ce
		function q(r) {
			return (
				R(r, "Union") &&
				d(r.$id) &&
				y.IsObject(r) &&
				y.IsArray(r.anyOf) &&
				r.anyOf.every((w) => C(w))
			)
		}
		a.TUnion = q
		function W(r) {
			return (
				R(r, "Uint8Array") &&
				r.type === "Uint8Array" &&
				d(r.$id) &&
				l(r.minByteLength) &&
				l(r.maxByteLength)
			)
		}
		a.TUint8Array = W
		function E(r) {
			return R(r, "Unknown") && d(r.$id)
		}
		a.TUnknown = E
		function Oe(r) {
			return R(r, "Unsafe")
		}
		a.TUnsafe = Oe
		function ie(r) {
			return R(r, "Void") && r.type === "void" && d(r.$id)
		}
		a.TVoid = ie
		function $e(r) {
			return y.IsObject(r) && r[i.Readonly] === "Readonly"
		}
		a.TReadonly = $e
		function Ke(r) {
			return y.IsObject(r) && r[i.Optional] === "Optional"
		}
		a.TOptional = Ke
		function C(r) {
			return (
				y.IsObject(r) &&
				(U(r) ||
					j(r) ||
					P(r) ||
					O(r) ||
					f(r) ||
					N(r) ||
					S(r) ||
					v(r) ||
					F(r) ||
					K(r) ||
					Te(r) ||
					J(r) ||
					ce(r) ||
					$(r) ||
					ee(r) ||
					ne(r) ||
					H(r) ||
					te(r) ||
					pe(r) ||
					de(r) ||
					fe(r) ||
					ye(r) ||
					V(r) ||
					Ie(r) ||
					A(r) ||
					ge(r) ||
					q(r) ||
					W(r) ||
					E(r) ||
					Oe(r) ||
					ie(r) ||
					(G(r) && Be.Has(r[i.Kind])))
			)
		}
		a.TSchema = C
	})(o || (i.TypeGuard = o = {}))
	let Ze
	;(function (a) {
		function t(s) {
			return s[i.Kind] === "Intersect"
				? s.allOf.every((T) => t(T))
				: s[i.Kind] === "Union"
				? s.anyOf.some((T) => t(T))
				: s[i.Kind] === "Undefined"
				? !0
				: s[i.Kind] === "Not"
				? !t(s.not)
				: !1
		}
		a.Check = t
	})(Ze || (i.ExtendsUndefined = Ze = {}))
	const be = class extends M {}
	i.TypeExtendsError = be
	let p
	;(function (a) {
		;(a[(a.Union = 0)] = "Union"), (a[(a.True = 1)] = "True"), (a[(a.False = 2)] = "False")
	})(p || (i.TypeExtendsResult = p = {}))
	let z
	;(function (a) {
		function t(e) {
			return e === p.False ? e : p.True
		}
		function s(e) {
			throw new be(e)
		}
		function T(e) {
			return o.TNever(e) || o.TIntersect(e) || o.TUnion(e) || o.TUnknown(e) || o.TAny(e)
		}
		function c(e, n) {
			return o.TNever(n)
				? R(e, n)
				: o.TIntersect(n)
				? v(e, n)
				: o.TUnion(n)
				? Ee(e, n)
				: o.TUnknown(n)
				? He(e, n)
				: o.TAny(n)
				? l(e, n)
				: s("StructuralRight")
		}
		function l(e, n) {
			return p.True
		}
		function u(e, n) {
			return o.TIntersect(n)
				? v(e, n)
				: o.TUnion(n) && n.anyOf.some((x) => o.TAny(x) || o.TUnknown(x))
				? p.True
				: o.TUnion(n)
				? p.Union
				: o.TUnknown(n) || o.TAny(n)
				? p.True
				: p.Union
		}
		function d(e, n) {
			return o.TUnknown(e) ? p.False : o.TAny(e) ? p.Union : o.TNever(e) ? p.True : p.False
		}
		function m(e, n) {
			return o.TObject(n) && V(n)
				? p.True
				: T(n)
				? c(e, n)
				: o.TArray(n)
				? t(L(e.items, n.items))
				: p.False
		}
		function I(e, n) {
			return T(n) ? c(e, n) : o.TAsyncIterator(n) ? t(L(e.items, n.items)) : p.False
		}
		function g(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TBigInt(n)
				? p.True
				: p.False
		}
		function U(e, n) {
			return (o.TLiteral(e) && y.IsBoolean(e.const)) || o.TBoolean(e) ? p.True : p.False
		}
		function j(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TBoolean(n)
				? p.True
				: p.False
		}
		function f(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TConstructor(n)
				? e.parameters.length > n.parameters.length
					? p.False
					: e.parameters.every((x, k) => t(L(n.parameters[k], x)) === p.True)
					? t(L(e.returns, n.returns))
					: p.False
				: p.False
		}
		function O(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TDate(n)
				? p.True
				: p.False
		}
		function P(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TFunction(n)
				? e.parameters.length > n.parameters.length
					? p.False
					: e.parameters.every((x, k) => t(L(n.parameters[k], x)) === p.True)
					? t(L(e.returns, n.returns))
					: p.False
				: p.False
		}
		function N(e, n) {
			return (o.TLiteral(e) && y.IsNumber(e.const)) || o.TNumber(e) || o.TInteger(e)
				? p.True
				: p.False
		}
		function S(e, n) {
			return o.TInteger(n) || o.TNumber(n)
				? p.True
				: T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: p.False
		}
		function v(e, n) {
			return n.allOf.every((x) => L(e, x) === p.True) ? p.True : p.False
		}
		function F(e, n) {
			return e.allOf.some((x) => L(x, n) === p.True) ? p.True : p.False
		}
		function K(e, n) {
			return T(n) ? c(e, n) : o.TIterator(n) ? t(L(e.items, n.items)) : p.False
		}
		function Te(e, n) {
			return o.TLiteral(n) && n.const === e.const
				? p.True
				: T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TString(n)
				? ie(e, n)
				: o.TNumber(n)
				? J(e, n)
				: o.TInteger(n)
				? N(e, n)
				: o.TBoolean(n)
				? U(e, n)
				: p.False
		}
		function R(e, n) {
			return p.False
		}
		function G(e, n) {
			return p.True
		}
		function h(e) {
			let [n, x] = [e, 0]
			for (; o.TNot(n); ) (n = n.not), (x += 1)
			return x % 2 === 0 ? n : i.Type.Unknown()
		}
		function le(e, n) {
			return o.TNot(e) ? L(h(e), n) : o.TNot(n) ? L(e, h(n)) : s("Invalid fallthrough for Not")
		}
		function Fe(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TNull(n)
				? p.True
				: p.False
		}
		function J(e, n) {
			return o.TLiteralNumber(e) || o.TNumber(e) || o.TInteger(e) ? p.True : p.False
		}
		function ce(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TInteger(n) || o.TNumber(n)
				? p.True
				: p.False
		}
		function $(e, n) {
			return Object.getOwnPropertyNames(e.properties).length === n
		}
		function ee(e) {
			return V(e)
		}
		function ne(e) {
			return (
				$(e, 0) ||
				($(e, 1) &&
					"description" in e.properties &&
					o.TUnion(e.properties.description) &&
					e.properties.description.anyOf.length === 2 &&
					((o.TString(e.properties.description.anyOf[0]) &&
						o.TUndefined(e.properties.description.anyOf[1])) ||
						(o.TString(e.properties.description.anyOf[1]) &&
							o.TUndefined(e.properties.description.anyOf[0]))))
			)
		}
		function H(e) {
			return $(e, 0)
		}
		function te(e) {
			return $(e, 0)
		}
		function pe(e) {
			return $(e, 0)
		}
		function Ae(e) {
			return $(e, 0)
		}
		function de(e) {
			return V(e)
		}
		function fe(e) {
			const n = i.Type.Number()
			return (
				$(e, 0) || ($(e, 1) && "length" in e.properties && t(L(e.properties.length, n)) === p.True)
			)
		}
		function ye(e) {
			return $(e, 0)
		}
		function V(e) {
			const n = i.Type.Number()
			return (
				$(e, 0) || ($(e, 1) && "length" in e.properties && t(L(e.properties.length, n)) === p.True)
			)
		}
		function Ie(e) {
			const n = i.Type.Function([i.Type.Any()], i.Type.Any())
			return $(e, 0) || ($(e, 1) && "then" in e.properties && t(L(e.properties.then, n)) === p.True)
		}
		function re(e, n) {
			return L(e, n) === p.False || (o.TOptional(e) && !o.TOptional(n)) ? p.False : p.True
		}
		function A(e, n) {
			return o.TUnknown(e)
				? p.False
				: o.TAny(e)
				? p.Union
				: o.TNever(e) ||
				  (o.TLiteralString(e) && ee(n)) ||
				  (o.TLiteralNumber(e) && H(n)) ||
				  (o.TLiteralBoolean(e) && te(n)) ||
				  (o.TSymbol(e) && ne(n)) ||
				  (o.TBigInt(e) && pe(n)) ||
				  (o.TString(e) && ee(n)) ||
				  (o.TSymbol(e) && ne(n)) ||
				  (o.TNumber(e) && H(n)) ||
				  (o.TInteger(e) && H(n)) ||
				  (o.TBoolean(e) && te(n)) ||
				  (o.TUint8Array(e) && de(n)) ||
				  (o.TDate(e) && Ae(n)) ||
				  (o.TConstructor(e) && ye(n)) ||
				  (o.TFunction(e) && fe(n))
				? p.True
				: o.TRecord(e) && o.TString(q(e))
				? (() => (n[i.Hint] === "Record" ? p.True : p.False))()
				: o.TRecord(e) && o.TNumber(q(e))
				? (() => ($(n, 0) ? p.True : p.False))()
				: p.False
		}
		function ge(e, n) {
			return T(n)
				? c(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TObject(n)
				? (() => {
						for (const x of Object.getOwnPropertyNames(n.properties)) {
							if (!(x in e.properties) && !o.TOptional(n.properties[x])) return p.False
							if (o.TOptional(n.properties[x])) return p.True
							if (re(e.properties[x], n.properties[x]) === p.False) return p.False
						}
						return p.True
				  })()
				: p.False
		}
		function Ce(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n) && Ie(n)
				? p.True
				: o.TPromise(n)
				? t(L(e.item, n.item))
				: p.False
		}
		function q(e) {
			return i.PatternNumberExact in e.patternProperties
				? i.Type.Number()
				: i.PatternStringExact in e.patternProperties
				? i.Type.String()
				: s("Unknown record key pattern")
		}
		function W(e) {
			return i.PatternNumberExact in e.patternProperties
				? e.patternProperties[i.PatternNumberExact]
				: i.PatternStringExact in e.patternProperties
				? e.patternProperties[i.PatternStringExact]
				: s("Unable to get record value schema")
		}
		function E(e, n) {
			const [x, k] = [q(n), W(n)]
			return o.TLiteralString(e) && o.TNumber(x) && t(L(e, k)) === p.True
				? p.True
				: (o.TUint8Array(e) && o.TNumber(x)) ||
				  (o.TString(e) && o.TNumber(x)) ||
				  (o.TArray(e) && o.TNumber(x))
				? L(e, k)
				: o.TObject(e)
				? (() => {
						for (const fn of Object.getOwnPropertyNames(e.properties))
							if (re(k, e.properties[fn]) === p.False) return p.False
						return p.True
				  })()
				: p.False
		}
		function Oe(e, n) {
			return T(n) ? c(e, n) : o.TObject(n) ? A(e, n) : o.TRecord(n) ? L(W(e), W(n)) : p.False
		}
		function ie(e, n) {
			return (o.TLiteral(e) && y.IsString(e.const)) || o.TString(e) ? p.True : p.False
		}
		function $e(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TString(n)
				? p.True
				: p.False
		}
		function Ke(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TSymbol(n)
				? p.True
				: p.False
		}
		function C(e, n) {
			return o.TTemplateLiteral(e)
				? L(D.Resolve(e), n)
				: o.TTemplateLiteral(n)
				? L(e, D.Resolve(n))
				: s("Invalid fallthrough for TemplateLiteral")
		}
		function r(e, n) {
			return o.TArray(n) && e.items !== void 0 && e.items.every((x) => L(x, n.items) === p.True)
		}
		function w(e, n) {
			return o.TNever(e) ? p.True : o.TUnknown(e) ? p.False : o.TAny(e) ? p.Union : p.False
		}
		function B(e, n) {
			return T(n)
				? c(e, n)
				: (o.TObject(n) && V(n)) || (o.TArray(n) && r(e, n))
				? p.True
				: o.TTuple(n)
				? (y.IsUndefined(e.items) && !y.IsUndefined(n.items)) ||
				  (!y.IsUndefined(e.items) && y.IsUndefined(n.items))
					? p.False
					: (y.IsUndefined(e.items) && !y.IsUndefined(n.items)) ||
					  e.items.every((x, k) => L(x, n.items[k]) === p.True)
					? p.True
					: p.False
				: p.False
		}
		function un(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TUint8Array(n)
				? p.True
				: p.False
		}
		function an(e, n) {
			return T(n)
				? c(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TRecord(n)
				? E(e, n)
				: o.TVoid(n)
				? cn(e, n)
				: o.TUndefined(n)
				? p.True
				: p.False
		}
		function Ee(e, n) {
			return n.anyOf.some((x) => L(e, x) === p.True) ? p.True : p.False
		}
		function Tn(e, n) {
			return e.anyOf.every((x) => L(x, n) === p.True) ? p.True : p.False
		}
		function He(e, n) {
			return p.True
		}
		function ln(e, n) {
			return o.TNever(n)
				? R(e, n)
				: o.TIntersect(n)
				? v(e, n)
				: o.TUnion(n)
				? Ee(e, n)
				: o.TAny(n)
				? l(e, n)
				: o.TString(n)
				? ie(e, n)
				: o.TNumber(n)
				? J(e, n)
				: o.TInteger(n)
				? N(e, n)
				: o.TBoolean(n)
				? U(e, n)
				: o.TArray(n)
				? d(e, n)
				: o.TTuple(n)
				? w(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TUnknown(n)
				? p.True
				: p.False
		}
		function cn(e, n) {
			return o.TUndefined(e) || o.TUndefined(e) ? p.True : p.False
		}
		function pn(e, n) {
			return o.TIntersect(n)
				? v(e, n)
				: o.TUnion(n)
				? Ee(e, n)
				: o.TUnknown(n)
				? He(e, n)
				: o.TAny(n)
				? l(e, n)
				: o.TObject(n)
				? A(e, n)
				: o.TVoid(n)
				? p.True
				: p.False
		}
		function L(e, n) {
			return o.TTemplateLiteral(e) || o.TTemplateLiteral(n)
				? C(e, n)
				: o.TNot(e) || o.TNot(n)
				? le(e, n)
				: o.TAny(e)
				? u(e, n)
				: o.TArray(e)
				? m(e, n)
				: o.TBigInt(e)
				? g(e, n)
				: o.TBoolean(e)
				? j(e, n)
				: o.TAsyncIterator(e)
				? I(e, n)
				: o.TConstructor(e)
				? f(e, n)
				: o.TDate(e)
				? O(e, n)
				: o.TFunction(e)
				? P(e, n)
				: o.TInteger(e)
				? S(e, n)
				: o.TIntersect(e)
				? F(e, n)
				: o.TIterator(e)
				? K(e, n)
				: o.TLiteral(e)
				? Te(e, n)
				: o.TNever(e)
				? G(e, n)
				: o.TNull(e)
				? Fe(e, n)
				: o.TNumber(e)
				? ce(e, n)
				: o.TObject(e)
				? ge(e, n)
				: o.TRecord(e)
				? Oe(e, n)
				: o.TString(e)
				? $e(e, n)
				: o.TSymbol(e)
				? Ke(e, n)
				: o.TTuple(e)
				? B(e, n)
				: o.TPromise(e)
				? Ce(e, n)
				: o.TUint8Array(e)
				? un(e, n)
				: o.TUndefined(e)
				? an(e, n)
				: o.TUnion(e)
				? Tn(e, n)
				: o.TUnknown(e)
				? ln(e, n)
				: o.TVoid(e)
				? pn(e, n)
				: s(`Unknown left type operand '${e[i.Kind]}'`)
		}
		function dn(e, n) {
			return L(e, n)
		}
		a.Extends = dn
	})(z || (i.TypeExtends = z = {}))
	let b
	;(function (a) {
		function t(u) {
			const d = Object.fromEntries(Object.getOwnPropertyNames(u).map((g) => [g, T(u[g])])),
				m = Object.fromEntries(Object.getOwnPropertySymbols(u).map((g) => [g, T(u[g])]))
			return { ...d, ...m }
		}
		function s(u) {
			return u.map((d) => T(d))
		}
		function T(u) {
			return y.IsArray(u) ? s(u) : y.IsObject(u) ? t(u) : u
		}
		function c(u) {
			return u.map((d) => l(d))
		}
		a.Rest = c
		function l(u, d = {}) {
			return { ...T(u), ...d }
		}
		a.Type = l
	})(b || (i.TypeClone = b = {}))
	let Me
	;(function (a) {
		function t(f) {
			return f.map((O) => {
				const { [i.Optional]: P, ...N } = b.Type(O)
				return N
			})
		}
		function s(f) {
			return f.every((O) => o.TOptional(O))
		}
		function T(f) {
			return f.some((O) => o.TOptional(O))
		}
		function c(f) {
			return s(f.allOf) ? i.Type.Optional(i.Type.Intersect(t(f.allOf))) : f
		}
		function l(f) {
			return T(f.anyOf) ? i.Type.Optional(i.Type.Union(t(f.anyOf))) : f
		}
		function u(f) {
			return f[i.Kind] === "Intersect" ? c(f) : f[i.Kind] === "Union" ? l(f) : f
		}
		function d(f, O) {
			const P = f.allOf.reduce((N, S) => {
				const v = U(S, O)
				return v[i.Kind] === "Never" ? N : [...N, v]
			}, [])
			return u(i.Type.Intersect(P))
		}
		function m(f, O) {
			const P = f.anyOf.map((N) => U(N, O))
			return u(i.Type.Union(P))
		}
		function I(f, O) {
			const P = f.properties[O]
			return y.IsUndefined(P) ? i.Type.Never() : i.Type.Union([P])
		}
		function g(f, O) {
			const P = f.items
			if (y.IsUndefined(P)) return i.Type.Never()
			const N = P[O]
			return y.IsUndefined(N) ? i.Type.Never() : N
		}
		function U(f, O) {
			return f[i.Kind] === "Intersect"
				? d(f, O)
				: f[i.Kind] === "Union"
				? m(f, O)
				: f[i.Kind] === "Object"
				? I(f, O)
				: f[i.Kind] === "Tuple"
				? g(f, O)
				: i.Type.Never()
		}
		function j(f, O, P = {}) {
			const N = O.map((S) => U(f, S.toString()))
			return u(i.Type.Union(N, P))
		}
		a.Resolve = j
	})(Me || (i.IndexedAccessor = Me = {}))
	let _
	;(function (a) {
		function t(g) {
			const [U, j] = [g.slice(0, 1), g.slice(1)]
			return `${U.toLowerCase()}${j}`
		}
		function s(g) {
			const [U, j] = [g.slice(0, 1), g.slice(1)]
			return `${U.toUpperCase()}${j}`
		}
		function T(g) {
			return g.toUpperCase()
		}
		function c(g) {
			return g.toLowerCase()
		}
		function l(g, U) {
			const j = X.ParseExact(g.pattern)
			if (!Y.Check(j)) return { ...g, pattern: u(g.pattern, U) }
			const P = [...Z.Generate(j)].map((v) => i.Type.Literal(v)),
				N = d(P, U),
				S = i.Type.Union(N)
			return i.Type.TemplateLiteral([S])
		}
		function u(g, U) {
			return typeof g == "string"
				? U === "Uncapitalize"
					? t(g)
					: U === "Capitalize"
					? s(g)
					: U === "Uppercase"
					? T(g)
					: U === "Lowercase"
					? c(g)
					: g
				: g.toString()
		}
		function d(g, U) {
			if (g.length === 0) return []
			const [j, ...f] = g
			return [I(j, U), ...d(f, U)]
		}
		function m(g, U) {
			return o.TTemplateLiteral(g)
				? l(g, U)
				: o.TUnion(g)
				? i.Type.Union(d(g.anyOf, U))
				: o.TLiteral(g)
				? i.Type.Literal(u(g.const, U))
				: g
		}
		function I(g, U) {
			return m(g, U)
		}
		a.Map = I
	})(_ || (i.Intrinsic = _ = {}))
	let Q
	;(function (a) {
		function t(u, d) {
			return i.Type.Intersect(
				u.allOf.map((m) => c(m, d)),
				{ ...u }
			)
		}
		function s(u, d) {
			return i.Type.Union(
				u.anyOf.map((m) => c(m, d)),
				{ ...u }
			)
		}
		function T(u, d) {
			return d(u)
		}
		function c(u, d) {
			return u[i.Kind] === "Intersect"
				? t(u, d)
				: u[i.Kind] === "Union"
				? s(u, d)
				: u[i.Kind] === "Object"
				? T(u, d)
				: u
		}
		function l(u, d, m) {
			return { ...c(b.Type(u), d), ...m }
		}
		a.Map = l
	})(Q || (i.ObjectMap = Q = {}))
	let me
	;(function (a) {
		function t(I) {
			return I[0] === "^" && I.at(-1) === "$" ? I.slice(1, I.length - 1) : I
		}
		function s(I, g) {
			return I.allOf.reduce((U, j) => [...U, ...u(j, g)], [])
		}
		function T(I, g) {
			const U = I.anyOf.map((j) => u(j, g))
			return [
				...U.reduce(
					(j, f) => f.map((O) => (U.every((P) => P.includes(O)) ? j.add(O) : j))[0],
					new Set()
				),
			]
		}
		function c(I, g) {
			return Object.getOwnPropertyNames(I.properties)
		}
		function l(I, g) {
			return g.includePatterns ? Object.getOwnPropertyNames(I.patternProperties) : []
		}
		function u(I, g) {
			return o.TIntersect(I)
				? s(I, g)
				: o.TUnion(I)
				? T(I, g)
				: o.TObject(I)
				? c(I, g)
				: o.TRecord(I)
				? l(I, g)
				: []
		}
		function d(I, g) {
			return [...new Set(u(I, g))]
		}
		a.ResolveKeys = d
		function m(I) {
			return `^(${d(I, { includePatterns: !0 })
				.map((j) => `(${t(j)})`)
				.join("|")})$`
		}
		a.ResolvePattern = m
	})(me || (i.KeyResolver = me = {}))
	const Ue = class extends M {}
	i.KeyArrayResolverError = Ue
	let oe
	;(function (a) {
		function t(s) {
			return Array.isArray(s)
				? s
				: o.TUnionLiteral(s)
				? s.anyOf.map((T) => T.const.toString())
				: o.TLiteral(s)
				? [s.const]
				: o.TTemplateLiteral(s)
				? (() => {
						const T = X.ParseExact(s.pattern)
						if (!Y.Check(T)) throw new Ue("Cannot resolve keys from infinite template expression")
						return [...Z.Generate(T)]
				  })()
				: []
		}
		a.Resolve = t
	})(oe || (i.KeyArrayResolver = oe = {}))
	let De
	;(function (a) {
		function* t(T) {
			for (const c of T.anyOf) c[i.Kind] === "Union" ? yield* t(c) : yield c
		}
		function s(T) {
			return i.Type.Union([...t(T)], { ...T })
		}
		a.Resolve = s
	})(De || (i.UnionResolver = De = {}))
	const Pe = class extends M {}
	i.TemplateLiteralPatternError = Pe
	let Re
	;(function (a) {
		function t(l) {
			throw new Pe(l)
		}
		function s(l) {
			return l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		}
		function T(l, u) {
			return o.TTemplateLiteral(l)
				? l.pattern.slice(1, l.pattern.length - 1)
				: o.TUnion(l)
				? `(${l.anyOf.map((d) => T(d, u)).join("|")})`
				: o.TNumber(l)
				? `${u}${i.PatternNumber}`
				: o.TInteger(l)
				? `${u}${i.PatternNumber}`
				: o.TBigInt(l)
				? `${u}${i.PatternNumber}`
				: o.TString(l)
				? `${u}${i.PatternString}`
				: o.TLiteral(l)
				? `${u}${s(l.const.toString())}`
				: o.TBoolean(l)
				? `${u}${i.PatternBoolean}`
				: t(`Unexpected Kind '${l[i.Kind]}'`)
		}
		function c(l) {
			return `^${l.map((u) => T(u, "")).join("")}$`
		}
		a.Create = c
	})(Re || (i.TemplateLiteralPattern = Re = {}))
	let D
	;(function (a) {
		function t(s) {
			const T = X.ParseExact(s.pattern)
			if (!Y.Check(T)) return i.Type.String()
			const c = [...Z.Generate(T)].map((l) => i.Type.Literal(l))
			return i.Type.Union(c)
		}
		a.Resolve = t
	})(D || (i.TemplateLiteralResolver = D = {}))
	const se = class extends M {}
	i.TemplateLiteralParserError = se
	let X
	;(function (a) {
		function t(f, O, P) {
			return f[O] === P && f.charCodeAt(O - 1) !== 92
		}
		function s(f, O) {
			return t(f, O, "(")
		}
		function T(f, O) {
			return t(f, O, ")")
		}
		function c(f, O) {
			return t(f, O, "|")
		}
		function l(f) {
			if (!(s(f, 0) && T(f, f.length - 1))) return !1
			let O = 0
			for (let P = 0; P < f.length; P++)
				if ((s(f, P) && (O += 1), T(f, P) && (O -= 1), O === 0 && P !== f.length - 1)) return !1
			return !0
		}
		function u(f) {
			return f.slice(1, f.length - 1)
		}
		function d(f) {
			let O = 0
			for (let P = 0; P < f.length; P++)
				if ((s(f, P) && (O += 1), T(f, P) && (O -= 1), c(f, P) && O === 0)) return !0
			return !1
		}
		function m(f) {
			for (let O = 0; O < f.length; O++) if (s(f, O)) return !0
			return !1
		}
		function I(f) {
			let [O, P] = [0, 0],
				N = []
			for (let v = 0; v < f.length; v++)
				if ((s(f, v) && (O += 1), T(f, v) && (O -= 1), c(f, v) && O === 0)) {
					const F = f.slice(P, v)
					F.length > 0 && N.push(U(F)), (P = v + 1)
				}
			const S = f.slice(P)
			return (
				S.length > 0 && N.push(U(S)),
				N.length === 0
					? { type: "const", const: "" }
					: N.length === 1
					? N[0]
					: { type: "or", expr: N }
			)
		}
		function g(f) {
			function O(S, v) {
				if (!s(S, v)) throw new se("TemplateLiteralParser: Index must point to open parens")
				let F = 0
				for (let K = v; K < S.length; K++)
					if ((s(S, K) && (F += 1), T(S, K) && (F -= 1), F === 0)) return [v, K]
				throw new se("TemplateLiteralParser: Unclosed group parens in expression")
			}
			function P(S, v) {
				for (let F = v; F < S.length; F++) if (s(S, F)) return [v, F]
				return [v, S.length]
			}
			const N = []
			for (let S = 0; S < f.length; S++)
				if (s(f, S)) {
					const [v, F] = O(f, S),
						K = f.slice(v, F + 1)
					N.push(U(K)), (S = F)
				} else {
					const [v, F] = P(f, S),
						K = f.slice(v, F)
					K.length > 0 && N.push(U(K)), (S = F - 1)
				}
			return N.length === 0
				? { type: "const", const: "" }
				: N.length === 1
				? N[0]
				: { type: "and", expr: N }
		}
		function U(f) {
			return l(f) ? U(u(f)) : d(f) ? I(f) : m(f) ? g(f) : { type: "const", const: f }
		}
		a.Parse = U
		function j(f) {
			return U(f.slice(1, f.length - 1))
		}
		a.ParseExact = j
	})(X || (i.TemplateLiteralParser = X = {}))
	const Ne = class extends M {}
	i.TemplateLiteralFiniteError = Ne
	let Y
	;(function (a) {
		function t(u) {
			throw new Ne(u)
		}
		function s(u) {
			return (
				u.type === "or" &&
				u.expr.length === 2 &&
				u.expr[0].type === "const" &&
				u.expr[0].const === "0" &&
				u.expr[1].type === "const" &&
				u.expr[1].const === "[1-9][0-9]*"
			)
		}
		function T(u) {
			return (
				u.type === "or" &&
				u.expr.length === 2 &&
				u.expr[0].type === "const" &&
				u.expr[0].const === "true" &&
				u.expr[1].type === "const" &&
				u.expr[1].const === "false"
			)
		}
		function c(u) {
			return u.type === "const" && u.const === ".*"
		}
		function l(u) {
			return T(u)
				? !0
				: s(u) || c(u)
				? !1
				: u.type === "and"
				? u.expr.every((d) => l(d))
				: u.type === "or"
				? u.expr.every((d) => l(d))
				: u.type === "const"
				? !0
				: t("Unknown expression type")
		}
		a.Check = l
	})(Y || (i.TemplateLiteralFinite = Y = {}))
	const ve = class extends M {}
	i.TemplateLiteralGeneratorError = ve
	let Z
	;(function (a) {
		function* t(u) {
			if (u.length === 1) return yield* u[0]
			for (const d of u[0]) for (const m of t(u.slice(1))) yield `${d}${m}`
		}
		function* s(u) {
			return yield* t(u.expr.map((d) => [...l(d)]))
		}
		function* T(u) {
			for (const d of u.expr) yield* l(d)
		}
		function* c(u) {
			return yield u.const
		}
		function* l(u) {
			return u.type === "and"
				? yield* s(u)
				: u.type === "or"
				? yield* T(u)
				: u.type === "const"
				? yield* c(u)
				: (() => {
						throw new ve("Unknown expression")
				  })()
		}
		a.Generate = l
	})(Z || (i.TemplateLiteralGenerator = Z = {}))
	let Je
	;(function (a) {
		function* t(l) {
			const u = l.trim().replace(/"|'/g, "")
			return u === "boolean"
				? yield i.Type.Boolean()
				: u === "number"
				? yield i.Type.Number()
				: u === "bigint"
				? yield i.Type.BigInt()
				: u === "string"
				? yield i.Type.String()
				: yield (() => {
						const d = u.split("|").map((m) => i.Type.Literal(m.trim()))
						return d.length === 0 ? i.Type.Never() : d.length === 1 ? d[0] : i.Type.Union(d)
				  })()
		}
		function* s(l) {
			if (l[1] !== "{") {
				const u = i.Type.Literal("$"),
					d = T(l.slice(1))
				return yield* [u, ...d]
			}
			for (let u = 2; u < l.length; u++)
				if (l[u] === "}") {
					const d = t(l.slice(2, u)),
						m = T(l.slice(u + 1))
					return yield* [...d, ...m]
				}
			yield i.Type.Literal(l)
		}
		function* T(l) {
			for (let u = 0; u < l.length; u++)
				if (l[u] === "$") {
					const d = i.Type.Literal(l.slice(0, u)),
						m = s(l.slice(u))
					return yield* [d, ...m]
				}
			yield i.Type.Literal(l)
		}
		function c(l) {
			return [...T(l)]
		}
		a.Parse = c
	})(Je || (i.TemplateLiteralDslParser = Je = {}))
	const xe = class {
		constructor(t) {
			this.schema = t
		}
		Decode(t) {
			return new Se(this.schema, t)
		}
	}
	i.TransformDecodeBuilder = xe
	var Se = class {
		constructor(t, s) {
			;(this.schema = t), (this.decode = s)
		}
		Encode(t) {
			const s = b.Type(this.schema)
			return o.TTransform(s)
				? (() => {
						const l = {
							Encode: (u) => s[i.Transform].Encode(t(u)),
							Decode: (u) => this.decode(s[i.Transform].Decode(u)),
						}
						return { ...s, [i.Transform]: l }
				  })()
				: (() => {
						const T = { Decode: this.decode, Encode: t }
						return { ...s, [i.Transform]: T }
				  })()
		}
	}
	i.TransformEncodeBuilder = Se
	let Rn = 0,
		Le = class extends M {}
	i.TypeBuilderError = Le
	const we = class {
		Create(t) {
			return t
		}
		Throw(t) {
			throw new Le(t)
		}
		Discard(t, s) {
			return s.reduce((T, c) => {
				const { [c]: l, ...u } = T
				return u
			}, t)
		}
		Strict(t) {
			return JSON.parse(JSON.stringify(t))
		}
	}
	i.TypeBuilder = we
	const ue = class extends we {
		ReadonlyOptional(t) {
			return this.Readonly(this.Optional(t))
		}
		Readonly(t) {
			return { ...b.Type(t), [i.Readonly]: "Readonly" }
		}
		Optional(t) {
			return { ...b.Type(t), [i.Optional]: "Optional" }
		}
		Any(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Any" })
		}
		Array(t, s = {}) {
			return this.Create({ ...s, [i.Kind]: "Array", type: "array", items: b.Type(t) })
		}
		Boolean(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Boolean", type: "boolean" })
		}
		Capitalize(t, s = {}) {
			return { ..._.Map(b.Type(t), "Capitalize"), ...s }
		}
		Composite(t, s) {
			const T = i.Type.Intersect(t, {}),
				l = Object.fromEntries(
					me.ResolveKeys(T, { includePatterns: !1 }).map((d) => [d, i.Type.Index(T, [d])])
				)
			return i.Type.Object(l, s)
		}
		Enum(t, s = {}) {
			if (y.IsUndefined(t)) return this.Throw("Enum undefined or empty")
			const T = Object.getOwnPropertyNames(t)
					.filter((u) => isNaN(u))
					.map((u) => t[u]),
				l = [...new Set(T)].map((u) => i.Type.Literal(u))
			return this.Union(l, { ...s, [i.Hint]: "Enum" })
		}
		Extends(t, s, T, c, l = {}) {
			switch (z.Extends(t, s)) {
				case p.Union:
					return this.Union([b.Type(T, l), b.Type(c, l)])
				case p.True:
					return b.Type(T, l)
				case p.False:
					return b.Type(c, l)
			}
		}
		Exclude(t, s, T = {}) {
			return o.TTemplateLiteral(t)
				? this.Exclude(D.Resolve(t), s, T)
				: o.TTemplateLiteral(s)
				? this.Exclude(t, D.Resolve(s), T)
				: o.TUnion(t)
				? (() => {
						const c = t.anyOf.filter((l) => z.Extends(l, s) === p.False)
						return c.length === 1 ? b.Type(c[0], T) : this.Union(c, T)
				  })()
				: z.Extends(t, s) !== p.False
				? this.Never(T)
				: b.Type(t, T)
		}
		Extract(t, s, T = {}) {
			return o.TTemplateLiteral(t)
				? this.Extract(D.Resolve(t), s, T)
				: o.TTemplateLiteral(s)
				? this.Extract(t, D.Resolve(s), T)
				: o.TUnion(t)
				? (() => {
						const c = t.anyOf.filter((l) => z.Extends(l, s) !== p.False)
						return c.length === 1 ? b.Type(c[0], T) : this.Union(c, T)
				  })()
				: z.Extends(t, s) !== p.False
				? b.Type(t, T)
				: this.Never(T)
		}
		Index(t, s, T = {}) {
			return o.TArray(t) && o.TNumber(s)
				? (() => b.Type(t.items, T))()
				: o.TTuple(t) && o.TNumber(s)
				? (() => {
						const l = (y.IsUndefined(t.items) ? [] : t.items).map((u) => b.Type(u))
						return this.Union(l, T)
				  })()
				: (() => {
						const c = oe.Resolve(s),
							l = b.Type(t)
						return Me.Resolve(l, c, T)
				  })()
		}
		Integer(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Integer", type: "integer" })
		}
		Intersect(t, s = {}) {
			if (t.length === 0) return i.Type.Never()
			if (t.length === 1) return b.Type(t[0], s)
			t.some((u) => o.TTransform(u)) && this.Throw("Cannot intersect transform types")
			const T = t.every((u) => o.TObject(u)),
				c = b.Rest(t),
				l = o.TSchema(s.unevaluatedProperties)
					? { unevaluatedProperties: b.Type(s.unevaluatedProperties) }
					: {}
			return s.unevaluatedProperties === !1 || o.TSchema(s.unevaluatedProperties) || T
				? this.Create({ ...s, ...l, [i.Kind]: "Intersect", type: "object", allOf: c })
				: this.Create({ ...s, ...l, [i.Kind]: "Intersect", allOf: c })
		}
		KeyOf(t, s = {}) {
			return o.TRecord(t)
				? (() => {
						const T = Object.getOwnPropertyNames(t.patternProperties)[0]
						return T === i.PatternNumberExact
							? this.Number(s)
							: T === i.PatternStringExact
							? this.String(s)
							: this.Throw("Unable to resolve key type from Record key pattern")
				  })()
				: o.TTuple(t)
				? (() => {
						const c = (y.IsUndefined(t.items) ? [] : t.items).map((l, u) =>
							i.Type.Literal(u.toString())
						)
						return this.Union(c, s)
				  })()
				: o.TArray(t)
				? (() => this.Number(s))()
				: (() => {
						const T = me.ResolveKeys(t, { includePatterns: !1 })
						if (T.length === 0) return this.Never(s)
						const c = T.map((l) => this.Literal(l))
						return this.Union(c, s)
				  })()
		}
		Literal(t, s = {}) {
			return this.Create({ ...s, [i.Kind]: "Literal", const: t, type: typeof t })
		}
		Lowercase(t, s = {}) {
			return { ..._.Map(b.Type(t), "Lowercase"), ...s }
		}
		Never(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Never", not: {} })
		}
		Not(t, s) {
			return this.Create({ ...s, [i.Kind]: "Not", not: b.Type(t) })
		}
		Null(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Null", type: "null" })
		}
		Number(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Number", type: "number" })
		}
		Object(t, s = {}) {
			const T = Object.getOwnPropertyNames(t),
				c = T.filter((m) => o.TOptional(t[m])),
				l = T.filter((m) => !c.includes(m)),
				u = o.TSchema(s.additionalProperties)
					? { additionalProperties: b.Type(s.additionalProperties) }
					: {},
				d = Object.fromEntries(T.map((I) => [I, b.Type(t[I])]))
			return l.length > 0
				? this.Create({
						...s,
						...u,
						[i.Kind]: "Object",
						type: "object",
						properties: d,
						required: l,
				  })
				: this.Create({ ...s, ...u, [i.Kind]: "Object", type: "object", properties: d })
		}
		Omit(t, s, T = {}) {
			const c = oe.Resolve(s)
			return Q.Map(
				this.Discard(b.Type(t), ["$id", i.Transform]),
				(l) => {
					y.IsArray(l.required) &&
						((l.required = l.required.filter((u) => !c.includes(u))),
						l.required.length === 0 && delete l.required)
					for (const u of Object.getOwnPropertyNames(l.properties))
						c.includes(u) && delete l.properties[u]
					return this.Create(l)
				},
				T
			)
		}
		Partial(t, s = {}) {
			return Q.Map(
				this.Discard(b.Type(t), ["$id", i.Transform]),
				(T) => {
					const c = Object.fromEntries(
						Object.getOwnPropertyNames(T.properties).map((u) => [u, this.Optional(T.properties[u])])
					)
					return this.Object(c, this.Discard(T, ["required"]))
				},
				s
			)
		}
		Pick(t, s, T = {}) {
			const c = oe.Resolve(s)
			return Q.Map(
				this.Discard(b.Type(t), ["$id", i.Transform]),
				(l) => {
					y.IsArray(l.required) &&
						((l.required = l.required.filter((u) => c.includes(u))),
						l.required.length === 0 && delete l.required)
					for (const u of Object.getOwnPropertyNames(l.properties))
						c.includes(u) || delete l.properties[u]
					return this.Create(l)
				},
				T
			)
		}
		Record(t, s, T = {}) {
			return o.TTemplateLiteral(t)
				? (() => {
						const c = X.ParseExact(t.pattern)
						return Y.Check(c)
							? this.Object(Object.fromEntries([...Z.Generate(c)].map((u) => [u, b.Type(s)])), T)
							: this.Create({
									...T,
									[i.Kind]: "Record",
									type: "object",
									patternProperties: { [t.pattern]: b.Type(s) },
							  })
				  })()
				: o.TUnion(t)
				? (() => {
						const c = De.Resolve(t)
						if (o.TUnionLiteral(c)) {
							const l = Object.fromEntries(c.anyOf.map((d) => [d.const, b.Type(s)]))
							return this.Object(l, { ...T, [i.Hint]: "Record" })
						} else this.Throw("Record key of type union contains non-literal types")
				  })()
				: o.TLiteral(t)
				? (() =>
						y.IsString(t.const) || y.IsNumber(t.const)
							? this.Object({ [t.const]: b.Type(s) }, T)
							: this.Throw("Record key of type literal is not of type string or number"))()
				: o.TInteger(t) || o.TNumber(t)
				? (() =>
						this.Create({
							...T,
							[i.Kind]: "Record",
							type: "object",
							patternProperties: { [i.PatternNumberExact]: b.Type(s) },
						}))()
				: o.TString(t)
				? (() => {
						const c = y.IsUndefined(t.pattern) ? i.PatternStringExact : t.pattern
						return this.Create({
							...T,
							[i.Kind]: "Record",
							type: "object",
							patternProperties: { [c]: b.Type(s) },
						})
				  })()
				: this.Never()
		}
		Recursive(t, s = {}) {
			y.IsUndefined(s.$id) && (s.$id = `T${Rn++}`)
			const T = t({ [i.Kind]: "This", $ref: `${s.$id}` })
			return (T.$id = s.$id), this.Create({ ...s, [i.Hint]: "Recursive", ...T })
		}
		Ref(t, s = {}) {
			return y.IsString(t)
				? this.Create({ ...s, [i.Kind]: "Ref", $ref: t })
				: (y.IsUndefined(t.$id) && this.Throw("Reference target type must specify an $id"),
				  this.Create({ ...s, [i.Kind]: "Ref", $ref: t.$id }))
		}
		Required(t, s = {}) {
			return Q.Map(
				this.Discard(b.Type(t), ["$id", i.Transform]),
				(T) => {
					const c = Object.fromEntries(
						Object.getOwnPropertyNames(T.properties).map((u) => [
							u,
							this.Discard(T.properties[u], [i.Optional]),
						])
					)
					return this.Object(c, T)
				},
				s
			)
		}
		Rest(t) {
			return o.TTuple(t) && !y.IsUndefined(t.items)
				? b.Rest(t.items)
				: o.TIntersect(t)
				? b.Rest(t.allOf)
				: o.TUnion(t)
				? b.Rest(t.anyOf)
				: []
		}
		String(t = {}) {
			return this.Create({ ...t, [i.Kind]: "String", type: "string" })
		}
		TemplateLiteral(t, s = {}) {
			const T = y.IsString(t) ? Re.Create(Je.Parse(t)) : Re.Create(t)
			return this.Create({ ...s, [i.Kind]: "TemplateLiteral", type: "string", pattern: T })
		}
		Transform(t) {
			return new xe(t)
		}
		Tuple(t, s = {}) {
			const [T, c, l] = [!1, t.length, t.length],
				u = b.Rest(t),
				d =
					t.length > 0
						? {
								...s,
								[i.Kind]: "Tuple",
								type: "array",
								items: u,
								additionalItems: T,
								minItems: c,
								maxItems: l,
						  }
						: { ...s, [i.Kind]: "Tuple", type: "array", minItems: c, maxItems: l }
			return this.Create(d)
		}
		Uncapitalize(t, s = {}) {
			return { ..._.Map(b.Type(t), "Uncapitalize"), ...s }
		}
		Union(t, s = {}) {
			return o.TTemplateLiteral(t)
				? D.Resolve(t)
				: (() => {
						const T = t
						if (T.length === 0) return this.Never(s)
						if (T.length === 1) return this.Create(b.Type(T[0], s))
						const c = b.Rest(T)
						return this.Create({ ...s, [i.Kind]: "Union", anyOf: c })
				  })()
		}
		Unknown(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Unknown" })
		}
		Unsafe(t = {}) {
			return this.Create({ ...t, [i.Kind]: t[i.Kind] || "Unsafe" })
		}
		Uppercase(t, s = {}) {
			return { ..._.Map(b.Type(t), "Uppercase"), ...s }
		}
	}
	i.JsonTypeBuilder = ue
	const je = class extends ue {
		AsyncIterator(t, s = {}) {
			return this.Create({
				...s,
				[i.Kind]: "AsyncIterator",
				type: "AsyncIterator",
				items: b.Type(t),
			})
		}
		Awaited(t, s = {}) {
			const T = (c) =>
				c.length > 0
					? (() => {
							const [l, ...u] = c
							return [this.Awaited(l), ...T(u)]
					  })()
					: c
			return o.TIntersect(t)
				? i.Type.Intersect(T(t.allOf))
				: o.TUnion(t)
				? i.Type.Union(T(t.anyOf))
				: o.TPromise(t)
				? this.Awaited(t.item)
				: b.Type(t, s)
		}
		BigInt(t = {}) {
			return this.Create({ ...t, [i.Kind]: "BigInt", type: "bigint" })
		}
		ConstructorParameters(t, s = {}) {
			return this.Tuple([...t.parameters], { ...s })
		}
		Constructor(t, s, T) {
			const [c, l] = [b.Rest(t), b.Type(s)]
			return this.Create({
				...T,
				[i.Kind]: "Constructor",
				type: "Constructor",
				parameters: c,
				returns: l,
			})
		}
		Date(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Date", type: "Date" })
		}
		Function(t, s, T) {
			const [c, l] = [b.Rest(t), b.Type(s)]
			return this.Create({
				...T,
				[i.Kind]: "Function",
				type: "Function",
				parameters: c,
				returns: l,
			})
		}
		InstanceType(t, s = {}) {
			return b.Type(t.returns, s)
		}
		Iterator(t, s = {}) {
			return this.Create({ ...s, [i.Kind]: "Iterator", type: "Iterator", items: b.Type(t) })
		}
		Parameters(t, s = {}) {
			return this.Tuple(t.parameters, { ...s })
		}
		Promise(t, s = {}) {
			return this.Create({ ...s, [i.Kind]: "Promise", type: "Promise", item: b.Type(t) })
		}
		RegExp(t, s = {}) {
			const T = y.IsString(t) ? t : t.source
			return this.Create({ ...s, [i.Kind]: "String", type: "string", pattern: T })
		}
		RegEx(t, s = {}) {
			return this.RegExp(t, s)
		}
		ReturnType(t, s = {}) {
			return b.Type(t.returns, s)
		}
		Symbol(t) {
			return this.Create({ ...t, [i.Kind]: "Symbol", type: "symbol" })
		}
		Undefined(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Undefined", type: "undefined" })
		}
		Uint8Array(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Uint8Array", type: "Uint8Array" })
		}
		Void(t = {}) {
			return this.Create({ ...t, [i.Kind]: "Void", type: "void" })
		}
	}
	i.JavaScriptTypeBuilder = je
	i.JsonType = new ue()
	i.Type = new je()
})
const Qe = { en: "inlang message format" },
	Xe = { en: "The simplest storage plugin for inlang." }
const ae = Pn(Ge(), 1),
	he = ae.Type.Object({
		filePath: ae.Type.Optional(
			ae.Type.String({ description: "DEPRECATED. Use filePathPattern instead.", deprecated: !0 })
		),
		pathPattern: ae.Type.String({
			pattern: ".*\\{languageTag\\}.*\\.json$",
			examples: ["./messages/{languageTag}.json", "./i18n/{languageTag}.json"],
			description: "The path to the JSON file where the messages are stored.",
		}),
	})
var Nn = (a) => {
		const t = en(a, 0)
		if (t === void 0 || !xn(a[t])) return
		const s = en(a, t + 1)
		if (s !== void 0) return Sn(a, t, s)
	},
	nn = Nn,
	en = (a, t) => {
		for (let s = t; s < a.length; s += 1) {
			const T = a[s]
			if (!vn(T)) return s
		}
	},
	vn = (a) =>
		a === " " ||
		a === "	" ||
		a ===
			`
` ||
		a === "\r",
	xn = (a) => a === "{" || a === "[",
	Sn = (a, t, s) => {
		let T
		for (let c = s - 1; c > t; c -= 1) {
			const l = a[c]
			if (l === "\r") return
			if (
				l ===
				`
`
			)
				return Ln(T)
			if (T === void 0) T = l
			else if (T[0] === l) T += l
			else return
		}
	},
	Ln = (a) => (a === void 0 ? 0 : a[0] === " " ? a.length : a)
const Ve = (a) => {
	const t = a.endsWith(`
`),
		s = nn(a)
	return (T, c) =>
		JSON.stringify(T, c, s) +
		(t
			? `
`
			: "")
}
const tn = (a) =>
	a
		.map((t) => {
			switch (t.type) {
				case "Text":
					return t.value
				case "VariableReference":
					return `{${t.name}}`
			}
		})
		.join("")
const rn = (a) => {
	const t = {}
	for (const s of a.variants) {
		if (t[s.languageTag] !== void 0)
			throw new Error(
				`The message "${a.id}" has multiple variants for the language tag "${s.languageTag}". The inlang-message-format plugin does not support multiple variants for the same language tag at the moment.`
			)
		t[s.languageTag] = tn(s.pattern)
	}
	return t
}
const on = (a) => {
	let t = /\{([^}]+)\}/g,
		s,
		T = 0,
		c = []
	for (; (s = t.exec(a)) !== null; ) {
		const u = s[1],
			d = a.slice(T, s.index)
		d.length > 0 && c.push({ type: "Text", value: d }),
			c.push({ type: "VariableReference", name: u }),
			(T = s.index + s[0].length)
	}
	const l = a.slice(Math.max(0, T))
	return l.length > 0 && c.push({ type: "Text", value: l }), c
}
const qe = (a) => ({
	id: a.key,
	selectors: [],
	variants: [{ languageTag: a.languageTag, match: [], pattern: on(a.value) }],
})
var wn = "plugin.inlang.messageFormat",
	sn = {},
	ze = {
		id: wn,
		displayName: Qe,
		description: Xe,
		settingsSchema: he,
		loadMessages: async ({ settings: a, nodeishFs: t }) => {
			await An({ settings: a, nodeishFs: t })
			const s = {}
			for (const T of a.languageTags)
				try {
					const c = await t.readFile(
						a["plugin.inlang.messageFormat"].pathPattern.replace("{languageTag}", T),
						{ encoding: "utf-8" }
					)
					sn[T] = Ve(c)
					const l = JSON.parse(c)
					for (const u in l)
						u !== "$schema" &&
							(s[u]
								? (s[u].variants = [
										...s[u].variants,
										...qe({ key: u, value: l[u], languageTag: T }).variants,
								  ])
								: (s[u] = qe({ key: u, value: l[u], languageTag: T })))
				} catch {}
			return Object.values(s)
		},
		saveMessages: async ({ settings: a, nodeishFs: t, messages: s }) => {
			const T = {}
			for (const c of s) {
				const l = rn(c)
				for (const [u, d] of Object.entries(l)) T[u] === void 0 && (T[u] = {}), (T[u][c.id] = d)
			}
			for (const [c, l] of Object.entries(T)) {
				const u = a["plugin.inlang.messageFormat"].pathPattern.replace("{languageTag}", c)
				await jn({ path: u, nodeishFs: t }),
					await t.writeFile(
						a["plugin.inlang.messageFormat"].pathPattern.replace("{languageTag}", c),
						(sn[c] ?? ((d) => JSON.stringify(d, void 0, "	")))({
							$schema: "https://inlang.com/schema/inlang-message-format",
							...l,
						})
					)
			}
		},
	},
	jn = async (a) => {
		try {
			await a.nodeishFs.mkdir(Fn(a.path), { recursive: !0 })
		} catch {}
	}
function Fn(a) {
	if (a.length === 0) return "."
	let t = a.charCodeAt(0),
		s = t === 47,
		T = -1,
		c = !0
	for (let l = a.length - 1; l >= 1; --l)
		if (((t = a.charCodeAt(l)), t === 47)) {
			if (!c) {
				T = l
				break
			}
		} else c = !1
	return T === -1 ? (s ? "/" : ".") : s && T === 1 ? "//" : a.slice(0, T)
}
var An = async (a) => {
	if (a.settings["plugin.inlang.messageFormat"].filePath != undefined)
		try {
			const t = await a.nodeishFs.readFile(a.settings["plugin.inlang.messageFormat"].filePath, {
				encoding: "utf-8",
			})
			await ze.saveMessages?.({
				messages: JSON.parse(t).data,
				nodeishFs: a.nodeishFs,
				settings: a.settings,
			}),
				console.log(
					"Migration to v2 of the inlang-message-format plugin was successful. Please delete the old messages.json file and the filePath property in the project.inlang.json file."
				)
		} catch {}
}
const nt = ze
export { nt as default }
