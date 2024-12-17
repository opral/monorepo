/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$2 = globalThis,
	e$4 =
		t$2.ShadowRoot &&
		(void 0 === t$2.ShadyCSS || t$2.ShadyCSS.nativeShadow) &&
		"adoptedStyleSheets" in Document.prototype &&
		"replace" in CSSStyleSheet.prototype,
	s = Symbol(),
	o$2 = new WeakMap()
let n$3 = class n {
	constructor(t, e, o) {
		if (((this._$cssResult$ = !0), o !== s))
			throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.")
		;(this.cssText = t), (this.t = e)
	}
	get styleSheet() {
		let t = this.o
		const s = this.t
		if (e$4 && void 0 === t) {
			const e = void 0 !== s && 1 === s.length
			e && (t = o$2.get(s)),
				void 0 === t &&
					((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$2.set(s, t))
		}
		return t
	}
	toString() {
		return this.cssText
	}
}
const r$3 = (t) => new n$3("string" == typeof t ? t : t + "", void 0, s),
	i$2 = (t, ...e) => {
		const o =
			1 === t.length
				? t[0]
				: e.reduce(
						(e, s, o) =>
							e +
							((t) => {
								if (!0 === t._$cssResult$) return t.cssText
								if ("number" == typeof t) return t
								throw Error(
									"Value passed to 'css' function must be a 'css' function result: " +
										t +
										". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security."
								)
							})(s) +
							t[o + 1],
						t[0]
					)
		return new n$3(o, t, s)
	},
	S$1 = (s, o) => {
		if (e$4) s.adoptedStyleSheets = o.map((t) => (t instanceof CSSStyleSheet ? t : t.styleSheet))
		else
			for (const e of o) {
				const o = document.createElement("style"),
					n = t$2.litNonce
				void 0 !== n && o.setAttribute("nonce", n), (o.textContent = e.cssText), s.appendChild(o)
			}
	},
	c$2 = e$4
		? (t) => t
		: (t) =>
				t instanceof CSSStyleSheet
					? ((t) => {
							let e = ""
							for (const s of t.cssRules) e += s.cssText
							return r$3(e)
						})(t)
					: t

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const {
		is: i$1,
		defineProperty: e$3,
		getOwnPropertyDescriptor: r$2,
		getOwnPropertyNames: h$2,
		getOwnPropertySymbols: o$1,
		getPrototypeOf: n$2,
	} = Object,
	a = globalThis,
	c$1 = a.trustedTypes,
	l = c$1 ? c$1.emptyScript : "",
	p = a.reactiveElementPolyfillSupport,
	d = (t, s) => t,
	u = {
		toAttribute(t, s) {
			switch (s) {
				case Boolean:
					t = t ? l : null
					break
				case Object:
				case Array:
					t = null == t ? t : JSON.stringify(t)
			}
			return t
		},
		fromAttribute(t, s) {
			let i = t
			switch (s) {
				case Boolean:
					i = null !== t
					break
				case Number:
					i = null === t ? null : Number(t)
					break
				case Object:
				case Array:
					try {
						i = JSON.parse(t)
					} catch (t) {
						i = null
					}
			}
			return i
		},
	},
	f$2 = (t, s) => !i$1(t, s),
	y = { attribute: !0, type: String, converter: u, reflect: !1, hasChanged: f$2 }
;(Symbol.metadata ??= Symbol("metadata")), (a.litPropertyMetadata ??= new WeakMap())
class b extends HTMLElement {
	static addInitializer(t) {
		this._$Ei(), (this.l ??= []).push(t)
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()]
	}
	static createProperty(t, s = y) {
		if (
			(s.state && (s.attribute = !1), this._$Ei(), this.elementProperties.set(t, s), !s.noAccessor)
		) {
			const i = Symbol(),
				r = this.getPropertyDescriptor(t, i, s)
			void 0 !== r && e$3(this.prototype, t, r)
		}
	}
	static getPropertyDescriptor(t, s, i) {
		const { get: e, set: h } = r$2(this.prototype, t) ?? {
			get() {
				return this[s]
			},
			set(t) {
				this[s] = t
			},
		}
		return {
			get() {
				return e?.call(this)
			},
			set(s) {
				const r = e?.call(this)
				h.call(this, s), this.requestUpdate(t, r, i)
			},
			configurable: !0,
			enumerable: !0,
		}
	}
	static getPropertyOptions(t) {
		return this.elementProperties.get(t) ?? y
	}
	static _$Ei() {
		if (this.hasOwnProperty(d("elementProperties"))) return
		const t = n$2(this)
		t.finalize(),
			void 0 !== t.l && (this.l = [...t.l]),
			(this.elementProperties = new Map(t.elementProperties))
	}
	static finalize() {
		if (this.hasOwnProperty(d("finalized"))) return
		if (((this.finalized = !0), this._$Ei(), this.hasOwnProperty(d("properties")))) {
			const t = this.properties,
				s = [...h$2(t), ...o$1(t)]
			for (const i of s) this.createProperty(i, t[i])
		}
		const t = this[Symbol.metadata]
		if (null !== t) {
			const s = litPropertyMetadata.get(t)
			if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i)
		}
		this._$Eh = new Map()
		for (const [t, s] of this.elementProperties) {
			const i = this._$Eu(t, s)
			void 0 !== i && this._$Eh.set(i, t)
		}
		this.elementStyles = this.finalizeStyles(this.styles)
	}
	static finalizeStyles(s) {
		const i = []
		if (Array.isArray(s)) {
			const e = new Set(s.flat(1 / 0).reverse())
			for (const s of e) i.unshift(c$2(s))
		} else void 0 !== s && i.push(c$2(s))
		return i
	}
	static _$Eu(t, s) {
		const i = s.attribute
		return !1 === i
			? void 0
			: "string" == typeof i
				? i
				: "string" == typeof t
					? t.toLowerCase()
					: void 0
	}
	constructor() {
		super(),
			(this._$Ep = void 0),
			(this.isUpdatePending = !1),
			(this.hasUpdated = !1),
			(this._$Em = null),
			this._$Ev()
	}
	_$Ev() {
		;(this._$ES = new Promise((t) => (this.enableUpdating = t))),
			(this._$AL = new Map()),
			this._$E_(),
			this.requestUpdate(),
			this.constructor.l?.forEach((t) => t(this))
	}
	addController(t) {
		;(this._$EO ??= new Set()).add(t),
			void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.()
	}
	removeController(t) {
		this._$EO?.delete(t)
	}
	_$E_() {
		const t = new Map(),
			s = this.constructor.elementProperties
		for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i])
		t.size > 0 && (this._$Ep = t)
	}
	createRenderRoot() {
		const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions)
		return S$1(t, this.constructor.elementStyles), t
	}
	connectedCallback() {
		;(this.renderRoot ??= this.createRenderRoot()),
			this.enableUpdating(!0),
			this._$EO?.forEach((t) => t.hostConnected?.())
	}
	enableUpdating(t) {}
	disconnectedCallback() {
		this._$EO?.forEach((t) => t.hostDisconnected?.())
	}
	attributeChangedCallback(t, s, i) {
		this._$AK(t, i)
	}
	_$EC(t, s) {
		const i = this.constructor.elementProperties.get(t),
			e = this.constructor._$Eu(t, i)
		if (void 0 !== e && !0 === i.reflect) {
			const r = (void 0 !== i.converter?.toAttribute ? i.converter : u).toAttribute(s, i.type)
			;(this._$Em = t),
				null == r ? this.removeAttribute(e) : this.setAttribute(e, r),
				(this._$Em = null)
		}
	}
	_$AK(t, s) {
		const i = this.constructor,
			e = i._$Eh.get(t)
		if (void 0 !== e && this._$Em !== e) {
			const t = i.getPropertyOptions(e),
				r =
					"function" == typeof t.converter
						? { fromAttribute: t.converter }
						: void 0 !== t.converter?.fromAttribute
							? t.converter
							: u
			;(this._$Em = e), (this[e] = r.fromAttribute(s, t.type)), (this._$Em = null)
		}
	}
	requestUpdate(t, s, i) {
		if (void 0 !== t) {
			if (((i ??= this.constructor.getPropertyOptions(t)), !(i.hasChanged ?? f$2)(this[t], s)))
				return
			this.P(t, s, i)
		}
		!1 === this.isUpdatePending && (this._$ES = this._$ET())
	}
	P(t, s, i) {
		this._$AL.has(t) || this._$AL.set(t, s),
			!0 === i.reflect && this._$Em !== t && (this._$Ej ??= new Set()).add(t)
	}
	async _$ET() {
		this.isUpdatePending = !0
		try {
			await this._$ES
		} catch (t) {
			Promise.reject(t)
		}
		const t = this.scheduleUpdate()
		return null != t && (await t), !this.isUpdatePending
	}
	scheduleUpdate() {
		return this.performUpdate()
	}
	performUpdate() {
		if (!this.isUpdatePending) return
		if (!this.hasUpdated) {
			if (((this.renderRoot ??= this.createRenderRoot()), this._$Ep)) {
				for (const [t, s] of this._$Ep) this[t] = s
				this._$Ep = void 0
			}
			const t = this.constructor.elementProperties
			if (t.size > 0)
				for (const [s, i] of t)
					!0 !== i.wrapped || this._$AL.has(s) || void 0 === this[s] || this.P(s, this[s], i)
		}
		let t = !1
		const s = this._$AL
		try {
			;(t = this.shouldUpdate(s)),
				t
					? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s))
					: this._$EU()
		} catch (s) {
			throw ((t = !1), this._$EU(), s)
		}
		t && this._$AE(s)
	}
	willUpdate(t) {}
	_$AE(t) {
		this._$EO?.forEach((t) => t.hostUpdated?.()),
			this.hasUpdated || ((this.hasUpdated = !0), this.firstUpdated(t)),
			this.updated(t)
	}
	_$EU() {
		;(this._$AL = new Map()), (this.isUpdatePending = !1)
	}
	get updateComplete() {
		return this.getUpdateComplete()
	}
	getUpdateComplete() {
		return this._$ES
	}
	shouldUpdate(t) {
		return !0
	}
	update(t) {
		;(this._$Ej &&= this._$Ej.forEach((t) => this._$EC(t, this[t]))), this._$EU()
	}
	updated(t) {}
	firstUpdated(t) {}
}
;(b.elementStyles = []),
	(b.shadowRootOptions = { mode: "open" }),
	(b[d("elementProperties")] = new Map()),
	(b[d("finalized")] = new Map()),
	p?.({ ReactiveElement: b }),
	(a.reactiveElementVersions ??= []).push("2.0.4")

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const n$1 = globalThis,
	c = n$1.trustedTypes,
	h$1 = c ? c.createPolicy("lit-html", { createHTML: (t) => t }) : void 0,
	f$1 = "$lit$",
	v = `lit$${Math.random().toFixed(9).slice(2)}$`,
	m = "?" + v,
	_ = `<${m}>`,
	w = document,
	lt = () => w.createComment(""),
	st = (t) => null === t || ("object" != typeof t && "function" != typeof t),
	g = Array.isArray,
	$ = (t) => g(t) || "function" == typeof t?.[Symbol.iterator],
	x = "[ \t\n\f\r]",
	T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
	E = /-->/g,
	k = />/g,
	O = RegExp(`>|${x}(?:([^\\s"'>=/]+)(${x}*=${x}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"),
	S = /'/g,
	j = /"/g,
	M = /^(?:script|style|textarea|title)$/i,
	P =
		(t) =>
		(i, ...s) => ({ _$litType$: t, strings: i, values: s }),
	ke$1 = P(1),
	R = Symbol.for("lit-noChange"),
	D = Symbol.for("lit-nothing"),
	V = new WeakMap(),
	I = w.createTreeWalker(w, 129)
function N(t, i) {
	if (!g(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array")
	return void 0 !== h$1 ? h$1.createHTML(i) : i
}
const U = (t, i) => {
	const s = t.length - 1,
		e = []
	let h,
		o = 2 === i ? "<svg>" : 3 === i ? "<math>" : "",
		n = T
	for (let i = 0; i < s; i++) {
		const s = t[i]
		let r,
			l,
			c = -1,
			a = 0
		for (; a < s.length && ((n.lastIndex = a), (l = n.exec(s)), null !== l); )
			(a = n.lastIndex),
				n === T
					? "!--" === l[1]
						? (n = E)
						: void 0 !== l[1]
							? (n = k)
							: void 0 !== l[2]
								? (M.test(l[2]) && (h = RegExp("</" + l[2], "g")), (n = O))
								: void 0 !== l[3] && (n = O)
					: n === O
						? ">" === l[0]
							? ((n = h ?? T), (c = -1))
							: void 0 === l[1]
								? (c = -2)
								: ((c = n.lastIndex - l[2].length),
									(r = l[1]),
									(n = void 0 === l[3] ? O : '"' === l[3] ? j : S))
						: n === j || n === S
							? (n = O)
							: n === E || n === k
								? (n = T)
								: ((n = O), (h = void 0))
		const u = n === O && t[i + 1].startsWith("/>") ? " " : ""
		o +=
			n === T
				? s + _
				: c >= 0
					? (e.push(r), s.slice(0, c) + f$1 + s.slice(c) + v + u)
					: s + v + (-2 === c ? i : u)
	}
	return [N(t, o + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e]
}
class B {
	constructor({ strings: t, _$litType$: i }, s) {
		let e
		this.parts = []
		let h = 0,
			o = 0
		const n = t.length - 1,
			r = this.parts,
			[l, a] = U(t, i)
		if (
			((this.el = B.createElement(l, s)), (I.currentNode = this.el.content), 2 === i || 3 === i)
		) {
			const t = this.el.content.firstChild
			t.replaceWith(...t.childNodes)
		}
		for (; null !== (e = I.nextNode()) && r.length < n; ) {
			if (1 === e.nodeType) {
				if (e.hasAttributes())
					for (const t of e.getAttributeNames())
						if (t.endsWith(f$1)) {
							const i = a[o++],
								s = e.getAttribute(t).split(v),
								n = /([.?@])?(.*)/.exec(i)
							r.push({
								type: 1,
								index: h,
								name: n[2],
								strings: s,
								ctor: "." === n[1] ? Y : "?" === n[1] ? Z : "@" === n[1] ? q : G,
							}),
								e.removeAttribute(t)
						} else t.startsWith(v) && (r.push({ type: 6, index: h }), e.removeAttribute(t))
				if (M.test(e.tagName)) {
					const t = e.textContent.split(v),
						i = t.length - 1
					if (i > 0) {
						e.textContent = c ? c.emptyScript : ""
						for (let s = 0; s < i; s++)
							e.append(t[s], lt()), I.nextNode(), r.push({ type: 2, index: ++h })
						e.append(t[i], lt())
					}
				}
			} else if (8 === e.nodeType)
				if (e.data === m) r.push({ type: 2, index: h })
				else {
					let t = -1
					for (; -1 !== (t = e.data.indexOf(v, t + 1)); )
						r.push({ type: 7, index: h }), (t += v.length - 1)
				}
			h++
		}
	}
	static createElement(t, i) {
		const s = w.createElement("template")
		return (s.innerHTML = t), s
	}
}
function z(t, i, s = t, e) {
	if (i === R) return i
	let h = void 0 !== e ? s.o?.[e] : s.l
	const o = st(i) ? void 0 : i._$litDirective$
	return (
		h?.constructor !== o &&
			(h?._$AO?.(!1),
			void 0 === o ? (h = void 0) : ((h = new o(t)), h._$AT(t, s, e)),
			void 0 !== e ? ((s.o ??= [])[e] = h) : (s.l = h)),
		void 0 !== h && (i = z(t, h._$AS(t, i.values), h, e)),
		i
	)
}
class F {
	constructor(t, i) {
		;(this._$AV = []), (this._$AN = void 0), (this._$AD = t), (this._$AM = i)
	}
	get parentNode() {
		return this._$AM.parentNode
	}
	get _$AU() {
		return this._$AM._$AU
	}
	u(t) {
		const {
				el: { content: i },
				parts: s,
			} = this._$AD,
			e = (t?.creationScope ?? w).importNode(i, !0)
		I.currentNode = e
		let h = I.nextNode(),
			o = 0,
			n = 0,
			r = s[0]
		for (; void 0 !== r; ) {
			if (o === r.index) {
				let i
				2 === r.type
					? (i = new et(h, h.nextSibling, this, t))
					: 1 === r.type
						? (i = new r.ctor(h, r.name, r.strings, this, t))
						: 6 === r.type && (i = new K(h, this, t)),
					this._$AV.push(i),
					(r = s[++n])
			}
			o !== r?.index && ((h = I.nextNode()), o++)
		}
		return (I.currentNode = w), e
	}
	p(t) {
		let i = 0
		for (const s of this._$AV)
			void 0 !== s &&
				(void 0 !== s.strings ? (s._$AI(t, s, i), (i += s.strings.length - 2)) : s._$AI(t[i])),
				i++
	}
}
class et {
	get _$AU() {
		return this._$AM?._$AU ?? this.v
	}
	constructor(t, i, s, e) {
		;(this.type = 2),
			(this._$AH = D),
			(this._$AN = void 0),
			(this._$AA = t),
			(this._$AB = i),
			(this._$AM = s),
			(this.options = e),
			(this.v = e?.isConnected ?? !0)
	}
	get parentNode() {
		let t = this._$AA.parentNode
		const i = this._$AM
		return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t
	}
	get startNode() {
		return this._$AA
	}
	get endNode() {
		return this._$AB
	}
	_$AI(t, i = this) {
		;(t = z(this, t, i)),
			st(t)
				? t === D || null == t || "" === t
					? (this._$AH !== D && this._$AR(), (this._$AH = D))
					: t !== this._$AH && t !== R && this._(t)
				: void 0 !== t._$litType$
					? this.$(t)
					: void 0 !== t.nodeType
						? this.T(t)
						: $(t)
							? this.k(t)
							: this._(t)
	}
	O(t) {
		return this._$AA.parentNode.insertBefore(t, this._$AB)
	}
	T(t) {
		this._$AH !== t && (this._$AR(), (this._$AH = this.O(t)))
	}
	_(t) {
		this._$AH !== D && st(this._$AH)
			? (this._$AA.nextSibling.data = t)
			: this.T(w.createTextNode(t)),
			(this._$AH = t)
	}
	$(t) {
		const { values: i, _$litType$: s } = t,
			e =
				"number" == typeof s
					? this._$AC(t)
					: (void 0 === s.el && (s.el = B.createElement(N(s.h, s.h[0]), this.options)), s)
		if (this._$AH?._$AD === e) this._$AH.p(i)
		else {
			const t = new F(e, this),
				s = t.u(this.options)
			t.p(i), this.T(s), (this._$AH = t)
		}
	}
	_$AC(t) {
		let i = V.get(t.strings)
		return void 0 === i && V.set(t.strings, (i = new B(t))), i
	}
	k(t) {
		g(this._$AH) || ((this._$AH = []), this._$AR())
		const i = this._$AH
		let s,
			e = 0
		for (const h of t)
			e === i.length
				? i.push((s = new et(this.O(lt()), this.O(lt()), this, this.options)))
				: (s = i[e]),
				s._$AI(h),
				e++
		e < i.length && (this._$AR(s && s._$AB.nextSibling, e), (i.length = e))
	}
	_$AR(t = this._$AA.nextSibling, i) {
		for (this._$AP?.(!1, !0, i); t && t !== this._$AB; ) {
			const i = t.nextSibling
			t.remove(), (t = i)
		}
	}
	setConnected(t) {
		void 0 === this._$AM && ((this.v = t), this._$AP?.(t))
	}
}
class G {
	get tagName() {
		return this.element.tagName
	}
	get _$AU() {
		return this._$AM._$AU
	}
	constructor(t, i, s, e, h) {
		;(this.type = 1),
			(this._$AH = D),
			(this._$AN = void 0),
			(this.element = t),
			(this.name = i),
			(this._$AM = e),
			(this.options = h),
			s.length > 2 || "" !== s[0] || "" !== s[1]
				? ((this._$AH = Array(s.length - 1).fill(new String())), (this.strings = s))
				: (this._$AH = D)
	}
	_$AI(t, i = this, s, e) {
		const h = this.strings
		let o = !1
		if (void 0 === h)
			(t = z(this, t, i, 0)), (o = !st(t) || (t !== this._$AH && t !== R)), o && (this._$AH = t)
		else {
			const e = t
			let n, r
			for (t = h[0], n = 0; n < h.length - 1; n++)
				(r = z(this, e[s + n], i, n)),
					r === R && (r = this._$AH[n]),
					(o ||= !st(r) || r !== this._$AH[n]),
					r === D ? (t = D) : t !== D && (t += (r ?? "") + h[n + 1]),
					(this._$AH[n] = r)
		}
		o && !e && this.j(t)
	}
	j(t) {
		t === D
			? this.element.removeAttribute(this.name)
			: this.element.setAttribute(this.name, t ?? "")
	}
}
class Y extends G {
	constructor() {
		super(...arguments), (this.type = 3)
	}
	j(t) {
		this.element[this.name] = t === D ? void 0 : t
	}
}
class Z extends G {
	constructor() {
		super(...arguments), (this.type = 4)
	}
	j(t) {
		this.element.toggleAttribute(this.name, !!t && t !== D)
	}
}
class q extends G {
	constructor(t, i, s, e, h) {
		super(t, i, s, e, h), (this.type = 5)
	}
	_$AI(t, i = this) {
		if ((t = z(this, t, i, 0) ?? D) === R) return
		const s = this._$AH,
			e =
				(t === D && s !== D) ||
				t.capture !== s.capture ||
				t.once !== s.once ||
				t.passive !== s.passive,
			h = t !== D && (s === D || e)
		e && this.element.removeEventListener(this.name, this, s),
			h && this.element.addEventListener(this.name, this, t),
			(this._$AH = t)
	}
	handleEvent(t) {
		"function" == typeof this._$AH
			? this._$AH.call(this.options?.host ?? this.element, t)
			: this._$AH.handleEvent(t)
	}
}
class K {
	constructor(t, i, s) {
		;(this.element = t), (this.type = 6), (this._$AN = void 0), (this._$AM = i), (this.options = s)
	}
	get _$AU() {
		return this._$AM._$AU
	}
	_$AI(t) {
		z(this, t)
	}
}
const Re = n$1.litHtmlPolyfillSupport
Re?.(B, et), (n$1.litHtmlVersions ??= []).push("3.2.0")
const Q = (t, i, s) => {
	const e = s?.renderBefore ?? i
	let h = e._$litPart$
	if (void 0 === h) {
		const t = s?.renderBefore ?? null
		e._$litPart$ = h = new et(i.insertBefore(lt(), t), t, void 0, s ?? {})
	}
	return h._$AI(t), h
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ class h extends b {
	constructor() {
		super(...arguments), (this.renderOptions = { host: this }), (this.o = void 0)
	}
	createRenderRoot() {
		const t = super.createRenderRoot()
		return (this.renderOptions.renderBefore ??= t.firstChild), t
	}
	update(t) {
		const e = this.render()
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected),
			super.update(t),
			(this.o = Q(e, this.renderRoot, this.renderOptions))
	}
	connectedCallback() {
		super.connectedCallback(), this.o?.setConnected(!0)
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.o?.setConnected(!1)
	}
	render() {
		return R
	}
}
;(h._$litElement$ = !0),
	(h["finalized"] = !0),
	globalThis.litElementHydrateSupport?.({ LitElement: h })
const f = globalThis.litElementPolyfillSupport
f?.({ LitElement: h })
;(globalThis.litElementVersions ??= []).push("4.1.0")

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1 = (t) => (e, o) => {
	void 0 !== o
		? o.addInitializer(() => {
				customElements.define(t, e)
			})
		: customElements.define(t, e)
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const o = { attribute: !0, type: String, converter: u, reflect: !1, hasChanged: f$2 },
	r$1 = (t = o, e, r) => {
		const { kind: n, metadata: i } = r
		let s = globalThis.litPropertyMetadata.get(i)
		if (
			(void 0 === s && globalThis.litPropertyMetadata.set(i, (s = new Map())),
			s.set(r.name, t),
			"accessor" === n)
		) {
			const { name: o } = r
			return {
				set(r) {
					const n = e.get.call(this)
					e.set.call(this, r), this.requestUpdate(o, n, t)
				},
				init(e) {
					return void 0 !== e && this.P(o, void 0, t), e
				},
			}
		}
		if ("setter" === n) {
			const { name: o } = r
			return function (r) {
				const n = this[o]
				e.call(this, r), this.requestUpdate(o, n, t)
			}
		}
		throw Error("Unsupported decorator location: " + n)
	}
function n(t) {
	return (e, o) =>
		"object" == typeof o
			? r$1(t, e, o)
			: ((t, e, o) => {
					const r = e.hasOwnProperty(o)
					return (
						e.constructor.createProperty(o, r ? { ...t, wrapped: !0 } : t),
						r ? Object.getOwnPropertyDescriptor(e, o) : void 0
					)
				})(t, e, o)
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ function r(r) {
	return n({ ...r, state: !0, attribute: !1 })
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$2 = (e, t, c) => (
	(c.configurable = !0),
	(c.enumerable = !0),
	Reflect.decorate && "object" != typeof t && Object.defineProperty(e, t, c),
	c
)

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ function e$1(e, r) {
	return (n, s, i) => {
		const o = (t) => t.renderRoot?.querySelector(e) ?? null
		if (r) {
			const { get: e, set: r } =
				"object" == typeof s
					? n
					: (i ??
						(() => {
							const t = Symbol()
							return {
								get() {
									return this[t]
								},
								set(e) {
									this[t] = e
								},
							}
						})())
			return e$2(n, s, {
				get() {
					let t = e.call(this)
					return (
						void 0 === t && ((t = o(this)), (null !== t || this.hasUpdated) && r.call(this, t)), t
					)
				},
			})
		}
		return e$2(n, s, {
			get() {
				return o(this)
			},
		})
	}
}

/*
 * This gets into the published component
 */
const baseStyling = i$2`
	:host {
		font-family: "Inter", sans-serif;

		/*
		* Color Primitives
		*/

		/* Gray */
		--sl-color-gray-50: hsl(0 0% 97.5%);
		--sl-color-gray-100: hsl(240 4.8% 95.9%);
		--sl-color-gray-200: hsl(240 5.9% 90%);
		--sl-color-gray-300: hsl(240 4.9% 83.9%);
		--sl-color-gray-400: hsl(240 5% 64.9%);
		--sl-color-gray-500: hsl(240 3.8% 46.1%);
		--sl-color-gray-600: hsl(240 5.2% 33.9%);
		--sl-color-gray-700: hsl(240 5.3% 26.1%);
		--sl-color-gray-800: hsl(240 3.7% 15.9%);
		--sl-color-gray-900: hsl(240 5.9% 10%);
		--sl-color-gray-950: hsl(240 7.3% 8%);

		/* Red */
		--sl-color-red-50: hsl(0 85.7% 97.3%);
		--sl-color-red-100: hsl(0 93.3% 94.1%);
		--sl-color-red-200: hsl(0 96.3% 89.4%);
		--sl-color-red-300: hsl(0 93.5% 81.8%);
		--sl-color-red-400: hsl(0 90.6% 70.8%);
		--sl-color-red-500: hsl(0 84.2% 60.2%);
		--sl-color-red-600: hsl(0 72.2% 50.6%);
		--sl-color-red-700: hsl(0 73.7% 41.8%);
		--sl-color-red-800: hsl(0 70% 35.3%);
		--sl-color-red-900: hsl(0 62.8% 30.6%);
		--sl-color-red-950: hsl(0 60% 19.6%);

		/* Orange */
		--sl-color-orange-50: hsl(33.3 100% 96.5%);
		--sl-color-orange-100: hsl(34.3 100% 91.8%);
		--sl-color-orange-200: hsl(32.1 97.7% 83.1%);
		--sl-color-orange-300: hsl(30.7 97.2% 72.4%);
		--sl-color-orange-400: hsl(27 96% 61%);
		--sl-color-orange-500: hsl(24.6 95% 53.1%);
		--sl-color-orange-600: hsl(20.5 90.2% 48.2%);
		--sl-color-orange-700: hsl(17.5 88.3% 40.4%);
		--sl-color-orange-800: hsl(15 79.1% 33.7%);
		--sl-color-orange-900: hsl(15.3 74.6% 27.8%);
		--sl-color-orange-950: hsl(15.2 69.1% 19%);

		/* Amber */
		--sl-color-amber-50: hsl(48 100% 96.1%);
		--sl-color-amber-100: hsl(48 96.5% 88.8%);
		--sl-color-amber-200: hsl(48 96.6% 76.7%);
		--sl-color-amber-300: hsl(45.9 96.7% 64.5%);
		--sl-color-amber-400: hsl(43.3 96.4% 56.3%);
		--sl-color-amber-500: hsl(37.7 92.1% 50.2%);
		--sl-color-amber-600: hsl(32.1 94.6% 43.7%);
		--sl-color-amber-700: hsl(26 90.5% 37.1%);
		--sl-color-amber-800: hsl(22.7 82.5% 31.4%);
		--sl-color-amber-900: hsl(21.7 77.8% 26.5%);
		--sl-color-amber-950: hsl(22.9 74.1% 16.7%);

		/* Yellow */
		--sl-color-yellow-50: hsl(54.5 91.7% 95.3%);
		--sl-color-yellow-100: hsl(54.9 96.7% 88%);
		--sl-color-yellow-200: hsl(52.8 98.3% 76.9%);
		--sl-color-yellow-300: hsl(50.4 97.8% 63.5%);
		--sl-color-yellow-400: hsl(47.9 95.8% 53.1%);
		--sl-color-yellow-500: hsl(45.4 93.4% 47.5%);
		--sl-color-yellow-600: hsl(40.6 96.1% 40.4%);
		--sl-color-yellow-700: hsl(35.5 91.7% 32.9%);
		--sl-color-yellow-800: hsl(31.8 81% 28.8%);
		--sl-color-yellow-900: hsl(28.4 72.5% 25.7%);
		--sl-color-yellow-950: hsl(33.1 69% 13.9%);

		/* Lime */
		--sl-color-lime-50: hsl(78.3 92% 95.1%);
		--sl-color-lime-100: hsl(79.6 89.1% 89.2%);
		--sl-color-lime-200: hsl(80.9 88.5% 79.6%);
		--sl-color-lime-300: hsl(82 84.5% 67.1%);
		--sl-color-lime-400: hsl(82.7 78% 55.5%);
		--sl-color-lime-500: hsl(83.7 80.5% 44.3%);
		--sl-color-lime-600: hsl(84.8 85.2% 34.5%);
		--sl-color-lime-700: hsl(85.9 78.4% 27.3%);
		--sl-color-lime-800: hsl(86.3 69% 22.7%);
		--sl-color-lime-900: hsl(87.6 61.2% 20.2%);
		--sl-color-lime-950: hsl(86.5 60.6% 13.9%);

		/* Green */
		--sl-color-green-50: hsl(138.5 76.5% 96.7%);
		--sl-color-green-100: hsl(140.6 84.2% 92.5%);
		--sl-color-green-200: hsl(141 78.9% 85.1%);
		--sl-color-green-300: hsl(141.7 76.6% 73.1%);
		--sl-color-green-400: hsl(141.9 69.2% 58%);
		--sl-color-green-500: hsl(142.1 70.6% 45.3%);
		--sl-color-green-600: hsl(142.1 76.2% 36.3%);
		--sl-color-green-700: hsl(142.4 71.8% 29.2%);
		--sl-color-green-800: hsl(142.8 64.2% 24.1%);
		--sl-color-green-900: hsl(143.8 61.2% 20.2%);
		--sl-color-green-950: hsl(144.3 60.7% 12%);

		/* Emerald */
		--sl-color-emerald-50: hsl(151.8 81% 95.9%);
		--sl-color-emerald-100: hsl(149.3 80.4% 90%);
		--sl-color-emerald-200: hsl(152.4 76% 80.4%);
		--sl-color-emerald-300: hsl(156.2 71.6% 66.9%);
		--sl-color-emerald-400: hsl(158.1 64.4% 51.6%);
		--sl-color-emerald-500: hsl(160.1 84.1% 39.4%);
		--sl-color-emerald-600: hsl(161.4 93.5% 30.4%);
		--sl-color-emerald-700: hsl(162.9 93.5% 24.3%);
		--sl-color-emerald-800: hsl(163.1 88.1% 19.8%);
		--sl-color-emerald-900: hsl(164.2 85.7% 16.5%);
		--sl-color-emerald-950: hsl(164.3 87.5% 9.4%);

		/* Teal */
		--sl-color-teal-50: hsl(166.2 76.5% 96.7%);
		--sl-color-teal-100: hsl(167.2 85.5% 89.2%);
		--sl-color-teal-200: hsl(168.4 83.8% 78.2%);
		--sl-color-teal-300: hsl(170.6 76.9% 64.3%);
		--sl-color-teal-400: hsl(172.5 66% 50.4%);
		--sl-color-teal-500: hsl(173.4 80.4% 40%);
		--sl-color-teal-600: hsl(174.7 83.9% 31.6%);
		--sl-color-teal-700: hsl(175.3 77.4% 26.1%);
		--sl-color-teal-800: hsl(176.1 69.4% 21.8%);
		--sl-color-teal-900: hsl(175.9 60.8% 19%);
		--sl-color-teal-950: hsl(176.5 58.6% 11.4%);

		/* Cyan */
		--sl-color-cyan-50: hsl(183.2 100% 96.3%);
		--sl-color-cyan-100: hsl(185.1 95.9% 90.4%);
		--sl-color-cyan-200: hsl(186.2 93.5% 81.8%);
		--sl-color-cyan-300: hsl(187 92.4% 69%);
		--sl-color-cyan-400: hsl(187.9 85.7% 53.3%);
		--sl-color-cyan-500: hsl(188.7 94.5% 42.7%);
		--sl-color-cyan-600: hsl(191.6 91.4% 36.5%);
		--sl-color-cyan-700: hsl(192.9 82.3% 31%);
		--sl-color-cyan-800: hsl(194.4 69.6% 27.1%);
		--sl-color-cyan-900: hsl(196.4 63.6% 23.7%);
		--sl-color-cyan-950: hsl(196.8 61% 16.1%);

		/* Sky */
		--sl-color-sky-50: hsl(204 100% 97.1%);
		--sl-color-sky-100: hsl(204 93.8% 93.7%);
		--sl-color-sky-200: hsl(200.6 94.4% 86.1%);
		--sl-color-sky-300: hsl(199.4 95.5% 73.9%);
		--sl-color-sky-400: hsl(198.4 93.2% 59.6%);
		--sl-color-sky-500: hsl(198.6 88.7% 48.4%);
		--sl-color-sky-600: hsl(200.4 98% 39.4%);
		--sl-color-sky-700: hsl(201.3 96.3% 32.2%);
		--sl-color-sky-800: hsl(201 90% 27.5%);
		--sl-color-sky-900: hsl(202 80.3% 23.9%);
		--sl-color-sky-950: hsl(202.3 73.8% 16.5%);

		/* Blue */
		--sl-color-blue-50: hsl(213.8 100% 96.9%);
		--sl-color-blue-100: hsl(214.3 94.6% 92.7%);
		--sl-color-blue-200: hsl(213.3 96.9% 87.3%);
		--sl-color-blue-300: hsl(211.7 96.4% 78.4%);
		--sl-color-blue-400: hsl(213.1 93.9% 67.8%);
		--sl-color-blue-500: hsl(217.2 91.2% 59.8%);
		--sl-color-blue-600: hsl(221.2 83.2% 53.3%);
		--sl-color-blue-700: hsl(224.3 76.3% 48%);
		--sl-color-blue-800: hsl(225.9 70.7% 40.2%);
		--sl-color-blue-900: hsl(224.4 64.3% 32.9%);
		--sl-color-blue-950: hsl(226.2 55.3% 18.4%);

		/* Indigo */
		--sl-color-indigo-50: hsl(225.9 100% 96.7%);
		--sl-color-indigo-100: hsl(226.5 100% 93.9%);
		--sl-color-indigo-200: hsl(228 96.5% 88.8%);
		--sl-color-indigo-300: hsl(229.7 93.5% 81.8%);
		--sl-color-indigo-400: hsl(234.5 89.5% 73.9%);
		--sl-color-indigo-500: hsl(238.7 83.5% 66.7%);
		--sl-color-indigo-600: hsl(243.4 75.4% 58.6%);
		--sl-color-indigo-700: hsl(244.5 57.9% 50.6%);
		--sl-color-indigo-800: hsl(243.7 54.5% 41.4%);
		--sl-color-indigo-900: hsl(242.2 47.4% 34.3%);
		--sl-color-indigo-950: hsl(243.5 43.6% 22.9%);

		/* Violet */
		--sl-color-violet-50: hsl(250 100% 97.6%);
		--sl-color-violet-100: hsl(251.4 91.3% 95.5%);
		--sl-color-violet-200: hsl(250.5 95.2% 91.8%);
		--sl-color-violet-300: hsl(252.5 94.7% 85.1%);
		--sl-color-violet-400: hsl(255.1 91.7% 76.3%);
		--sl-color-violet-500: hsl(258.3 89.5% 66.3%);
		--sl-color-violet-600: hsl(262.1 83.3% 57.8%);
		--sl-color-violet-700: hsl(263.4 70% 50.4%);
		--sl-color-violet-800: hsl(263.4 69.3% 42.2%);
		--sl-color-violet-900: hsl(263.5 67.4% 34.9%);
		--sl-color-violet-950: hsl(265.1 61.5% 21.4%);

		/* Purple */
		--sl-color-purple-50: hsl(270 100% 98%);
		--sl-color-purple-100: hsl(268.7 100% 95.5%);
		--sl-color-purple-200: hsl(268.6 100% 91.8%);
		--sl-color-purple-300: hsl(269.2 97.4% 85.1%);
		--sl-color-purple-400: hsl(270 95.2% 75.3%);
		--sl-color-purple-500: hsl(270.7 91% 65.1%);
		--sl-color-purple-600: hsl(271.5 81.3% 55.9%);
		--sl-color-purple-700: hsl(272.1 71.7% 47.1%);
		--sl-color-purple-800: hsl(272.9 67.2% 39.4%);
		--sl-color-purple-900: hsl(273.6 65.6% 32%);
		--sl-color-purple-950: hsl(276 59.5% 16.5%);

		/* Fuchsia */
		--sl-color-fuchsia-50: hsl(289.1 100% 97.8%);
		--sl-color-fuchsia-100: hsl(287 100% 95.5%);
		--sl-color-fuchsia-200: hsl(288.3 95.8% 90.6%);
		--sl-color-fuchsia-300: hsl(291.1 93.1% 82.9%);
		--sl-color-fuchsia-400: hsl(292 91.4% 72.5%);
		--sl-color-fuchsia-500: hsl(292.2 84.1% 60.6%);
		--sl-color-fuchsia-600: hsl(293.4 69.5% 48.8%);
		--sl-color-fuchsia-700: hsl(294.7 72.4% 39.8%);
		--sl-color-fuchsia-800: hsl(295.4 70.2% 32.9%);
		--sl-color-fuchsia-900: hsl(296.7 63.6% 28%);
		--sl-color-fuchsia-950: hsl(297.1 56.8% 14.5%);

		/* Pink */
		--sl-color-pink-50: hsl(327.3 73.3% 97.1%);
		--sl-color-pink-100: hsl(325.7 77.8% 94.7%);
		--sl-color-pink-200: hsl(325.9 84.6% 89.8%);
		--sl-color-pink-300: hsl(327.4 87.1% 81.8%);
		--sl-color-pink-400: hsl(328.6 85.5% 70.2%);
		--sl-color-pink-500: hsl(330.4 81.2% 60.4%);
		--sl-color-pink-600: hsl(333.3 71.4% 50.6%);
		--sl-color-pink-700: hsl(335.1 77.6% 42%);
		--sl-color-pink-800: hsl(335.8 74.4% 35.3%);
		--sl-color-pink-900: hsl(335.9 69% 30.4%);
		--sl-color-pink-950: hsl(336.2 65.4% 15.9%);

		/* Rose */
		--sl-color-rose-50: hsl(355.7 100% 97.3%);
		--sl-color-rose-100: hsl(355.6 100% 94.7%);
		--sl-color-rose-200: hsl(352.7 96.1% 90%);
		--sl-color-rose-300: hsl(352.6 95.7% 81.8%);
		--sl-color-rose-400: hsl(351.3 94.5% 71.4%);
		--sl-color-rose-500: hsl(349.7 89.2% 60.2%);
		--sl-color-rose-600: hsl(346.8 77.2% 49.8%);
		--sl-color-rose-700: hsl(345.3 82.7% 40.8%);
		--sl-color-rose-800: hsl(343.4 79.7% 34.7%);
		--sl-color-rose-900: hsl(341.5 75.5% 30.4%);
		--sl-color-rose-950: hsl(341.3 70.1% 17.1%);

		/*
   * Theme Tokens
   */

		/* Primary */
		--sl-color-primary-50: var(--sl-color-sky-50);
		--sl-color-primary-100: var(--sl-color-sky-100);
		--sl-color-primary-200: var(--sl-color-sky-200);
		--sl-color-primary-300: var(--sl-color-sky-300);
		--sl-color-primary-400: var(--sl-color-sky-400);
		--sl-color-primary-500: var(--sl-color-sky-500);
		--sl-color-primary-600: var(--sl-color-sky-600);
		--sl-color-primary-700: var(--sl-color-sky-700);
		--sl-color-primary-800: var(--sl-color-sky-800);
		--sl-color-primary-900: var(--sl-color-sky-900);
		--sl-color-primary-950: var(--sl-color-sky-950);

		/* Success */
		--sl-color-success-50: var(--sl-color-green-50);
		--sl-color-success-100: var(--sl-color-green-100);
		--sl-color-success-200: var(--sl-color-green-200);
		--sl-color-success-300: var(--sl-color-green-300);
		--sl-color-success-400: var(--sl-color-green-400);
		--sl-color-success-500: var(--sl-color-green-500);
		--sl-color-success-600: var(--sl-color-green-600);
		--sl-color-success-700: var(--sl-color-green-700);
		--sl-color-success-800: var(--sl-color-green-800);
		--sl-color-success-900: var(--sl-color-green-900);
		--sl-color-success-950: var(--sl-color-green-950);

		/* Warning */
		--sl-color-warning-50: var(--sl-color-amber-50);
		--sl-color-warning-100: var(--sl-color-amber-100);
		--sl-color-warning-200: var(--sl-color-amber-200);
		--sl-color-warning-300: var(--sl-color-amber-300);
		--sl-color-warning-400: var(--sl-color-amber-400);
		--sl-color-warning-500: var(--sl-color-amber-500);
		--sl-color-warning-600: var(--sl-color-amber-600);
		--sl-color-warning-700: var(--sl-color-amber-700);
		--sl-color-warning-800: var(--sl-color-amber-800);
		--sl-color-warning-900: var(--sl-color-amber-900);
		--sl-color-warning-950: var(--sl-color-amber-950);

		/* Danger */
		--sl-color-danger-50: var(--sl-color-red-50);
		--sl-color-danger-100: var(--sl-color-red-100);
		--sl-color-danger-200: var(--sl-color-red-200);
		--sl-color-danger-300: var(--sl-color-red-300);
		--sl-color-danger-400: var(--sl-color-red-400);
		--sl-color-danger-500: var(--sl-color-red-500);
		--sl-color-danger-600: var(--sl-color-red-600);
		--sl-color-danger-700: var(--sl-color-red-700);
		--sl-color-danger-800: var(--sl-color-red-800);
		--sl-color-danger-900: var(--sl-color-red-900);
		--sl-color-danger-950: var(--sl-color-red-950);

		/* Neutral */
		--sl-color-neutral-50: var(--sl-color-gray-50);
		--sl-color-neutral-100: var(--sl-color-gray-100);
		--sl-color-neutral-200: var(--sl-color-gray-200);
		--sl-color-neutral-300: var(--sl-color-gray-300);
		--sl-color-neutral-400: var(--sl-color-gray-400);
		--sl-color-neutral-500: var(--sl-color-gray-500);
		--sl-color-neutral-600: var(--sl-color-gray-600);
		--sl-color-neutral-700: var(--sl-color-gray-700);
		--sl-color-neutral-800: var(--sl-color-gray-800);
		--sl-color-neutral-900: var(--sl-color-gray-900);
		--sl-color-neutral-950: var(--sl-color-gray-950);

		/* Neutral one-offs */
		--sl-color-neutral-0: hsl(0, 0%, 100%);
		--sl-color-neutral-1000: hsl(0, 0%, 0%);

		/*
   * Border radii
   */

		--sl-border-radius-small: 0.1875rem; /* 3px */
		--sl-border-radius-medium: 0.25rem; /* 4px */
		--sl-border-radius-large: 0.5rem; /* 8px */
		--sl-border-radius-x-large: 1rem; /* 16px */

		--sl-border-radius-circle: 50%;
		--sl-border-radius-pill: 9999px;

		/*
   * Elevations
   */

		--sl-shadow-x-small: 0 1px 2px hsl(240 3.8% 46.1% / 6%);
		--sl-shadow-small: 0 1px 2px hsl(240 3.8% 46.1% / 12%);
		--sl-shadow-medium: 0 2px 4px hsl(240 3.8% 46.1% / 12%);
		--sl-shadow-large: 0 2px 8px hsl(240 3.8% 46.1% / 12%);
		--sl-shadow-x-large: 0 4px 16px hsl(240 3.8% 46.1% / 12%);

		/*
   * Spacings
   */

		--sl-spacing-3x-small: 0.125rem; /* 2px */
		--sl-spacing-2x-small: 0.25rem; /* 4px */
		--sl-spacing-x-small: 0.5rem; /* 8px */
		--sl-spacing-small: 0.75rem; /* 12px */
		--sl-spacing-medium: 1rem; /* 16px */
		--sl-spacing-large: 1.25rem; /* 20px */
		--sl-spacing-x-large: 1.75rem; /* 28px */
		--sl-spacing-2x-large: 2.25rem; /* 36px */
		--sl-spacing-3x-large: 3rem; /* 48px */
		--sl-spacing-4x-large: 4.5rem; /* 72px */

		/*
   * Transitions
   */

		--sl-transition-x-slow: 1000ms;
		--sl-transition-slow: 500ms;
		--sl-transition-medium: 250ms;
		--sl-transition-fast: 150ms;
		--sl-transition-x-fast: 50ms;

		/*
   * Typography
   */

		/* Fonts */
		--sl-font-mono: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
		--sl-font-sans: Inter, sans-serif;
		--sl-font-serif: Inter, "Times New Roman", serif;

		/* Font sizes */
		--sl-font-size-2x-small: 0.625rem; /* 10px */
		--sl-font-size-x-small: 0.75rem; /* 12px */
		--sl-font-size-small: 0.875rem; /* 14px */
		--sl-font-size-medium: 1rem; /* 16px */
		--sl-font-size-large: 1.25rem; /* 20px */
		--sl-font-size-x-large: 1.5rem; /* 24px */
		--sl-font-size-2x-large: 2.25rem; /* 36px */
		--sl-font-size-3x-large: 3rem; /* 48px */
		--sl-font-size-4x-large: 4.5rem; /* 72px */

		/* Font weights */
		--sl-font-weight-light: 300;
		--sl-font-weight-normal: 400;
		--sl-font-weight-semibold: 500;
		--sl-font-weight-bold: 700;

		/* Letter spacings */
		--sl-letter-spacing-denser: -0.03em;
		--sl-letter-spacing-dense: -0.015em;
		--sl-letter-spacing-normal: normal;
		--sl-letter-spacing-loose: 0.075em;
		--sl-letter-spacing-looser: 0.15em;

		/* Line heights */
		--sl-line-height-denser: 1;
		--sl-line-height-dense: 1.4;
		--sl-line-height-normal: 1.8;
		--sl-line-height-loose: 2.2;
		--sl-line-height-looser: 2.6;

		/* Focus rings */
		--sl-focus-ring-color: var(--sl-color-primary-600);
		--sl-focus-ring-style: solid;
		--sl-focus-ring-width: 3px;
		--sl-focus-ring: var(--sl-focus-ring-style) var(--sl-focus-ring-width)
			var(--sl-focus-ring-color);
		--sl-focus-ring-offset: 1px;

		/*
   * Forms
   */

		/* Buttons */
		--sl-button-font-size-small: var(--sl-font-size-x-small);
		--sl-button-font-size-medium: var(--sl-font-size-small);
		--sl-button-font-size-large: var(--sl-font-size-medium);

		/* Inputs */
		--sl-input-height-small: 1.875rem; /* 30px */
		--sl-input-height-medium: 2.5rem; /* 40px */
		--sl-input-height-large: 3.125rem; /* 50px */

		--sl-input-background-color: var(--sl-color-neutral-0);
		--sl-input-background-color-hover: var(--sl-input-background-color);
		--sl-input-background-color-focus: var(--sl-input-background-color);
		--sl-input-background-color-disabled: var(--sl-color-neutral-100);
		--sl-input-border-color: var(--sl-color-neutral-300);
		--sl-input-border-color-hover: var(--sl-color-neutral-400);
		--sl-input-border-color-focus: var(--sl-color-primary-500);
		--sl-input-border-color-disabled: var(--sl-color-neutral-300);
		--sl-input-border-width: 1px;
		--sl-input-required-content: "*";
		--sl-input-required-content-offset: -2px;
		--sl-input-required-content-color: var(--sl-input-label-color);

		--sl-input-border-radius-small: var(--sl-border-radius-medium);
		--sl-input-border-radius-medium: var(--sl-border-radius-medium);
		--sl-input-border-radius-large: var(--sl-border-radius-medium);

		--sl-input-font-family: var(--sl-font-sans);
		--sl-input-font-weight: var(--sl-font-weight-normal);
		--sl-input-font-size-small: var(--sl-font-size-small);
		--sl-input-font-size-medium: var(--sl-font-size-medium);
		--sl-input-font-size-large: var(--sl-font-size-large);
		--sl-input-letter-spacing: var(--sl-letter-spacing-normal);

		--sl-input-color: var(--sl-color-neutral-700);
		--sl-input-color-hover: var(--sl-color-neutral-700);
		--sl-input-color-focus: var(--sl-color-neutral-700);
		--sl-input-color-disabled: var(--sl-color-neutral-900);
		--sl-input-icon-color: var(--sl-color-neutral-500);
		--sl-input-icon-color-hover: var(--sl-color-neutral-600);
		--sl-input-icon-color-focus: var(--sl-color-neutral-600);
		--sl-input-placeholder-color: var(--sl-color-neutral-500);
		--sl-input-placeholder-color-disabled: var(--sl-color-neutral-600);
		--sl-input-spacing-small: var(--sl-spacing-small);
		--sl-input-spacing-medium: var(--sl-spacing-medium);
		--sl-input-spacing-large: var(--sl-spacing-large);

		--sl-input-focus-ring-color: hsl(198.6 88.7% 48.4% / 40%);
		--sl-input-focus-ring-offset: 0;

		--sl-input-filled-background-color: var(--sl-color-neutral-100);
		--sl-input-filled-background-color-hover: var(--sl-color-neutral-100);
		--sl-input-filled-background-color-focus: var(--sl-color-neutral-100);
		--sl-input-filled-background-color-disabled: var(--sl-color-neutral-100);
		--sl-input-filled-color: var(--sl-color-neutral-800);
		--sl-input-filled-color-hover: var(--sl-color-neutral-800);
		--sl-input-filled-color-focus: var(--sl-color-neutral-700);
		--sl-input-filled-color-disabled: var(--sl-color-neutral-800);

		/* Labels */
		--sl-input-label-font-size-small: var(--sl-font-size-small);
		--sl-input-label-font-size-medium: var(--sl-font-size-medium);
		--sl-input-label-font-size-large: var(--sl-font-size-large);
		--sl-input-label-color: inherit;

		/* Help text */
		--sl-input-help-text-font-size-small: var(--sl-font-size-x-small);
		--sl-input-help-text-font-size-medium: var(--sl-font-size-small);
		--sl-input-help-text-font-size-large: var(--sl-font-size-medium);
		--sl-input-help-text-color: var(--sl-color-neutral-500);

		/* Toggles (checkboxes, radios, switches) */
		--sl-toggle-size-small: 0.875rem; /* 14px */
		--sl-toggle-size-medium: 1.125rem; /* 18px */
		--sl-toggle-size-large: 1.375rem; /* 22px */

		/*
   * Overlays
   */

		--sl-overlay-background-color: hsl(240 3.8% 46.1% / 33%);

		/*
   * Panels
   */

		--sl-panel-background-color: var(--sl-color-neutral-0);
		--sl-panel-border-color: var(--sl-color-neutral-200);
		--sl-panel-border-width: 1px;

		/*
   * Tooltips
   */

		--sl-tooltip-border-radius: var(--sl-border-radius-medium);
		--sl-tooltip-background-color: var(--sl-color-neutral-800);
		--sl-tooltip-color: var(--sl-color-neutral-0);
		--sl-tooltip-font-family: var(--sl-font-sans);
		--sl-tooltip-font-weight: var(--sl-font-weight-normal);
		--sl-tooltip-font-size: var(--sl-font-size-small);
		--sl-tooltip-line-height: var(--sl-line-height-dense);
		--sl-tooltip-padding: var(--sl-spacing-2x-small) var(--sl-spacing-x-small);
		--sl-tooltip-arrow-size: 6px;

		/*
   * Z-indexes
   */

		--sl-z-index-drawer: 700;
		--sl-z-index-dialog: 800;
		--sl-z-index-dropdown: 900;
		--sl-z-index-toast: 950;
		--sl-z-index-tooltip: 1000;
	}
`

var typebox = {}

;(function (exports) {
	/*--------------------------------------------------------------------------

	@sinclair/typebox

	The MIT License (MIT)

	Copyright (c) 2017-2023 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

	---------------------------------------------------------------------------*/
	Object.defineProperty(exports, "__esModule", { value: true })
	exports.Type =
		exports.JsonType =
		exports.JavaScriptTypeBuilder =
		exports.JsonTypeBuilder =
		exports.TypeBuilder =
		exports.TypeBuilderError =
		exports.TransformEncodeBuilder =
		exports.TransformDecodeBuilder =
		exports.TemplateLiteralDslParser =
		exports.TemplateLiteralGenerator =
		exports.TemplateLiteralGeneratorError =
		exports.TemplateLiteralFinite =
		exports.TemplateLiteralFiniteError =
		exports.TemplateLiteralParser =
		exports.TemplateLiteralParserError =
		exports.TemplateLiteralResolver =
		exports.TemplateLiteralPattern =
		exports.TemplateLiteralPatternError =
		exports.UnionResolver =
		exports.KeyArrayResolver =
		exports.KeyArrayResolverError =
		exports.KeyResolver =
		exports.ObjectMap =
		exports.Intrinsic =
		exports.IndexedAccessor =
		exports.TypeClone =
		exports.TypeExtends =
		exports.TypeExtendsResult =
		exports.TypeExtendsError =
		exports.ExtendsUndefined =
		exports.TypeGuard =
		exports.TypeGuardUnknownTypeError =
		exports.ValueGuard =
		exports.FormatRegistry =
		exports.TypeBoxError =
		exports.TypeRegistry =
		exports.PatternStringExact =
		exports.PatternNumberExact =
		exports.PatternBooleanExact =
		exports.PatternString =
		exports.PatternNumber =
		exports.PatternBoolean =
		exports.Kind =
		exports.Hint =
		exports.Optional =
		exports.Readonly =
		exports.Transform =
			void 0
	// --------------------------------------------------------------------------
	// Symbols
	// --------------------------------------------------------------------------
	exports.Transform = Symbol.for("TypeBox.Transform")
	exports.Readonly = Symbol.for("TypeBox.Readonly")
	exports.Optional = Symbol.for("TypeBox.Optional")
	exports.Hint = Symbol.for("TypeBox.Hint")
	exports.Kind = Symbol.for("TypeBox.Kind")
	// --------------------------------------------------------------------------
	// Patterns
	// --------------------------------------------------------------------------
	exports.PatternBoolean = "(true|false)"
	exports.PatternNumber = "(0|[1-9][0-9]*)"
	exports.PatternString = "(.*)"
	exports.PatternBooleanExact = `^${exports.PatternBoolean}$`
	exports.PatternNumberExact = `^${exports.PatternNumber}$`
	exports.PatternStringExact = `^${exports.PatternString}$`
	/** A registry for user defined types */
	var TypeRegistry
	;(function (TypeRegistry) {
		const map = new Map()
		/** Returns the entries in this registry */
		function Entries() {
			return new Map(map)
		}
		TypeRegistry.Entries = Entries
		/** Clears all user defined types */
		function Clear() {
			return map.clear()
		}
		TypeRegistry.Clear = Clear
		/** Deletes a registered type */
		function Delete(kind) {
			return map.delete(kind)
		}
		TypeRegistry.Delete = Delete
		/** Returns true if this registry contains this kind */
		function Has(kind) {
			return map.has(kind)
		}
		TypeRegistry.Has = Has
		/** Sets a validation function for a user defined type */
		function Set(kind, func) {
			map.set(kind, func)
		}
		TypeRegistry.Set = Set
		/** Gets a custom validation function for a user defined type */
		function Get(kind) {
			return map.get(kind)
		}
		TypeRegistry.Get = Get
	})(TypeRegistry || (exports.TypeRegistry = TypeRegistry = {}))
	// --------------------------------------------------------------------------
	// TypeBoxError
	// --------------------------------------------------------------------------
	class TypeBoxError extends Error {
		constructor(message) {
			super(message)
		}
	}
	exports.TypeBoxError = TypeBoxError
	/** A registry for user defined string formats */
	var FormatRegistry
	;(function (FormatRegistry) {
		const map = new Map()
		/** Returns the entries in this registry */
		function Entries() {
			return new Map(map)
		}
		FormatRegistry.Entries = Entries
		/** Clears all user defined string formats */
		function Clear() {
			return map.clear()
		}
		FormatRegistry.Clear = Clear
		/** Deletes a registered format */
		function Delete(format) {
			return map.delete(format)
		}
		FormatRegistry.Delete = Delete
		/** Returns true if the user defined string format exists */
		function Has(format) {
			return map.has(format)
		}
		FormatRegistry.Has = Has
		/** Sets a validation function for a user defined string format */
		function Set(format, func) {
			map.set(format, func)
		}
		FormatRegistry.Set = Set
		/** Gets a validation function for a user defined string format */
		function Get(format) {
			return map.get(format)
		}
		FormatRegistry.Get = Get
	})(FormatRegistry || (exports.FormatRegistry = FormatRegistry = {}))
	// --------------------------------------------------------------------------
	// ValueGuard
	// --------------------------------------------------------------------------
	/** Provides functions to type guard raw JavaScript values */
	var ValueGuard
	;(function (ValueGuard) {
		/** Returns true if this value is an array */
		function IsArray(value) {
			return Array.isArray(value)
		}
		ValueGuard.IsArray = IsArray
		/** Returns true if this value is bigint */
		function IsBigInt(value) {
			return typeof value === "bigint"
		}
		ValueGuard.IsBigInt = IsBigInt
		/** Returns true if this value is a boolean */
		function IsBoolean(value) {
			return typeof value === "boolean"
		}
		ValueGuard.IsBoolean = IsBoolean
		/** Returns true if this value is a Date object */
		function IsDate(value) {
			return value instanceof globalThis.Date
		}
		ValueGuard.IsDate = IsDate
		/** Returns true if this value is null */
		function IsNull(value) {
			return value === null
		}
		ValueGuard.IsNull = IsNull
		/** Returns true if this value is number */
		function IsNumber(value) {
			return typeof value === "number"
		}
		ValueGuard.IsNumber = IsNumber
		/** Returns true if this value is an object */
		function IsObject(value) {
			return typeof value === "object" && value !== null
		}
		ValueGuard.IsObject = IsObject
		/** Returns true if this value is string */
		function IsString(value) {
			return typeof value === "string"
		}
		ValueGuard.IsString = IsString
		/** Returns true if this value is a Uint8Array */
		function IsUint8Array(value) {
			return value instanceof globalThis.Uint8Array
		}
		ValueGuard.IsUint8Array = IsUint8Array
		/** Returns true if this value is undefined */
		function IsUndefined(value) {
			return value === undefined
		}
		ValueGuard.IsUndefined = IsUndefined
	})(ValueGuard || (exports.ValueGuard = ValueGuard = {}))
	// --------------------------------------------------------------------------
	// TypeGuard
	// --------------------------------------------------------------------------
	class TypeGuardUnknownTypeError extends TypeBoxError {}
	exports.TypeGuardUnknownTypeError = TypeGuardUnknownTypeError
	/** Provides functions to test if JavaScript values are TypeBox types */
	var TypeGuard
	;(function (TypeGuard) {
		function IsPattern(value) {
			try {
				new RegExp(value)
				return true
			} catch {
				return false
			}
		}
		function IsControlCharacterFree(value) {
			if (!ValueGuard.IsString(value)) return false
			for (let i = 0; i < value.length; i++) {
				const code = value.charCodeAt(i)
				if ((code >= 7 && code <= 13) || code === 27 || code === 127) {
					return false
				}
			}
			return true
		}
		function IsAdditionalProperties(value) {
			return IsOptionalBoolean(value) || TSchema(value)
		}
		function IsOptionalBigInt(value) {
			return ValueGuard.IsUndefined(value) || ValueGuard.IsBigInt(value)
		}
		function IsOptionalNumber(value) {
			return ValueGuard.IsUndefined(value) || ValueGuard.IsNumber(value)
		}
		function IsOptionalBoolean(value) {
			return ValueGuard.IsUndefined(value) || ValueGuard.IsBoolean(value)
		}
		function IsOptionalString(value) {
			return ValueGuard.IsUndefined(value) || ValueGuard.IsString(value)
		}
		function IsOptionalPattern(value) {
			return (
				ValueGuard.IsUndefined(value) ||
				(ValueGuard.IsString(value) && IsControlCharacterFree(value) && IsPattern(value))
			)
		}
		function IsOptionalFormat(value) {
			return (
				ValueGuard.IsUndefined(value) ||
				(ValueGuard.IsString(value) && IsControlCharacterFree(value))
			)
		}
		function IsOptionalSchema(value) {
			return ValueGuard.IsUndefined(value) || TSchema(value)
		}
		// ----------------------------------------------------------------
		// Types
		// ----------------------------------------------------------------
		/** Returns true if the given value is TAny */
		function TAny(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Any') &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TAny = TAny
		/** Returns true if the given value is TArray */
		function TArray(schema) {
			return (
				TKindOf(schema, "Array") &&
				schema.type === "array" &&
				IsOptionalString(schema.$id) &&
				TSchema(schema.items) &&
				IsOptionalNumber(schema.minItems) &&
				IsOptionalNumber(schema.maxItems) &&
				IsOptionalBoolean(schema.uniqueItems) &&
				IsOptionalSchema(schema.contains) &&
				IsOptionalNumber(schema.minContains) &&
				IsOptionalNumber(schema.maxContains)
			)
		}
		TypeGuard.TArray = TArray
		/** Returns true if the given value is TAsyncIterator */
		function TAsyncIterator(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'AsyncIterator') &&
	            schema.type === 'AsyncIterator' &&
	            IsOptionalString(schema.$id) &&
	            TSchema(schema.items));
		}
		TypeGuard.TAsyncIterator = TAsyncIterator
		/** Returns true if the given value is TBigInt */
		function TBigInt(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'BigInt') &&
	            schema.type === 'bigint' &&
	            IsOptionalString(schema.$id) &&
	            IsOptionalBigInt(schema.exclusiveMaximum) &&
	            IsOptionalBigInt(schema.exclusiveMinimum) &&
	            IsOptionalBigInt(schema.maximum) &&
	            IsOptionalBigInt(schema.minimum) &&
	            IsOptionalBigInt(schema.multipleOf));
		}
		TypeGuard.TBigInt = TBigInt
		/** Returns true if the given value is TBoolean */
		function TBoolean(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Boolean') &&
	            schema.type === 'boolean' &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TBoolean = TBoolean
		/** Returns true if the given value is TConstructor */
		function TConstructor(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Constructor') &&
	            schema.type === 'Constructor' &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsArray(schema.parameters) &&
	            schema.parameters.every(schema => TSchema(schema)) &&
	            TSchema(schema.returns));
		}
		TypeGuard.TConstructor = TConstructor
		/** Returns true if the given value is TDate */
		function TDate(schema) {
			return (
				TKindOf(schema, "Date") &&
				schema.type === "Date" &&
				IsOptionalString(schema.$id) &&
				IsOptionalNumber(schema.exclusiveMaximumTimestamp) &&
				IsOptionalNumber(schema.exclusiveMinimumTimestamp) &&
				IsOptionalNumber(schema.maximumTimestamp) &&
				IsOptionalNumber(schema.minimumTimestamp) &&
				IsOptionalNumber(schema.multipleOfTimestamp)
			)
		}
		TypeGuard.TDate = TDate
		/** Returns true if the given value is TFunction */
		function TFunction(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Function') &&
	            schema.type === 'Function' &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsArray(schema.parameters) &&
	            schema.parameters.every(schema => TSchema(schema)) &&
	            TSchema(schema.returns));
		}
		TypeGuard.TFunction = TFunction
		/** Returns true if the given value is TInteger */
		function TInteger(schema) {
			return (
				TKindOf(schema, "Integer") &&
				schema.type === "integer" &&
				IsOptionalString(schema.$id) &&
				IsOptionalNumber(schema.exclusiveMaximum) &&
				IsOptionalNumber(schema.exclusiveMinimum) &&
				IsOptionalNumber(schema.maximum) &&
				IsOptionalNumber(schema.minimum) &&
				IsOptionalNumber(schema.multipleOf)
			)
		}
		TypeGuard.TInteger = TInteger
		/** Returns true if the given value is TIntersect */
		function TIntersect(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Intersect') &&
	            (ValueGuard.IsString(schema.type) && schema.type !== 'object' ? false : true) &&
	            ValueGuard.IsArray(schema.allOf) &&
	            schema.allOf.every(schema => TSchema(schema) && !TTransform(schema)) &&
	            IsOptionalString(schema.type) &&
	            (IsOptionalBoolean(schema.unevaluatedProperties) || IsOptionalSchema(schema.unevaluatedProperties)) &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TIntersect = TIntersect
		/** Returns true if the given value is TIterator */
		function TIterator(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Iterator') &&
	            schema.type === 'Iterator' &&
	            IsOptionalString(schema.$id) &&
	            TSchema(schema.items));
		}
		TypeGuard.TIterator = TIterator
		/** Returns true if the given value is a TKind with the given name. */
		function TKindOf(schema, kind) {
			return TKind(schema) && schema[exports.Kind] === kind
		}
		TypeGuard.TKindOf = TKindOf
		/** Returns true if the given value is TKind */
		function TKind(schema) {
			return (
				ValueGuard.IsObject(schema) &&
				exports.Kind in schema &&
				ValueGuard.IsString(schema[exports.Kind])
			)
		}
		TypeGuard.TKind = TKind
		/** Returns true if the given value is TLiteral<string> */
		function TLiteralString(schema) {
			return TLiteral(schema) && ValueGuard.IsString(schema.const)
		}
		TypeGuard.TLiteralString = TLiteralString
		/** Returns true if the given value is TLiteral<number> */
		function TLiteralNumber(schema) {
			return TLiteral(schema) && ValueGuard.IsNumber(schema.const)
		}
		TypeGuard.TLiteralNumber = TLiteralNumber
		/** Returns true if the given value is TLiteral<boolean> */
		function TLiteralBoolean(schema) {
			return TLiteral(schema) && ValueGuard.IsBoolean(schema.const)
		}
		TypeGuard.TLiteralBoolean = TLiteralBoolean
		/** Returns true if the given value is TLiteral */
		function TLiteral(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Literal') &&
	            IsOptionalString(schema.$id) && (ValueGuard.IsBoolean(schema.const) ||
	            ValueGuard.IsNumber(schema.const) ||
	            ValueGuard.IsString(schema.const)));
		}
		TypeGuard.TLiteral = TLiteral
		/** Returns true if the given value is TNever */
		function TNever(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Never') &&
	            ValueGuard.IsObject(schema.not) &&
	            Object.getOwnPropertyNames(schema.not).length === 0);
		}
		TypeGuard.TNever = TNever
		/** Returns true if the given value is TNot */
		function TNot(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Not') &&
	            TSchema(schema.not));
		}
		TypeGuard.TNot = TNot
		/** Returns true if the given value is TNull */
		function TNull(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Null') &&
	            schema.type === 'null' &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TNull = TNull
		/** Returns true if the given value is TNumber */
		function TNumber(schema) {
			return (
				TKindOf(schema, "Number") &&
				schema.type === "number" &&
				IsOptionalString(schema.$id) &&
				IsOptionalNumber(schema.exclusiveMaximum) &&
				IsOptionalNumber(schema.exclusiveMinimum) &&
				IsOptionalNumber(schema.maximum) &&
				IsOptionalNumber(schema.minimum) &&
				IsOptionalNumber(schema.multipleOf)
			)
		}
		TypeGuard.TNumber = TNumber
		/** Returns true if the given value is TObject */
		function TObject(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Object') &&
	            schema.type === 'object' &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsObject(schema.properties) &&
	            IsAdditionalProperties(schema.additionalProperties) &&
	            IsOptionalNumber(schema.minProperties) &&
	            IsOptionalNumber(schema.maxProperties) &&
	            Object.entries(schema.properties).every(([key, schema]) => IsControlCharacterFree(key) && TSchema(schema)));
		}
		TypeGuard.TObject = TObject
		/** Returns true if the given value is TPromise */
		function TPromise(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Promise') &&
	            schema.type === 'Promise' &&
	            IsOptionalString(schema.$id) &&
	            TSchema(schema.item));
		}
		TypeGuard.TPromise = TPromise
		/** Returns true if the given value is TRecord */
		function TRecord(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Record') &&
	            schema.type === 'object' &&
	            IsOptionalString(schema.$id) &&
	            IsAdditionalProperties(schema.additionalProperties) &&
	            ValueGuard.IsObject(schema.patternProperties) &&
	            ((schema) => {
	                const keys = Object.getOwnPropertyNames(schema.patternProperties);
	                return (keys.length === 1 &&
	                    IsPattern(keys[0]) &&
	                    ValueGuard.IsObject(schema.patternProperties) &&
	                    TSchema(schema.patternProperties[keys[0]]));
	            })(schema));
		}
		TypeGuard.TRecord = TRecord
		/** Returns true if this value is TRecursive */
		function TRecursive(schema) {
			return (
				ValueGuard.IsObject(schema) &&
				exports.Hint in schema &&
				schema[exports.Hint] === "Recursive"
			)
		}
		TypeGuard.TRecursive = TRecursive
		/** Returns true if the given value is TRef */
		function TRef(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Ref') &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsString(schema.$ref));
		}
		TypeGuard.TRef = TRef
		/** Returns true if the given value is TString */
		function TString(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'String') &&
	            schema.type === 'string' &&
	            IsOptionalString(schema.$id) &&
	            IsOptionalNumber(schema.minLength) &&
	            IsOptionalNumber(schema.maxLength) &&
	            IsOptionalPattern(schema.pattern) &&
	            IsOptionalFormat(schema.format));
		}
		TypeGuard.TString = TString
		/** Returns true if the given value is TSymbol */
		function TSymbol(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Symbol') &&
	            schema.type === 'symbol' &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TSymbol = TSymbol
		/** Returns true if the given value is TTemplateLiteral */
		function TTemplateLiteral(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'TemplateLiteral') &&
	            schema.type === 'string' &&
	            ValueGuard.IsString(schema.pattern) &&
	            schema.pattern[0] === '^' &&
	            schema.pattern[schema.pattern.length - 1] === '$');
		}
		TypeGuard.TTemplateLiteral = TTemplateLiteral
		/** Returns true if the given value is TThis */
		function TThis(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'This') &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsString(schema.$ref));
		}
		TypeGuard.TThis = TThis
		/** Returns true of this value is TTransform */
		function TTransform(schema) {
			return ValueGuard.IsObject(schema) && exports.Transform in schema
		}
		TypeGuard.TTransform = TTransform
		/** Returns true if the given value is TTuple */
		function TTuple(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Tuple') &&
	            schema.type === 'array' &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsNumber(schema.minItems) &&
	            ValueGuard.IsNumber(schema.maxItems) &&
	            schema.minItems === schema.maxItems &&
	            (( // empty
	            ValueGuard.IsUndefined(schema.items) &&
	                ValueGuard.IsUndefined(schema.additionalItems) &&
	                schema.minItems === 0) || (ValueGuard.IsArray(schema.items) &&
	                schema.items.every(schema => TSchema(schema)))));
		}
		TypeGuard.TTuple = TTuple
		/** Returns true if the given value is TUndefined */
		function TUndefined(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Undefined') &&
	            schema.type === 'undefined' &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TUndefined = TUndefined
		/** Returns true if the given value is TUnion<Literal<string | number>[]> */
		function TUnionLiteral(schema) {
			return (
				TUnion(schema) &&
				schema.anyOf.every((schema) => TLiteralString(schema) || TLiteralNumber(schema))
			)
		}
		TypeGuard.TUnionLiteral = TUnionLiteral
		/** Returns true if the given value is TUnion */
		function TUnion(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Union') &&
	            IsOptionalString(schema.$id) &&
	            ValueGuard.IsObject(schema) &&
	            ValueGuard.IsArray(schema.anyOf) &&
	            schema.anyOf.every(schema => TSchema(schema)));
		}
		TypeGuard.TUnion = TUnion
		/** Returns true if the given value is TUint8Array */
		function TUint8Array(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Uint8Array') &&
	            schema.type === 'Uint8Array' &&
	            IsOptionalString(schema.$id) &&
	            IsOptionalNumber(schema.minByteLength) &&
	            IsOptionalNumber(schema.maxByteLength));
		}
		TypeGuard.TUint8Array = TUint8Array
		/** Returns true if the given value is TUnknown */
		function TUnknown(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Unknown') &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TUnknown = TUnknown
		/** Returns true if the given value is a raw TUnsafe */
		function TUnsafe(schema) {
			return TKindOf(schema, "Unsafe")
		}
		TypeGuard.TUnsafe = TUnsafe
		/** Returns true if the given value is TVoid */
		function TVoid(schema) {
			// prettier-ignore
			return (TKindOf(schema, 'Void') &&
	            schema.type === 'void' &&
	            IsOptionalString(schema.$id));
		}
		TypeGuard.TVoid = TVoid
		/** Returns true if this value has a Readonly symbol */
		function TReadonly(schema) {
			return ValueGuard.IsObject(schema) && schema[exports.Readonly] === "Readonly"
		}
		TypeGuard.TReadonly = TReadonly
		/** Returns true if this value has a Optional symbol */
		function TOptional(schema) {
			return ValueGuard.IsObject(schema) && schema[exports.Optional] === "Optional"
		}
		TypeGuard.TOptional = TOptional
		/** Returns true if the given value is TSchema */
		function TSchema(schema) {
			// prettier-ignore
			return (ValueGuard.IsObject(schema)) && (TAny(schema) ||
	            TArray(schema) ||
	            TBoolean(schema) ||
	            TBigInt(schema) ||
	            TAsyncIterator(schema) ||
	            TConstructor(schema) ||
	            TDate(schema) ||
	            TFunction(schema) ||
	            TInteger(schema) ||
	            TIntersect(schema) ||
	            TIterator(schema) ||
	            TLiteral(schema) ||
	            TNever(schema) ||
	            TNot(schema) ||
	            TNull(schema) ||
	            TNumber(schema) ||
	            TObject(schema) ||
	            TPromise(schema) ||
	            TRecord(schema) ||
	            TRef(schema) ||
	            TString(schema) ||
	            TSymbol(schema) ||
	            TTemplateLiteral(schema) ||
	            TThis(schema) ||
	            TTuple(schema) ||
	            TUndefined(schema) ||
	            TUnion(schema) ||
	            TUint8Array(schema) ||
	            TUnknown(schema) ||
	            TUnsafe(schema) ||
	            TVoid(schema) ||
	            (TKind(schema) && TypeRegistry.Has(schema[exports.Kind])));
		}
		TypeGuard.TSchema = TSchema
	})(TypeGuard || (exports.TypeGuard = TypeGuard = {}))
	// --------------------------------------------------------------------------
	// ExtendsUndefined
	// --------------------------------------------------------------------------
	/** Fast undefined check used for properties of type undefined */
	var ExtendsUndefined
	;(function (ExtendsUndefined) {
		function Check(schema) {
			return schema[exports.Kind] === "Intersect"
				? schema.allOf.every((schema) => Check(schema))
				: schema[exports.Kind] === "Union"
					? schema.anyOf.some((schema) => Check(schema))
					: schema[exports.Kind] === "Undefined"
						? true
						: schema[exports.Kind] === "Not"
							? !Check(schema.not)
							: false
		}
		ExtendsUndefined.Check = Check
	})(ExtendsUndefined || (exports.ExtendsUndefined = ExtendsUndefined = {}))
	// --------------------------------------------------------------------------
	// TypeExtends
	// --------------------------------------------------------------------------
	class TypeExtendsError extends TypeBoxError {}
	exports.TypeExtendsError = TypeExtendsError
	var TypeExtendsResult
	;(function (TypeExtendsResult) {
		TypeExtendsResult[(TypeExtendsResult["Union"] = 0)] = "Union"
		TypeExtendsResult[(TypeExtendsResult["True"] = 1)] = "True"
		TypeExtendsResult[(TypeExtendsResult["False"] = 2)] = "False"
	})(TypeExtendsResult || (exports.TypeExtendsResult = TypeExtendsResult = {}))
	var TypeExtends
	;(function (TypeExtends) {
		// --------------------------------------------------------------------------
		// IntoBooleanResult
		// --------------------------------------------------------------------------
		function IntoBooleanResult(result) {
			return result === TypeExtendsResult.False ? result : TypeExtendsResult.True
		}
		// --------------------------------------------------------------------------
		// Throw
		// --------------------------------------------------------------------------
		function Throw(message) {
			throw new TypeExtendsError(message)
		}
		// --------------------------------------------------------------------------
		// StructuralRight
		// --------------------------------------------------------------------------
		function IsStructuralRight(right) {
			// prettier-ignore
			return (TypeGuard.TNever(right) ||
	            TypeGuard.TIntersect(right) ||
	            TypeGuard.TUnion(right) ||
	            TypeGuard.TUnknown(right) ||
	            TypeGuard.TAny(right));
		}
		function StructuralRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TNever(right) ? TNeverRight() :
	            TypeGuard.TIntersect(right) ? TIntersectRight(left, right) :
	                TypeGuard.TUnion(right) ? TUnionRight(left, right) :
	                    TypeGuard.TUnknown(right) ? TUnknownRight() :
	                        TypeGuard.TAny(right) ? TAnyRight() :
	                            Throw('StructuralRight'));
		}
		// --------------------------------------------------------------------------
		// Any
		// --------------------------------------------------------------------------
		function TAnyRight(left, right) {
			return TypeExtendsResult.True
		}
		function TAny(left, right) {
			// prettier-ignore
			return (TypeGuard.TIntersect(right) ? TIntersectRight(left, right) :
	            (TypeGuard.TUnion(right) && right.anyOf.some((schema) => TypeGuard.TAny(schema) || TypeGuard.TUnknown(schema))) ? TypeExtendsResult.True :
	                TypeGuard.TUnion(right) ? TypeExtendsResult.Union :
	                    TypeGuard.TUnknown(right) ? TypeExtendsResult.True :
	                        TypeGuard.TAny(right) ? TypeExtendsResult.True :
	                            TypeExtendsResult.Union);
		}
		// --------------------------------------------------------------------------
		// Array
		// --------------------------------------------------------------------------
		function TArrayRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TUnknown(left) ? TypeExtendsResult.False :
	            TypeGuard.TAny(left) ? TypeExtendsResult.Union :
	                TypeGuard.TNever(left) ? TypeExtendsResult.True :
	                    TypeExtendsResult.False);
		}
		function TArray(left, right) {
			// prettier-ignore
			return (TypeGuard.TObject(right) && IsObjectArrayLike(right) ? TypeExtendsResult.True :
	            IsStructuralRight(right) ? StructuralRight(left, right) :
	                !TypeGuard.TArray(right) ? TypeExtendsResult.False :
	                    IntoBooleanResult(Visit(left.items, right.items)));
		}
		// --------------------------------------------------------------------------
		// AsyncIterator
		// --------------------------------------------------------------------------
		function TAsyncIterator(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            !TypeGuard.TAsyncIterator(right) ? TypeExtendsResult.False :
	                IntoBooleanResult(Visit(left.items, right.items)));
		}
		// --------------------------------------------------------------------------
		// BigInt
		// --------------------------------------------------------------------------
		function TBigInt(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TBigInt(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Boolean
		// --------------------------------------------------------------------------
		function TBooleanRight(left, right) {
			return TypeGuard.TLiteral(left) && ValueGuard.IsBoolean(left.const)
				? TypeExtendsResult.True
				: TypeGuard.TBoolean(left)
					? TypeExtendsResult.True
					: TypeExtendsResult.False
		}
		function TBoolean(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TBoolean(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Constructor
		// --------------------------------------------------------------------------
		function TConstructor(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                !TypeGuard.TConstructor(right) ? TypeExtendsResult.False :
	                    left.parameters.length > right.parameters.length ? TypeExtendsResult.False :
	                        (!left.parameters.every((schema, index) => IntoBooleanResult(Visit(right.parameters[index], schema)) === TypeExtendsResult.True)) ? TypeExtendsResult.False :
	                            IntoBooleanResult(Visit(left.returns, right.returns)));
		}
		// --------------------------------------------------------------------------
		// Date
		// --------------------------------------------------------------------------
		function TDate(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TDate(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Function
		// --------------------------------------------------------------------------
		function TFunction(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                !TypeGuard.TFunction(right) ? TypeExtendsResult.False :
	                    left.parameters.length > right.parameters.length ? TypeExtendsResult.False :
	                        (!left.parameters.every((schema, index) => IntoBooleanResult(Visit(right.parameters[index], schema)) === TypeExtendsResult.True)) ? TypeExtendsResult.False :
	                            IntoBooleanResult(Visit(left.returns, right.returns)));
		}
		// --------------------------------------------------------------------------
		// Integer
		// --------------------------------------------------------------------------
		function TIntegerRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TLiteral(left) && ValueGuard.IsNumber(left.const) ? TypeExtendsResult.True :
	            TypeGuard.TNumber(left) || TypeGuard.TInteger(left) ? TypeExtendsResult.True :
	                TypeExtendsResult.False);
		}
		function TInteger(left, right) {
			// prettier-ignore
			return (TypeGuard.TInteger(right) || TypeGuard.TNumber(right) ? TypeExtendsResult.True :
	            IsStructuralRight(right) ? StructuralRight(left, right) :
	                TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                    TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Intersect
		// --------------------------------------------------------------------------
		function TIntersectRight(left, right) {
			// prettier-ignore
			return right.allOf.every((schema) => Visit(left, schema) === TypeExtendsResult.True)
	            ? TypeExtendsResult.True
	            : TypeExtendsResult.False;
		}
		function TIntersect(left, right) {
			// prettier-ignore
			return left.allOf.some((schema) => Visit(schema, right) === TypeExtendsResult.True)
	            ? TypeExtendsResult.True
	            : TypeExtendsResult.False;
		}
		// --------------------------------------------------------------------------
		// Iterator
		// --------------------------------------------------------------------------
		function TIterator(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            !TypeGuard.TIterator(right) ? TypeExtendsResult.False :
	                IntoBooleanResult(Visit(left.items, right.items)));
		}
		// --------------------------------------------------------------------------
		// Literal
		// --------------------------------------------------------------------------
		function TLiteral(left, right) {
			// prettier-ignore
			return (TypeGuard.TLiteral(right) && right.const === left.const ? TypeExtendsResult.True :
	            IsStructuralRight(right) ? StructuralRight(left, right) :
	                TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                    TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                        TypeGuard.TString(right) ? TStringRight(left) :
	                            TypeGuard.TNumber(right) ? TNumberRight(left) :
	                                TypeGuard.TInteger(right) ? TIntegerRight(left) :
	                                    TypeGuard.TBoolean(right) ? TBooleanRight(left) :
	                                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Never
		// --------------------------------------------------------------------------
		function TNeverRight(left, right) {
			return TypeExtendsResult.False
		}
		function TNever(left, right) {
			return TypeExtendsResult.True
		}
		// --------------------------------------------------------------------------
		// Not
		// --------------------------------------------------------------------------
		function UnwrapTNot(schema) {
			let [current, depth] = [schema, 0]
			while (true) {
				if (!TypeGuard.TNot(current)) break
				current = current.not
				depth += 1
			}
			return depth % 2 === 0 ? current : exports.Type.Unknown()
		}
		function TNot(left, right) {
			// TypeScript has no concept of negated types, and attempts to correctly check the negated
			// type at runtime would put TypeBox at odds with TypeScripts ability to statically infer
			// the type. Instead we unwrap to either unknown or T and continue evaluating.
			// prettier-ignore
			return (TypeGuard.TNot(left) ? Visit(UnwrapTNot(left), right) :
	            TypeGuard.TNot(right) ? Visit(left, UnwrapTNot(right)) :
	                Throw('Invalid fallthrough for Not'));
		}
		// --------------------------------------------------------------------------
		// Null
		// --------------------------------------------------------------------------
		function TNull(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TNull(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Number
		// --------------------------------------------------------------------------
		function TNumberRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TLiteralNumber(left) ? TypeExtendsResult.True :
	            TypeGuard.TNumber(left) || TypeGuard.TInteger(left) ? TypeExtendsResult.True :
	                TypeExtendsResult.False);
		}
		function TNumber(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TInteger(right) || TypeGuard.TNumber(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Object
		// --------------------------------------------------------------------------
		function IsObjectPropertyCount(schema, count) {
			return Object.getOwnPropertyNames(schema.properties).length === count
		}
		function IsObjectStringLike(schema) {
			return IsObjectArrayLike(schema)
		}
		function IsObjectSymbolLike(schema) {
			// prettier-ignore
			return IsObjectPropertyCount(schema, 0) || (IsObjectPropertyCount(schema, 1) && 'description' in schema.properties && TypeGuard.TUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && ((TypeGuard.TString(schema.properties.description.anyOf[0]) &&
	            TypeGuard.TUndefined(schema.properties.description.anyOf[1])) || (TypeGuard.TString(schema.properties.description.anyOf[1]) &&
	            TypeGuard.TUndefined(schema.properties.description.anyOf[0]))));
		}
		function IsObjectNumberLike(schema) {
			return IsObjectPropertyCount(schema, 0)
		}
		function IsObjectBooleanLike(schema) {
			return IsObjectPropertyCount(schema, 0)
		}
		function IsObjectBigIntLike(schema) {
			return IsObjectPropertyCount(schema, 0)
		}
		function IsObjectDateLike(schema) {
			return IsObjectPropertyCount(schema, 0)
		}
		function IsObjectUint8ArrayLike(schema) {
			return IsObjectArrayLike(schema)
		}
		function IsObjectFunctionLike(schema) {
			const length = exports.Type.Number()
			return (
				IsObjectPropertyCount(schema, 0) ||
				(IsObjectPropertyCount(schema, 1) &&
					"length" in schema.properties &&
					IntoBooleanResult(Visit(schema.properties["length"], length)) === TypeExtendsResult.True)
			)
		}
		function IsObjectConstructorLike(schema) {
			return IsObjectPropertyCount(schema, 0)
		}
		function IsObjectArrayLike(schema) {
			const length = exports.Type.Number()
			return (
				IsObjectPropertyCount(schema, 0) ||
				(IsObjectPropertyCount(schema, 1) &&
					"length" in schema.properties &&
					IntoBooleanResult(Visit(schema.properties["length"], length)) === TypeExtendsResult.True)
			)
		}
		function IsObjectPromiseLike(schema) {
			const then = exports.Type.Function([exports.Type.Any()], exports.Type.Any())
			return (
				IsObjectPropertyCount(schema, 0) ||
				(IsObjectPropertyCount(schema, 1) &&
					"then" in schema.properties &&
					IntoBooleanResult(Visit(schema.properties["then"], then)) === TypeExtendsResult.True)
			)
		}
		// --------------------------------------------------------------------------
		// Property
		// --------------------------------------------------------------------------
		function Property(left, right) {
			// prettier-ignore
			return (Visit(left, right) === TypeExtendsResult.False ? TypeExtendsResult.False :
	            TypeGuard.TOptional(left) && !TypeGuard.TOptional(right) ? TypeExtendsResult.False :
	                TypeExtendsResult.True);
		}
		function TObjectRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TUnknown(left) ? TypeExtendsResult.False :
	            TypeGuard.TAny(left) ? TypeExtendsResult.Union : (TypeGuard.TNever(left) ||
	                (TypeGuard.TLiteralString(left) && IsObjectStringLike(right)) ||
	                (TypeGuard.TLiteralNumber(left) && IsObjectNumberLike(right)) ||
	                (TypeGuard.TLiteralBoolean(left) && IsObjectBooleanLike(right)) ||
	                (TypeGuard.TSymbol(left) && IsObjectSymbolLike(right)) ||
	                (TypeGuard.TBigInt(left) && IsObjectBigIntLike(right)) ||
	                (TypeGuard.TString(left) && IsObjectStringLike(right)) ||
	                (TypeGuard.TSymbol(left) && IsObjectSymbolLike(right)) ||
	                (TypeGuard.TNumber(left) && IsObjectNumberLike(right)) ||
	                (TypeGuard.TInteger(left) && IsObjectNumberLike(right)) ||
	                (TypeGuard.TBoolean(left) && IsObjectBooleanLike(right)) ||
	                (TypeGuard.TUint8Array(left) && IsObjectUint8ArrayLike(right)) ||
	                (TypeGuard.TDate(left) && IsObjectDateLike(right)) ||
	                (TypeGuard.TConstructor(left) && IsObjectConstructorLike(right)) ||
	                (TypeGuard.TFunction(left) && IsObjectFunctionLike(right))) ? TypeExtendsResult.True :
	                (TypeGuard.TRecord(left) && TypeGuard.TString(RecordKey(left))) ? (() => {
	                    // When expressing a Record with literal key values, the Record is converted into a Object with
	                    // the Hint assigned as `Record`. This is used to invert the extends logic.
	                    return right[exports.Hint] === 'Record' ? TypeExtendsResult.True : TypeExtendsResult.False;
	                })() :
	                    (TypeGuard.TRecord(left) && TypeGuard.TNumber(RecordKey(left))) ? (() => {
	                        return IsObjectPropertyCount(right, 0)
	                            ? TypeExtendsResult.True
	                            : TypeExtendsResult.False;
	                    })() :
	                        TypeExtendsResult.False);
		}
		function TObject(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                !TypeGuard.TObject(right) ? TypeExtendsResult.False :
	                    (() => {
	                        for (const key of Object.getOwnPropertyNames(right.properties)) {
	                            if (!(key in left.properties) && !TypeGuard.TOptional(right.properties[key])) {
	                                return TypeExtendsResult.False;
	                            }
	                            if (TypeGuard.TOptional(right.properties[key])) {
	                                return TypeExtendsResult.True;
	                            }
	                            if (Property(left.properties[key], right.properties[key]) === TypeExtendsResult.False) {
	                                return TypeExtendsResult.False;
	                            }
	                        }
	                        return TypeExtendsResult.True;
	                    })());
		}
		// --------------------------------------------------------------------------
		// Promise
		// --------------------------------------------------------------------------
		function TPromise(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) && IsObjectPromiseLike(right) ? TypeExtendsResult.True :
	                !TypeGuard.TPromise(right) ? TypeExtendsResult.False :
	                    IntoBooleanResult(Visit(left.item, right.item)));
		}
		// --------------------------------------------------------------------------
		// Record
		// --------------------------------------------------------------------------
		function RecordKey(schema) {
			// prettier-ignore
			return (exports.PatternNumberExact in schema.patternProperties ? exports.Type.Number() :
	            exports.PatternStringExact in schema.patternProperties ? exports.Type.String() :
	                Throw('Unknown record key pattern'));
		}
		function RecordValue(schema) {
			// prettier-ignore
			return (exports.PatternNumberExact in schema.patternProperties ? schema.patternProperties[exports.PatternNumberExact] :
	            exports.PatternStringExact in schema.patternProperties ? schema.patternProperties[exports.PatternStringExact] :
	                Throw('Unable to get record value schema'));
		}
		function TRecordRight(left, right) {
			const [Key, Value] = [RecordKey(right), RecordValue(right)]
			// prettier-ignore
			return ((TypeGuard.TLiteralString(left) && TypeGuard.TNumber(Key) && IntoBooleanResult(Visit(left, Value)) === TypeExtendsResult.True) ? TypeExtendsResult.True :
	            TypeGuard.TUint8Array(left) && TypeGuard.TNumber(Key) ? Visit(left, Value) :
	                TypeGuard.TString(left) && TypeGuard.TNumber(Key) ? Visit(left, Value) :
	                    TypeGuard.TArray(left) && TypeGuard.TNumber(Key) ? Visit(left, Value) :
	                        TypeGuard.TObject(left) ? (() => {
	                            for (const key of Object.getOwnPropertyNames(left.properties)) {
	                                if (Property(Value, left.properties[key]) === TypeExtendsResult.False) {
	                                    return TypeExtendsResult.False;
	                                }
	                            }
	                            return TypeExtendsResult.True;
	                        })() :
	                            TypeExtendsResult.False);
		}
		function TRecord(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                !TypeGuard.TRecord(right) ? TypeExtendsResult.False :
	                    Visit(RecordValue(left), RecordValue(right)));
		}
		// --------------------------------------------------------------------------
		// String
		// --------------------------------------------------------------------------
		function TStringRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TLiteral(left) && ValueGuard.IsString(left.const) ? TypeExtendsResult.True :
	            TypeGuard.TString(left) ? TypeExtendsResult.True :
	                TypeExtendsResult.False);
		}
		function TString(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TString(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Symbol
		// --------------------------------------------------------------------------
		function TSymbol(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TSymbol(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// TemplateLiteral
		// --------------------------------------------------------------------------
		function TTemplateLiteral(left, right) {
			// TemplateLiteral types are resolved to either unions for finite expressions or string
			// for infinite expressions. Here we call to TemplateLiteralResolver to resolve for
			// either type and continue evaluating.
			// prettier-ignore
			return (TypeGuard.TTemplateLiteral(left) ? Visit(TemplateLiteralResolver.Resolve(left), right) :
	            TypeGuard.TTemplateLiteral(right) ? Visit(left, TemplateLiteralResolver.Resolve(right)) :
	                Throw('Invalid fallthrough for TemplateLiteral'));
		}
		// --------------------------------------------------------------------------
		// Tuple
		// --------------------------------------------------------------------------
		function IsArrayOfTuple(left, right) {
			// prettier-ignore
			return (TypeGuard.TArray(right) &&
	            left.items !== undefined &&
	            left.items.every((schema) => Visit(schema, right.items) === TypeExtendsResult.True));
		}
		function TTupleRight(left, right) {
			// prettier-ignore
			return (TypeGuard.TNever(left) ? TypeExtendsResult.True :
	            TypeGuard.TUnknown(left) ? TypeExtendsResult.False :
	                TypeGuard.TAny(left) ? TypeExtendsResult.Union :
	                    TypeExtendsResult.False);
		}
		function TTuple(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) && IsObjectArrayLike(right) ? TypeExtendsResult.True :
	                TypeGuard.TArray(right) && IsArrayOfTuple(left, right) ? TypeExtendsResult.True :
	                    !TypeGuard.TTuple(right) ? TypeExtendsResult.False :
	                        (ValueGuard.IsUndefined(left.items) && !ValueGuard.IsUndefined(right.items)) || (!ValueGuard.IsUndefined(left.items) && ValueGuard.IsUndefined(right.items)) ? TypeExtendsResult.False :
	                            (ValueGuard.IsUndefined(left.items) && !ValueGuard.IsUndefined(right.items)) ? TypeExtendsResult.True :
	                                left.items.every((schema, index) => Visit(schema, right.items[index]) === TypeExtendsResult.True) ? TypeExtendsResult.True :
	                                    TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Uint8Array
		// --------------------------------------------------------------------------
		function TUint8Array(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TUint8Array(right) ? TypeExtendsResult.True :
	                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Undefined
		// --------------------------------------------------------------------------
		function TUndefined(left, right) {
			// prettier-ignore
			return (IsStructuralRight(right) ? StructuralRight(left, right) :
	            TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                TypeGuard.TRecord(right) ? TRecordRight(left, right) :
	                    TypeGuard.TVoid(right) ? VoidRight(left) :
	                        TypeGuard.TUndefined(right) ? TypeExtendsResult.True :
	                            TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Union
		// --------------------------------------------------------------------------
		function TUnionRight(left, right) {
			// prettier-ignore
			return right.anyOf.some((schema) => Visit(left, schema) === TypeExtendsResult.True)
	            ? TypeExtendsResult.True
	            : TypeExtendsResult.False;
		}
		function TUnion(left, right) {
			// prettier-ignore
			return left.anyOf.every((schema) => Visit(schema, right) === TypeExtendsResult.True)
	            ? TypeExtendsResult.True
	            : TypeExtendsResult.False;
		}
		// --------------------------------------------------------------------------
		// Unknown
		// --------------------------------------------------------------------------
		function TUnknownRight(left, right) {
			return TypeExtendsResult.True
		}
		function TUnknown(left, right) {
			// prettier-ignore
			return (TypeGuard.TNever(right) ? TNeverRight() :
	            TypeGuard.TIntersect(right) ? TIntersectRight(left, right) :
	                TypeGuard.TUnion(right) ? TUnionRight(left, right) :
	                    TypeGuard.TAny(right) ? TAnyRight() :
	                        TypeGuard.TString(right) ? TStringRight(left) :
	                            TypeGuard.TNumber(right) ? TNumberRight(left) :
	                                TypeGuard.TInteger(right) ? TIntegerRight(left) :
	                                    TypeGuard.TBoolean(right) ? TBooleanRight(left) :
	                                        TypeGuard.TArray(right) ? TArrayRight(left) :
	                                            TypeGuard.TTuple(right) ? TTupleRight(left) :
	                                                TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                                                    TypeGuard.TUnknown(right) ? TypeExtendsResult.True :
	                                                        TypeExtendsResult.False);
		}
		// --------------------------------------------------------------------------
		// Void
		// --------------------------------------------------------------------------
		function VoidRight(left, right) {
			// prettier-ignore
			return TypeGuard.TUndefined(left) ? TypeExtendsResult.True :
	            TypeGuard.TUndefined(left) ? TypeExtendsResult.True :
	                TypeExtendsResult.False;
		}
		function TVoid(left, right) {
			// prettier-ignore
			return TypeGuard.TIntersect(right) ? TIntersectRight(left, right) :
	            TypeGuard.TUnion(right) ? TUnionRight(left, right) :
	                TypeGuard.TUnknown(right) ? TUnknownRight() :
	                    TypeGuard.TAny(right) ? TAnyRight() :
	                        TypeGuard.TObject(right) ? TObjectRight(left, right) :
	                            TypeGuard.TVoid(right) ? TypeExtendsResult.True :
	                                TypeExtendsResult.False;
		}
		function Visit(left, right) {
			// prettier-ignore
			return (
	        // resolvable
	        (TypeGuard.TTemplateLiteral(left) || TypeGuard.TTemplateLiteral(right)) ? TTemplateLiteral(left, right) :
	            (TypeGuard.TNot(left) || TypeGuard.TNot(right)) ? TNot(left, right) :
	                // standard
	                TypeGuard.TAny(left) ? TAny(left, right) :
	                    TypeGuard.TArray(left) ? TArray(left, right) :
	                        TypeGuard.TBigInt(left) ? TBigInt(left, right) :
	                            TypeGuard.TBoolean(left) ? TBoolean(left, right) :
	                                TypeGuard.TAsyncIterator(left) ? TAsyncIterator(left, right) :
	                                    TypeGuard.TConstructor(left) ? TConstructor(left, right) :
	                                        TypeGuard.TDate(left) ? TDate(left, right) :
	                                            TypeGuard.TFunction(left) ? TFunction(left, right) :
	                                                TypeGuard.TInteger(left) ? TInteger(left, right) :
	                                                    TypeGuard.TIntersect(left) ? TIntersect(left, right) :
	                                                        TypeGuard.TIterator(left) ? TIterator(left, right) :
	                                                            TypeGuard.TLiteral(left) ? TLiteral(left, right) :
	                                                                TypeGuard.TNever(left) ? TNever() :
	                                                                    TypeGuard.TNull(left) ? TNull(left, right) :
	                                                                        TypeGuard.TNumber(left) ? TNumber(left, right) :
	                                                                            TypeGuard.TObject(left) ? TObject(left, right) :
	                                                                                TypeGuard.TRecord(left) ? TRecord(left, right) :
	                                                                                    TypeGuard.TString(left) ? TString(left, right) :
	                                                                                        TypeGuard.TSymbol(left) ? TSymbol(left, right) :
	                                                                                            TypeGuard.TTuple(left) ? TTuple(left, right) :
	                                                                                                TypeGuard.TPromise(left) ? TPromise(left, right) :
	                                                                                                    TypeGuard.TUint8Array(left) ? TUint8Array(left, right) :
	                                                                                                        TypeGuard.TUndefined(left) ? TUndefined(left, right) :
	                                                                                                            TypeGuard.TUnion(left) ? TUnion(left, right) :
	                                                                                                                TypeGuard.TUnknown(left) ? TUnknown(left, right) :
	                                                                                                                    TypeGuard.TVoid(left) ? TVoid(left, right) :
	                                                                                                                        Throw(`Unknown left type operand '${left[exports.Kind]}'`));
		}
		function Extends(left, right) {
			return Visit(left, right)
		}
		TypeExtends.Extends = Extends
	})(TypeExtends || (exports.TypeExtends = TypeExtends = {}))
	// --------------------------------------------------------------------------
	// TypeClone
	// --------------------------------------------------------------------------
	/** Specialized Clone for Types */
	var TypeClone
	;(function (TypeClone) {
		function ArrayType(value) {
			return value.map((value) => Visit(value))
		}
		function DateType(value) {
			return new Date(value.getTime())
		}
		function Uint8ArrayType(value) {
			return new Uint8Array(value)
		}
		function ObjectType(value) {
			const clonedProperties = Object.getOwnPropertyNames(value).reduce(
				(acc, key) => ({ ...acc, [key]: Visit(value[key]) }),
				{}
			)
			const clonedSymbols = Object.getOwnPropertySymbols(value).reduce(
				(acc, key) => ({ ...acc, [key]: Visit(value[key]) }),
				{}
			)
			return { ...clonedProperties, ...clonedSymbols }
		}
		function Visit(value) {
			// prettier-ignore
			return (ValueGuard.IsArray(value) ? ArrayType(value) :
	            ValueGuard.IsDate(value) ? DateType(value) :
	                ValueGuard.IsUint8Array(value) ? Uint8ArrayType(value) :
	                    ValueGuard.IsObject(value) ? ObjectType(value) :
	                        value);
		}
		/** Clones a Rest */
		function Rest(schemas) {
			return schemas.map((schema) => Type(schema))
		}
		TypeClone.Rest = Rest
		/** Clones a Type */
		function Type(schema, options = {}) {
			return { ...Visit(schema), ...options }
		}
		TypeClone.Type = Type
	})(TypeClone || (exports.TypeClone = TypeClone = {}))
	// --------------------------------------------------------------------------
	// IndexedAccessor
	// --------------------------------------------------------------------------
	var IndexedAccessor
	;(function (IndexedAccessor) {
		function OptionalUnwrap(schema) {
			return schema.map((schema) => {
				const { [exports.Optional]: _, ...clone } = TypeClone.Type(schema)
				return clone
			})
		}
		function IsIntersectOptional(schema) {
			return schema.every((schema) => TypeGuard.TOptional(schema))
		}
		function IsUnionOptional(schema) {
			return schema.some((schema) => TypeGuard.TOptional(schema))
		}
		function ResolveIntersect(schema) {
			return IsIntersectOptional(schema.allOf)
				? exports.Type.Optional(exports.Type.Intersect(OptionalUnwrap(schema.allOf)))
				: schema
		}
		function ResolveUnion(schema) {
			return IsUnionOptional(schema.anyOf)
				? exports.Type.Optional(exports.Type.Union(OptionalUnwrap(schema.anyOf)))
				: schema
		}
		function ResolveOptional(schema) {
			// prettier-ignore
			return schema[exports.Kind] === 'Intersect' ? ResolveIntersect(schema) :
	            schema[exports.Kind] === 'Union' ? ResolveUnion(schema) :
	                schema;
		}
		function TIntersect(schema, key) {
			const resolved = schema.allOf.reduce((acc, schema) => {
				const indexed = Visit(schema, key)
				return indexed[exports.Kind] === "Never" ? acc : [...acc, indexed]
			}, [])
			return ResolveOptional(exports.Type.Intersect(resolved))
		}
		function TUnion(schema, key) {
			const resolved = schema.anyOf.map((schema) => Visit(schema, key))
			return ResolveOptional(exports.Type.Union(resolved))
		}
		function TObject(schema, key) {
			const property = schema.properties[key]
			return ValueGuard.IsUndefined(property)
				? exports.Type.Never()
				: exports.Type.Union([property])
		}
		function TTuple(schema, key) {
			const items = schema.items
			if (ValueGuard.IsUndefined(items)) return exports.Type.Never()
			const element = items[key] //
			if (ValueGuard.IsUndefined(element)) return exports.Type.Never()
			return element
		}
		function Visit(schema, key) {
			// prettier-ignore
			return schema[exports.Kind] === 'Intersect' ? TIntersect(schema, key) :
	            schema[exports.Kind] === 'Union' ? TUnion(schema, key) :
	                schema[exports.Kind] === 'Object' ? TObject(schema, key) :
	                    schema[exports.Kind] === 'Tuple' ? TTuple(schema, key) :
	                        exports.Type.Never();
		}
		function Resolve(schema, keys, options = {}) {
			const resolved = keys.map((key) => Visit(schema, key.toString()))
			return ResolveOptional(exports.Type.Union(resolved, options))
		}
		IndexedAccessor.Resolve = Resolve
	})(IndexedAccessor || (exports.IndexedAccessor = IndexedAccessor = {}))
	// --------------------------------------------------------------------------
	// Intrinsic
	// --------------------------------------------------------------------------
	var Intrinsic
	;(function (Intrinsic) {
		function Uncapitalize(value) {
			const [first, rest] = [value.slice(0, 1), value.slice(1)]
			return `${first.toLowerCase()}${rest}`
		}
		function Capitalize(value) {
			const [first, rest] = [value.slice(0, 1), value.slice(1)]
			return `${first.toUpperCase()}${rest}`
		}
		function Uppercase(value) {
			return value.toUpperCase()
		}
		function Lowercase(value) {
			return value.toLowerCase()
		}
		function IntrinsicTemplateLiteral(schema, mode) {
			// note: template literals require special runtime handling as they are encoded in string patterns.
			// This diverges from the mapped type which would otherwise map on the template literal kind.
			const expression = TemplateLiteralParser.ParseExact(schema.pattern)
			const finite = TemplateLiteralFinite.Check(expression)
			if (!finite) return { ...schema, pattern: IntrinsicLiteral(schema.pattern, mode) }
			const strings = [...TemplateLiteralGenerator.Generate(expression)]
			const literals = strings.map((value) => exports.Type.Literal(value))
			const mapped = IntrinsicRest(literals, mode)
			const union = exports.Type.Union(mapped)
			return exports.Type.TemplateLiteral([union])
		}
		function IntrinsicLiteral(value, mode) {
			// prettier-ignore
			return typeof value === 'string' ? (mode === 'Uncapitalize' ? Uncapitalize(value) :
	            mode === 'Capitalize' ? Capitalize(value) :
	                mode === 'Uppercase' ? Uppercase(value) :
	                    mode === 'Lowercase' ? Lowercase(value) :
	                        value) : value.toString();
		}
		function IntrinsicRest(schema, mode) {
			if (schema.length === 0) return []
			const [L, ...R] = schema
			return [Map(L, mode), ...IntrinsicRest(R, mode)]
		}
		function Visit(schema, mode) {
			// prettier-ignore
			return TypeGuard.TTemplateLiteral(schema) ? IntrinsicTemplateLiteral(schema, mode) :
	            TypeGuard.TUnion(schema) ? exports.Type.Union(IntrinsicRest(schema.anyOf, mode)) :
	                TypeGuard.TLiteral(schema) ? exports.Type.Literal(IntrinsicLiteral(schema.const, mode)) :
	                    schema;
		}
		/** Applies an intrinsic string manipulation to the given type. */
		function Map(schema, mode) {
			return Visit(schema, mode)
		}
		Intrinsic.Map = Map
	})(Intrinsic || (exports.Intrinsic = Intrinsic = {}))
	// --------------------------------------------------------------------------
	// ObjectMap
	// --------------------------------------------------------------------------
	var ObjectMap
	;(function (ObjectMap) {
		function TIntersect(schema, callback) {
			// prettier-ignore
			return exports.Type.Intersect(schema.allOf.map((inner) => Visit(inner, callback)), { ...schema });
		}
		function TUnion(schema, callback) {
			// prettier-ignore
			return exports.Type.Union(schema.anyOf.map((inner) => Visit(inner, callback)), { ...schema });
		}
		function TObject(schema, callback) {
			return callback(schema)
		}
		function Visit(schema, callback) {
			// There are cases where users need to map objects with unregistered kinds. Using a TypeGuard here would
			// prevent sub schema mapping as unregistered kinds will not pass TSchema checks. This is notable in the
			// case of TObject where unregistered property kinds cause the TObject check to fail. As mapping is only
			// used for composition, we use explicit checks instead.
			// prettier-ignore
			return (schema[exports.Kind] === 'Intersect' ? TIntersect(schema, callback) :
	            schema[exports.Kind] === 'Union' ? TUnion(schema, callback) :
	                schema[exports.Kind] === 'Object' ? TObject(schema, callback) :
	                    schema);
		}
		function Map(schema, callback, options) {
			return { ...Visit(TypeClone.Type(schema), callback), ...options }
		}
		ObjectMap.Map = Map
	})(ObjectMap || (exports.ObjectMap = ObjectMap = {}))
	var KeyResolver
	;(function (KeyResolver) {
		function UnwrapPattern(key) {
			return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key
		}
		function TIntersect(schema, options) {
			return schema.allOf.reduce((acc, schema) => [...acc, ...Visit(schema, options)], [])
		}
		function TUnion(schema, options) {
			const sets = schema.anyOf.map((inner) => Visit(inner, options))
			return [
				...sets.reduce(
					(set, outer) =>
						outer.map((key) =>
							sets.every((inner) => inner.includes(key)) ? set.add(key) : set
						)[0],
					new Set()
				),
			]
		}
		function TObject(schema, options) {
			return Object.getOwnPropertyNames(schema.properties)
		}
		function TRecord(schema, options) {
			return options.includePatterns ? Object.getOwnPropertyNames(schema.patternProperties) : []
		}
		function Visit(schema, options) {
			// prettier-ignore
			return (TypeGuard.TIntersect(schema) ? TIntersect(schema, options) :
	            TypeGuard.TUnion(schema) ? TUnion(schema, options) :
	                TypeGuard.TObject(schema) ? TObject(schema) :
	                    TypeGuard.TRecord(schema) ? TRecord(schema, options) :
	                        []);
		}
		/** Resolves an array of keys in this schema */
		function ResolveKeys(schema, options) {
			return [...new Set(Visit(schema, options))]
		}
		KeyResolver.ResolveKeys = ResolveKeys
		/** Resolves a regular expression pattern matching all keys in this schema */
		function ResolvePattern(schema) {
			const keys = ResolveKeys(schema, { includePatterns: true })
			const pattern = keys.map((key) => `(${UnwrapPattern(key)})`)
			return `^(${pattern.join("|")})$`
		}
		KeyResolver.ResolvePattern = ResolvePattern
	})(KeyResolver || (exports.KeyResolver = KeyResolver = {}))
	// --------------------------------------------------------------------------
	// KeyArrayResolver
	// --------------------------------------------------------------------------
	class KeyArrayResolverError extends TypeBoxError {}
	exports.KeyArrayResolverError = KeyArrayResolverError
	var KeyArrayResolver
	;(function (KeyArrayResolver) {
		/** Resolves an array of string[] keys from the given schema or array type. */
		function Resolve(schema) {
			// prettier-ignore
			return Array.isArray(schema) ? schema :
	            TypeGuard.TUnionLiteral(schema) ? schema.anyOf.map((schema) => schema.const.toString()) :
	                TypeGuard.TLiteral(schema) ? [schema.const] :
	                    TypeGuard.TTemplateLiteral(schema) ? (() => {
	                        const expression = TemplateLiteralParser.ParseExact(schema.pattern);
	                        if (!TemplateLiteralFinite.Check(expression))
	                            throw new KeyArrayResolverError('Cannot resolve keys from infinite template expression');
	                        return [...TemplateLiteralGenerator.Generate(expression)];
	                    })() : [];
		}
		KeyArrayResolver.Resolve = Resolve
	})(KeyArrayResolver || (exports.KeyArrayResolver = KeyArrayResolver = {}))
	// --------------------------------------------------------------------------
	// UnionResolver
	// --------------------------------------------------------------------------
	var UnionResolver
	;(function (UnionResolver) {
		function* TUnion(union) {
			for (const schema of union.anyOf) {
				if (schema[exports.Kind] === "Union") {
					yield* TUnion(schema)
				} else {
					yield schema
				}
			}
		}
		/** Returns a resolved union with interior unions flattened */
		function Resolve(union) {
			return exports.Type.Union([...TUnion(union)], { ...union })
		}
		UnionResolver.Resolve = Resolve
	})(UnionResolver || (exports.UnionResolver = UnionResolver = {}))
	// --------------------------------------------------------------------------
	// TemplateLiteralPattern
	// --------------------------------------------------------------------------
	class TemplateLiteralPatternError extends TypeBoxError {}
	exports.TemplateLiteralPatternError = TemplateLiteralPatternError
	var TemplateLiteralPattern
	;(function (TemplateLiteralPattern) {
		function Throw(message) {
			throw new TemplateLiteralPatternError(message)
		}
		function Escape(value) {
			return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		}
		function Visit(schema, acc) {
			// prettier-ignore
			return (TypeGuard.TTemplateLiteral(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) :
	            TypeGuard.TUnion(schema) ? `(${schema.anyOf.map((schema) => Visit(schema, acc)).join('|')})` :
	                TypeGuard.TNumber(schema) ? `${acc}${exports.PatternNumber}` :
	                    TypeGuard.TInteger(schema) ? `${acc}${exports.PatternNumber}` :
	                        TypeGuard.TBigInt(schema) ? `${acc}${exports.PatternNumber}` :
	                            TypeGuard.TString(schema) ? `${acc}${exports.PatternString}` :
	                                TypeGuard.TLiteral(schema) ? `${acc}${Escape(schema.const.toString())}` :
	                                    TypeGuard.TBoolean(schema) ? `${acc}${exports.PatternBoolean}` :
	                                        Throw(`Unexpected Kind '${schema[exports.Kind]}'`));
		}
		function Create(kinds) {
			return `^${kinds.map((schema) => Visit(schema, "")).join("")}\$`
		}
		TemplateLiteralPattern.Create = Create
	})(TemplateLiteralPattern || (exports.TemplateLiteralPattern = TemplateLiteralPattern = {}))
	// --------------------------------------------------------------------------------------
	// TemplateLiteralResolver
	// --------------------------------------------------------------------------------------
	var TemplateLiteralResolver
	;(function (TemplateLiteralResolver) {
		/** Resolves a template literal as a TUnion */
		function Resolve(template) {
			const expression = TemplateLiteralParser.ParseExact(template.pattern)
			if (!TemplateLiteralFinite.Check(expression)) return exports.Type.String()
			const literals = [...TemplateLiteralGenerator.Generate(expression)].map((value) =>
				exports.Type.Literal(value)
			)
			return exports.Type.Union(literals)
		}
		TemplateLiteralResolver.Resolve = Resolve
	})(TemplateLiteralResolver || (exports.TemplateLiteralResolver = TemplateLiteralResolver = {}))
	// --------------------------------------------------------------------------------------
	// TemplateLiteralParser
	// --------------------------------------------------------------------------------------
	class TemplateLiteralParserError extends TypeBoxError {}
	exports.TemplateLiteralParserError = TemplateLiteralParserError
	var TemplateLiteralParser
	;(function (TemplateLiteralParser) {
		function IsNonEscaped(pattern, index, char) {
			return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92
		}
		function IsOpenParen(pattern, index) {
			return IsNonEscaped(pattern, index, "(")
		}
		function IsCloseParen(pattern, index) {
			return IsNonEscaped(pattern, index, ")")
		}
		function IsSeparator(pattern, index) {
			return IsNonEscaped(pattern, index, "|")
		}
		function IsGroup(pattern) {
			if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1))) return false
			let count = 0
			for (let index = 0; index < pattern.length; index++) {
				if (IsOpenParen(pattern, index)) count += 1
				if (IsCloseParen(pattern, index)) count -= 1
				if (count === 0 && index !== pattern.length - 1) return false
			}
			return true
		}
		function InGroup(pattern) {
			return pattern.slice(1, pattern.length - 1)
		}
		function IsPrecedenceOr(pattern) {
			let count = 0
			for (let index = 0; index < pattern.length; index++) {
				if (IsOpenParen(pattern, index)) count += 1
				if (IsCloseParen(pattern, index)) count -= 1
				if (IsSeparator(pattern, index) && count === 0) return true
			}
			return false
		}
		function IsPrecedenceAnd(pattern) {
			for (let index = 0; index < pattern.length; index++) {
				if (IsOpenParen(pattern, index)) return true
			}
			return false
		}
		function Or(pattern) {
			let [count, start] = [0, 0]
			const expressions = []
			for (let index = 0; index < pattern.length; index++) {
				if (IsOpenParen(pattern, index)) count += 1
				if (IsCloseParen(pattern, index)) count -= 1
				if (IsSeparator(pattern, index) && count === 0) {
					const range = pattern.slice(start, index)
					if (range.length > 0) expressions.push(Parse(range))
					start = index + 1
				}
			}
			const range = pattern.slice(start)
			if (range.length > 0) expressions.push(Parse(range))
			if (expressions.length === 0) return { type: "const", const: "" }
			if (expressions.length === 1) return expressions[0]
			return { type: "or", expr: expressions }
		}
		function And(pattern) {
			function Group(value, index) {
				if (!IsOpenParen(value, index))
					throw new TemplateLiteralParserError(
						`TemplateLiteralParser: Index must point to open parens`
					)
				let count = 0
				for (let scan = index; scan < value.length; scan++) {
					if (IsOpenParen(value, scan)) count += 1
					if (IsCloseParen(value, scan)) count -= 1
					if (count === 0) return [index, scan]
				}
				throw new TemplateLiteralParserError(
					`TemplateLiteralParser: Unclosed group parens in expression`
				)
			}
			function Range(pattern, index) {
				for (let scan = index; scan < pattern.length; scan++) {
					if (IsOpenParen(pattern, scan)) return [index, scan]
				}
				return [index, pattern.length]
			}
			const expressions = []
			for (let index = 0; index < pattern.length; index++) {
				if (IsOpenParen(pattern, index)) {
					const [start, end] = Group(pattern, index)
					const range = pattern.slice(start, end + 1)
					expressions.push(Parse(range))
					index = end
				} else {
					const [start, end] = Range(pattern, index)
					const range = pattern.slice(start, end)
					if (range.length > 0) expressions.push(Parse(range))
					index = end - 1
				}
			}
			// prettier-ignore
			return (expressions.length === 0) ? { type: 'const', const: '' } :
	            (expressions.length === 1) ? expressions[0] :
	                { type: 'and', expr: expressions };
		}
		/** Parses a pattern and returns an expression tree */
		function Parse(pattern) {
			// prettier-ignore
			return IsGroup(pattern) ? Parse(InGroup(pattern)) :
	            IsPrecedenceOr(pattern) ? Or(pattern) :
	                IsPrecedenceAnd(pattern) ? And(pattern) :
	                    { type: 'const', const: pattern };
		}
		TemplateLiteralParser.Parse = Parse
		/** Parses a pattern and strips forward and trailing ^ and $ */
		function ParseExact(pattern) {
			return Parse(pattern.slice(1, pattern.length - 1))
		}
		TemplateLiteralParser.ParseExact = ParseExact
	})(TemplateLiteralParser || (exports.TemplateLiteralParser = TemplateLiteralParser = {}))
	// --------------------------------------------------------------------------------------
	// TemplateLiteralFinite
	// --------------------------------------------------------------------------------------
	class TemplateLiteralFiniteError extends TypeBoxError {}
	exports.TemplateLiteralFiniteError = TemplateLiteralFiniteError
	var TemplateLiteralFinite
	;(function (TemplateLiteralFinite) {
		function Throw(message) {
			throw new TemplateLiteralFiniteError(message)
		}
		function IsNumber(expression) {
			// prettier-ignore
			return (expression.type === 'or' &&
	            expression.expr.length === 2 &&
	            expression.expr[0].type === 'const' &&
	            expression.expr[0].const === '0' &&
	            expression.expr[1].type === 'const' &&
	            expression.expr[1].const === '[1-9][0-9]*');
		}
		function IsBoolean(expression) {
			// prettier-ignore
			return (expression.type === 'or' &&
	            expression.expr.length === 2 &&
	            expression.expr[0].type === 'const' &&
	            expression.expr[0].const === 'true' &&
	            expression.expr[1].type === 'const' &&
	            expression.expr[1].const === 'false');
		}
		function IsString(expression) {
			return expression.type === "const" && expression.const === ".*"
		}
		function Check(expression) {
			// prettier-ignore
			return IsBoolean(expression) ? true :
	            IsNumber(expression) || IsString(expression) ? false :
	                (expression.type === 'and') ? expression.expr.every((expr) => Check(expr)) :
	                    (expression.type === 'or') ? expression.expr.every((expr) => Check(expr)) :
	                        (expression.type === 'const') ? true :
	                            Throw(`Unknown expression type`);
		}
		TemplateLiteralFinite.Check = Check
	})(TemplateLiteralFinite || (exports.TemplateLiteralFinite = TemplateLiteralFinite = {}))
	// --------------------------------------------------------------------------------------
	// TemplateLiteralGenerator
	// --------------------------------------------------------------------------------------
	class TemplateLiteralGeneratorError extends TypeBoxError {}
	exports.TemplateLiteralGeneratorError = TemplateLiteralGeneratorError
	var TemplateLiteralGenerator
	;(function (TemplateLiteralGenerator) {
		function* Reduce(buffer) {
			if (buffer.length === 1) return yield* buffer[0]
			for (const left of buffer[0]) {
				for (const right of Reduce(buffer.slice(1))) {
					yield `${left}${right}`
				}
			}
		}
		function* And(expression) {
			return yield* Reduce(expression.expr.map((expr) => [...Generate(expr)]))
		}
		function* Or(expression) {
			for (const expr of expression.expr) yield* Generate(expr)
		}
		function* Const(expression) {
			return yield expression.const
		}
		function* Generate(expression) {
			// prettier-ignore
			return (expression.type === 'and' ? yield* And(expression) :
	            expression.type === 'or' ? yield* Or(expression) :
	                expression.type === 'const' ? yield* Const(expression) :
	                    (() => { throw new TemplateLiteralGeneratorError('Unknown expression'); })());
		}
		TemplateLiteralGenerator.Generate = Generate
	})(TemplateLiteralGenerator || (exports.TemplateLiteralGenerator = TemplateLiteralGenerator = {}))
	// ---------------------------------------------------------------------
	// TemplateLiteralDslParser
	// ---------------------------------------------------------------------
	var TemplateLiteralDslParser
	;(function (TemplateLiteralDslParser) {
		function* ParseUnion(template) {
			const trim = template.trim().replace(/"|'/g, "")
			// prettier-ignore
			return (trim === 'boolean' ? yield exports.Type.Boolean() :
	            trim === 'number' ? yield exports.Type.Number() :
	                trim === 'bigint' ? yield exports.Type.BigInt() :
	                    trim === 'string' ? yield exports.Type.String() :
	                        yield (() => {
	                            const literals = trim.split('|').map((literal) => exports.Type.Literal(literal.trim()));
	                            return (literals.length === 0 ? exports.Type.Never() :
	                                literals.length === 1 ? literals[0] :
	                                    exports.Type.Union(literals));
	                        })());
		}
		function* ParseTerminal(template) {
			if (template[1] !== "{") {
				const L = exports.Type.Literal("$")
				const R = ParseLiteral(template.slice(1))
				return yield* [L, ...R]
			}
			for (let i = 2; i < template.length; i++) {
				if (template[i] === "}") {
					const L = ParseUnion(template.slice(2, i))
					const R = ParseLiteral(template.slice(i + 1))
					return yield* [...L, ...R]
				}
			}
			yield exports.Type.Literal(template)
		}
		function* ParseLiteral(template) {
			for (let i = 0; i < template.length; i++) {
				if (template[i] === "$") {
					const L = exports.Type.Literal(template.slice(0, i))
					const R = ParseTerminal(template.slice(i))
					return yield* [L, ...R]
				}
			}
			yield exports.Type.Literal(template)
		}
		function Parse(template_dsl) {
			return [...ParseLiteral(template_dsl)]
		}
		TemplateLiteralDslParser.Parse = Parse
	})(TemplateLiteralDslParser || (exports.TemplateLiteralDslParser = TemplateLiteralDslParser = {}))
	// ---------------------------------------------------------------------
	// TransformBuilder
	// ---------------------------------------------------------------------
	class TransformDecodeBuilder {
		constructor(schema) {
			this.schema = schema
		}
		Decode(decode) {
			return new TransformEncodeBuilder(this.schema, decode)
		}
	}
	exports.TransformDecodeBuilder = TransformDecodeBuilder
	class TransformEncodeBuilder {
		constructor(schema, decode) {
			this.schema = schema
			this.decode = decode
		}
		Encode(encode) {
			const schema = TypeClone.Type(this.schema)
			// prettier-ignore
			return (TypeGuard.TTransform(schema) ? (() => {
	            const Encode = (value) => schema[exports.Transform].Encode(encode(value));
	            const Decode = (value) => this.decode(schema[exports.Transform].Decode(value));
	            const Codec = { Encode: Encode, Decode: Decode };
	            return { ...schema, [exports.Transform]: Codec };
	        })() : (() => {
	            const Codec = { Decode: this.decode, Encode: encode };
	            return { ...schema, [exports.Transform]: Codec };
	        })());
		}
	}
	exports.TransformEncodeBuilder = TransformEncodeBuilder
	// --------------------------------------------------------------------------
	// TypeOrdinal: Used for auto $id generation
	// --------------------------------------------------------------------------
	let TypeOrdinal = 0
	// --------------------------------------------------------------------------
	// TypeBuilder
	// --------------------------------------------------------------------------
	class TypeBuilderError extends TypeBoxError {}
	exports.TypeBuilderError = TypeBuilderError
	class TypeBuilder {
		/** `[Internal]` Creates a schema without `static` and `params` types */
		Create(schema) {
			return schema
		}
		/** `[Internal]` Throws a TypeBuilder error with the given message */
		Throw(message) {
			throw new TypeBuilderError(message)
		}
		/** `[Internal]` Discards property keys from the given record type */
		Discard(record, keys) {
			return keys.reduce((acc, key) => {
				const { [key]: _, ...rest } = acc
				return rest
			}, record)
		}
		/** `[Json]` Omits compositing symbols from this schema */
		Strict(schema) {
			return JSON.parse(JSON.stringify(schema))
		}
	}
	exports.TypeBuilder = TypeBuilder
	// --------------------------------------------------------------------------
	// JsonTypeBuilder
	// --------------------------------------------------------------------------
	class JsonTypeBuilder extends TypeBuilder {
		// ------------------------------------------------------------------------
		// Modifiers
		// ------------------------------------------------------------------------
		/** `[Json]` Creates a Readonly and Optional property */
		ReadonlyOptional(schema) {
			return this.Readonly(this.Optional(schema))
		}
		/** `[Json]` Creates a Readonly property */
		Readonly(schema) {
			return { ...TypeClone.Type(schema), [exports.Readonly]: "Readonly" }
		}
		/** `[Json]` Creates an Optional property */
		Optional(schema) {
			return { ...TypeClone.Type(schema), [exports.Optional]: "Optional" }
		}
		// ------------------------------------------------------------------------
		// Types
		// ------------------------------------------------------------------------
		/** `[Json]` Creates an Any type */
		Any(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Any" })
		}
		/** `[Json]` Creates an Array type */
		Array(schema, options = {}) {
			return this.Create({
				...options,
				[exports.Kind]: "Array",
				type: "array",
				items: TypeClone.Type(schema),
			})
		}
		/** `[Json]` Creates a Boolean type */
		Boolean(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Boolean", type: "boolean" })
		}
		/** `[Json]` Intrinsic function to Capitalize LiteralString types */
		Capitalize(schema, options = {}) {
			return { ...Intrinsic.Map(TypeClone.Type(schema), "Capitalize"), ...options }
		}
		/** `[Json]` Creates a Composite object type */
		Composite(objects, options) {
			const intersect = exports.Type.Intersect(objects, {})
			const keys = KeyResolver.ResolveKeys(intersect, { includePatterns: false })
			const properties = keys.reduce(
				(acc, key) => ({ ...acc, [key]: exports.Type.Index(intersect, [key]) }),
				{}
			)
			return exports.Type.Object(properties, options)
		}
		/** `[Json]` Creates a Enum type */
		Enum(item, options = {}) {
			if (ValueGuard.IsUndefined(item)) return this.Throw("Enum undefined or empty")
			// prettier-ignore
			const values1 = Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
			const values2 = [...new Set(values1)]
			const anyOf = values2.map((value) => exports.Type.Literal(value))
			return this.Union(anyOf, { ...options, [exports.Hint]: "Enum" })
		}
		/** `[Json]` Creates a Conditional type */
		Extends(left, right, trueType, falseType, options = {}) {
			switch (TypeExtends.Extends(left, right)) {
				case TypeExtendsResult.Union:
					return this.Union([TypeClone.Type(trueType, options), TypeClone.Type(falseType, options)])
				case TypeExtendsResult.True:
					return TypeClone.Type(trueType, options)
				case TypeExtendsResult.False:
					return TypeClone.Type(falseType, options)
			}
		}
		/** `[Json]` Constructs a type by excluding from unionType all union members that are assignable to excludedMembers */
		Exclude(unionType, excludedMembers, options = {}) {
			// prettier-ignore
			return (TypeGuard.TTemplateLiteral(unionType) ? this.Exclude(TemplateLiteralResolver.Resolve(unionType), excludedMembers, options) :
	            TypeGuard.TTemplateLiteral(excludedMembers) ? this.Exclude(unionType, TemplateLiteralResolver.Resolve(excludedMembers), options) :
	                TypeGuard.TUnion(unionType) ? (() => {
	                    const narrowed = unionType.anyOf.filter((inner) => TypeExtends.Extends(inner, excludedMembers) === TypeExtendsResult.False);
	                    return (narrowed.length === 1 ? TypeClone.Type(narrowed[0], options) : this.Union(narrowed, options));
	                })() :
	                    TypeExtends.Extends(unionType, excludedMembers) !== TypeExtendsResult.False ? this.Never(options) :
	                        TypeClone.Type(unionType, options));
		}
		/** `[Json]` Constructs a type by extracting from type all union members that are assignable to union */
		Extract(type, union, options = {}) {
			// prettier-ignore
			return (TypeGuard.TTemplateLiteral(type) ? this.Extract(TemplateLiteralResolver.Resolve(type), union, options) :
	            TypeGuard.TTemplateLiteral(union) ? this.Extract(type, TemplateLiteralResolver.Resolve(union), options) :
	                TypeGuard.TUnion(type) ? (() => {
	                    const narrowed = type.anyOf.filter((inner) => TypeExtends.Extends(inner, union) !== TypeExtendsResult.False);
	                    return (narrowed.length === 1 ? TypeClone.Type(narrowed[0], options) : this.Union(narrowed, options));
	                })() :
	                    TypeExtends.Extends(type, union) !== TypeExtendsResult.False ? TypeClone.Type(type, options) :
	                        this.Never(options));
		}
		/** `[Json]` Returns an Indexed property type for the given keys */
		Index(schema, unresolved, options = {}) {
			// prettier-ignore
			return (TypeGuard.TArray(schema) && TypeGuard.TNumber(unresolved) ? (() => {
	            return TypeClone.Type(schema.items, options);
	        })() :
	            TypeGuard.TTuple(schema) && TypeGuard.TNumber(unresolved) ? (() => {
	                const items = ValueGuard.IsUndefined(schema.items) ? [] : schema.items;
	                const cloned = items.map((schema) => TypeClone.Type(schema));
	                return this.Union(cloned, options);
	            })() : (() => {
	                const keys = KeyArrayResolver.Resolve(unresolved);
	                const clone = TypeClone.Type(schema);
	                return IndexedAccessor.Resolve(clone, keys, options);
	            })());
		}
		/** `[Json]` Creates an Integer type */
		Integer(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Integer", type: "integer" })
		}
		/** `[Json]` Creates an Intersect type */
		Intersect(allOf, options = {}) {
			if (allOf.length === 0) return exports.Type.Never()
			if (allOf.length === 1) return TypeClone.Type(allOf[0], options)
			if (allOf.some((schema) => TypeGuard.TTransform(schema)))
				this.Throw("Cannot intersect transform types")
			const objects = allOf.every((schema) => TypeGuard.TObject(schema))
			const cloned = TypeClone.Rest(allOf)
			// prettier-ignore
			const clonedUnevaluatedProperties = TypeGuard.TSchema(options.unevaluatedProperties)
	            ? { unevaluatedProperties: TypeClone.Type(options.unevaluatedProperties) }
	            : {};
			return options.unevaluatedProperties === false ||
				TypeGuard.TSchema(options.unevaluatedProperties) ||
				objects
				? this.Create({
						...options,
						...clonedUnevaluatedProperties,
						[exports.Kind]: "Intersect",
						type: "object",
						allOf: cloned,
					})
				: this.Create({
						...options,
						...clonedUnevaluatedProperties,
						[exports.Kind]: "Intersect",
						allOf: cloned,
					})
		}
		/** `[Json]` Creates a KeyOf type */
		KeyOf(schema, options = {}) {
			// prettier-ignore
			return (TypeGuard.TRecord(schema) ? (() => {
	            const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
	            return (pattern === exports.PatternNumberExact ? this.Number(options) :
	                pattern === exports.PatternStringExact ? this.String(options) :
	                    this.Throw('Unable to resolve key type from Record key pattern'));
	        })() :
	            TypeGuard.TTuple(schema) ? (() => {
	                const items = ValueGuard.IsUndefined(schema.items) ? [] : schema.items;
	                const literals = items.map((_, index) => exports.Type.Literal(index.toString()));
	                return this.Union(literals, options);
	            })() :
	                TypeGuard.TArray(schema) ? (() => {
	                    return this.Number(options);
	                })() : (() => {
	                    const keys = KeyResolver.ResolveKeys(schema, { includePatterns: false });
	                    if (keys.length === 0)
	                        return this.Never(options);
	                    const literals = keys.map((key) => this.Literal(key));
	                    return this.Union(literals, options);
	                })());
		}
		/** `[Json]` Creates a Literal type */
		Literal(value, options = {}) {
			return this.Create({
				...options,
				[exports.Kind]: "Literal",
				const: value,
				type: typeof value,
			})
		}
		/** `[Json]` Intrinsic function to Lowercase LiteralString types */
		Lowercase(schema, options = {}) {
			return { ...Intrinsic.Map(TypeClone.Type(schema), "Lowercase"), ...options }
		}
		/** `[Json]` Creates a Never type */
		Never(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Never", not: {} })
		}
		/** `[Json]` Creates a Not type */
		Not(schema, options) {
			return this.Create({ ...options, [exports.Kind]: "Not", not: TypeClone.Type(schema) })
		}
		/** `[Json]` Creates a Null type */
		Null(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Null", type: "null" })
		}
		/** `[Json]` Creates a Number type */
		Number(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Number", type: "number" })
		}
		/** `[Json]` Creates an Object type */
		Object(properties, options = {}) {
			const propertyKeys = Object.getOwnPropertyNames(properties)
			const optionalKeys = propertyKeys.filter((key) => TypeGuard.TOptional(properties[key]))
			const requiredKeys = propertyKeys.filter((name) => !optionalKeys.includes(name))
			const clonedAdditionalProperties = TypeGuard.TSchema(options.additionalProperties)
				? { additionalProperties: TypeClone.Type(options.additionalProperties) }
				: {}
			const clonedProperties = propertyKeys.reduce(
				(acc, key) => ({ ...acc, [key]: TypeClone.Type(properties[key]) }),
				{}
			)
			return requiredKeys.length > 0
				? this.Create({
						...options,
						...clonedAdditionalProperties,
						[exports.Kind]: "Object",
						type: "object",
						properties: clonedProperties,
						required: requiredKeys,
					})
				: this.Create({
						...options,
						...clonedAdditionalProperties,
						[exports.Kind]: "Object",
						type: "object",
						properties: clonedProperties,
					})
		}
		/** `[Json]` Constructs a type whose keys are omitted from the given type */
		Omit(schema, unresolved, options = {}) {
			const keys = KeyArrayResolver.Resolve(unresolved)
			// prettier-ignore
			return ObjectMap.Map(this.Discard(TypeClone.Type(schema), ['$id', exports.Transform]), (object) => {
	            if (ValueGuard.IsArray(object.required)) {
	                object.required = object.required.filter((key) => !keys.includes(key));
	                if (object.required.length === 0)
	                    delete object.required;
	            }
	            for (const key of Object.getOwnPropertyNames(object.properties)) {
	                if (keys.includes(key))
	                    delete object.properties[key];
	            }
	            return this.Create(object);
	        }, options);
		}
		/** `[Json]` Constructs a type where all properties are optional */
		Partial(schema, options = {}) {
			// prettier-ignore
			return ObjectMap.Map(this.Discard(TypeClone.Type(schema), ['$id', exports.Transform]), (object) => {
	            const properties = Object.getOwnPropertyNames(object.properties).reduce((acc, key) => {
	                return { ...acc, [key]: this.Optional(object.properties[key]) };
	            }, {});
	            return this.Object(properties, this.Discard(object, ['required']) /* object used as options to retain other constraints */);
	        }, options);
		}
		/** `[Json]` Constructs a type whose keys are picked from the given type */
		Pick(schema, unresolved, options = {}) {
			const keys = KeyArrayResolver.Resolve(unresolved)
			// prettier-ignore
			return ObjectMap.Map(this.Discard(TypeClone.Type(schema), ['$id', exports.Transform]), (object) => {
	            if (ValueGuard.IsArray(object.required)) {
	                object.required = object.required.filter((key) => keys.includes(key));
	                if (object.required.length === 0)
	                    delete object.required;
	            }
	            for (const key of Object.getOwnPropertyNames(object.properties)) {
	                if (!keys.includes(key))
	                    delete object.properties[key];
	            }
	            return this.Create(object);
	        }, options);
		}
		/** `[Json]` Creates a Record type */
		Record(key, schema, options = {}) {
			// prettier-ignore
			return (TypeGuard.TTemplateLiteral(key) ? (() => {
	            const expression = TemplateLiteralParser.ParseExact(key.pattern);
	            // prettier-ignore
	            return TemplateLiteralFinite.Check(expression)
	                ? (this.Object([...TemplateLiteralGenerator.Generate(expression)].reduce((acc, key) => ({ ...acc, [key]: TypeClone.Type(schema) }), {}), options))
	                : this.Create({ ...options, [exports.Kind]: 'Record', type: 'object', patternProperties: { [key.pattern]: TypeClone.Type(schema) } });
	        })() :
	            TypeGuard.TUnion(key) ? (() => {
	                const union = UnionResolver.Resolve(key);
	                if (TypeGuard.TUnionLiteral(union)) {
	                    const properties = union.anyOf.reduce((acc, literal) => ({ ...acc, [literal.const]: TypeClone.Type(schema) }), {});
	                    return this.Object(properties, { ...options, [exports.Hint]: 'Record' });
	                }
	                else
	                    this.Throw('Record key of type union contains non-literal types');
	            })() :
	                TypeGuard.TLiteral(key) ? (() => {
	                    // prettier-ignore
	                    return (ValueGuard.IsString(key.const) || ValueGuard.IsNumber(key.const))
	                        ? this.Object({ [key.const]: TypeClone.Type(schema) }, options)
	                        : this.Throw('Record key of type literal is not of type string or number');
	                })() :
	                    TypeGuard.TInteger(key) || TypeGuard.TNumber(key) ? (() => {
	                        return this.Create({ ...options, [exports.Kind]: 'Record', type: 'object', patternProperties: { [exports.PatternNumberExact]: TypeClone.Type(schema) } });
	                    })() :
	                        TypeGuard.TString(key) ? (() => {
	                            const pattern = ValueGuard.IsUndefined(key.pattern) ? exports.PatternStringExact : key.pattern;
	                            return this.Create({ ...options, [exports.Kind]: 'Record', type: 'object', patternProperties: { [pattern]: TypeClone.Type(schema) } });
	                        })() :
	                            this.Never());
		}
		/** `[Json]` Creates a Recursive type */
		Recursive(callback, options = {}) {
			if (ValueGuard.IsUndefined(options.$id)) options.$id = `T${TypeOrdinal++}`
			const thisType = callback({ [exports.Kind]: "This", $ref: `${options.$id}` })
			thisType.$id = options.$id
			return this.Create({ ...options, [exports.Hint]: "Recursive", ...thisType })
		}
		/** `[Json]` Creates a Ref type. */
		Ref(unresolved, options = {}) {
			if (ValueGuard.IsString(unresolved))
				return this.Create({ ...options, [exports.Kind]: "Ref", $ref: unresolved })
			if (ValueGuard.IsUndefined(unresolved.$id))
				this.Throw("Reference target type must specify an $id")
			return this.Create({ ...options, [exports.Kind]: "Ref", $ref: unresolved.$id })
		}
		/** `[Json]` Constructs a type where all properties are required */
		Required(schema, options = {}) {
			// prettier-ignore
			return ObjectMap.Map(this.Discard(TypeClone.Type(schema), ['$id', exports.Transform]), (object) => {
	            const properties = Object.getOwnPropertyNames(object.properties).reduce((acc, key) => {
	                return { ...acc, [key]: this.Discard(object.properties[key], [exports.Optional]) };
	            }, {});
	            return this.Object(properties, object /* object used as options to retain other constraints  */);
	        }, options);
		}
		/** `[Json]` Extracts interior Rest elements from Tuple, Intersect and Union types */
		Rest(schema) {
			return TypeGuard.TTuple(schema) && !ValueGuard.IsUndefined(schema.items)
				? TypeClone.Rest(schema.items)
				: TypeGuard.TIntersect(schema)
					? TypeClone.Rest(schema.allOf)
					: TypeGuard.TUnion(schema)
						? TypeClone.Rest(schema.anyOf)
						: []
		}
		/** `[Json]` Creates a String type */
		String(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "String", type: "string" })
		}
		/** `[Json]` Creates a TemplateLiteral type */
		TemplateLiteral(unresolved, options = {}) {
			// prettier-ignore
			const pattern = ValueGuard.IsString(unresolved)
	            ? TemplateLiteralPattern.Create(TemplateLiteralDslParser.Parse(unresolved))
	            : TemplateLiteralPattern.Create(unresolved);
			return this.Create({ ...options, [exports.Kind]: "TemplateLiteral", type: "string", pattern })
		}
		/** `[Json]` Creates a Transform type */
		Transform(schema) {
			return new TransformDecodeBuilder(schema)
		}
		/** `[Json]` Creates a Tuple type */
		Tuple(items, options = {}) {
			const [additionalItems, minItems, maxItems] = [false, items.length, items.length]
			const clonedItems = TypeClone.Rest(items)
			// prettier-ignore
			const schema = (items.length > 0 ?
	            { ...options, [exports.Kind]: 'Tuple', type: 'array', items: clonedItems, additionalItems, minItems, maxItems } :
	            { ...options, [exports.Kind]: 'Tuple', type: 'array', minItems, maxItems });
			return this.Create(schema)
		}
		/** `[Json]` Intrinsic function to Uncapitalize LiteralString types */
		Uncapitalize(schema, options = {}) {
			return { ...Intrinsic.Map(TypeClone.Type(schema), "Uncapitalize"), ...options }
		}
		/** `[Json]` Creates a Union type */
		Union(union, options = {}) {
			// prettier-ignore
			return TypeGuard.TTemplateLiteral(union)
	            ? TemplateLiteralResolver.Resolve(union)
	            : (() => {
	                const anyOf = union;
	                if (anyOf.length === 0)
	                    return this.Never(options);
	                if (anyOf.length === 1)
	                    return this.Create(TypeClone.Type(anyOf[0], options));
	                const clonedAnyOf = TypeClone.Rest(anyOf);
	                return this.Create({ ...options, [exports.Kind]: 'Union', anyOf: clonedAnyOf });
	            })();
		}
		/** `[Json]` Creates an Unknown type */
		Unknown(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Unknown" })
		}
		/** `[Json]` Creates a Unsafe type that will infers as the generic argument T */
		Unsafe(options = {}) {
			return this.Create({ ...options, [exports.Kind]: options[exports.Kind] || "Unsafe" })
		}
		/** `[Json]` Intrinsic function to Uppercase LiteralString types */
		Uppercase(schema, options = {}) {
			return { ...Intrinsic.Map(TypeClone.Type(schema), "Uppercase"), ...options }
		}
	}
	exports.JsonTypeBuilder = JsonTypeBuilder
	// --------------------------------------------------------------------------
	// JavaScriptTypeBuilder
	// --------------------------------------------------------------------------
	class JavaScriptTypeBuilder extends JsonTypeBuilder {
		/** `[JavaScript]` Creates a AsyncIterator type */
		AsyncIterator(items, options = {}) {
			return this.Create({
				...options,
				[exports.Kind]: "AsyncIterator",
				type: "AsyncIterator",
				items: TypeClone.Type(items),
			})
		}
		/** `[JavaScript]` Constructs a type by recursively unwrapping Promise types */
		Awaited(schema, options = {}) {
			// prettier-ignore
			const Unwrap = (rest) => rest.length > 0 ? (() => {
	            const [L, ...R] = rest;
	            return [this.Awaited(L), ...Unwrap(R)];
	        })() : rest;
			// prettier-ignore
			return (TypeGuard.TIntersect(schema) ? exports.Type.Intersect(Unwrap(schema.allOf)) :
	            TypeGuard.TUnion(schema) ? exports.Type.Union(Unwrap(schema.anyOf)) :
	                TypeGuard.TPromise(schema) ? this.Awaited(schema.item) :
	                    TypeClone.Type(schema, options));
		}
		/** `[JavaScript]` Creates a BigInt type */
		BigInt(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "BigInt", type: "bigint" })
		}
		/** `[JavaScript]` Extracts the ConstructorParameters from the given Constructor type */
		ConstructorParameters(schema, options = {}) {
			return this.Tuple([...schema.parameters], { ...options })
		}
		/** `[JavaScript]` Creates a Constructor type */
		Constructor(parameters, returns, options) {
			const [clonedParameters, clonedReturns] = [
				TypeClone.Rest(parameters),
				TypeClone.Type(returns),
			]
			return this.Create({
				...options,
				[exports.Kind]: "Constructor",
				type: "Constructor",
				parameters: clonedParameters,
				returns: clonedReturns,
			})
		}
		/** `[JavaScript]` Creates a Date type */
		Date(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Date", type: "Date" })
		}
		/** `[JavaScript]` Creates a Function type */
		Function(parameters, returns, options) {
			const [clonedParameters, clonedReturns] = [
				TypeClone.Rest(parameters),
				TypeClone.Type(returns),
			]
			return this.Create({
				...options,
				[exports.Kind]: "Function",
				type: "Function",
				parameters: clonedParameters,
				returns: clonedReturns,
			})
		}
		/** `[JavaScript]` Extracts the InstanceType from the given Constructor type */
		InstanceType(schema, options = {}) {
			return TypeClone.Type(schema.returns, options)
		}
		/** `[JavaScript]` Creates an Iterator type */
		Iterator(items, options = {}) {
			return this.Create({
				...options,
				[exports.Kind]: "Iterator",
				type: "Iterator",
				items: TypeClone.Type(items),
			})
		}
		/** `[JavaScript]` Extracts the Parameters from the given Function type */
		Parameters(schema, options = {}) {
			return this.Tuple(schema.parameters, { ...options })
		}
		/** `[JavaScript]` Creates a Promise type */
		Promise(item, options = {}) {
			return this.Create({
				...options,
				[exports.Kind]: "Promise",
				type: "Promise",
				item: TypeClone.Type(item),
			})
		}
		/** `[Extended]` Creates a String type */
		RegExp(unresolved, options = {}) {
			const pattern = ValueGuard.IsString(unresolved) ? unresolved : unresolved.source
			return this.Create({ ...options, [exports.Kind]: "String", type: "string", pattern })
		}
		/**
		 * @deprecated Use `Type.RegExp`
		 */
		RegEx(regex, options = {}) {
			return this.RegExp(regex, options)
		}
		/** `[JavaScript]` Extracts the ReturnType from the given Function type */
		ReturnType(schema, options = {}) {
			return TypeClone.Type(schema.returns, options)
		}
		/** `[JavaScript]` Creates a Symbol type */
		Symbol(options) {
			return this.Create({ ...options, [exports.Kind]: "Symbol", type: "symbol" })
		}
		/** `[JavaScript]` Creates a Undefined type */
		Undefined(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Undefined", type: "undefined" })
		}
		/** `[JavaScript]` Creates a Uint8Array type */
		Uint8Array(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Uint8Array", type: "Uint8Array" })
		}
		/** `[JavaScript]` Creates a Void type */
		Void(options = {}) {
			return this.Create({ ...options, [exports.Kind]: "Void", type: "void" })
		}
	}
	exports.JavaScriptTypeBuilder = JavaScriptTypeBuilder
	/** Json Type Builder with Static Resolution for TypeScript */
	exports.JsonType = new JsonTypeBuilder()
	/** JavaScript Type Builder with Static Resolution for TypeScript */
	exports.Type = new JavaScriptTypeBuilder()
})(typebox)

const SDKSettings = typebox.Type.Object({
	// TODO SDK-v2 SETTINGS do we need to generate a settings v2 schema?
	$schema: typebox.Type.Optional(
		typebox.Type.Literal("https://inlang.com/schema/project-settings")
	),
	baseLocale: typebox.Type.String({
		title: "Base locale",
		description: "The base locale of the project. We recommend BCP-47 language tags.",
	}),
	locales: typebox.Type.Array(typebox.Type.String(), {
		uniqueItems: true,
		title: "Project Locales",
		description:
			"Set the locales that are available in your project. All locales needs to be a valid BCP-47 language tag. Needs to include the base locale tag.",
	}),
	// exits for backwards compatibility
	// remove in SDK-v3
	sourceLanguageTag: typebox.Type.Optional(
		typebox.Type.String({
			description: "Use baseLocale instead.",
			deprecated: true,
		})
	),
	// exits for backwards compatibility
	// remove in SDK-v3
	languageTags: typebox.Type.Optional(
		typebox.Type.Array(typebox.Type.String(), {
			uniqueItems: true,
			deprecated: true,
			description: "Use locales instead.",
		})
	),
	/**
	 * The modules to load.
	 *
	 * @example
	 *  modules: [
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
	 *  ]
	 */
	modules: typebox.Type.Optional(
		typebox.Type.Array(
			typebox.Type.Intersect([
				typebox.Type.String({
					description: "The module must be a valid URI according to RFC 3986.",
					pattern:
						"(?:[A-Za-z][A-Za-z0-9+.-]*:/{2})?(?:(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})+(?::([A-Za-z0-9-._~]?|[%][A-Fa-f0-9]{2})+)?@)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.){1,126}[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?::[0-9]+)?(?:/(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})*)*(?:\\?(?:[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)(?:&|;[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)*)?",
				}),
				typebox.Type.String({
					description: "The module must end with `.js`.",
					pattern: ".*\\.js$",
				}),
				typebox.Type.String({
					description: "The module can only contain a major version number.",
					pattern: "^(?!.*@\\d\\.)[^]*$",
				}),
			]),
			{
				uniqueItems: true,
				description: "The modules to load. Must be a valid URI but can be relative.",
				examples: [
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
					"./local-testing-plugin.js",
				],
			}
		)
	),
	telemetry: typebox.Type.Optional(
		typebox.Type.Union(
			[
				typebox.Type.Literal("off", {
					description: "No telemetry events ",
				}),
			],
			{ description: "If not set, defaults to all" }
		)
	),
	experimental: typebox.Type.Optional(
		typebox.Type.Record(typebox.Type.String(), typebox.Type.Literal(true), {
			title: "Experimental settings",
			description: "Experimental settings that are used for product development.",
		})
	),
	/**
	 * plugin.*: JSONObject
	 *
	 * The plugin settings are validated when importing plugins
	 */
})
/**
 * Settings defined via apps, plugins, lint rules, etc.
 *
 * Using external settings to only allow `plugin.*` keys
 * and don't block the SDK from adding new settings.
 */
const ExternalSettings = typebox.Type.Record(
	typebox.Type.String({
		pattern: `^((plugin)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)|\\$schema|${
			// pattern must include the settings properties
			Object.keys(SDKSettings.properties)
				.map((key) => key.replaceAll(".", "\\."))
				.join("|")
		})$`,
		description: "The key must be conform to `plugin.*`.",
		examples: ["plugin.csv-importer", "plugin.i18next"],
	}),
	// Using JSON (array and object) as a workaround to make the
	// intersection between `InternalSettings`, which contains an array,
	// and `ExternalSettings` which are objects possible
	typebox.Type.Record(typebox.Type.String(), typebox.Type.Any()),
	{ description: "Settings defined by apps, plugins, etc." }
)
const ProjectSettings = typebox.Type.Intersect([SDKSettings, ExternalSettings])

/*
 * Checks if a property is required in a schema.
 *
 * @param schema: Record<string, any> | undefined
 * @param property: string
 */
const checkRequired = (schema, property) => {
	if (schema && schema.required && schema.required.includes(property)) {
		return true
	}
	return false
}

var limit = (x, low = 0, high = 1) => {
	return min$4(max$4(low, x), high)
}

var clip_rgb = (rgb) => {
	rgb._clipped = false
	rgb._unclipped = rgb.slice(0)
	for (let i = 0; i <= 3; i++) {
		if (i < 3) {
			if (rgb[i] < 0 || rgb[i] > 255) rgb._clipped = true
			rgb[i] = limit(rgb[i], 0, 255)
		} else if (i === 3) {
			rgb[i] = limit(rgb[i], 0, 1)
		}
	}
	return rgb
}

// ported from jQuery's $.type
const classToType = {}
for (let name of [
	"Boolean",
	"Number",
	"String",
	"Function",
	"Array",
	"Date",
	"RegExp",
	"Undefined",
	"Null",
]) {
	classToType[`[object ${name}]`] = name.toLowerCase()
}
function type(obj) {
	return classToType[Object.prototype.toString.call(obj)] || "object"
}

var unpack = (args, keyOrder = null) => {
	// if called with more than 3 arguments, we return the arguments
	if (args.length >= 3) return Array.prototype.slice.call(args)
	// with less than 3 args we check if first arg is object
	// and use the keyOrder string to extract and sort properties
	if (type(args[0]) == "object" && keyOrder) {
		return keyOrder
			.split("")
			.filter((k) => args[0][k] !== undefined)
			.map((k) => args[0][k])
	}
	// otherwise we just return the first argument
	// (which we suppose is an array of args)
	return args[0]
}

var last = (args) => {
	if (args.length < 2) return null
	const l = args.length - 1
	if (type(args[l]) == "string") return args[l].toLowerCase()
	return null
}

const { PI: PI$2, min: min$4, max: max$4 } = Math

const TWOPI = PI$2 * 2
const PITHIRD = PI$2 / 3
const DEG2RAD = PI$2 / 180
const RAD2DEG = 180 / PI$2

var input = {
	format: {},
	autodetect: [],
}

class Color {
	constructor(...args) {
		const me = this
		if (
			type(args[0]) === "object" &&
			args[0].constructor &&
			args[0].constructor === this.constructor
		) {
			// the argument is already a Color instance
			return args[0]
		}
		// last argument could be the mode
		let mode = last(args)
		let autodetect = false
		if (!mode) {
			autodetect = true
			if (!input.sorted) {
				input.autodetect = input.autodetect.sort((a, b) => b.p - a.p)
				input.sorted = true
			}
			// auto-detect format
			for (let chk of input.autodetect) {
				mode = chk.test(...args)
				if (mode) break
			}
		}
		if (input.format[mode]) {
			const rgb = input.format[mode].apply(null, autodetect ? args : args.slice(0, -1))
			me._rgb = clip_rgb(rgb)
		} else {
			throw new Error("unknown format: " + args)
		}
		// add alpha channel
		if (me._rgb.length === 3) me._rgb.push(1)
	}
	toString() {
		if (type(this.hex) == "function") return this.hex()
		return `[${this._rgb.join(",")}]`
	}
}

// this gets updated automatically
const version = "2.6.0"

const chroma = (...args) => {
	return new chroma.Color(...args)
}

chroma.Color = Color
chroma.version = version

const cmyk2rgb = (...args) => {
	args = unpack(args, "cmyk")
	const [c, m, y, k] = args
	const alpha = args.length > 4 ? args[4] : 1
	if (k === 1) return [0, 0, 0, alpha]
	return [
		c >= 1 ? 0 : 255 * (1 - c) * (1 - k), // r
		m >= 1 ? 0 : 255 * (1 - m) * (1 - k), // g
		y >= 1 ? 0 : 255 * (1 - y) * (1 - k), // b
		alpha,
	]
}

const { max: max$3 } = Math

const rgb2cmyk = (...args) => {
	let [r, g, b] = unpack(args, "rgb")
	r = r / 255
	g = g / 255
	b = b / 255
	const k = 1 - max$3(r, max$3(g, b))
	const f = k < 1 ? 1 / (1 - k) : 0
	const c = (1 - r - k) * f
	const m = (1 - g - k) * f
	const y = (1 - b - k) * f
	return [c, m, y, k]
}

Color.prototype.cmyk = function () {
	return rgb2cmyk(this._rgb)
}

chroma.cmyk = (...args) => new Color(...args, "cmyk")

input.format.cmyk = cmyk2rgb

input.autodetect.push({
	p: 2,
	test: (...args) => {
		args = unpack(args, "cmyk")
		if (type(args) === "array" && args.length === 4) {
			return "cmyk"
		}
	},
})

const rnd = (a) => Math.round(a * 100) / 100

/*
 * supported arguments:
 * - hsl2css(h,s,l)
 * - hsl2css(h,s,l,a)
 * - hsl2css([h,s,l], mode)
 * - hsl2css([h,s,l,a], mode)
 * - hsl2css({h,s,l,a}, mode)
 */
const hsl2css = (...args) => {
	const hsla = unpack(args, "hsla")
	let mode = last(args) || "lsa"
	hsla[0] = rnd(hsla[0] || 0)
	hsla[1] = rnd(hsla[1] * 100) + "%"
	hsla[2] = rnd(hsla[2] * 100) + "%"
	if (mode === "hsla" || (hsla.length > 3 && hsla[3] < 1)) {
		hsla[3] = hsla.length > 3 ? hsla[3] : 1
		mode = "hsla"
	} else {
		hsla.length = 3
	}
	return `${mode}(${hsla.join(",")})`
}

/*
 * supported arguments:
 * - rgb2hsl(r,g,b)
 * - rgb2hsl(r,g,b,a)
 * - rgb2hsl([r,g,b])
 * - rgb2hsl([r,g,b,a])
 * - rgb2hsl({r,g,b,a})
 */
const rgb2hsl$1 = (...args) => {
	args = unpack(args, "rgba")
	let [r, g, b] = args

	r /= 255
	g /= 255
	b /= 255

	const minRgb = min$4(r, g, b)
	const maxRgb = max$4(r, g, b)

	const l = (maxRgb + minRgb) / 2
	let s, h

	if (maxRgb === minRgb) {
		s = 0
		h = Number.NaN
	} else {
		s = l < 0.5 ? (maxRgb - minRgb) / (maxRgb + minRgb) : (maxRgb - minRgb) / (2 - maxRgb - minRgb)
	}

	if (r == maxRgb) h = (g - b) / (maxRgb - minRgb)
	else if (g == maxRgb) h = 2 + (b - r) / (maxRgb - minRgb)
	else if (b == maxRgb) h = 4 + (r - g) / (maxRgb - minRgb)

	h *= 60
	if (h < 0) h += 360
	if (args.length > 3 && args[3] !== undefined) return [h, s, l, args[3]]
	return [h, s, l]
}

const { round: round$7 } = Math

/*
 * supported arguments:
 * - rgb2css(r,g,b)
 * - rgb2css(r,g,b,a)
 * - rgb2css([r,g,b], mode)
 * - rgb2css([r,g,b,a], mode)
 * - rgb2css({r,g,b,a}, mode)
 */
const rgb2css = (...args) => {
	const rgba = unpack(args, "rgba")
	let mode = last(args) || "rgb"
	if (mode.substr(0, 3) == "hsl") {
		return hsl2css(rgb2hsl$1(rgba), mode)
	}
	rgba[0] = round$7(rgba[0])
	rgba[1] = round$7(rgba[1])
	rgba[2] = round$7(rgba[2])
	if (mode === "rgba" || (rgba.length > 3 && rgba[3] < 1)) {
		rgba[3] = rgba.length > 3 ? rgba[3] : 1
		mode = "rgba"
	}
	return `${mode}(${rgba.slice(0, mode === "rgb" ? 3 : 4).join(",")})`
}

const { round: round$6 } = Math

const hsl2rgb = (...args) => {
	args = unpack(args, "hsl")
	const [h, s, l] = args
	let r, g, b
	if (s === 0) {
		r = g = b = l * 255
	} else {
		const t3 = [0, 0, 0]
		const c = [0, 0, 0]
		const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s
		const t1 = 2 * l - t2
		const h_ = h / 360
		t3[0] = h_ + 1 / 3
		t3[1] = h_
		t3[2] = h_ - 1 / 3
		for (let i = 0; i < 3; i++) {
			if (t3[i] < 0) t3[i] += 1
			if (t3[i] > 1) t3[i] -= 1
			if (6 * t3[i] < 1) c[i] = t1 + (t2 - t1) * 6 * t3[i]
			else if (2 * t3[i] < 1) c[i] = t2
			else if (3 * t3[i] < 2) c[i] = t1 + (t2 - t1) * (2 / 3 - t3[i]) * 6
			else c[i] = t1
		}
		;[r, g, b] = [round$6(c[0] * 255), round$6(c[1] * 255), round$6(c[2] * 255)]
	}
	if (args.length > 3) {
		// keep alpha channel
		return [r, g, b, args[3]]
	}
	return [r, g, b, 1]
}

const RE_RGB = /^rgb\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/
const RE_RGBA = /^rgba\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([01]|[01]?\.\d+)\)$/
const RE_RGB_PCT =
	/^rgb\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/
const RE_RGBA_PCT =
	/^rgba\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/
const RE_HSL = /^hsl\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/
const RE_HSLA =
	/^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/

const { round: round$5 } = Math

const css2rgb = (css) => {
	css = css.toLowerCase().trim()
	let m

	if (input.format.named) {
		try {
			return input.format.named(css)
			// eslint-disable-next-line
		} catch (e) {}
	}

	// rgb(250,20,0)
	if ((m = css.match(RE_RGB))) {
		const rgb = m.slice(1, 4)
		for (let i = 0; i < 3; i++) {
			rgb[i] = +rgb[i]
		}
		rgb[3] = 1 // default alpha
		return rgb
	}

	// rgba(250,20,0,0.4)
	if ((m = css.match(RE_RGBA))) {
		const rgb = m.slice(1, 5)
		for (let i = 0; i < 4; i++) {
			rgb[i] = +rgb[i]
		}
		return rgb
	}

	// rgb(100%,0%,0%)
	if ((m = css.match(RE_RGB_PCT))) {
		const rgb = m.slice(1, 4)
		for (let i = 0; i < 3; i++) {
			rgb[i] = round$5(rgb[i] * 2.55)
		}
		rgb[3] = 1 // default alpha
		return rgb
	}

	// rgba(100%,0%,0%,0.4)
	if ((m = css.match(RE_RGBA_PCT))) {
		const rgb = m.slice(1, 5)
		for (let i = 0; i < 3; i++) {
			rgb[i] = round$5(rgb[i] * 2.55)
		}
		rgb[3] = +rgb[3]
		return rgb
	}

	// hsl(0,100%,50%)
	if ((m = css.match(RE_HSL))) {
		const hsl = m.slice(1, 4)
		hsl[1] *= 0.01
		hsl[2] *= 0.01
		const rgb = hsl2rgb(hsl)
		rgb[3] = 1
		return rgb
	}

	// hsla(0,100%,50%,0.5)
	if ((m = css.match(RE_HSLA))) {
		const hsl = m.slice(1, 4)
		hsl[1] *= 0.01
		hsl[2] *= 0.01
		const rgb = hsl2rgb(hsl)
		rgb[3] = +m[4] // default alpha = 1
		return rgb
	}
}

css2rgb.test = (s) => {
	return (
		RE_RGB.test(s) ||
		RE_RGBA.test(s) ||
		RE_RGB_PCT.test(s) ||
		RE_RGBA_PCT.test(s) ||
		RE_HSL.test(s) ||
		RE_HSLA.test(s)
	)
}

Color.prototype.css = function (mode) {
	return rgb2css(this._rgb, mode)
}

chroma.css = (...args) => new Color(...args, "css")

input.format.css = css2rgb

input.autodetect.push({
	p: 5,
	test: (h, ...rest) => {
		if (!rest.length && type(h) === "string" && css2rgb.test(h)) {
			return "css"
		}
	},
})

input.format.gl = (...args) => {
	const rgb = unpack(args, "rgba")
	rgb[0] *= 255
	rgb[1] *= 255
	rgb[2] *= 255
	return rgb
}

chroma.gl = (...args) => new Color(...args, "gl")

Color.prototype.gl = function () {
	const rgb = this._rgb
	return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3]]
}

const { floor: floor$4 } = Math

/*
 * this is basically just HSV with some minor tweaks
 *
 * hue.. [0..360]
 * chroma .. [0..1]
 * grayness .. [0..1]
 */

const hcg2rgb = (...args) => {
	args = unpack(args, "hcg")
	let [h, c, _g] = args
	let r, g, b
	_g = _g * 255
	const _c = c * 255
	if (c === 0) {
		r = g = b = _g
	} else {
		if (h === 360) h = 0
		if (h > 360) h -= 360
		if (h < 0) h += 360
		h /= 60
		const i = floor$4(h)
		const f = h - i
		const p = _g * (1 - c)
		const q = p + _c * (1 - f)
		const t = p + _c * f
		const v = p + _c
		switch (i) {
			case 0:
				;[r, g, b] = [v, t, p]
				break
			case 1:
				;[r, g, b] = [q, v, p]
				break
			case 2:
				;[r, g, b] = [p, v, t]
				break
			case 3:
				;[r, g, b] = [p, q, v]
				break
			case 4:
				;[r, g, b] = [t, p, v]
				break
			case 5:
				;[r, g, b] = [v, p, q]
				break
		}
	}
	return [r, g, b, args.length > 3 ? args[3] : 1]
}

const rgb2hcg = (...args) => {
	const [r, g, b] = unpack(args, "rgb")
	const minRgb = min$4(r, g, b)
	const maxRgb = max$4(r, g, b)
	const delta = maxRgb - minRgb
	const c = (delta * 100) / 255
	const _g = (minRgb / (255 - delta)) * 100
	let h
	if (delta === 0) {
		h = Number.NaN
	} else {
		if (r === maxRgb) h = (g - b) / delta
		if (g === maxRgb) h = 2 + (b - r) / delta
		if (b === maxRgb) h = 4 + (r - g) / delta
		h *= 60
		if (h < 0) h += 360
	}
	return [h, c, _g]
}

Color.prototype.hcg = function () {
	return rgb2hcg(this._rgb)
}

chroma.hcg = (...args) => new Color(...args, "hcg")

input.format.hcg = hcg2rgb

input.autodetect.push({
	p: 1,
	test: (...args) => {
		args = unpack(args, "hcg")
		if (type(args) === "array" && args.length === 3) {
			return "hcg"
		}
	},
})

const RE_HEX = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
const RE_HEXA = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/

const hex2rgb = (hex) => {
	if (hex.match(RE_HEX)) {
		// remove optional leading #
		if (hex.length === 4 || hex.length === 7) {
			hex = hex.substr(1)
		}
		// expand short-notation to full six-digit
		if (hex.length === 3) {
			hex = hex.split("")
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
		}
		const u = parseInt(hex, 16)
		const r = u >> 16
		const g = (u >> 8) & 0xff
		const b = u & 0xff
		return [r, g, b, 1]
	}

	// match rgba hex format, eg #FF000077
	if (hex.match(RE_HEXA)) {
		if (hex.length === 5 || hex.length === 9) {
			// remove optional leading #
			hex = hex.substr(1)
		}
		// expand short-notation to full eight-digit
		if (hex.length === 4) {
			hex = hex.split("")
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
		}
		const u = parseInt(hex, 16)
		const r = (u >> 24) & 0xff
		const g = (u >> 16) & 0xff
		const b = (u >> 8) & 0xff
		const a = Math.round(((u & 0xff) / 0xff) * 100) / 100
		return [r, g, b, a]
	}

	// we used to check for css colors here
	// if _input.css? and rgb = _input.css hex
	//     return rgb

	throw new Error(`unknown hex color: ${hex}`)
}

const { round: round$4 } = Math

const rgb2hex = (...args) => {
	let [r, g, b, a] = unpack(args, "rgba")
	let mode = last(args) || "auto"
	if (a === undefined) a = 1
	if (mode === "auto") {
		mode = a < 1 ? "rgba" : "rgb"
	}
	r = round$4(r)
	g = round$4(g)
	b = round$4(b)
	const u = (r << 16) | (g << 8) | b
	let str = "000000" + u.toString(16) //#.toUpperCase();
	str = str.substr(str.length - 6)
	let hxa = "0" + round$4(a * 255).toString(16)
	hxa = hxa.substr(hxa.length - 2)
	switch (mode.toLowerCase()) {
		case "rgba":
			return `#${str}${hxa}`
		case "argb":
			return `#${hxa}${str}`
		default:
			return `#${str}`
	}
}

Color.prototype.hex = function (mode) {
	return rgb2hex(this._rgb, mode)
}

chroma.hex = (...args) => new Color(...args, "hex")

input.format.hex = hex2rgb
input.autodetect.push({
	p: 4,
	test: (h, ...rest) => {
		if (!rest.length && type(h) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(h.length) >= 0) {
			return "hex"
		}
	},
})

const { cos: cos$4 } = Math

/*
 * hue [0..360]
 * saturation [0..1]
 * intensity [0..1]
 */
const hsi2rgb = (...args) => {
	/*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
    */
	args = unpack(args, "hsi")
	let [h, s, i] = args
	let r, g, b

	if (isNaN(h)) h = 0
	if (isNaN(s)) s = 0
	// normalize hue
	if (h > 360) h -= 360
	if (h < 0) h += 360
	h /= 360
	if (h < 1 / 3) {
		b = (1 - s) / 3
		r = (1 + (s * cos$4(TWOPI * h)) / cos$4(PITHIRD - TWOPI * h)) / 3
		g = 1 - (b + r)
	} else if (h < 2 / 3) {
		h -= 1 / 3
		r = (1 - s) / 3
		g = (1 + (s * cos$4(TWOPI * h)) / cos$4(PITHIRD - TWOPI * h)) / 3
		b = 1 - (r + g)
	} else {
		h -= 2 / 3
		g = (1 - s) / 3
		b = (1 + (s * cos$4(TWOPI * h)) / cos$4(PITHIRD - TWOPI * h)) / 3
		r = 1 - (g + b)
	}
	r = limit(i * r * 3)
	g = limit(i * g * 3)
	b = limit(i * b * 3)
	return [r * 255, g * 255, b * 255, args.length > 3 ? args[3] : 1]
}

const { min: min$3, sqrt: sqrt$4, acos } = Math

const rgb2hsi = (...args) => {
	/*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
    */
	let [r, g, b] = unpack(args, "rgb")
	r /= 255
	g /= 255
	b /= 255
	let h
	const min_ = min$3(r, g, b)
	const i = (r + g + b) / 3
	const s = i > 0 ? 1 - min_ / i : 0
	if (s === 0) {
		h = NaN
	} else {
		h = (r - g + (r - b)) / 2
		h /= sqrt$4((r - g) * (r - g) + (r - b) * (g - b))
		h = acos(h)
		if (b > g) {
			h = TWOPI - h
		}
		h /= TWOPI
	}
	return [h * 360, s, i]
}

Color.prototype.hsi = function () {
	return rgb2hsi(this._rgb)
}

chroma.hsi = (...args) => new Color(...args, "hsi")

input.format.hsi = hsi2rgb

input.autodetect.push({
	p: 2,
	test: (...args) => {
		args = unpack(args, "hsi")
		if (type(args) === "array" && args.length === 3) {
			return "hsi"
		}
	},
})

Color.prototype.hsl = function () {
	return rgb2hsl$1(this._rgb)
}

chroma.hsl = (...args) => new Color(...args, "hsl")

input.format.hsl = hsl2rgb

input.autodetect.push({
	p: 2,
	test: (...args) => {
		args = unpack(args, "hsl")
		if (type(args) === "array" && args.length === 3) {
			return "hsl"
		}
	},
})

const { floor: floor$3 } = Math

const hsv2rgb = (...args) => {
	args = unpack(args, "hsv")
	let [h, s, v] = args
	let r, g, b
	v *= 255
	if (s === 0) {
		r = g = b = v
	} else {
		if (h === 360) h = 0
		if (h > 360) h -= 360
		if (h < 0) h += 360
		h /= 60

		const i = floor$3(h)
		const f = h - i
		const p = v * (1 - s)
		const q = v * (1 - s * f)
		const t = v * (1 - s * (1 - f))

		switch (i) {
			case 0:
				;[r, g, b] = [v, t, p]
				break
			case 1:
				;[r, g, b] = [q, v, p]
				break
			case 2:
				;[r, g, b] = [p, v, t]
				break
			case 3:
				;[r, g, b] = [p, q, v]
				break
			case 4:
				;[r, g, b] = [t, p, v]
				break
			case 5:
				;[r, g, b] = [v, p, q]
				break
		}
	}
	return [r, g, b, args.length > 3 ? args[3] : 1]
}

const { min: min$2, max: max$2 } = Math

/*
 * supported arguments:
 * - rgb2hsv(r,g,b)
 * - rgb2hsv([r,g,b])
 * - rgb2hsv({r,g,b})
 */
const rgb2hsl = (...args) => {
	args = unpack(args, "rgb")
	let [r, g, b] = args
	const min_ = min$2(r, g, b)
	const max_ = max$2(r, g, b)
	const delta = max_ - min_
	let h, s, v
	v = max_ / 255.0
	if (max_ === 0) {
		h = Number.NaN
		s = 0
	} else {
		s = delta / max_
		if (r === max_) h = (g - b) / delta
		if (g === max_) h = 2 + (b - r) / delta
		if (b === max_) h = 4 + (r - g) / delta
		h *= 60
		if (h < 0) h += 360
	}
	return [h, s, v]
}

Color.prototype.hsv = function () {
	return rgb2hsl(this._rgb)
}

chroma.hsv = (...args) => new Color(...args, "hsv")

input.format.hsv = hsv2rgb

input.autodetect.push({
	p: 2,
	test: (...args) => {
		args = unpack(args, "hsv")
		if (type(args) === "array" && args.length === 3) {
			return "hsv"
		}
	},
})

var LAB_CONSTANTS = {
	// Corresponds roughly to RGB brighter/darker
	Kn: 18,

	// D65 standard referent
	Xn: 0.95047,
	Yn: 1,
	Zn: 1.08883,

	t0: 0.137931034, // 4 / 29
	t1: 0.206896552, // 6 / 29
	t2: 0.12841855, // 3 * t1 * t1
	t3: 0.008856452, // t1 * t1 * t1
}

const { pow: pow$a } = Math

/*
 * L* [0..100]
 * a [-100..100]
 * b [-100..100]
 */
const lab2rgb = (...args) => {
	args = unpack(args, "lab")
	const [l, a, b] = args
	let x, y, z, r, g, b_

	y = (l + 16) / 116
	x = isNaN(a) ? y : y + a / 500
	z = isNaN(b) ? y : y - b / 200

	y = LAB_CONSTANTS.Yn * lab_xyz(y)
	x = LAB_CONSTANTS.Xn * lab_xyz(x)
	z = LAB_CONSTANTS.Zn * lab_xyz(z)

	r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z) // D65 -> sRGB
	g = xyz_rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z)
	b_ = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z)

	return [r, g, b_, args.length > 3 ? args[3] : 1]
}

const xyz_rgb = (r) => {
	return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow$a(r, 1 / 2.4) - 0.055)
}

const lab_xyz = (t) => {
	return t > LAB_CONSTANTS.t1 ? t * t * t : LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0)
}

const { pow: pow$9 } = Math

const rgb2lab = (...args) => {
	const [r, g, b] = unpack(args, "rgb")
	const [x, y, z] = rgb2xyz(r, g, b)
	const l = 116 * y - 16
	return [l < 0 ? 0 : l, 500 * (x - y), 200 * (y - z)]
}

const rgb_xyz = (r) => {
	if ((r /= 255) <= 0.04045) return r / 12.92
	return pow$9((r + 0.055) / 1.055, 2.4)
}

const xyz_lab = (t) => {
	if (t > LAB_CONSTANTS.t3) return pow$9(t, 1 / 3)
	return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0
}

const rgb2xyz = (r, g, b) => {
	r = rgb_xyz(r)
	g = rgb_xyz(g)
	b = rgb_xyz(b)
	const x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn)
	const y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.072175 * b) / LAB_CONSTANTS.Yn)
	const z = xyz_lab((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn)
	return [x, y, z]
}

Color.prototype.lab = function () {
	return rgb2lab(this._rgb)
}

chroma.lab = (...args) => new Color(...args, "lab")

input.format.lab = lab2rgb

input.autodetect.push({
	p: 2,
	test: (...args) => {
		args = unpack(args, "lab")
		if (type(args) === "array" && args.length === 3) {
			return "lab"
		}
	},
})

const { sin: sin$3, cos: cos$3 } = Math

const lch2lab = (...args) => {
	/*
    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
    These formulas were invented by David Dalrymple to obtain maximum contrast without going
    out of gamut if the parameters are in the range 0-1.

    A saturation multiplier was added by Gregor Aisch
    */
	let [l, c, h] = unpack(args, "lch")
	if (isNaN(h)) h = 0
	h = h * DEG2RAD
	return [l, cos$3(h) * c, sin$3(h) * c]
}

const lch2rgb = (...args) => {
	args = unpack(args, "lch")
	const [l, c, h] = args
	const [L, a, b_] = lch2lab(l, c, h)
	const [r, g, b] = lab2rgb(L, a, b_)
	return [r, g, b, args.length > 3 ? args[3] : 1]
}

const hcl2rgb = (...args) => {
	const hcl = unpack(args, "hcl").reverse()
	return lch2rgb(...hcl)
}

const { sqrt: sqrt$3, atan2: atan2$2, round: round$3 } = Math

const lab2lch = (...args) => {
	const [l, a, b] = unpack(args, "lab")
	const c = sqrt$3(a * a + b * b)
	let h = (atan2$2(b, a) * RAD2DEG + 360) % 360
	if (round$3(c * 10000) === 0) h = Number.NaN
	return [l, c, h]
}

const rgb2lch = (...args) => {
	const [r, g, b] = unpack(args, "rgb")
	const [l, a, b_] = rgb2lab(r, g, b)
	return lab2lch(l, a, b_)
}

Color.prototype.lch = function () {
	return rgb2lch(this._rgb)
}
Color.prototype.hcl = function () {
	return rgb2lch(this._rgb).reverse()
}

chroma.lch = (...args) => new Color(...args, "lch")
chroma.hcl = (...args) => new Color(...args, "hcl")

input.format.lch = lch2rgb
input.format.hcl = hcl2rgb
;["lch", "hcl"].forEach((m) =>
	input.autodetect.push({
		p: 2,
		test: (...args) => {
			args = unpack(args, m)
			if (type(args) === "array" && args.length === 3) {
				return m
			}
		},
	})
)

/**
	X11 color names

	http://www.w3.org/TR/css3-color/#svg-color
*/

const w3cx11 = {
	aliceblue: "#f0f8ff",
	antiquewhite: "#faebd7",
	aqua: "#00ffff",
	aquamarine: "#7fffd4",
	azure: "#f0ffff",
	beige: "#f5f5dc",
	bisque: "#ffe4c4",
	black: "#000000",
	blanchedalmond: "#ffebcd",
	blue: "#0000ff",
	blueviolet: "#8a2be2",
	brown: "#a52a2a",
	burlywood: "#deb887",
	cadetblue: "#5f9ea0",
	chartreuse: "#7fff00",
	chocolate: "#d2691e",
	coral: "#ff7f50",
	cornflowerblue: "#6495ed",
	cornsilk: "#fff8dc",
	crimson: "#dc143c",
	cyan: "#00ffff",
	darkblue: "#00008b",
	darkcyan: "#008b8b",
	darkgoldenrod: "#b8860b",
	darkgray: "#a9a9a9",
	darkgreen: "#006400",
	darkgrey: "#a9a9a9",
	darkkhaki: "#bdb76b",
	darkmagenta: "#8b008b",
	darkolivegreen: "#556b2f",
	darkorange: "#ff8c00",
	darkorchid: "#9932cc",
	darkred: "#8b0000",
	darksalmon: "#e9967a",
	darkseagreen: "#8fbc8f",
	darkslateblue: "#483d8b",
	darkslategray: "#2f4f4f",
	darkslategrey: "#2f4f4f",
	darkturquoise: "#00ced1",
	darkviolet: "#9400d3",
	deeppink: "#ff1493",
	deepskyblue: "#00bfff",
	dimgray: "#696969",
	dimgrey: "#696969",
	dodgerblue: "#1e90ff",
	firebrick: "#b22222",
	floralwhite: "#fffaf0",
	forestgreen: "#228b22",
	fuchsia: "#ff00ff",
	gainsboro: "#dcdcdc",
	ghostwhite: "#f8f8ff",
	gold: "#ffd700",
	goldenrod: "#daa520",
	gray: "#808080",
	green: "#008000",
	greenyellow: "#adff2f",
	grey: "#808080",
	honeydew: "#f0fff0",
	hotpink: "#ff69b4",
	indianred: "#cd5c5c",
	indigo: "#4b0082",
	ivory: "#fffff0",
	khaki: "#f0e68c",
	laserlemon: "#ffff54",
	lavender: "#e6e6fa",
	lavenderblush: "#fff0f5",
	lawngreen: "#7cfc00",
	lemonchiffon: "#fffacd",
	lightblue: "#add8e6",
	lightcoral: "#f08080",
	lightcyan: "#e0ffff",
	lightgoldenrod: "#fafad2",
	lightgoldenrodyellow: "#fafad2",
	lightgray: "#d3d3d3",
	lightgreen: "#90ee90",
	lightgrey: "#d3d3d3",
	lightpink: "#ffb6c1",
	lightsalmon: "#ffa07a",
	lightseagreen: "#20b2aa",
	lightskyblue: "#87cefa",
	lightslategray: "#778899",
	lightslategrey: "#778899",
	lightsteelblue: "#b0c4de",
	lightyellow: "#ffffe0",
	lime: "#00ff00",
	limegreen: "#32cd32",
	linen: "#faf0e6",
	magenta: "#ff00ff",
	maroon: "#800000",
	maroon2: "#7f0000",
	maroon3: "#b03060",
	mediumaquamarine: "#66cdaa",
	mediumblue: "#0000cd",
	mediumorchid: "#ba55d3",
	mediumpurple: "#9370db",
	mediumseagreen: "#3cb371",
	mediumslateblue: "#7b68ee",
	mediumspringgreen: "#00fa9a",
	mediumturquoise: "#48d1cc",
	mediumvioletred: "#c71585",
	midnightblue: "#191970",
	mintcream: "#f5fffa",
	mistyrose: "#ffe4e1",
	moccasin: "#ffe4b5",
	navajowhite: "#ffdead",
	navy: "#000080",
	oldlace: "#fdf5e6",
	olive: "#808000",
	olivedrab: "#6b8e23",
	orange: "#ffa500",
	orangered: "#ff4500",
	orchid: "#da70d6",
	palegoldenrod: "#eee8aa",
	palegreen: "#98fb98",
	paleturquoise: "#afeeee",
	palevioletred: "#db7093",
	papayawhip: "#ffefd5",
	peachpuff: "#ffdab9",
	peru: "#cd853f",
	pink: "#ffc0cb",
	plum: "#dda0dd",
	powderblue: "#b0e0e6",
	purple: "#800080",
	purple2: "#7f007f",
	purple3: "#a020f0",
	rebeccapurple: "#663399",
	red: "#ff0000",
	rosybrown: "#bc8f8f",
	royalblue: "#4169e1",
	saddlebrown: "#8b4513",
	salmon: "#fa8072",
	sandybrown: "#f4a460",
	seagreen: "#2e8b57",
	seashell: "#fff5ee",
	sienna: "#a0522d",
	silver: "#c0c0c0",
	skyblue: "#87ceeb",
	slateblue: "#6a5acd",
	slategray: "#708090",
	slategrey: "#708090",
	snow: "#fffafa",
	springgreen: "#00ff7f",
	steelblue: "#4682b4",
	tan: "#d2b48c",
	teal: "#008080",
	thistle: "#d8bfd8",
	tomato: "#ff6347",
	turquoise: "#40e0d0",
	violet: "#ee82ee",
	wheat: "#f5deb3",
	white: "#ffffff",
	whitesmoke: "#f5f5f5",
	yellow: "#ffff00",
	yellowgreen: "#9acd32",
}

Color.prototype.name = function () {
	const hex = rgb2hex(this._rgb, "rgb")
	for (let n of Object.keys(w3cx11)) {
		if (w3cx11[n] === hex) return n.toLowerCase()
	}
	return hex
}

input.format.named = (name) => {
	name = name.toLowerCase()
	if (w3cx11[name]) return hex2rgb(w3cx11[name])
	throw new Error("unknown color name: " + name)
}

input.autodetect.push({
	p: 5,
	test: (h, ...rest) => {
		if (!rest.length && type(h) === "string" && w3cx11[h.toLowerCase()]) {
			return "named"
		}
	},
})

const num2rgb = (num) => {
	if (type(num) == "number" && num >= 0 && num <= 0xffffff) {
		const r = num >> 16
		const g = (num >> 8) & 0xff
		const b = num & 0xff
		return [r, g, b, 1]
	}
	throw new Error("unknown num color: " + num)
}

const rgb2num = (...args) => {
	const [r, g, b] = unpack(args, "rgb")
	return (r << 16) + (g << 8) + b
}

Color.prototype.num = function () {
	return rgb2num(this._rgb)
}

chroma.num = (...args) => new Color(...args, "num")

input.format.num = num2rgb

input.autodetect.push({
	p: 5,
	test: (...args) => {
		if (args.length === 1 && type(args[0]) === "number" && args[0] >= 0 && args[0] <= 0xffffff) {
			return "num"
		}
	},
})

const { round: round$2 } = Math

Color.prototype.rgb = function (rnd = true) {
	if (rnd === false) return this._rgb.slice(0, 3)
	return this._rgb.slice(0, 3).map(round$2)
}

Color.prototype.rgba = function (rnd = true) {
	return this._rgb.slice(0, 4).map((v, i) => {
		return i < 3 ? (rnd === false ? v : round$2(v)) : v
	})
}

chroma.rgb = (...args) => new Color(...args, "rgb")

input.format.rgb = (...args) => {
	const rgba = unpack(args, "rgba")
	if (rgba[3] === undefined) rgba[3] = 1
	return rgba
}

input.autodetect.push({
	p: 3,
	test: (...args) => {
		args = unpack(args, "rgba")
		if (
			type(args) === "array" &&
			(args.length === 3 ||
				(args.length === 4 && type(args[3]) == "number" && args[3] >= 0 && args[3] <= 1))
		) {
			return "rgb"
		}
	},
})

/*
 * Based on implementation by Neil Bartlett
 * https://github.com/neilbartlett/color-temperature
 */

const { log: log$1 } = Math

const temperature2rgb = (kelvin) => {
	const temp = kelvin / 100
	let r, g, b
	if (temp < 66) {
		r = 255
		g =
			temp < 6
				? 0
				: -155.25485562709179 - 0.44596950469579133 * (g = temp - 2) + 104.49216199393888 * log$1(g)
		b =
			temp < 20
				? 0
				: -254.76935184120902 + 0.8274096064007395 * (b = temp - 10) + 115.67994401066147 * log$1(b)
	} else {
		r = 351.97690566805693 + 0.114206453784165 * (r = temp - 55) - 40.25366309332127 * log$1(r)
		g = 325.4494125711974 + 0.07943456536662342 * (g = temp - 50) - 28.0852963507957 * log$1(g)
		b = 255
	}
	return [r, g, b, 1]
}

/*
 * Based on implementation by Neil Bartlett
 * https://github.com/neilbartlett/color-temperature
 **/

const { round: round$1 } = Math

const rgb2temperature = (...args) => {
	const rgb = unpack(args, "rgb")
	const r = rgb[0],
		b = rgb[2]
	let minTemp = 1000
	let maxTemp = 40000
	const eps = 0.4
	let temp
	while (maxTemp - minTemp > eps) {
		temp = (maxTemp + minTemp) * 0.5
		const rgb = temperature2rgb(temp)
		if (rgb[2] / rgb[0] >= b / r) {
			maxTemp = temp
		} else {
			minTemp = temp
		}
	}
	return round$1(temp)
}

Color.prototype.temp =
	Color.prototype.kelvin =
	Color.prototype.temperature =
		function () {
			return rgb2temperature(this._rgb)
		}

chroma.temp = chroma.kelvin = chroma.temperature = (...args) => new Color(...args, "temp")

input.format.temp = input.format.kelvin = input.format.temperature = temperature2rgb

const { pow: pow$8, sign: sign$1 } = Math

/*
 * L* [0..100]
 * a [-100..100]
 * b [-100..100]
 */
const oklab2rgb = (...args) => {
	args = unpack(args, "lab")
	const [L, a, b] = args

	const l = pow$8(L + 0.3963377774 * a + 0.2158037573 * b, 3)
	const m = pow$8(L - 0.1055613458 * a - 0.0638541728 * b, 3)
	const s = pow$8(L - 0.0894841775 * a - 1.291485548 * b, 3)

	return [
		255 * lrgb2rgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		255 * lrgb2rgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		255 * lrgb2rgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
		args.length > 3 ? args[3] : 1,
	]
}

function lrgb2rgb(c) {
	const abs = Math.abs(c)
	if (abs > 0.0031308) {
		return (sign$1(c) || 1) * (1.055 * pow$8(abs, 1 / 2.4) - 0.055)
	}
	return c * 12.92
}

const { cbrt, pow: pow$7, sign } = Math

const rgb2oklab = (...args) => {
	// OKLab color space implementation taken from
	// https://bottosson.github.io/posts/oklab/
	const [r, g, b] = unpack(args, "rgb")
	const [lr, lg, lb] = [rgb2lrgb(r / 255), rgb2lrgb(g / 255), rgb2lrgb(b / 255)]
	const l = cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
	const m = cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
	const s = cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	]
}

function rgb2lrgb(c) {
	const abs = Math.abs(c)
	if (abs < 0.04045) {
		return c / 12.92
	}
	return (sign(c) || 1) * pow$7((abs + 0.055) / 1.055, 2.4)
}

Color.prototype.oklab = function () {
	return rgb2oklab(this._rgb)
}

chroma.oklab = (...args) => new Color(...args, "oklab")

input.format.oklab = oklab2rgb

input.autodetect.push({
	p: 3,
	test: (...args) => {
		args = unpack(args, "oklab")
		if (type(args) === "array" && args.length === 3) {
			return "oklab"
		}
	},
})

const oklch2rgb = (...args) => {
	args = unpack(args, "lch")
	const [l, c, h] = args
	const [L, a, b_] = lch2lab(l, c, h)
	const [r, g, b] = oklab2rgb(L, a, b_)
	return [r, g, b, args.length > 3 ? args[3] : 1]
}

const rgb2oklch = (...args) => {
	const [r, g, b] = unpack(args, "rgb")
	const [l, a, b_] = rgb2oklab(r, g, b)
	return lab2lch(l, a, b_)
}

Color.prototype.oklch = function () {
	return rgb2oklch(this._rgb)
}

chroma.oklch = (...args) => new Color(...args, "oklch")

input.format.oklch = oklch2rgb

input.autodetect.push({
	p: 3,
	test: (...args) => {
		args = unpack(args, "oklch")
		if (type(args) === "array" && args.length === 3) {
			return "oklch"
		}
	},
})

Color.prototype.alpha = function (a, mutate = false) {
	if (a !== undefined && type(a) === "number") {
		if (mutate) {
			this._rgb[3] = a
			return this
		}
		return new Color([this._rgb[0], this._rgb[1], this._rgb[2], a], "rgb")
	}
	return this._rgb[3]
}

Color.prototype.clipped = function () {
	return this._rgb._clipped || false
}

Color.prototype.darken = function (amount = 1) {
	const me = this
	const lab = me.lab()
	lab[0] -= LAB_CONSTANTS.Kn * amount
	return new Color(lab, "lab").alpha(me.alpha(), true)
}

Color.prototype.brighten = function (amount = 1) {
	return this.darken(-amount)
}

Color.prototype.darker = Color.prototype.darken
Color.prototype.brighter = Color.prototype.brighten

Color.prototype.get = function (mc) {
	const [mode, channel] = mc.split(".")
	const src = this[mode]()
	if (channel) {
		const i = mode.indexOf(channel) - (mode.substr(0, 2) === "ok" ? 2 : 0)
		if (i > -1) return src[i]
		throw new Error(`unknown channel ${channel} in mode ${mode}`)
	} else {
		return src
	}
}

const { pow: pow$6 } = Math

const EPS = 1e-7
const MAX_ITER = 20

Color.prototype.luminance = function (lum, mode = "rgb") {
	if (lum !== undefined && type(lum) === "number") {
		if (lum === 0) {
			// return pure black
			return new Color([0, 0, 0, this._rgb[3]], "rgb")
		}
		if (lum === 1) {
			// return pure white
			return new Color([255, 255, 255, this._rgb[3]], "rgb")
		}
		// compute new color using...
		let cur_lum = this.luminance()
		let max_iter = MAX_ITER

		const test = (low, high) => {
			const mid = low.interpolate(high, 0.5, mode)
			const lm = mid.luminance()
			if (Math.abs(lum - lm) < EPS || !max_iter--) {
				// close enough
				return mid
			}
			return lm > lum ? test(low, mid) : test(mid, high)
		}

		const rgb = (
			cur_lum > lum ? test(new Color([0, 0, 0]), this) : test(this, new Color([255, 255, 255]))
		).rgb()
		return new Color([...rgb, this._rgb[3]])
	}
	return rgb2luminance(...this._rgb.slice(0, 3))
}

const rgb2luminance = (r, g, b) => {
	// relative luminance
	// see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
	r = luminance_x(r)
	g = luminance_x(g)
	b = luminance_x(b)
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const luminance_x = (x) => {
	x /= 255
	return x <= 0.03928 ? x / 12.92 : pow$6((x + 0.055) / 1.055, 2.4)
}

var index = {}

var mix = (col1, col2, f = 0.5, ...rest) => {
	let mode = rest[0] || "lrgb"
	if (!index[mode] && !rest.length) {
		// fall back to the first supported mode
		mode = Object.keys(index)[0]
	}
	if (!index[mode]) {
		throw new Error(`interpolation mode ${mode} is not defined`)
	}
	if (type(col1) !== "object") col1 = new Color(col1)
	if (type(col2) !== "object") col2 = new Color(col2)
	return index[mode](col1, col2, f).alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()))
}

Color.prototype.mix = Color.prototype.interpolate = function (col2, f = 0.5, ...rest) {
	return mix(this, col2, f, ...rest)
}

Color.prototype.premultiply = function (mutate = false) {
	const rgb = this._rgb
	const a = rgb[3]
	if (mutate) {
		this._rgb = [rgb[0] * a, rgb[1] * a, rgb[2] * a, a]
		return this
	} else {
		return new Color([rgb[0] * a, rgb[1] * a, rgb[2] * a, a], "rgb")
	}
}

Color.prototype.saturate = function (amount = 1) {
	const me = this
	const lch = me.lch()
	lch[1] += LAB_CONSTANTS.Kn * amount
	if (lch[1] < 0) lch[1] = 0
	return new Color(lch, "lch").alpha(me.alpha(), true)
}

Color.prototype.desaturate = function (amount = 1) {
	return this.saturate(-amount)
}

Color.prototype.set = function (mc, value, mutate = false) {
	const [mode, channel] = mc.split(".")
	const src = this[mode]()
	if (channel) {
		const i = mode.indexOf(channel) - (mode.substr(0, 2) === "ok" ? 2 : 0)
		if (i > -1) {
			if (type(value) == "string") {
				switch (value.charAt(0)) {
					case "+":
						src[i] += +value
						break
					case "-":
						src[i] += +value
						break
					case "*":
						src[i] *= +value.substr(1)
						break
					case "/":
						src[i] /= +value.substr(1)
						break
					default:
						src[i] = +value
				}
			} else if (type(value) === "number") {
				src[i] = value
			} else {
				throw new Error(`unsupported value for Color.set`)
			}
			const out = new Color(src, mode)
			if (mutate) {
				this._rgb = out._rgb
				return this
			}
			return out
		}
		throw new Error(`unknown channel ${channel} in mode ${mode}`)
	} else {
		return src
	}
}

Color.prototype.tint = function (f = 0.5, ...rest) {
	return mix(this, "white", f, ...rest)
}

Color.prototype.shade = function (f = 0.5, ...rest) {
	return mix(this, "black", f, ...rest)
}

const rgb = (col1, col2, f) => {
	const xyz0 = col1._rgb
	const xyz1 = col2._rgb
	return new Color(
		xyz0[0] + f * (xyz1[0] - xyz0[0]),
		xyz0[1] + f * (xyz1[1] - xyz0[1]),
		xyz0[2] + f * (xyz1[2] - xyz0[2]),
		"rgb"
	)
}

// register interpolator
index.rgb = rgb

const { sqrt: sqrt$2, pow: pow$5 } = Math

const lrgb = (col1, col2, f) => {
	const [x1, y1, z1] = col1._rgb
	const [x2, y2, z2] = col2._rgb
	return new Color(
		sqrt$2(pow$5(x1, 2) * (1 - f) + pow$5(x2, 2) * f),
		sqrt$2(pow$5(y1, 2) * (1 - f) + pow$5(y2, 2) * f),
		sqrt$2(pow$5(z1, 2) * (1 - f) + pow$5(z2, 2) * f),
		"rgb"
	)
}

// register interpolator
index.lrgb = lrgb

const lab = (col1, col2, f) => {
	const xyz0 = col1.lab()
	const xyz1 = col2.lab()
	return new Color(
		xyz0[0] + f * (xyz1[0] - xyz0[0]),
		xyz0[1] + f * (xyz1[1] - xyz0[1]),
		xyz0[2] + f * (xyz1[2] - xyz0[2]),
		"lab"
	)
}

// register interpolator
index.lab = lab

var interpolate_hsx = (col1, col2, f, m) => {
	let xyz0, xyz1
	if (m === "hsl") {
		xyz0 = col1.hsl()
		xyz1 = col2.hsl()
	} else if (m === "hsv") {
		xyz0 = col1.hsv()
		xyz1 = col2.hsv()
	} else if (m === "hcg") {
		xyz0 = col1.hcg()
		xyz1 = col2.hcg()
	} else if (m === "hsi") {
		xyz0 = col1.hsi()
		xyz1 = col2.hsi()
	} else if (m === "lch" || m === "hcl") {
		m = "hcl"
		xyz0 = col1.hcl()
		xyz1 = col2.hcl()
	} else if (m === "oklch") {
		xyz0 = col1.oklch().reverse()
		xyz1 = col2.oklch().reverse()
	}

	let hue0, hue1, sat0, sat1, lbv0, lbv1
	if (m.substr(0, 1) === "h" || m === "oklch") {
		;[hue0, sat0, lbv0] = xyz0
		;[hue1, sat1, lbv1] = xyz1
	}

	let sat, hue, lbv, dh

	if (!isNaN(hue0) && !isNaN(hue1)) {
		// both colors have hue
		if (hue1 > hue0 && hue1 - hue0 > 180) {
			dh = hue1 - (hue0 + 360)
		} else if (hue1 < hue0 && hue0 - hue1 > 180) {
			dh = hue1 + 360 - hue0
		} else {
			dh = hue1 - hue0
		}
		hue = hue0 + f * dh
	} else if (!isNaN(hue0)) {
		hue = hue0
		if ((lbv1 == 1 || lbv1 == 0) && m != "hsv") sat = sat0
	} else if (!isNaN(hue1)) {
		hue = hue1
		if ((lbv0 == 1 || lbv0 == 0) && m != "hsv") sat = sat1
	} else {
		hue = Number.NaN
	}

	if (sat === undefined) sat = sat0 + f * (sat1 - sat0)
	lbv = lbv0 + f * (lbv1 - lbv0)
	return m === "oklch" ? new Color([lbv, sat, hue], m) : new Color([hue, sat, lbv], m)
}

const lch = (col1, col2, f) => {
	return interpolate_hsx(col1, col2, f, "lch")
}

// register interpolator
index.lch = lch
index.hcl = lch

const num = (col1, col2, f) => {
	const c1 = col1.num()
	const c2 = col2.num()
	return new Color(c1 + f * (c2 - c1), "num")
}

// register interpolator
index.num = num

const hcg = (col1, col2, f) => {
	return interpolate_hsx(col1, col2, f, "hcg")
}

// register interpolator
index.hcg = hcg

const hsi = (col1, col2, f) => {
	return interpolate_hsx(col1, col2, f, "hsi")
}

// register interpolator
index.hsi = hsi

const hsl = (col1, col2, f) => {
	return interpolate_hsx(col1, col2, f, "hsl")
}

// register interpolator
index.hsl = hsl

const hsv = (col1, col2, f) => {
	return interpolate_hsx(col1, col2, f, "hsv")
}

// register interpolator
index.hsv = hsv

const oklab = (col1, col2, f) => {
	const xyz0 = col1.oklab()
	const xyz1 = col2.oklab()
	return new Color(
		xyz0[0] + f * (xyz1[0] - xyz0[0]),
		xyz0[1] + f * (xyz1[1] - xyz0[1]),
		xyz0[2] + f * (xyz1[2] - xyz0[2]),
		"oklab"
	)
}

// register interpolator
index.oklab = oklab

const oklch = (col1, col2, f) => {
	return interpolate_hsx(col1, col2, f, "oklch")
}

// register interpolator
index.oklch = oklch

const { pow: pow$4, sqrt: sqrt$1, PI: PI$1, cos: cos$2, sin: sin$2, atan2: atan2$1 } = Math

var average = (colors, mode = "lrgb", weights = null) => {
	const l = colors.length
	if (!weights) weights = Array.from(new Array(l)).map(() => 1)
	// normalize weights
	const k =
		l /
		weights.reduce(function (a, b) {
			return a + b
		})
	weights.forEach((w, i) => {
		weights[i] *= k
	})
	// convert colors to Color objects
	colors = colors.map((c) => new Color(c))
	if (mode === "lrgb") {
		return _average_lrgb(colors, weights)
	}
	const first = colors.shift()
	const xyz = first.get(mode)
	const cnt = []
	let dx = 0
	let dy = 0
	// initial color
	for (let i = 0; i < xyz.length; i++) {
		xyz[i] = (xyz[i] || 0) * weights[0]
		cnt.push(isNaN(xyz[i]) ? 0 : weights[0])
		if (mode.charAt(i) === "h" && !isNaN(xyz[i])) {
			const A = (xyz[i] / 180) * PI$1
			dx += cos$2(A) * weights[0]
			dy += sin$2(A) * weights[0]
		}
	}

	let alpha = first.alpha() * weights[0]
	colors.forEach((c, ci) => {
		const xyz2 = c.get(mode)
		alpha += c.alpha() * weights[ci + 1]
		for (let i = 0; i < xyz.length; i++) {
			if (!isNaN(xyz2[i])) {
				cnt[i] += weights[ci + 1]
				if (mode.charAt(i) === "h") {
					const A = (xyz2[i] / 180) * PI$1
					dx += cos$2(A) * weights[ci + 1]
					dy += sin$2(A) * weights[ci + 1]
				} else {
					xyz[i] += xyz2[i] * weights[ci + 1]
				}
			}
		}
	})

	for (let i = 0; i < xyz.length; i++) {
		if (mode.charAt(i) === "h") {
			let A = (atan2$1(dy / cnt[i], dx / cnt[i]) / PI$1) * 180
			while (A < 0) A += 360
			while (A >= 360) A -= 360
			xyz[i] = A
		} else {
			xyz[i] = xyz[i] / cnt[i]
		}
	}
	alpha /= l
	return new Color(xyz, mode).alpha(alpha > 0.99999 ? 1 : alpha, true)
}

const _average_lrgb = (colors, weights) => {
	const l = colors.length
	const xyz = [0, 0, 0, 0]
	for (let i = 0; i < colors.length; i++) {
		const col = colors[i]
		const f = weights[i] / l
		const rgb = col._rgb
		xyz[0] += pow$4(rgb[0], 2) * f
		xyz[1] += pow$4(rgb[1], 2) * f
		xyz[2] += pow$4(rgb[2], 2) * f
		xyz[3] += rgb[3] * f
	}
	xyz[0] = sqrt$1(xyz[0])
	xyz[1] = sqrt$1(xyz[1])
	xyz[2] = sqrt$1(xyz[2])
	if (xyz[3] > 0.9999999) xyz[3] = 1
	return new Color(clip_rgb(xyz))
}

// minimal multi-purpose interface

const { pow: pow$3 } = Math

function scale(colors) {
	// constructor
	let _mode = "rgb"
	let _nacol = chroma("#ccc")
	let _spread = 0
	// const _fixed = false;
	let _domain = [0, 1]
	let _pos = []
	let _padding = [0, 0]
	let _classes = false
	let _colors = []
	let _out = false
	let _min = 0
	let _max = 1
	let _correctLightness = false
	let _colorCache = {}
	let _useCache = true
	let _gamma = 1

	// private methods

	const setColors = function (colors) {
		colors = colors || ["#fff", "#000"]
		if (
			colors &&
			type(colors) === "string" &&
			chroma.brewer &&
			chroma.brewer[colors.toLowerCase()]
		) {
			colors = chroma.brewer[colors.toLowerCase()]
		}
		if (type(colors) === "array") {
			// handle single color
			if (colors.length === 1) {
				colors = [colors[0], colors[0]]
			}
			// make a copy of the colors
			colors = colors.slice(0)
			// convert to chroma classes
			for (let c = 0; c < colors.length; c++) {
				colors[c] = chroma(colors[c])
			}
			// auto-fill color position
			_pos.length = 0
			for (let c = 0; c < colors.length; c++) {
				_pos.push(c / (colors.length - 1))
			}
		}
		resetCache()
		return (_colors = colors)
	}

	const getClass = function (value) {
		if (_classes != null) {
			const n = _classes.length - 1
			let i = 0
			while (i < n && value >= _classes[i]) {
				i++
			}
			return i - 1
		}
		return 0
	}

	let tMapLightness = (t) => t
	let tMapDomain = (t) => t

	// const classifyValue = function(value) {
	//     let val = value;
	//     if (_classes.length > 2) {
	//         const n = _classes.length-1;
	//         const i = getClass(value);
	//         const minc = _classes[0] + ((_classes[1]-_classes[0]) * (0 + (_spread * 0.5)));  // center of 1st class
	//         const maxc = _classes[n-1] + ((_classes[n]-_classes[n-1]) * (1 - (_spread * 0.5)));  // center of last class
	//         val = _min + ((((_classes[i] + ((_classes[i+1] - _classes[i]) * 0.5)) - minc) / (maxc-minc)) * (_max - _min));
	//     }
	//     return val;
	// };

	const getColor = function (val, bypassMap) {
		let col, t
		if (bypassMap == null) {
			bypassMap = false
		}
		if (isNaN(val) || val === null) {
			return _nacol
		}
		if (!bypassMap) {
			if (_classes && _classes.length > 2) {
				// find the class
				const c = getClass(val)
				t = c / (_classes.length - 2)
			} else if (_max !== _min) {
				// just interpolate between min/max
				t = (val - _min) / (_max - _min)
			} else {
				t = 1
			}
		} else {
			t = val
		}

		// domain map
		t = tMapDomain(t)

		if (!bypassMap) {
			t = tMapLightness(t) // lightness correction
		}

		if (_gamma !== 1) {
			t = pow$3(t, _gamma)
		}

		t = _padding[0] + t * (1 - _padding[0] - _padding[1])

		t = limit(t, 0, 1)

		const k = Math.floor(t * 10000)

		if (_useCache && _colorCache[k]) {
			col = _colorCache[k]
		} else {
			if (type(_colors) === "array") {
				//for i in [0.._pos.length-1]
				for (let i = 0; i < _pos.length; i++) {
					const p = _pos[i]
					if (t <= p) {
						col = _colors[i]
						break
					}
					if (t >= p && i === _pos.length - 1) {
						col = _colors[i]
						break
					}
					if (t > p && t < _pos[i + 1]) {
						t = (t - p) / (_pos[i + 1] - p)
						col = chroma.interpolate(_colors[i], _colors[i + 1], t, _mode)
						break
					}
				}
			} else if (type(_colors) === "function") {
				col = _colors(t)
			}
			if (_useCache) {
				_colorCache[k] = col
			}
		}
		return col
	}

	var resetCache = () => (_colorCache = {})

	setColors(colors)

	// public interface

	const f = function (v) {
		const c = chroma(getColor(v))
		if (_out && c[_out]) {
			return c[_out]()
		} else {
			return c
		}
	}

	f.classes = function (classes) {
		if (classes != null) {
			if (type(classes) === "array") {
				_classes = classes
				_domain = [classes[0], classes[classes.length - 1]]
			} else {
				const d = chroma.analyze(_domain)
				if (classes === 0) {
					_classes = [d.min, d.max]
				} else {
					_classes = chroma.limits(d, "e", classes)
				}
			}
			return f
		}
		return _classes
	}

	f.domain = function (domain) {
		if (!arguments.length) {
			return _domain
		}
		_min = domain[0]
		_max = domain[domain.length - 1]
		_pos = []
		const k = _colors.length
		if (domain.length === k && _min !== _max) {
			// update positions
			for (let d of Array.from(domain)) {
				_pos.push((d - _min) / (_max - _min))
			}
		} else {
			for (let c = 0; c < k; c++) {
				_pos.push(c / (k - 1))
			}
			if (domain.length > 2) {
				// set domain map
				const tOut = domain.map((d, i) => i / (domain.length - 1))
				const tBreaks = domain.map((d) => (d - _min) / (_max - _min))
				if (!tBreaks.every((val, i) => tOut[i] === val)) {
					tMapDomain = (t) => {
						if (t <= 0 || t >= 1) return t
						let i = 0
						while (t >= tBreaks[i + 1]) i++
						const f = (t - tBreaks[i]) / (tBreaks[i + 1] - tBreaks[i])
						const out = tOut[i] + f * (tOut[i + 1] - tOut[i])
						return out
					}
				}
			}
		}
		_domain = [_min, _max]
		return f
	}

	f.mode = function (_m) {
		if (!arguments.length) {
			return _mode
		}
		_mode = _m
		resetCache()
		return f
	}

	f.range = function (colors, _pos) {
		setColors(colors)
		return f
	}

	f.out = function (_o) {
		_out = _o
		return f
	}

	f.spread = function (val) {
		if (!arguments.length) {
			return _spread
		}
		_spread = val
		return f
	}

	f.correctLightness = function (v) {
		if (v == null) {
			v = true
		}
		_correctLightness = v
		resetCache()
		if (_correctLightness) {
			tMapLightness = function (t) {
				const L0 = getColor(0, true).lab()[0]
				const L1 = getColor(1, true).lab()[0]
				const pol = L0 > L1
				let L_actual = getColor(t, true).lab()[0]
				const L_ideal = L0 + (L1 - L0) * t
				let L_diff = L_actual - L_ideal
				let t0 = 0
				let t1 = 1
				let max_iter = 20
				while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
					;(function () {
						if (pol) {
							L_diff *= -1
						}
						if (L_diff < 0) {
							t0 = t
							t += (t1 - t) * 0.5
						} else {
							t1 = t
							t += (t0 - t) * 0.5
						}
						L_actual = getColor(t, true).lab()[0]
						return (L_diff = L_actual - L_ideal)
					})()
				}
				return t
			}
		} else {
			tMapLightness = (t) => t
		}
		return f
	}

	f.padding = function (p) {
		if (p != null) {
			if (type(p) === "number") {
				p = [p, p]
			}
			_padding = p
			return f
		} else {
			return _padding
		}
	}

	f.colors = function (numColors, out) {
		// If no arguments are given, return the original colors that were provided
		if (arguments.length < 2) {
			out = "hex"
		}
		let result = []

		if (arguments.length === 0) {
			result = _colors.slice(0)
		} else if (numColors === 1) {
			result = [f(0.5)]
		} else if (numColors > 1) {
			const dm = _domain[0]
			const dd = _domain[1] - dm
			result = __range__(0, numColors, false).map((i) => f(dm + (i / (numColors - 1)) * dd))
		} else {
			// returns all colors based on the defined classes
			colors = []
			let samples = []
			if (_classes && _classes.length > 2) {
				for (
					let i = 1, end = _classes.length, asc = 1 <= end;
					asc ? i < end : i > end;
					asc ? i++ : i--
				) {
					samples.push((_classes[i - 1] + _classes[i]) * 0.5)
				}
			} else {
				samples = _domain
			}
			result = samples.map((v) => f(v))
		}

		if (chroma[out]) {
			result = result.map((c) => c[out]())
		}
		return result
	}

	f.cache = function (c) {
		if (c != null) {
			_useCache = c
			return f
		} else {
			return _useCache
		}
	}

	f.gamma = function (g) {
		if (g != null) {
			_gamma = g
			return f
		} else {
			return _gamma
		}
	}

	f.nodata = function (d) {
		if (d != null) {
			_nacol = chroma(d)
			return f
		} else {
			return _nacol
		}
	}

	return f
}

function __range__(left, right, inclusive) {
	let range = []
	let ascending = left < right
	let end = !inclusive ? right : ascending ? right + 1 : right - 1
	for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
		range.push(i)
	}
	return range
}

//
// interpolates between a set of colors uzing a bezier spline
//

// nth row of the pascal triangle
const binom_row = function (n) {
	let row = [1, 1]
	for (let i = 1; i < n; i++) {
		let newrow = [1]
		for (let j = 1; j <= row.length; j++) {
			newrow[j] = (row[j] || 0) + row[j - 1]
		}
		row = newrow
	}
	return row
}

const bezier = function (colors) {
	let I, lab0, lab1, lab2
	colors = colors.map((c) => new Color(c))
	if (colors.length === 2) {
		// linear interpolation
		;[lab0, lab1] = colors.map((c) => c.lab())
		I = function (t) {
			const lab = [0, 1, 2].map((i) => lab0[i] + t * (lab1[i] - lab0[i]))
			return new Color(lab, "lab")
		}
	} else if (colors.length === 3) {
		// quadratic bezier interpolation
		;[lab0, lab1, lab2] = colors.map((c) => c.lab())
		I = function (t) {
			const lab = [0, 1, 2].map(
				(i) => (1 - t) * (1 - t) * lab0[i] + 2 * (1 - t) * t * lab1[i] + t * t * lab2[i]
			)
			return new Color(lab, "lab")
		}
	} else if (colors.length === 4) {
		// cubic bezier interpolation
		let lab3
		;[lab0, lab1, lab2, lab3] = colors.map((c) => c.lab())
		I = function (t) {
			const lab = [0, 1, 2].map(
				(i) =>
					(1 - t) * (1 - t) * (1 - t) * lab0[i] +
					3 * (1 - t) * (1 - t) * t * lab1[i] +
					3 * (1 - t) * t * t * lab2[i] +
					t * t * t * lab3[i]
			)
			return new Color(lab, "lab")
		}
	} else if (colors.length >= 5) {
		// general case (degree n bezier)
		let labs, row, n
		labs = colors.map((c) => c.lab())
		n = colors.length - 1
		row = binom_row(n)
		I = function (t) {
			const u = 1 - t
			const lab = [0, 1, 2].map((i) =>
				labs.reduce((sum, el, j) => sum + row[j] * u ** (n - j) * t ** j * el[i], 0)
			)
			return new Color(lab, "lab")
		}
	} else {
		throw new RangeError("No point in running bezier with only one color.")
	}
	return I
}

var bezier$1 = (colors) => {
	const f = bezier(colors)
	f.scale = () => scale(f)
	return f
}

/*
 * interpolates between a set of colors uzing a bezier spline
 * blend mode formulas taken from https://web.archive.org/web/20180110014946/http://www.venture-ware.com/kevin/coding/lets-learn-math-photoshop-blend-modes/
 */

const blend = (bottom, top, mode) => {
	if (!blend[mode]) {
		throw new Error("unknown blend mode " + mode)
	}
	return blend[mode](bottom, top)
}

const blend_f = (f) => (bottom, top) => {
	const c0 = chroma(top).rgb()
	const c1 = chroma(bottom).rgb()
	return chroma.rgb(f(c0, c1))
}

const each = (f) => (c0, c1) => {
	const out = []
	out[0] = f(c0[0], c1[0])
	out[1] = f(c0[1], c1[1])
	out[2] = f(c0[2], c1[2])
	return out
}

const normal = (a) => a
const multiply = (a, b) => (a * b) / 255
const darken = (a, b) => (a > b ? b : a)
const lighten = (a, b) => (a > b ? a : b)
const screen = (a, b) => 255 * (1 - (1 - a / 255) * (1 - b / 255))
const overlay = (a, b) =>
	b < 128 ? (2 * a * b) / 255 : 255 * (1 - 2 * (1 - a / 255) * (1 - b / 255))
const burn = (a, b) => 255 * (1 - (1 - b / 255) / (a / 255))
const dodge = (a, b) => {
	if (a === 255) return 255
	a = (255 * (b / 255)) / (1 - a / 255)
	return a > 255 ? 255 : a
}

// # add = (a,b) ->
// #     if (a + b > 255) then 255 else a + b

blend.normal = blend_f(each(normal))
blend.multiply = blend_f(each(multiply))
blend.screen = blend_f(each(screen))
blend.overlay = blend_f(each(overlay))
blend.darken = blend_f(each(darken))
blend.lighten = blend_f(each(lighten))
blend.dodge = blend_f(each(dodge))
blend.burn = blend_f(each(burn))

// cubehelix interpolation
// based on D.A. Green "A colour scheme for the display of astronomical intensity images"
// http://astron-soc.in/bulletin/11June/289392011.pdf
const { pow: pow$2, sin: sin$1, cos: cos$1 } = Math

function cubehelix(start = 300, rotations = -1.5, hue = 1, gamma = 1, lightness = [0, 1]) {
	let dh = 0,
		dl
	if (type(lightness) === "array") {
		dl = lightness[1] - lightness[0]
	} else {
		dl = 0
		lightness = [lightness, lightness]
	}
	const f = function (fract) {
		const a = TWOPI * ((start + 120) / 360 + rotations * fract)
		const l = pow$2(lightness[0] + dl * fract, gamma)
		const h = dh !== 0 ? hue[0] + fract * dh : hue
		const amp = (h * l * (1 - l)) / 2
		const cos_a = cos$1(a)
		const sin_a = sin$1(a)
		const r = l + amp * (-0.14861 * cos_a + 1.78277 * sin_a)
		const g = l + amp * (-0.29227 * cos_a - 0.90649 * sin_a)
		const b = l + amp * (+1.97294 * cos_a)
		return chroma(clip_rgb([r * 255, g * 255, b * 255, 1]))
	}
	f.start = function (s) {
		if (s == null) {
			return start
		}
		start = s
		return f
	}
	f.rotations = function (r) {
		if (r == null) {
			return rotations
		}
		rotations = r
		return f
	}
	f.gamma = function (g) {
		if (g == null) {
			return gamma
		}
		gamma = g
		return f
	}
	f.hue = function (h) {
		if (h == null) {
			return hue
		}
		hue = h
		if (type(hue) === "array") {
			dh = hue[1] - hue[0]
			if (dh === 0) {
				hue = hue[1]
			}
		} else {
			dh = 0
		}
		return f
	}
	f.lightness = function (h) {
		if (h == null) {
			return lightness
		}
		if (type(h) === "array") {
			lightness = h
			dl = h[1] - h[0]
		} else {
			lightness = [h, h]
			dl = 0
		}
		return f
	}
	f.scale = () => chroma.scale(f)
	f.hue(hue)
	return f
}

const digits = "0123456789abcdef"

const { floor: floor$2, random } = Math

var random$1 = () => {
	let code = "#"
	for (let i = 0; i < 6; i++) {
		code += digits.charAt(floor$2(random() * 16))
	}
	return new Color(code, "hex")
}

const { log, pow: pow$1, floor: floor$1, abs: abs$1 } = Math

function analyze(data, key = null) {
	const r = {
		min: Number.MAX_VALUE,
		max: Number.MAX_VALUE * -1,
		sum: 0,
		values: [],
		count: 0,
	}
	if (type(data) === "object") {
		data = Object.values(data)
	}
	data.forEach((val) => {
		if (key && type(val) === "object") val = val[key]
		if (val !== undefined && val !== null && !isNaN(val)) {
			r.values.push(val)
			r.sum += val
			if (val < r.min) r.min = val
			if (val > r.max) r.max = val
			r.count += 1
		}
	})

	r.domain = [r.min, r.max]

	r.limits = (mode, num) => limits(r, mode, num)

	return r
}

function limits(data, mode = "equal", num = 7) {
	if (type(data) == "array") {
		data = analyze(data)
	}
	const { min, max } = data
	const values = data.values.sort((a, b) => a - b)

	if (num === 1) {
		return [min, max]
	}

	const limits = []

	if (mode.substr(0, 1) === "c") {
		// continuous
		limits.push(min)
		limits.push(max)
	}

	if (mode.substr(0, 1) === "e") {
		// equal interval
		limits.push(min)
		for (let i = 1; i < num; i++) {
			limits.push(min + (i / num) * (max - min))
		}
		limits.push(max)
	} else if (mode.substr(0, 1) === "l") {
		// log scale
		if (min <= 0) {
			throw new Error("Logarithmic scales are only possible for values > 0")
		}
		const min_log = Math.LOG10E * log(min)
		const max_log = Math.LOG10E * log(max)
		limits.push(min)
		for (let i = 1; i < num; i++) {
			limits.push(pow$1(10, min_log + (i / num) * (max_log - min_log)))
		}
		limits.push(max)
	} else if (mode.substr(0, 1) === "q") {
		// quantile scale
		limits.push(min)
		for (let i = 1; i < num; i++) {
			const p = ((values.length - 1) * i) / num
			const pb = floor$1(p)
			if (pb === p) {
				limits.push(values[pb])
			} else {
				// p > pb
				const pr = p - pb
				limits.push(values[pb] * (1 - pr) + values[pb + 1] * pr)
			}
		}
		limits.push(max)
	} else if (mode.substr(0, 1) === "k") {
		// k-means clustering
		/*
        implementation based on
        http://code.google.com/p/figue/source/browse/trunk/figue.js#336
        simplified for 1-d input values
        */
		let cluster
		const n = values.length
		const assignments = new Array(n)
		const clusterSizes = new Array(num)
		let repeat = true
		let nb_iters = 0
		let centroids = null

		// get seed values
		centroids = []
		centroids.push(min)
		for (let i = 1; i < num; i++) {
			centroids.push(min + (i / num) * (max - min))
		}
		centroids.push(max)

		while (repeat) {
			// assignment step
			for (let j = 0; j < num; j++) {
				clusterSizes[j] = 0
			}
			for (let i = 0; i < n; i++) {
				const value = values[i]
				let mindist = Number.MAX_VALUE
				let best
				for (let j = 0; j < num; j++) {
					const dist = abs$1(centroids[j] - value)
					if (dist < mindist) {
						mindist = dist
						best = j
					}
					clusterSizes[best]++
					assignments[i] = best
				}
			}

			// update centroids step
			const newCentroids = new Array(num)
			for (let j = 0; j < num; j++) {
				newCentroids[j] = null
			}
			for (let i = 0; i < n; i++) {
				cluster = assignments[i]
				if (newCentroids[cluster] === null) {
					newCentroids[cluster] = values[i]
				} else {
					newCentroids[cluster] += values[i]
				}
			}
			for (let j = 0; j < num; j++) {
				newCentroids[j] *= 1 / clusterSizes[j]
			}

			// check convergence
			repeat = false
			for (let j = 0; j < num; j++) {
				if (newCentroids[j] !== centroids[j]) {
					repeat = true
					break
				}
			}

			centroids = newCentroids
			nb_iters++

			if (nb_iters > 200) {
				repeat = false
			}
		}

		// finished k-means clustering
		// the next part is borrowed from gabrielflor.it
		const kClusters = {}
		for (let j = 0; j < num; j++) {
			kClusters[j] = []
		}
		for (let i = 0; i < n; i++) {
			cluster = assignments[i]
			kClusters[cluster].push(values[i])
		}
		let tmpKMeansBreaks = []
		for (let j = 0; j < num; j++) {
			tmpKMeansBreaks.push(kClusters[j][0])
			tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1])
		}
		tmpKMeansBreaks = tmpKMeansBreaks.sort((a, b) => a - b)
		limits.push(tmpKMeansBreaks[0])
		for (let i = 1; i < tmpKMeansBreaks.length; i += 2) {
			const v = tmpKMeansBreaks[i]
			if (!isNaN(v) && limits.indexOf(v) === -1) {
				limits.push(v)
			}
		}
	}
	return limits
}

var contrast = (a, b) => {
	// WCAG contrast ratio
	// see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
	a = new Color(a)
	b = new Color(b)
	const l1 = a.luminance()
	const l2 = b.luminance()
	return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05)
}

const { sqrt, pow, min: min$1, max: max$1, atan2, abs, cos, sin, exp, PI } = Math

function deltaE(a, b, Kl = 1, Kc = 1, Kh = 1) {
	// Delta E (CIE 2000)
	// see http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
	var rad2deg = function (rad) {
		return (360 * rad) / (2 * PI)
	}
	var deg2rad = function (deg) {
		return (2 * PI * deg) / 360
	}
	a = new Color(a)
	b = new Color(b)
	const [L1, a1, b1] = Array.from(a.lab())
	const [L2, a2, b2] = Array.from(b.lab())
	const avgL = (L1 + L2) / 2
	const C1 = sqrt(pow(a1, 2) + pow(b1, 2))
	const C2 = sqrt(pow(a2, 2) + pow(b2, 2))
	const avgC = (C1 + C2) / 2
	const G = 0.5 * (1 - sqrt(pow(avgC, 7) / (pow(avgC, 7) + pow(25, 7))))
	const a1p = a1 * (1 + G)
	const a2p = a2 * (1 + G)
	const C1p = sqrt(pow(a1p, 2) + pow(b1, 2))
	const C2p = sqrt(pow(a2p, 2) + pow(b2, 2))
	const avgCp = (C1p + C2p) / 2
	const arctan1 = rad2deg(atan2(b1, a1p))
	const arctan2 = rad2deg(atan2(b2, a2p))
	const h1p = arctan1 >= 0 ? arctan1 : arctan1 + 360
	const h2p = arctan2 >= 0 ? arctan2 : arctan2 + 360
	const avgHp = abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2
	const T =
		1 -
		0.17 * cos(deg2rad(avgHp - 30)) +
		0.24 * cos(deg2rad(2 * avgHp)) +
		0.32 * cos(deg2rad(3 * avgHp + 6)) -
		0.2 * cos(deg2rad(4 * avgHp - 63))
	let deltaHp = h2p - h1p
	deltaHp = abs(deltaHp) <= 180 ? deltaHp : h2p <= h1p ? deltaHp + 360 : deltaHp - 360
	deltaHp = 2 * sqrt(C1p * C2p) * sin(deg2rad(deltaHp) / 2)
	const deltaL = L2 - L1
	const deltaCp = C2p - C1p
	const sl = 1 + (0.015 * pow(avgL - 50, 2)) / sqrt(20 + pow(avgL - 50, 2))
	const sc = 1 + 0.045 * avgCp
	const sh = 1 + 0.015 * avgCp * T
	const deltaTheta = 30 * exp(-pow((avgHp - 275) / 25, 2))
	const Rc = 2 * sqrt(pow(avgCp, 7) / (pow(avgCp, 7) + pow(25, 7)))
	const Rt = -Rc * sin(2 * deg2rad(deltaTheta))
	const result = sqrt(
		pow(deltaL / (Kl * sl), 2) +
			pow(deltaCp / (Kc * sc), 2) +
			pow(deltaHp / (Kh * sh), 2) +
			Rt * (deltaCp / (Kc * sc)) * (deltaHp / (Kh * sh))
	)
	return max$1(0, min$1(100, result))
}

// simple Euclidean distance
function distance(a, b, mode = "lab") {
	// Delta E (CIE 1976)
	// see http://www.brucelindbloom.com/index.html?Equations.html
	a = new Color(a)
	b = new Color(b)
	const l1 = a.get(mode)
	const l2 = b.get(mode)
	let sum_sq = 0
	for (let i in l1) {
		const d = (l1[i] || 0) - (l2[i] || 0)
		sum_sq += d * d
	}
	return Math.sqrt(sum_sq)
}

var valid = (...args) => {
	try {
		new Color(...args)
		return true
		// eslint-disable-next-line
	} catch (e) {
		return false
	}
}

// some pre-defined color scales:

var scales = {
	cool() {
		return scale([chroma.hsl(180, 1, 0.9), chroma.hsl(250, 0.7, 0.4)])
	},
	hot() {
		return scale(["#000", "#f00", "#ff0", "#fff"]).mode("rgb")
	},
}

/**
    ColorBrewer colors for chroma.js

    Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The
    Pennsylvania State University.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software distributed
    under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
    CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

const colorbrewer = {
	// sequential
	OrRd: [
		"#fff7ec",
		"#fee8c8",
		"#fdd49e",
		"#fdbb84",
		"#fc8d59",
		"#ef6548",
		"#d7301f",
		"#b30000",
		"#7f0000",
	],
	PuBu: [
		"#fff7fb",
		"#ece7f2",
		"#d0d1e6",
		"#a6bddb",
		"#74a9cf",
		"#3690c0",
		"#0570b0",
		"#045a8d",
		"#023858",
	],
	BuPu: [
		"#f7fcfd",
		"#e0ecf4",
		"#bfd3e6",
		"#9ebcda",
		"#8c96c6",
		"#8c6bb1",
		"#88419d",
		"#810f7c",
		"#4d004b",
	],
	Oranges: [
		"#fff5eb",
		"#fee6ce",
		"#fdd0a2",
		"#fdae6b",
		"#fd8d3c",
		"#f16913",
		"#d94801",
		"#a63603",
		"#7f2704",
	],
	BuGn: [
		"#f7fcfd",
		"#e5f5f9",
		"#ccece6",
		"#99d8c9",
		"#66c2a4",
		"#41ae76",
		"#238b45",
		"#006d2c",
		"#00441b",
	],
	YlOrBr: [
		"#ffffe5",
		"#fff7bc",
		"#fee391",
		"#fec44f",
		"#fe9929",
		"#ec7014",
		"#cc4c02",
		"#993404",
		"#662506",
	],
	YlGn: [
		"#ffffe5",
		"#f7fcb9",
		"#d9f0a3",
		"#addd8e",
		"#78c679",
		"#41ab5d",
		"#238443",
		"#006837",
		"#004529",
	],
	Reds: [
		"#fff5f0",
		"#fee0d2",
		"#fcbba1",
		"#fc9272",
		"#fb6a4a",
		"#ef3b2c",
		"#cb181d",
		"#a50f15",
		"#67000d",
	],
	RdPu: [
		"#fff7f3",
		"#fde0dd",
		"#fcc5c0",
		"#fa9fb5",
		"#f768a1",
		"#dd3497",
		"#ae017e",
		"#7a0177",
		"#49006a",
	],
	Greens: [
		"#f7fcf5",
		"#e5f5e0",
		"#c7e9c0",
		"#a1d99b",
		"#74c476",
		"#41ab5d",
		"#238b45",
		"#006d2c",
		"#00441b",
	],
	YlGnBu: [
		"#ffffd9",
		"#edf8b1",
		"#c7e9b4",
		"#7fcdbb",
		"#41b6c4",
		"#1d91c0",
		"#225ea8",
		"#253494",
		"#081d58",
	],
	Purples: [
		"#fcfbfd",
		"#efedf5",
		"#dadaeb",
		"#bcbddc",
		"#9e9ac8",
		"#807dba",
		"#6a51a3",
		"#54278f",
		"#3f007d",
	],
	GnBu: [
		"#f7fcf0",
		"#e0f3db",
		"#ccebc5",
		"#a8ddb5",
		"#7bccc4",
		"#4eb3d3",
		"#2b8cbe",
		"#0868ac",
		"#084081",
	],
	Greys: [
		"#ffffff",
		"#f0f0f0",
		"#d9d9d9",
		"#bdbdbd",
		"#969696",
		"#737373",
		"#525252",
		"#252525",
		"#000000",
	],
	YlOrRd: [
		"#ffffcc",
		"#ffeda0",
		"#fed976",
		"#feb24c",
		"#fd8d3c",
		"#fc4e2a",
		"#e31a1c",
		"#bd0026",
		"#800026",
	],
	PuRd: [
		"#f7f4f9",
		"#e7e1ef",
		"#d4b9da",
		"#c994c7",
		"#df65b0",
		"#e7298a",
		"#ce1256",
		"#980043",
		"#67001f",
	],
	Blues: [
		"#f7fbff",
		"#deebf7",
		"#c6dbef",
		"#9ecae1",
		"#6baed6",
		"#4292c6",
		"#2171b5",
		"#08519c",
		"#08306b",
	],
	PuBuGn: [
		"#fff7fb",
		"#ece2f0",
		"#d0d1e6",
		"#a6bddb",
		"#67a9cf",
		"#3690c0",
		"#02818a",
		"#016c59",
		"#014636",
	],
	Viridis: [
		"#440154",
		"#482777",
		"#3f4a8a",
		"#31678e",
		"#26838f",
		"#1f9d8a",
		"#6cce5a",
		"#b6de2b",
		"#fee825",
	],

	// diverging
	Spectral: [
		"#9e0142",
		"#d53e4f",
		"#f46d43",
		"#fdae61",
		"#fee08b",
		"#ffffbf",
		"#e6f598",
		"#abdda4",
		"#66c2a5",
		"#3288bd",
		"#5e4fa2",
	],
	RdYlGn: [
		"#a50026",
		"#d73027",
		"#f46d43",
		"#fdae61",
		"#fee08b",
		"#ffffbf",
		"#d9ef8b",
		"#a6d96a",
		"#66bd63",
		"#1a9850",
		"#006837",
	],
	RdBu: [
		"#67001f",
		"#b2182b",
		"#d6604d",
		"#f4a582",
		"#fddbc7",
		"#f7f7f7",
		"#d1e5f0",
		"#92c5de",
		"#4393c3",
		"#2166ac",
		"#053061",
	],
	PiYG: [
		"#8e0152",
		"#c51b7d",
		"#de77ae",
		"#f1b6da",
		"#fde0ef",
		"#f7f7f7",
		"#e6f5d0",
		"#b8e186",
		"#7fbc41",
		"#4d9221",
		"#276419",
	],
	PRGn: [
		"#40004b",
		"#762a83",
		"#9970ab",
		"#c2a5cf",
		"#e7d4e8",
		"#f7f7f7",
		"#d9f0d3",
		"#a6dba0",
		"#5aae61",
		"#1b7837",
		"#00441b",
	],
	RdYlBu: [
		"#a50026",
		"#d73027",
		"#f46d43",
		"#fdae61",
		"#fee090",
		"#ffffbf",
		"#e0f3f8",
		"#abd9e9",
		"#74add1",
		"#4575b4",
		"#313695",
	],
	BrBG: [
		"#543005",
		"#8c510a",
		"#bf812d",
		"#dfc27d",
		"#f6e8c3",
		"#f5f5f5",
		"#c7eae5",
		"#80cdc1",
		"#35978f",
		"#01665e",
		"#003c30",
	],
	RdGy: [
		"#67001f",
		"#b2182b",
		"#d6604d",
		"#f4a582",
		"#fddbc7",
		"#ffffff",
		"#e0e0e0",
		"#bababa",
		"#878787",
		"#4d4d4d",
		"#1a1a1a",
	],
	PuOr: [
		"#7f3b08",
		"#b35806",
		"#e08214",
		"#fdb863",
		"#fee0b6",
		"#f7f7f7",
		"#d8daeb",
		"#b2abd2",
		"#8073ac",
		"#542788",
		"#2d004b",
	],

	// qualitative
	Set2: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"],
	Accent: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"],
	Set1: [
		"#e41a1c",
		"#377eb8",
		"#4daf4a",
		"#984ea3",
		"#ff7f00",
		"#ffff33",
		"#a65628",
		"#f781bf",
		"#999999",
	],
	Set3: [
		"#8dd3c7",
		"#ffffb3",
		"#bebada",
		"#fb8072",
		"#80b1d3",
		"#fdb462",
		"#b3de69",
		"#fccde5",
		"#d9d9d9",
		"#bc80bd",
		"#ccebc5",
		"#ffed6f",
	],
	Dark2: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
	Paired: [
		"#a6cee3",
		"#1f78b4",
		"#b2df8a",
		"#33a02c",
		"#fb9a99",
		"#e31a1c",
		"#fdbf6f",
		"#ff7f00",
		"#cab2d6",
		"#6a3d9a",
		"#ffff99",
		"#b15928",
	],
	Pastel2: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc"],
	Pastel1: [
		"#fbb4ae",
		"#b3cde3",
		"#ccebc5",
		"#decbe4",
		"#fed9a6",
		"#ffffcc",
		"#e5d8bd",
		"#fddaec",
		"#f2f2f2",
	],
}

// add lowercase aliases for case-insensitive matches
for (let key of Object.keys(colorbrewer)) {
	colorbrewer[key.toLowerCase()] = colorbrewer[key]
}

Object.assign(chroma, {
	average,
	bezier: bezier$1,
	blend,
	cubehelix,
	mix,
	interpolate: mix,
	random: random$1,
	scale,
	analyze,
	contrast,
	deltaE,
	distance,
	limits,
	valid,
	scales,
	input,
	colors: w3cx11,
	brewer: colorbrewer,
})

const overridePrimitiveColors = () => {
	const inlangSettings = document.querySelector("inlang-settings")
	if (!inlangSettings) return undefined
	const primitives = ["primary", "success", "warning", "danger", "neutral"]
	for (const primitive of primitives) {
		const unformattedColor = window
			.getComputedStyle(inlangSettings)
			.getPropertyValue(`--inlang-color-${primitive}`)
			.trim()
		if (unformattedColor !== "") {
			const colorShades = getPalette(unformattedColor)
			appendCSSProperties(colorShades, primitive, inlangSettings)
		}
	}
}
const appendCSSProperties = (colorShades, primitive, element) => {
	let textContent = Object.entries(colorShades)
		.map(([index, shade]) => `--sl-color-${primitive}-${index}: ${shade} !important;`)
		.join("\n")
	textContent = ":host { " + textContent + " }"
	const shadowRoot = element.shadowRoot || element.attachShadow({ mode: "open" })
	const style = document.createElement("style")
	style.textContent = textContent
	shadowRoot.appendChild(style)
}
const getColor = (unformattedColor) => chroma(unformattedColor)
const getPalette = (unformattedColor) => {
	const color = getColor(unformattedColor)
	const colors = chroma.scale(["white", color, "black"]).domain([0, 0.6, 1]).mode("lrgb")
	const palette = {}
	// Create 50
	palette[50] = colors(0.05).hex()
	// Create 100-900
	for (let i = 0.1; i < 0.9; i += 0.1) {
		palette[Math.round(i * 1000)] = colors(i).hex()
	}
	// Create 950
	palette[950] = colors(0.95).hex()
	return palette
}

var __decorate$b =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
//import { baseStyling } from "../../../styling/base.js"
let FieldHeader = class FieldHeader extends h {
	constructor() {
		super(...arguments)
		this.optional = false
	}
	static {
		this.styles = [
			//baseStyling,
			i$2`
			.header {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			h3 {
				margin: 0;
				font-size: 14px;
				font-weight: 800;
				line-height: 1.5;
			}
			.help-text {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
				margin: 0;
				line-height: 1.5;
			}
			.optinal {
				font-size: 14px;
				font-style: italic;
				font-weight: 500;
				color: var(--sl-input-help-text-color);
			}
			.example-container {
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
			}
			.example {
				background-color: var(--sl-input-background-color-disabled);
				width: fit-content;
				padding: 0px 6px;
				border-radius: 2px;
				font-size: 14px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--sl-input-color-disabled);
				margin: 0;
				line-height: 1.5;
			}
		`,
		]
	}
	render() {
		return ke$1` <div class="header">
			${
				this.fieldTitle &&
				ke$1`<h3 part="property-title">
				${this.fieldTitle}${this.optional ? ke$1`<span class="optinal">${" " + "(optional)"}</span>` : ""}
			</h3>`
			}
			${this.description && ke$1`<p part="property-paragraph" class="help-text">${this.description}</p>`}
			${
				this.examples
					? ke$1`<div class="example-container">
						<p class="help-text">Examples:</p>
						${this.examples.map((example) => ke$1`<p class="example">${example}</p>`)}
				  </div>`
					: ``
			}
		</div>`
	}
}
__decorate$b([n()], FieldHeader.prototype, "fieldTitle", void 0)
__decorate$b([n()], FieldHeader.prototype, "description", void 0)
__decorate$b([n({ type: Array })], FieldHeader.prototype, "examples", void 0)
__decorate$b([n({ type: Boolean })], FieldHeader.prototype, "optional", void 0)
FieldHeader = __decorate$b([t$1("field-header")], FieldHeader)

var __decorate$a =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let StringInput = class StringInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.value = ""
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			h3 {
				margin: 0;
				font-size: 14px;
				font-weight: 800;
			}
			.help-text {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
				margin: 0;
				line-height: 1.5;
			}
			.description-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
		`,
		]
	}
	get _description() {
		return this.schema.description || undefined
	}
	get _examples() {
		return this.schema.examples
	}
	get _title() {
		return this.schema.title || undefined
	}
	render() {
		return ke$1` <div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.description=${this._description}
				.examples=${this._examples}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
			<sl-input
				value=${this.value}
				size="small"
				@input=${(e) => {
					this.handleInlangProjectChange(e.target.value, this.property, this.moduleId)
				}}
			>
			</sl-input>
		</div>`
	}
}
__decorate$a([n()], StringInput.prototype, "property", void 0)
__decorate$a([n()], StringInput.prototype, "moduleId", void 0)
__decorate$a([n()], StringInput.prototype, "value", void 0)
__decorate$a([n()], StringInput.prototype, "schema", void 0)
__decorate$a([n()], StringInput.prototype, "required", void 0)
__decorate$a([n()], StringInput.prototype, "handleInlangProjectChange", void 0)
StringInput = __decorate$a([t$1("string-input")], StringInput)

var __decorate$9 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let DefaultArrayInput = class DefaultArrayInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.value = []
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
		this._inputValue = undefined
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.item-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
				padding-bottom: 8px;
			}
			.disabled-input::part(base) {
				cursor: unset;
				opacity: 1;
			}
			.disabled-input::part(suffix) {
				cursor: pointer;
				opacity: 0.5;
			}
			.disabled-input::part(suffix):hover {
				opacity: 1;
			}
			.add-input {
				flex-grow: 1;
			}
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.new-line-container {
				display: flex;
				gap: 4px;
			}
			.icon-wrapper {
				display: flex;
			}
		`,
		]
	}
	get _description() {
		return this.schema.description || undefined
	}
	get _title() {
		return this.schema.title || undefined
	}
	handleInputChange(e) {
		const inputElement = e.target
		this._inputValue = inputElement.value
	}
	handleAddItemClick() {
		if (this._inputValue && this._inputValue.trim() !== "") {
			this.value ? this.value.push(this._inputValue) : (this.value = [this._inputValue])
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
		}
	}
	handleDeleteItemClick(index) {
		if (this.value) {
			this.value.splice(index, 1)
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
		}
	}
	render() {
		return ke$1`<div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.description=${this._description}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
			${
				this.value && this.value.length > 0
					? ke$1`<div class="item-container">
						${this.value.map((arrayItem, index) => {
							return ke$1`<sl-input
								class="disabled-input"
								size="small"
								value=${arrayItem}
								disabled
								filled
							>
								<div
									slot="suffix"
									class="icon-wrapper"
									@click=${() => {
										this.handleDeleteItemClick(index)
									}}
								>
									<svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
										<path
											xmlns="http://www.w3.org/2000/svg"
											d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
										/>
									</svg>
								</div>
							</sl-input>`
						})}
				  </div>`
					: undefined
			}
			<div class="new-line-container">
				<sl-input
					class="add-input"
					size="small"
					placeholder="Add new item"
					@input=${(e) => this.handleInputChange(e)}
					@keydown=${(e) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputValue}
				>
				</sl-input>
				<sl-button
					exportparts="base:button"
					size="small"
					variant="neutral"
					@click=${() => {
						this.handleAddItemClick()
					}}
				>
					Add
				</sl-button>
			</div>
		</div>`
	}
}
__decorate$9([n()], DefaultArrayInput.prototype, "property", void 0)
__decorate$9([n()], DefaultArrayInput.prototype, "moduleId", void 0)
__decorate$9([n()], DefaultArrayInput.prototype, "value", void 0)
__decorate$9([n()], DefaultArrayInput.prototype, "schema", void 0)
__decorate$9([n()], DefaultArrayInput.prototype, "required", void 0)
__decorate$9([n()], DefaultArrayInput.prototype, "handleInlangProjectChange", void 0)
__decorate$9([r()], DefaultArrayInput.prototype, "_inputValue", void 0)
DefaultArrayInput = __decorate$9([t$1("default-array-input")], DefaultArrayInput)

var __decorate$8 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let LocaleInput = class LocaleInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.value = []
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
		this._inputValue = undefined
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.tags-container {
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
			}
			.disabled-input::part(base) {
				cursor: unset;
				opacity: 1;
			}
			.disabled-input::part(suffix) {
				cursor: pointer;
				opacity: 0.5;
			}
			.disabled-input::part(suffix):hover {
				opacity: 1;
			}
			.add-input {
				flex-grow: 1;
			}
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.new-line-container {
				display: flex;
				gap: 4px;
			}
			sl-tag::part(base) {
				background-color: var(--sl-input-filled-background-color-disabled);
				color: var(--sl-input-color);
				border-color: transparent;
				border-radius: var(--sl-input-border-radius-small);
			}
			sl-tag::part(remove-button) {
				color: var(--sl-input-placeholder-color);
			}
			sl-tag::part(remove-button):hover {
				color: var(--sl-input-color);
			}
		`,
		]
	}
	get _description() {
		return this.schema.description || undefined
	}
	get _title() {
		return this.schema.title || undefined
	}
	handleInputChange(e) {
		const inputElement = e.target
		this._inputValue = inputElement.value
	}
	handleAddItemClick() {
		if (this._inputValue && this._inputValue.trim() !== "") {
			this.value ? this.value.push(this._inputValue) : (this.value = [this._inputValue])
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
		}
	}
	handleDeleteItemClick(index) {
		if (this.value) {
			this.value.splice(index, 1)
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
		}
	}
	render() {
		return ke$1`<div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.description=${this._description}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
			<div class="tags-container">
				${
					this.value &&
					this.value.map((arrayItem, index) => {
						return ke$1`
						<sl-tag
							@sl-remove=${() => {
								this.handleDeleteItemClick(index)
							}}
							removable
							size="small"
							>${arrayItem}</sl-tag
						>
					`
					})
				}
			</div>
			<div class="new-line-container">
				<sl-input
					class="add-input"
					size="small"
					placeholder="Enter locale ..."
					@input=${(e) => this.handleInputChange(e)}
					@keydown=${(e) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputValue}
				>
				</sl-input>
				<sl-button
					exportparts="base:button"
					size="small"
					variant="neutral"
					@click=${() => {
						this.handleAddItemClick()
					}}
				>
					Add
				</sl-button>
			</div>
		</div>`
	}
}
__decorate$8([n()], LocaleInput.prototype, "property", void 0)
__decorate$8([n()], LocaleInput.prototype, "moduleId", void 0)
__decorate$8([n()], LocaleInput.prototype, "value", void 0)
__decorate$8([n()], LocaleInput.prototype, "schema", void 0)
__decorate$8([n()], LocaleInput.prototype, "required", void 0)
__decorate$8([n()], LocaleInput.prototype, "handleInlangProjectChange", void 0)
__decorate$8([r()], LocaleInput.prototype, "_inputValue", void 0)
LocaleInput = __decorate$8([t$1("locale-input")], LocaleInput)

var __decorate$7 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let ReferencePatternInput = class ReferencePatternInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.value = []
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.disabled-input::part(base) {
				cursor: unset;
				opacity: 1;
			}
			.disabled-input::part(suffix) {
				cursor: pointer;
				opacity: 0.5;
			}
			.disabled-input::part(suffix):hover {
				opacity: 1;
			}
			.add-input::part(form-control-label) {
				color: var(--sl-input-help-text-color);
				font-size: 0.8rem;
				padding-left: 0.2rem;
				padding-bottom: 0.2rem;
			}
			.add-input {
				flex-grow: 1;
			}
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.new-line-container {
				display: flex;
				gap: 4px;
			}
			sl-input::part(input) {
				width: inherit;
			}
		`,
		]
	}
	get _description() {
		return this.schema.description || undefined
	}
	get _title() {
		return this.schema.title || undefined
	}
	get _examples() {
		return this.schema.examples
	}
	render() {
		return ke$1`<div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.description=${this._description}
				.examples=${this._examples}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
			<div class="new-line-container">
				<sl-input
					class="add-input"
					size="small"
					label="Opening pattern"
					placeholder="Enter pattern ..."
					value=${this.value ? this.value[0] : ""}
					@input=${(e) => {
						if (this.value === undefined) this.value = []
						this.value[0] = e.target.value
						this.handleInlangProjectChange(this.value, this.property, this.moduleId)
					}}
				>
				</sl-input>
				<sl-input
					class="add-input"
					size="small"
					label="Closing pattern"
					placeholder="Enter pattern ..."
					?disabled=${!this.value}
					value=${this.value ? this.value[1] : ""}
					@input=${(e) => {
						if (this.value === undefined) this.value = []
						this.value[1] = e.target.value
						this.handleInlangProjectChange(this.value, this.property, this.moduleId)
					}}
				>
				</sl-input>
			</div>
		</div>`
	}
}
__decorate$7([n()], ReferencePatternInput.prototype, "property", void 0)
__decorate$7([n()], ReferencePatternInput.prototype, "moduleId", void 0)
__decorate$7([n()], ReferencePatternInput.prototype, "value", void 0)
__decorate$7([n()], ReferencePatternInput.prototype, "schema", void 0)
__decorate$7([n()], ReferencePatternInput.prototype, "required", void 0)
__decorate$7([n()], ReferencePatternInput.prototype, "handleInlangProjectChange", void 0)
ReferencePatternInput = __decorate$7([t$1("reference-pattern-input")], ReferencePatternInput)

var __decorate$6 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let ArrayInput = class ArrayInput extends h {
	constructor() {
		//static override styles = [baseStyling]
		super(...arguments)
		this.property = ""
		this.value = []
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
	}
	render() {
		const schemaPattern = this.schema.items.pattern
		if (
			schemaPattern &&
			schemaPattern ===
				"^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$"
		) {
			return ke$1`
				<locale-input
					exportparts="property, property-title, property-paragraph, button"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
					.required=${this.required}
				></locale-input>
			`
		} else if (this.property === "variableReferencePattern") {
			return ke$1`
				<reference-pattern-input
					exportparts="property, property-title, property-paragraph"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
					.required=${this.required}
				></reference-pattern-input>
			`
		} else {
			return ke$1`
				<default-array-input
					exportparts="property, property-title, property-paragraph, button"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
					.required=${this.required}
				></default-array-input>
			`
		}
	}
}
__decorate$6([n()], ArrayInput.prototype, "property", void 0)
__decorate$6([n()], ArrayInput.prototype, "moduleId", void 0)
__decorate$6([n()], ArrayInput.prototype, "modules", void 0)
__decorate$6([n()], ArrayInput.prototype, "value", void 0)
__decorate$6([n()], ArrayInput.prototype, "schema", void 0)
__decorate$6([n()], ArrayInput.prototype, "required", void 0)
__decorate$6([n()], ArrayInput.prototype, "handleInlangProjectChange", void 0)
ArrayInput = __decorate$6([t$1("array-input")], ArrayInput)

var __decorate$5 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let DefaultObjectInput = class DefaultObjectInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.keyPlaceholder = "Enter key"
		this.valuePlaceholder = "Enter value"
		this.value = {}
		this.schema = {}
		this.withTitle = true
		this.withDescription = true
		this.required = false
		this.handleInlangProjectChange = () => {}
		this._inputValue = undefined
		this._inputKey = undefined
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.disabled-input::part(base) {
				cursor: unset;
				opacity: 1;
			}
			.disabled-input::part(suffix) {
				cursor: pointer;
				opacity: 0.5;
			}
			.disabled-input::part(suffix):hover {
				opacity: 1;
			}
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.add-item-container {
				display: flex;
				align-items: center;
				gap: 4px;
			}
			.add-item-side {
				flex-grow: 1;
			}
			.remove-icon {
				width: 44px;
				display: flex;
				justify-content: flex-start;
				margin-left: 6px;
				cursor: pointer;
				color: var(--sl-input-placeholder-color);
			}
			.remove-icon:hover {
				color: var(--sl-input-color);
			}
			.list-container {
				display: flex;
				flex-direction: column;
				gap: 3px;
				padding-bottom: 8px;
			}
			.icon {
				padding-top: 0.5rem;
			}
			sl-input::part(input) {
				width: inherit;
			}
		`,
		]
	}
	get _description() {
		return this.schema.description || undefined
	}
	get _title() {
		return this.schema.title || undefined
	}
	handleAddItemClick() {
		if (
			this._inputValue &&
			this._inputKey &&
			this._inputValue.trim() !== "" &&
			this._inputKey.trim() !== ""
		) {
			if (!this.value) {
				this.value = {}
			}
			this.value[this._inputKey] = this._inputValue
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
			this._inputKey = "null"
			this._inputKey = undefined
		}
	}
	handleDeleteItemClick(key) {
		if (this.value) {
			delete this.value[key]
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = "null"
			this._inputValue = undefined
			this._inputKey = "null"
			this._inputKey = undefined
		}
	}
	render() {
		return ke$1` <div part="property" class="property">
			<field-header
				.fieldTitle=${this.withTitle ? (this._title ? this._title : this.property) : undefined}
				.description=${this.withDescription ? this._description : ``}
				.optional=${this.required ? false : true}
				exportparts="property-title, property-paragraph"
			></field-header>
			${
				this.value
					? ke$1`<div class="list-container">
						${
							this.value &&
							Object.entries(this.value).map(([key, value]) => {
								return ke$1`<div class="add-item-container">
								<sl-input
									class="disabled-input add-item-side"
									size="small"
									value=${key}
									disabled
									filled
								>
								</sl-input>
								<sl-input
									class="disabled-input add-item-side"
									size="small"
									value=${value}
									disabled
									filled
								>
								</sl-input>
								<div class="remove-icon">
									<div
										@click=${() => {
											this.handleDeleteItemClick(key)
										}}
									>
										<svg
											class="icon"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
										>
											<path
												xmlns="http://www.w3.org/2000/svg"
												d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
											/>
										</svg>
									</div>
								</div>
							</div>`
							})
						}
				  </div>`
					: ``
			}
			<div class="add-item-container">
				<sl-input
					class="add-item-side"
					placeholder=${this.keyPlaceholder}
					size="small"
					@input=${(e) => {
						this._inputKey = e.target.value
					}}
					@keydown=${(e) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputKey}
				>
				</sl-input>
				<sl-input
					class="add-item-side"
					placeholder=${this.valuePlaceholder}
					size="small"
					@input=${(e) => {
						this._inputValue = e.target.value
					}}
					@keydown=${(e) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputValue}
				>
				</sl-input>
				<sl-button
					exportparts="base:button"
					size="small"
					variant="neutral"
					@click=${() => {
						this.handleAddItemClick()
					}}
				>
					Add
				</sl-button>
			</div>
		</div>`
	}
}
__decorate$5([n()], DefaultObjectInput.prototype, "property", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "keyPlaceholder", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "valuePlaceholder", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "moduleId", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "value", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "schema", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "withTitle", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "withDescription", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "required", void 0)
__decorate$5([n()], DefaultObjectInput.prototype, "handleInlangProjectChange", void 0)
__decorate$5([r()], DefaultObjectInput.prototype, "_inputValue", void 0)
__decorate$5([r()], DefaultObjectInput.prototype, "_inputKey", void 0)
DefaultObjectInput = __decorate$5([t$1("default-object-input")], DefaultObjectInput)

var __decorate$4 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let LintRuleLevelObjectInput = class LintRuleLevelObjectInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.value = {}
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.container {
				display: flex;
				flex-direction: column;
				padding-top: 8px;
				gap: 12px;
			}
			.ruleId {
				font-size: 0.8rem;
				margin: 0;
				color: var(--sl-input-color);
			}
			.rule-container {
				display: flex;
				align-items: center;
				gap: 12px;
				flex-wrap: wrap;
			}
			.select {
				max-width: 140px;
				min-width: 100px;
			}
			.title-container {
				display: flex;
				gap: 8px;
			}
			sl-select::part(expand-icon) {
				color: var(--sl-input-placeholder-color);
			}
			sl-select::part(expand-icon):hover {
				color: var(--sl-input-color);
			}
			sl-select::part(base):hover {
				border: var(--sl-input-placeholder-color);
			}
			.level-icon {
				color: var(--sl-color-neutral-400);
				margin-top: 1px;
				margin-right: 6px;
			}
			.level-icon.danger {
				color: var(--sl-color-danger-600);
			}
		`,
		]
	}
	get _description() {
		return this.schema.description || undefined
	}
	get _title() {
		return this.schema.title || undefined
	}
	get _valueOptions() {
		//@ts-ignore
		const valuesOptions = Object.values(this.schema.patternProperties)[0]?.anyOf
		return valuesOptions ? valuesOptions : undefined
	}
	handleUpdate(key, value) {
		if (key && value) {
			if (!this.value) {
				this.value = {}
			}
			this.value[key] = value
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
		}
	}
	async update(changedProperties) {
		super.update(changedProperties)
		// TODO find a better way to update the value
		if (changedProperties.has("value")) {
			await this.updateComplete
			const newValue = changedProperties.get("value")
			if (newValue) {
				for (const moduleId of Object.keys(newValue)) {
					const slSelect = this.shadowRoot?.getElementById(moduleId)
					if (slSelect) {
						const input = slSelect.shadowRoot?.querySelector(".select__display-input")
						if (input && input.value) {
							input.value = this.value[moduleId] ? this.value[moduleId] : "warning"
						}
					}
				}
			}
		}
	}
	render() {
		return this.modules && this.modules.some((module) => module.id.split(".")[0] !== "plugin")
			? ke$1` <div part="property" class="property">
					<div class="title-container">
						<field-header
							.fieldTitle=${this._title ? this._title : this.property}
							.description=${this._description}
							.optional=${this.required ? false : true}
							exportparts="property-title, property-paragraph"
						></field-header>
					</div>
					<div class="container">
						${
							this.modules &&
							this.modules.map((module) => {
								return module.id.split(".")[0] !== "plugin"
									? ke$1`<div class="rule-container">
										<sl-select
											id=${module.id}
											exportparts="listbox:option-wrapper"
											value=${this.value ? this.value[module.id] : "warning"}
											placeholder="warning"
											class="select"
											size="small"
											@sl-change=${(e) => {
												this.handleUpdate(module.id, e.target.value)
											}}
										>
											${
												this.value[module.id] === "error"
													? ke$1`<svg
														class="level-icon danger"
														slot="prefix"
														width="20"
														height="20"
														viewBox="0 0 24 24"
												  >
														<path
															fill="currentColor"
															d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
														/>
												  </svg>`
													: ke$1`<svg
														class="level-icon"
														slot="prefix"
														width="20"
														height="20"
														viewBox="0 0 24 24"
												  >
														<path
															fill="currentColor"
															d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
														/>
												  </svg>`
											}
											${this._valueOptions?.map((option) => {
												return ke$1`<sl-option
													exportparts="base:option"
													value=${option.const}
													class="add-item-side"
												>
													${option.const}
												</sl-option>`
											})}
										</sl-select>
										<p class="ruleId">${module.displayName.en}</p>
								  </div>`
									: undefined
							})
						}
					</div>
			  </div>`
			: undefined
	}
}
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "property", void 0)
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "moduleId", void 0)
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "modules", void 0)
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "value", void 0)
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "schema", void 0)
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "required", void 0)
__decorate$4([n()], LintRuleLevelObjectInput.prototype, "handleInlangProjectChange", void 0)
LintRuleLevelObjectInput = __decorate$4(
	[t$1("lint-rule-level-object-input")],
	LintRuleLevelObjectInput
)

var __decorate$3 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let ObjectInput = class ObjectInput extends h {
	constructor() {
		//static override styles = [baseStyling]
		super(...arguments)
		this.property = ""
		this.value = {}
		this.schema = {}
		this.withTitle = true
		this.withDescription = true
		this.required = false
		this.handleInlangProjectChange = () => {}
	}
	render() {
		if (this.property === "messageLintRuleLevels") {
			return ke$1`<lint-rule-level-object-input
				exportparts="property, property-title, property-paragraph, option, option-wrapper"
				.property=${this.property}
				.moduleId=${this.moduleId}
				.modules=${this.modules}
				.value=${this.value}
				.schema=${this.schema}
				.handleInlangProjectChange=${this.handleInlangProjectChange}
				.required=${this.required}
			></lint-rule-level-object-input>`
		} else {
			return ke$1`<default-object-input
				exportparts="property, property-title, property-paragraph, button"
				.property=${this.property}
				.moduleId=${this.moduleId}
				.value=${this.value}
				.schema=${this.schema}
				.keyPlaceholder=${this.keyPlaceholder}
				.valuePlaceholder=${this.valuePlaceholder}
				.handleInlangProjectChange=${this.handleInlangProjectChange}
				.withTitle=${this.withTitle}
				.withDescription=${this.withDescription}
				.required=${this.required}
			></default-object-input>`
		}
	}
}
__decorate$3([n()], ObjectInput.prototype, "property", void 0)
__decorate$3([n()], ObjectInput.prototype, "moduleId", void 0)
__decorate$3([n()], ObjectInput.prototype, "modules", void 0)
__decorate$3([n()], ObjectInput.prototype, "keyPlaceholder", void 0)
__decorate$3([n()], ObjectInput.prototype, "valuePlaceholder", void 0)
__decorate$3([n()], ObjectInput.prototype, "value", void 0)
__decorate$3([n()], ObjectInput.prototype, "schema", void 0)
__decorate$3([n()], ObjectInput.prototype, "withTitle", void 0)
__decorate$3([n()], ObjectInput.prototype, "withDescription", void 0)
__decorate$3([n()], ObjectInput.prototype, "required", void 0)
__decorate$3([n()], ObjectInput.prototype, "handleInlangProjectChange", void 0)
ObjectInput = __decorate$3([t$1("object-input")], ObjectInput)

var __decorate$2 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let PathPatternInput = class PathPatternInput extends h {
	constructor() {
		super(...arguments)
		this.property = ""
		this.value = ""
		this.schema = {}
		this.required = false
		this.handleInlangProjectChange = () => {}
		this._isObject = undefined
		this._isInitialized = false
	}
	static {
		this.styles = [
			i$2`
			.property {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			sl-checkbox::part(base) {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
			}
			.description-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
		`,
		]
	}
	get _descriptionObject() {
		if (this.schema.description) {
			return this.schema.description
		} else {
			return "Specify the pathPattern to locate language files of specific namespaces in your repository. The namespace is a string taht shouldn't include '.', the path must include `{languageTag}` and end with `.json`."
		}
	}
	get _examplesObject() {
		return [
			'{ common: "./locales/{languageTag}/common.json", app: "./locales/{languageTag}/app.json" }',
		]
	}
	get _descriptionString() {
		if (this.schema.description) {
			return this.schema.description
		} else {
			return this.schema.anyOf[0].description || undefined
		}
	}
	get _examplesString() {
		return this.schema.anyOf[0].examples
	}
	get _title() {
		return this.schema.title || undefined
	}
	render() {
		if (this._isInitialized === false) {
			if (typeof this.value === "object") {
				this._isObject = true
			} else {
				this._isObject = false
			}
			this._isInitialized = true
		}
		return ke$1` <div part="property" class="property">
			<field-header
				.fieldTitle=${this._title ? this._title : this.property}
				.optional=${this.required ? false : true}
				exportparts="property-title"
			></field-header>
			<sl-checkbox
				?checked=${this._isObject}
				@input=${(e) => {
					//log input state
					if (e.target.checked) {
						this._isObject = true
					} else {
						this._isObject = false
					}
				}}
				>with namespaces</sl-checkbox
			>
			${
				this._isObject
					? ke$1`<div part="property" class="property">
						<field-header
							.description=${this._descriptionObject}
							.examples=${this._examplesObject}
							.optional=${this.required ? false : true}
							exportparts="property-title, property-paragraph"
						></field-header>
						<object-input
							exportparts="button"
							.value=${typeof this.value === "object" ? this.value : ""}
							.keyPlaceholder=${"Namespace"}
							.valuePlaceholder=${"Path to resource [./**/*.json]"}
							.handleInlangProjectChange=${this.handleInlangProjectChange}
							.property=${this.property}
							.moduleId=${this.moduleId}
							.schema=${this.schema}
							.withTitle=${false}
							.withDescription=${false}
							.required=${this.required}
						>
						</object-input>
				  </div>`
					: ke$1`<div part="property" class="property">
						<field-header
							.description=${this._descriptionString}
							.examples=${this._examplesString}
							.optional=${this.required ? false : true}
							exportparts="property-title, property-paragraph"
						></field-header>
						<sl-input
							value=${typeof this.value === "object" ? "" : this.value}
							size="small"
							placeholder="Path to resource [./**/*.json]"
							@input=${(e) => {
								this.handleInlangProjectChange(e.target.value, this.property, this.moduleId)
							}}
						>
						</sl-input>
				  </div>`
			}
		</div>`
	}
}
__decorate$2([n()], PathPatternInput.prototype, "property", void 0)
__decorate$2([n()], PathPatternInput.prototype, "moduleId", void 0)
__decorate$2([n()], PathPatternInput.prototype, "value", void 0)
__decorate$2([n()], PathPatternInput.prototype, "schema", void 0)
__decorate$2([n()], PathPatternInput.prototype, "required", void 0)
__decorate$2([n()], PathPatternInput.prototype, "handleInlangProjectChange", void 0)
__decorate$2([r()], PathPatternInput.prototype, "_isObject", void 0)
__decorate$2([r()], PathPatternInput.prototype, "_isInitialized", void 0)
PathPatternInput = __decorate$2([t$1("path-pattern-input")], PathPatternInput)

var __decorate$1 =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
let GeneralInput = class GeneralInput extends h {
	constructor() {
		//static override styles = baseStyling
		super(...arguments)
		this.property = ""
		this.value = ""
		this.schema = {}
		this.required = {}
		this.handleInlangProjectChange = () => {}
	}
	render() {
		if (this.schema.type) {
			if (this.schema.type === "string") {
				return ke$1` <div>
					<string-input
						exportparts="property, property-title, property-paragraph"
						.property=${this.property}
						.moduleId=${this.moduleId}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
						.required=${this.required}
					></string-input>
				</div>`
			} else if (this.schema.type === "array") {
				return ke$1` <div>
					<array-input
						exportparts="property, property-title, property-paragraph, button"
						.property=${this.property}
						.moduleId=${this.moduleId}
						.modules=${this.modules}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
						.required=${this.required}
					></array-input>
				</div>`
			} else if (this.schema.type === "object") {
				return ke$1` <div>
					<object-input
						exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
						.property=${this.property}
						.moduleId=${this.moduleId}
						.modules=${this.modules}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
						.required=${this.required}
						.withTitle=${true}
						.withDescription=${true}
						.keyPlaceholder=${"Enter key"}
						.valuePlaceholder=${"Enter value"}
					></object-input>
				</div>`
			} else {
				return ke$1` <div>
					<string-input
						exportparts="property, property-title, property-paragraph"
						.property=${this.property}
						.moduleId=${this.moduleId}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
						.required=${this.required}
					></string-input>
				</div>`
			}
		} else if (this.property === "pathPattern" || this.property === "sourceLanguageFilePath") {
			return ke$1` <div>
				<path-pattern-input
					exportparts="property, property-title, property-paragraph, button"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
					.required=${this.required}
				></path-pattern-input>
			</div>`
		} else {
			return ke$1` <div>
				<string-input
					exportparts="property, property-title, property-paragraph"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
					.required=${this.required}
				></string-input>
			</div>`
		}
	}
}
__decorate$1([n()], GeneralInput.prototype, "property", void 0)
__decorate$1([n()], GeneralInput.prototype, "moduleId", void 0)
__decorate$1([n()], GeneralInput.prototype, "modules", void 0)
__decorate$1([n()], GeneralInput.prototype, "value", void 0)
__decorate$1([n()], GeneralInput.prototype, "schema", void 0)
__decorate$1([n()], GeneralInput.prototype, "required", void 0)
__decorate$1([n()], GeneralInput.prototype, "handleInlangProjectChange", void 0)
GeneralInput = __decorate$1([t$1("general-input")], GeneralInput)

// src/components/tag/tag.styles.ts
var tag_styles_default = i$2`
  :host {
    display: inline-block;
  }

  .tag {
    display: flex;
    align-items: center;
    border: solid 1px;
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .tag__remove::part(base) {
    color: inherit;
    padding: 0;
  }

  /*
   * Variant modifiers
   */

  .tag--primary {
    background-color: var(--sl-color-primary-50);
    border-color: var(--sl-color-primary-200);
    color: var(--sl-color-primary-800);
  }

  .tag--primary:active > sl-icon-button {
    color: var(--sl-color-primary-600);
  }

  .tag--success {
    background-color: var(--sl-color-success-50);
    border-color: var(--sl-color-success-200);
    color: var(--sl-color-success-800);
  }

  .tag--success:active > sl-icon-button {
    color: var(--sl-color-success-600);
  }

  .tag--neutral {
    background-color: var(--sl-color-neutral-50);
    border-color: var(--sl-color-neutral-200);
    color: var(--sl-color-neutral-800);
  }

  .tag--neutral:active > sl-icon-button {
    color: var(--sl-color-neutral-600);
  }

  .tag--warning {
    background-color: var(--sl-color-warning-50);
    border-color: var(--sl-color-warning-200);
    color: var(--sl-color-warning-800);
  }

  .tag--warning:active > sl-icon-button {
    color: var(--sl-color-warning-600);
  }

  .tag--danger {
    background-color: var(--sl-color-danger-50);
    border-color: var(--sl-color-danger-200);
    color: var(--sl-color-danger-800);
  }

  .tag--danger:active > sl-icon-button {
    color: var(--sl-color-danger-600);
  }

  /*
   * Size modifiers
   */

  .tag--small {
    font-size: var(--sl-button-font-size-small);
    height: calc(var(--sl-input-height-small) * 0.8);
    line-height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-small);
    padding: 0 var(--sl-spacing-x-small);
  }

  .tag--medium {
    font-size: var(--sl-button-font-size-medium);
    height: calc(var(--sl-input-height-medium) * 0.8);
    line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-medium);
    padding: 0 var(--sl-spacing-small);
  }

  .tag--large {
    font-size: var(--sl-button-font-size-large);
    height: calc(var(--sl-input-height-large) * 0.8);
    line-height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-large);
    padding: 0 var(--sl-spacing-medium);
  }

  .tag__remove {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  /*
   * Pill modifier
   */

  .tag--pill {
    border-radius: var(--sl-border-radius-pill);
  }
`

// src/components/icon-button/icon-button.styles.ts
var icon_button_styles_default = i$2`
  :host {
    display: inline-block;
    color: var(--sl-color-neutral-600);
  }

  .icon-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: var(--sl-border-radius-medium);
    font-size: inherit;
    color: inherit;
    padding: var(--sl-spacing-x-small);
    cursor: pointer;
    transition: var(--sl-transition-x-fast) color;
    -webkit-appearance: none;
  }

  .icon-button:hover:not(.icon-button--disabled),
  .icon-button:focus-visible:not(.icon-button--disabled) {
    color: var(--sl-color-primary-600);
  }

  .icon-button:active:not(.icon-button--disabled) {
    color: var(--sl-color-primary-700);
  }

  .icon-button:focus {
    outline: none;
  }

  .icon-button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .icon-button__icon {
    pointer-events: none;
  }
`

// src/utilities/base-path.ts
var basePath = ""
function setBasePath(path) {
	basePath = path
}
function getBasePath(subpath = "") {
	if (!basePath) {
		const scripts = [...document.getElementsByTagName("script")]
		const configScript = scripts.find((script) => script.hasAttribute("data-shoelace"))
		if (configScript) {
			setBasePath(configScript.getAttribute("data-shoelace"))
		} else {
			const fallbackScript = scripts.find((s) => {
				return (
					/shoelace(\.min)?\.js($|\?)/.test(s.src) ||
					/shoelace-autoloader(\.min)?\.js($|\?)/.test(s.src)
				)
			})
			let path = ""
			if (fallbackScript) {
				path = fallbackScript.getAttribute("src")
			}
			setBasePath(path.split("/").slice(0, -1).join("/"))
		}
	}
	return basePath.replace(/\/$/, "") + (subpath ? `/${subpath.replace(/^\//, "")}` : ``)
}

// src/components/icon/library.default.ts
var library = {
	name: "default",
	resolver: (name) => getBasePath(`assets/icons/${name}.svg`),
}
var library_default_default = library

// src/components/icon/library.system.ts
var icons = {
	caret: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,
	check: `
    <svg part="checked-icon" class="checkbox__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <g stroke="currentColor">
          <g transform="translate(3.428571, 3.428571)">
            <path d="M0,5.71428571 L3.42857143,9.14285714"></path>
            <path d="M9.14285714,0 L3.42857143,9.14285714"></path>
          </g>
        </g>
      </g>
    </svg>
  `,
	"chevron-down": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
	"chevron-left": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  `,
	"chevron-right": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
	copy: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
    </svg>
  `,
	eye: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
    </svg>
  `,
	"eye-slash": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
    </svg>
  `,
	eyedropper: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
      <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708l-2-2zM2 12.707l7-7L10.293 7l-7 7H2v-1.293z"></path>
    </svg>
  `,
	"grip-vertical": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16">
      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>
    </svg>
  `,
	indeterminate: `
    <svg part="indeterminate-icon" class="checkbox__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <g stroke="currentColor" stroke-width="2">
          <g transform="translate(2.285714, 6.857143)">
            <path d="M10.2857143,1.14285714 L1.14285714,1.14285714"></path>
          </g>
        </g>
      </g>
    </svg>
  `,
	"person-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </svg>
  `,
	"play-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
      <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
    </svg>
  `,
	"pause-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"></path>
    </svg>
  `,
	radio: `
    <svg part="checked-icon" class="radio__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g fill="currentColor">
          <circle cx="8" cy="8" r="3.42857143"></circle>
        </g>
      </g>
    </svg>
  `,
	"star-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
    </svg>
  `,
	"x-lg": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
    </svg>
  `,
	"x-circle-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"></path>
    </svg>
  `,
}
var systemLibrary = {
	name: "system",
	resolver: (name) => {
		if (name in icons) {
			return `data:image/svg+xml,${encodeURIComponent(icons[name])}`
		}
		return ""
	},
}
var library_system_default = systemLibrary

// src/components/icon/library.ts
var registry = [library_default_default, library_system_default]
var watchedIcons = []
function watchIcon(icon) {
	watchedIcons.push(icon)
}
function unwatchIcon(icon) {
	watchedIcons = watchedIcons.filter((el) => el !== icon)
}
function getIconLibrary(name) {
	return registry.find((lib) => lib.name === name)
}

// src/components/icon/icon.styles.ts
var icon_styles_default = i$2`
  :host {
    display: inline-block;
    width: 1em;
    height: 1em;
    box-sizing: content-box !important;
  }

  svg {
    display: block;
    height: 100%;
    width: 100%;
  }
`

var __defProp = Object.defineProperty
var __defProps = Object.defineProperties
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropDescs = Object.getOwnPropertyDescriptors
var __getOwnPropSymbols = Object.getOwnPropertySymbols
var __hasOwnProp = Object.prototype.hasOwnProperty
var __propIsEnum = Object.prototype.propertyIsEnumerable
var __defNormalProp = (obj, key, value) =>
	key in obj
		? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value })
		: (obj[key] = value)
var __spreadValues = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop])
	if (__getOwnPropSymbols)
		for (var prop of __getOwnPropSymbols(b)) {
			if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop])
		}
	return a
}
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b))
var __decorateClass = (decorators, target, key, kind) => {
	var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target
	for (var i = decorators.length - 1, decorator; i >= 0; i--)
		if ((decorator = decorators[i]))
			result = (kind ? decorator(target, key, result) : decorator(result)) || result
	if (kind && result) __defProp(target, key, result)
	return result
}

// src/internal/watch.ts
function watch(propertyName, options) {
	const resolvedOptions = __spreadValues(
		{
			waitUntilFirstUpdate: false,
		},
		options
	)
	return (proto, decoratedFnName) => {
		const { update } = proto
		const watchedProperties = Array.isArray(propertyName) ? propertyName : [propertyName]
		proto.update = function (changedProps) {
			watchedProperties.forEach((property) => {
				const key = property
				if (changedProps.has(key)) {
					const oldValue = changedProps.get(key)
					const newValue = this[key]
					if (oldValue !== newValue) {
						if (!resolvedOptions.waitUntilFirstUpdate || this.hasUpdated) {
							this[decoratedFnName](oldValue, newValue)
						}
					}
				}
			})
			update.call(this, changedProps)
		}
	}
}

// src/styles/component.styles.ts
var component_styles_default = i$2`
  :host {
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none !important;
  }
`

var ShoelaceElement = class extends h {
	constructor() {
		super()
		Object.entries(this.constructor.dependencies).forEach(([name, component]) => {
			this.constructor.define(name, component)
		})
	}
	emit(name, options) {
		const event = new CustomEvent(
			name,
			__spreadValues(
				{
					bubbles: true,
					cancelable: false,
					composed: true,
					detail: {},
				},
				options
			)
		)
		this.dispatchEvent(event)
		return event
	}
	/* eslint-enable */
	static define(name, elementConstructor = this, options = {}) {
		const currentlyRegisteredConstructor = customElements.get(name)
		if (!currentlyRegisteredConstructor) {
			customElements.define(name, class extends elementConstructor {}, options)
			return
		}
		let newVersion = " (unknown version)"
		let existingVersion = newVersion
		if ("version" in elementConstructor && elementConstructor.version) {
			newVersion = " v" + elementConstructor.version
		}
		if ("version" in currentlyRegisteredConstructor && currentlyRegisteredConstructor.version) {
			existingVersion = " v" + currentlyRegisteredConstructor.version
		}
		if (newVersion && existingVersion && newVersion === existingVersion) {
			return
		}
		console.warn(
			`Attempted to register <${name}>${newVersion}, but <${name}>${existingVersion} has already been registered.`
		)
	}
}
/* eslint-disable */
// @ts-expect-error This is auto-injected at build time.
ShoelaceElement.version = "2.14.0"
ShoelaceElement.dependencies = {}
__decorateClass([n()], ShoelaceElement.prototype, "dir", 2)
__decorateClass([n()], ShoelaceElement.prototype, "lang", 2)

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const nt = (o, t) => (void 0 === t ? void 0 !== o?._$litType$ : o?._$litType$ === t),
	rt = (o) => void 0 === o.strings,
	ht = {},
	dt = (o, t = ht) => (o._$AH = t)

var CACHEABLE_ERROR = Symbol()
var RETRYABLE_ERROR = Symbol()
var parser
var iconCache = /* @__PURE__ */ new Map()
var SlIcon = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.initialRender = false
		this.svg = null
		this.label = ""
		this.library = "default"
	}
	/** Given a URL, this function returns the resulting SVG element or an appropriate error symbol. */
	async resolveIcon(url, library) {
		var _a
		let fileData
		if (library == null ? void 0 : library.spriteSheet) {
			return ke$1`<svg part="svg">
        <use part="use" href="${url}"></use>
      </svg>`
		}
		try {
			fileData = await fetch(url, { mode: "cors" })
			if (!fileData.ok) return fileData.status === 410 ? CACHEABLE_ERROR : RETRYABLE_ERROR
		} catch (e) {
			return RETRYABLE_ERROR
		}
		try {
			const div = document.createElement("div")
			div.innerHTML = await fileData.text()
			const svg = div.firstElementChild
			if (((_a = svg == null ? void 0 : svg.tagName) == null ? void 0 : _a.toLowerCase()) !== "svg")
				return CACHEABLE_ERROR
			if (!parser) parser = new DOMParser()
			const doc = parser.parseFromString(svg.outerHTML, "text/html")
			const svgEl = doc.body.querySelector("svg")
			if (!svgEl) return CACHEABLE_ERROR
			svgEl.part.add("svg")
			return document.adoptNode(svgEl)
		} catch (e) {
			return CACHEABLE_ERROR
		}
	}
	connectedCallback() {
		super.connectedCallback()
		watchIcon(this)
	}
	firstUpdated() {
		this.initialRender = true
		this.setIcon()
	}
	disconnectedCallback() {
		super.disconnectedCallback()
		unwatchIcon(this)
	}
	getIconSource() {
		const library = getIconLibrary(this.library)
		if (this.name && library) {
			return {
				url: library.resolver(this.name),
				fromLibrary: true,
			}
		}
		return {
			url: this.src,
			fromLibrary: false,
		}
	}
	handleLabelChange() {
		const hasLabel = typeof this.label === "string" && this.label.length > 0
		if (hasLabel) {
			this.setAttribute("role", "img")
			this.setAttribute("aria-label", this.label)
			this.removeAttribute("aria-hidden")
		} else {
			this.removeAttribute("role")
			this.removeAttribute("aria-label")
			this.setAttribute("aria-hidden", "true")
		}
	}
	async setIcon() {
		var _a
		const { url, fromLibrary } = this.getIconSource()
		const library = fromLibrary ? getIconLibrary(this.library) : void 0
		if (!url) {
			this.svg = null
			return
		}
		let iconResolver = iconCache.get(url)
		if (!iconResolver) {
			iconResolver = this.resolveIcon(url, library)
			iconCache.set(url, iconResolver)
		}
		if (!this.initialRender) {
			return
		}
		const svg = await iconResolver
		if (svg === RETRYABLE_ERROR) {
			iconCache.delete(url)
		}
		if (url !== this.getIconSource().url) {
			return
		}
		if (nt(svg)) {
			this.svg = svg
			return
		}
		switch (svg) {
			case RETRYABLE_ERROR:
			case CACHEABLE_ERROR:
				this.svg = null
				this.emit("sl-error")
				break
			default:
				this.svg = svg.cloneNode(true)
				;(_a = library == null ? void 0 : library.mutator) == null
					? void 0
					: _a.call(library, this.svg)
				this.emit("sl-load")
		}
	}
	render() {
		return this.svg
	}
}
SlIcon.styles = [component_styles_default, icon_styles_default]
__decorateClass([r()], SlIcon.prototype, "svg", 2)
__decorateClass([n({ reflect: true })], SlIcon.prototype, "name", 2)
__decorateClass([n()], SlIcon.prototype, "src", 2)
__decorateClass([n()], SlIcon.prototype, "label", 2)
__decorateClass([n({ reflect: true })], SlIcon.prototype, "library", 2)
__decorateClass([watch("label")], SlIcon.prototype, "handleLabelChange", 1)
__decorateClass([watch(["name", "src", "library"])], SlIcon.prototype, "setIcon", 1)

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 },
	e =
		(t) =>
		(...e) => ({ _$litDirective$: t, values: e })
class i {
	constructor(t) {}
	get _$AU() {
		return this._$AM._$AU
	}
	_$AT(t, e, i) {
		;(this.t = t), (this._$AM = e), (this.i = i)
	}
	_$AS(t, e) {
		return this.update(t, e)
	}
	update(t, e) {
		return this.render(...e)
	}
}

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const Rt = e(
	class extends i {
		constructor(s) {
			if ((super(s), s.type !== t.ATTRIBUTE || "class" !== s.name || s.strings?.length > 2))
				throw Error(
					"`classMap()` can only be used in the `class` attribute and must be the only part in the attribute."
				)
		}
		render(t) {
			return (
				" " +
				Object.keys(t)
					.filter((s) => t[s])
					.join(" ") +
				" "
			)
		}
		update(t, [s]) {
			if (void 0 === this.st) {
				;(this.st = new Set()),
					void 0 !== t.strings &&
						(this.nt = new Set(
							t.strings
								.join(" ")
								.split(/\s/)
								.filter((t) => "" !== t)
						))
				for (const t in s) s[t] && !this.nt?.has(t) && this.st.add(t)
				return this.render(s)
			}
			const i = t.element.classList
			for (const t of this.st) t in s || (i.remove(t), this.st.delete(t))
			for (const t in s) {
				const r = !!s[t]
				r === this.st.has(t) ||
					this.nt?.has(t) ||
					(r ? (i.add(t), this.st.add(t)) : (i.remove(t), this.st.delete(t)))
			}
			return R
		}
	}
)

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $e = Symbol.for(""),
	xe = (t) => {
		if (t?.r === $e) return t?._$litStatic$
	},
	er = (t, ...r) => ({
		_$litStatic$: r.reduce(
			(r, e, a) =>
				r +
				((t) => {
					if (void 0 !== t._$litStatic$) return t._$litStatic$
					throw Error(
						`Value passed to 'literal' function must be a 'literal' result: ${t}. Use 'unsafeStatic' to pass non-literal values, but\n            take care to ensure page security.`
					)
				})(e) +
				t[a + 1],
			t[0]
		),
		r: $e,
	}),
	Te = new Map(),
	Ee =
		(t) =>
		(r, ...e) => {
			const a = e.length
			let o, s
			const i = [],
				l = []
			let n,
				u = 0,
				c = !1
			for (; u < a; ) {
				for (n = r[u]; u < a && void 0 !== ((s = e[u]), (o = xe(s))); ) (n += o + r[++u]), (c = !0)
				u !== a && l.push(s), i.push(n), u++
			}
			if ((u === a && i.push(r[a]), c)) {
				const t = i.join("$$lit$$")
				void 0 === (r = Te.get(t)) && ((i.raw = i), Te.set(t, (r = i))), (e = l)
			}
			return t(r, ...e)
		},
	ke = Ee(ke$1)

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const to = (t) => t ?? D

var SlIconButton = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.hasFocus = false
		this.label = ""
		this.disabled = false
	}
	handleBlur() {
		this.hasFocus = false
		this.emit("sl-blur")
	}
	handleFocus() {
		this.hasFocus = true
		this.emit("sl-focus")
	}
	handleClick(event) {
		if (this.disabled) {
			event.preventDefault()
			event.stopPropagation()
		}
	}
	/** Simulates a click on the icon button. */
	click() {
		this.button.click()
	}
	/** Sets focus on the icon button. */
	focus(options) {
		this.button.focus(options)
	}
	/** Removes focus from the icon button. */
	blur() {
		this.button.blur()
	}
	render() {
		const isLink = this.href ? true : false
		const tag = isLink ? er`a` : er`button`
		return ke`
      <${tag}
        part="base"
        class=${Rt({
					"icon-button": true,
					"icon-button--disabled": !isLink && this.disabled,
					"icon-button--focused": this.hasFocus,
				})}
        ?disabled=${to(isLink ? void 0 : this.disabled)}
        type=${to(isLink ? void 0 : "button")}
        href=${to(isLink ? this.href : void 0)}
        target=${to(isLink ? this.target : void 0)}
        download=${to(isLink ? this.download : void 0)}
        rel=${to(isLink && this.target ? "noreferrer noopener" : void 0)}
        role=${to(isLink ? void 0 : "button")}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-label="${this.label}"
        tabindex=${this.disabled ? "-1" : "0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @click=${this.handleClick}
      >
        <sl-icon
          class="icon-button__icon"
          name=${to(this.name)}
          library=${to(this.library)}
          src=${to(this.src)}
          aria-hidden="true"
        ></sl-icon>
      </${tag}>
    `
	}
}
SlIconButton.styles = [component_styles_default, icon_button_styles_default]
SlIconButton.dependencies = { "sl-icon": SlIcon }
__decorateClass([e$1(".icon-button")], SlIconButton.prototype, "button", 2)
__decorateClass([r()], SlIconButton.prototype, "hasFocus", 2)
__decorateClass([n()], SlIconButton.prototype, "name", 2)
__decorateClass([n()], SlIconButton.prototype, "library", 2)
__decorateClass([n()], SlIconButton.prototype, "src", 2)
__decorateClass([n()], SlIconButton.prototype, "href", 2)
__decorateClass([n()], SlIconButton.prototype, "target", 2)
__decorateClass([n()], SlIconButton.prototype, "download", 2)
__decorateClass([n()], SlIconButton.prototype, "label", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlIconButton.prototype, "disabled", 2)

const connectedElements = new Set()
const translations = new Map()
let fallback
let documentDirection = "ltr"
let documentLanguage = "en"
const isClient =
	typeof MutationObserver !== "undefined" &&
	typeof document !== "undefined" &&
	typeof document.documentElement !== "undefined"
if (isClient) {
	const documentElementObserver = new MutationObserver(update)
	documentDirection = document.documentElement.dir || "ltr"
	documentLanguage = document.documentElement.lang || navigator.language
	documentElementObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["dir", "lang"],
	})
}
function registerTranslation(...translation) {
	translation.map((t) => {
		const code = t.$code.toLowerCase()
		if (translations.has(code)) {
			translations.set(code, Object.assign(Object.assign({}, translations.get(code)), t))
		} else {
			translations.set(code, t)
		}
		if (!fallback) {
			fallback = t
		}
	})
	update()
}
function update() {
	if (isClient) {
		documentDirection = document.documentElement.dir || "ltr"
		documentLanguage = document.documentElement.lang || navigator.language
	}
	;[...connectedElements.keys()].map((el) => {
		if (typeof el.requestUpdate === "function") {
			el.requestUpdate()
		}
	})
}
let LocalizeController$1 = class LocalizeController {
	constructor(host) {
		this.host = host
		this.host.addController(this)
	}
	hostConnected() {
		connectedElements.add(this.host)
	}
	hostDisconnected() {
		connectedElements.delete(this.host)
	}
	dir() {
		return `${this.host.dir || documentDirection}`.toLowerCase()
	}
	lang() {
		return `${this.host.lang || documentLanguage}`.toLowerCase()
	}
	getTranslationData(lang) {
		var _a, _b
		const locale = new Intl.Locale(lang.replace(/_/g, "-"))
		const language = locale === null || locale === void 0 ? void 0 : locale.language.toLowerCase()
		const region =
			(_b =
				(_a = locale === null || locale === void 0 ? void 0 : locale.region) === null ||
				_a === void 0
					? void 0
					: _a.toLowerCase()) !== null && _b !== void 0
				? _b
				: ""
		const primary = translations.get(`${language}-${region}`)
		const secondary = translations.get(language)
		return { locale, language, region, primary, secondary }
	}
	exists(key, options) {
		var _a
		const { primary, secondary } = this.getTranslationData(
			(_a = options.lang) !== null && _a !== void 0 ? _a : this.lang()
		)
		options = Object.assign({ includeFallback: false }, options)
		if (
			(primary && primary[key]) ||
			(secondary && secondary[key]) ||
			(options.includeFallback && fallback && fallback[key])
		) {
			return true
		}
		return false
	}
	term(key, ...args) {
		const { primary, secondary } = this.getTranslationData(this.lang())
		let term
		if (primary && primary[key]) {
			term = primary[key]
		} else if (secondary && secondary[key]) {
			term = secondary[key]
		} else if (fallback && fallback[key]) {
			term = fallback[key]
		} else {
			console.error(`No translation found for: ${String(key)}`)
			return String(key)
		}
		if (typeof term === "function") {
			return term(...args)
		}
		return term
	}
	date(dateToFormat, options) {
		dateToFormat = new Date(dateToFormat)
		return new Intl.DateTimeFormat(this.lang(), options).format(dateToFormat)
	}
	number(numberToFormat, options) {
		numberToFormat = Number(numberToFormat)
		return isNaN(numberToFormat)
			? ""
			: new Intl.NumberFormat(this.lang(), options).format(numberToFormat)
	}
	relativeTime(value, unit, options) {
		return new Intl.RelativeTimeFormat(this.lang(), options).format(value, unit)
	}
}

// src/translations/en.ts
var translation = {
	$code: "en",
	$name: "English",
	$dir: "ltr",
	carousel: "Carousel",
	clearEntry: "Clear entry",
	close: "Close",
	copied: "Copied",
	copy: "Copy",
	currentValue: "Current value",
	error: "Error",
	goToSlide: (slide, count) => `Go to slide ${slide} of ${count}`,
	hidePassword: "Hide password",
	loading: "Loading",
	nextSlide: "Next slide",
	numOptionsSelected: (num) => {
		if (num === 0) return "No options selected"
		if (num === 1) return "1 option selected"
		return `${num} options selected`
	},
	previousSlide: "Previous slide",
	progress: "Progress",
	remove: "Remove",
	resize: "Resize",
	scrollToEnd: "Scroll to end",
	scrollToStart: "Scroll to start",
	selectAColorFromTheScreen: "Select a color from the screen",
	showPassword: "Show password",
	slideNum: (slide) => `Slide ${slide}`,
	toggleColorFormat: "Toggle color format",
}
registerTranslation(translation)
var en_default = translation

var LocalizeController = class extends LocalizeController$1 {}
registerTranslation(en_default)

var SlTag = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.localize = new LocalizeController(this)
		this.variant = "neutral"
		this.size = "medium"
		this.pill = false
		this.removable = false
	}
	handleRemoveClick() {
		this.emit("sl-remove")
	}
	render() {
		return ke$1`
      <span
        part="base"
        class=${Rt({
					tag: true,
					// Types
					"tag--primary": this.variant === "primary",
					"tag--success": this.variant === "success",
					"tag--neutral": this.variant === "neutral",
					"tag--warning": this.variant === "warning",
					"tag--danger": this.variant === "danger",
					"tag--text": this.variant === "text",
					// Sizes
					"tag--small": this.size === "small",
					"tag--medium": this.size === "medium",
					"tag--large": this.size === "large",
					// Modifiers
					"tag--pill": this.pill,
					"tag--removable": this.removable,
				})}
      >
        <slot part="content" class="tag__content"></slot>

        ${
					this.removable
						? ke$1`
              <sl-icon-button
                part="remove-button"
                exportparts="base:remove-button__base"
                name="x-lg"
                library="system"
                label=${this.localize.term("remove")}
                class="tag__remove"
                @click=${this.handleRemoveClick}
                tabindex="-1"
              ></sl-icon-button>
            `
						: ""
				}
      </span>
    `
	}
}
SlTag.styles = [component_styles_default, tag_styles_default]
SlTag.dependencies = { "sl-icon-button": SlIconButton }
__decorateClass([n({ reflect: true })], SlTag.prototype, "variant", 2)
__decorateClass([n({ reflect: true })], SlTag.prototype, "size", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlTag.prototype, "pill", 2)
__decorateClass([n({ type: Boolean })], SlTag.prototype, "removable", 2)

// src/components/select/select.styles.ts
var select_styles_default = i$2`
  :host {
    display: block;
  }

  /** The popup */
  .select {
    flex: 1 1 auto;
    display: inline-flex;
    width: 100%;
    position: relative;
    vertical-align: middle;
  }

  .select::part(popup) {
    z-index: var(--sl-z-index-dropdown);
  }

  .select[data-current-placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .select[data-current-placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  /* Combobox */
  .select__combobox {
    flex: 1;
    display: flex;
    width: 100%;
    min-width: 0;
    position: relative;
    align-items: center;
    justify-content: start;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: pointer;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  .select__display-input {
    position: relative;
    width: 100%;
    font: inherit;
    border: none;
    background: none;
    color: var(--sl-input-color);
    cursor: inherit;
    overflow: hidden;
    padding: 0;
    margin: 0;
    -webkit-appearance: none;
  }

  .select__display-input::placeholder {
    color: var(--sl-input-placeholder-color);
  }

  .select:not(.select--disabled):hover .select__display-input {
    color: var(--sl-input-color-hover);
  }

  .select__display-input:focus {
    outline: none;
  }

  /* Visually hide the display input when multiple is enabled */
  .select--multiple:not(.select--placeholder-visible) .select__display-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  .select__value-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    opacity: 0;
    z-index: -1;
  }

  .select__tags {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    margin-inline-start: var(--sl-spacing-2x-small);
  }

  .select__tags::slotted(sl-tag) {
    cursor: pointer !important;
  }

  .select--disabled .select__tags,
  .select--disabled .select__tags::slotted(sl-tag) {
    cursor: not-allowed !important;
  }

  /* Standard selects */
  .select--standard .select__combobox {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .select--standard.select--disabled .select__combobox {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    color: var(--sl-input-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
    outline: none;
  }

  .select--standard:not(.select--disabled).select--open .select__combobox,
  .select--standard:not(.select--disabled).select--focused .select__combobox {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  /* Filled selects */
  .select--filled .select__combobox {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .select--filled:hover:not(.select--disabled) .select__combobox {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .select--filled.select--disabled .select__combobox {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select--filled:not(.select--disabled).select--open .select__combobox,
  .select--filled:not(.select--disabled).select--focused .select__combobox {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
  }

  /* Sizes */
  .select--small .select__combobox {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    min-height: var(--sl-input-height-small);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-small);
  }

  .select--small .select__clear {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .select--small .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-small);
  }

  .select--small.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-block: 2px;
    padding-inline-start: 0;
  }

  .select--small .select__tags {
    gap: 2px;
  }

  .select--medium .select__combobox {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    min-height: var(--sl-input-height-medium);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-medium);
  }

  .select--medium .select__clear {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .select--medium .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-medium);
  }

  .select--medium.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-inline-start: 0;
    padding-block: 3px;
  }

  .select--medium .select__tags {
    gap: 3px;
  }

  .select--large .select__combobox {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    min-height: var(--sl-input-height-large);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-large);
  }

  .select--large .select__clear {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .select--large .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-large);
  }

  .select--large.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-inline-start: 0;
    padding-block: 4px;
  }

  .select--large .select__tags {
    gap: 4px;
  }

  /* Pills */
  .select--pill.select--small .select__combobox {
    border-radius: var(--sl-input-height-small);
  }

  .select--pill.select--medium .select__combobox {
    border-radius: var(--sl-input-height-medium);
  }

  .select--pill.select--large .select__combobox {
    border-radius: var(--sl-input-height-large);
  }

  /* Prefix */
  .select__prefix {
    flex: 0;
    display: inline-flex;
    align-items: center;
    color: var(--sl-input-placeholder-color);
  }

  /* Clear button */
  .select__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: inherit;
    color: var(--sl-input-icon-color);
    border: none;
    background: none;
    padding: 0;
    transition: var(--sl-transition-fast) color;
    cursor: pointer;
  }

  .select__clear:hover {
    color: var(--sl-input-icon-color-hover);
  }

  .select__clear:focus {
    outline: none;
  }

  /* Expand icon */
  .select__expand-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    transition: var(--sl-transition-medium) rotate ease;
    rotate: 0;
    margin-inline-start: var(--sl-spacing-small);
  }

  .select--open .select__expand-icon {
    rotate: -180deg;
  }

  /* Listbox */
  .select__listbox {
    display: block;
    position: relative;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    box-shadow: var(--sl-shadow-large);
    background: var(--sl-panel-background-color);
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
    border-radius: var(--sl-border-radius-medium);
    padding-block: var(--sl-spacing-x-small);
    padding-inline: 0;
    overflow: auto;
    overscroll-behavior: none;

    /* Make sure it adheres to the popup's auto size */
    max-width: var(--auto-size-available-width);
    max-height: var(--auto-size-available-height);
  }

  .select__listbox ::slotted(sl-divider) {
    --spacing: var(--sl-spacing-x-small);
  }

  .select__listbox ::slotted(small) {
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    color: var(--sl-color-neutral-500);
    padding-block: var(--sl-spacing-x-small);
    padding-inline: var(--sl-spacing-x-large);
  }
`

// src/internal/offset.ts
function getOffset(element, parent) {
	return {
		top: Math.round(element.getBoundingClientRect().top - parent.getBoundingClientRect().top),
		left: Math.round(element.getBoundingClientRect().left - parent.getBoundingClientRect().left),
	}
}
function scrollIntoView(element, container, direction = "vertical", behavior = "smooth") {
	const offset = getOffset(element, container)
	const offsetTop = offset.top + container.scrollTop
	const offsetLeft = offset.left + container.scrollLeft
	const minX = container.scrollLeft
	const maxX = container.scrollLeft + container.offsetWidth
	const minY = container.scrollTop
	const maxY = container.scrollTop + container.offsetHeight
	if (direction === "horizontal" || direction === "both") {
		if (offsetLeft < minX) {
			container.scrollTo({ left: offsetLeft, behavior })
		} else if (offsetLeft + element.clientWidth > maxX) {
			container.scrollTo({
				left: offsetLeft - container.offsetWidth + element.clientWidth,
				behavior,
			})
		}
	}
	if (direction === "vertical" || direction === "both") {
		if (offsetTop < minY) {
			container.scrollTo({ top: offsetTop, behavior })
		} else if (offsetTop + element.clientHeight > maxY) {
			container.scrollTo({
				top: offsetTop - container.offsetHeight + element.clientHeight,
				behavior,
			})
		}
	}
}

// src/styles/form-control.styles.ts
var form_control_styles_default = i$2`
  .form-control .form-control__label {
    display: none;
  }

  .form-control .form-control__help-text {
    display: none;
  }

  /* Label */
  .form-control--has-label .form-control__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    margin-bottom: var(--sl-spacing-3x-small);
  }

  .form-control--has-label.form-control--small .form-control__label {
    font-size: var(--sl-input-label-font-size-small);
  }

  .form-control--has-label.form-control--medium .form-control__label {
    font-size: var(--sl-input-label-font-size-medium);
  }

  .form-control--has-label.form-control--large .form-control__label {
    font-size: var(--sl-input-label-font-size-large);
  }

  :host([required]) .form-control--has-label .form-control__label::after {
    content: var(--sl-input-required-content);
    margin-inline-start: var(--sl-input-required-content-offset);
    color: var(--sl-input-required-content-color);
  }

  /* Help text */
  .form-control--has-help-text .form-control__help-text {
    display: block;
    color: var(--sl-input-help-text-color);
    margin-top: var(--sl-spacing-3x-small);
  }

  .form-control--has-help-text.form-control--small .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-small);
  }

  .form-control--has-help-text.form-control--medium .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-medium);
  }

  .form-control--has-help-text.form-control--large .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-large);
  }

  .form-control--has-help-text.form-control--radio-group .form-control__help-text {
    margin-top: var(--sl-spacing-2x-small);
  }
`

// src/internal/default-value.ts
var defaultValue =
	(propertyName = "value") =>
	(proto, key) => {
		const ctor = proto.constructor
		const attributeChangedCallback = ctor.prototype.attributeChangedCallback
		ctor.prototype.attributeChangedCallback = function (name, old, value) {
			var _a
			const options = ctor.getPropertyOptions(propertyName)
			const attributeName = typeof options.attribute === "string" ? options.attribute : propertyName
			if (name === attributeName) {
				const converter = options.converter || u
				const fromAttribute =
					typeof converter === "function"
						? converter
						: (_a = converter == null ? void 0 : converter.fromAttribute) != null
							? _a
							: u.fromAttribute
				const newValue = fromAttribute(value, options.type)
				if (this[propertyName] !== newValue) {
					this[key] = newValue
				}
			}
			attributeChangedCallback.call(this, name, old, value)
		}
	}

// src/components/popup/popup.styles.ts
var popup_styles_default = i$2`
  :host {
    --arrow-color: var(--sl-color-neutral-1000);
    --arrow-size: 6px;

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45), which is the diagonal size of the arrow's container after rotating.
     */
    --arrow-size-diagonal: calc(var(--arrow-size) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);
  }

  .popup--fixed {
    position: fixed;
  }

  .popup:not(.popup--active) {
    display: none;
  }

  .popup__arrow {
    position: absolute;
    width: calc(var(--arrow-size-diagonal) * 2);
    height: calc(var(--arrow-size-diagonal) * 2);
    rotate: 45deg;
    background: var(--arrow-color);
    z-index: -1;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge--visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: calc(var(--sl-z-index-dropdown) - 1);
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }
`

/**
 * Custom positioning reference element.
 * @see https://floating-ui.com/docs/virtual-elements
 */

const min = Math.min
const max = Math.max
const round = Math.round
const floor = Math.floor
const createCoords = (v) => ({
	x: v,
	y: v,
})
const oppositeSideMap = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom",
}
const oppositeAlignmentMap = {
	start: "end",
	end: "start",
}
function clamp(start, value, end) {
	return max(start, min(value, end))
}
function evaluate(value, param) {
	return typeof value === "function" ? value(param) : value
}
function getSide(placement) {
	return placement.split("-")[0]
}
function getAlignment(placement) {
	return placement.split("-")[1]
}
function getOppositeAxis(axis) {
	return axis === "x" ? "y" : "x"
}
function getAxisLength(axis) {
	return axis === "y" ? "height" : "width"
}
function getSideAxis(placement) {
	return ["top", "bottom"].includes(getSide(placement)) ? "y" : "x"
}
function getAlignmentAxis(placement) {
	return getOppositeAxis(getSideAxis(placement))
}
function getAlignmentSides(placement, rects, rtl) {
	if (rtl === void 0) {
		rtl = false
	}
	const alignment = getAlignment(placement)
	const alignmentAxis = getAlignmentAxis(placement)
	const length = getAxisLength(alignmentAxis)
	let mainAlignmentSide =
		alignmentAxis === "x"
			? alignment === (rtl ? "end" : "start")
				? "right"
				: "left"
			: alignment === "start"
				? "bottom"
				: "top"
	if (rects.reference[length] > rects.floating[length]) {
		mainAlignmentSide = getOppositePlacement(mainAlignmentSide)
	}
	return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)]
}
function getExpandedPlacements(placement) {
	const oppositePlacement = getOppositePlacement(placement)
	return [
		getOppositeAlignmentPlacement(placement),
		oppositePlacement,
		getOppositeAlignmentPlacement(oppositePlacement),
	]
}
function getOppositeAlignmentPlacement(placement) {
	return placement.replace(/start|end/g, (alignment) => oppositeAlignmentMap[alignment])
}
function getSideList(side, isStart, rtl) {
	const lr = ["left", "right"]
	const rl = ["right", "left"]
	const tb = ["top", "bottom"]
	const bt = ["bottom", "top"]
	switch (side) {
		case "top":
		case "bottom":
			if (rtl) return isStart ? rl : lr
			return isStart ? lr : rl
		case "left":
		case "right":
			return isStart ? tb : bt
		default:
			return []
	}
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
	const alignment = getAlignment(placement)
	let list = getSideList(getSide(placement), direction === "start", rtl)
	if (alignment) {
		list = list.map((side) => side + "-" + alignment)
		if (flipAlignment) {
			list = list.concat(list.map(getOppositeAlignmentPlacement))
		}
	}
	return list
}
function getOppositePlacement(placement) {
	return placement.replace(/left|right|bottom|top/g, (side) => oppositeSideMap[side])
}
function expandPaddingObject(padding) {
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...padding,
	}
}
function getPaddingObject(padding) {
	return typeof padding !== "number"
		? expandPaddingObject(padding)
		: {
				top: padding,
				right: padding,
				bottom: padding,
				left: padding,
			}
}
function rectToClientRect(rect) {
	const { x, y, width, height } = rect
	return {
		width,
		height,
		top: y,
		left: x,
		right: x + width,
		bottom: y + height,
		x,
		y,
	}
}

function computeCoordsFromPlacement(_ref, placement, rtl) {
	let { reference, floating } = _ref
	const sideAxis = getSideAxis(placement)
	const alignmentAxis = getAlignmentAxis(placement)
	const alignLength = getAxisLength(alignmentAxis)
	const side = getSide(placement)
	const isVertical = sideAxis === "y"
	const commonX = reference.x + reference.width / 2 - floating.width / 2
	const commonY = reference.y + reference.height / 2 - floating.height / 2
	const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2
	let coords
	switch (side) {
		case "top":
			coords = {
				x: commonX,
				y: reference.y - floating.height,
			}
			break
		case "bottom":
			coords = {
				x: commonX,
				y: reference.y + reference.height,
			}
			break
		case "right":
			coords = {
				x: reference.x + reference.width,
				y: commonY,
			}
			break
		case "left":
			coords = {
				x: reference.x - floating.width,
				y: commonY,
			}
			break
		default:
			coords = {
				x: reference.x,
				y: reference.y,
			}
	}
	switch (getAlignment(placement)) {
		case "start":
			coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1)
			break
		case "end":
			coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1)
			break
	}
	return coords
}

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 *
 * This export does not have any `platform` interface logic. You will need to
 * write one for the platform you are using Floating UI with.
 */
const computePosition$1 = async (reference, floating, config) => {
	const { placement = "bottom", strategy = "absolute", middleware = [], platform } = config
	const validMiddleware = middleware.filter(Boolean)
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating))
	let rects = await platform.getElementRects({
		reference,
		floating,
		strategy,
	})
	let { x, y } = computeCoordsFromPlacement(rects, placement, rtl)
	let statefulPlacement = placement
	let middlewareData = {}
	let resetCount = 0
	for (let i = 0; i < validMiddleware.length; i++) {
		const { name, fn } = validMiddleware[i]
		const {
			x: nextX,
			y: nextY,
			data,
			reset,
		} = await fn({
			x,
			y,
			initialPlacement: placement,
			placement: statefulPlacement,
			strategy,
			middlewareData,
			rects,
			platform,
			elements: {
				reference,
				floating,
			},
		})
		x = nextX != null ? nextX : x
		y = nextY != null ? nextY : y
		middlewareData = {
			...middlewareData,
			[name]: {
				...middlewareData[name],
				...data,
			},
		}
		if (reset && resetCount <= 50) {
			resetCount++
			if (typeof reset === "object") {
				if (reset.placement) {
					statefulPlacement = reset.placement
				}
				if (reset.rects) {
					rects =
						reset.rects === true
							? await platform.getElementRects({
									reference,
									floating,
									strategy,
								})
							: reset.rects
				}
				;({ x, y } = computeCoordsFromPlacement(rects, statefulPlacement, rtl))
			}
			i = -1
		}
	}
	return {
		x,
		y,
		placement: statefulPlacement,
		strategy,
		middlewareData,
	}
}

/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing a given clipping boundary on each side.
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 * @see https://floating-ui.com/docs/detectOverflow
 */
async function detectOverflow(state, options) {
	var _await$platform$isEle
	if (options === void 0) {
		options = {}
	}
	const { x, y, platform, rects, elements, strategy } = state
	const {
		boundary = "clippingAncestors",
		rootBoundary = "viewport",
		elementContext = "floating",
		altBoundary = false,
		padding = 0,
	} = evaluate(options, state)
	const paddingObject = getPaddingObject(padding)
	const altContext = elementContext === "floating" ? "reference" : "floating"
	const element = elements[altBoundary ? altContext : elementContext]
	const clippingClientRect = rectToClientRect(
		await platform.getClippingRect({
			element: (
				(_await$platform$isEle = await (platform.isElement == null
					? void 0
					: platform.isElement(element))) != null
					? _await$platform$isEle
					: true
			)
				? element
				: element.contextElement ||
					(await (platform.getDocumentElement == null
						? void 0
						: platform.getDocumentElement(elements.floating))),
			boundary,
			rootBoundary,
			strategy,
		})
	)
	const rect =
		elementContext === "floating"
			? {
					x,
					y,
					width: rects.floating.width,
					height: rects.floating.height,
				}
			: rects.reference
	const offsetParent = await (platform.getOffsetParent == null
		? void 0
		: platform.getOffsetParent(elements.floating))
	const offsetScale = (await (platform.isElement == null
		? void 0
		: platform.isElement(offsetParent)))
		? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
				x: 1,
				y: 1,
			}
		: {
				x: 1,
				y: 1,
			}
	const elementClientRect = rectToClientRect(
		platform.convertOffsetParentRelativeRectToViewportRelativeRect
			? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
					elements,
					rect,
					offsetParent,
					strategy,
				})
			: rect
	)
	return {
		top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
		bottom:
			(elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
		left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
		right:
			(elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x,
	}
}

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow$1 = (options) => ({
	name: "arrow",
	options,
	async fn(state) {
		const { x, y, placement, rects, platform, elements, middlewareData } = state
		// Since `element` is required, we don't Partial<> the type.
		const { element, padding = 0 } = evaluate(options, state) || {}
		if (element == null) {
			return {}
		}
		const paddingObject = getPaddingObject(padding)
		const coords = {
			x,
			y,
		}
		const axis = getAlignmentAxis(placement)
		const length = getAxisLength(axis)
		const arrowDimensions = await platform.getDimensions(element)
		const isYAxis = axis === "y"
		const minProp = isYAxis ? "top" : "left"
		const maxProp = isYAxis ? "bottom" : "right"
		const clientProp = isYAxis ? "clientHeight" : "clientWidth"
		const endDiff =
			rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length]
		const startDiff = coords[axis] - rects.reference[axis]
		const arrowOffsetParent = await (platform.getOffsetParent == null
			? void 0
			: platform.getOffsetParent(element))
		let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0

		// DOM platform can return `window` as the `offsetParent`.
		if (
			!clientSize ||
			!(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))
		) {
			clientSize = elements.floating[clientProp] || rects.floating[length]
		}
		const centerToReference = endDiff / 2 - startDiff / 2

		// If the padding is large enough that it causes the arrow to no longer be
		// centered, modify the padding so that it is centered.
		const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1
		const minPadding = min(paddingObject[minProp], largestPossiblePadding)
		const maxPadding = min(paddingObject[maxProp], largestPossiblePadding)

		// Make sure the arrow doesn't overflow the floating element if the center
		// point is outside the floating element's bounds.
		const min$1 = minPadding
		const max = clientSize - arrowDimensions[length] - maxPadding
		const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference
		const offset = clamp(min$1, center, max)

		// If the reference is small enough that the arrow's padding causes it to
		// to point to nothing for an aligned placement, adjust the offset of the
		// floating element itself. To ensure `shift()` continues to take action,
		// a single reset is performed when this is true.
		const shouldAddOffset =
			!middlewareData.arrow &&
			getAlignment(placement) != null &&
			center !== offset &&
			rects.reference[length] / 2 -
				(center < min$1 ? minPadding : maxPadding) -
				arrowDimensions[length] / 2 <
				0
		const alignmentOffset = shouldAddOffset ? (center < min$1 ? center - min$1 : center - max) : 0
		return {
			[axis]: coords[axis] + alignmentOffset,
			data: {
				[axis]: offset,
				centerOffset: center - offset - alignmentOffset,
				...(shouldAddOffset && {
					alignmentOffset,
				}),
			},
			reset: shouldAddOffset,
		}
	},
})

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip$1 = function (options) {
	if (options === void 0) {
		options = {}
	}
	return {
		name: "flip",
		options,
		async fn(state) {
			var _middlewareData$arrow, _middlewareData$flip
			const { placement, middlewareData, rects, initialPlacement, platform, elements } = state
			const {
				mainAxis: checkMainAxis = true,
				crossAxis: checkCrossAxis = true,
				fallbackPlacements: specifiedFallbackPlacements,
				fallbackStrategy = "bestFit",
				fallbackAxisSideDirection = "none",
				flipAlignment = true,
				...detectOverflowOptions
			} = evaluate(options, state)

			// If a reset by the arrow was caused due to an alignment offset being
			// added, we should skip any logic now since `flip()` has already done its
			// work.
			// https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
			if (
				(_middlewareData$arrow = middlewareData.arrow) != null &&
				_middlewareData$arrow.alignmentOffset
			) {
				return {}
			}
			const side = getSide(placement)
			const initialSideAxis = getSideAxis(initialPlacement)
			const isBasePlacement = getSide(initialPlacement) === initialPlacement
			const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating))
			const fallbackPlacements =
				specifiedFallbackPlacements ||
				(isBasePlacement || !flipAlignment
					? [getOppositePlacement(initialPlacement)]
					: getExpandedPlacements(initialPlacement))
			const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none"
			if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
				fallbackPlacements.push(
					...getOppositeAxisPlacements(
						initialPlacement,
						flipAlignment,
						fallbackAxisSideDirection,
						rtl
					)
				)
			}
			const placements = [initialPlacement, ...fallbackPlacements]
			const overflow = await detectOverflow(state, detectOverflowOptions)
			const overflows = []
			let overflowsData =
				((_middlewareData$flip = middlewareData.flip) == null
					? void 0
					: _middlewareData$flip.overflows) || []
			if (checkMainAxis) {
				overflows.push(overflow[side])
			}
			if (checkCrossAxis) {
				const sides = getAlignmentSides(placement, rects, rtl)
				overflows.push(overflow[sides[0]], overflow[sides[1]])
			}
			overflowsData = [
				...overflowsData,
				{
					placement,
					overflows,
				},
			]

			// One or more sides is overflowing.
			if (!overflows.every((side) => side <= 0)) {
				var _middlewareData$flip2, _overflowsData$filter
				const nextIndex =
					(((_middlewareData$flip2 = middlewareData.flip) == null
						? void 0
						: _middlewareData$flip2.index) || 0) + 1
				const nextPlacement = placements[nextIndex]
				if (nextPlacement) {
					// Try next placement and re-run the lifecycle.
					return {
						data: {
							index: nextIndex,
							overflows: overflowsData,
						},
						reset: {
							placement: nextPlacement,
						},
					}
				}

				// First, find the candidates that fit on the mainAxis side of overflow,
				// then find the placement that fits the best on the main crossAxis side.
				let resetPlacement =
					(_overflowsData$filter = overflowsData
						.filter((d) => d.overflows[0] <= 0)
						.sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null
						? void 0
						: _overflowsData$filter.placement

				// Otherwise fallback.
				if (!resetPlacement) {
					switch (fallbackStrategy) {
						case "bestFit": {
							var _overflowsData$filter2
							const placement =
								(_overflowsData$filter2 = overflowsData
									.filter((d) => {
										if (hasFallbackAxisSideDirection) {
											const currentSideAxis = getSideAxis(d.placement)
											return (
												currentSideAxis === initialSideAxis ||
												// Create a bias to the `y` side axis due to horizontal
												// reading directions favoring greater width.
												currentSideAxis === "y"
											)
										}
										return true
									})
									.map((d) => [
										d.placement,
										d.overflows
											.filter((overflow) => overflow > 0)
											.reduce((acc, overflow) => acc + overflow, 0),
									])
									.sort((a, b) => a[1] - b[1])[0]) == null
									? void 0
									: _overflowsData$filter2[0]
							if (placement) {
								resetPlacement = placement
							}
							break
						}
						case "initialPlacement":
							resetPlacement = initialPlacement
							break
					}
				}
				if (placement !== resetPlacement) {
					return {
						reset: {
							placement: resetPlacement,
						},
					}
				}
			}
			return {}
		},
	}
}

// For type backwards-compatibility, the `OffsetOptions` type was also
// Derivable.

async function convertValueToCoords(state, options) {
	const { placement, platform, elements } = state
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating))
	const side = getSide(placement)
	const alignment = getAlignment(placement)
	const isVertical = getSideAxis(placement) === "y"
	const mainAxisMulti = ["left", "top"].includes(side) ? -1 : 1
	const crossAxisMulti = rtl && isVertical ? -1 : 1
	const rawValue = evaluate(options, state)

	// eslint-disable-next-line prefer-const
	let { mainAxis, crossAxis, alignmentAxis } =
		typeof rawValue === "number"
			? {
					mainAxis: rawValue,
					crossAxis: 0,
					alignmentAxis: null,
				}
			: {
					mainAxis: 0,
					crossAxis: 0,
					alignmentAxis: null,
					...rawValue,
				}
	if (alignment && typeof alignmentAxis === "number") {
		crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis
	}
	return isVertical
		? {
				x: crossAxis * crossAxisMulti,
				y: mainAxis * mainAxisMulti,
			}
		: {
				x: mainAxis * mainAxisMulti,
				y: crossAxis * crossAxisMulti,
			}
}

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
const offset$1 = function (options) {
	if (options === void 0) {
		options = 0
	}
	return {
		name: "offset",
		options,
		async fn(state) {
			var _middlewareData$offse, _middlewareData$arrow
			const { x, y, placement, middlewareData } = state
			const diffCoords = await convertValueToCoords(state, options)

			// If the placement is the same and the arrow caused an alignment offset
			// then we don't need to change the positioning coordinates.
			if (
				placement ===
					((_middlewareData$offse = middlewareData.offset) == null
						? void 0
						: _middlewareData$offse.placement) &&
				(_middlewareData$arrow = middlewareData.arrow) != null &&
				_middlewareData$arrow.alignmentOffset
			) {
				return {}
			}
			return {
				x: x + diffCoords.x,
				y: y + diffCoords.y,
				data: {
					...diffCoords,
					placement,
				},
			}
		},
	}
}

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift$1 = function (options) {
	if (options === void 0) {
		options = {}
	}
	return {
		name: "shift",
		options,
		async fn(state) {
			const { x, y, placement } = state
			const {
				mainAxis: checkMainAxis = true,
				crossAxis: checkCrossAxis = false,
				limiter = {
					fn: (_ref) => {
						let { x, y } = _ref
						return {
							x,
							y,
						}
					},
				},
				...detectOverflowOptions
			} = evaluate(options, state)
			const coords = {
				x,
				y,
			}
			const overflow = await detectOverflow(state, detectOverflowOptions)
			const crossAxis = getSideAxis(getSide(placement))
			const mainAxis = getOppositeAxis(crossAxis)
			let mainAxisCoord = coords[mainAxis]
			let crossAxisCoord = coords[crossAxis]
			if (checkMainAxis) {
				const minSide = mainAxis === "y" ? "top" : "left"
				const maxSide = mainAxis === "y" ? "bottom" : "right"
				const min = mainAxisCoord + overflow[minSide]
				const max = mainAxisCoord - overflow[maxSide]
				mainAxisCoord = clamp(min, mainAxisCoord, max)
			}
			if (checkCrossAxis) {
				const minSide = crossAxis === "y" ? "top" : "left"
				const maxSide = crossAxis === "y" ? "bottom" : "right"
				const min = crossAxisCoord + overflow[minSide]
				const max = crossAxisCoord - overflow[maxSide]
				crossAxisCoord = clamp(min, crossAxisCoord, max)
			}
			const limitedCoords = limiter.fn({
				...state,
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord,
			})
			return {
				...limitedCoords,
				data: {
					x: limitedCoords.x - x,
					y: limitedCoords.y - y,
				},
			}
		},
	}
}

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
const size$1 = function (options) {
	if (options === void 0) {
		options = {}
	}
	return {
		name: "size",
		options,
		async fn(state) {
			const { placement, rects, platform, elements } = state
			const { apply = () => {}, ...detectOverflowOptions } = evaluate(options, state)
			const overflow = await detectOverflow(state, detectOverflowOptions)
			const side = getSide(placement)
			const alignment = getAlignment(placement)
			const isYAxis = getSideAxis(placement) === "y"
			const { width, height } = rects.floating
			let heightSide
			let widthSide
			if (side === "top" || side === "bottom") {
				heightSide = side
				widthSide =
					alignment ===
					((await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)))
						? "start"
						: "end")
						? "left"
						: "right"
			} else {
				widthSide = side
				heightSide = alignment === "end" ? "top" : "bottom"
			}
			const maximumClippingHeight = height - overflow.top - overflow.bottom
			const maximumClippingWidth = width - overflow.left - overflow.right
			const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight)
			const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth)
			const noShift = !state.middlewareData.shift
			let availableHeight = overflowAvailableHeight
			let availableWidth = overflowAvailableWidth
			if (isYAxis) {
				availableWidth =
					alignment || noShift
						? min(overflowAvailableWidth, maximumClippingWidth)
						: maximumClippingWidth
			} else {
				availableHeight =
					alignment || noShift
						? min(overflowAvailableHeight, maximumClippingHeight)
						: maximumClippingHeight
			}
			if (noShift && !alignment) {
				const xMin = max(overflow.left, 0)
				const xMax = max(overflow.right, 0)
				const yMin = max(overflow.top, 0)
				const yMax = max(overflow.bottom, 0)
				if (isYAxis) {
					availableWidth =
						width -
						2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right))
				} else {
					availableHeight =
						height -
						2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom))
				}
			}
			await apply({
				...state,
				availableWidth,
				availableHeight,
			})
			const nextDimensions = await platform.getDimensions(elements.floating)
			if (width !== nextDimensions.width || height !== nextDimensions.height) {
				return {
					reset: {
						rects: true,
					},
				}
			}
			return {}
		},
	}
}

function getNodeName(node) {
	if (isNode(node)) {
		return (node.nodeName || "").toLowerCase()
	}
	// Mocked nodes in testing environments may not be instances of Node. By
	// returning `#document` an infinite loop won't occur.
	// https://github.com/floating-ui/floating-ui/issues/2317
	return "#document"
}
function getWindow(node) {
	var _node$ownerDocument
	return (
		(node == null || (_node$ownerDocument = node.ownerDocument) == null
			? void 0
			: _node$ownerDocument.defaultView) || window
	)
}
function getDocumentElement(node) {
	var _ref
	return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null
		? void 0
		: _ref.documentElement
}
function isNode(value) {
	return value instanceof Node || value instanceof getWindow(value).Node
}
function isElement(value) {
	return value instanceof Element || value instanceof getWindow(value).Element
}
function isHTMLElement(value) {
	return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement
}
function isShadowRoot(value) {
	// Browsers without `ShadowRoot` support.
	if (typeof ShadowRoot === "undefined") {
		return false
	}
	return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot
}
function isOverflowElement(element) {
	const { overflow, overflowX, overflowY, display } = getComputedStyle$1(element)
	return (
		/auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) &&
		!["inline", "contents"].includes(display)
	)
}
function isTableElement(element) {
	return ["table", "td", "th"].includes(getNodeName(element))
}
function isTopLayer(element) {
	return [":popover-open", ":modal"].some((selector) => {
		try {
			return element.matches(selector)
		} catch (e) {
			return false
		}
	})
}
function isContainingBlock(elementOrCss) {
	const webkit = isWebKit()
	const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss

	// https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
	return (
		css.transform !== "none" ||
		css.perspective !== "none" ||
		(css.containerType ? css.containerType !== "normal" : false) ||
		(!webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false)) ||
		(!webkit && (css.filter ? css.filter !== "none" : false)) ||
		["transform", "perspective", "filter"].some((value) =>
			(css.willChange || "").includes(value)
		) ||
		["paint", "layout", "strict", "content"].some((value) => (css.contain || "").includes(value))
	)
}
function getContainingBlock(element) {
	let currentNode = getParentNode(element)
	while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
		if (isContainingBlock(currentNode)) {
			return currentNode
		} else if (isTopLayer(currentNode)) {
			return null
		}
		currentNode = getParentNode(currentNode)
	}
	return null
}
function isWebKit() {
	if (typeof CSS === "undefined" || !CSS.supports) return false
	return CSS.supports("-webkit-backdrop-filter", "none")
}
function isLastTraversableNode(node) {
	return ["html", "body", "#document"].includes(getNodeName(node))
}
function getComputedStyle$1(element) {
	return getWindow(element).getComputedStyle(element)
}
function getNodeScroll(element) {
	if (isElement(element)) {
		return {
			scrollLeft: element.scrollLeft,
			scrollTop: element.scrollTop,
		}
	}
	return {
		scrollLeft: element.scrollX,
		scrollTop: element.scrollY,
	}
}
function getParentNode(node) {
	if (getNodeName(node) === "html") {
		return node
	}
	const result =
		// Step into the shadow DOM of the parent of a slotted node.
		node.assignedSlot ||
		// DOM Element detected.
		node.parentNode ||
		// ShadowRoot detected.
		(isShadowRoot(node) && node.host) ||
		// Fallback.
		getDocumentElement(node)
	return isShadowRoot(result) ? result.host : result
}
function getNearestOverflowAncestor(node) {
	const parentNode = getParentNode(node)
	if (isLastTraversableNode(parentNode)) {
		return node.ownerDocument ? node.ownerDocument.body : node.body
	}
	if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
		return parentNode
	}
	return getNearestOverflowAncestor(parentNode)
}
function getOverflowAncestors(node, list, traverseIframes) {
	var _node$ownerDocument2
	if (list === void 0) {
		list = []
	}
	if (traverseIframes === void 0) {
		traverseIframes = true
	}
	const scrollableAncestor = getNearestOverflowAncestor(node)
	const isBody =
		scrollableAncestor ===
		((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body)
	const win = getWindow(scrollableAncestor)
	if (isBody) {
		const frameElement = getFrameElement(win)
		return list.concat(
			win,
			win.visualViewport || [],
			isOverflowElement(scrollableAncestor) ? scrollableAncestor : [],
			frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []
		)
	}
	return list.concat(
		scrollableAncestor,
		getOverflowAncestors(scrollableAncestor, [], traverseIframes)
	)
}
function getFrameElement(win) {
	return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null
}

function getCssDimensions(element) {
	const css = getComputedStyle$1(element)
	// In testing environments, the `width` and `height` properties are empty
	// strings for SVG elements, returning NaN. Fallback to `0` in this case.
	let width = parseFloat(css.width) || 0
	let height = parseFloat(css.height) || 0
	const hasOffset = isHTMLElement(element)
	const offsetWidth = hasOffset ? element.offsetWidth : width
	const offsetHeight = hasOffset ? element.offsetHeight : height
	const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight
	if (shouldFallback) {
		width = offsetWidth
		height = offsetHeight
	}
	return {
		width,
		height,
		$: shouldFallback,
	}
}

function unwrapElement(element) {
	return !isElement(element) ? element.contextElement : element
}

function getScale(element) {
	const domElement = unwrapElement(element)
	if (!isHTMLElement(domElement)) {
		return createCoords(1)
	}
	const rect = domElement.getBoundingClientRect()
	const { width, height, $ } = getCssDimensions(domElement)
	let x = ($ ? round(rect.width) : rect.width) / width
	let y = ($ ? round(rect.height) : rect.height) / height

	// 0, NaN, or Infinity should always fallback to 1.

	if (!x || !Number.isFinite(x)) {
		x = 1
	}
	if (!y || !Number.isFinite(y)) {
		y = 1
	}
	return {
		x,
		y,
	}
}

const noOffsets = /*#__PURE__*/ createCoords(0)
function getVisualOffsets(element) {
	const win = getWindow(element)
	if (!isWebKit() || !win.visualViewport) {
		return noOffsets
	}
	return {
		x: win.visualViewport.offsetLeft,
		y: win.visualViewport.offsetTop,
	}
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
	if (isFixed === void 0) {
		isFixed = false
	}
	if (!floatingOffsetParent || (isFixed && floatingOffsetParent !== getWindow(element))) {
		return false
	}
	return isFixed
}

function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
	if (includeScale === void 0) {
		includeScale = false
	}
	if (isFixedStrategy === void 0) {
		isFixedStrategy = false
	}
	const clientRect = element.getBoundingClientRect()
	const domElement = unwrapElement(element)
	let scale = createCoords(1)
	if (includeScale) {
		if (offsetParent) {
			if (isElement(offsetParent)) {
				scale = getScale(offsetParent)
			}
		} else {
			scale = getScale(element)
		}
	}
	const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent)
		? getVisualOffsets(domElement)
		: createCoords(0)
	let x = (clientRect.left + visualOffsets.x) / scale.x
	let y = (clientRect.top + visualOffsets.y) / scale.y
	let width = clientRect.width / scale.x
	let height = clientRect.height / scale.y
	if (domElement) {
		const win = getWindow(domElement)
		const offsetWin =
			offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent
		let currentWin = win
		let currentIFrame = getFrameElement(currentWin)
		while (currentIFrame && offsetParent && offsetWin !== currentWin) {
			const iframeScale = getScale(currentIFrame)
			const iframeRect = currentIFrame.getBoundingClientRect()
			const css = getComputedStyle$1(currentIFrame)
			const left =
				iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x
			const top =
				iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y
			x *= iframeScale.x
			y *= iframeScale.y
			width *= iframeScale.x
			height *= iframeScale.y
			x += left
			y += top
			currentWin = getWindow(currentIFrame)
			currentIFrame = getFrameElement(currentWin)
		}
	}
	return rectToClientRect({
		width,
		height,
		x,
		y,
	})
}

function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
	let { elements, rect, offsetParent, strategy } = _ref
	const isFixed = strategy === "fixed"
	const documentElement = getDocumentElement(offsetParent)
	const topLayer = elements ? isTopLayer(elements.floating) : false
	if (offsetParent === documentElement || (topLayer && isFixed)) {
		return rect
	}
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0,
	}
	let scale = createCoords(1)
	const offsets = createCoords(0)
	const isOffsetParentAnElement = isHTMLElement(offsetParent)
	if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
			scroll = getNodeScroll(offsetParent)
		}
		if (isHTMLElement(offsetParent)) {
			const offsetRect = getBoundingClientRect(offsetParent)
			scale = getScale(offsetParent)
			offsets.x = offsetRect.x + offsetParent.clientLeft
			offsets.y = offsetRect.y + offsetParent.clientTop
		}
	}
	return {
		width: rect.width * scale.x,
		height: rect.height * scale.y,
		x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
		y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y,
	}
}

function getClientRects(element) {
	return Array.from(element.getClientRects())
}

function getWindowScrollBarX(element) {
	// If <html> has a CSS width greater than the viewport, then this will be
	// incorrect for RTL.
	return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft
}

// Gets the entire size of the scrollable document area, even extending outside
// of the `<html>` and `<body>` rect bounds if horizontally scrollable.
function getDocumentRect(element) {
	const html = getDocumentElement(element)
	const scroll = getNodeScroll(element)
	const body = element.ownerDocument.body
	const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth)
	const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight)
	let x = -scroll.scrollLeft + getWindowScrollBarX(element)
	const y = -scroll.scrollTop
	if (getComputedStyle$1(body).direction === "rtl") {
		x += max(html.clientWidth, body.clientWidth) - width
	}
	return {
		width,
		height,
		x,
		y,
	}
}

function getViewportRect(element, strategy) {
	const win = getWindow(element)
	const html = getDocumentElement(element)
	const visualViewport = win.visualViewport
	let width = html.clientWidth
	let height = html.clientHeight
	let x = 0
	let y = 0
	if (visualViewport) {
		width = visualViewport.width
		height = visualViewport.height
		const visualViewportBased = isWebKit()
		if (!visualViewportBased || (visualViewportBased && strategy === "fixed")) {
			x = visualViewport.offsetLeft
			y = visualViewport.offsetTop
		}
	}
	return {
		width,
		height,
		x,
		y,
	}
}

// Returns the inner client rect, subtracting scrollbars if present.
function getInnerBoundingClientRect(element, strategy) {
	const clientRect = getBoundingClientRect(element, true, strategy === "fixed")
	const top = clientRect.top + element.clientTop
	const left = clientRect.left + element.clientLeft
	const scale = isHTMLElement(element) ? getScale(element) : createCoords(1)
	const width = element.clientWidth * scale.x
	const height = element.clientHeight * scale.y
	const x = left * scale.x
	const y = top * scale.y
	return {
		width,
		height,
		x,
		y,
	}
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
	let rect
	if (clippingAncestor === "viewport") {
		rect = getViewportRect(element, strategy)
	} else if (clippingAncestor === "document") {
		rect = getDocumentRect(getDocumentElement(element))
	} else if (isElement(clippingAncestor)) {
		rect = getInnerBoundingClientRect(clippingAncestor, strategy)
	} else {
		const visualOffsets = getVisualOffsets(element)
		rect = {
			...clippingAncestor,
			x: clippingAncestor.x - visualOffsets.x,
			y: clippingAncestor.y - visualOffsets.y,
		}
	}
	return rectToClientRect(rect)
}
function hasFixedPositionAncestor(element, stopNode) {
	const parentNode = getParentNode(element)
	if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
		return false
	}
	return (
		getComputedStyle$1(parentNode).position === "fixed" ||
		hasFixedPositionAncestor(parentNode, stopNode)
	)
}

// A "clipping ancestor" is an `overflow` element with the characteristic of
// clipping (or hiding) child elements. This returns all clipping ancestors
// of the given element up the tree.
function getClippingElementAncestors(element, cache) {
	const cachedResult = cache.get(element)
	if (cachedResult) {
		return cachedResult
	}
	let result = getOverflowAncestors(element, [], false).filter(
		(el) => isElement(el) && getNodeName(el) !== "body"
	)
	let currentContainingBlockComputedStyle = null
	const elementIsFixed = getComputedStyle$1(element).position === "fixed"
	let currentNode = elementIsFixed ? getParentNode(element) : element

	// https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
	while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
		const computedStyle = getComputedStyle$1(currentNode)
		const currentNodeIsContaining = isContainingBlock(currentNode)
		if (!currentNodeIsContaining && computedStyle.position === "fixed") {
			currentContainingBlockComputedStyle = null
		}
		const shouldDropCurrentNode = elementIsFixed
			? !currentNodeIsContaining && !currentContainingBlockComputedStyle
			: (!currentNodeIsContaining &&
					computedStyle.position === "static" &&
					!!currentContainingBlockComputedStyle &&
					["absolute", "fixed"].includes(currentContainingBlockComputedStyle.position)) ||
				(isOverflowElement(currentNode) &&
					!currentNodeIsContaining &&
					hasFixedPositionAncestor(element, currentNode))
		if (shouldDropCurrentNode) {
			// Drop non-containing blocks.
			result = result.filter((ancestor) => ancestor !== currentNode)
		} else {
			// Record last containing block for next iteration.
			currentContainingBlockComputedStyle = computedStyle
		}
		currentNode = getParentNode(currentNode)
	}
	cache.set(element, result)
	return result
}

// Gets the maximum area that the element is visible in due to any number of
// clipping ancestors.
function getClippingRect(_ref) {
	let { element, boundary, rootBoundary, strategy } = _ref
	const elementClippingAncestors =
		boundary === "clippingAncestors"
			? isTopLayer(element)
				? []
				: getClippingElementAncestors(element, this._c)
			: [].concat(boundary)
	const clippingAncestors = [...elementClippingAncestors, rootBoundary]
	const firstClippingAncestor = clippingAncestors[0]
	const clippingRect = clippingAncestors.reduce(
		(accRect, clippingAncestor) => {
			const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy)
			accRect.top = max(rect.top, accRect.top)
			accRect.right = min(rect.right, accRect.right)
			accRect.bottom = min(rect.bottom, accRect.bottom)
			accRect.left = max(rect.left, accRect.left)
			return accRect
		},
		getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy)
	)
	return {
		width: clippingRect.right - clippingRect.left,
		height: clippingRect.bottom - clippingRect.top,
		x: clippingRect.left,
		y: clippingRect.top,
	}
}

function getDimensions(element) {
	const { width, height } = getCssDimensions(element)
	return {
		width,
		height,
	}
}

function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
	const isOffsetParentAnElement = isHTMLElement(offsetParent)
	const documentElement = getDocumentElement(offsetParent)
	const isFixed = strategy === "fixed"
	const rect = getBoundingClientRect(element, true, isFixed, offsetParent)
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0,
	}
	const offsets = createCoords(0)
	if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
			scroll = getNodeScroll(offsetParent)
		}
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent)
			offsets.x = offsetRect.x + offsetParent.clientLeft
			offsets.y = offsetRect.y + offsetParent.clientTop
		} else if (documentElement) {
			offsets.x = getWindowScrollBarX(documentElement)
		}
	}
	const x = rect.left + scroll.scrollLeft - offsets.x
	const y = rect.top + scroll.scrollTop - offsets.y
	return {
		x,
		y,
		width: rect.width,
		height: rect.height,
	}
}

function isStaticPositioned(element) {
	return getComputedStyle$1(element).position === "static"
}

function getTrueOffsetParent(element, polyfill) {
	if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") {
		return null
	}
	if (polyfill) {
		return polyfill(element)
	}
	return element.offsetParent
}

// Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.
function getOffsetParent(element, polyfill) {
	const win = getWindow(element)
	if (isTopLayer(element)) {
		return win
	}
	if (!isHTMLElement(element)) {
		let svgOffsetParent = getParentNode(element)
		while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
			if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
				return svgOffsetParent
			}
			svgOffsetParent = getParentNode(svgOffsetParent)
		}
		return win
	}
	let offsetParent = getTrueOffsetParent(element, polyfill)
	while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
		offsetParent = getTrueOffsetParent(offsetParent, polyfill)
	}
	if (
		offsetParent &&
		isLastTraversableNode(offsetParent) &&
		isStaticPositioned(offsetParent) &&
		!isContainingBlock(offsetParent)
	) {
		return win
	}
	return offsetParent || getContainingBlock(element) || win
}

const getElementRects = async function (data) {
	const getOffsetParentFn = this.getOffsetParent || getOffsetParent
	const getDimensionsFn = this.getDimensions
	const floatingDimensions = await getDimensionsFn(data.floating)
	return {
		reference: getRectRelativeToOffsetParent(
			data.reference,
			await getOffsetParentFn(data.floating),
			data.strategy
		),
		floating: {
			x: 0,
			y: 0,
			width: floatingDimensions.width,
			height: floatingDimensions.height,
		},
	}
}

function isRTL(element) {
	return getComputedStyle$1(element).direction === "rtl"
}

const platform = {
	convertOffsetParentRelativeRectToViewportRelativeRect,
	getDocumentElement,
	getClippingRect,
	getOffsetParent,
	getElementRects,
	getClientRects,
	getDimensions,
	getScale,
	isElement,
	isRTL,
}

// https://samthor.au/2021/observing-dom/
function observeMove(element, onMove) {
	let io = null
	let timeoutId
	const root = getDocumentElement(element)
	function cleanup() {
		var _io
		clearTimeout(timeoutId)
		;(_io = io) == null || _io.disconnect()
		io = null
	}
	function refresh(skip, threshold) {
		if (skip === void 0) {
			skip = false
		}
		if (threshold === void 0) {
			threshold = 1
		}
		cleanup()
		const { left, top, width, height } = element.getBoundingClientRect()
		if (!skip) {
			onMove()
		}
		if (!width || !height) {
			return
		}
		const insetTop = floor(top)
		const insetRight = floor(root.clientWidth - (left + width))
		const insetBottom = floor(root.clientHeight - (top + height))
		const insetLeft = floor(left)
		const rootMargin =
			-insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px"
		const options = {
			rootMargin,
			threshold: max(0, min(1, threshold)) || 1,
		}
		let isFirstUpdate = true
		function handleObserve(entries) {
			const ratio = entries[0].intersectionRatio
			if (ratio !== threshold) {
				if (!isFirstUpdate) {
					return refresh()
				}
				if (!ratio) {
					// If the reference is clipped, the ratio is 0. Throttle the refresh
					// to prevent an infinite loop of updates.
					timeoutId = setTimeout(() => {
						refresh(false, 1e-7)
					}, 1000)
				} else {
					refresh(false, ratio)
				}
			}
			isFirstUpdate = false
		}

		// Older browsers don't support a `document` as the root and will throw an
		// error.
		try {
			io = new IntersectionObserver(handleObserve, {
				...options,
				// Handle <iframe>s
				root: root.ownerDocument,
			})
		} catch (e) {
			io = new IntersectionObserver(handleObserve, options)
		}
		io.observe(element)
	}
	refresh(true)
	return cleanup
}

/**
 * Automatically updates the position of the floating element when necessary.
 * Should only be called when the floating element is mounted on the DOM or
 * visible on the screen.
 * @returns cleanup function that should be invoked when the floating element is
 * removed from the DOM or hidden from the screen.
 * @see https://floating-ui.com/docs/autoUpdate
 */
function autoUpdate(reference, floating, update, options) {
	if (options === void 0) {
		options = {}
	}
	const {
		ancestorScroll = true,
		ancestorResize = true,
		elementResize = typeof ResizeObserver === "function",
		layoutShift = typeof IntersectionObserver === "function",
		animationFrame = false,
	} = options
	const referenceEl = unwrapElement(reference)
	const ancestors =
		ancestorScroll || ancestorResize
			? [
					...(referenceEl ? getOverflowAncestors(referenceEl) : []),
					...getOverflowAncestors(floating),
				]
			: []
	ancestors.forEach((ancestor) => {
		ancestorScroll &&
			ancestor.addEventListener("scroll", update, {
				passive: true,
			})
		ancestorResize && ancestor.addEventListener("resize", update)
	})
	const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null
	let reobserveFrame = -1
	let resizeObserver = null
	if (elementResize) {
		resizeObserver = new ResizeObserver((_ref) => {
			let [firstEntry] = _ref
			if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
				// Prevent update loops when using the `size` middleware.
				// https://github.com/floating-ui/floating-ui/issues/1740
				resizeObserver.unobserve(floating)
				cancelAnimationFrame(reobserveFrame)
				reobserveFrame = requestAnimationFrame(() => {
					var _resizeObserver
					;(_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating)
				})
			}
			update()
		})
		if (referenceEl && !animationFrame) {
			resizeObserver.observe(referenceEl)
		}
		resizeObserver.observe(floating)
	}
	let frameId
	let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null
	if (animationFrame) {
		frameLoop()
	}
	function frameLoop() {
		const nextRefRect = getBoundingClientRect(reference)
		if (
			prevRefRect &&
			(nextRefRect.x !== prevRefRect.x ||
				nextRefRect.y !== prevRefRect.y ||
				nextRefRect.width !== prevRefRect.width ||
				nextRefRect.height !== prevRefRect.height)
		) {
			update()
		}
		prevRefRect = nextRefRect
		frameId = requestAnimationFrame(frameLoop)
	}
	update()
	return () => {
		var _resizeObserver2
		ancestors.forEach((ancestor) => {
			ancestorScroll && ancestor.removeEventListener("scroll", update)
			ancestorResize && ancestor.removeEventListener("resize", update)
		})
		cleanupIo == null || cleanupIo()
		;(_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect()
		resizeObserver = null
		if (animationFrame) {
			cancelAnimationFrame(frameId)
		}
	}
}

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
const offset = offset$1

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift = shift$1

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip = flip$1

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
const size = size$1

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow = arrow$1

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 */
const computePosition = (reference, floating, options) => {
	// This caches the expensive `getClippingElementAncestors` function so that
	// multiple lifecycle resets re-use the same result. It only lives for a
	// single call. If other functions become expensive, we can add them as well.
	const cache = new Map()
	const mergedOptions = {
		platform,
		...options,
	}
	const platformWithCache = {
		...mergedOptions.platform,
		_c: cache,
	}
	return computePosition$1(reference, floating, {
		...mergedOptions,
		platform: platformWithCache,
	})
}

/* eslint-disable @typescript-eslint/ban-types */
function offsetParent(element) {
	return offsetParentPolyfill(element)
}
function flatTreeParent(element) {
	if (element.assignedSlot) {
		return element.assignedSlot
	}
	if (element.parentNode instanceof ShadowRoot) {
		return element.parentNode.host
	}
	return element.parentNode
}
function offsetParentPolyfill(element) {
	// Do an initial walk to check for display:none ancestors.
	for (let ancestor = element; ancestor; ancestor = flatTreeParent(ancestor)) {
		if (!(ancestor instanceof Element)) {
			continue
		}
		if (getComputedStyle(ancestor).display === "none") {
			return null
		}
	}
	for (let ancestor = flatTreeParent(element); ancestor; ancestor = flatTreeParent(ancestor)) {
		if (!(ancestor instanceof Element)) {
			continue
		}
		const style = getComputedStyle(ancestor)
		// Display:contents nodes aren't in the layout tree so they should be skipped.
		if (style.display === "contents") {
			continue
		}
		if (style.position !== "static" || style.filter !== "none") {
			return ancestor
		}
		if (ancestor.tagName === "BODY") {
			return ancestor
		}
	}
	return null
}

function isVirtualElement(e) {
	return e !== null && typeof e === "object" && "getBoundingClientRect" in e
}
var SlPopup = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.active = false
		this.placement = "top"
		this.strategy = "absolute"
		this.distance = 0
		this.skidding = 0
		this.arrow = false
		this.arrowPlacement = "anchor"
		this.arrowPadding = 10
		this.flip = false
		this.flipFallbackPlacements = ""
		this.flipFallbackStrategy = "best-fit"
		this.flipPadding = 0
		this.shift = false
		this.shiftPadding = 0
		this.autoSizePadding = 0
		this.hoverBridge = false
		this.updateHoverBridge = () => {
			if (this.hoverBridge && this.anchorEl) {
				const anchorRect = this.anchorEl.getBoundingClientRect()
				const popupRect = this.popup.getBoundingClientRect()
				const isVertical = this.placement.includes("top") || this.placement.includes("bottom")
				let topLeftX = 0
				let topLeftY = 0
				let topRightX = 0
				let topRightY = 0
				let bottomLeftX = 0
				let bottomLeftY = 0
				let bottomRightX = 0
				let bottomRightY = 0
				if (isVertical) {
					if (anchorRect.top < popupRect.top) {
						topLeftX = anchorRect.left
						topLeftY = anchorRect.bottom
						topRightX = anchorRect.right
						topRightY = anchorRect.bottom
						bottomLeftX = popupRect.left
						bottomLeftY = popupRect.top
						bottomRightX = popupRect.right
						bottomRightY = popupRect.top
					} else {
						topLeftX = popupRect.left
						topLeftY = popupRect.bottom
						topRightX = popupRect.right
						topRightY = popupRect.bottom
						bottomLeftX = anchorRect.left
						bottomLeftY = anchorRect.top
						bottomRightX = anchorRect.right
						bottomRightY = anchorRect.top
					}
				} else {
					if (anchorRect.left < popupRect.left) {
						topLeftX = anchorRect.right
						topLeftY = anchorRect.top
						topRightX = popupRect.left
						topRightY = popupRect.top
						bottomLeftX = anchorRect.right
						bottomLeftY = anchorRect.bottom
						bottomRightX = popupRect.left
						bottomRightY = popupRect.bottom
					} else {
						topLeftX = popupRect.right
						topLeftY = popupRect.top
						topRightX = anchorRect.left
						topRightY = anchorRect.top
						bottomLeftX = popupRect.right
						bottomLeftY = popupRect.bottom
						bottomRightX = anchorRect.left
						bottomRightY = anchorRect.bottom
					}
				}
				this.style.setProperty("--hover-bridge-top-left-x", `${topLeftX}px`)
				this.style.setProperty("--hover-bridge-top-left-y", `${topLeftY}px`)
				this.style.setProperty("--hover-bridge-top-right-x", `${topRightX}px`)
				this.style.setProperty("--hover-bridge-top-right-y", `${topRightY}px`)
				this.style.setProperty("--hover-bridge-bottom-left-x", `${bottomLeftX}px`)
				this.style.setProperty("--hover-bridge-bottom-left-y", `${bottomLeftY}px`)
				this.style.setProperty("--hover-bridge-bottom-right-x", `${bottomRightX}px`)
				this.style.setProperty("--hover-bridge-bottom-right-y", `${bottomRightY}px`)
			}
		}
	}
	async connectedCallback() {
		super.connectedCallback()
		await this.updateComplete
		this.start()
	}
	disconnectedCallback() {
		super.disconnectedCallback()
		this.stop()
	}
	async updated(changedProps) {
		super.updated(changedProps)
		if (changedProps.has("active")) {
			if (this.active) {
				this.start()
			} else {
				this.stop()
			}
		}
		if (changedProps.has("anchor")) {
			this.handleAnchorChange()
		}
		if (this.active) {
			await this.updateComplete
			this.reposition()
		}
	}
	async handleAnchorChange() {
		await this.stop()
		if (this.anchor && typeof this.anchor === "string") {
			const root = this.getRootNode()
			this.anchorEl = root.getElementById(this.anchor)
		} else if (this.anchor instanceof Element || isVirtualElement(this.anchor)) {
			this.anchorEl = this.anchor
		} else {
			this.anchorEl = this.querySelector('[slot="anchor"]')
		}
		if (this.anchorEl instanceof HTMLSlotElement) {
			this.anchorEl = this.anchorEl.assignedElements({ flatten: true })[0]
		}
		if (this.anchorEl) {
			this.start()
		}
	}
	start() {
		if (!this.anchorEl) {
			return
		}
		this.cleanup = autoUpdate(this.anchorEl, this.popup, () => {
			this.reposition()
		})
	}
	async stop() {
		return new Promise((resolve) => {
			if (this.cleanup) {
				this.cleanup()
				this.cleanup = void 0
				this.removeAttribute("data-current-placement")
				this.style.removeProperty("--auto-size-available-width")
				this.style.removeProperty("--auto-size-available-height")
				requestAnimationFrame(() => resolve())
			} else {
				resolve()
			}
		})
	}
	/** Forces the popup to recalculate and reposition itself. */
	reposition() {
		if (!this.active || !this.anchorEl) {
			return
		}
		const middleware = [
			// The offset middleware goes first
			offset({ mainAxis: this.distance, crossAxis: this.skidding }),
		]
		if (this.sync) {
			middleware.push(
				size({
					apply: ({ rects }) => {
						const syncWidth = this.sync === "width" || this.sync === "both"
						const syncHeight = this.sync === "height" || this.sync === "both"
						this.popup.style.width = syncWidth ? `${rects.reference.width}px` : ""
						this.popup.style.height = syncHeight ? `${rects.reference.height}px` : ""
					},
				})
			)
		} else {
			this.popup.style.width = ""
			this.popup.style.height = ""
		}
		if (this.flip) {
			middleware.push(
				flip({
					boundary: this.flipBoundary,
					// @ts-expect-error - We're converting a string attribute to an array here
					fallbackPlacements: this.flipFallbackPlacements,
					fallbackStrategy:
						this.flipFallbackStrategy === "best-fit" ? "bestFit" : "initialPlacement",
					padding: this.flipPadding,
				})
			)
		}
		if (this.shift) {
			middleware.push(
				shift({
					boundary: this.shiftBoundary,
					padding: this.shiftPadding,
				})
			)
		}
		if (this.autoSize) {
			middleware.push(
				size({
					boundary: this.autoSizeBoundary,
					padding: this.autoSizePadding,
					apply: ({ availableWidth, availableHeight }) => {
						if (this.autoSize === "vertical" || this.autoSize === "both") {
							this.style.setProperty("--auto-size-available-height", `${availableHeight}px`)
						} else {
							this.style.removeProperty("--auto-size-available-height")
						}
						if (this.autoSize === "horizontal" || this.autoSize === "both") {
							this.style.setProperty("--auto-size-available-width", `${availableWidth}px`)
						} else {
							this.style.removeProperty("--auto-size-available-width")
						}
					},
				})
			)
		} else {
			this.style.removeProperty("--auto-size-available-width")
			this.style.removeProperty("--auto-size-available-height")
		}
		if (this.arrow) {
			middleware.push(
				arrow({
					element: this.arrowEl,
					padding: this.arrowPadding,
				})
			)
		}
		const getOffsetParent =
			this.strategy === "absolute"
				? (element) => platform.getOffsetParent(element, offsetParent)
				: platform.getOffsetParent
		computePosition(this.anchorEl, this.popup, {
			placement: this.placement,
			middleware,
			strategy: this.strategy,
			platform: __spreadProps(__spreadValues({}, platform), {
				getOffsetParent,
			}),
		}).then(({ x, y, middlewareData, placement }) => {
			const isRtl = getComputedStyle(this).direction === "rtl"
			const staticSide = { top: "bottom", right: "left", bottom: "top", left: "right" }[
				placement.split("-")[0]
			]
			this.setAttribute("data-current-placement", placement)
			Object.assign(this.popup.style, {
				left: `${x}px`,
				top: `${y}px`,
			})
			if (this.arrow) {
				const arrowX = middlewareData.arrow.x
				const arrowY = middlewareData.arrow.y
				let top = ""
				let right = ""
				let bottom = ""
				let left = ""
				if (this.arrowPlacement === "start") {
					const value =
						typeof arrowX === "number"
							? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))`
							: ""
					top =
						typeof arrowY === "number"
							? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))`
							: ""
					right = isRtl ? value : ""
					left = isRtl ? "" : value
				} else if (this.arrowPlacement === "end") {
					const value =
						typeof arrowX === "number"
							? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))`
							: ""
					right = isRtl ? "" : value
					left = isRtl ? value : ""
					bottom =
						typeof arrowY === "number"
							? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))`
							: ""
				} else if (this.arrowPlacement === "center") {
					left = typeof arrowX === "number" ? `calc(50% - var(--arrow-size-diagonal))` : ""
					top = typeof arrowY === "number" ? `calc(50% - var(--arrow-size-diagonal))` : ""
				} else {
					left = typeof arrowX === "number" ? `${arrowX}px` : ""
					top = typeof arrowY === "number" ? `${arrowY}px` : ""
				}
				Object.assign(this.arrowEl.style, {
					top,
					right,
					bottom,
					left,
					[staticSide]: "calc(var(--arrow-size-diagonal) * -1)",
				})
			}
		})
		requestAnimationFrame(() => this.updateHoverBridge())
		this.emit("sl-reposition")
	}
	render() {
		return ke$1`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${Rt({
					"popup-hover-bridge": true,
					"popup-hover-bridge--visible": this.hoverBridge && this.active,
				})}
      ></span>

      <div
        part="popup"
        class=${Rt({
					popup: true,
					"popup--active": this.active,
					"popup--fixed": this.strategy === "fixed",
					"popup--has-arrow": this.arrow,
				})}
      >
        <slot></slot>
        ${this.arrow ? ke$1`<div part="arrow" class="popup__arrow" role="presentation"></div>` : ""}
      </div>
    `
	}
}
SlPopup.styles = [component_styles_default, popup_styles_default]
__decorateClass([e$1(".popup")], SlPopup.prototype, "popup", 2)
__decorateClass([e$1(".popup__arrow")], SlPopup.prototype, "arrowEl", 2)
__decorateClass([n()], SlPopup.prototype, "anchor", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlPopup.prototype, "active", 2)
__decorateClass([n({ reflect: true })], SlPopup.prototype, "placement", 2)
__decorateClass([n({ reflect: true })], SlPopup.prototype, "strategy", 2)
__decorateClass([n({ type: Number })], SlPopup.prototype, "distance", 2)
__decorateClass([n({ type: Number })], SlPopup.prototype, "skidding", 2)
__decorateClass([n({ type: Boolean })], SlPopup.prototype, "arrow", 2)
__decorateClass([n({ attribute: "arrow-placement" })], SlPopup.prototype, "arrowPlacement", 2)
__decorateClass(
	[n({ attribute: "arrow-padding", type: Number })],
	SlPopup.prototype,
	"arrowPadding",
	2
)
__decorateClass([n({ type: Boolean })], SlPopup.prototype, "flip", 2)
__decorateClass(
	[
		n({
			attribute: "flip-fallback-placements",
			converter: {
				fromAttribute: (value) => {
					return value
						.split(" ")
						.map((p) => p.trim())
						.filter((p) => p !== "")
				},
				toAttribute: (value) => {
					return value.join(" ")
				},
			},
		}),
	],
	SlPopup.prototype,
	"flipFallbackPlacements",
	2
)
__decorateClass(
	[n({ attribute: "flip-fallback-strategy" })],
	SlPopup.prototype,
	"flipFallbackStrategy",
	2
)
__decorateClass([n({ type: Object })], SlPopup.prototype, "flipBoundary", 2)
__decorateClass(
	[n({ attribute: "flip-padding", type: Number })],
	SlPopup.prototype,
	"flipPadding",
	2
)
__decorateClass([n({ type: Boolean })], SlPopup.prototype, "shift", 2)
__decorateClass([n({ type: Object })], SlPopup.prototype, "shiftBoundary", 2)
__decorateClass(
	[n({ attribute: "shift-padding", type: Number })],
	SlPopup.prototype,
	"shiftPadding",
	2
)
__decorateClass([n({ attribute: "auto-size" })], SlPopup.prototype, "autoSize", 2)
__decorateClass([n()], SlPopup.prototype, "sync", 2)
__decorateClass([n({ type: Object })], SlPopup.prototype, "autoSizeBoundary", 2)
__decorateClass(
	[n({ attribute: "auto-size-padding", type: Number })],
	SlPopup.prototype,
	"autoSizePadding",
	2
)
__decorateClass(
	[n({ attribute: "hover-bridge", type: Boolean })],
	SlPopup.prototype,
	"hoverBridge",
	2
)

// src/internal/form.ts
var formCollections = /* @__PURE__ */ new WeakMap()
var reportValidityOverloads = /* @__PURE__ */ new WeakMap()
var checkValidityOverloads = /* @__PURE__ */ new WeakMap()
var userInteractedControls = /* @__PURE__ */ new WeakSet()
var interactions = /* @__PURE__ */ new WeakMap()
var FormControlController = class {
	constructor(host, options) {
		this.handleFormData = (event) => {
			const disabled = this.options.disabled(this.host)
			const name = this.options.name(this.host)
			const value = this.options.value(this.host)
			const isButton = this.host.tagName.toLowerCase() === "sl-button"
			if (
				this.host.isConnected &&
				!disabled &&
				!isButton &&
				typeof name === "string" &&
				name.length > 0 &&
				typeof value !== "undefined"
			) {
				if (Array.isArray(value)) {
					value.forEach((val) => {
						event.formData.append(name, val.toString())
					})
				} else {
					event.formData.append(name, value.toString())
				}
			}
		}
		this.handleFormSubmit = (event) => {
			var _a
			const disabled = this.options.disabled(this.host)
			const reportValidity = this.options.reportValidity
			if (this.form && !this.form.noValidate) {
				;(_a = formCollections.get(this.form)) == null
					? void 0
					: _a.forEach((control) => {
							this.setUserInteracted(control, true)
						})
			}
			if (this.form && !this.form.noValidate && !disabled && !reportValidity(this.host)) {
				event.preventDefault()
				event.stopImmediatePropagation()
			}
		}
		this.handleFormReset = () => {
			this.options.setValue(this.host, this.options.defaultValue(this.host))
			this.setUserInteracted(this.host, false)
			interactions.set(this.host, [])
		}
		this.handleInteraction = (event) => {
			const emittedEvents = interactions.get(this.host)
			if (!emittedEvents.includes(event.type)) {
				emittedEvents.push(event.type)
			}
			if (emittedEvents.length === this.options.assumeInteractionOn.length) {
				this.setUserInteracted(this.host, true)
			}
		}
		this.checkFormValidity = () => {
			if (this.form && !this.form.noValidate) {
				const elements = this.form.querySelectorAll("*")
				for (const element of elements) {
					if (typeof element.checkValidity === "function") {
						if (!element.checkValidity()) {
							return false
						}
					}
				}
			}
			return true
		}
		this.reportFormValidity = () => {
			if (this.form && !this.form.noValidate) {
				const elements = this.form.querySelectorAll("*")
				for (const element of elements) {
					if (typeof element.reportValidity === "function") {
						if (!element.reportValidity()) {
							return false
						}
					}
				}
			}
			return true
		}
		;(this.host = host).addController(this)
		this.options = __spreadValues(
			{
				form: (input) => {
					const formId = input.form
					if (formId) {
						const root = input.getRootNode()
						const form = root.getElementById(formId)
						if (form) {
							return form
						}
					}
					return input.closest("form")
				},
				name: (input) => input.name,
				value: (input) => input.value,
				defaultValue: (input) => input.defaultValue,
				disabled: (input) => {
					var _a
					return (_a = input.disabled) != null ? _a : false
				},
				reportValidity: (input) =>
					typeof input.reportValidity === "function" ? input.reportValidity() : true,
				checkValidity: (input) =>
					typeof input.checkValidity === "function" ? input.checkValidity() : true,
				setValue: (input, value) => (input.value = value),
				assumeInteractionOn: ["sl-input"],
			},
			options
		)
	}
	hostConnected() {
		const form = this.options.form(this.host)
		if (form) {
			this.attachForm(form)
		}
		interactions.set(this.host, [])
		this.options.assumeInteractionOn.forEach((event) => {
			this.host.addEventListener(event, this.handleInteraction)
		})
	}
	hostDisconnected() {
		this.detachForm()
		interactions.delete(this.host)
		this.options.assumeInteractionOn.forEach((event) => {
			this.host.removeEventListener(event, this.handleInteraction)
		})
	}
	hostUpdated() {
		const form = this.options.form(this.host)
		if (!form) {
			this.detachForm()
		}
		if (form && this.form !== form) {
			this.detachForm()
			this.attachForm(form)
		}
		if (this.host.hasUpdated) {
			this.setValidity(this.host.validity.valid)
		}
	}
	attachForm(form) {
		if (form) {
			this.form = form
			if (formCollections.has(this.form)) {
				formCollections.get(this.form).add(this.host)
			} else {
				formCollections.set(this.form, /* @__PURE__ */ new Set([this.host]))
			}
			this.form.addEventListener("formdata", this.handleFormData)
			this.form.addEventListener("submit", this.handleFormSubmit)
			this.form.addEventListener("reset", this.handleFormReset)
			if (!reportValidityOverloads.has(this.form)) {
				reportValidityOverloads.set(this.form, this.form.reportValidity)
				this.form.reportValidity = () => this.reportFormValidity()
			}
			if (!checkValidityOverloads.has(this.form)) {
				checkValidityOverloads.set(this.form, this.form.checkValidity)
				this.form.checkValidity = () => this.checkFormValidity()
			}
		} else {
			this.form = void 0
		}
	}
	detachForm() {
		if (!this.form) return
		const formCollection = formCollections.get(this.form)
		if (!formCollection) {
			return
		}
		formCollection.delete(this.host)
		if (formCollection.size <= 0) {
			this.form.removeEventListener("formdata", this.handleFormData)
			this.form.removeEventListener("submit", this.handleFormSubmit)
			this.form.removeEventListener("reset", this.handleFormReset)
			if (reportValidityOverloads.has(this.form)) {
				this.form.reportValidity = reportValidityOverloads.get(this.form)
				reportValidityOverloads.delete(this.form)
			}
			if (checkValidityOverloads.has(this.form)) {
				this.form.checkValidity = checkValidityOverloads.get(this.form)
				checkValidityOverloads.delete(this.form)
			}
			this.form = void 0
		}
	}
	setUserInteracted(el, hasInteracted) {
		if (hasInteracted) {
			userInteractedControls.add(el)
		} else {
			userInteractedControls.delete(el)
		}
		el.requestUpdate()
	}
	doAction(type, submitter) {
		if (this.form) {
			const button = document.createElement("button")
			button.type = type
			button.style.position = "absolute"
			button.style.width = "0"
			button.style.height = "0"
			button.style.clipPath = "inset(50%)"
			button.style.overflow = "hidden"
			button.style.whiteSpace = "nowrap"
			if (submitter) {
				button.name = submitter.name
				button.value = submitter.value
				;["formaction", "formenctype", "formmethod", "formnovalidate", "formtarget"].forEach(
					(attr) => {
						if (submitter.hasAttribute(attr)) {
							button.setAttribute(attr, submitter.getAttribute(attr))
						}
					}
				)
			}
			this.form.append(button)
			button.click()
			button.remove()
		}
	}
	/** Returns the associated `<form>` element, if one exists. */
	getForm() {
		var _a
		return (_a = this.form) != null ? _a : null
	}
	/** Resets the form, restoring all the control to their default value */
	reset(submitter) {
		this.doAction("reset", submitter)
	}
	/** Submits the form, triggering validation and form data injection. */
	submit(submitter) {
		this.doAction("submit", submitter)
	}
	/**
	 * Synchronously sets the form control's validity. Call this when you know the future validity but need to update
	 * the host element immediately, i.e. before Lit updates the component in the next update.
	 */
	setValidity(isValid) {
		const host = this.host
		const hasInteracted = Boolean(userInteractedControls.has(host))
		const required = Boolean(host.required)
		host.toggleAttribute("data-required", required)
		host.toggleAttribute("data-optional", !required)
		host.toggleAttribute("data-invalid", !isValid)
		host.toggleAttribute("data-valid", isValid)
		host.toggleAttribute("data-user-invalid", !isValid && hasInteracted)
		host.toggleAttribute("data-user-valid", isValid && hasInteracted)
	}
	/**
	 * Updates the form control's validity based on the current value of `host.validity.valid`. Call this when anything
	 * that affects constraint validation changes so the component receives the correct validity states.
	 */
	updateValidity() {
		const host = this.host
		this.setValidity(host.validity.valid)
	}
	/**
	 * Dispatches a non-bubbling, cancelable custom event of type `sl-invalid`.
	 * If the `sl-invalid` event will be cancelled then the original `invalid`
	 * event (which may have been passed as argument) will also be cancelled.
	 * If no original `invalid` event has been passed then the `sl-invalid`
	 * event will be cancelled before being dispatched.
	 */
	emitInvalidEvent(originalInvalidEvent) {
		const slInvalidEvent = new CustomEvent("sl-invalid", {
			bubbles: false,
			composed: false,
			cancelable: true,
			detail: {},
		})
		if (!originalInvalidEvent) {
			slInvalidEvent.preventDefault()
		}
		if (!this.host.dispatchEvent(slInvalidEvent)) {
			originalInvalidEvent == null ? void 0 : originalInvalidEvent.preventDefault()
		}
	}
}
var validValidityState = Object.freeze({
	badInput: false,
	customError: false,
	patternMismatch: false,
	rangeOverflow: false,
	rangeUnderflow: false,
	stepMismatch: false,
	tooLong: false,
	tooShort: false,
	typeMismatch: false,
	valid: true,
	valueMissing: false,
})
Object.freeze(
	__spreadProps(__spreadValues({}, validValidityState), {
		valid: false,
		valueMissing: true,
	})
)
Object.freeze(
	__spreadProps(__spreadValues({}, validValidityState), {
		valid: false,
		customError: true,
	})
)

// src/utilities/animation-registry.ts
var defaultAnimationRegistry = /* @__PURE__ */ new Map()
var customAnimationRegistry = /* @__PURE__ */ new WeakMap()
function ensureAnimation(animation) {
	return animation != null ? animation : { keyframes: [], options: { duration: 0 } }
}
function getLogicalAnimation(animation, dir) {
	if (dir.toLowerCase() === "rtl") {
		return {
			keyframes: animation.rtlKeyframes || animation.keyframes,
			options: animation.options,
		}
	}
	return animation
}
function setDefaultAnimation(animationName, animation) {
	defaultAnimationRegistry.set(animationName, ensureAnimation(animation))
}
function getAnimation(el, animationName, options) {
	const customAnimation = customAnimationRegistry.get(el)
	if (customAnimation == null ? void 0 : customAnimation[animationName]) {
		return getLogicalAnimation(customAnimation[animationName], options.dir)
	}
	const defaultAnimation = defaultAnimationRegistry.get(animationName)
	if (defaultAnimation) {
		return getLogicalAnimation(defaultAnimation, options.dir)
	}
	return {
		keyframes: [],
		options: { duration: 0 },
	}
}

// src/internal/event.ts
function waitForEvent(el, eventName) {
	return new Promise((resolve) => {
		function done(event) {
			if (event.target === el) {
				el.removeEventListener(eventName, done)
				resolve()
			}
		}
		el.addEventListener(eventName, done)
	})
}

// src/internal/animate.ts
function animateTo(el, keyframes, options) {
	return new Promise((resolve) => {
		if ((options == null ? void 0 : options.duration) === Infinity) {
			throw new Error("Promise-based animations must be finite.")
		}
		const animation = el.animate(
			keyframes,
			__spreadProps(__spreadValues({}, options), {
				duration: prefersReducedMotion() ? 0 : options.duration,
			})
		)
		animation.addEventListener("cancel", resolve, { once: true })
		animation.addEventListener("finish", resolve, { once: true })
	})
}
function prefersReducedMotion() {
	const query = window.matchMedia("(prefers-reduced-motion: reduce)")
	return query.matches
}
function stopAnimations(el) {
	return Promise.all(
		el.getAnimations().map((animation) => {
			return new Promise((resolve) => {
				animation.cancel()
				requestAnimationFrame(resolve)
			})
		})
	)
}

// src/internal/slot.ts
var HasSlotController = class {
	constructor(host, ...slotNames) {
		this.slotNames = []
		this.handleSlotChange = (event) => {
			const slot = event.target
			if (
				(this.slotNames.includes("[default]") && !slot.name) ||
				(slot.name && this.slotNames.includes(slot.name))
			) {
				this.host.requestUpdate()
			}
		}
		;(this.host = host).addController(this)
		this.slotNames = slotNames
	}
	hasDefaultSlot() {
		return [...this.host.childNodes].some((node) => {
			if (node.nodeType === node.TEXT_NODE && node.textContent.trim() !== "") {
				return true
			}
			if (node.nodeType === node.ELEMENT_NODE) {
				const el = node
				const tagName = el.tagName.toLowerCase()
				if (tagName === "sl-visually-hidden") {
					return false
				}
				if (!el.hasAttribute("slot")) {
					return true
				}
			}
			return false
		})
	}
	hasNamedSlot(name) {
		return this.host.querySelector(`:scope > [slot="${name}"]`) !== null
	}
	test(slotName) {
		return slotName === "[default]" ? this.hasDefaultSlot() : this.hasNamedSlot(slotName)
	}
	hostConnected() {
		this.host.shadowRoot.addEventListener("slotchange", this.handleSlotChange)
	}
	hostDisconnected() {
		this.host.shadowRoot.removeEventListener("slotchange", this.handleSlotChange)
	}
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ class le extends i {
	constructor(i) {
		if ((super(i), (this.it = D), i.type !== t.CHILD))
			throw Error(this.constructor.directiveName + "() can only be used in child bindings")
	}
	render(t) {
		if (t === D || null == t) return (this._t = void 0), (this.it = t)
		if (t === R) return t
		if ("string" != typeof t)
			throw Error(this.constructor.directiveName + "() called with a non-string value")
		if (t === this.it) return this._t
		this.it = t
		const i = [t]
		return (
			(i.raw = i), (this._t = { _$litType$: this.constructor.resultType, strings: i, values: [] })
		)
	}
}
;(le.directiveName = "unsafeHTML"), (le.resultType = 1)
const ae = e(le)

var SlSelect = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.formControlController = new FormControlController(this, {
			assumeInteractionOn: ["sl-blur", "sl-input"],
		})
		this.hasSlotController = new HasSlotController(this, "help-text", "label")
		this.localize = new LocalizeController(this)
		this.typeToSelectString = ""
		this.hasFocus = false
		this.displayLabel = ""
		this.selectedOptions = []
		this.name = ""
		this.value = ""
		this.defaultValue = ""
		this.size = "medium"
		this.placeholder = ""
		this.multiple = false
		this.maxOptionsVisible = 3
		this.disabled = false
		this.clearable = false
		this.open = false
		this.hoist = false
		this.filled = false
		this.pill = false
		this.label = ""
		this.placement = "bottom"
		this.helpText = ""
		this.form = ""
		this.required = false
		this.getTag = (option) => {
			return ke$1`
      <sl-tag
        part="tag"
        exportparts="
              base:tag__base,
              content:tag__content,
              remove-button:tag__remove-button,
              remove-button__base:tag__remove-button__base
            "
        ?pill=${this.pill}
        size=${this.size}
        removable
        @sl-remove=${(event) => this.handleTagRemove(event, option)}
      >
        ${option.getTextLabel()}
      </sl-tag>
    `
		}
		this.handleDocumentFocusIn = (event) => {
			const path = event.composedPath()
			if (this && !path.includes(this)) {
				this.hide()
			}
		}
		this.handleDocumentKeyDown = (event) => {
			const target = event.target
			const isClearButton = target.closest(".select__clear") !== null
			const isIconButton = target.closest("sl-icon-button") !== null
			if (isClearButton || isIconButton) {
				return
			}
			if (event.key === "Escape" && this.open && !this.closeWatcher) {
				event.preventDefault()
				event.stopPropagation()
				this.hide()
				this.displayInput.focus({ preventScroll: true })
			}
			if (event.key === "Enter" || (event.key === " " && this.typeToSelectString === "")) {
				event.preventDefault()
				event.stopImmediatePropagation()
				if (!this.open) {
					this.show()
					return
				}
				if (this.currentOption && !this.currentOption.disabled) {
					if (this.multiple) {
						this.toggleOptionSelection(this.currentOption)
					} else {
						this.setSelectedOptions(this.currentOption)
					}
					this.updateComplete.then(() => {
						this.emit("sl-input")
						this.emit("sl-change")
					})
					if (!this.multiple) {
						this.hide()
						this.displayInput.focus({ preventScroll: true })
					}
				}
				return
			}
			if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
				const allOptions = this.getAllOptions()
				const currentIndex = allOptions.indexOf(this.currentOption)
				let newIndex = Math.max(0, currentIndex)
				event.preventDefault()
				if (!this.open) {
					this.show()
					if (this.currentOption) {
						return
					}
				}
				if (event.key === "ArrowDown") {
					newIndex = currentIndex + 1
					if (newIndex > allOptions.length - 1) newIndex = 0
				} else if (event.key === "ArrowUp") {
					newIndex = currentIndex - 1
					if (newIndex < 0) newIndex = allOptions.length - 1
				} else if (event.key === "Home") {
					newIndex = 0
				} else if (event.key === "End") {
					newIndex = allOptions.length - 1
				}
				this.setCurrentOption(allOptions[newIndex])
			}
			if (event.key.length === 1 || event.key === "Backspace") {
				const allOptions = this.getAllOptions()
				if (event.metaKey || event.ctrlKey || event.altKey) {
					return
				}
				if (!this.open) {
					if (event.key === "Backspace") {
						return
					}
					this.show()
				}
				event.stopPropagation()
				event.preventDefault()
				clearTimeout(this.typeToSelectTimeout)
				this.typeToSelectTimeout = window.setTimeout(() => (this.typeToSelectString = ""), 1e3)
				if (event.key === "Backspace") {
					this.typeToSelectString = this.typeToSelectString.slice(0, -1)
				} else {
					this.typeToSelectString += event.key.toLowerCase()
				}
				for (const option of allOptions) {
					const label = option.getTextLabel().toLowerCase()
					if (label.startsWith(this.typeToSelectString)) {
						this.setCurrentOption(option)
						break
					}
				}
			}
		}
		this.handleDocumentMouseDown = (event) => {
			const path = event.composedPath()
			if (this && !path.includes(this)) {
				this.hide()
			}
		}
	}
	/** Gets the validity state object */
	get validity() {
		return this.valueInput.validity
	}
	/** Gets the validation message */
	get validationMessage() {
		return this.valueInput.validationMessage
	}
	connectedCallback() {
		super.connectedCallback()
		this.open = false
	}
	addOpenListeners() {
		var _a
		const root = this.getRootNode()
		if ("CloseWatcher" in window) {
			;(_a = this.closeWatcher) == null ? void 0 : _a.destroy()
			this.closeWatcher = new CloseWatcher()
			this.closeWatcher.onclose = () => {
				if (this.open) {
					this.hide()
					this.displayInput.focus({ preventScroll: true })
				}
			}
		}
		root.addEventListener("focusin", this.handleDocumentFocusIn)
		root.addEventListener("keydown", this.handleDocumentKeyDown)
		root.addEventListener("mousedown", this.handleDocumentMouseDown)
	}
	removeOpenListeners() {
		var _a
		const root = this.getRootNode()
		root.removeEventListener("focusin", this.handleDocumentFocusIn)
		root.removeEventListener("keydown", this.handleDocumentKeyDown)
		root.removeEventListener("mousedown", this.handleDocumentMouseDown)
		;(_a = this.closeWatcher) == null ? void 0 : _a.destroy()
	}
	handleFocus() {
		this.hasFocus = true
		this.displayInput.setSelectionRange(0, 0)
		this.emit("sl-focus")
	}
	handleBlur() {
		this.hasFocus = false
		this.emit("sl-blur")
	}
	handleLabelClick() {
		this.displayInput.focus()
	}
	handleComboboxMouseDown(event) {
		const path = event.composedPath()
		const isIconButton = path.some(
			(el) => el instanceof Element && el.tagName.toLowerCase() === "sl-icon-button"
		)
		if (this.disabled || isIconButton) {
			return
		}
		event.preventDefault()
		this.displayInput.focus({ preventScroll: true })
		this.open = !this.open
	}
	handleComboboxKeyDown(event) {
		if (event.key === "Tab") {
			return
		}
		event.stopPropagation()
		this.handleDocumentKeyDown(event)
	}
	handleClearClick(event) {
		event.stopPropagation()
		if (this.value !== "") {
			this.setSelectedOptions([])
			this.displayInput.focus({ preventScroll: true })
			this.updateComplete.then(() => {
				this.emit("sl-clear")
				this.emit("sl-input")
				this.emit("sl-change")
			})
		}
	}
	handleClearMouseDown(event) {
		event.stopPropagation()
		event.preventDefault()
	}
	handleOptionClick(event) {
		const target = event.target
		const option = target.closest("sl-option")
		const oldValue = this.value
		if (option && !option.disabled) {
			if (this.multiple) {
				this.toggleOptionSelection(option)
			} else {
				this.setSelectedOptions(option)
			}
			this.updateComplete.then(() => this.displayInput.focus({ preventScroll: true }))
			if (this.value !== oldValue) {
				this.updateComplete.then(() => {
					this.emit("sl-input")
					this.emit("sl-change")
				})
			}
			if (!this.multiple) {
				this.hide()
				this.displayInput.focus({ preventScroll: true })
			}
		}
	}
	handleDefaultSlotChange() {
		const allOptions = this.getAllOptions()
		const value = Array.isArray(this.value) ? this.value : [this.value]
		const values = []
		if (customElements.get("sl-option")) {
			allOptions.forEach((option) => values.push(option.value))
			this.setSelectedOptions(allOptions.filter((el) => value.includes(el.value)))
		} else {
			customElements.whenDefined("sl-option").then(() => this.handleDefaultSlotChange())
		}
	}
	handleTagRemove(event, option) {
		event.stopPropagation()
		if (!this.disabled) {
			this.toggleOptionSelection(option, false)
			this.updateComplete.then(() => {
				this.emit("sl-input")
				this.emit("sl-change")
			})
		}
	}
	// Gets an array of all <sl-option> elements
	getAllOptions() {
		return [...this.querySelectorAll("sl-option")]
	}
	// Gets the first <sl-option> element
	getFirstOption() {
		return this.querySelector("sl-option")
	}
	// Sets the current option, which is the option the user is currently interacting with (e.g. via keyboard). Only one
	// option may be "current" at a time.
	setCurrentOption(option) {
		const allOptions = this.getAllOptions()
		allOptions.forEach((el) => {
			el.current = false
			el.tabIndex = -1
		})
		if (option) {
			this.currentOption = option
			option.current = true
			option.tabIndex = 0
			option.focus()
		}
	}
	// Sets the selected option(s)
	setSelectedOptions(option) {
		const allOptions = this.getAllOptions()
		const newSelectedOptions = Array.isArray(option) ? option : [option]
		allOptions.forEach((el) => (el.selected = false))
		if (newSelectedOptions.length) {
			newSelectedOptions.forEach((el) => (el.selected = true))
		}
		this.selectionChanged()
	}
	// Toggles an option's selected state
	toggleOptionSelection(option, force) {
		if (force === true || force === false) {
			option.selected = force
		} else {
			option.selected = !option.selected
		}
		this.selectionChanged()
	}
	// This method must be called whenever the selection changes. It will update the selected options cache, the current
	// value, and the display value
	selectionChanged() {
		var _a, _b, _c, _d
		this.selectedOptions = this.getAllOptions().filter((el) => el.selected)
		if (this.multiple) {
			this.value = this.selectedOptions.map((el) => el.value)
			if (this.placeholder && this.value.length === 0) {
				this.displayLabel = ""
			} else {
				this.displayLabel = this.localize.term("numOptionsSelected", this.selectedOptions.length)
			}
		} else {
			this.value =
				(_b = (_a = this.selectedOptions[0]) == null ? void 0 : _a.value) != null ? _b : ""
			this.displayLabel =
				(_d = (_c = this.selectedOptions[0]) == null ? void 0 : _c.getTextLabel()) != null ? _d : ""
		}
		this.updateComplete.then(() => {
			this.formControlController.updateValidity()
		})
	}
	get tags() {
		return this.selectedOptions.map((option, index) => {
			if (index < this.maxOptionsVisible || this.maxOptionsVisible <= 0) {
				const tag = this.getTag(option, index)
				return ke$1`<div @sl-remove=${(e) => this.handleTagRemove(e, option)}>
          ${typeof tag === "string" ? ae(tag) : tag}
        </div>`
			} else if (index === this.maxOptionsVisible) {
				return ke$1`<sl-tag>+${this.selectedOptions.length - index}</sl-tag>`
			}
			return ke$1``
		})
	}
	handleInvalid(event) {
		this.formControlController.setValidity(false)
		this.formControlController.emitInvalidEvent(event)
	}
	handleDisabledChange() {
		if (this.disabled) {
			this.open = false
			this.handleOpenChange()
		}
	}
	handleValueChange() {
		const allOptions = this.getAllOptions()
		const value = Array.isArray(this.value) ? this.value : [this.value]
		this.setSelectedOptions(allOptions.filter((el) => value.includes(el.value)))
	}
	async handleOpenChange() {
		if (this.open && !this.disabled) {
			this.setCurrentOption(this.selectedOptions[0] || this.getFirstOption())
			this.emit("sl-show")
			this.addOpenListeners()
			await stopAnimations(this)
			this.listbox.hidden = false
			this.popup.active = true
			requestAnimationFrame(() => {
				this.setCurrentOption(this.currentOption)
			})
			const { keyframes, options } = getAnimation(this, "select.show", { dir: this.localize.dir() })
			await animateTo(this.popup.popup, keyframes, options)
			if (this.currentOption) {
				scrollIntoView(this.currentOption, this.listbox, "vertical", "auto")
			}
			this.emit("sl-after-show")
		} else {
			this.emit("sl-hide")
			this.removeOpenListeners()
			await stopAnimations(this)
			const { keyframes, options } = getAnimation(this, "select.hide", { dir: this.localize.dir() })
			await animateTo(this.popup.popup, keyframes, options)
			this.listbox.hidden = true
			this.popup.active = false
			this.emit("sl-after-hide")
		}
	}
	/** Shows the listbox. */
	async show() {
		if (this.open || this.disabled) {
			this.open = false
			return void 0
		}
		this.open = true
		return waitForEvent(this, "sl-after-show")
	}
	/** Hides the listbox. */
	async hide() {
		if (!this.open || this.disabled) {
			this.open = false
			return void 0
		}
		this.open = false
		return waitForEvent(this, "sl-after-hide")
	}
	/** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
	checkValidity() {
		return this.valueInput.checkValidity()
	}
	/** Gets the associated form, if one exists. */
	getForm() {
		return this.formControlController.getForm()
	}
	/** Checks for validity and shows the browser's validation message if the control is invalid. */
	reportValidity() {
		return this.valueInput.reportValidity()
	}
	/** Sets a custom validation message. Pass an empty string to restore validity. */
	setCustomValidity(message) {
		this.valueInput.setCustomValidity(message)
		this.formControlController.updateValidity()
	}
	/** Sets focus on the control. */
	focus(options) {
		this.displayInput.focus(options)
	}
	/** Removes focus from the control. */
	blur() {
		this.displayInput.blur()
	}
	render() {
		const hasLabelSlot = this.hasSlotController.test("label")
		const hasHelpTextSlot = this.hasSlotController.test("help-text")
		const hasLabel = this.label ? true : !!hasLabelSlot
		const hasHelpText = this.helpText ? true : !!hasHelpTextSlot
		const hasClearIcon = this.clearable && !this.disabled && this.value.length > 0
		const isPlaceholderVisible = this.placeholder && this.value.length === 0
		return ke$1`
      <div
        part="form-control"
        class=${Rt({
					"form-control": true,
					"form-control--small": this.size === "small",
					"form-control--medium": this.size === "medium",
					"form-control--large": this.size === "large",
					"form-control--has-label": hasLabel,
					"form-control--has-help-text": hasHelpText,
				})}
      >
        <label
          id="label"
          part="form-control-label"
          class="form-control__label"
          aria-hidden=${hasLabel ? "false" : "true"}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <sl-popup
            class=${Rt({
							select: true,
							"select--standard": true,
							"select--filled": this.filled,
							"select--pill": this.pill,
							"select--open": this.open,
							"select--disabled": this.disabled,
							"select--multiple": this.multiple,
							"select--focused": this.hasFocus,
							"select--placeholder-visible": isPlaceholderVisible,
							"select--top": this.placement === "top",
							"select--bottom": this.placement === "bottom",
							"select--small": this.size === "small",
							"select--medium": this.size === "medium",
							"select--large": this.size === "large",
						})}
            placement=${this.placement}
            strategy=${this.hoist ? "fixed" : "absolute"}
            flip
            shift
            sync="width"
            auto-size="vertical"
            auto-size-padding="10"
          >
            <div
              part="combobox"
              class="select__combobox"
              slot="anchor"
              @keydown=${this.handleComboboxKeyDown}
              @mousedown=${this.handleComboboxMouseDown}
            >
              <slot part="prefix" name="prefix" class="select__prefix"></slot>

              <input
                part="display-input"
                class="select__display-input"
                type="text"
                placeholder=${this.placeholder}
                .disabled=${this.disabled}
                .value=${this.displayLabel}
                autocomplete="off"
                spellcheck="false"
                autocapitalize="off"
                readonly
                aria-controls="listbox"
                aria-expanded=${this.open ? "true" : "false"}
                aria-haspopup="listbox"
                aria-labelledby="label"
                aria-disabled=${this.disabled ? "true" : "false"}
                aria-describedby="help-text"
                role="combobox"
                tabindex="0"
                @focus=${this.handleFocus}
                @blur=${this.handleBlur}
              />

              ${this.multiple ? ke$1`<div part="tags" class="select__tags">${this.tags}</div>` : ""}

              <input
                class="select__value-input"
                type="text"
                ?disabled=${this.disabled}
                ?required=${this.required}
                .value=${Array.isArray(this.value) ? this.value.join(", ") : this.value}
                tabindex="-1"
                aria-hidden="true"
                @focus=${() => this.focus()}
                @invalid=${this.handleInvalid}
              />

              ${
								hasClearIcon
									? ke$1`
                    <button
                      part="clear-button"
                      class="select__clear"
                      type="button"
                      aria-label=${this.localize.term("clearEntry")}
                      @mousedown=${this.handleClearMouseDown}
                      @click=${this.handleClearClick}
                      tabindex="-1"
                    >
                      <slot name="clear-icon">
                        <sl-icon name="x-circle-fill" library="system"></sl-icon>
                      </slot>
                    </button>
                  `
									: ""
							}

              <slot name="expand-icon" part="expand-icon" class="select__expand-icon">
                <sl-icon library="system" name="chevron-down"></sl-icon>
              </slot>
            </div>

            <div
              id="listbox"
              role="listbox"
              aria-expanded=${this.open ? "true" : "false"}
              aria-multiselectable=${this.multiple ? "true" : "false"}
              aria-labelledby="label"
              part="listbox"
              class="select__listbox"
              tabindex="-1"
              @mouseup=${this.handleOptionClick}
              @slotchange=${this.handleDefaultSlotChange}
            >
              <slot></slot>
            </div>
          </sl-popup>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${hasHelpText ? "false" : "true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `
	}
}
SlSelect.styles = [component_styles_default, form_control_styles_default, select_styles_default]
SlSelect.dependencies = {
	"sl-icon": SlIcon,
	"sl-popup": SlPopup,
	"sl-tag": SlTag,
}
__decorateClass([e$1(".select")], SlSelect.prototype, "popup", 2)
__decorateClass([e$1(".select__combobox")], SlSelect.prototype, "combobox", 2)
__decorateClass([e$1(".select__display-input")], SlSelect.prototype, "displayInput", 2)
__decorateClass([e$1(".select__value-input")], SlSelect.prototype, "valueInput", 2)
__decorateClass([e$1(".select__listbox")], SlSelect.prototype, "listbox", 2)
__decorateClass([r()], SlSelect.prototype, "hasFocus", 2)
__decorateClass([r()], SlSelect.prototype, "displayLabel", 2)
__decorateClass([r()], SlSelect.prototype, "currentOption", 2)
__decorateClass([r()], SlSelect.prototype, "selectedOptions", 2)
__decorateClass([n()], SlSelect.prototype, "name", 2)
__decorateClass(
	[
		n({
			converter: {
				fromAttribute: (value) => value.split(" "),
				toAttribute: (value) => value.join(" "),
			},
		}),
	],
	SlSelect.prototype,
	"value",
	2
)
__decorateClass([defaultValue()], SlSelect.prototype, "defaultValue", 2)
__decorateClass([n({ reflect: true })], SlSelect.prototype, "size", 2)
__decorateClass([n()], SlSelect.prototype, "placeholder", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlSelect.prototype, "multiple", 2)
__decorateClass(
	[n({ attribute: "max-options-visible", type: Number })],
	SlSelect.prototype,
	"maxOptionsVisible",
	2
)
__decorateClass([n({ type: Boolean, reflect: true })], SlSelect.prototype, "disabled", 2)
__decorateClass([n({ type: Boolean })], SlSelect.prototype, "clearable", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlSelect.prototype, "open", 2)
__decorateClass([n({ type: Boolean })], SlSelect.prototype, "hoist", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlSelect.prototype, "filled", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlSelect.prototype, "pill", 2)
__decorateClass([n()], SlSelect.prototype, "label", 2)
__decorateClass([n({ reflect: true })], SlSelect.prototype, "placement", 2)
__decorateClass([n({ attribute: "help-text" })], SlSelect.prototype, "helpText", 2)
__decorateClass([n({ reflect: true })], SlSelect.prototype, "form", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlSelect.prototype, "required", 2)
__decorateClass([n()], SlSelect.prototype, "getTag", 2)
__decorateClass(
	[watch("disabled", { waitUntilFirstUpdate: true })],
	SlSelect.prototype,
	"handleDisabledChange",
	1
)
__decorateClass(
	[watch("value", { waitUntilFirstUpdate: true })],
	SlSelect.prototype,
	"handleValueChange",
	1
)
__decorateClass(
	[watch("open", { waitUntilFirstUpdate: true })],
	SlSelect.prototype,
	"handleOpenChange",
	1
)
setDefaultAnimation("select.show", {
	keyframes: [
		{ opacity: 0, scale: 0.9 },
		{ opacity: 1, scale: 1 },
	],
	options: { duration: 100, easing: "ease" },
})
setDefaultAnimation("select.hide", {
	keyframes: [
		{ opacity: 1, scale: 1 },
		{ opacity: 0, scale: 0.9 },
	],
	options: { duration: 100, easing: "ease" },
})

// src/components/option/option.styles.ts
var option_styles_default = i$2`
  :host {
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:focus) {
    outline: none;
  }

  .option {
    position: relative;
    display: flex;
    align-items: center;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-letter-spacing-normal);
    color: var(--sl-color-neutral-700);
    padding: var(--sl-spacing-x-small) var(--sl-spacing-medium) var(--sl-spacing-x-small) var(--sl-spacing-x-small);
    transition: var(--sl-transition-fast) fill;
    cursor: pointer;
  }

  .option--hover:not(.option--current):not(.option--disabled) {
    background-color: var(--sl-color-neutral-100);
    color: var(--sl-color-neutral-1000);
  }

  .option--current,
  .option--current.option--disabled {
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
    opacity: 1;
  }

  .option--disabled {
    outline: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option__label {
    flex: 1 1 auto;
    display: inline-block;
    line-height: var(--sl-line-height-dense);
  }

  .option .option__check {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
    padding-inline-end: var(--sl-spacing-2x-small);
  }

  .option--selected .option__check {
    visibility: visible;
  }

  .option__prefix,
  .option__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .option__prefix::slotted(*) {
    margin-inline-end: var(--sl-spacing-x-small);
  }

  .option__suffix::slotted(*) {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  @media (forced-colors: active) {
    :host(:hover:not([aria-disabled='true'])) .option {
      outline: dashed 1px SelectedItem;
      outline-offset: -1px;
    }
  }
`

var SlOption = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		// @ts-expect-error - Controller is currently unused
		this.localize = new LocalizeController(this)
		this.current = false
		this.selected = false
		this.hasHover = false
		this.value = ""
		this.disabled = false
	}
	connectedCallback() {
		super.connectedCallback()
		this.setAttribute("role", "option")
		this.setAttribute("aria-selected", "false")
	}
	handleDefaultSlotChange() {
		const textLabel = this.getTextLabel()
		if (typeof this.cachedTextLabel === "undefined") {
			this.cachedTextLabel = textLabel
			return
		}
		if (textLabel !== this.cachedTextLabel) {
			this.cachedTextLabel = textLabel
			this.emit("slotchange", { bubbles: true, composed: false, cancelable: false })
		}
	}
	handleMouseEnter() {
		this.hasHover = true
	}
	handleMouseLeave() {
		this.hasHover = false
	}
	handleDisabledChange() {
		this.setAttribute("aria-disabled", this.disabled ? "true" : "false")
	}
	handleSelectedChange() {
		this.setAttribute("aria-selected", this.selected ? "true" : "false")
	}
	handleValueChange() {
		if (typeof this.value !== "string") {
			this.value = String(this.value)
		}
		if (this.value.includes(" ")) {
			console.error(
				`Option values cannot include a space. All spaces have been replaced with underscores.`,
				this
			)
			this.value = this.value.replace(/ /g, "_")
		}
	}
	/** Returns a plain text label based on the option's content. */
	getTextLabel() {
		const nodes = this.childNodes
		let label = ""
		;[...nodes].forEach((node) => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (!node.hasAttribute("slot")) {
					label += node.textContent
				}
			}
			if (node.nodeType === Node.TEXT_NODE) {
				label += node.textContent
			}
		})
		return label.trim()
	}
	render() {
		return ke$1`
      <div
        part="base"
        class=${Rt({
					option: true,
					"option--current": this.current,
					"option--disabled": this.disabled,
					"option--selected": this.selected,
					"option--hover": this.hasHover,
				})}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
      >
        <sl-icon part="checked-icon" class="option__check" name="check" library="system" aria-hidden="true"></sl-icon>
        <slot part="prefix" name="prefix" class="option__prefix"></slot>
        <slot part="label" class="option__label" @slotchange=${this.handleDefaultSlotChange}></slot>
        <slot part="suffix" name="suffix" class="option__suffix"></slot>
      </div>
    `
	}
}
SlOption.styles = [component_styles_default, option_styles_default]
SlOption.dependencies = { "sl-icon": SlIcon }
__decorateClass([e$1(".option__label")], SlOption.prototype, "defaultSlot", 2)
__decorateClass([r()], SlOption.prototype, "current", 2)
__decorateClass([r()], SlOption.prototype, "selected", 2)
__decorateClass([r()], SlOption.prototype, "hasHover", 2)
__decorateClass([n({ reflect: true })], SlOption.prototype, "value", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlOption.prototype, "disabled", 2)
__decorateClass([watch("disabled")], SlOption.prototype, "handleDisabledChange", 1)
__decorateClass([watch("selected")], SlOption.prototype, "handleSelectedChange", 1)
__decorateClass([watch("value")], SlOption.prototype, "handleValueChange", 1)

// src/components/input/input.styles.ts
var input_styles_default = i$2`
  :host {
    display: block;
  }

  .input {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: stretch;
    justify-content: start;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: text;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  /* Standard inputs */
  .input--standard {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .input--standard:hover:not(.input--disabled) {
    background-color: var(--sl-input-background-color-hover);
    border-color: var(--sl-input-border-color-hover);
  }

  .input--standard.input--focused:not(.input--disabled) {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  .input--standard.input--focused:not(.input--disabled) .input__control {
    color: var(--sl-input-color-focus);
  }

  .input--standard.input--disabled {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input--standard.input--disabled .input__control {
    color: var(--sl-input-color-disabled);
  }

  .input--standard.input--disabled .input__control::placeholder {
    color: var(--sl-input-placeholder-color-disabled);
  }

  /* Filled inputs */
  .input--filled {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .input--filled:hover:not(.input--disabled) {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .input--filled.input--focused:not(.input--disabled) {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .input--filled.input--disabled {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input__control {
    flex: 1 1 auto;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    min-width: 0;
    height: 100%;
    color: var(--sl-input-color);
    border: none;
    background: inherit;
    box-shadow: none;
    padding: 0;
    margin: 0;
    cursor: inherit;
    -webkit-appearance: none;
  }

  .input__control::-webkit-search-decoration,
  .input__control::-webkit-search-cancel-button,
  .input__control::-webkit-search-results-button,
  .input__control::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .input__control:-webkit-autofill,
  .input__control:-webkit-autofill:hover,
  .input__control:-webkit-autofill:focus,
  .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) var(--sl-input-background-color-hover) inset !important;
    -webkit-text-fill-color: var(--sl-color-primary-500);
    caret-color: var(--sl-input-color);
  }

  .input--filled .input__control:-webkit-autofill,
  .input--filled .input__control:-webkit-autofill:hover,
  .input--filled .input__control:-webkit-autofill:focus,
  .input--filled .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) var(--sl-input-filled-background-color) inset !important;
  }

  .input__control::placeholder {
    color: var(--sl-input-placeholder-color);
    user-select: none;
    -webkit-user-select: none;
  }

  .input:hover:not(.input--disabled) .input__control {
    color: var(--sl-input-color-hover);
  }

  .input__control:focus {
    outline: none;
  }

  .input__prefix,
  .input__suffix {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;
  }

  .input__prefix ::slotted(sl-icon),
  .input__suffix ::slotted(sl-icon) {
    color: var(--sl-input-icon-color);
  }

  /*
   * Size modifiers
   */

  .input--small {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    height: var(--sl-input-height-small);
  }

  .input--small .input__control {
    height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-small);
  }

  .input--small .input__clear,
  .input--small .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-small) * 2);
  }

  .input--small .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .input--small .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-small);
  }

  .input--medium {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    height: var(--sl-input-height-medium);
  }

  .input--medium .input__control {
    height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-medium);
  }

  .input--medium .input__clear,
  .input--medium .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-medium) * 2);
  }

  .input--medium .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .input--medium .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-medium);
  }

  .input--large {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    height: var(--sl-input-height-large);
  }

  .input--large .input__control {
    height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-large);
  }

  .input--large .input__clear,
  .input--large .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-large) * 2);
  }

  .input--large .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .input--large .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-large);
  }

  /*
   * Pill modifier
   */

  .input--pill.input--small {
    border-radius: var(--sl-input-height-small);
  }

  .input--pill.input--medium {
    border-radius: var(--sl-input-height-medium);
  }

  .input--pill.input--large {
    border-radius: var(--sl-input-height-large);
  }

  /*
   * Clearable + Password Toggle
   */

  .input__clear:not(.input__clear--visible) {
    visibility: hidden;
  }

  .input__clear,
  .input__password-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: inherit;
    color: var(--sl-input-icon-color);
    border: none;
    background: none;
    padding: 0;
    transition: var(--sl-transition-fast) color;
    cursor: pointer;
  }

  .input__clear:hover,
  .input__password-toggle:hover {
    color: var(--sl-input-icon-color-hover);
  }

  .input__clear:focus,
  .input__password-toggle:focus {
    outline: none;
  }

  .input--empty .input__clear {
    visibility: hidden;
  }

  /* Don't show the browser's password toggle in Edge */
  ::-ms-reveal {
    display: none;
  }

  /* Hide the built-in number spinner */
  .input--no-spin-buttons input[type='number']::-webkit-outer-spin-button,
  .input--no-spin-buttons input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    display: none;
  }

  .input--no-spin-buttons input[type='number'] {
    -moz-appearance: textfield;
  }
`

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ const Ft = e(
	class extends i {
		constructor(r) {
			if (
				(super(r),
				r.type !== t.PROPERTY && r.type !== t.ATTRIBUTE && r.type !== t.BOOLEAN_ATTRIBUTE)
			)
				throw Error("The `live` directive is not allowed on child or event bindings")
			if (!rt(r)) throw Error("`live` bindings can only contain a single expression")
		}
		render(r) {
			return r
		}
		update(r, [e]) {
			if (e === R || e === D) return e
			const i = r.element,
				n = r.name
			if (r.type === t.PROPERTY) {
				if (e === i[n]) return R
			} else if (r.type === t.BOOLEAN_ATTRIBUTE) {
				if (!!e === i.hasAttribute(n)) return R
			} else if (r.type === t.ATTRIBUTE && i.getAttribute(n) === e + "") return R
			return dt(r), e
		}
	}
)

var SlInput = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.formControlController = new FormControlController(this, {
			assumeInteractionOn: ["sl-blur", "sl-input"],
		})
		this.hasSlotController = new HasSlotController(this, "help-text", "label")
		this.localize = new LocalizeController(this)
		this.hasFocus = false
		this.title = ""
		// make reactive to pass through
		this.__numberInput = Object.assign(document.createElement("input"), { type: "number" })
		this.__dateInput = Object.assign(document.createElement("input"), { type: "date" })
		this.type = "text"
		this.name = ""
		this.value = ""
		this.defaultValue = ""
		this.size = "medium"
		this.filled = false
		this.pill = false
		this.label = ""
		this.helpText = ""
		this.clearable = false
		this.disabled = false
		this.placeholder = ""
		this.readonly = false
		this.passwordToggle = false
		this.passwordVisible = false
		this.noSpinButtons = false
		this.form = ""
		this.required = false
		this.spellcheck = true
	}
	//
	// NOTE: We use an in-memory input for these getters/setters instead of the one in the template because the properties
	// can be set before the component is rendered.
	//
	/**
	 * Gets or sets the current value as a `Date` object. Returns `null` if the value can't be converted. This will use the native `<input type="{{type}}">` implementation and may result in an error.
	 */
	get valueAsDate() {
		var _a
		this.__dateInput.type = this.type
		this.__dateInput.value = this.value
		return ((_a = this.input) == null ? void 0 : _a.valueAsDate) || this.__dateInput.valueAsDate
	}
	set valueAsDate(newValue) {
		this.__dateInput.type = this.type
		this.__dateInput.valueAsDate = newValue
		this.value = this.__dateInput.value
	}
	/** Gets or sets the current value as a number. Returns `NaN` if the value can't be converted. */
	get valueAsNumber() {
		var _a
		this.__numberInput.value = this.value
		return (
			((_a = this.input) == null ? void 0 : _a.valueAsNumber) || this.__numberInput.valueAsNumber
		)
	}
	set valueAsNumber(newValue) {
		this.__numberInput.valueAsNumber = newValue
		this.value = this.__numberInput.value
	}
	/** Gets the validity state object */
	get validity() {
		return this.input.validity
	}
	/** Gets the validation message */
	get validationMessage() {
		return this.input.validationMessage
	}
	firstUpdated() {
		this.formControlController.updateValidity()
	}
	handleBlur() {
		this.hasFocus = false
		this.emit("sl-blur")
	}
	handleChange() {
		this.value = this.input.value
		this.emit("sl-change")
	}
	handleClearClick(event) {
		this.value = ""
		this.emit("sl-clear")
		this.emit("sl-input")
		this.emit("sl-change")
		this.input.focus()
		event.stopPropagation()
	}
	handleFocus() {
		this.hasFocus = true
		this.emit("sl-focus")
	}
	handleInput() {
		this.value = this.input.value
		this.formControlController.updateValidity()
		this.emit("sl-input")
	}
	handleInvalid(event) {
		this.formControlController.setValidity(false)
		this.formControlController.emitInvalidEvent(event)
	}
	handleKeyDown(event) {
		const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
		if (event.key === "Enter" && !hasModifier) {
			setTimeout(() => {
				if (!event.defaultPrevented && !event.isComposing) {
					this.formControlController.submit()
				}
			})
		}
	}
	handlePasswordToggle() {
		this.passwordVisible = !this.passwordVisible
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled)
	}
	handleStepChange() {
		this.input.step = String(this.step)
		this.formControlController.updateValidity()
	}
	async handleValueChange() {
		await this.updateComplete
		this.formControlController.updateValidity()
	}
	/** Sets focus on the input. */
	focus(options) {
		this.input.focus(options)
	}
	/** Removes focus from the input. */
	blur() {
		this.input.blur()
	}
	/** Selects all the text in the input. */
	select() {
		this.input.select()
	}
	/** Sets the start and end positions of the text selection (0-based). */
	setSelectionRange(selectionStart, selectionEnd, selectionDirection = "none") {
		this.input.setSelectionRange(selectionStart, selectionEnd, selectionDirection)
	}
	/** Replaces a range of text with a new string. */
	setRangeText(replacement, start, end, selectMode = "preserve") {
		const selectionStart = start != null ? start : this.input.selectionStart
		const selectionEnd = end != null ? end : this.input.selectionEnd
		this.input.setRangeText(replacement, selectionStart, selectionEnd, selectMode)
		if (this.value !== this.input.value) {
			this.value = this.input.value
		}
	}
	/** Displays the browser picker for an input element (only works if the browser supports it for the input type). */
	showPicker() {
		if ("showPicker" in HTMLInputElement.prototype) {
			this.input.showPicker()
		}
	}
	/** Increments the value of a numeric input type by the value of the step attribute. */
	stepUp() {
		this.input.stepUp()
		if (this.value !== this.input.value) {
			this.value = this.input.value
		}
	}
	/** Decrements the value of a numeric input type by the value of the step attribute. */
	stepDown() {
		this.input.stepDown()
		if (this.value !== this.input.value) {
			this.value = this.input.value
		}
	}
	/** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
	checkValidity() {
		return this.input.checkValidity()
	}
	/** Gets the associated form, if one exists. */
	getForm() {
		return this.formControlController.getForm()
	}
	/** Checks for validity and shows the browser's validation message if the control is invalid. */
	reportValidity() {
		return this.input.reportValidity()
	}
	/** Sets a custom validation message. Pass an empty string to restore validity. */
	setCustomValidity(message) {
		this.input.setCustomValidity(message)
		this.formControlController.updateValidity()
	}
	render() {
		const hasLabelSlot = this.hasSlotController.test("label")
		const hasHelpTextSlot = this.hasSlotController.test("help-text")
		const hasLabel = this.label ? true : !!hasLabelSlot
		const hasHelpText = this.helpText ? true : !!hasHelpTextSlot
		const hasClearIcon = this.clearable && !this.disabled && !this.readonly
		const isClearIconVisible =
			hasClearIcon && (typeof this.value === "number" || this.value.length > 0)
		return ke$1`
      <div
        part="form-control"
        class=${Rt({
					"form-control": true,
					"form-control--small": this.size === "small",
					"form-control--medium": this.size === "medium",
					"form-control--large": this.size === "large",
					"form-control--has-label": hasLabel,
					"form-control--has-help-text": hasHelpText,
				})}
      >
        <label
          part="form-control-label"
          class="form-control__label"
          for="input"
          aria-hidden=${hasLabel ? "false" : "true"}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <div
            part="base"
            class=${Rt({
							input: true,
							// Sizes
							"input--small": this.size === "small",
							"input--medium": this.size === "medium",
							"input--large": this.size === "large",
							// States
							"input--pill": this.pill,
							"input--standard": !this.filled,
							"input--filled": this.filled,
							"input--disabled": this.disabled,
							"input--focused": this.hasFocus,
							"input--empty": !this.value,
							"input--no-spin-buttons": this.noSpinButtons,
						})}
          >
            <span part="prefix" class="input__prefix">
              <slot name="prefix"></slot>
            </span>

            <input
              part="input"
              id="input"
              class="input__control"
              type=${this.type === "password" && this.passwordVisible ? "text" : this.type}
              title=${this.title}
              name=${to(this.name)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              placeholder=${to(this.placeholder)}
              minlength=${to(this.minlength)}
              maxlength=${to(this.maxlength)}
              min=${to(this.min)}
              max=${to(this.max)}
              step=${to(this.step)}
              .value=${Ft(this.value)}
              autocapitalize=${to(this.autocapitalize)}
              autocomplete=${to(this.autocomplete)}
              autocorrect=${to(this.autocorrect)}
              ?autofocus=${this.autofocus}
              spellcheck=${this.spellcheck}
              pattern=${to(this.pattern)}
              enterkeyhint=${to(this.enterkeyhint)}
              inputmode=${to(this.inputmode)}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @keydown=${this.handleKeyDown}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
            />

            ${
							hasClearIcon
								? ke$1`
                  <button
                    part="clear-button"
                    class=${Rt({
											input__clear: true,
											"input__clear--visible": isClearIconVisible,
										})}
                    type="button"
                    aria-label=${this.localize.term("clearEntry")}
                    @click=${this.handleClearClick}
                    tabindex="-1"
                  >
                    <slot name="clear-icon">
                      <sl-icon name="x-circle-fill" library="system"></sl-icon>
                    </slot>
                  </button>
                `
								: ""
						}
            ${
							this.passwordToggle && !this.disabled
								? ke$1`
                  <button
                    part="password-toggle-button"
                    class="input__password-toggle"
                    type="button"
                    aria-label=${this.localize.term(this.passwordVisible ? "hidePassword" : "showPassword")}
                    @click=${this.handlePasswordToggle}
                    tabindex="-1"
                  >
                    ${
											this.passwordVisible
												? ke$1`
                          <slot name="show-password-icon">
                            <sl-icon name="eye-slash" library="system"></sl-icon>
                          </slot>
                        `
												: ke$1`
                          <slot name="hide-password-icon">
                            <sl-icon name="eye" library="system"></sl-icon>
                          </slot>
                        `
										}
                  </button>
                `
								: ""
						}

            <span part="suffix" class="input__suffix">
              <slot name="suffix"></slot>
            </span>
          </div>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${hasHelpText ? "false" : "true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `
	}
}
SlInput.styles = [component_styles_default, form_control_styles_default, input_styles_default]
SlInput.dependencies = { "sl-icon": SlIcon }
__decorateClass([e$1(".input__control")], SlInput.prototype, "input", 2)
__decorateClass([r()], SlInput.prototype, "hasFocus", 2)
__decorateClass([n()], SlInput.prototype, "title", 2)
__decorateClass([n({ reflect: true })], SlInput.prototype, "type", 2)
__decorateClass([n()], SlInput.prototype, "name", 2)
__decorateClass([n()], SlInput.prototype, "value", 2)
__decorateClass([defaultValue()], SlInput.prototype, "defaultValue", 2)
__decorateClass([n({ reflect: true })], SlInput.prototype, "size", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlInput.prototype, "filled", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlInput.prototype, "pill", 2)
__decorateClass([n()], SlInput.prototype, "label", 2)
__decorateClass([n({ attribute: "help-text" })], SlInput.prototype, "helpText", 2)
__decorateClass([n({ type: Boolean })], SlInput.prototype, "clearable", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlInput.prototype, "disabled", 2)
__decorateClass([n()], SlInput.prototype, "placeholder", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlInput.prototype, "readonly", 2)
__decorateClass(
	[n({ attribute: "password-toggle", type: Boolean })],
	SlInput.prototype,
	"passwordToggle",
	2
)
__decorateClass(
	[n({ attribute: "password-visible", type: Boolean })],
	SlInput.prototype,
	"passwordVisible",
	2
)
__decorateClass(
	[n({ attribute: "no-spin-buttons", type: Boolean })],
	SlInput.prototype,
	"noSpinButtons",
	2
)
__decorateClass([n({ reflect: true })], SlInput.prototype, "form", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlInput.prototype, "required", 2)
__decorateClass([n()], SlInput.prototype, "pattern", 2)
__decorateClass([n({ type: Number })], SlInput.prototype, "minlength", 2)
__decorateClass([n({ type: Number })], SlInput.prototype, "maxlength", 2)
__decorateClass([n()], SlInput.prototype, "min", 2)
__decorateClass([n()], SlInput.prototype, "max", 2)
__decorateClass([n()], SlInput.prototype, "step", 2)
__decorateClass([n()], SlInput.prototype, "autocapitalize", 2)
__decorateClass([n()], SlInput.prototype, "autocorrect", 2)
__decorateClass([n()], SlInput.prototype, "autocomplete", 2)
__decorateClass([n({ type: Boolean })], SlInput.prototype, "autofocus", 2)
__decorateClass([n()], SlInput.prototype, "enterkeyhint", 2)
__decorateClass(
	[
		n({
			type: Boolean,
			converter: {
				// Allow "true|false" attribute values but keep the property boolean
				fromAttribute: (value) => (!value || value === "false" ? false : true),
				toAttribute: (value) => (value ? "true" : "false"),
			},
		}),
	],
	SlInput.prototype,
	"spellcheck",
	2
)
__decorateClass([n()], SlInput.prototype, "inputmode", 2)
__decorateClass(
	[watch("disabled", { waitUntilFirstUpdate: true })],
	SlInput.prototype,
	"handleDisabledChange",
	1
)
__decorateClass(
	[watch("step", { waitUntilFirstUpdate: true })],
	SlInput.prototype,
	"handleStepChange",
	1
)
__decorateClass(
	[watch("value", { waitUntilFirstUpdate: true })],
	SlInput.prototype,
	"handleValueChange",
	1
)

// src/components/spinner/spinner.styles.ts
var spinner_styles_default = i$2`
  :host {
    --track-width: 2px;
    --track-color: rgb(128 128 128 / 25%);
    --indicator-color: var(--sl-color-primary-600);
    --speed: 2s;

    display: inline-flex;
    width: 1em;
    height: 1em;
    flex: none;
  }

  .spinner {
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
  }

  .spinner__track,
  .spinner__indicator {
    fill: none;
    stroke-width: var(--track-width);
    r: calc(0.5em - var(--track-width) / 2);
    cx: 0.5em;
    cy: 0.5em;
    transform-origin: 50% 50%;
  }

  .spinner__track {
    stroke: var(--track-color);
    transform-origin: 0% 0%;
  }

  .spinner__indicator {
    stroke: var(--indicator-color);
    stroke-linecap: round;
    stroke-dasharray: 150% 75%;
    animation: spin var(--speed) linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
      stroke-dasharray: 0.05em, 3em;
    }

    50% {
      transform: rotate(450deg);
      stroke-dasharray: 1.375em, 1.375em;
    }

    100% {
      transform: rotate(1080deg);
      stroke-dasharray: 0.05em, 3em;
    }
  }
`

var SlSpinner = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.localize = new LocalizeController(this)
	}
	render() {
		return ke$1`
      <svg part="base" class="spinner" role="progressbar" aria-label=${this.localize.term("loading")}>
        <circle class="spinner__track"></circle>
        <circle class="spinner__indicator"></circle>
      </svg>
    `
	}
}
SlSpinner.styles = [component_styles_default, spinner_styles_default]

// src/components/button/button.styles.ts
var button_styles_default = i$2`
  :host {
    display: inline-block;
    position: relative;
    width: auto;
    cursor: pointer;
  }

  .button {
    display: inline-flex;
    align-items: stretch;
    justify-content: center;
    width: 100%;
    border-style: solid;
    border-width: var(--sl-input-border-width);
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-font-weight-semibold);
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    white-space: nowrap;
    vertical-align: middle;
    padding: 0;
    transition:
      var(--sl-transition-x-fast) background-color,
      var(--sl-transition-x-fast) color,
      var(--sl-transition-x-fast) border,
      var(--sl-transition-x-fast) box-shadow;
    cursor: inherit;
  }

  .button::-moz-focus-inner {
    border: 0;
  }

  .button:focus {
    outline: none;
  }

  .button:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* When disabled, prevent mouse events from bubbling up from children */
  .button--disabled * {
    pointer-events: none;
  }

  .button__prefix,
  .button__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .button__label {
    display: inline-block;
  }

  .button__label::slotted(sl-icon) {
    vertical-align: -2px;
  }

  /*
   * Standard buttons
   */

  /* Default */
  .button--standard.button--default {
    background-color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-neutral-300);
    color: var(--sl-color-neutral-700);
  }

  .button--standard.button--default:hover:not(.button--disabled) {
    background-color: var(--sl-color-primary-50);
    border-color: var(--sl-color-primary-300);
    color: var(--sl-color-primary-700);
  }

  .button--standard.button--default:active:not(.button--disabled) {
    background-color: var(--sl-color-primary-100);
    border-color: var(--sl-color-primary-400);
    color: var(--sl-color-primary-700);
  }

  /* Primary */
  .button--standard.button--primary {
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--primary:hover:not(.button--disabled) {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--primary:active:not(.button--disabled) {
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
  }

  /* Success */
  .button--standard.button--success {
    background-color: var(--sl-color-success-600);
    border-color: var(--sl-color-success-600);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--success:hover:not(.button--disabled) {
    background-color: var(--sl-color-success-500);
    border-color: var(--sl-color-success-500);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--success:active:not(.button--disabled) {
    background-color: var(--sl-color-success-600);
    border-color: var(--sl-color-success-600);
    color: var(--sl-color-neutral-0);
  }

  /* Neutral */
  .button--standard.button--neutral {
    background-color: var(--sl-color-neutral-600);
    border-color: var(--sl-color-neutral-600);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--neutral:hover:not(.button--disabled) {
    background-color: var(--sl-color-neutral-500);
    border-color: var(--sl-color-neutral-500);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--neutral:active:not(.button--disabled) {
    background-color: var(--sl-color-neutral-600);
    border-color: var(--sl-color-neutral-600);
    color: var(--sl-color-neutral-0);
  }

  /* Warning */
  .button--standard.button--warning {
    background-color: var(--sl-color-warning-600);
    border-color: var(--sl-color-warning-600);
    color: var(--sl-color-neutral-0);
  }
  .button--standard.button--warning:hover:not(.button--disabled) {
    background-color: var(--sl-color-warning-500);
    border-color: var(--sl-color-warning-500);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--warning:active:not(.button--disabled) {
    background-color: var(--sl-color-warning-600);
    border-color: var(--sl-color-warning-600);
    color: var(--sl-color-neutral-0);
  }

  /* Danger */
  .button--standard.button--danger {
    background-color: var(--sl-color-danger-600);
    border-color: var(--sl-color-danger-600);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--danger:hover:not(.button--disabled) {
    background-color: var(--sl-color-danger-500);
    border-color: var(--sl-color-danger-500);
    color: var(--sl-color-neutral-0);
  }

  .button--standard.button--danger:active:not(.button--disabled) {
    background-color: var(--sl-color-danger-600);
    border-color: var(--sl-color-danger-600);
    color: var(--sl-color-neutral-0);
  }

  /*
   * Outline buttons
   */

  .button--outline {
    background: none;
    border: solid 1px;
  }

  /* Default */
  .button--outline.button--default {
    border-color: var(--sl-color-neutral-300);
    color: var(--sl-color-neutral-700);
  }

  .button--outline.button--default:hover:not(.button--disabled),
  .button--outline.button--default.button--checked:not(.button--disabled) {
    border-color: var(--sl-color-primary-600);
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
  }

  .button--outline.button--default:active:not(.button--disabled) {
    border-color: var(--sl-color-primary-700);
    background-color: var(--sl-color-primary-700);
    color: var(--sl-color-neutral-0);
  }

  /* Primary */
  .button--outline.button--primary {
    border-color: var(--sl-color-primary-600);
    color: var(--sl-color-primary-600);
  }

  .button--outline.button--primary:hover:not(.button--disabled),
  .button--outline.button--primary.button--checked:not(.button--disabled) {
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
  }

  .button--outline.button--primary:active:not(.button--disabled) {
    border-color: var(--sl-color-primary-700);
    background-color: var(--sl-color-primary-700);
    color: var(--sl-color-neutral-0);
  }

  /* Success */
  .button--outline.button--success {
    border-color: var(--sl-color-success-600);
    color: var(--sl-color-success-600);
  }

  .button--outline.button--success:hover:not(.button--disabled),
  .button--outline.button--success.button--checked:not(.button--disabled) {
    background-color: var(--sl-color-success-600);
    color: var(--sl-color-neutral-0);
  }

  .button--outline.button--success:active:not(.button--disabled) {
    border-color: var(--sl-color-success-700);
    background-color: var(--sl-color-success-700);
    color: var(--sl-color-neutral-0);
  }

  /* Neutral */
  .button--outline.button--neutral {
    border-color: var(--sl-color-neutral-600);
    color: var(--sl-color-neutral-600);
  }

  .button--outline.button--neutral:hover:not(.button--disabled),
  .button--outline.button--neutral.button--checked:not(.button--disabled) {
    background-color: var(--sl-color-neutral-600);
    color: var(--sl-color-neutral-0);
  }

  .button--outline.button--neutral:active:not(.button--disabled) {
    border-color: var(--sl-color-neutral-700);
    background-color: var(--sl-color-neutral-700);
    color: var(--sl-color-neutral-0);
  }

  /* Warning */
  .button--outline.button--warning {
    border-color: var(--sl-color-warning-600);
    color: var(--sl-color-warning-600);
  }

  .button--outline.button--warning:hover:not(.button--disabled),
  .button--outline.button--warning.button--checked:not(.button--disabled) {
    background-color: var(--sl-color-warning-600);
    color: var(--sl-color-neutral-0);
  }

  .button--outline.button--warning:active:not(.button--disabled) {
    border-color: var(--sl-color-warning-700);
    background-color: var(--sl-color-warning-700);
    color: var(--sl-color-neutral-0);
  }

  /* Danger */
  .button--outline.button--danger {
    border-color: var(--sl-color-danger-600);
    color: var(--sl-color-danger-600);
  }

  .button--outline.button--danger:hover:not(.button--disabled),
  .button--outline.button--danger.button--checked:not(.button--disabled) {
    background-color: var(--sl-color-danger-600);
    color: var(--sl-color-neutral-0);
  }

  .button--outline.button--danger:active:not(.button--disabled) {
    border-color: var(--sl-color-danger-700);
    background-color: var(--sl-color-danger-700);
    color: var(--sl-color-neutral-0);
  }

  @media (forced-colors: active) {
    .button.button--outline.button--checked:not(.button--disabled) {
      outline: solid 2px transparent;
    }
  }

  /*
   * Text buttons
   */

  .button--text {
    background-color: transparent;
    border-color: transparent;
    color: var(--sl-color-primary-600);
  }

  .button--text:hover:not(.button--disabled) {
    background-color: transparent;
    border-color: transparent;
    color: var(--sl-color-primary-500);
  }

  .button--text:focus-visible:not(.button--disabled) {
    background-color: transparent;
    border-color: transparent;
    color: var(--sl-color-primary-500);
  }

  .button--text:active:not(.button--disabled) {
    background-color: transparent;
    border-color: transparent;
    color: var(--sl-color-primary-700);
  }

  /*
   * Size modifiers
   */

  .button--small {
    height: auto;
    min-height: var(--sl-input-height-small);
    font-size: var(--sl-button-font-size-small);
    line-height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-small);
  }

  .button--medium {
    height: auto;
    min-height: var(--sl-input-height-medium);
    font-size: var(--sl-button-font-size-medium);
    line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-medium);
  }

  .button--large {
    height: auto;
    min-height: var(--sl-input-height-large);
    font-size: var(--sl-button-font-size-large);
    line-height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-large);
  }

  /*
   * Pill modifier
   */

  .button--pill.button--small {
    border-radius: var(--sl-input-height-small);
  }

  .button--pill.button--medium {
    border-radius: var(--sl-input-height-medium);
  }

  .button--pill.button--large {
    border-radius: var(--sl-input-height-large);
  }

  /*
   * Circle modifier
   */

  .button--circle {
    padding-left: 0;
    padding-right: 0;
  }

  .button--circle.button--small {
    width: var(--sl-input-height-small);
    border-radius: 50%;
  }

  .button--circle.button--medium {
    width: var(--sl-input-height-medium);
    border-radius: 50%;
  }

  .button--circle.button--large {
    width: var(--sl-input-height-large);
    border-radius: 50%;
  }

  .button--circle .button__prefix,
  .button--circle .button__suffix,
  .button--circle .button__caret {
    display: none;
  }

  /*
   * Caret modifier
   */

  .button--caret .button__suffix {
    display: none;
  }

  .button--caret .button__caret {
    height: auto;
  }

  /*
   * Loading modifier
   */

  .button--loading {
    position: relative;
    cursor: wait;
  }

  .button--loading .button__prefix,
  .button--loading .button__label,
  .button--loading .button__suffix,
  .button--loading .button__caret {
    visibility: hidden;
  }

  .button--loading sl-spinner {
    --indicator-color: currentColor;
    position: absolute;
    font-size: 1em;
    height: 1em;
    width: 1em;
    top: calc(50% - 0.5em);
    left: calc(50% - 0.5em);
  }

  /*
   * Badges
   */

  .button ::slotted(sl-badge) {
    position: absolute;
    top: 0;
    right: 0;
    translate: 50% -50%;
    pointer-events: none;
  }

  .button--rtl ::slotted(sl-badge) {
    right: auto;
    left: 0;
    translate: -50% -50%;
  }

  /*
   * Button spacing
   */

  .button--has-label.button--small .button__label {
    padding: 0 var(--sl-spacing-small);
  }

  .button--has-label.button--medium .button__label {
    padding: 0 var(--sl-spacing-medium);
  }

  .button--has-label.button--large .button__label {
    padding: 0 var(--sl-spacing-large);
  }

  .button--has-prefix.button--small {
    padding-inline-start: var(--sl-spacing-x-small);
  }

  .button--has-prefix.button--small .button__label {
    padding-inline-start: var(--sl-spacing-x-small);
  }

  .button--has-prefix.button--medium {
    padding-inline-start: var(--sl-spacing-small);
  }

  .button--has-prefix.button--medium .button__label {
    padding-inline-start: var(--sl-spacing-small);
  }

  .button--has-prefix.button--large {
    padding-inline-start: var(--sl-spacing-small);
  }

  .button--has-prefix.button--large .button__label {
    padding-inline-start: var(--sl-spacing-small);
  }

  .button--has-suffix.button--small,
  .button--caret.button--small {
    padding-inline-end: var(--sl-spacing-x-small);
  }

  .button--has-suffix.button--small .button__label,
  .button--caret.button--small .button__label {
    padding-inline-end: var(--sl-spacing-x-small);
  }

  .button--has-suffix.button--medium,
  .button--caret.button--medium {
    padding-inline-end: var(--sl-spacing-small);
  }

  .button--has-suffix.button--medium .button__label,
  .button--caret.button--medium .button__label {
    padding-inline-end: var(--sl-spacing-small);
  }

  .button--has-suffix.button--large,
  .button--caret.button--large {
    padding-inline-end: var(--sl-spacing-small);
  }

  .button--has-suffix.button--large .button__label,
  .button--caret.button--large .button__label {
    padding-inline-end: var(--sl-spacing-small);
  }

  /*
   * Button groups support a variety of button types (e.g. buttons with tooltips, buttons as dropdown triggers, etc.).
   * This means buttons aren't always direct descendants of the button group, thus we can't target them with the
   * ::slotted selector. To work around this, the button group component does some magic to add these special classes to
   * buttons and we style them here instead.
   */

  :host(.sl-button-group__button--first:not(.sl-button-group__button--last)) .button {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  :host(.sl-button-group__button--inner) .button {
    border-radius: 0;
  }

  :host(.sl-button-group__button--last:not(.sl-button-group__button--first)) .button {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  /* All except the first */
  :host(.sl-button-group__button:not(.sl-button-group__button--first)) {
    margin-inline-start: calc(-1 * var(--sl-input-border-width));
  }

  /* Add a visual separator between solid buttons */
  :host(
      .sl-button-group__button:not(
          .sl-button-group__button--first,
          .sl-button-group__button--radio,
          [variant='default']
        ):not(:hover)
    )
    .button:after {
    content: '';
    position: absolute;
    top: 0;
    inset-inline-start: 0;
    bottom: 0;
    border-left: solid 1px rgb(128 128 128 / 33%);
    mix-blend-mode: multiply;
  }

  /* Bump hovered, focused, and checked buttons up so their focus ring isn't clipped */
  :host(.sl-button-group__button--hover) {
    z-index: 1;
  }

  /* Focus and checked are always on top */
  :host(.sl-button-group__button--focus),
  :host(.sl-button-group__button[checked]) {
    z-index: 2;
  }
`

var SlButton = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.formControlController = new FormControlController(this, {
			assumeInteractionOn: ["click"],
		})
		this.hasSlotController = new HasSlotController(this, "[default]", "prefix", "suffix")
		this.localize = new LocalizeController(this)
		this.hasFocus = false
		this.invalid = false
		this.title = ""
		this.variant = "default"
		this.size = "medium"
		this.caret = false
		this.disabled = false
		this.loading = false
		this.outline = false
		this.pill = false
		this.circle = false
		this.type = "button"
		this.name = ""
		this.value = ""
		this.href = ""
		this.rel = "noreferrer noopener"
	}
	/** Gets the validity state object */
	get validity() {
		if (this.isButton()) {
			return this.button.validity
		}
		return validValidityState
	}
	/** Gets the validation message */
	get validationMessage() {
		if (this.isButton()) {
			return this.button.validationMessage
		}
		return ""
	}
	firstUpdated() {
		if (this.isButton()) {
			this.formControlController.updateValidity()
		}
	}
	handleBlur() {
		this.hasFocus = false
		this.emit("sl-blur")
	}
	handleFocus() {
		this.hasFocus = true
		this.emit("sl-focus")
	}
	handleClick() {
		if (this.type === "submit") {
			this.formControlController.submit(this)
		}
		if (this.type === "reset") {
			this.formControlController.reset(this)
		}
	}
	handleInvalid(event) {
		this.formControlController.setValidity(false)
		this.formControlController.emitInvalidEvent(event)
	}
	isButton() {
		return this.href ? false : true
	}
	isLink() {
		return this.href ? true : false
	}
	handleDisabledChange() {
		if (this.isButton()) {
			this.formControlController.setValidity(this.disabled)
		}
	}
	/** Simulates a click on the button. */
	click() {
		this.button.click()
	}
	/** Sets focus on the button. */
	focus(options) {
		this.button.focus(options)
	}
	/** Removes focus from the button. */
	blur() {
		this.button.blur()
	}
	/** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
	checkValidity() {
		if (this.isButton()) {
			return this.button.checkValidity()
		}
		return true
	}
	/** Gets the associated form, if one exists. */
	getForm() {
		return this.formControlController.getForm()
	}
	/** Checks for validity and shows the browser's validation message if the control is invalid. */
	reportValidity() {
		if (this.isButton()) {
			return this.button.reportValidity()
		}
		return true
	}
	/** Sets a custom validation message. Pass an empty string to restore validity. */
	setCustomValidity(message) {
		if (this.isButton()) {
			this.button.setCustomValidity(message)
			this.formControlController.updateValidity()
		}
	}
	render() {
		const isLink = this.isLink()
		const tag = isLink ? er`a` : er`button`
		return ke`
      <${tag}
        part="base"
        class=${Rt({
					button: true,
					"button--default": this.variant === "default",
					"button--primary": this.variant === "primary",
					"button--success": this.variant === "success",
					"button--neutral": this.variant === "neutral",
					"button--warning": this.variant === "warning",
					"button--danger": this.variant === "danger",
					"button--text": this.variant === "text",
					"button--small": this.size === "small",
					"button--medium": this.size === "medium",
					"button--large": this.size === "large",
					"button--caret": this.caret,
					"button--circle": this.circle,
					"button--disabled": this.disabled,
					"button--focused": this.hasFocus,
					"button--loading": this.loading,
					"button--standard": !this.outline,
					"button--outline": this.outline,
					"button--pill": this.pill,
					"button--rtl": this.localize.dir() === "rtl",
					"button--has-label": this.hasSlotController.test("[default]"),
					"button--has-prefix": this.hasSlotController.test("prefix"),
					"button--has-suffix": this.hasSlotController.test("suffix"),
				})}
        ?disabled=${to(isLink ? void 0 : this.disabled)}
        type=${to(isLink ? void 0 : this.type)}
        title=${this.title}
        name=${to(isLink ? void 0 : this.name)}
        value=${to(isLink ? void 0 : this.value)}
        href=${to(isLink ? this.href : void 0)}
        target=${to(isLink ? this.target : void 0)}
        download=${to(isLink ? this.download : void 0)}
        rel=${to(isLink ? this.rel : void 0)}
        role=${to(isLink ? void 0 : "button")}
        aria-disabled=${this.disabled ? "true" : "false"}
        tabindex=${this.disabled ? "-1" : "0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @invalid=${this.isButton() ? this.handleInvalid : null}
        @click=${this.handleClick}
      >
        <slot name="prefix" part="prefix" class="button__prefix"></slot>
        <slot part="label" class="button__label"></slot>
        <slot name="suffix" part="suffix" class="button__suffix"></slot>
        ${this.caret ? ke` <sl-icon part="caret" class="button__caret" library="system" name="caret"></sl-icon> ` : ""}
        ${this.loading ? ke`<sl-spinner part="spinner"></sl-spinner>` : ""}
      </${tag}>
    `
	}
}
SlButton.styles = [component_styles_default, button_styles_default]
SlButton.dependencies = {
	"sl-icon": SlIcon,
	"sl-spinner": SlSpinner,
}
__decorateClass([e$1(".button")], SlButton.prototype, "button", 2)
__decorateClass([r()], SlButton.prototype, "hasFocus", 2)
__decorateClass([r()], SlButton.prototype, "invalid", 2)
__decorateClass([n()], SlButton.prototype, "title", 2)
__decorateClass([n({ reflect: true })], SlButton.prototype, "variant", 2)
__decorateClass([n({ reflect: true })], SlButton.prototype, "size", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlButton.prototype, "caret", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlButton.prototype, "disabled", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlButton.prototype, "loading", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlButton.prototype, "outline", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlButton.prototype, "pill", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlButton.prototype, "circle", 2)
__decorateClass([n()], SlButton.prototype, "type", 2)
__decorateClass([n()], SlButton.prototype, "name", 2)
__decorateClass([n()], SlButton.prototype, "value", 2)
__decorateClass([n()], SlButton.prototype, "href", 2)
__decorateClass([n()], SlButton.prototype, "target", 2)
__decorateClass([n()], SlButton.prototype, "rel", 2)
__decorateClass([n()], SlButton.prototype, "download", 2)
__decorateClass([n()], SlButton.prototype, "form", 2)
__decorateClass([n({ attribute: "formaction" })], SlButton.prototype, "formAction", 2)
__decorateClass([n({ attribute: "formenctype" })], SlButton.prototype, "formEnctype", 2)
__decorateClass([n({ attribute: "formmethod" })], SlButton.prototype, "formMethod", 2)
__decorateClass(
	[n({ attribute: "formnovalidate", type: Boolean })],
	SlButton.prototype,
	"formNoValidate",
	2
)
__decorateClass([n({ attribute: "formtarget" })], SlButton.prototype, "formTarget", 2)
__decorateClass(
	[watch("disabled", { waitUntilFirstUpdate: true })],
	SlButton.prototype,
	"handleDisabledChange",
	1
)

// src/components/checkbox/checkbox.styles.ts
var checkbox_styles_default = i$2`
  :host {
    display: inline-block;
  }

  .checkbox {
    position: relative;
    display: inline-flex;
    align-items: flex-start;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    color: var(--sl-input-label-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .checkbox--small {
    --toggle-size: var(--sl-toggle-size-small);
    font-size: var(--sl-input-font-size-small);
  }

  .checkbox--medium {
    --toggle-size: var(--sl-toggle-size-medium);
    font-size: var(--sl-input-font-size-medium);
  }

  .checkbox--large {
    --toggle-size: var(--sl-toggle-size-large);
    font-size: var(--sl-input-font-size-large);
  }

  .checkbox__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--toggle-size);
    height: var(--toggle-size);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
    border-radius: 2px;
    background-color: var(--sl-input-background-color);
    color: var(--sl-color-neutral-0);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
  }

  .checkbox__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  .checkbox__checked-icon,
  .checkbox__indeterminate-icon {
    display: inline-flex;
    width: var(--toggle-size);
    height: var(--toggle-size);
  }

  /* Hover */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__control:hover {
    border-color: var(--sl-input-border-color-hover);
    background-color: var(--sl-input-background-color-hover);
  }

  /* Focus */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Checked/indeterminate */
  .checkbox--checked .checkbox__control,
  .checkbox--indeterminate .checkbox__control {
    border-color: var(--sl-color-primary-600);
    background-color: var(--sl-color-primary-600);
  }

  /* Checked/indeterminate + hover */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__control:hover,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__control:hover {
    border-color: var(--sl-color-primary-500);
    background-color: var(--sl-color-primary-500);
  }

  /* Checked/indeterminate + focus */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Disabled */
  .checkbox--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .checkbox__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    line-height: var(--toggle-size);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) .checkbox__label::after {
    content: var(--sl-input-required-content);
    margin-inline-start: var(--sl-input-required-content-offset);
  }
`

var SlCheckbox = class extends ShoelaceElement {
	constructor() {
		super(...arguments)
		this.formControlController = new FormControlController(this, {
			value: (control) => (control.checked ? control.value || "on" : void 0),
			defaultValue: (control) => control.defaultChecked,
			setValue: (control, checked) => (control.checked = checked),
		})
		this.hasSlotController = new HasSlotController(this, "help-text")
		this.hasFocus = false
		this.title = ""
		this.name = ""
		this.size = "medium"
		this.disabled = false
		this.checked = false
		this.indeterminate = false
		this.defaultChecked = false
		this.form = ""
		this.required = false
		this.helpText = ""
	}
	/** Gets the validity state object */
	get validity() {
		return this.input.validity
	}
	/** Gets the validation message */
	get validationMessage() {
		return this.input.validationMessage
	}
	firstUpdated() {
		this.formControlController.updateValidity()
	}
	handleClick() {
		this.checked = !this.checked
		this.indeterminate = false
		this.emit("sl-change")
	}
	handleBlur() {
		this.hasFocus = false
		this.emit("sl-blur")
	}
	handleInput() {
		this.emit("sl-input")
	}
	handleInvalid(event) {
		this.formControlController.setValidity(false)
		this.formControlController.emitInvalidEvent(event)
	}
	handleFocus() {
		this.hasFocus = true
		this.emit("sl-focus")
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled)
	}
	handleStateChange() {
		this.input.checked = this.checked
		this.input.indeterminate = this.indeterminate
		this.formControlController.updateValidity()
	}
	/** Simulates a click on the checkbox. */
	click() {
		this.input.click()
	}
	/** Sets focus on the checkbox. */
	focus(options) {
		this.input.focus(options)
	}
	/** Removes focus from the checkbox. */
	blur() {
		this.input.blur()
	}
	/** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
	checkValidity() {
		return this.input.checkValidity()
	}
	/** Gets the associated form, if one exists. */
	getForm() {
		return this.formControlController.getForm()
	}
	/** Checks for validity and shows the browser's validation message if the control is invalid. */
	reportValidity() {
		return this.input.reportValidity()
	}
	/**
	 * Sets a custom validation message. The value provided will be shown to the user when the form is submitted. To clear
	 * the custom validation message, call this method with an empty string.
	 */
	setCustomValidity(message) {
		this.input.setCustomValidity(message)
		this.formControlController.updateValidity()
	}
	render() {
		const hasHelpTextSlot = this.hasSlotController.test("help-text")
		const hasHelpText = this.helpText ? true : !!hasHelpTextSlot
		return ke$1`
      <div
        class=${Rt({
					"form-control": true,
					"form-control--small": this.size === "small",
					"form-control--medium": this.size === "medium",
					"form-control--large": this.size === "large",
					"form-control--has-help-text": hasHelpText,
				})}
      >
        <label
          part="base"
          class=${Rt({
						checkbox: true,
						"checkbox--checked": this.checked,
						"checkbox--disabled": this.disabled,
						"checkbox--focused": this.hasFocus,
						"checkbox--indeterminate": this.indeterminate,
						"checkbox--small": this.size === "small",
						"checkbox--medium": this.size === "medium",
						"checkbox--large": this.size === "large",
					})}
        >
          <input
            class="checkbox__input"
            type="checkbox"
            title=${this.title}
            name=${this.name}
            value=${to(this.value)}
            .indeterminate=${Ft(this.indeterminate)}
            .checked=${Ft(this.checked)}
            .disabled=${this.disabled}
            .required=${this.required}
            aria-checked=${this.checked ? "true" : "false"}
            aria-describedby="help-text"
            @click=${this.handleClick}
            @input=${this.handleInput}
            @invalid=${this.handleInvalid}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
          />

          <span
            part="control${this.checked ? " control--checked" : ""}${this.indeterminate ? " control--indeterminate" : ""}"
            class="checkbox__control"
          >
            ${
							this.checked
								? ke$1`
                  <sl-icon part="checked-icon" class="checkbox__checked-icon" library="system" name="check"></sl-icon>
                `
								: ""
						}
            ${
							!this.checked && this.indeterminate
								? ke$1`
                  <sl-icon
                    part="indeterminate-icon"
                    class="checkbox__indeterminate-icon"
                    library="system"
                    name="indeterminate"
                  ></sl-icon>
                `
								: ""
						}
          </span>

          <div part="label" class="checkbox__label">
            <slot></slot>
          </div>
        </label>

        <div
          aria-hidden=${hasHelpText ? "false" : "true"}
          class="form-control__help-text"
          id="help-text"
          part="form-control-help-text"
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `
	}
}
SlCheckbox.styles = [component_styles_default, checkbox_styles_default]
SlCheckbox.dependencies = { "sl-icon": SlIcon }
__decorateClass([e$1('input[type="checkbox"]')], SlCheckbox.prototype, "input", 2)
__decorateClass([r()], SlCheckbox.prototype, "hasFocus", 2)
__decorateClass([n()], SlCheckbox.prototype, "title", 2)
__decorateClass([n()], SlCheckbox.prototype, "name", 2)
__decorateClass([n()], SlCheckbox.prototype, "value", 2)
__decorateClass([n({ reflect: true })], SlCheckbox.prototype, "size", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlCheckbox.prototype, "disabled", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlCheckbox.prototype, "checked", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlCheckbox.prototype, "indeterminate", 2)
__decorateClass([defaultValue("checked")], SlCheckbox.prototype, "defaultChecked", 2)
__decorateClass([n({ reflect: true })], SlCheckbox.prototype, "form", 2)
__decorateClass([n({ type: Boolean, reflect: true })], SlCheckbox.prototype, "required", 2)
__decorateClass([n({ attribute: "help-text" })], SlCheckbox.prototype, "helpText", 2)
__decorateClass(
	[watch("disabled", { waitUntilFirstUpdate: true })],
	SlCheckbox.prototype,
	"handleDisabledChange",
	1
)
__decorateClass(
	[watch(["checked", "indeterminate"], { waitUntilFirstUpdate: true })],
	SlCheckbox.prototype,
	"handleStateChange",
	1
)

var __decorate =
	(undefined && undefined.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
			r = Reflect.decorate(decorators, target, key, desc)
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
		return c > 3 && r && Object.defineProperty(target, key, r), r
	}
// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-checkbox")) customElements.define("sl-checkbox", SlCheckbox)
let InlangSettings = class InlangSettings extends h {
	constructor() {
		super(...arguments)
		this.settings = {}
		this.installedPlugins = []
		this._newSettings = undefined
		this._unsavedChanges = false
		this.handleInlangProjectChange = (
			//value needs to be exactly how it goes in the project settings json
			value,
			property,
			moduleId
		) => {
			//update state object
			if (this._newSettings && moduleId) {
				this._newSettings = {
					...this._newSettings,
					// plugin: {
					// 	...this._newSettings.plugin
					// 	[moduleId]: {
					// 		...this._newSettings[moduleId],
					// 		[property]: value,
					// 	},
					// }
				}
			} else if (this._newSettings) {
				this._newSettings = {
					...this._newSettings,
					[property]: value,
				}
			}
			if (JSON.stringify(this.settings) !== JSON.stringify(this._newSettings)) {
				this._unsavedChanges = true
			} else {
				this._unsavedChanges = false
			}
		}
		this._revertChanges = () => {
			if (this.settings) {
				this._newSettings = JSON.parse(JSON.stringify(this.settings))
			}
			this._unsavedChanges = false
		}
		this._saveChanges = () => {
			if (this._newSettings) {
				this.dispatchOnSetSettings(this._newSettings)
				this.settings = JSON.parse(JSON.stringify(this._newSettings))
			}
			this._unsavedChanges = false
		}
	}
	static {
		this.styles = [
			baseStyling,
			i$2`
			h2 {
				margin: 0;
				padding-top: 1rem;
			}
			.container {
				position: relative;
				display: flex;
				flex-direction: column;
				gap: 48px;
			}
			.module-container {
				display: flex;
				flex-direction: column;
				gap: 40px;
			}
			.hover-bar-container {
				width: 100%;
				box-sizing: border-box;
				position: sticky;
				bottom: 1rem;
			}
			.hover-bar {
				box-sizing: border-box;
				width: 100%;
				max-width: 500px;
				padding-top: 0.5rem;
				padding-bottom: 0.5rem;
				margin: 0 auto;
				display: flex;
				flex-wrap: wrap;
				justify-content: space-between;
				align-items: center;
				gap: 8px;
				background-color: var(--sl-panel-background-color);
				padding-left: 1rem;
				padding-right: 0.8rem;
				border-radius: 0.5rem;
				border: 1px solid var(--sl-panel-border-color);
				filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
				font-weight: 600;
				line-height: 1.5;
				font-size: 14px;
			}
			.hover-bar-text {
				margin: 0;
			}
			.module-link-container {
				display: flex;
				color: var(--sl-input-help-text-color);
				gap: 6px;
				padding-top: 0.5rem;
			}
			.module-link {
				margin: 0;
				font-size: 14px;
				line-height: 1.5;
				flex-grow: 1;
				text-decoration: none;
				color: var(--sl-input-help-text-color);
			}
			.module-link:hover {
				color: var(--sl-color-primary-600);
			}
			.module-type {
				background-color: var(--sl-input-background-color-disabled);
				width: fit-content;
				padding: 0px 6px;
				border-radius: 2px;
				font-size: 14px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--sl-input-color-disabled);
				margin: 0;
				line-height: 1.5;
				flex-grow: 0;
			}
		`,
		]
	}
	dispatchOnSetSettings(settings) {
		const onSetSettings = new CustomEvent("set-settings", {
			detail: {
				argument: settings,
			},
		})
		this.dispatchEvent(onSetSettings)
	}
	async firstUpdated() {
		await this.updateComplete
		if (this.settings) {
			this._newSettings = JSON.parse(JSON.stringify(this.settings))
		}
		//override primitive colors to match the design system
		overridePrimitiveColors()
	}
	get _settingProperties() {
		const _settings = this.settings
		if (!_settings) throw new Error("No inlang settings")
		const generalSchema = { internal: { schema: ProjectSettings.allOf[0] } }
		// for (const plugin of _installedPlugins) {
		// 	if (plugin.settingsSchema) {
		// 		generalSchema[plugin.id] = {
		// 			schema: plugin.settingsSchema,
		// 			meta: plugin,
		// 		}
		// 	}
		// }
		// for (const lintRule of _installedMessageLintRules) {
		// 	if (lintRule.settingsSchema) {
		// 		generalSchema[lintRule.id] = {
		// 			schema: lintRule.settingsSchema,
		// 			meta: lintRule,
		// 		}
		// 	}
		// }
		return generalSchema
	}
	render() {
		return ke$1` <div class="container" part="base">
			${Object.entries(this._settingProperties).map(([key, value]) => {
				// TODO remove marketplace registry (bundling is too expensive)
				//const item = registry.find((item) => item.id === value.meta?.id)
				return value.schema?.properties && this._newSettings
					? ke$1`<div class="module-container" part="module">
							${
								value.meta &&
								(value.meta?.displayName).en &&
								ke$1`<div>
								<h2 part="module-title">
									${value.meta && (value.meta?.displayName).en}
								</h2>
								<div class="module-link-container">
									<svg width="24" height="24" fill="none" viewBox="0 0 24 24">
										<path
											fill="currentColor"
											d="M11 17H7c-1.383 0-2.562-.488-3.537-1.463C2.488 14.562 2.001 13.383 2 12c0-1.383.487-2.562 1.463-3.537C4.439 7.488 5.618 7 7 7h4v2H7c-.833 0-1.542.292-2.125.875A2.893 2.893 0 004 12c0 .833.292 1.542.875 2.125A2.893 2.893 0 007 15h4v2zm-3-4v-2h8v2H8zm5 4v-2h4c.833 0 1.542-.292 2.125-.875A2.893 2.893 0 0020 12c0-.833-.292-1.542-.875-2.125A2.893 2.893 0 0017 9h-4V7h4c1.383 0 2.563.488 3.538 1.463.975.975 1.463 2.154 1.462 3.537 0 1.383-.488 2.562-1.463 3.538-.975.976-2.154 1.463-3.537 1.462h-4z"
										></path>
									</svg>
									<div class="module-type">
										${value.meta.id.startsWith("plugin") ? "Plugin" : "Lint Rule"}
									</div>
								</div>
							</div>`
							}
							${Object.entries(value.schema.properties).map(([property, schema]) => {
								if (
									property === "$schema" ||
									property === "modules" ||
									property === "languageTags" ||
									property === "sourceLanguageTag"
								)
									return undefined
								return key === "internal"
									? ke$1`
											<general-input
												exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
												.property=${property}
												.modules=${[]}
												.value=${structuredClone(this._newSettings?.[property])}
												.schema=${schema}
												.handleInlangProjectChange=${this.handleInlangProjectChange}
												.required=${checkRequired(value.schema, property)}
											></general-input>
									  `
									: ke$1`
											<general-input
												exportparts="property, property-title, property-paragraph, option, option-wrapper, button"
												.property=${property}
												.value=${
													// @ts-ignore
													structuredClone(this._newSettings?.[key]?.[property])
												}
												.schema=${schema}
												.moduleId=${key}
												.handleInlangProjectChange=${this.handleInlangProjectChange}
												.required=${checkRequired(value.schema, property)}
											></general-input>
									  `
							})}
					  </div>`
					: undefined
			})}
			${
				this._unsavedChanges
					? ke$1`<div class="hover-bar-container">
						<div class="hover-bar" part="float">
							<p class="hover-bar-text">Attention, you have unsaved changes.</p>
							<div>
								<sl-button
									exportparts="base:button"
									size="small"
									@click=${() => {
										this._revertChanges()
									}}
									varaint="default"
								>
									Cancel
								</sl-button>
								<sl-button
									size="small"
									@click=${() => {
										this._saveChanges()
									}}
									variant="primary"
								>
									Save Changes
								</sl-button>
							</div>
						</div>
				  </div>`
					: ke$1``
			}
		</div>`
	}
}
__decorate([n({ type: Object })], InlangSettings.prototype, "settings", void 0)
__decorate([n({ type: Array })], InlangSettings.prototype, "installedPlugins", void 0)
__decorate([r()], InlangSettings.prototype, "_newSettings", void 0)
__decorate([r()], InlangSettings.prototype, "_unsavedChanges", void 0)
InlangSettings = __decorate([t$1("inlang-settings")], InlangSettings)
