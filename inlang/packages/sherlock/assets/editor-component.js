/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$4=globalThis,e$a=t$4.ShadowRoot&&(void 0===t$4.ShadyCSS||t$4.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$3=Symbol(),o$9=new WeakMap;let n$7 = class n{constructor(t,e,o){if(this._$cssResult$=!0,o!==s$3)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$a&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$9.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$9.set(s,t));}return t}toString(){return this.cssText}};const r$7=t=>new n$7("string"==typeof t?t:t+"",void 0,s$3),i$6=(t,...e)=>{const o=1===t.length?t[0]:e.reduce(((e,s,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1]),t[0]);return new n$7(o,t,s$3)},S$6=(s,o)=>{if(e$a)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t$4.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$4=e$a?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$7(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$5,defineProperty:e$9,getOwnPropertyDescriptor:r$6,getOwnPropertyNames:h$6,getOwnPropertySymbols:o$8,getPrototypeOf:n$6}=Object,a$3=globalThis,c$3=a$3.trustedTypes,l$4=c$3?c$3.emptyScript:"",p$4=a$3.reactiveElementPolyfillSupport,d$3=(t,s)=>t,u$4={toAttribute(t,s){switch(s){case Boolean:t=t?l$4:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$4=(t,s)=>!i$5(t,s),y$6={attribute:!0,type:String,converter:u$4,reflect:!1,hasChanged:f$4};Symbol.metadata??=Symbol("metadata"),a$3.litPropertyMetadata??=new WeakMap;let b$3 = class b extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=y$6){if(s.state&&(s.attribute=!1),this._$Ei(),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(t,i,s);void 0!==r&&e$9(this.prototype,t,r);}}static getPropertyDescriptor(t,s,i){const{get:e,set:h}=r$6(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get(){return e?.call(this)},set(s){const r=e?.call(this);h.call(this,s),this.requestUpdate(t,r,i);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y$6}static _$Ei(){if(this.hasOwnProperty(d$3("elementProperties")))return;const t=n$6(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$3("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d$3("properties"))){const t=this.properties,s=[...h$6(t),...o$8(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$4(s));}else void 0!==s&&i.push(c$4(s));return i}static _$Eu(t,s){const i=s.attribute;return !1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$6(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()));}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()));}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$EC(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:u$4).toAttribute(s,i.type);this._$Em=t,null==r?this.removeAttribute(e):this.setAttribute(e,r),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$4;this._$Em=e,this[e]=r.fromAttribute(s,t.type),this._$Em=null;}}requestUpdate(t,s,i){if(void 0!==t){if(i??=this.constructor.getPropertyOptions(t),!(i.hasChanged??f$4)(this[t],s))return;this.P(t,s,i);}!1===this.isUpdatePending&&(this._$ES=this._$ET());}P(t,s,i){this._$AL.has(t)||this._$AL.set(t,s),!0===i.reflect&&this._$Em!==t&&(this._$Ej??=new Set).add(t);}async _$ET(){this.isUpdatePending=!0;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t)!0!==i.wrapped||this._$AL.has(s)||void 0===this[s]||this.P(s,this[s],i);}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$EU();}catch(s){throw t=!1,this._$EU(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$EU(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return !0}update(t){this._$Ej&&=this._$Ej.forEach((t=>this._$EC(t,this[t]))),this._$EU();}updated(t){}firstUpdated(t){}};b$3.elementStyles=[],b$3.shadowRootOptions={mode:"open"},b$3[d$3("elementProperties")]=new Map,b$3[d$3("finalized")]=new Map,p$4?.({ReactiveElement:b$3}),(a$3.reactiveElementVersions??=[]).push("2.0.4");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$3=globalThis,i$4=t$3.trustedTypes,s$2=i$4?i$4.createPolicy("lit-html",{createHTML:t=>t}):void 0,e$8="$lit$",h$5=`lit$${Math.random().toFixed(9).slice(2)}$`,o$7="?"+h$5,n$5=`<${o$7}>`,r$5=document,l$3=()=>r$5.createComment(""),c$2=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a$2=Array.isArray,u$3=t=>a$2(t)||"function"==typeof t?.[Symbol.iterator],d$2="[ \t\n\f\r]",f$3=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v$4=/-->/g,_$3=/>/g,m$5=RegExp(`>|${d$2}(?:([^\\s"'>=/]+)(${d$2}*=${d$2}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p$3=/'/g,g$3=/"/g,$$3=/^(?:script|style|textarea|title)$/i,y$5=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x$4=y$5(1),T$4=Symbol.for("lit-noChange"),E$4=Symbol.for("lit-nothing"),A$4=new WeakMap,C$4=r$5.createTreeWalker(r$5,129);function P$5(t,i){if(!a$2(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s$2?s$2.createHTML(i):i}const V$2=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":3===i?"<math>":"",c=f$3;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f$3?"!--"===u[1]?c=v$4:void 0!==u[1]?c=_$3:void 0!==u[2]?($$3.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m$5):void 0!==u[3]&&(c=m$5):c===m$5?">"===u[0]?(c=r??f$3,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m$5:'"'===u[3]?g$3:p$3):c===g$3||c===p$3?c=m$5:c===v$4||c===_$3?c=f$3:(c=m$5,r=void 0);const x=c===m$5&&t[i+1].startsWith("/>")?" ":"";l+=c===f$3?s+n$5:d>=0?(o.push(a),s.slice(0,d)+e$8+s.slice(d)+h$5+x):s+h$5+(-2===d?i:x);}return [P$5(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),o]};let N$4 = class N{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=V$2(t,s);if(this.el=N.createElement(f,n),C$4.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=C$4.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e$8)){const i=v[a++],s=r.getAttribute(t).split(h$5),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?H$3:"?"===e[1]?I$4:"@"===e[1]?L$4:k$4}),r.removeAttribute(t);}else t.startsWith(h$5)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($$3.test(r.tagName)){const t=r.textContent.split(h$5),s=t.length-1;if(s>0){r.textContent=i$4?i$4.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l$3()),C$4.nextNode(),d.push({type:2,index:++c});r.append(t[s],l$3());}}}else if(8===r.nodeType)if(r.data===o$7)d.push({type:2,index:c});else {let t=-1;for(;-1!==(t=r.data.indexOf(h$5,t+1));)d.push({type:7,index:c}),t+=h$5.length-1;}c++;}}static createElement(t,i){const s=r$5.createElement("template");return s.innerHTML=t,s}};function S$5(t,i,s=t,e){if(i===T$4)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c$2(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=S$5(t,h._$AS(t,i.values),h,e)),i}let M$4 = class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r$5).importNode(i,!0);C$4.currentNode=e;let h=C$4.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new R$5(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new z$3(h,this,t)),this._$AV.push(i),l=s[++n];}o!==l?.index&&(h=C$4.nextNode(),o++);}return C$4.currentNode=r$5,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}};let R$5 = class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=E$4,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??!0;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S$5(this,t,i),c$2(t)?t===E$4||null==t||""===t?(this._$AH!==E$4&&this._$AR(),this._$AH=E$4):t!==this._$AH&&t!==T$4&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):u$3(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==E$4&&c$2(this._$AH)?this._$AA.nextSibling.data=t:this.T(r$5.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N$4.createElement(P$5(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new M$4(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=A$4.get(t.strings);return void 0===i&&A$4.set(t.strings,i=new N$4(t)),i}k(t){a$2(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new R(this.O(l$3()),this.O(l$3()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}};let k$4 = class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=E$4,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=E$4;}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=S$5(this,t,i,0),o=!c$2(t)||t!==this._$AH&&t!==T$4,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=S$5(this,e[s+n],i,n),r===T$4&&(r=this._$AH[n]),o||=!c$2(r)||r!==this._$AH[n],r===E$4?t=E$4:t!==E$4&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===E$4?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}};let H$3 = class H extends k$4{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===E$4?void 0:t;}};let I$4 = class I extends k$4{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==E$4);}};let L$4 = class L extends k$4{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=S$5(this,t,i,0)??E$4)===T$4)return;const s=this._$AH,e=t===E$4&&s!==E$4||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==E$4&&(s===E$4||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}};let z$3 = class z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){S$5(this,t);}};const j$3=t$3.litHtmlPolyfillSupport;j$3?.(N$4,R$5),(t$3.litHtmlVersions??=[]).push("3.2.1");const B$4=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new R$5(i.insertBefore(l$3(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let r$4 = class r extends b$3{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=B$4(s,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1);}render(){return T$4}};r$4._$litElement$=!0,r$4["finalized"]=!0,globalThis.litElementHydrateSupport?.({LitElement:r$4});const i$3=globalThis.litElementPolyfillSupport;i$3?.({LitElement:r$4});(globalThis.litElementVersions??=[]).push("4.1.1");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$2=t=>(e,o)=>{void 0!==o?o.addInitializer((()=>{customElements.define(t,e);})):customElements.define(t,e);};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o$6={attribute:!0,type:String,converter:u$4,reflect:!1,hasChanged:f$4},r$3=(t=o$6,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t);},init(e){return void 0!==e&&this.P(o,void 0,t),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t);}}throw Error("Unsupported decorator location: "+n)};function n$4(t){return (e,o)=>"object"==typeof o?r$3(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,r?{...t,wrapped:!0}:t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function r$2(r){return n$4({...r,state:!0,attribute:!1})}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$7=(e,t,c)=>(c.configurable=!0,c.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,c),c);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function e$6(e,r){return (n,s,i)=>{const o=t=>t.renderRoot?.querySelector(e)??null;if(r){const{get:e,set:r}="object"==typeof s?n:i??(()=>{const t=Symbol();return {get(){return this[t]},set(e){this[t]=e;}}})();return e$7(n,s,{get(){let t=e.call(this);return void 0===t&&(t=o(this),(null!==t||this.hasUpdated)&&r.call(this,t)),t}})}return e$7(n,s,{get(){return o(this)}})}}

var limit = (x, low = 0, high = 1) => {
    return min$4(max$4(low, x), high);
};

var clip_rgb = (rgb) => {
    rgb._clipped = false;
    rgb._unclipped = rgb.slice(0);
    for (let i = 0; i <= 3; i++) {
        if (i < 3) {
            if (rgb[i] < 0 || rgb[i] > 255) rgb._clipped = true;
            rgb[i] = limit(rgb[i], 0, 255);
        } else if (i === 3) {
            rgb[i] = limit(rgb[i], 0, 1);
        }
    }
    return rgb;
};

// ported from jQuery's $.type
const classToType = {};
for (let name of [
    'Boolean',
    'Number',
    'String',
    'Function',
    'Array',
    'Date',
    'RegExp',
    'Undefined',
    'Null'
]) {
    classToType[`[object ${name}]`] = name.toLowerCase();
}
function type (obj) {
    return classToType[Object.prototype.toString.call(obj)] || 'object';
}

var unpack = (args, keyOrder = null) => {
    // if called with more than 3 arguments, we return the arguments
    if (args.length >= 3) return Array.prototype.slice.call(args);
    // with less than 3 args we check if first arg is object
    // and use the keyOrder string to extract and sort properties
    if (type(args[0]) == 'object' && keyOrder) {
        return keyOrder
            .split('')
            .filter((k) => args[0][k] !== undefined)
            .map((k) => args[0][k]);
    }
    // otherwise we just return the first argument
    // (which we suppose is an array of args)
    return args[0];
};

var last = (args) => {
    if (args.length < 2) return null;
    const l = args.length - 1;
    if (type(args[l]) == 'string') return args[l].toLowerCase();
    return null;
};

const { PI: PI$2, min: min$4, max: max$4 } = Math;

const TWOPI = PI$2 * 2;
const PITHIRD = PI$2 / 3;
const DEG2RAD = PI$2 / 180;
const RAD2DEG = 180 / PI$2;

var input = {
    format: {},
    autodetect: []
};

class Color {
    constructor(...args) {
        const me = this;
        if (
            type(args[0]) === 'object' &&
            args[0].constructor &&
            args[0].constructor === this.constructor
        ) {
            // the argument is already a Color instance
            return args[0];
        }
        // last argument could be the mode
        let mode = last(args);
        let autodetect = false;
        if (!mode) {
            autodetect = true;
            if (!input.sorted) {
                input.autodetect = input.autodetect.sort((a, b) => b.p - a.p);
                input.sorted = true;
            }
            // auto-detect format
            for (let chk of input.autodetect) {
                mode = chk.test(...args);
                if (mode) break;
            }
        }
        if (input.format[mode]) {
            const rgb = input.format[mode].apply(
                null,
                autodetect ? args : args.slice(0, -1)
            );
            me._rgb = clip_rgb(rgb);
        } else {
            throw new Error('unknown format: ' + args);
        }
        // add alpha channel
        if (me._rgb.length === 3) me._rgb.push(1);
    }
    toString() {
        if (type(this.hex) == 'function') return this.hex();
        return `[${this._rgb.join(',')}]`;
    }
}

// this gets updated automatically
const version = '2.6.0';

const chroma = (...args) => {
    return new chroma.Color(...args);
};

chroma.Color = Color;
chroma.version = version;

const cmyk2rgb = (...args) => {
    args = unpack(args, 'cmyk');
    const [c, m, y, k] = args;
    const alpha = args.length > 4 ? args[4] : 1;
    if (k === 1) return [0, 0, 0, alpha];
    return [
        c >= 1 ? 0 : 255 * (1 - c) * (1 - k), // r
        m >= 1 ? 0 : 255 * (1 - m) * (1 - k), // g
        y >= 1 ? 0 : 255 * (1 - y) * (1 - k), // b
        alpha
    ];
};

const { max: max$3 } = Math;

const rgb2cmyk = (...args) => {
    let [r, g, b] = unpack(args, 'rgb');
    r = r / 255;
    g = g / 255;
    b = b / 255;
    const k = 1 - max$3(r, max$3(g, b));
    const f = k < 1 ? 1 / (1 - k) : 0;
    const c = (1 - r - k) * f;
    const m = (1 - g - k) * f;
    const y = (1 - b - k) * f;
    return [c, m, y, k];
};

Color.prototype.cmyk = function () {
    return rgb2cmyk(this._rgb);
};

chroma.cmyk = (...args) => new Color(...args, 'cmyk');

input.format.cmyk = cmyk2rgb;

input.autodetect.push({
    p: 2,
    test: (...args) => {
        args = unpack(args, 'cmyk');
        if (type(args) === 'array' && args.length === 4) {
            return 'cmyk';
        }
    }
});

const rnd = (a) => Math.round(a * 100) / 100;

/*
 * supported arguments:
 * - hsl2css(h,s,l)
 * - hsl2css(h,s,l,a)
 * - hsl2css([h,s,l], mode)
 * - hsl2css([h,s,l,a], mode)
 * - hsl2css({h,s,l,a}, mode)
 */
const hsl2css = (...args) => {
    const hsla = unpack(args, 'hsla');
    let mode = last(args) || 'lsa';
    hsla[0] = rnd(hsla[0] || 0);
    hsla[1] = rnd(hsla[1] * 100) + '%';
    hsla[2] = rnd(hsla[2] * 100) + '%';
    if (mode === 'hsla' || (hsla.length > 3 && hsla[3] < 1)) {
        hsla[3] = hsla.length > 3 ? hsla[3] : 1;
        mode = 'hsla';
    } else {
        hsla.length = 3;
    }
    return `${mode}(${hsla.join(',')})`;
};

/*
 * supported arguments:
 * - rgb2hsl(r,g,b)
 * - rgb2hsl(r,g,b,a)
 * - rgb2hsl([r,g,b])
 * - rgb2hsl([r,g,b,a])
 * - rgb2hsl({r,g,b,a})
 */
const rgb2hsl$1 = (...args) => {
    args = unpack(args, 'rgba');
    let [r, g, b] = args;

    r /= 255;
    g /= 255;
    b /= 255;

    const minRgb = min$4(r, g, b);
    const maxRgb = max$4(r, g, b);

    const l = (maxRgb + minRgb) / 2;
    let s, h;

    if (maxRgb === minRgb) {
        s = 0;
        h = Number.NaN;
    } else {
        s =
            l < 0.5
                ? (maxRgb - minRgb) / (maxRgb + minRgb)
                : (maxRgb - minRgb) / (2 - maxRgb - minRgb);
    }

    if (r == maxRgb) h = (g - b) / (maxRgb - minRgb);
    else if (g == maxRgb) h = 2 + (b - r) / (maxRgb - minRgb);
    else if (b == maxRgb) h = 4 + (r - g) / (maxRgb - minRgb);

    h *= 60;
    if (h < 0) h += 360;
    if (args.length > 3 && args[3] !== undefined) return [h, s, l, args[3]];
    return [h, s, l];
};

const { round: round$7 } = Math;

/*
 * supported arguments:
 * - rgb2css(r,g,b)
 * - rgb2css(r,g,b,a)
 * - rgb2css([r,g,b], mode)
 * - rgb2css([r,g,b,a], mode)
 * - rgb2css({r,g,b,a}, mode)
 */
const rgb2css = (...args) => {
    const rgba = unpack(args, 'rgba');
    let mode = last(args) || 'rgb';
    if (mode.substr(0, 3) == 'hsl') {
        return hsl2css(rgb2hsl$1(rgba), mode);
    }
    rgba[0] = round$7(rgba[0]);
    rgba[1] = round$7(rgba[1]);
    rgba[2] = round$7(rgba[2]);
    if (mode === 'rgba' || (rgba.length > 3 && rgba[3] < 1)) {
        rgba[3] = rgba.length > 3 ? rgba[3] : 1;
        mode = 'rgba';
    }
    return `${mode}(${rgba.slice(0, mode === 'rgb' ? 3 : 4).join(',')})`;
};

const { round: round$6 } = Math;

const hsl2rgb = (...args) => {
    args = unpack(args, 'hsl');
    const [h, s, l] = args;
    let r, g, b;
    if (s === 0) {
        r = g = b = l * 255;
    } else {
        const t3 = [0, 0, 0];
        const c = [0, 0, 0];
        const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const t1 = 2 * l - t2;
        const h_ = h / 360;
        t3[0] = h_ + 1 / 3;
        t3[1] = h_;
        t3[2] = h_ - 1 / 3;
        for (let i = 0; i < 3; i++) {
            if (t3[i] < 0) t3[i] += 1;
            if (t3[i] > 1) t3[i] -= 1;
            if (6 * t3[i] < 1) c[i] = t1 + (t2 - t1) * 6 * t3[i];
            else if (2 * t3[i] < 1) c[i] = t2;
            else if (3 * t3[i] < 2) c[i] = t1 + (t2 - t1) * (2 / 3 - t3[i]) * 6;
            else c[i] = t1;
        }
        [r, g, b] = [round$6(c[0] * 255), round$6(c[1] * 255), round$6(c[2] * 255)];
    }
    if (args.length > 3) {
        // keep alpha channel
        return [r, g, b, args[3]];
    }
    return [r, g, b, 1];
};

const RE_RGB = /^rgb\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/;
const RE_RGBA =
    /^rgba\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([01]|[01]?\.\d+)\)$/;
const RE_RGB_PCT =
    /^rgb\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/;
const RE_RGBA_PCT =
    /^rgba\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/;
const RE_HSL =
    /^hsl\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/;
const RE_HSLA =
    /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/;

const { round: round$5 } = Math;

const css2rgb = (css) => {
    css = css.toLowerCase().trim();
    let m;

    if (input.format.named) {
        try {
            return input.format.named(css);
            // eslint-disable-next-line
        } catch (e) {}
    }

    // rgb(250,20,0)
    if ((m = css.match(RE_RGB))) {
        const rgb = m.slice(1, 4);
        for (let i = 0; i < 3; i++) {
            rgb[i] = +rgb[i];
        }
        rgb[3] = 1; // default alpha
        return rgb;
    }

    // rgba(250,20,0,0.4)
    if ((m = css.match(RE_RGBA))) {
        const rgb = m.slice(1, 5);
        for (let i = 0; i < 4; i++) {
            rgb[i] = +rgb[i];
        }
        return rgb;
    }

    // rgb(100%,0%,0%)
    if ((m = css.match(RE_RGB_PCT))) {
        const rgb = m.slice(1, 4);
        for (let i = 0; i < 3; i++) {
            rgb[i] = round$5(rgb[i] * 2.55);
        }
        rgb[3] = 1; // default alpha
        return rgb;
    }

    // rgba(100%,0%,0%,0.4)
    if ((m = css.match(RE_RGBA_PCT))) {
        const rgb = m.slice(1, 5);
        for (let i = 0; i < 3; i++) {
            rgb[i] = round$5(rgb[i] * 2.55);
        }
        rgb[3] = +rgb[3];
        return rgb;
    }

    // hsl(0,100%,50%)
    if ((m = css.match(RE_HSL))) {
        const hsl = m.slice(1, 4);
        hsl[1] *= 0.01;
        hsl[2] *= 0.01;
        const rgb = hsl2rgb(hsl);
        rgb[3] = 1;
        return rgb;
    }

    // hsla(0,100%,50%,0.5)
    if ((m = css.match(RE_HSLA))) {
        const hsl = m.slice(1, 4);
        hsl[1] *= 0.01;
        hsl[2] *= 0.01;
        const rgb = hsl2rgb(hsl);
        rgb[3] = +m[4]; // default alpha = 1
        return rgb;
    }
};

css2rgb.test = (s) => {
    return (
        RE_RGB.test(s) ||
        RE_RGBA.test(s) ||
        RE_RGB_PCT.test(s) ||
        RE_RGBA_PCT.test(s) ||
        RE_HSL.test(s) ||
        RE_HSLA.test(s)
    );
};

Color.prototype.css = function (mode) {
    return rgb2css(this._rgb, mode);
};

chroma.css = (...args) => new Color(...args, 'css');

input.format.css = css2rgb;

input.autodetect.push({
    p: 5,
    test: (h, ...rest) => {
        if (!rest.length && type(h) === 'string' && css2rgb.test(h)) {
            return 'css';
        }
    }
});

input.format.gl = (...args) => {
    const rgb = unpack(args, 'rgba');
    rgb[0] *= 255;
    rgb[1] *= 255;
    rgb[2] *= 255;
    return rgb;
};

chroma.gl = (...args) => new Color(...args, 'gl');

Color.prototype.gl = function () {
    const rgb = this._rgb;
    return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3]];
};

const { floor: floor$4 } = Math;

/*
 * this is basically just HSV with some minor tweaks
 *
 * hue.. [0..360]
 * chroma .. [0..1]
 * grayness .. [0..1]
 */

const hcg2rgb = (...args) => {
    args = unpack(args, 'hcg');
    let [h, c, _g] = args;
    let r, g, b;
    _g = _g * 255;
    const _c = c * 255;
    if (c === 0) {
        r = g = b = _g;
    } else {
        if (h === 360) h = 0;
        if (h > 360) h -= 360;
        if (h < 0) h += 360;
        h /= 60;
        const i = floor$4(h);
        const f = h - i;
        const p = _g * (1 - c);
        const q = p + _c * (1 - f);
        const t = p + _c * f;
        const v = p + _c;
        switch (i) {
            case 0:
                [r, g, b] = [v, t, p];
                break;
            case 1:
                [r, g, b] = [q, v, p];
                break;
            case 2:
                [r, g, b] = [p, v, t];
                break;
            case 3:
                [r, g, b] = [p, q, v];
                break;
            case 4:
                [r, g, b] = [t, p, v];
                break;
            case 5:
                [r, g, b] = [v, p, q];
                break;
        }
    }
    return [r, g, b, args.length > 3 ? args[3] : 1];
};

const rgb2hcg = (...args) => {
    const [r, g, b] = unpack(args, 'rgb');
    const minRgb = min$4(r, g, b);
    const maxRgb = max$4(r, g, b);
    const delta = maxRgb - minRgb;
    const c = (delta * 100) / 255;
    const _g = (minRgb / (255 - delta)) * 100;
    let h;
    if (delta === 0) {
        h = Number.NaN;
    } else {
        if (r === maxRgb) h = (g - b) / delta;
        if (g === maxRgb) h = 2 + (b - r) / delta;
        if (b === maxRgb) h = 4 + (r - g) / delta;
        h *= 60;
        if (h < 0) h += 360;
    }
    return [h, c, _g];
};

Color.prototype.hcg = function () {
    return rgb2hcg(this._rgb);
};

chroma.hcg = (...args) => new Color(...args, 'hcg');

input.format.hcg = hcg2rgb;

input.autodetect.push({
    p: 1,
    test: (...args) => {
        args = unpack(args, 'hcg');
        if (type(args) === 'array' && args.length === 3) {
            return 'hcg';
        }
    }
});

const RE_HEX = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const RE_HEXA = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/;

const hex2rgb = (hex) => {
    if (hex.match(RE_HEX)) {
        // remove optional leading #
        if (hex.length === 4 || hex.length === 7) {
            hex = hex.substr(1);
        }
        // expand short-notation to full six-digit
        if (hex.length === 3) {
            hex = hex.split('');
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const u = parseInt(hex, 16);
        const r = u >> 16;
        const g = (u >> 8) & 0xff;
        const b = u & 0xff;
        return [r, g, b, 1];
    }

    // match rgba hex format, eg #FF000077
    if (hex.match(RE_HEXA)) {
        if (hex.length === 5 || hex.length === 9) {
            // remove optional leading #
            hex = hex.substr(1);
        }
        // expand short-notation to full eight-digit
        if (hex.length === 4) {
            hex = hex.split('');
            hex =
                hex[0] +
                hex[0] +
                hex[1] +
                hex[1] +
                hex[2] +
                hex[2] +
                hex[3] +
                hex[3];
        }
        const u = parseInt(hex, 16);
        const r = (u >> 24) & 0xff;
        const g = (u >> 16) & 0xff;
        const b = (u >> 8) & 0xff;
        const a = Math.round(((u & 0xff) / 0xff) * 100) / 100;
        return [r, g, b, a];
    }

    // we used to check for css colors here
    // if _input.css? and rgb = _input.css hex
    //     return rgb

    throw new Error(`unknown hex color: ${hex}`);
};

const { round: round$4 } = Math;

const rgb2hex = (...args) => {
    let [r, g, b, a] = unpack(args, 'rgba');
    let mode = last(args) || 'auto';
    if (a === undefined) a = 1;
    if (mode === 'auto') {
        mode = a < 1 ? 'rgba' : 'rgb';
    }
    r = round$4(r);
    g = round$4(g);
    b = round$4(b);
    const u = (r << 16) | (g << 8) | b;
    let str = '000000' + u.toString(16); //#.toUpperCase();
    str = str.substr(str.length - 6);
    let hxa = '0' + round$4(a * 255).toString(16);
    hxa = hxa.substr(hxa.length - 2);
    switch (mode.toLowerCase()) {
        case 'rgba':
            return `#${str}${hxa}`;
        case 'argb':
            return `#${hxa}${str}`;
        default:
            return `#${str}`;
    }
};

Color.prototype.hex = function (mode) {
    return rgb2hex(this._rgb, mode);
};

chroma.hex = (...args) => new Color(...args, 'hex');

input.format.hex = hex2rgb;
input.autodetect.push({
    p: 4,
    test: (h, ...rest) => {
        if (
            !rest.length &&
            type(h) === 'string' &&
            [3, 4, 5, 6, 7, 8, 9].indexOf(h.length) >= 0
        ) {
            return 'hex';
        }
    }
});

const { cos: cos$4 } = Math;

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
    args = unpack(args, 'hsi');
    let [h, s, i] = args;
    let r, g, b;

    if (isNaN(h)) h = 0;
    if (isNaN(s)) s = 0;
    // normalize hue
    if (h > 360) h -= 360;
    if (h < 0) h += 360;
    h /= 360;
    if (h < 1 / 3) {
        b = (1 - s) / 3;
        r = (1 + (s * cos$4(TWOPI * h)) / cos$4(PITHIRD - TWOPI * h)) / 3;
        g = 1 - (b + r);
    } else if (h < 2 / 3) {
        h -= 1 / 3;
        r = (1 - s) / 3;
        g = (1 + (s * cos$4(TWOPI * h)) / cos$4(PITHIRD - TWOPI * h)) / 3;
        b = 1 - (r + g);
    } else {
        h -= 2 / 3;
        g = (1 - s) / 3;
        b = (1 + (s * cos$4(TWOPI * h)) / cos$4(PITHIRD - TWOPI * h)) / 3;
        r = 1 - (g + b);
    }
    r = limit(i * r * 3);
    g = limit(i * g * 3);
    b = limit(i * b * 3);
    return [r * 255, g * 255, b * 255, args.length > 3 ? args[3] : 1];
};

const { min: min$3, sqrt: sqrt$4, acos } = Math;

const rgb2hsi = (...args) => {
    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
    */
    let [r, g, b] = unpack(args, 'rgb');
    r /= 255;
    g /= 255;
    b /= 255;
    let h;
    const min_ = min$3(r, g, b);
    const i = (r + g + b) / 3;
    const s = i > 0 ? 1 - min_ / i : 0;
    if (s === 0) {
        h = NaN;
    } else {
        h = (r - g + (r - b)) / 2;
        h /= sqrt$4((r - g) * (r - g) + (r - b) * (g - b));
        h = acos(h);
        if (b > g) {
            h = TWOPI - h;
        }
        h /= TWOPI;
    }
    return [h * 360, s, i];
};

Color.prototype.hsi = function () {
    return rgb2hsi(this._rgb);
};

chroma.hsi = (...args) => new Color(...args, 'hsi');

input.format.hsi = hsi2rgb;

input.autodetect.push({
    p: 2,
    test: (...args) => {
        args = unpack(args, 'hsi');
        if (type(args) === 'array' && args.length === 3) {
            return 'hsi';
        }
    }
});

Color.prototype.hsl = function () {
    return rgb2hsl$1(this._rgb);
};

chroma.hsl = (...args) => new Color(...args, 'hsl');

input.format.hsl = hsl2rgb;

input.autodetect.push({
    p: 2,
    test: (...args) => {
        args = unpack(args, 'hsl');
        if (type(args) === 'array' && args.length === 3) {
            return 'hsl';
        }
    }
});

const { floor: floor$3 } = Math;

const hsv2rgb = (...args) => {
    args = unpack(args, 'hsv');
    let [h, s, v] = args;
    let r, g, b;
    v *= 255;
    if (s === 0) {
        r = g = b = v;
    } else {
        if (h === 360) h = 0;
        if (h > 360) h -= 360;
        if (h < 0) h += 360;
        h /= 60;

        const i = floor$3(h);
        const f = h - i;
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));

        switch (i) {
            case 0:
                [r, g, b] = [v, t, p];
                break;
            case 1:
                [r, g, b] = [q, v, p];
                break;
            case 2:
                [r, g, b] = [p, v, t];
                break;
            case 3:
                [r, g, b] = [p, q, v];
                break;
            case 4:
                [r, g, b] = [t, p, v];
                break;
            case 5:
                [r, g, b] = [v, p, q];
                break;
        }
    }
    return [r, g, b, args.length > 3 ? args[3] : 1];
};

const { min: min$2, max: max$2 } = Math;

/*
 * supported arguments:
 * - rgb2hsv(r,g,b)
 * - rgb2hsv([r,g,b])
 * - rgb2hsv({r,g,b})
 */
const rgb2hsl = (...args) => {
    args = unpack(args, 'rgb');
    let [r, g, b] = args;
    const min_ = min$2(r, g, b);
    const max_ = max$2(r, g, b);
    const delta = max_ - min_;
    let h, s, v;
    v = max_ / 255.0;
    if (max_ === 0) {
        h = Number.NaN;
        s = 0;
    } else {
        s = delta / max_;
        if (r === max_) h = (g - b) / delta;
        if (g === max_) h = 2 + (b - r) / delta;
        if (b === max_) h = 4 + (r - g) / delta;
        h *= 60;
        if (h < 0) h += 360;
    }
    return [h, s, v];
};

Color.prototype.hsv = function () {
    return rgb2hsl(this._rgb);
};

chroma.hsv = (...args) => new Color(...args, 'hsv');

input.format.hsv = hsv2rgb;

input.autodetect.push({
    p: 2,
    test: (...args) => {
        args = unpack(args, 'hsv');
        if (type(args) === 'array' && args.length === 3) {
            return 'hsv';
        }
    }
});

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
    t3: 0.008856452 // t1 * t1 * t1
};

const { pow: pow$a } = Math;

/*
 * L* [0..100]
 * a [-100..100]
 * b [-100..100]
 */
const lab2rgb = (...args) => {
    args = unpack(args, 'lab');
    const [l, a, b] = args;
    let x, y, z, r, g, b_;

    y = (l + 16) / 116;
    x = isNaN(a) ? y : y + a / 500;
    z = isNaN(b) ? y : y - b / 200;

    y = LAB_CONSTANTS.Yn * lab_xyz(y);
    x = LAB_CONSTANTS.Xn * lab_xyz(x);
    z = LAB_CONSTANTS.Zn * lab_xyz(z);

    r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z); // D65 -> sRGB
    g = xyz_rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z);
    b_ = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

    return [r, g, b_, args.length > 3 ? args[3] : 1];
};

const xyz_rgb = (r) => {
    return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow$a(r, 1 / 2.4) - 0.055);
};

const lab_xyz = (t) => {
    return t > LAB_CONSTANTS.t1
        ? t * t * t
        : LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
};

const { pow: pow$9 } = Math;

const rgb2lab = (...args) => {
    const [r, g, b] = unpack(args, 'rgb');
    const [x, y, z] = rgb2xyz(r, g, b);
    const l = 116 * y - 16;
    return [l < 0 ? 0 : l, 500 * (x - y), 200 * (y - z)];
};

const rgb_xyz = (r) => {
    if ((r /= 255) <= 0.04045) return r / 12.92;
    return pow$9((r + 0.055) / 1.055, 2.4);
};

const xyz_lab = (t) => {
    if (t > LAB_CONSTANTS.t3) return pow$9(t, 1 / 3);
    return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
};

const rgb2xyz = (r, g, b) => {
    r = rgb_xyz(r);
    g = rgb_xyz(g);
    b = rgb_xyz(b);
    const x = xyz_lab(
        (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn
    );
    const y = xyz_lab(
        (0.2126729 * r + 0.7151522 * g + 0.072175 * b) / LAB_CONSTANTS.Yn
    );
    const z = xyz_lab(
        (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn
    );
    return [x, y, z];
};

Color.prototype.lab = function () {
    return rgb2lab(this._rgb);
};

chroma.lab = (...args) => new Color(...args, 'lab');

input.format.lab = lab2rgb;

input.autodetect.push({
    p: 2,
    test: (...args) => {
        args = unpack(args, 'lab');
        if (type(args) === 'array' && args.length === 3) {
            return 'lab';
        }
    }
});

const { sin: sin$3, cos: cos$3 } = Math;

const lch2lab = (...args) => {
    /*
    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
    These formulas were invented by David Dalrymple to obtain maximum contrast without going
    out of gamut if the parameters are in the range 0-1.

    A saturation multiplier was added by Gregor Aisch
    */
    let [l, c, h] = unpack(args, 'lch');
    if (isNaN(h)) h = 0;
    h = h * DEG2RAD;
    return [l, cos$3(h) * c, sin$3(h) * c];
};

const lch2rgb = (...args) => {
    args = unpack(args, 'lch');
    const [l, c, h] = args;
    const [L, a, b_] = lch2lab(l, c, h);
    const [r, g, b] = lab2rgb(L, a, b_);
    return [r, g, b, args.length > 3 ? args[3] : 1];
};

const hcl2rgb = (...args) => {
    const hcl = unpack(args, 'hcl').reverse();
    return lch2rgb(...hcl);
};

const { sqrt: sqrt$3, atan2: atan2$2, round: round$3 } = Math;

const lab2lch = (...args) => {
    const [l, a, b] = unpack(args, 'lab');
    const c = sqrt$3(a * a + b * b);
    let h = (atan2$2(b, a) * RAD2DEG + 360) % 360;
    if (round$3(c * 10000) === 0) h = Number.NaN;
    return [l, c, h];
};

const rgb2lch = (...args) => {
    const [r, g, b] = unpack(args, 'rgb');
    const [l, a, b_] = rgb2lab(r, g, b);
    return lab2lch(l, a, b_);
};

Color.prototype.lch = function () {
    return rgb2lch(this._rgb);
};
Color.prototype.hcl = function () {
    return rgb2lch(this._rgb).reverse();
};

chroma.lch = (...args) => new Color(...args, 'lch');
chroma.hcl = (...args) => new Color(...args, 'hcl');

input.format.lch = lch2rgb;
input.format.hcl = hcl2rgb;
['lch', 'hcl'].forEach((m) =>
    input.autodetect.push({
        p: 2,
        test: (...args) => {
            args = unpack(args, m);
            if (type(args) === 'array' && args.length === 3) {
                return m;
            }
        }
    })
);

/**
	X11 color names

	http://www.w3.org/TR/css3-color/#svg-color
*/

const w3cx11 = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    laserlemon: '#ffff54',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrod: '#fafad2',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    maroon2: '#7f0000',
    maroon3: '#b03060',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    purple2: '#7f007f',
    purple3: '#a020f0',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32'
};

Color.prototype.name = function () {
    const hex = rgb2hex(this._rgb, 'rgb');
    for (let n of Object.keys(w3cx11)) {
        if (w3cx11[n] === hex) return n.toLowerCase();
    }
    return hex;
};

input.format.named = (name) => {
    name = name.toLowerCase();
    if (w3cx11[name]) return hex2rgb(w3cx11[name]);
    throw new Error('unknown color name: ' + name);
};

input.autodetect.push({
    p: 5,
    test: (h, ...rest) => {
        if (!rest.length && type(h) === 'string' && w3cx11[h.toLowerCase()]) {
            return 'named';
        }
    }
});

const num2rgb = (num) => {
    if (type(num) == 'number' && num >= 0 && num <= 0xffffff) {
        const r = num >> 16;
        const g = (num >> 8) & 0xff;
        const b = num & 0xff;
        return [r, g, b, 1];
    }
    throw new Error('unknown num color: ' + num);
};

const rgb2num = (...args) => {
    const [r, g, b] = unpack(args, 'rgb');
    return (r << 16) + (g << 8) + b;
};

Color.prototype.num = function () {
    return rgb2num(this._rgb);
};

chroma.num = (...args) => new Color(...args, 'num');

input.format.num = num2rgb;

input.autodetect.push({
    p: 5,
    test: (...args) => {
        if (
            args.length === 1 &&
            type(args[0]) === 'number' &&
            args[0] >= 0 &&
            args[0] <= 0xffffff
        ) {
            return 'num';
        }
    }
});

const { round: round$2 } = Math;

Color.prototype.rgb = function (rnd = true) {
    if (rnd === false) return this._rgb.slice(0, 3);
    return this._rgb.slice(0, 3).map(round$2);
};

Color.prototype.rgba = function (rnd = true) {
    return this._rgb.slice(0, 4).map((v, i) => {
        return i < 3 ? (rnd === false ? v : round$2(v)) : v;
    });
};

chroma.rgb = (...args) => new Color(...args, 'rgb');

input.format.rgb = (...args) => {
    const rgba = unpack(args, 'rgba');
    if (rgba[3] === undefined) rgba[3] = 1;
    return rgba;
};

input.autodetect.push({
    p: 3,
    test: (...args) => {
        args = unpack(args, 'rgba');
        if (
            type(args) === 'array' &&
            (args.length === 3 ||
                (args.length === 4 &&
                    type(args[3]) == 'number' &&
                    args[3] >= 0 &&
                    args[3] <= 1))
        ) {
            return 'rgb';
        }
    }
});

/*
 * Based on implementation by Neil Bartlett
 * https://github.com/neilbartlett/color-temperature
 */

const { log: log$1 } = Math;

const temperature2rgb = (kelvin) => {
    const temp = kelvin / 100;
    let r, g, b;
    if (temp < 66) {
        r = 255;
        g =
            temp < 6
                ? 0
                : -155.25485562709179 -
                  0.44596950469579133 * (g = temp - 2) +
                  104.49216199393888 * log$1(g);
        b =
            temp < 20
                ? 0
                : -254.76935184120902 +
                  0.8274096064007395 * (b = temp - 10) +
                  115.67994401066147 * log$1(b);
    } else {
        r =
            351.97690566805693 +
            0.114206453784165 * (r = temp - 55) -
            40.25366309332127 * log$1(r);
        g =
            325.4494125711974 +
            0.07943456536662342 * (g = temp - 50) -
            28.0852963507957 * log$1(g);
        b = 255;
    }
    return [r, g, b, 1];
};

/*
 * Based on implementation by Neil Bartlett
 * https://github.com/neilbartlett/color-temperature
 **/

const { round: round$1 } = Math;

const rgb2temperature = (...args) => {
    const rgb = unpack(args, 'rgb');
    const r = rgb[0],
        b = rgb[2];
    let minTemp = 1000;
    let maxTemp = 40000;
    const eps = 0.4;
    let temp;
    while (maxTemp - minTemp > eps) {
        temp = (maxTemp + minTemp) * 0.5;
        const rgb = temperature2rgb(temp);
        if (rgb[2] / rgb[0] >= b / r) {
            maxTemp = temp;
        } else {
            minTemp = temp;
        }
    }
    return round$1(temp);
};

Color.prototype.temp =
    Color.prototype.kelvin =
    Color.prototype.temperature =
        function () {
            return rgb2temperature(this._rgb);
        };

chroma.temp =
    chroma.kelvin =
    chroma.temperature =
        (...args) => new Color(...args, 'temp');

input.format.temp =
    input.format.kelvin =
    input.format.temperature =
        temperature2rgb;

const { pow: pow$8, sign: sign$1 } = Math;

/*
 * L* [0..100]
 * a [-100..100]
 * b [-100..100]
 */
const oklab2rgb = (...args) => {
    args = unpack(args, 'lab');
    const [L, a, b] = args;

    const l = pow$8(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = pow$8(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = pow$8(L - 0.0894841775 * a - 1.291485548 * b, 3);

    return [
        255 * lrgb2rgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        255 * lrgb2rgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        255 * lrgb2rgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
        args.length > 3 ? args[3] : 1
    ];
};

function lrgb2rgb(c) {
    const abs = Math.abs(c);
    if (abs > 0.0031308) {
        return (sign$1(c) || 1) * (1.055 * pow$8(abs, 1 / 2.4) - 0.055);
    }
    return c * 12.92;
}

const { cbrt, pow: pow$7, sign } = Math;

const rgb2oklab = (...args) => {
    // OKLab color space implementation taken from
    // https://bottosson.github.io/posts/oklab/
    const [r, g, b] = unpack(args, 'rgb');
    const [lr, lg, lb] = [
        rgb2lrgb(r / 255),
        rgb2lrgb(g / 255),
        rgb2lrgb(b / 255)
    ];
    const l = cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ];
};

function rgb2lrgb(c) {
    const abs = Math.abs(c);
    if (abs < 0.04045) {
        return c / 12.92;
    }
    return (sign(c) || 1) * pow$7((abs + 0.055) / 1.055, 2.4);
}

Color.prototype.oklab = function () {
    return rgb2oklab(this._rgb);
};

chroma.oklab = (...args) => new Color(...args, 'oklab');

input.format.oklab = oklab2rgb;

input.autodetect.push({
    p: 3,
    test: (...args) => {
        args = unpack(args, 'oklab');
        if (type(args) === 'array' && args.length === 3) {
            return 'oklab';
        }
    }
});

const oklch2rgb = (...args) => {
    args = unpack(args, 'lch');
    const [l, c, h] = args;
    const [L, a, b_] = lch2lab(l, c, h);
    const [r, g, b] = oklab2rgb(L, a, b_);
    return [r, g, b, args.length > 3 ? args[3] : 1];
};

const rgb2oklch = (...args) => {
    const [r, g, b] = unpack(args, 'rgb');
    const [l, a, b_] = rgb2oklab(r, g, b);
    return lab2lch(l, a, b_);
};

Color.prototype.oklch = function () {
    return rgb2oklch(this._rgb);
};

chroma.oklch = (...args) => new Color(...args, 'oklch');

input.format.oklch = oklch2rgb;

input.autodetect.push({
    p: 3,
    test: (...args) => {
        args = unpack(args, 'oklch');
        if (type(args) === 'array' && args.length === 3) {
            return 'oklch';
        }
    }
});

Color.prototype.alpha = function (a, mutate = false) {
    if (a !== undefined && type(a) === 'number') {
        if (mutate) {
            this._rgb[3] = a;
            return this;
        }
        return new Color([this._rgb[0], this._rgb[1], this._rgb[2], a], 'rgb');
    }
    return this._rgb[3];
};

Color.prototype.clipped = function () {
    return this._rgb._clipped || false;
};

Color.prototype.darken = function (amount = 1) {
    const me = this;
    const lab = me.lab();
    lab[0] -= LAB_CONSTANTS.Kn * amount;
    return new Color(lab, 'lab').alpha(me.alpha(), true);
};

Color.prototype.brighten = function (amount = 1) {
    return this.darken(-amount);
};

Color.prototype.darker = Color.prototype.darken;
Color.prototype.brighter = Color.prototype.brighten;

Color.prototype.get = function (mc) {
    const [mode, channel] = mc.split('.');
    const src = this[mode]();
    if (channel) {
        const i = mode.indexOf(channel) - (mode.substr(0, 2) === 'ok' ? 2 : 0);
        if (i > -1) return src[i];
        throw new Error(`unknown channel ${channel} in mode ${mode}`);
    } else {
        return src;
    }
};

const { pow: pow$6 } = Math;

const EPS = 1e-7;
const MAX_ITER = 20;

Color.prototype.luminance = function (lum, mode = 'rgb') {
    if (lum !== undefined && type(lum) === 'number') {
        if (lum === 0) {
            // return pure black
            return new Color([0, 0, 0, this._rgb[3]], 'rgb');
        }
        if (lum === 1) {
            // return pure white
            return new Color([255, 255, 255, this._rgb[3]], 'rgb');
        }
        // compute new color using...
        let cur_lum = this.luminance();
        let max_iter = MAX_ITER;

        const test = (low, high) => {
            const mid = low.interpolate(high, 0.5, mode);
            const lm = mid.luminance();
            if (Math.abs(lum - lm) < EPS || !max_iter--) {
                // close enough
                return mid;
            }
            return lm > lum ? test(low, mid) : test(mid, high);
        };

        const rgb = (
            cur_lum > lum
                ? test(new Color([0, 0, 0]), this)
                : test(this, new Color([255, 255, 255]))
        ).rgb();
        return new Color([...rgb, this._rgb[3]]);
    }
    return rgb2luminance(...this._rgb.slice(0, 3));
};

const rgb2luminance = (r, g, b) => {
    // relative luminance
    // see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    r = luminance_x(r);
    g = luminance_x(g);
    b = luminance_x(b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const luminance_x = (x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : pow$6((x + 0.055) / 1.055, 2.4);
};

var index = {};

var mix = (col1, col2, f = 0.5, ...rest) => {
    let mode = rest[0] || 'lrgb';
    if (!index[mode] && !rest.length) {
        // fall back to the first supported mode
        mode = Object.keys(index)[0];
    }
    if (!index[mode]) {
        throw new Error(`interpolation mode ${mode} is not defined`);
    }
    if (type(col1) !== 'object') col1 = new Color(col1);
    if (type(col2) !== 'object') col2 = new Color(col2);
    return index[mode](col1, col2, f).alpha(
        col1.alpha() + f * (col2.alpha() - col1.alpha())
    );
};

Color.prototype.mix = Color.prototype.interpolate = function (
    col2,
    f = 0.5,
    ...rest
) {
    return mix(this, col2, f, ...rest);
};

Color.prototype.premultiply = function (mutate = false) {
    const rgb = this._rgb;
    const a = rgb[3];
    if (mutate) {
        this._rgb = [rgb[0] * a, rgb[1] * a, rgb[2] * a, a];
        return this;
    } else {
        return new Color([rgb[0] * a, rgb[1] * a, rgb[2] * a, a], 'rgb');
    }
};

Color.prototype.saturate = function (amount = 1) {
    const me = this;
    const lch = me.lch();
    lch[1] += LAB_CONSTANTS.Kn * amount;
    if (lch[1] < 0) lch[1] = 0;
    return new Color(lch, 'lch').alpha(me.alpha(), true);
};

Color.prototype.desaturate = function (amount = 1) {
    return this.saturate(-amount);
};

Color.prototype.set = function (mc, value, mutate = false) {
    const [mode, channel] = mc.split('.');
    const src = this[mode]();
    if (channel) {
        const i = mode.indexOf(channel) - (mode.substr(0, 2) === 'ok' ? 2 : 0);
        if (i > -1) {
            if (type(value) == 'string') {
                switch (value.charAt(0)) {
                    case '+':
                        src[i] += +value;
                        break;
                    case '-':
                        src[i] += +value;
                        break;
                    case '*':
                        src[i] *= +value.substr(1);
                        break;
                    case '/':
                        src[i] /= +value.substr(1);
                        break;
                    default:
                        src[i] = +value;
                }
            } else if (type(value) === 'number') {
                src[i] = value;
            } else {
                throw new Error(`unsupported value for Color.set`);
            }
            const out = new Color(src, mode);
            if (mutate) {
                this._rgb = out._rgb;
                return this;
            }
            return out;
        }
        throw new Error(`unknown channel ${channel} in mode ${mode}`);
    } else {
        return src;
    }
};

Color.prototype.tint = function (f = 0.5, ...rest) {
    return mix(this, 'white', f, ...rest);
};

Color.prototype.shade = function (f = 0.5, ...rest) {
    return mix(this, 'black', f, ...rest);
};

const rgb = (col1, col2, f) => {
    const xyz0 = col1._rgb;
    const xyz1 = col2._rgb;
    return new Color(
        xyz0[0] + f * (xyz1[0] - xyz0[0]),
        xyz0[1] + f * (xyz1[1] - xyz0[1]),
        xyz0[2] + f * (xyz1[2] - xyz0[2]),
        'rgb'
    );
};

// register interpolator
index.rgb = rgb;

const { sqrt: sqrt$2, pow: pow$5 } = Math;

const lrgb = (col1, col2, f) => {
    const [x1, y1, z1] = col1._rgb;
    const [x2, y2, z2] = col2._rgb;
    return new Color(
        sqrt$2(pow$5(x1, 2) * (1 - f) + pow$5(x2, 2) * f),
        sqrt$2(pow$5(y1, 2) * (1 - f) + pow$5(y2, 2) * f),
        sqrt$2(pow$5(z1, 2) * (1 - f) + pow$5(z2, 2) * f),
        'rgb'
    );
};

// register interpolator
index.lrgb = lrgb;

const lab = (col1, col2, f) => {
    const xyz0 = col1.lab();
    const xyz1 = col2.lab();
    return new Color(
        xyz0[0] + f * (xyz1[0] - xyz0[0]),
        xyz0[1] + f * (xyz1[1] - xyz0[1]),
        xyz0[2] + f * (xyz1[2] - xyz0[2]),
        'lab'
    );
};

// register interpolator
index.lab = lab;

var interpolate_hsx = (col1, col2, f, m) => {
    let xyz0, xyz1;
    if (m === 'hsl') {
        xyz0 = col1.hsl();
        xyz1 = col2.hsl();
    } else if (m === 'hsv') {
        xyz0 = col1.hsv();
        xyz1 = col2.hsv();
    } else if (m === 'hcg') {
        xyz0 = col1.hcg();
        xyz1 = col2.hcg();
    } else if (m === 'hsi') {
        xyz0 = col1.hsi();
        xyz1 = col2.hsi();
    } else if (m === 'lch' || m === 'hcl') {
        m = 'hcl';
        xyz0 = col1.hcl();
        xyz1 = col2.hcl();
    } else if (m === 'oklch') {
        xyz0 = col1.oklch().reverse();
        xyz1 = col2.oklch().reverse();
    }

    let hue0, hue1, sat0, sat1, lbv0, lbv1;
    if (m.substr(0, 1) === 'h' || m === 'oklch') {
        [hue0, sat0, lbv0] = xyz0;
        [hue1, sat1, lbv1] = xyz1;
    }

    let sat, hue, lbv, dh;

    if (!isNaN(hue0) && !isNaN(hue1)) {
        // both colors have hue
        if (hue1 > hue0 && hue1 - hue0 > 180) {
            dh = hue1 - (hue0 + 360);
        } else if (hue1 < hue0 && hue0 - hue1 > 180) {
            dh = hue1 + 360 - hue0;
        } else {
            dh = hue1 - hue0;
        }
        hue = hue0 + f * dh;
    } else if (!isNaN(hue0)) {
        hue = hue0;
        if ((lbv1 == 1 || lbv1 == 0) && m != 'hsv') sat = sat0;
    } else if (!isNaN(hue1)) {
        hue = hue1;
        if ((lbv0 == 1 || lbv0 == 0) && m != 'hsv') sat = sat1;
    } else {
        hue = Number.NaN;
    }

    if (sat === undefined) sat = sat0 + f * (sat1 - sat0);
    lbv = lbv0 + f * (lbv1 - lbv0);
    return m === 'oklch'
        ? new Color([lbv, sat, hue], m)
        : new Color([hue, sat, lbv], m);
};

const lch = (col1, col2, f) => {
    return interpolate_hsx(col1, col2, f, 'lch');
};

// register interpolator
index.lch = lch;
index.hcl = lch;

const num = (col1, col2, f) => {
    const c1 = col1.num();
    const c2 = col2.num();
    return new Color(c1 + f * (c2 - c1), 'num');
};

// register interpolator
index.num = num;

const hcg = (col1, col2, f) => {
    return interpolate_hsx(col1, col2, f, 'hcg');
};

// register interpolator
index.hcg = hcg;

const hsi = (col1, col2, f) => {
    return interpolate_hsx(col1, col2, f, 'hsi');
};

// register interpolator
index.hsi = hsi;

const hsl = (col1, col2, f) => {
    return interpolate_hsx(col1, col2, f, 'hsl');
};

// register interpolator
index.hsl = hsl;

const hsv = (col1, col2, f) => {
    return interpolate_hsx(col1, col2, f, 'hsv');
};

// register interpolator
index.hsv = hsv;

const oklab = (col1, col2, f) => {
    const xyz0 = col1.oklab();
    const xyz1 = col2.oklab();
    return new Color(
        xyz0[0] + f * (xyz1[0] - xyz0[0]),
        xyz0[1] + f * (xyz1[1] - xyz0[1]),
        xyz0[2] + f * (xyz1[2] - xyz0[2]),
        'oklab'
    );
};

// register interpolator
index.oklab = oklab;

const oklch = (col1, col2, f) => {
    return interpolate_hsx(col1, col2, f, 'oklch');
};

// register interpolator
index.oklch = oklch;

const { pow: pow$4, sqrt: sqrt$1, PI: PI$1, cos: cos$2, sin: sin$2, atan2: atan2$1 } = Math;

var average = (colors, mode = 'lrgb', weights = null) => {
    const l = colors.length;
    if (!weights) weights = Array.from(new Array(l)).map(() => 1);
    // normalize weights
    const k =
        l /
        weights.reduce(function (a, b) {
            return a + b;
        });
    weights.forEach((w, i) => {
        weights[i] *= k;
    });
    // convert colors to Color objects
    colors = colors.map((c) => new Color(c));
    if (mode === 'lrgb') {
        return _average_lrgb(colors, weights);
    }
    const first = colors.shift();
    const xyz = first.get(mode);
    const cnt = [];
    let dx = 0;
    let dy = 0;
    // initial color
    for (let i = 0; i < xyz.length; i++) {
        xyz[i] = (xyz[i] || 0) * weights[0];
        cnt.push(isNaN(xyz[i]) ? 0 : weights[0]);
        if (mode.charAt(i) === 'h' && !isNaN(xyz[i])) {
            const A = (xyz[i] / 180) * PI$1;
            dx += cos$2(A) * weights[0];
            dy += sin$2(A) * weights[0];
        }
    }

    let alpha = first.alpha() * weights[0];
    colors.forEach((c, ci) => {
        const xyz2 = c.get(mode);
        alpha += c.alpha() * weights[ci + 1];
        for (let i = 0; i < xyz.length; i++) {
            if (!isNaN(xyz2[i])) {
                cnt[i] += weights[ci + 1];
                if (mode.charAt(i) === 'h') {
                    const A = (xyz2[i] / 180) * PI$1;
                    dx += cos$2(A) * weights[ci + 1];
                    dy += sin$2(A) * weights[ci + 1];
                } else {
                    xyz[i] += xyz2[i] * weights[ci + 1];
                }
            }
        }
    });

    for (let i = 0; i < xyz.length; i++) {
        if (mode.charAt(i) === 'h') {
            let A = (atan2$1(dy / cnt[i], dx / cnt[i]) / PI$1) * 180;
            while (A < 0) A += 360;
            while (A >= 360) A -= 360;
            xyz[i] = A;
        } else {
            xyz[i] = xyz[i] / cnt[i];
        }
    }
    alpha /= l;
    return new Color(xyz, mode).alpha(alpha > 0.99999 ? 1 : alpha, true);
};

const _average_lrgb = (colors, weights) => {
    const l = colors.length;
    const xyz = [0, 0, 0, 0];
    for (let i = 0; i < colors.length; i++) {
        const col = colors[i];
        const f = weights[i] / l;
        const rgb = col._rgb;
        xyz[0] += pow$4(rgb[0], 2) * f;
        xyz[1] += pow$4(rgb[1], 2) * f;
        xyz[2] += pow$4(rgb[2], 2) * f;
        xyz[3] += rgb[3] * f;
    }
    xyz[0] = sqrt$1(xyz[0]);
    xyz[1] = sqrt$1(xyz[1]);
    xyz[2] = sqrt$1(xyz[2]);
    if (xyz[3] > 0.9999999) xyz[3] = 1;
    return new Color(clip_rgb(xyz));
};

// minimal multi-purpose interface


const { pow: pow$3 } = Math;

function scale (colors) {
    // constructor
    let _mode = 'rgb';
    let _nacol = chroma('#ccc');
    let _spread = 0;
    // const _fixed = false;
    let _domain = [0, 1];
    let _pos = [];
    let _padding = [0, 0];
    let _classes = false;
    let _colors = [];
    let _out = false;
    let _min = 0;
    let _max = 1;
    let _correctLightness = false;
    let _colorCache = {};
    let _useCache = true;
    let _gamma = 1;

    // private methods

    const setColors = function (colors) {
        colors = colors || ['#fff', '#000'];
        if (
            colors &&
            type(colors) === 'string' &&
            chroma.brewer &&
            chroma.brewer[colors.toLowerCase()]
        ) {
            colors = chroma.brewer[colors.toLowerCase()];
        }
        if (type(colors) === 'array') {
            // handle single color
            if (colors.length === 1) {
                colors = [colors[0], colors[0]];
            }
            // make a copy of the colors
            colors = colors.slice(0);
            // convert to chroma classes
            for (let c = 0; c < colors.length; c++) {
                colors[c] = chroma(colors[c]);
            }
            // auto-fill color position
            _pos.length = 0;
            for (let c = 0; c < colors.length; c++) {
                _pos.push(c / (colors.length - 1));
            }
        }
        resetCache();
        return (_colors = colors);
    };

    const getClass = function (value) {
        if (_classes != null) {
            const n = _classes.length - 1;
            let i = 0;
            while (i < n && value >= _classes[i]) {
                i++;
            }
            return i - 1;
        }
        return 0;
    };

    let tMapLightness = (t) => t;
    let tMapDomain = (t) => t;

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
        let col, t;
        if (bypassMap == null) {
            bypassMap = false;
        }
        if (isNaN(val) || val === null) {
            return _nacol;
        }
        if (!bypassMap) {
            if (_classes && _classes.length > 2) {
                // find the class
                const c = getClass(val);
                t = c / (_classes.length - 2);
            } else if (_max !== _min) {
                // just interpolate between min/max
                t = (val - _min) / (_max - _min);
            } else {
                t = 1;
            }
        } else {
            t = val;
        }

        // domain map
        t = tMapDomain(t);

        if (!bypassMap) {
            t = tMapLightness(t); // lightness correction
        }

        if (_gamma !== 1) {
            t = pow$3(t, _gamma);
        }

        t = _padding[0] + t * (1 - _padding[0] - _padding[1]);

        t = limit(t, 0, 1);

        const k = Math.floor(t * 10000);

        if (_useCache && _colorCache[k]) {
            col = _colorCache[k];
        } else {
            if (type(_colors) === 'array') {
                //for i in [0.._pos.length-1]
                for (let i = 0; i < _pos.length; i++) {
                    const p = _pos[i];
                    if (t <= p) {
                        col = _colors[i];
                        break;
                    }
                    if (t >= p && i === _pos.length - 1) {
                        col = _colors[i];
                        break;
                    }
                    if (t > p && t < _pos[i + 1]) {
                        t = (t - p) / (_pos[i + 1] - p);
                        col = chroma.interpolate(
                            _colors[i],
                            _colors[i + 1],
                            t,
                            _mode
                        );
                        break;
                    }
                }
            } else if (type(_colors) === 'function') {
                col = _colors(t);
            }
            if (_useCache) {
                _colorCache[k] = col;
            }
        }
        return col;
    };

    var resetCache = () => (_colorCache = {});

    setColors(colors);

    // public interface

    const f = function (v) {
        const c = chroma(getColor(v));
        if (_out && c[_out]) {
            return c[_out]();
        } else {
            return c;
        }
    };

    f.classes = function (classes) {
        if (classes != null) {
            if (type(classes) === 'array') {
                _classes = classes;
                _domain = [classes[0], classes[classes.length - 1]];
            } else {
                const d = chroma.analyze(_domain);
                if (classes === 0) {
                    _classes = [d.min, d.max];
                } else {
                    _classes = chroma.limits(d, 'e', classes);
                }
            }
            return f;
        }
        return _classes;
    };

    f.domain = function (domain) {
        if (!arguments.length) {
            return _domain;
        }
        _min = domain[0];
        _max = domain[domain.length - 1];
        _pos = [];
        const k = _colors.length;
        if (domain.length === k && _min !== _max) {
            // update positions
            for (let d of Array.from(domain)) {
                _pos.push((d - _min) / (_max - _min));
            }
        } else {
            for (let c = 0; c < k; c++) {
                _pos.push(c / (k - 1));
            }
            if (domain.length > 2) {
                // set domain map
                const tOut = domain.map((d, i) => i / (domain.length - 1));
                const tBreaks = domain.map((d) => (d - _min) / (_max - _min));
                if (!tBreaks.every((val, i) => tOut[i] === val)) {
                    tMapDomain = (t) => {
                        if (t <= 0 || t >= 1) return t;
                        let i = 0;
                        while (t >= tBreaks[i + 1]) i++;
                        const f =
                            (t - tBreaks[i]) / (tBreaks[i + 1] - tBreaks[i]);
                        const out = tOut[i] + f * (tOut[i + 1] - tOut[i]);
                        return out;
                    };
                }
            }
        }
        _domain = [_min, _max];
        return f;
    };

    f.mode = function (_m) {
        if (!arguments.length) {
            return _mode;
        }
        _mode = _m;
        resetCache();
        return f;
    };

    f.range = function (colors, _pos) {
        setColors(colors);
        return f;
    };

    f.out = function (_o) {
        _out = _o;
        return f;
    };

    f.spread = function (val) {
        if (!arguments.length) {
            return _spread;
        }
        _spread = val;
        return f;
    };

    f.correctLightness = function (v) {
        if (v == null) {
            v = true;
        }
        _correctLightness = v;
        resetCache();
        if (_correctLightness) {
            tMapLightness = function (t) {
                const L0 = getColor(0, true).lab()[0];
                const L1 = getColor(1, true).lab()[0];
                const pol = L0 > L1;
                let L_actual = getColor(t, true).lab()[0];
                const L_ideal = L0 + (L1 - L0) * t;
                let L_diff = L_actual - L_ideal;
                let t0 = 0;
                let t1 = 1;
                let max_iter = 20;
                while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
                    (function () {
                        if (pol) {
                            L_diff *= -1;
                        }
                        if (L_diff < 0) {
                            t0 = t;
                            t += (t1 - t) * 0.5;
                        } else {
                            t1 = t;
                            t += (t0 - t) * 0.5;
                        }
                        L_actual = getColor(t, true).lab()[0];
                        return (L_diff = L_actual - L_ideal);
                    })();
                }
                return t;
            };
        } else {
            tMapLightness = (t) => t;
        }
        return f;
    };

    f.padding = function (p) {
        if (p != null) {
            if (type(p) === 'number') {
                p = [p, p];
            }
            _padding = p;
            return f;
        } else {
            return _padding;
        }
    };

    f.colors = function (numColors, out) {
        // If no arguments are given, return the original colors that were provided
        if (arguments.length < 2) {
            out = 'hex';
        }
        let result = [];

        if (arguments.length === 0) {
            result = _colors.slice(0);
        } else if (numColors === 1) {
            result = [f(0.5)];
        } else if (numColors > 1) {
            const dm = _domain[0];
            const dd = _domain[1] - dm;
            result = __range__(0, numColors, false).map((i) =>
                f(dm + (i / (numColors - 1)) * dd)
            );
        } else {
            // returns all colors based on the defined classes
            colors = [];
            let samples = [];
            if (_classes && _classes.length > 2) {
                for (
                    let i = 1, end = _classes.length, asc = 1 <= end;
                    asc ? i < end : i > end;
                    asc ? i++ : i--
                ) {
                    samples.push((_classes[i - 1] + _classes[i]) * 0.5);
                }
            } else {
                samples = _domain;
            }
            result = samples.map((v) => f(v));
        }

        if (chroma[out]) {
            result = result.map((c) => c[out]());
        }
        return result;
    };

    f.cache = function (c) {
        if (c != null) {
            _useCache = c;
            return f;
        } else {
            return _useCache;
        }
    };

    f.gamma = function (g) {
        if (g != null) {
            _gamma = g;
            return f;
        } else {
            return _gamma;
        }
    };

    f.nodata = function (d) {
        if (d != null) {
            _nacol = chroma(d);
            return f;
        } else {
            return _nacol;
        }
    };

    return f;
}

function __range__(left, right, inclusive) {
    let range = [];
    let ascending = left < right;
    let end = !inclusive ? right : ascending ? right + 1 : right - 1;
    for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
        range.push(i);
    }
    return range;
}

//
// interpolates between a set of colors uzing a bezier spline
//


// nth row of the pascal triangle
const binom_row = function (n) {
    let row = [1, 1];
    for (let i = 1; i < n; i++) {
        let newrow = [1];
        for (let j = 1; j <= row.length; j++) {
            newrow[j] = (row[j] || 0) + row[j - 1];
        }
        row = newrow;
    }
    return row;
};

const bezier = function (colors) {
    let I, lab0, lab1, lab2;
    colors = colors.map((c) => new Color(c));
    if (colors.length === 2) {
        // linear interpolation
        [lab0, lab1] = colors.map((c) => c.lab());
        I = function (t) {
            const lab = [0, 1, 2].map((i) => lab0[i] + t * (lab1[i] - lab0[i]));
            return new Color(lab, 'lab');
        };
    } else if (colors.length === 3) {
        // quadratic bezier interpolation
        [lab0, lab1, lab2] = colors.map((c) => c.lab());
        I = function (t) {
            const lab = [0, 1, 2].map(
                (i) =>
                    (1 - t) * (1 - t) * lab0[i] +
                    2 * (1 - t) * t * lab1[i] +
                    t * t * lab2[i]
            );
            return new Color(lab, 'lab');
        };
    } else if (colors.length === 4) {
        // cubic bezier interpolation
        let lab3;
        [lab0, lab1, lab2, lab3] = colors.map((c) => c.lab());
        I = function (t) {
            const lab = [0, 1, 2].map(
                (i) =>
                    (1 - t) * (1 - t) * (1 - t) * lab0[i] +
                    3 * (1 - t) * (1 - t) * t * lab1[i] +
                    3 * (1 - t) * t * t * lab2[i] +
                    t * t * t * lab3[i]
            );
            return new Color(lab, 'lab');
        };
    } else if (colors.length >= 5) {
        // general case (degree n bezier)
        let labs, row, n;
        labs = colors.map((c) => c.lab());
        n = colors.length - 1;
        row = binom_row(n);
        I = function (t) {
            const u = 1 - t;
            const lab = [0, 1, 2].map((i) =>
                labs.reduce(
                    (sum, el, j) =>
                        sum + row[j] * u ** (n - j) * t ** j * el[i],
                    0
                )
            );
            return new Color(lab, 'lab');
        };
    } else {
        throw new RangeError('No point in running bezier with only one color.');
    }
    return I;
};

var bezier$1 = (colors) => {
    const f = bezier(colors);
    f.scale = () => scale(f);
    return f;
};

/*
 * interpolates between a set of colors uzing a bezier spline
 * blend mode formulas taken from https://web.archive.org/web/20180110014946/http://www.venture-ware.com/kevin/coding/lets-learn-math-photoshop-blend-modes/
 */


const blend = (bottom, top, mode) => {
    if (!blend[mode]) {
        throw new Error('unknown blend mode ' + mode);
    }
    return blend[mode](bottom, top);
};

const blend_f = (f) => (bottom, top) => {
    const c0 = chroma(top).rgb();
    const c1 = chroma(bottom).rgb();
    return chroma.rgb(f(c0, c1));
};

const each = (f) => (c0, c1) => {
    const out = [];
    out[0] = f(c0[0], c1[0]);
    out[1] = f(c0[1], c1[1]);
    out[2] = f(c0[2], c1[2]);
    return out;
};

const normal = (a) => a;
const multiply = (a, b) => (a * b) / 255;
const darken = (a, b) => (a > b ? b : a);
const lighten = (a, b) => (a > b ? a : b);
const screen = (a, b) => 255 * (1 - (1 - a / 255) * (1 - b / 255));
const overlay = (a, b) =>
    b < 128 ? (2 * a * b) / 255 : 255 * (1 - 2 * (1 - a / 255) * (1 - b / 255));
const burn = (a, b) => 255 * (1 - (1 - b / 255) / (a / 255));
const dodge = (a, b) => {
    if (a === 255) return 255;
    a = (255 * (b / 255)) / (1 - a / 255);
    return a > 255 ? 255 : a;
};

// # add = (a,b) ->
// #     if (a + b > 255) then 255 else a + b

blend.normal = blend_f(each(normal));
blend.multiply = blend_f(each(multiply));
blend.screen = blend_f(each(screen));
blend.overlay = blend_f(each(overlay));
blend.darken = blend_f(each(darken));
blend.lighten = blend_f(each(lighten));
blend.dodge = blend_f(each(dodge));
blend.burn = blend_f(each(burn));

// cubehelix interpolation
// based on D.A. Green "A colour scheme for the display of astronomical intensity images"
// http://astron-soc.in/bulletin/11June/289392011.pdf
const { pow: pow$2, sin: sin$1, cos: cos$1 } = Math;

function cubehelix (
    start = 300,
    rotations = -1.5,
    hue = 1,
    gamma = 1,
    lightness = [0, 1]
) {
    let dh = 0,
        dl;
    if (type(lightness) === 'array') {
        dl = lightness[1] - lightness[0];
    } else {
        dl = 0;
        lightness = [lightness, lightness];
    }
    const f = function (fract) {
        const a = TWOPI * ((start + 120) / 360 + rotations * fract);
        const l = pow$2(lightness[0] + dl * fract, gamma);
        const h = dh !== 0 ? hue[0] + fract * dh : hue;
        const amp = (h * l * (1 - l)) / 2;
        const cos_a = cos$1(a);
        const sin_a = sin$1(a);
        const r = l + amp * (-0.14861 * cos_a + 1.78277 * sin_a);
        const g = l + amp * (-0.29227 * cos_a - 0.90649 * sin_a);
        const b = l + amp * (+1.97294 * cos_a);
        return chroma(clip_rgb([r * 255, g * 255, b * 255, 1]));
    };
    f.start = function (s) {
        if (s == null) {
            return start;
        }
        start = s;
        return f;
    };
    f.rotations = function (r) {
        if (r == null) {
            return rotations;
        }
        rotations = r;
        return f;
    };
    f.gamma = function (g) {
        if (g == null) {
            return gamma;
        }
        gamma = g;
        return f;
    };
    f.hue = function (h) {
        if (h == null) {
            return hue;
        }
        hue = h;
        if (type(hue) === 'array') {
            dh = hue[1] - hue[0];
            if (dh === 0) {
                hue = hue[1];
            }
        } else {
            dh = 0;
        }
        return f;
    };
    f.lightness = function (h) {
        if (h == null) {
            return lightness;
        }
        if (type(h) === 'array') {
            lightness = h;
            dl = h[1] - h[0];
        } else {
            lightness = [h, h];
            dl = 0;
        }
        return f;
    };
    f.scale = () => chroma.scale(f);
    f.hue(hue);
    return f;
}

const digits = '0123456789abcdef';

const { floor: floor$2, random } = Math;

var random$1 = () => {
    let code = '#';
    for (let i = 0; i < 6; i++) {
        code += digits.charAt(floor$2(random() * 16));
    }
    return new Color(code, 'hex');
};

const { log, pow: pow$1, floor: floor$1, abs: abs$1 } = Math;

function analyze(data, key = null) {
    const r = {
        min: Number.MAX_VALUE,
        max: Number.MAX_VALUE * -1,
        sum: 0,
        values: [],
        count: 0
    };
    if (type(data) === 'object') {
        data = Object.values(data);
    }
    data.forEach((val) => {
        if (key && type(val) === 'object') val = val[key];
        if (val !== undefined && val !== null && !isNaN(val)) {
            r.values.push(val);
            r.sum += val;
            if (val < r.min) r.min = val;
            if (val > r.max) r.max = val;
            r.count += 1;
        }
    });

    r.domain = [r.min, r.max];

    r.limits = (mode, num) => limits(r, mode, num);

    return r;
}

function limits(data, mode = 'equal', num = 7) {
    if (type(data) == 'array') {
        data = analyze(data);
    }
    const { min, max } = data;
    const values = data.values.sort((a, b) => a - b);

    if (num === 1) {
        return [min, max];
    }

    const limits = [];

    if (mode.substr(0, 1) === 'c') {
        // continuous
        limits.push(min);
        limits.push(max);
    }

    if (mode.substr(0, 1) === 'e') {
        // equal interval
        limits.push(min);
        for (let i = 1; i < num; i++) {
            limits.push(min + (i / num) * (max - min));
        }
        limits.push(max);
    } else if (mode.substr(0, 1) === 'l') {
        // log scale
        if (min <= 0) {
            throw new Error(
                'Logarithmic scales are only possible for values > 0'
            );
        }
        const min_log = Math.LOG10E * log(min);
        const max_log = Math.LOG10E * log(max);
        limits.push(min);
        for (let i = 1; i < num; i++) {
            limits.push(pow$1(10, min_log + (i / num) * (max_log - min_log)));
        }
        limits.push(max);
    } else if (mode.substr(0, 1) === 'q') {
        // quantile scale
        limits.push(min);
        for (let i = 1; i < num; i++) {
            const p = ((values.length - 1) * i) / num;
            const pb = floor$1(p);
            if (pb === p) {
                limits.push(values[pb]);
            } else {
                // p > pb
                const pr = p - pb;
                limits.push(values[pb] * (1 - pr) + values[pb + 1] * pr);
            }
        }
        limits.push(max);
    } else if (mode.substr(0, 1) === 'k') {
        // k-means clustering
        /*
        implementation based on
        http://code.google.com/p/figue/source/browse/trunk/figue.js#336
        simplified for 1-d input values
        */
        let cluster;
        const n = values.length;
        const assignments = new Array(n);
        const clusterSizes = new Array(num);
        let repeat = true;
        let nb_iters = 0;
        let centroids = null;

        // get seed values
        centroids = [];
        centroids.push(min);
        for (let i = 1; i < num; i++) {
            centroids.push(min + (i / num) * (max - min));
        }
        centroids.push(max);

        while (repeat) {
            // assignment step
            for (let j = 0; j < num; j++) {
                clusterSizes[j] = 0;
            }
            for (let i = 0; i < n; i++) {
                const value = values[i];
                let mindist = Number.MAX_VALUE;
                let best;
                for (let j = 0; j < num; j++) {
                    const dist = abs$1(centroids[j] - value);
                    if (dist < mindist) {
                        mindist = dist;
                        best = j;
                    }
                    clusterSizes[best]++;
                    assignments[i] = best;
                }
            }

            // update centroids step
            const newCentroids = new Array(num);
            for (let j = 0; j < num; j++) {
                newCentroids[j] = null;
            }
            for (let i = 0; i < n; i++) {
                cluster = assignments[i];
                if (newCentroids[cluster] === null) {
                    newCentroids[cluster] = values[i];
                } else {
                    newCentroids[cluster] += values[i];
                }
            }
            for (let j = 0; j < num; j++) {
                newCentroids[j] *= 1 / clusterSizes[j];
            }

            // check convergence
            repeat = false;
            for (let j = 0; j < num; j++) {
                if (newCentroids[j] !== centroids[j]) {
                    repeat = true;
                    break;
                }
            }

            centroids = newCentroids;
            nb_iters++;

            if (nb_iters > 200) {
                repeat = false;
            }
        }

        // finished k-means clustering
        // the next part is borrowed from gabrielflor.it
        const kClusters = {};
        for (let j = 0; j < num; j++) {
            kClusters[j] = [];
        }
        for (let i = 0; i < n; i++) {
            cluster = assignments[i];
            kClusters[cluster].push(values[i]);
        }
        let tmpKMeansBreaks = [];
        for (let j = 0; j < num; j++) {
            tmpKMeansBreaks.push(kClusters[j][0]);
            tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
        }
        tmpKMeansBreaks = tmpKMeansBreaks.sort((a, b) => a - b);
        limits.push(tmpKMeansBreaks[0]);
        for (let i = 1; i < tmpKMeansBreaks.length; i += 2) {
            const v = tmpKMeansBreaks[i];
            if (!isNaN(v) && limits.indexOf(v) === -1) {
                limits.push(v);
            }
        }
    }
    return limits;
}

var contrast = (a, b) => {
    // WCAG contrast ratio
    // see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
    a = new Color(a);
    b = new Color(b);
    const l1 = a.luminance();
    const l2 = b.luminance();
    return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
};

const { sqrt, pow, min: min$1, max: max$1, atan2, abs, cos, sin, exp, PI } = Math;

function deltaE (a, b, Kl = 1, Kc = 1, Kh = 1) {
    // Delta E (CIE 2000)
    // see http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
    var rad2deg = function (rad) {
        return (360 * rad) / (2 * PI);
    };
    var deg2rad = function (deg) {
        return (2 * PI * deg) / 360;
    };
    a = new Color(a);
    b = new Color(b);
    const [L1, a1, b1] = Array.from(a.lab());
    const [L2, a2, b2] = Array.from(b.lab());
    const avgL = (L1 + L2) / 2;
    const C1 = sqrt(pow(a1, 2) + pow(b1, 2));
    const C2 = sqrt(pow(a2, 2) + pow(b2, 2));
    const avgC = (C1 + C2) / 2;
    const G = 0.5 * (1 - sqrt(pow(avgC, 7) / (pow(avgC, 7) + pow(25, 7))));
    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);
    const C1p = sqrt(pow(a1p, 2) + pow(b1, 2));
    const C2p = sqrt(pow(a2p, 2) + pow(b2, 2));
    const avgCp = (C1p + C2p) / 2;
    const arctan1 = rad2deg(atan2(b1, a1p));
    const arctan2 = rad2deg(atan2(b2, a2p));
    const h1p = arctan1 >= 0 ? arctan1 : arctan1 + 360;
    const h2p = arctan2 >= 0 ? arctan2 : arctan2 + 360;
    const avgHp =
        abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;
    const T =
        1 -
        0.17 * cos(deg2rad(avgHp - 30)) +
        0.24 * cos(deg2rad(2 * avgHp)) +
        0.32 * cos(deg2rad(3 * avgHp + 6)) -
        0.2 * cos(deg2rad(4 * avgHp - 63));
    let deltaHp = h2p - h1p;
    deltaHp =
        abs(deltaHp) <= 180
            ? deltaHp
            : h2p <= h1p
              ? deltaHp + 360
              : deltaHp - 360;
    deltaHp = 2 * sqrt(C1p * C2p) * sin(deg2rad(deltaHp) / 2);
    const deltaL = L2 - L1;
    const deltaCp = C2p - C1p;
    const sl = 1 + (0.015 * pow(avgL - 50, 2)) / sqrt(20 + pow(avgL - 50, 2));
    const sc = 1 + 0.045 * avgCp;
    const sh = 1 + 0.015 * avgCp * T;
    const deltaTheta = 30 * exp(-pow((avgHp - 275) / 25, 2));
    const Rc = 2 * sqrt(pow(avgCp, 7) / (pow(avgCp, 7) + pow(25, 7)));
    const Rt = -Rc * sin(2 * deg2rad(deltaTheta));
    const result = sqrt(
        pow(deltaL / (Kl * sl), 2) +
            pow(deltaCp / (Kc * sc), 2) +
            pow(deltaHp / (Kh * sh), 2) +
            Rt * (deltaCp / (Kc * sc)) * (deltaHp / (Kh * sh))
    );
    return max$1(0, min$1(100, result));
}

// simple Euclidean distance
function distance (a, b, mode = 'lab') {
    // Delta E (CIE 1976)
    // see http://www.brucelindbloom.com/index.html?Equations.html
    a = new Color(a);
    b = new Color(b);
    const l1 = a.get(mode);
    const l2 = b.get(mode);
    let sum_sq = 0;
    for (let i in l1) {
        const d = (l1[i] || 0) - (l2[i] || 0);
        sum_sq += d * d;
    }
    return Math.sqrt(sum_sq);
}

var valid = (...args) => {
    try {
        new Color(...args);
        return true;
        // eslint-disable-next-line
    } catch (e) {
        return false;
    }
};

// some pre-defined color scales:

var scales = {
    cool() {
        return scale([chroma.hsl(180, 1, 0.9), chroma.hsl(250, 0.7, 0.4)]);
    },
    hot() {
        return scale(['#000', '#f00', '#ff0', '#fff']).mode(
            'rgb'
        );
    }
};

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
    OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
    BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
    Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
    YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
    YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
    Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
    Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
    Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
    YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
    PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
    Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
    Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],

    // diverging
    Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
    RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
    PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
    PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
    RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
    BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
    RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
    PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],

    // qualitative
    Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
    Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
    Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
    Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
    Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
    Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
    Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']
};

// add lowercase aliases for case-insensitive matches
for (let key of Object.keys(colorbrewer)) {
    colorbrewer[key.toLowerCase()] = colorbrewer[key];
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
    brewer: colorbrewer
});

const overridePrimitiveColors = () => {
    const inlangMessageBundle = document.querySelector("inlang-message-bundle");
    if (!inlangMessageBundle)
        return undefined;
    const primitives = ["primary", "success", "warning", "danger", "neutral"];
    for (const primitive of primitives) {
        const unformattedColor = window
            .getComputedStyle(inlangMessageBundle)
            .getPropertyValue(`--inlang-color-${primitive}`)
            .trim();
        if (unformattedColor !== "") {
            const colorShades = getPalette(unformattedColor);
            appendCSSProperties(colorShades, primitive, inlangMessageBundle);
        }
    }
};
const appendCSSProperties = (colorShades, primitive, element) => {
    let textContent = Object.entries(colorShades)
        .map(([index, shade]) => `--sl-color-${primitive}-${index}: ${shade} !important;`)
        .join("\n");
    textContent = ":host { " + textContent + " }";
    const shadowRoot = element.shadowRoot || element.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = textContent;
    shadowRoot.appendChild(style);
};
const getColor = (unformattedColor) => chroma(unformattedColor);
const getPalette = (unformattedColor) => {
    const color = getColor(unformattedColor);
    const colors = chroma
        .scale(["white", color, "black"])
        .domain([0, 0.6, 1])
        .mode("lrgb");
    const palette = {};
    // Create 50
    palette[50] = colors(0.05).hex();
    // Create 100-900
    for (let i = 0.1; i < 0.9; i += 0.1) {
        palette[Math.round(i * 1000)] = colors(i).hex();
    }
    // Create 950
    palette[950] = colors(0.95).hex();
    return palette;
};

//generalized event dispatcher
const createChangeEvent = (detail) => {
    const onChangeEvent = new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail,
    });
    return onChangeEvent;
};

// src/components/spinner/spinner.styles.ts
var spinner_styles_default = i$6`
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
`;

const connectedElements = new Set();
const translations = new Map();
let fallback;
let documentDirection = 'ltr';
let documentLanguage = 'en';
const isClient = (typeof MutationObserver !== "undefined" && typeof document !== "undefined" && typeof document.documentElement !== "undefined");
if (isClient) {
    const documentElementObserver = new MutationObserver(update);
    documentDirection = document.documentElement.dir || 'ltr';
    documentLanguage = document.documentElement.lang || navigator.language;
    documentElementObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['dir', 'lang']
    });
}
function registerTranslation(...translation) {
    translation.map(t => {
        const code = t.$code.toLowerCase();
        if (translations.has(code)) {
            translations.set(code, Object.assign(Object.assign({}, translations.get(code)), t));
        }
        else {
            translations.set(code, t);
        }
        if (!fallback) {
            fallback = t;
        }
    });
    update();
}
function update() {
    if (isClient) {
        documentDirection = document.documentElement.dir || 'ltr';
        documentLanguage = document.documentElement.lang || navigator.language;
    }
    [...connectedElements.keys()].map((el) => {
        if (typeof el.requestUpdate === 'function') {
            el.requestUpdate();
        }
    });
}
let LocalizeController$1 = class LocalizeController {
    constructor(host) {
        this.host = host;
        this.host.addController(this);
    }
    hostConnected() {
        connectedElements.add(this.host);
    }
    hostDisconnected() {
        connectedElements.delete(this.host);
    }
    dir() {
        return `${this.host.dir || documentDirection}`.toLowerCase();
    }
    lang() {
        return `${this.host.lang || documentLanguage}`.toLowerCase();
    }
    getTranslationData(lang) {
        var _a, _b;
        const locale = new Intl.Locale(lang.replace(/_/g, '-'));
        const language = locale === null || locale === void 0 ? void 0 : locale.language.toLowerCase();
        const region = (_b = (_a = locale === null || locale === void 0 ? void 0 : locale.region) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
        const primary = translations.get(`${language}-${region}`);
        const secondary = translations.get(language);
        return { locale, language, region, primary, secondary };
    }
    exists(key, options) {
        var _a;
        const { primary, secondary } = this.getTranslationData((_a = options.lang) !== null && _a !== void 0 ? _a : this.lang());
        options = Object.assign({ includeFallback: false }, options);
        if ((primary && primary[key]) ||
            (secondary && secondary[key]) ||
            (options.includeFallback && fallback && fallback[key])) {
            return true;
        }
        return false;
    }
    term(key, ...args) {
        const { primary, secondary } = this.getTranslationData(this.lang());
        let term;
        if (primary && primary[key]) {
            term = primary[key];
        }
        else if (secondary && secondary[key]) {
            term = secondary[key];
        }
        else if (fallback && fallback[key]) {
            term = fallback[key];
        }
        else {
            console.error(`No translation found for: ${String(key)}`);
            return String(key);
        }
        if (typeof term === 'function') {
            return term(...args);
        }
        return term;
    }
    date(dateToFormat, options) {
        dateToFormat = new Date(dateToFormat);
        return new Intl.DateTimeFormat(this.lang(), options).format(dateToFormat);
    }
    number(numberToFormat, options) {
        numberToFormat = Number(numberToFormat);
        return isNaN(numberToFormat) ? '' : new Intl.NumberFormat(this.lang(), options).format(numberToFormat);
    }
    relativeTime(value, unit, options) {
        return new Intl.RelativeTimeFormat(this.lang(), options).format(value, unit);
    }
};

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
    if (num === 0)
      return "No options selected";
    if (num === 1)
      return "1 option selected";
    return `${num} options selected`;
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
  toggleColorFormat: "Toggle color format"
};
registerTranslation(translation);
var en_default = translation;

var LocalizeController = class extends LocalizeController$1 {
};
registerTranslation(en_default);

// src/styles/component.styles.ts
var component_styles_default = i$6`
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
`;

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};

var ShoelaceElement = class extends r$4 {
  constructor() {
    super();
    Object.entries(this.constructor.dependencies).forEach(([name, component]) => {
      this.constructor.define(name, component);
    });
  }
  emit(name, options) {
    const event = new CustomEvent(name, __spreadValues({
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {}
    }, options));
    this.dispatchEvent(event);
    return event;
  }
  /* eslint-enable */
  static define(name, elementConstructor = this, options = {}) {
    const currentlyRegisteredConstructor = customElements.get(name);
    if (!currentlyRegisteredConstructor) {
      customElements.define(name, class extends elementConstructor {
      }, options);
      return;
    }
    let newVersion = " (unknown version)";
    let existingVersion = newVersion;
    if ("version" in elementConstructor && elementConstructor.version) {
      newVersion = " v" + elementConstructor.version;
    }
    if ("version" in currentlyRegisteredConstructor && currentlyRegisteredConstructor.version) {
      existingVersion = " v" + currentlyRegisteredConstructor.version;
    }
    if (newVersion && existingVersion && newVersion === existingVersion) {
      return;
    }
    console.warn(
      `Attempted to register <${name}>${newVersion}, but <${name}>${existingVersion} has already been registered.`
    );
  }
};
/* eslint-disable */
// @ts-expect-error This is auto-injected at build time.
ShoelaceElement.version = "2.14.0";
ShoelaceElement.dependencies = {};
__decorateClass([
  n$4()
], ShoelaceElement.prototype, "dir", 2);
__decorateClass([
  n$4()
], ShoelaceElement.prototype, "lang", 2);

var SlSpinner = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.localize = new LocalizeController(this);
  }
  render() {
    return x$4`
      <svg part="base" class="spinner" role="progressbar" aria-label=${this.localize.term("loading")}>
        <circle class="spinner__track"></circle>
        <circle class="spinner__indicator"></circle>
      </svg>
    `;
  }
};
SlSpinner.styles = [component_styles_default, spinner_styles_default];

// src/internal/form.ts
var formCollections = /* @__PURE__ */ new WeakMap();
var reportValidityOverloads = /* @__PURE__ */ new WeakMap();
var checkValidityOverloads = /* @__PURE__ */ new WeakMap();
var userInteractedControls = /* @__PURE__ */ new WeakSet();
var interactions = /* @__PURE__ */ new WeakMap();
var FormControlController = class {
  constructor(host, options) {
    this.handleFormData = (event) => {
      const disabled = this.options.disabled(this.host);
      const name = this.options.name(this.host);
      const value = this.options.value(this.host);
      const isButton = this.host.tagName.toLowerCase() === "sl-button";
      if (this.host.isConnected && !disabled && !isButton && typeof name === "string" && name.length > 0 && typeof value !== "undefined") {
        if (Array.isArray(value)) {
          value.forEach((val) => {
            event.formData.append(name, val.toString());
          });
        } else {
          event.formData.append(name, value.toString());
        }
      }
    };
    this.handleFormSubmit = (event) => {
      var _a;
      const disabled = this.options.disabled(this.host);
      const reportValidity = this.options.reportValidity;
      if (this.form && !this.form.noValidate) {
        (_a = formCollections.get(this.form)) == null ? void 0 : _a.forEach((control) => {
          this.setUserInteracted(control, true);
        });
      }
      if (this.form && !this.form.noValidate && !disabled && !reportValidity(this.host)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    this.handleFormReset = () => {
      this.options.setValue(this.host, this.options.defaultValue(this.host));
      this.setUserInteracted(this.host, false);
      interactions.set(this.host, []);
    };
    this.handleInteraction = (event) => {
      const emittedEvents = interactions.get(this.host);
      if (!emittedEvents.includes(event.type)) {
        emittedEvents.push(event.type);
      }
      if (emittedEvents.length === this.options.assumeInteractionOn.length) {
        this.setUserInteracted(this.host, true);
      }
    };
    this.checkFormValidity = () => {
      if (this.form && !this.form.noValidate) {
        const elements = this.form.querySelectorAll("*");
        for (const element of elements) {
          if (typeof element.checkValidity === "function") {
            if (!element.checkValidity()) {
              return false;
            }
          }
        }
      }
      return true;
    };
    this.reportFormValidity = () => {
      if (this.form && !this.form.noValidate) {
        const elements = this.form.querySelectorAll("*");
        for (const element of elements) {
          if (typeof element.reportValidity === "function") {
            if (!element.reportValidity()) {
              return false;
            }
          }
        }
      }
      return true;
    };
    (this.host = host).addController(this);
    this.options = __spreadValues({
      form: (input) => {
        const formId = input.form;
        if (formId) {
          const root = input.getRootNode();
          const form = root.getElementById(formId);
          if (form) {
            return form;
          }
        }
        return input.closest("form");
      },
      name: (input) => input.name,
      value: (input) => input.value,
      defaultValue: (input) => input.defaultValue,
      disabled: (input) => {
        var _a;
        return (_a = input.disabled) != null ? _a : false;
      },
      reportValidity: (input) => typeof input.reportValidity === "function" ? input.reportValidity() : true,
      checkValidity: (input) => typeof input.checkValidity === "function" ? input.checkValidity() : true,
      setValue: (input, value) => input.value = value,
      assumeInteractionOn: ["sl-input"]
    }, options);
  }
  hostConnected() {
    const form = this.options.form(this.host);
    if (form) {
      this.attachForm(form);
    }
    interactions.set(this.host, []);
    this.options.assumeInteractionOn.forEach((event) => {
      this.host.addEventListener(event, this.handleInteraction);
    });
  }
  hostDisconnected() {
    this.detachForm();
    interactions.delete(this.host);
    this.options.assumeInteractionOn.forEach((event) => {
      this.host.removeEventListener(event, this.handleInteraction);
    });
  }
  hostUpdated() {
    const form = this.options.form(this.host);
    if (!form) {
      this.detachForm();
    }
    if (form && this.form !== form) {
      this.detachForm();
      this.attachForm(form);
    }
    if (this.host.hasUpdated) {
      this.setValidity(this.host.validity.valid);
    }
  }
  attachForm(form) {
    if (form) {
      this.form = form;
      if (formCollections.has(this.form)) {
        formCollections.get(this.form).add(this.host);
      } else {
        formCollections.set(this.form, /* @__PURE__ */ new Set([this.host]));
      }
      this.form.addEventListener("formdata", this.handleFormData);
      this.form.addEventListener("submit", this.handleFormSubmit);
      this.form.addEventListener("reset", this.handleFormReset);
      if (!reportValidityOverloads.has(this.form)) {
        reportValidityOverloads.set(this.form, this.form.reportValidity);
        this.form.reportValidity = () => this.reportFormValidity();
      }
      if (!checkValidityOverloads.has(this.form)) {
        checkValidityOverloads.set(this.form, this.form.checkValidity);
        this.form.checkValidity = () => this.checkFormValidity();
      }
    } else {
      this.form = void 0;
    }
  }
  detachForm() {
    if (!this.form)
      return;
    const formCollection = formCollections.get(this.form);
    if (!formCollection) {
      return;
    }
    formCollection.delete(this.host);
    if (formCollection.size <= 0) {
      this.form.removeEventListener("formdata", this.handleFormData);
      this.form.removeEventListener("submit", this.handleFormSubmit);
      this.form.removeEventListener("reset", this.handleFormReset);
      if (reportValidityOverloads.has(this.form)) {
        this.form.reportValidity = reportValidityOverloads.get(this.form);
        reportValidityOverloads.delete(this.form);
      }
      if (checkValidityOverloads.has(this.form)) {
        this.form.checkValidity = checkValidityOverloads.get(this.form);
        checkValidityOverloads.delete(this.form);
      }
      this.form = void 0;
    }
  }
  setUserInteracted(el, hasInteracted) {
    if (hasInteracted) {
      userInteractedControls.add(el);
    } else {
      userInteractedControls.delete(el);
    }
    el.requestUpdate();
  }
  doAction(type, submitter) {
    if (this.form) {
      const button = document.createElement("button");
      button.type = type;
      button.style.position = "absolute";
      button.style.width = "0";
      button.style.height = "0";
      button.style.clipPath = "inset(50%)";
      button.style.overflow = "hidden";
      button.style.whiteSpace = "nowrap";
      if (submitter) {
        button.name = submitter.name;
        button.value = submitter.value;
        ["formaction", "formenctype", "formmethod", "formnovalidate", "formtarget"].forEach((attr) => {
          if (submitter.hasAttribute(attr)) {
            button.setAttribute(attr, submitter.getAttribute(attr));
          }
        });
      }
      this.form.append(button);
      button.click();
      button.remove();
    }
  }
  /** Returns the associated `<form>` element, if one exists. */
  getForm() {
    var _a;
    return (_a = this.form) != null ? _a : null;
  }
  /** Resets the form, restoring all the control to their default value */
  reset(submitter) {
    this.doAction("reset", submitter);
  }
  /** Submits the form, triggering validation and form data injection. */
  submit(submitter) {
    this.doAction("submit", submitter);
  }
  /**
   * Synchronously sets the form control's validity. Call this when you know the future validity but need to update
   * the host element immediately, i.e. before Lit updates the component in the next update.
   */
  setValidity(isValid) {
    const host = this.host;
    const hasInteracted = Boolean(userInteractedControls.has(host));
    const required = Boolean(host.required);
    host.toggleAttribute("data-required", required);
    host.toggleAttribute("data-optional", !required);
    host.toggleAttribute("data-invalid", !isValid);
    host.toggleAttribute("data-valid", isValid);
    host.toggleAttribute("data-user-invalid", !isValid && hasInteracted);
    host.toggleAttribute("data-user-valid", isValid && hasInteracted);
  }
  /**
   * Updates the form control's validity based on the current value of `host.validity.valid`. Call this when anything
   * that affects constraint validation changes so the component receives the correct validity states.
   */
  updateValidity() {
    const host = this.host;
    this.setValidity(host.validity.valid);
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
      detail: {}
    });
    if (!originalInvalidEvent) {
      slInvalidEvent.preventDefault();
    }
    if (!this.host.dispatchEvent(slInvalidEvent)) {
      originalInvalidEvent == null ? void 0 : originalInvalidEvent.preventDefault();
    }
  }
};
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
  valueMissing: false
});
Object.freeze(__spreadProps(__spreadValues({}, validValidityState), {
  valid: false,
  valueMissing: true
}));
Object.freeze(__spreadProps(__spreadValues({}, validValidityState), {
  valid: false,
  customError: true
}));

// src/components/button/button.styles.ts
var button_styles_default = i$6`
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
`;

// src/internal/slot.ts
var HasSlotController = class {
  constructor(host, ...slotNames) {
    this.slotNames = [];
    this.handleSlotChange = (event) => {
      const slot = event.target;
      if (this.slotNames.includes("[default]") && !slot.name || slot.name && this.slotNames.includes(slot.name)) {
        this.host.requestUpdate();
      }
    };
    (this.host = host).addController(this);
    this.slotNames = slotNames;
  }
  hasDefaultSlot() {
    return [...this.host.childNodes].some((node) => {
      if (node.nodeType === node.TEXT_NODE && node.textContent.trim() !== "") {
        return true;
      }
      if (node.nodeType === node.ELEMENT_NODE) {
        const el = node;
        const tagName = el.tagName.toLowerCase();
        if (tagName === "sl-visually-hidden") {
          return false;
        }
        if (!el.hasAttribute("slot")) {
          return true;
        }
      }
      return false;
    });
  }
  hasNamedSlot(name) {
    return this.host.querySelector(`:scope > [slot="${name}"]`) !== null;
  }
  test(slotName) {
    return slotName === "[default]" ? this.hasDefaultSlot() : this.hasNamedSlot(slotName);
  }
  hostConnected() {
    this.host.shadowRoot.addEventListener("slotchange", this.handleSlotChange);
  }
  hostDisconnected() {
    this.host.shadowRoot.removeEventListener("slotchange", this.handleSlotChange);
  }
};
function getTextContent(slot) {
  if (!slot) {
    return "";
  }
  const nodes = slot.assignedNodes({ flatten: true });
  let text = "";
  [...nodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  });
  return text;
}

// src/utilities/base-path.ts
var basePath = "";
function setBasePath(path) {
  basePath = path;
}
function getBasePath(subpath = "") {
  if (!basePath) {
    const scripts = [...document.getElementsByTagName("script")];
    const configScript = scripts.find((script) => script.hasAttribute("data-shoelace"));
    if (configScript) {
      setBasePath(configScript.getAttribute("data-shoelace"));
    } else {
      const fallbackScript = scripts.find((s) => {
        return /shoelace(\.min)?\.js($|\?)/.test(s.src) || /shoelace-autoloader(\.min)?\.js($|\?)/.test(s.src);
      });
      let path = "";
      if (fallbackScript) {
        path = fallbackScript.getAttribute("src");
      }
      setBasePath(path.split("/").slice(0, -1).join("/"));
    }
  }
  return basePath.replace(/\/$/, "") + (subpath ? `/${subpath.replace(/^\//, "")}` : ``);
}

// src/components/icon/library.default.ts
var library = {
  name: "default",
  resolver: (name) => getBasePath(`assets/icons/${name}.svg`)
};
var library_default_default = library;

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
  `
};
var systemLibrary = {
  name: "system",
  resolver: (name) => {
    if (name in icons) {
      return `data:image/svg+xml,${encodeURIComponent(icons[name])}`;
    }
    return "";
  }
};
var library_system_default = systemLibrary;

// src/components/icon/library.ts
var registry = [library_default_default, library_system_default];
var watchedIcons = [];
function watchIcon(icon) {
  watchedIcons.push(icon);
}
function unwatchIcon(icon) {
  watchedIcons = watchedIcons.filter((el) => el !== icon);
}
function getIconLibrary(name) {
  return registry.find((lib) => lib.name === name);
}

// src/components/icon/icon.styles.ts
var icon_styles_default = i$6`
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
`;

// src/internal/watch.ts
function watch(propertyName, options) {
  const resolvedOptions = __spreadValues({
    waitUntilFirstUpdate: false
  }, options);
  return (proto, decoratedFnName) => {
    const { update } = proto;
    const watchedProperties = Array.isArray(propertyName) ? propertyName : [propertyName];
    proto.update = function(changedProps) {
      watchedProperties.forEach((property) => {
        const key = property;
        if (changedProps.has(key)) {
          const oldValue = changedProps.get(key);
          const newValue = this[key];
          if (oldValue !== newValue) {
            if (!resolvedOptions.waitUntilFirstUpdate || this.hasUpdated) {
              this[decoratedFnName](oldValue, newValue);
            }
          }
        }
      });
      update.call(this, changedProps);
    };
  };
}

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const e$5=(o,t)=>void 0===t?void 0!==o?._$litType$:o?._$litType$===t,f$2=o=>void 0===o.strings,u$2={},m$4=(o,t=u$2)=>o._$AH=t;

var CACHEABLE_ERROR = Symbol();
var RETRYABLE_ERROR = Symbol();
var parser;
var iconCache = /* @__PURE__ */ new Map();
var SlIcon = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.initialRender = false;
    this.svg = null;
    this.label = "";
    this.library = "default";
  }
  /** Given a URL, this function returns the resulting SVG element or an appropriate error symbol. */
  async resolveIcon(url, library) {
    var _a;
    let fileData;
    if (library == null ? void 0 : library.spriteSheet) {
      return x$4`<svg part="svg">
        <use part="use" href="${url}"></use>
      </svg>`;
    }
    try {
      fileData = await fetch(url, { mode: "cors" });
      if (!fileData.ok)
        return fileData.status === 410 ? CACHEABLE_ERROR : RETRYABLE_ERROR;
    } catch (e) {
      return RETRYABLE_ERROR;
    }
    try {
      const div = document.createElement("div");
      div.innerHTML = await fileData.text();
      const svg = div.firstElementChild;
      if (((_a = svg == null ? void 0 : svg.tagName) == null ? void 0 : _a.toLowerCase()) !== "svg")
        return CACHEABLE_ERROR;
      if (!parser)
        parser = new DOMParser();
      const doc = parser.parseFromString(svg.outerHTML, "text/html");
      const svgEl = doc.body.querySelector("svg");
      if (!svgEl)
        return CACHEABLE_ERROR;
      svgEl.part.add("svg");
      return document.adoptNode(svgEl);
    } catch (e) {
      return CACHEABLE_ERROR;
    }
  }
  connectedCallback() {
    super.connectedCallback();
    watchIcon(this);
  }
  firstUpdated() {
    this.initialRender = true;
    this.setIcon();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    unwatchIcon(this);
  }
  getIconSource() {
    const library = getIconLibrary(this.library);
    if (this.name && library) {
      return {
        url: library.resolver(this.name),
        fromLibrary: true
      };
    }
    return {
      url: this.src,
      fromLibrary: false
    };
  }
  handleLabelChange() {
    const hasLabel = typeof this.label === "string" && this.label.length > 0;
    if (hasLabel) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
  }
  async setIcon() {
    var _a;
    const { url, fromLibrary } = this.getIconSource();
    const library = fromLibrary ? getIconLibrary(this.library) : void 0;
    if (!url) {
      this.svg = null;
      return;
    }
    let iconResolver = iconCache.get(url);
    if (!iconResolver) {
      iconResolver = this.resolveIcon(url, library);
      iconCache.set(url, iconResolver);
    }
    if (!this.initialRender) {
      return;
    }
    const svg = await iconResolver;
    if (svg === RETRYABLE_ERROR) {
      iconCache.delete(url);
    }
    if (url !== this.getIconSource().url) {
      return;
    }
    if (e$5(svg)) {
      this.svg = svg;
      return;
    }
    switch (svg) {
      case RETRYABLE_ERROR:
      case CACHEABLE_ERROR:
        this.svg = null;
        this.emit("sl-error");
        break;
      default:
        this.svg = svg.cloneNode(true);
        (_a = library == null ? void 0 : library.mutator) == null ? void 0 : _a.call(library, this.svg);
        this.emit("sl-load");
    }
  }
  render() {
    return this.svg;
  }
};
SlIcon.styles = [component_styles_default, icon_styles_default];
__decorateClass([
  r$2()
], SlIcon.prototype, "svg", 2);
__decorateClass([
  n$4({ reflect: true })
], SlIcon.prototype, "name", 2);
__decorateClass([
  n$4()
], SlIcon.prototype, "src", 2);
__decorateClass([
  n$4()
], SlIcon.prototype, "label", 2);
__decorateClass([
  n$4({ reflect: true })
], SlIcon.prototype, "library", 2);
__decorateClass([
  watch("label")
], SlIcon.prototype, "handleLabelChange", 1);
__decorateClass([
  watch(["name", "src", "library"])
], SlIcon.prototype, "setIcon", 1);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},e$4=t=>(...e)=>({_$litDirective$:t,values:e});let i$2 = class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i;}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const e$3=e$4(class extends i$2{constructor(t){if(super(t),t.type!==t$1.ATTRIBUTE||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return " "+Object.keys(t).filter((s=>t[s])).join(" ")+" "}update(s,[i]){if(void 0===this.st){this.st=new Set,void 0!==s.strings&&(this.nt=new Set(s.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in i)i[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(i)}const r=s.element.classList;for(const t of this.st)t in i||(r.remove(t),this.st.delete(t));for(const t in i){const s=!!i[t];s===this.st.has(t)||this.nt?.has(t)||(s?(r.add(t),this.st.add(t)):(r.remove(t),this.st.delete(t)));}return T$4}});

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const a$1=Symbol.for(""),o$5=t=>{if(t?.r===a$1)return t?._$litStatic$},i$1=(t,...r)=>({_$litStatic$:r.reduce(((r,e,a)=>r+(t=>{if(void 0!==t._$litStatic$)return t._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${t}. Use 'unsafeStatic' to pass non-literal values, but\n            take care to ensure page security.`)})(e)+t[a+1]),t[0]),r:a$1}),l$2=new Map,n$3=t=>(r,...e)=>{const a=e.length;let s,i;const n=[],u=[];let c,$=0,f=!1;for(;$<a;){for(c=r[$];$<a&&void 0!==(i=e[$],s=o$5(i));)c+=s+r[++$],f=!0;$!==a&&u.push(i),n.push(c),$++;}if($===a&&n.push(r[a]),f){const t=n.join("$$lit$$");void 0===(r=l$2.get(t))&&(n.raw=n,l$2.set(t,r=n)),e=u;}return t(r,...e)},u$1=n$3(x$4);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o$4=o=>o??E$4;

var SlButton = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.formControlController = new FormControlController(this, {
      assumeInteractionOn: ["click"]
    });
    this.hasSlotController = new HasSlotController(this, "[default]", "prefix", "suffix");
    this.localize = new LocalizeController(this);
    this.hasFocus = false;
    this.invalid = false;
    this.title = "";
    this.variant = "default";
    this.size = "medium";
    this.caret = false;
    this.disabled = false;
    this.loading = false;
    this.outline = false;
    this.pill = false;
    this.circle = false;
    this.type = "button";
    this.name = "";
    this.value = "";
    this.href = "";
    this.rel = "noreferrer noopener";
  }
  /** Gets the validity state object */
  get validity() {
    if (this.isButton()) {
      return this.button.validity;
    }
    return validValidityState;
  }
  /** Gets the validation message */
  get validationMessage() {
    if (this.isButton()) {
      return this.button.validationMessage;
    }
    return "";
  }
  firstUpdated() {
    if (this.isButton()) {
      this.formControlController.updateValidity();
    }
  }
  handleBlur() {
    this.hasFocus = false;
    this.emit("sl-blur");
  }
  handleFocus() {
    this.hasFocus = true;
    this.emit("sl-focus");
  }
  handleClick() {
    if (this.type === "submit") {
      this.formControlController.submit(this);
    }
    if (this.type === "reset") {
      this.formControlController.reset(this);
    }
  }
  handleInvalid(event) {
    this.formControlController.setValidity(false);
    this.formControlController.emitInvalidEvent(event);
  }
  isButton() {
    return this.href ? false : true;
  }
  isLink() {
    return this.href ? true : false;
  }
  handleDisabledChange() {
    if (this.isButton()) {
      this.formControlController.setValidity(this.disabled);
    }
  }
  /** Simulates a click on the button. */
  click() {
    this.button.click();
  }
  /** Sets focus on the button. */
  focus(options) {
    this.button.focus(options);
  }
  /** Removes focus from the button. */
  blur() {
    this.button.blur();
  }
  /** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
  checkValidity() {
    if (this.isButton()) {
      return this.button.checkValidity();
    }
    return true;
  }
  /** Gets the associated form, if one exists. */
  getForm() {
    return this.formControlController.getForm();
  }
  /** Checks for validity and shows the browser's validation message if the control is invalid. */
  reportValidity() {
    if (this.isButton()) {
      return this.button.reportValidity();
    }
    return true;
  }
  /** Sets a custom validation message. Pass an empty string to restore validity. */
  setCustomValidity(message) {
    if (this.isButton()) {
      this.button.setCustomValidity(message);
      this.formControlController.updateValidity();
    }
  }
  render() {
    const isLink = this.isLink();
    const tag = isLink ? i$1`a` : i$1`button`;
    return u$1`
      <${tag}
        part="base"
        class=${e$3({
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
      "button--has-suffix": this.hasSlotController.test("suffix")
    })}
        ?disabled=${o$4(isLink ? void 0 : this.disabled)}
        type=${o$4(isLink ? void 0 : this.type)}
        title=${this.title}
        name=${o$4(isLink ? void 0 : this.name)}
        value=${o$4(isLink ? void 0 : this.value)}
        href=${o$4(isLink ? this.href : void 0)}
        target=${o$4(isLink ? this.target : void 0)}
        download=${o$4(isLink ? this.download : void 0)}
        rel=${o$4(isLink ? this.rel : void 0)}
        role=${o$4(isLink ? void 0 : "button")}
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
        ${this.caret ? u$1` <sl-icon part="caret" class="button__caret" library="system" name="caret"></sl-icon> ` : ""}
        ${this.loading ? u$1`<sl-spinner part="spinner"></sl-spinner>` : ""}
      </${tag}>
    `;
  }
};
SlButton.styles = [component_styles_default, button_styles_default];
SlButton.dependencies = {
  "sl-icon": SlIcon,
  "sl-spinner": SlSpinner
};
__decorateClass([
  e$6(".button")
], SlButton.prototype, "button", 2);
__decorateClass([
  r$2()
], SlButton.prototype, "hasFocus", 2);
__decorateClass([
  r$2()
], SlButton.prototype, "invalid", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "title", 2);
__decorateClass([
  n$4({ reflect: true })
], SlButton.prototype, "variant", 2);
__decorateClass([
  n$4({ reflect: true })
], SlButton.prototype, "size", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlButton.prototype, "caret", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlButton.prototype, "disabled", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlButton.prototype, "loading", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlButton.prototype, "outline", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlButton.prototype, "pill", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlButton.prototype, "circle", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "type", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "name", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "value", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "href", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "target", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "rel", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "download", 2);
__decorateClass([
  n$4()
], SlButton.prototype, "form", 2);
__decorateClass([
  n$4({ attribute: "formaction" })
], SlButton.prototype, "formAction", 2);
__decorateClass([
  n$4({ attribute: "formenctype" })
], SlButton.prototype, "formEnctype", 2);
__decorateClass([
  n$4({ attribute: "formmethod" })
], SlButton.prototype, "formMethod", 2);
__decorateClass([
  n$4({ attribute: "formnovalidate", type: Boolean })
], SlButton.prototype, "formNoValidate", 2);
__decorateClass([
  n$4({ attribute: "formtarget" })
], SlButton.prototype, "formTarget", 2);
__decorateClass([
  watch("disabled", { waitUntilFirstUpdate: true })
], SlButton.prototype, "handleDisabledChange", 1);

// src/components/dropdown/dropdown.styles.ts
var dropdown_styles_default = i$6`
  :host {
    display: inline-block;
  }

  .dropdown::part(popup) {
    z-index: var(--sl-z-index-dropdown);
  }

  .dropdown[data-current-placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .dropdown[data-current-placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .dropdown[data-current-placement^='left']::part(popup) {
    transform-origin: right;
  }

  .dropdown[data-current-placement^='right']::part(popup) {
    transform-origin: left;
  }

  .dropdown__trigger {
    display: block;
  }

  .dropdown__panel {
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    box-shadow: var(--sl-shadow-large);
    border-radius: var(--sl-border-radius-medium);
    pointer-events: none;
  }

  .dropdown--open .dropdown__panel {
    display: block;
    pointer-events: all;
  }

  /* When users slot a menu, make sure it conforms to the popup's auto-size */
  ::slotted(sl-menu) {
    max-width: var(--auto-size-available-width) !important;
    max-height: var(--auto-size-available-height) !important;
  }
`;

// src/internal/tabbable.ts
var computedStyleMap = /* @__PURE__ */ new WeakMap();
function getCachedComputedStyle(el) {
  let computedStyle = computedStyleMap.get(el);
  if (!computedStyle) {
    computedStyle = window.getComputedStyle(el, null);
    computedStyleMap.set(el, computedStyle);
  }
  return computedStyle;
}
function isVisible(el) {
  if (typeof el.checkVisibility === "function") {
    return el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true });
  }
  const computedStyle = getCachedComputedStyle(el);
  return computedStyle.visibility !== "hidden" && computedStyle.display !== "none";
}
function isOverflowingAndTabbable(el) {
  const computedStyle = getCachedComputedStyle(el);
  const { overflowY, overflowX } = computedStyle;
  if (overflowY === "scroll" || overflowX === "scroll") {
    return true;
  }
  if (overflowY !== "auto" || overflowX !== "auto") {
    return false;
  }
  const isOverflowingY = el.scrollHeight > el.clientHeight;
  if (isOverflowingY && overflowY === "auto") {
    return true;
  }
  const isOverflowingX = el.scrollWidth > el.clientWidth;
  if (isOverflowingX && overflowX === "auto") {
    return true;
  }
  return false;
}
function isTabbable(el) {
  const tag = el.tagName.toLowerCase();
  const tabindex = Number(el.getAttribute("tabindex"));
  const hasTabindex = el.hasAttribute("tabindex");
  if (hasTabindex && (isNaN(tabindex) || tabindex <= -1)) {
    return false;
  }
  if (el.hasAttribute("disabled")) {
    return false;
  }
  if (el.closest("[inert]")) {
    return false;
  }
  if (tag === "input" && el.getAttribute("type") === "radio" && !el.hasAttribute("checked")) {
    return false;
  }
  if (!isVisible(el)) {
    return false;
  }
  if ((tag === "audio" || tag === "video") && el.hasAttribute("controls")) {
    return true;
  }
  if (el.hasAttribute("tabindex")) {
    return true;
  }
  if (el.hasAttribute("contenteditable") && el.getAttribute("contenteditable") !== "false") {
    return true;
  }
  const isNativelyTabbable = [
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "audio",
    "video",
    "summary",
    "iframe"
  ].includes(tag);
  if (isNativelyTabbable) {
    return true;
  }
  return isOverflowingAndTabbable(el);
}
function getTabbableBoundary(root) {
  var _a, _b;
  const tabbableElements = getTabbableElements(root);
  const start = (_a = tabbableElements[0]) != null ? _a : null;
  const end = (_b = tabbableElements[tabbableElements.length - 1]) != null ? _b : null;
  return { start, end };
}
function getSlottedChildrenOutsideRootElement(slotElement, root) {
  var _a;
  return ((_a = slotElement.getRootNode({ composed: true })) == null ? void 0 : _a.host) !== root;
}
function getTabbableElements(root) {
  const walkedEls = /* @__PURE__ */ new WeakMap();
  const tabbableElements = [];
  function walk(el) {
    if (el instanceof Element) {
      if (el.hasAttribute("inert") || el.closest("[inert]")) {
        return;
      }
      if (walkedEls.has(el)) {
        return;
      }
      walkedEls.set(el, true);
      if (!tabbableElements.includes(el) && isTabbable(el)) {
        tabbableElements.push(el);
      }
      if (el instanceof HTMLSlotElement && getSlottedChildrenOutsideRootElement(el, root)) {
        el.assignedElements({ flatten: true }).forEach((assignedEl) => {
          walk(assignedEl);
        });
      }
      if (el.shadowRoot !== null && el.shadowRoot.mode === "open") {
        walk(el.shadowRoot);
      }
    }
    for (const e of el.children) {
      walk(e);
    }
  }
  walk(root);
  return tabbableElements.sort((a, b) => {
    const aTabindex = Number(a.getAttribute("tabindex")) || 0;
    const bTabindex = Number(b.getAttribute("tabindex")) || 0;
    return bTabindex - aTabindex;
  });
}

// src/components/popup/popup.styles.ts
var popup_styles_default = i$6`
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
`;

/**
 * Custom positioning reference element.
 * @see https://floating-ui.com/docs/virtual-elements
 */

const min = Math.min;
const max = Math.max;
const round = Math.round;
const floor = Math.floor;
const createCoords = v => ({
  x: v,
  y: v
});
const oppositeSideMap = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom'
};
const oppositeAlignmentMap = {
  start: 'end',
  end: 'start'
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === 'function' ? value(param) : value;
}
function getSide(placement) {
  return placement.split('-')[0];
}
function getAlignment(placement) {
  return placement.split('-')[1];
}
function getOppositeAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
}
function getAxisLength(axis) {
  return axis === 'y' ? 'height' : 'width';
}
function getSideAxis(placement) {
  return ['top', 'bottom'].includes(getSide(placement)) ? 'y' : 'x';
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
}
function getSideList(side, isStart, rtl) {
  const lr = ['left', 'right'];
  const rl = ['right', 'left'];
  const tb = ['top', 'bottom'];
  const bt = ['bottom', 'top'];
  switch (side) {
    case 'top':
    case 'bottom':
      if (rtl) return isStart ? rl : lr;
      return isStart ? lr : rl;
    case 'left':
    case 'right':
      return isStart ? tb : bt;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === 'start', rtl);
  if (alignment) {
    list = list.map(side => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== 'number' ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === 'y';
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case 'top':
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case 'bottom':
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case 'right':
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case 'left':
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case 'start':
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case 'end':
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 *
 * This export does not have any `platform` interface logic. You will need to
 * write one for the platform you are using Floating UI with.
 */
const computePosition$1 = async (reference, floating, config) => {
  const {
    placement = 'bottom',
    strategy = 'absolute',
    middleware = [],
    platform
  } = config;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
  let rects = await platform.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0; i < validMiddleware.length; i++) {
    const {
      name,
      fn
    } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data,
      reset
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
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = {
      ...middlewareData,
      [name]: {
        ...middlewareData[name],
        ...data
      }
    };
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === 'object') {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};

/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing a given clipping boundary on each side.
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 * @see https://floating-ui.com/docs/detectOverflow
 */
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = 'clippingAncestors',
    rootBoundary = 'viewport',
    elementContext = 'floating',
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === 'floating' ? 'reference' : 'floating';
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform.getClippingRect({
    element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === 'floating' ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
  const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow$1 = options => ({
  name: 'arrow',
  options,
  async fn(state) {
    const {
      x,
      y,
      placement,
      rects,
      platform,
      elements,
      middlewareData
    } = state;
    // Since `element` is required, we don't Partial<> the type.
    const {
      element,
      padding = 0
    } = evaluate(options, state) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x,
      y
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform.getDimensions(element);
    const isYAxis = axis === 'y';
    const minProp = isYAxis ? 'top' : 'left';
    const maxProp = isYAxis ? 'bottom' : 'right';
    const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

    // DOM platform can return `window` as the `offsetParent`.
    if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;

    // If the padding is large enough that it causes the arrow to no longer be
    // centered, modify the padding so that it is centered.
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside the floating element's bounds.
    const min$1 = minPadding;
    const max = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset = clamp(min$1, center, max);

    // If the reference is small enough that the arrow's padding causes it to
    // to point to nothing for an aligned placement, adjust the offset of the
    // floating element itself. To ensure `shift()` continues to take action,
    // a single reset is performed when this is true.
    const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max : 0;
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset,
        centerOffset: center - offset - alignmentOffset,
        ...(shouldAddOffset && {
          alignmentOffset
        })
      },
      reset: shouldAddOffset
    };
  }
});

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'flip',
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = 'bestFit',
        fallbackAxisSideDirection = 'none',
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);

      // If a reset by the arrow was caused due to an alignment offset being
      // added, we should skip any logic now since `flip()` has already done its
      // work.
      // https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== 'none';
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements = [initialPlacement, ...fallbackPlacements];
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides[0]], overflow[sides[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];

      // One or more sides is overflowing.
      if (!overflows.every(side => side <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements[nextIndex];
        if (nextPlacement) {
          // Try next placement and re-run the lifecycle.
          return {
            data: {
              index: nextIndex,
              overflows: overflowsData
            },
            reset: {
              placement: nextPlacement
            }
          };
        }

        // First, find the candidates that fit on the mainAxis side of overflow,
        // then find the placement that fits the best on the main crossAxis side.
        let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

        // Otherwise fallback.
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case 'bestFit':
              {
                var _overflowsData$filter2;
                const placement = (_overflowsData$filter2 = overflowsData.filter(d => {
                  if (hasFallbackAxisSideDirection) {
                    const currentSideAxis = getSideAxis(d.placement);
                    return currentSideAxis === initialSideAxis ||
                    // Create a bias to the `y` side axis due to horizontal
                    // reading directions favoring greater width.
                    currentSideAxis === 'y';
                  }
                  return true;
                }).map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                if (placement) {
                  resetPlacement = placement;
                }
                break;
              }
            case 'initialPlacement':
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};

// For type backwards-compatibility, the `OffsetOptions` type was also
// Derivable.

async function convertValueToCoords(state, options) {
  const {
    placement,
    platform,
    elements
  } = state;
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === 'y';
  const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);

  // eslint-disable-next-line prefer-const
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === 'number' ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === 'number') {
    crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
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
    options = 0;
  }
  return {
    name: 'offset',
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);

      // If the placement is the same and the arrow caused an alignment offset
      // then we don't need to change the positioning coordinates.
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'shift',
    options,
    async fn(state) {
      const {
        x,
        y,
        placement
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: _ref => {
            let {
              x,
              y
            } = _ref;
            return {
              x,
              y
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === 'y' ? 'top' : 'left';
        const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
        const min = mainAxisCoord + overflow[minSide];
        const max = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp(min, mainAxisCoord, max);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === 'y' ? 'top' : 'left';
        const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
        const min = crossAxisCoord + overflow[minSide];
        const max = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp(min, crossAxisCoord, max);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
const size$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'size',
    options,
    async fn(state) {
      var _state$middlewareData, _state$middlewareData2;
      const {
        placement,
        rects,
        platform,
        elements
      } = state;
      const {
        apply = () => {},
        ...detectOverflowOptions
      } = evaluate(options, state);
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const side = getSide(placement);
      const alignment = getAlignment(placement);
      const isYAxis = getSideAxis(placement) === 'y';
      const {
        width,
        height
      } = rects.floating;
      let heightSide;
      let widthSide;
      if (side === 'top' || side === 'bottom') {
        heightSide = side;
        widthSide = alignment === ((await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating))) ? 'start' : 'end') ? 'left' : 'right';
      } else {
        widthSide = side;
        heightSide = alignment === 'end' ? 'top' : 'bottom';
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom;
      const maximumClippingWidth = width - overflow.left - overflow.right;
      const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
      const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
      const noShift = !state.middlewareData.shift;
      let availableHeight = overflowAvailableHeight;
      let availableWidth = overflowAvailableWidth;
      if ((_state$middlewareData = state.middlewareData.shift) != null && _state$middlewareData.enabled.x) {
        availableWidth = maximumClippingWidth;
      }
      if ((_state$middlewareData2 = state.middlewareData.shift) != null && _state$middlewareData2.enabled.y) {
        availableHeight = maximumClippingHeight;
      }
      if (noShift && !alignment) {
        const xMin = max(overflow.left, 0);
        const xMax = max(overflow.right, 0);
        const yMin = max(overflow.top, 0);
        const yMax = max(overflow.bottom, 0);
        if (isYAxis) {
          availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
        } else {
          availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
        }
      }
      await apply({
        ...state,
        availableWidth,
        availableHeight
      });
      const nextDimensions = await platform.getDimensions(elements.floating);
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true
          }
        };
      }
      return {};
    }
  };
};

function hasWindow() {
  return typeof window !== 'undefined';
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || '').toLowerCase();
  }
  // Mocked nodes in testing environments may not be instances of Node. By
  // returning `#document` an infinite loop won't occur.
  // https://github.com/floating-ui/floating-ui/issues/2317
  return '#document';
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement$2(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === 'undefined') {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle$1(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !['inline', 'contents'].includes(display);
}
function isTableElement(element) {
  return ['table', 'td', 'th'].includes(getNodeName(element));
}
function isTopLayer(element) {
  return [':popover-open', ':modal'].some(selector => {
    try {
      return element.matches(selector);
    } catch (e) {
      return false;
    }
  });
}
function isContainingBlock(elementOrCss) {
  const webkit = isWebKit();
  const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  return css.transform !== 'none' || css.perspective !== 'none' || (css.containerType ? css.containerType !== 'normal' : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !webkit && (css.filter ? css.filter !== 'none' : false) || ['transform', 'perspective', 'filter'].some(value => (css.willChange || '').includes(value)) || ['paint', 'layout', 'strict', 'content'].some(value => (css.contain || '').includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement$2(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('-webkit-backdrop-filter', 'none');
}
function isLastTraversableNode(node) {
  return ['html', 'body', '#document'].includes(getNodeName(node));
}
function getComputedStyle$1(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === 'html') {
    return node;
  }
  const result =
  // Step into the shadow DOM of the parent of a slotted node.
  node.assignedSlot ||
  // DOM Element detected.
  node.parentNode ||
  // ShadowRoot detected.
  isShadowRoot(node) && node.host ||
  // Fallback.
  getDocumentElement(node);
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement$2(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

function getCssDimensions(element) {
  const css = getComputedStyle$1(element);
  // In testing environments, the `width` and `height` properties are empty
  // strings for SVG elements, returning NaN. Fallback to `0` in this case.
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement$2(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}

function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}

function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement$2(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;

  // 0, NaN, or Infinity should always fallback to 1.

  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}

const noOffsets = /*#__PURE__*/createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}

function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle$1(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}

function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === 'fixed';
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement$2(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement$2(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
  };
}

function getClientRects(element) {
  return Array.from(element.getClientRects());
}

// If <html> has a CSS width greater than the viewport, then this will be
// incorrect for RTL.
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}

// Gets the entire size of the scrollable document area, even extending outside
// of the `<html>` and `<body>` rect bounds if horizontally scrollable.
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle$1(body).direction === 'rtl') {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}

function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}

// Returns the inner client rect, subtracting scrollbars if present.
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement$2(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === 'viewport') {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === 'document') {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      ...clippingAncestor,
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle$1(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
}

// A "clipping ancestor" is an `overflow` element with the characteristic of
// clipping (or hiding) child elements. This returns all clipping ancestors
// of the given element up the tree.
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter(el => isElement(el) && getNodeName(el) !== 'body');
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle$1(element).position === 'fixed';
  let currentNode = elementIsFixed ? getParentNode(element) : element;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle$1(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && ['absolute', 'fixed'].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      // Drop non-containing blocks.
      result = result.filter(ancestor => ancestor !== currentNode);
    } else {
      // Record last containing block for next iteration.
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}

// Gets the maximum area that the element is visible in due to any number of
// clipping ancestors.
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === 'clippingAncestors' ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}

function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}

function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement$2(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === 'fixed';
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      // If the <body> scrollbar appears on the left (e.g. RTL systems). Use
      // Firefox with layout.scrollbar.side = 3 in about:config to test this.
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  let htmlX = 0;
  let htmlY = 0;
  if (documentElement && !isOffsetParentAnElement && !isFixed) {
    const htmlRect = documentElement.getBoundingClientRect();
    htmlY = htmlRect.top + scroll.scrollTop;
    htmlX = htmlRect.left + scroll.scrollLeft -
    // RTL <body> scrollbar.
    getWindowScrollBarX(documentElement, htmlRect);
  }
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlX;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlY;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}

function isStaticPositioned(element) {
  return getComputedStyle$1(element).position === 'static';
}

function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement$2(element) || getComputedStyle$1(element).position === 'fixed') {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;

  // Firefox returns the <html> element as the offsetParent if it's non-static,
  // while Chrome and Safari return the <body> element. The <body> element must
  // be used to perform the correct calculations even if the <html> element is
  // non-static.
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}

// Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement$2(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}

const getElementRects = async function (data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};

function isRTL(element) {
  return getComputedStyle$1(element).direction === 'rtl';
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
  isRTL
};

// https://samthor.au/2021/observing-dom/
function observeMove(element, onMove) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const {
      left,
      top,
      width,
      height
    } = element.getBoundingClientRect();
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          // If the reference is clipped, the ratio is 0. Throttle the refresh
          // to prevent an infinite loop of updates.
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1000);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }

    // Older browsers don't support a `document` as the root and will throw an
    // error.
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  refresh(true);
  return cleanup;
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
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === 'function',
    layoutShift = typeof IntersectionObserver === 'function',
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
  ancestors.forEach(ancestor => {
    ancestorScroll && ancestor.addEventListener('scroll', update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener('resize', update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver(_ref => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
        // Prevent update loops when using the `size` middleware.
        // https://github.com/floating-ui/floating-ui/issues/1740
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    resizeObserver.observe(floating);
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.removeEventListener('scroll', update);
      ancestorResize && ancestor.removeEventListener('resize', update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
const offset = offset$1;

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift = shift$1;

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip = flip$1;

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
const size = size$1;

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow = arrow$1;

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 */
const computePosition = (reference, floating, options) => {
  // This caches the expensive `getClippingElementAncestors` function so that
  // multiple lifecycle resets re-use the same result. It only lives for a
  // single call. If other functions become expensive, we can add them as well.
  const cache = new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition$1(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

/* eslint-disable @typescript-eslint/ban-types */
function offsetParent(element) {
    return offsetParentPolyfill(element);
}
function flatTreeParent(element) {
    if (element.assignedSlot) {
        return element.assignedSlot;
    }
    if (element.parentNode instanceof ShadowRoot) {
        return element.parentNode.host;
    }
    return element.parentNode;
}
function offsetParentPolyfill(element) {
    // Do an initial walk to check for display:none ancestors.
    for (let ancestor = element; ancestor; ancestor = flatTreeParent(ancestor)) {
        if (!(ancestor instanceof Element)) {
            continue;
        }
        if (getComputedStyle(ancestor).display === 'none') {
            return null;
        }
    }
    for (let ancestor = flatTreeParent(element); ancestor; ancestor = flatTreeParent(ancestor)) {
        if (!(ancestor instanceof Element)) {
            continue;
        }
        const style = getComputedStyle(ancestor);
        // Display:contents nodes aren't in the layout tree so they should be skipped.
        if (style.display === 'contents') {
            continue;
        }
        if (style.position !== 'static' || style.filter !== 'none') {
            return ancestor;
        }
        if (ancestor.tagName === 'BODY') {
            return ancestor;
        }
    }
    return null;
}

function isVirtualElement(e) {
  return e !== null && typeof e === "object" && "getBoundingClientRect" in e;
}
var SlPopup = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.active = false;
    this.placement = "top";
    this.strategy = "absolute";
    this.distance = 0;
    this.skidding = 0;
    this.arrow = false;
    this.arrowPlacement = "anchor";
    this.arrowPadding = 10;
    this.flip = false;
    this.flipFallbackPlacements = "";
    this.flipFallbackStrategy = "best-fit";
    this.flipPadding = 0;
    this.shift = false;
    this.shiftPadding = 0;
    this.autoSizePadding = 0;
    this.hoverBridge = false;
    this.updateHoverBridge = () => {
      if (this.hoverBridge && this.anchorEl) {
        const anchorRect = this.anchorEl.getBoundingClientRect();
        const popupRect = this.popup.getBoundingClientRect();
        const isVertical = this.placement.includes("top") || this.placement.includes("bottom");
        let topLeftX = 0;
        let topLeftY = 0;
        let topRightX = 0;
        let topRightY = 0;
        let bottomLeftX = 0;
        let bottomLeftY = 0;
        let bottomRightX = 0;
        let bottomRightY = 0;
        if (isVertical) {
          if (anchorRect.top < popupRect.top) {
            topLeftX = anchorRect.left;
            topLeftY = anchorRect.bottom;
            topRightX = anchorRect.right;
            topRightY = anchorRect.bottom;
            bottomLeftX = popupRect.left;
            bottomLeftY = popupRect.top;
            bottomRightX = popupRect.right;
            bottomRightY = popupRect.top;
          } else {
            topLeftX = popupRect.left;
            topLeftY = popupRect.bottom;
            topRightX = popupRect.right;
            topRightY = popupRect.bottom;
            bottomLeftX = anchorRect.left;
            bottomLeftY = anchorRect.top;
            bottomRightX = anchorRect.right;
            bottomRightY = anchorRect.top;
          }
        } else {
          if (anchorRect.left < popupRect.left) {
            topLeftX = anchorRect.right;
            topLeftY = anchorRect.top;
            topRightX = popupRect.left;
            topRightY = popupRect.top;
            bottomLeftX = anchorRect.right;
            bottomLeftY = anchorRect.bottom;
            bottomRightX = popupRect.left;
            bottomRightY = popupRect.bottom;
          } else {
            topLeftX = popupRect.right;
            topLeftY = popupRect.top;
            topRightX = anchorRect.left;
            topRightY = anchorRect.top;
            bottomLeftX = popupRect.right;
            bottomLeftY = popupRect.bottom;
            bottomRightX = anchorRect.left;
            bottomRightY = anchorRect.bottom;
          }
        }
        this.style.setProperty("--hover-bridge-top-left-x", `${topLeftX}px`);
        this.style.setProperty("--hover-bridge-top-left-y", `${topLeftY}px`);
        this.style.setProperty("--hover-bridge-top-right-x", `${topRightX}px`);
        this.style.setProperty("--hover-bridge-top-right-y", `${topRightY}px`);
        this.style.setProperty("--hover-bridge-bottom-left-x", `${bottomLeftX}px`);
        this.style.setProperty("--hover-bridge-bottom-left-y", `${bottomLeftY}px`);
        this.style.setProperty("--hover-bridge-bottom-right-x", `${bottomRightX}px`);
        this.style.setProperty("--hover-bridge-bottom-right-y", `${bottomRightY}px`);
      }
    };
  }
  async connectedCallback() {
    super.connectedCallback();
    await this.updateComplete;
    this.start();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stop();
  }
  async updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("active")) {
      if (this.active) {
        this.start();
      } else {
        this.stop();
      }
    }
    if (changedProps.has("anchor")) {
      this.handleAnchorChange();
    }
    if (this.active) {
      await this.updateComplete;
      this.reposition();
    }
  }
  async handleAnchorChange() {
    await this.stop();
    if (this.anchor && typeof this.anchor === "string") {
      const root = this.getRootNode();
      this.anchorEl = root.getElementById(this.anchor);
    } else if (this.anchor instanceof Element || isVirtualElement(this.anchor)) {
      this.anchorEl = this.anchor;
    } else {
      this.anchorEl = this.querySelector('[slot="anchor"]');
    }
    if (this.anchorEl instanceof HTMLSlotElement) {
      this.anchorEl = this.anchorEl.assignedElements({ flatten: true })[0];
    }
    if (this.anchorEl) {
      this.start();
    }
  }
  start() {
    if (!this.anchorEl) {
      return;
    }
    this.cleanup = autoUpdate(this.anchorEl, this.popup, () => {
      this.reposition();
    });
  }
  async stop() {
    return new Promise((resolve) => {
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = void 0;
        this.removeAttribute("data-current-placement");
        this.style.removeProperty("--auto-size-available-width");
        this.style.removeProperty("--auto-size-available-height");
        requestAnimationFrame(() => resolve());
      } else {
        resolve();
      }
    });
  }
  /** Forces the popup to recalculate and reposition itself. */
  reposition() {
    if (!this.active || !this.anchorEl) {
      return;
    }
    const middleware = [
      // The offset middleware goes first
      offset({ mainAxis: this.distance, crossAxis: this.skidding })
    ];
    if (this.sync) {
      middleware.push(
        size({
          apply: ({ rects }) => {
            const syncWidth = this.sync === "width" || this.sync === "both";
            const syncHeight = this.sync === "height" || this.sync === "both";
            this.popup.style.width = syncWidth ? `${rects.reference.width}px` : "";
            this.popup.style.height = syncHeight ? `${rects.reference.height}px` : "";
          }
        })
      );
    } else {
      this.popup.style.width = "";
      this.popup.style.height = "";
    }
    if (this.flip) {
      middleware.push(
        flip({
          boundary: this.flipBoundary,
          // @ts-expect-error - We're converting a string attribute to an array here
          fallbackPlacements: this.flipFallbackPlacements,
          fallbackStrategy: this.flipFallbackStrategy === "best-fit" ? "bestFit" : "initialPlacement",
          padding: this.flipPadding
        })
      );
    }
    if (this.shift) {
      middleware.push(
        shift({
          boundary: this.shiftBoundary,
          padding: this.shiftPadding
        })
      );
    }
    if (this.autoSize) {
      middleware.push(
        size({
          boundary: this.autoSizeBoundary,
          padding: this.autoSizePadding,
          apply: ({ availableWidth, availableHeight }) => {
            if (this.autoSize === "vertical" || this.autoSize === "both") {
              this.style.setProperty("--auto-size-available-height", `${availableHeight}px`);
            } else {
              this.style.removeProperty("--auto-size-available-height");
            }
            if (this.autoSize === "horizontal" || this.autoSize === "both") {
              this.style.setProperty("--auto-size-available-width", `${availableWidth}px`);
            } else {
              this.style.removeProperty("--auto-size-available-width");
            }
          }
        })
      );
    } else {
      this.style.removeProperty("--auto-size-available-width");
      this.style.removeProperty("--auto-size-available-height");
    }
    if (this.arrow) {
      middleware.push(
        arrow({
          element: this.arrowEl,
          padding: this.arrowPadding
        })
      );
    }
    const getOffsetParent = this.strategy === "absolute" ? (element) => platform.getOffsetParent(element, offsetParent) : platform.getOffsetParent;
    computePosition(this.anchorEl, this.popup, {
      placement: this.placement,
      middleware,
      strategy: this.strategy,
      platform: __spreadProps(__spreadValues({}, platform), {
        getOffsetParent
      })
    }).then(({ x, y, middlewareData, placement }) => {
      const isRtl = getComputedStyle(this).direction === "rtl";
      const staticSide = { top: "bottom", right: "left", bottom: "top", left: "right" }[placement.split("-")[0]];
      this.setAttribute("data-current-placement", placement);
      Object.assign(this.popup.style, {
        left: `${x}px`,
        top: `${y}px`
      });
      if (this.arrow) {
        const arrowX = middlewareData.arrow.x;
        const arrowY = middlewareData.arrow.y;
        let top = "";
        let right = "";
        let bottom = "";
        let left = "";
        if (this.arrowPlacement === "start") {
          const value = typeof arrowX === "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
          top = typeof arrowY === "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
          right = isRtl ? value : "";
          left = isRtl ? "" : value;
        } else if (this.arrowPlacement === "end") {
          const value = typeof arrowX === "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
          right = isRtl ? "" : value;
          left = isRtl ? value : "";
          bottom = typeof arrowY === "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
        } else if (this.arrowPlacement === "center") {
          left = typeof arrowX === "number" ? `calc(50% - var(--arrow-size-diagonal))` : "";
          top = typeof arrowY === "number" ? `calc(50% - var(--arrow-size-diagonal))` : "";
        } else {
          left = typeof arrowX === "number" ? `${arrowX}px` : "";
          top = typeof arrowY === "number" ? `${arrowY}px` : "";
        }
        Object.assign(this.arrowEl.style, {
          top,
          right,
          bottom,
          left,
          [staticSide]: "calc(var(--arrow-size-diagonal) * -1)"
        });
      }
    });
    requestAnimationFrame(() => this.updateHoverBridge());
    this.emit("sl-reposition");
  }
  render() {
    return x$4`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${e$3({
      "popup-hover-bridge": true,
      "popup-hover-bridge--visible": this.hoverBridge && this.active
    })}
      ></span>

      <div
        part="popup"
        class=${e$3({
      popup: true,
      "popup--active": this.active,
      "popup--fixed": this.strategy === "fixed",
      "popup--has-arrow": this.arrow
    })}
      >
        <slot></slot>
        ${this.arrow ? x$4`<div part="arrow" class="popup__arrow" role="presentation"></div>` : ""}
      </div>
    `;
  }
};
SlPopup.styles = [component_styles_default, popup_styles_default];
__decorateClass([
  e$6(".popup")
], SlPopup.prototype, "popup", 2);
__decorateClass([
  e$6(".popup__arrow")
], SlPopup.prototype, "arrowEl", 2);
__decorateClass([
  n$4()
], SlPopup.prototype, "anchor", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlPopup.prototype, "active", 2);
__decorateClass([
  n$4({ reflect: true })
], SlPopup.prototype, "placement", 2);
__decorateClass([
  n$4({ reflect: true })
], SlPopup.prototype, "strategy", 2);
__decorateClass([
  n$4({ type: Number })
], SlPopup.prototype, "distance", 2);
__decorateClass([
  n$4({ type: Number })
], SlPopup.prototype, "skidding", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlPopup.prototype, "arrow", 2);
__decorateClass([
  n$4({ attribute: "arrow-placement" })
], SlPopup.prototype, "arrowPlacement", 2);
__decorateClass([
  n$4({ attribute: "arrow-padding", type: Number })
], SlPopup.prototype, "arrowPadding", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlPopup.prototype, "flip", 2);
__decorateClass([
  n$4({
    attribute: "flip-fallback-placements",
    converter: {
      fromAttribute: (value) => {
        return value.split(" ").map((p) => p.trim()).filter((p) => p !== "");
      },
      toAttribute: (value) => {
        return value.join(" ");
      }
    }
  })
], SlPopup.prototype, "flipFallbackPlacements", 2);
__decorateClass([
  n$4({ attribute: "flip-fallback-strategy" })
], SlPopup.prototype, "flipFallbackStrategy", 2);
__decorateClass([
  n$4({ type: Object })
], SlPopup.prototype, "flipBoundary", 2);
__decorateClass([
  n$4({ attribute: "flip-padding", type: Number })
], SlPopup.prototype, "flipPadding", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlPopup.prototype, "shift", 2);
__decorateClass([
  n$4({ type: Object })
], SlPopup.prototype, "shiftBoundary", 2);
__decorateClass([
  n$4({ attribute: "shift-padding", type: Number })
], SlPopup.prototype, "shiftPadding", 2);
__decorateClass([
  n$4({ attribute: "auto-size" })
], SlPopup.prototype, "autoSize", 2);
__decorateClass([
  n$4()
], SlPopup.prototype, "sync", 2);
__decorateClass([
  n$4({ type: Object })
], SlPopup.prototype, "autoSizeBoundary", 2);
__decorateClass([
  n$4({ attribute: "auto-size-padding", type: Number })
], SlPopup.prototype, "autoSizePadding", 2);
__decorateClass([
  n$4({ attribute: "hover-bridge", type: Boolean })
], SlPopup.prototype, "hoverBridge", 2);

// src/utilities/animation-registry.ts
var defaultAnimationRegistry = /* @__PURE__ */ new Map();
var customAnimationRegistry = /* @__PURE__ */ new WeakMap();
function ensureAnimation(animation) {
  return animation != null ? animation : { keyframes: [], options: { duration: 0 } };
}
function getLogicalAnimation(animation, dir) {
  if (dir.toLowerCase() === "rtl") {
    return {
      keyframes: animation.rtlKeyframes || animation.keyframes,
      options: animation.options
    };
  }
  return animation;
}
function setDefaultAnimation(animationName, animation) {
  defaultAnimationRegistry.set(animationName, ensureAnimation(animation));
}
function getAnimation(el, animationName, options) {
  const customAnimation = customAnimationRegistry.get(el);
  if (customAnimation == null ? void 0 : customAnimation[animationName]) {
    return getLogicalAnimation(customAnimation[animationName], options.dir);
  }
  const defaultAnimation = defaultAnimationRegistry.get(animationName);
  if (defaultAnimation) {
    return getLogicalAnimation(defaultAnimation, options.dir);
  }
  return {
    keyframes: [],
    options: { duration: 0 }
  };
}

// src/internal/event.ts
function waitForEvent(el, eventName) {
  return new Promise((resolve) => {
    function done(event) {
      if (event.target === el) {
        el.removeEventListener(eventName, done);
        resolve();
      }
    }
    el.addEventListener(eventName, done);
  });
}

// src/internal/animate.ts
function animateTo(el, keyframes, options) {
  return new Promise((resolve) => {
    if ((options == null ? void 0 : options.duration) === Infinity) {
      throw new Error("Promise-based animations must be finite.");
    }
    const animation = el.animate(keyframes, __spreadProps(__spreadValues({}, options), {
      duration: prefersReducedMotion() ? 0 : options.duration
    }));
    animation.addEventListener("cancel", resolve, { once: true });
    animation.addEventListener("finish", resolve, { once: true });
  });
}
function parseDuration(delay) {
  delay = delay.toString().toLowerCase();
  if (delay.indexOf("ms") > -1) {
    return parseFloat(delay);
  }
  if (delay.indexOf("s") > -1) {
    return parseFloat(delay) * 1e3;
  }
  return parseFloat(delay);
}
function prefersReducedMotion() {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  return query.matches;
}
function stopAnimations(el) {
  return Promise.all(
    el.getAnimations().map((animation) => {
      return new Promise((resolve) => {
        animation.cancel();
        requestAnimationFrame(resolve);
      });
    })
  );
}

var SlDropdown = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.localize = new LocalizeController(this);
    this.open = false;
    this.placement = "bottom-start";
    this.disabled = false;
    this.stayOpenOnSelect = false;
    this.distance = 0;
    this.skidding = 0;
    this.hoist = false;
    this.handleKeyDown = (event) => {
      if (this.open && event.key === "Escape") {
        event.stopPropagation();
        this.hide();
        this.focusOnTrigger();
      }
    };
    this.handleDocumentKeyDown = (event) => {
      var _a;
      if (event.key === "Escape" && this.open && !this.closeWatcher) {
        event.stopPropagation();
        this.focusOnTrigger();
        this.hide();
        return;
      }
      if (event.key === "Tab") {
        if (this.open && ((_a = document.activeElement) == null ? void 0 : _a.tagName.toLowerCase()) === "sl-menu-item") {
          event.preventDefault();
          this.hide();
          this.focusOnTrigger();
          return;
        }
        setTimeout(() => {
          var _a2, _b, _c;
          const activeElement = ((_a2 = this.containingElement) == null ? void 0 : _a2.getRootNode()) instanceof ShadowRoot ? (_c = (_b = document.activeElement) == null ? void 0 : _b.shadowRoot) == null ? void 0 : _c.activeElement : document.activeElement;
          if (!this.containingElement || (activeElement == null ? void 0 : activeElement.closest(this.containingElement.tagName.toLowerCase())) !== this.containingElement) {
            this.hide();
          }
        });
      }
    };
    this.handleDocumentMouseDown = (event) => {
      const path = event.composedPath();
      if (this.containingElement && !path.includes(this.containingElement)) {
        this.hide();
      }
    };
    this.handlePanelSelect = (event) => {
      const target = event.target;
      if (!this.stayOpenOnSelect && target.tagName.toLowerCase() === "sl-menu") {
        this.hide();
        this.focusOnTrigger();
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.containingElement) {
      this.containingElement = this;
    }
  }
  firstUpdated() {
    this.panel.hidden = !this.open;
    if (this.open) {
      this.addOpenListeners();
      this.popup.active = true;
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeOpenListeners();
    this.hide();
  }
  focusOnTrigger() {
    const trigger = this.trigger.assignedElements({ flatten: true })[0];
    if (typeof (trigger == null ? void 0 : trigger.focus) === "function") {
      trigger.focus();
    }
  }
  getMenu() {
    return this.panel.assignedElements({ flatten: true }).find((el) => el.tagName.toLowerCase() === "sl-menu");
  }
  handleTriggerClick() {
    if (this.open) {
      this.hide();
    } else {
      this.show();
      this.focusOnTrigger();
    }
  }
  async handleTriggerKeyDown(event) {
    if ([" ", "Enter"].includes(event.key)) {
      event.preventDefault();
      this.handleTriggerClick();
      return;
    }
    const menu = this.getMenu();
    if (menu) {
      const menuItems = menu.getAllItems();
      const firstMenuItem = menuItems[0];
      const lastMenuItem = menuItems[menuItems.length - 1];
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (!this.open) {
          this.show();
          await this.updateComplete;
        }
        if (menuItems.length > 0) {
          this.updateComplete.then(() => {
            if (event.key === "ArrowDown" || event.key === "Home") {
              menu.setCurrentItem(firstMenuItem);
              firstMenuItem.focus();
            }
            if (event.key === "ArrowUp" || event.key === "End") {
              menu.setCurrentItem(lastMenuItem);
              lastMenuItem.focus();
            }
          });
        }
      }
    }
  }
  handleTriggerKeyUp(event) {
    if (event.key === " ") {
      event.preventDefault();
    }
  }
  handleTriggerSlotChange() {
    this.updateAccessibleTrigger();
  }
  //
  // Slotted triggers can be arbitrary content, but we need to link them to the dropdown panel with `aria-haspopup` and
  // `aria-expanded`. These must be applied to the "accessible trigger" (the tabbable portion of the trigger element
  // that gets slotted in) so screen readers will understand them. The accessible trigger could be the slotted element,
  // a child of the slotted element, or an element in the slotted element's shadow root.
  //
  // For example, the accessible trigger of an <sl-button> is a <button> located inside its shadow root.
  //
  // To determine this, we assume the first tabbable element in the trigger slot is the "accessible trigger."
  //
  updateAccessibleTrigger() {
    const assignedElements = this.trigger.assignedElements({ flatten: true });
    const accessibleTrigger = assignedElements.find((el) => getTabbableBoundary(el).start);
    let target;
    if (accessibleTrigger) {
      switch (accessibleTrigger.tagName.toLowerCase()) {
        case "sl-button":
        case "sl-icon-button":
          target = accessibleTrigger.button;
          break;
        default:
          target = accessibleTrigger;
      }
      target.setAttribute("aria-haspopup", "true");
      target.setAttribute("aria-expanded", this.open ? "true" : "false");
    }
  }
  /** Shows the dropdown panel. */
  async show() {
    if (this.open) {
      return void 0;
    }
    this.open = true;
    return waitForEvent(this, "sl-after-show");
  }
  /** Hides the dropdown panel */
  async hide() {
    if (!this.open) {
      return void 0;
    }
    this.open = false;
    return waitForEvent(this, "sl-after-hide");
  }
  /**
   * Instructs the dropdown menu to reposition. Useful when the position or size of the trigger changes when the menu
   * is activated.
   */
  reposition() {
    this.popup.reposition();
  }
  addOpenListeners() {
    var _a;
    this.panel.addEventListener("sl-select", this.handlePanelSelect);
    if ("CloseWatcher" in window) {
      (_a = this.closeWatcher) == null ? void 0 : _a.destroy();
      this.closeWatcher = new CloseWatcher();
      this.closeWatcher.onclose = () => {
        this.hide();
        this.focusOnTrigger();
      };
    } else {
      this.panel.addEventListener("keydown", this.handleKeyDown);
    }
    document.addEventListener("keydown", this.handleDocumentKeyDown);
    document.addEventListener("mousedown", this.handleDocumentMouseDown);
  }
  removeOpenListeners() {
    var _a;
    if (this.panel) {
      this.panel.removeEventListener("sl-select", this.handlePanelSelect);
      this.panel.removeEventListener("keydown", this.handleKeyDown);
    }
    document.removeEventListener("keydown", this.handleDocumentKeyDown);
    document.removeEventListener("mousedown", this.handleDocumentMouseDown);
    (_a = this.closeWatcher) == null ? void 0 : _a.destroy();
  }
  async handleOpenChange() {
    if (this.disabled) {
      this.open = false;
      return;
    }
    this.updateAccessibleTrigger();
    if (this.open) {
      this.emit("sl-show");
      this.addOpenListeners();
      await stopAnimations(this);
      this.panel.hidden = false;
      this.popup.active = true;
      const { keyframes, options } = getAnimation(this, "dropdown.show", { dir: this.localize.dir() });
      await animateTo(this.popup.popup, keyframes, options);
      this.emit("sl-after-show");
    } else {
      this.emit("sl-hide");
      this.removeOpenListeners();
      await stopAnimations(this);
      const { keyframes, options } = getAnimation(this, "dropdown.hide", { dir: this.localize.dir() });
      await animateTo(this.popup.popup, keyframes, options);
      this.panel.hidden = true;
      this.popup.active = false;
      this.emit("sl-after-hide");
    }
  }
  render() {
    return x$4`
      <sl-popup
        part="base"
        id="dropdown"
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        strategy=${this.hoist ? "fixed" : "absolute"}
        flip
        shift
        auto-size="vertical"
        auto-size-padding="10"
        class=${e$3({
      dropdown: true,
      "dropdown--open": this.open
    })}
      >
        <slot
          name="trigger"
          slot="anchor"
          part="trigger"
          class="dropdown__trigger"
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeyDown}
          @keyup=${this.handleTriggerKeyUp}
          @slotchange=${this.handleTriggerSlotChange}
        ></slot>

        <div aria-hidden=${this.open ? "false" : "true"} aria-labelledby="dropdown">
          <slot part="panel" class="dropdown__panel"></slot>
        </div>
      </sl-popup>
    `;
  }
};
SlDropdown.styles = [component_styles_default, dropdown_styles_default];
SlDropdown.dependencies = { "sl-popup": SlPopup };
__decorateClass([
  e$6(".dropdown")
], SlDropdown.prototype, "popup", 2);
__decorateClass([
  e$6(".dropdown__trigger")
], SlDropdown.prototype, "trigger", 2);
__decorateClass([
  e$6(".dropdown__panel")
], SlDropdown.prototype, "panel", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlDropdown.prototype, "open", 2);
__decorateClass([
  n$4({ reflect: true })
], SlDropdown.prototype, "placement", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlDropdown.prototype, "disabled", 2);
__decorateClass([
  n$4({ attribute: "stay-open-on-select", type: Boolean, reflect: true })
], SlDropdown.prototype, "stayOpenOnSelect", 2);
__decorateClass([
  n$4({ attribute: false })
], SlDropdown.prototype, "containingElement", 2);
__decorateClass([
  n$4({ type: Number })
], SlDropdown.prototype, "distance", 2);
__decorateClass([
  n$4({ type: Number })
], SlDropdown.prototype, "skidding", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlDropdown.prototype, "hoist", 2);
__decorateClass([
  watch("open", { waitUntilFirstUpdate: true })
], SlDropdown.prototype, "handleOpenChange", 1);
setDefaultAnimation("dropdown.show", {
  keyframes: [
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1 }
  ],
  options: { duration: 100, easing: "ease" }
});
setDefaultAnimation("dropdown.hide", {
  keyframes: [
    { opacity: 1, scale: 1 },
    { opacity: 0, scale: 0.9 }
  ],
  options: { duration: 100, easing: "ease" }
});

// src/components/menu/menu.styles.ts
var menu_styles_default = i$6`
  :host {
    display: block;
    position: relative;
    background: var(--sl-panel-background-color);
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
    border-radius: var(--sl-border-radius-medium);
    padding: var(--sl-spacing-x-small) 0;
    overflow: auto;
    overscroll-behavior: none;
  }

  ::slotted(sl-divider) {
    --spacing: var(--sl-spacing-x-small);
  }
`;

var SlMenu = class extends ShoelaceElement {
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "menu");
  }
  handleClick(event) {
    const menuItemTypes = ["menuitem", "menuitemcheckbox"];
    const target = event.composedPath().find((el) => {
      var _a;
      return menuItemTypes.includes(((_a = el == null ? void 0 : el.getAttribute) == null ? void 0 : _a.call(el, "role")) || "");
    });
    if (!target)
      return;
    const item = target;
    if (item.type === "checkbox") {
      item.checked = !item.checked;
    }
    this.emit("sl-select", { detail: { item } });
  }
  handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      const item = this.getCurrentItem();
      event.preventDefault();
      event.stopPropagation();
      item == null ? void 0 : item.click();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = this.getAllItems();
      const activeItem = this.getCurrentItem();
      let index = activeItem ? items.indexOf(activeItem) : 0;
      if (items.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "ArrowDown") {
          index++;
        } else if (event.key === "ArrowUp") {
          index--;
        } else if (event.key === "Home") {
          index = 0;
        } else if (event.key === "End") {
          index = items.length - 1;
        }
        if (index < 0) {
          index = items.length - 1;
        }
        if (index > items.length - 1) {
          index = 0;
        }
        this.setCurrentItem(items[index]);
        items[index].focus();
      }
    }
  }
  handleMouseDown(event) {
    const target = event.target;
    if (this.isMenuItem(target)) {
      this.setCurrentItem(target);
    }
  }
  handleSlotChange() {
    const items = this.getAllItems();
    if (items.length > 0) {
      this.setCurrentItem(items[0]);
    }
  }
  isMenuItem(item) {
    var _a;
    return item.tagName.toLowerCase() === "sl-menu-item" || ["menuitem", "menuitemcheckbox", "menuitemradio"].includes((_a = item.getAttribute("role")) != null ? _a : "");
  }
  /** @internal Gets all slotted menu items, ignoring dividers, headers, and other elements. */
  getAllItems() {
    return [...this.defaultSlot.assignedElements({ flatten: true })].filter((el) => {
      if (el.inert || !this.isMenuItem(el)) {
        return false;
      }
      return true;
    });
  }
  /**
   * @internal Gets the current menu item, which is the menu item that has `tabindex="0"` within the roving tab index.
   * The menu item may or may not have focus, but for keyboard interaction purposes it's considered the "active" item.
   */
  getCurrentItem() {
    return this.getAllItems().find((i) => i.getAttribute("tabindex") === "0");
  }
  /**
   * @internal Sets the current menu item to the specified element. This sets `tabindex="0"` on the target element and
   * `tabindex="-1"` to all other items. This method must be called prior to setting focus on a menu item.
   */
  setCurrentItem(item) {
    const items = this.getAllItems();
    items.forEach((i) => {
      i.setAttribute("tabindex", i === item ? "0" : "-1");
    });
  }
  render() {
    return x$4`
      <slot
        @slotchange=${this.handleSlotChange}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        @mousedown=${this.handleMouseDown}
      ></slot>
    `;
  }
};
SlMenu.styles = [component_styles_default, menu_styles_default];
__decorateClass([
  e$6("slot")
], SlMenu.prototype, "defaultSlot", 2);

// src/components/menu-item/menu-item.styles.ts
var menu_item_styles_default = i$6`
  :host {
    --submenu-offset: -2px;

    display: block;
  }

  :host([inert]) {
    display: none;
  }

  .menu-item {
    position: relative;
    display: flex;
    align-items: stretch;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-letter-spacing-normal);
    color: var(--sl-color-neutral-700);
    padding: var(--sl-spacing-2x-small) var(--sl-spacing-2x-small);
    transition: var(--sl-transition-fast) fill;
    user-select: none;
    -webkit-user-select: none;
    white-space: nowrap;
    cursor: pointer;
  }

  .menu-item.menu-item--disabled {
    outline: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .menu-item.menu-item--loading {
    outline: none;
    cursor: wait;
  }

  .menu-item.menu-item--loading *:not(sl-spinner) {
    opacity: 0.5;
  }

  .menu-item--loading sl-spinner {
    --indicator-color: currentColor;
    --track-width: 1px;
    position: absolute;
    font-size: 0.75em;
    top: calc(50% - 0.5em);
    left: 0.65rem;
    opacity: 1;
  }

  .menu-item .menu-item__label {
    flex: 1 1 auto;
    display: inline-block;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .menu-item .menu-item__prefix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .menu-item .menu-item__prefix::slotted(*) {
    margin-inline-end: var(--sl-spacing-x-small);
  }

  .menu-item .menu-item__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .menu-item .menu-item__suffix::slotted(*) {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  /* Safe triangle */
  .menu-item--submenu-expanded::after {
    content: '';
    position: fixed;
    z-index: calc(var(--sl-z-index-dropdown) - 1);
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--safe-triangle-cursor-x, 0) var(--safe-triangle-cursor-y, 0),
      var(--safe-triangle-submenu-start-x, 0) var(--safe-triangle-submenu-start-y, 0),
      var(--safe-triangle-submenu-end-x, 0) var(--safe-triangle-submenu-end-y, 0)
    );
  }

  :host(:focus-visible) {
    outline: none;
  }

  :host(:hover:not([aria-disabled='true'], :focus-visible)) .menu-item,
  .menu-item--submenu-expanded {
    background-color: var(--sl-color-neutral-100);
    color: var(--sl-color-neutral-1000);
  }

  :host(:focus-visible) .menu-item {
    outline: none;
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
    opacity: 1;
  }

  .menu-item .menu-item__check,
  .menu-item .menu-item__chevron {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5em;
    visibility: hidden;
  }

  .menu-item--checked .menu-item__check,
  .menu-item--has-submenu .menu-item__chevron {
    visibility: visible;
  }

  /* Add elevation and z-index to submenus */
  sl-popup::part(popup) {
    box-shadow: var(--sl-shadow-large);
    z-index: var(--sl-z-index-dropdown);
    margin-left: var(--submenu-offset);
  }

  .menu-item--rtl sl-popup::part(popup) {
    margin-left: calc(-1 * var(--submenu-offset));
  }

  @media (forced-colors: active) {
    :host(:hover:not([aria-disabled='true'])) .menu-item,
    :host(:focus-visible) .menu-item {
      outline: dashed 1px SelectedItem;
      outline-offset: -1px;
    }
  }
`;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s$1=(i,t)=>{const e=i._$AN;if(void 0===e)return !1;for(const i of e)i._$AO?.(t,!1),s$1(i,t);return !0},o$3=i=>{let t,e;do{if(void 0===(t=i._$AM))break;e=t._$AN,e.delete(i),i=t;}while(0===e?.size)},r$1=i=>{for(let t;t=i._$AM;i=t){let e=t._$AN;if(void 0===e)t._$AN=e=new Set;else if(e.has(i))break;e.add(i),c$1(t);}};function h$4(i){void 0!==this._$AN?(o$3(this),this._$AM=i,r$1(this)):this._$AM=i;}function n$2(i,t=!1,e=0){const r=this._$AH,h=this._$AN;if(void 0!==h&&0!==h.size)if(t)if(Array.isArray(r))for(let i=e;i<r.length;i++)s$1(r[i],!1),o$3(r[i]);else null!=r&&(s$1(r,!1),o$3(r));else s$1(this,i);}const c$1=i=>{i.type==t$1.CHILD&&(i._$AP??=n$2,i._$AQ??=h$4);};let f$1 = class f extends i$2{constructor(){super(...arguments),this._$AN=void 0;}_$AT(i,t,e){super._$AT(i,t,e),r$1(this),this.isConnected=i._$AU;}_$AO(i,t=!0){i!==this.isConnected&&(this.isConnected=i,i?this.reconnected?.():this.disconnected?.()),t&&(s$1(this,i),o$3(this));}setValue(t){if(f$2(this._$Ct))this._$Ct._$AI(t,this);else {const i=[...this._$Ct._$AH];i[this._$Ci]=t,this._$Ct._$AI(i,this,0);}}disconnected(){}reconnected(){}};

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const e$2=()=>new h$3;let h$3 = class h{};const o$2=new WeakMap,n$1=e$4(class extends f$1{render(i){return E$4}update(i,[s]){const e=s!==this.Y;return e&&void 0!==this.Y&&this.rt(void 0),(e||this.lt!==this.ct)&&(this.Y=s,this.ht=i.options?.host,this.rt(this.ct=i.element)),E$4}rt(t){if(this.isConnected||(t=void 0),"function"==typeof this.Y){const i=this.ht??globalThis;let s=o$2.get(i);void 0===s&&(s=new WeakMap,o$2.set(i,s)),void 0!==s.get(this.Y)&&this.Y.call(this.ht,void 0),s.set(this.Y,t),void 0!==t&&this.Y.call(this.ht,t);}else this.Y.value=t;}get lt(){return "function"==typeof this.Y?o$2.get(this.ht??globalThis)?.get(this.Y):this.Y?.value}disconnected(){this.lt===this.ct&&this.rt(void 0);}reconnected(){this.rt(this.ct);}});

// src/components/menu-item/submenu-controller.ts
var SubmenuController = class {
  constructor(host, hasSlotController, localize) {
    this.popupRef = e$2();
    this.enableSubmenuTimer = -1;
    this.isConnected = false;
    this.isPopupConnected = false;
    this.skidding = 0;
    this.submenuOpenDelay = 100;
    // Set the safe triangle cursor position
    this.handleMouseMove = (event) => {
      this.host.style.setProperty("--safe-triangle-cursor-x", `${event.clientX}px`);
      this.host.style.setProperty("--safe-triangle-cursor-y", `${event.clientY}px`);
    };
    this.handleMouseOver = () => {
      if (this.hasSlotController.test("submenu")) {
        this.enableSubmenu();
      }
    };
    // Focus on the first menu-item of a submenu.
    this.handleKeyDown = (event) => {
      switch (event.key) {
        case "Escape":
        case "Tab":
          this.disableSubmenu();
          break;
        case "ArrowLeft":
          if (event.target !== this.host) {
            event.preventDefault();
            event.stopPropagation();
            this.host.focus();
            this.disableSubmenu();
          }
          break;
        case "ArrowRight":
        case "Enter":
        case " ":
          this.handleSubmenuEntry(event);
          break;
      }
    };
    this.handleClick = (event) => {
      var _a;
      if (event.target === this.host) {
        event.preventDefault();
        event.stopPropagation();
      } else if (event.target instanceof Element && (event.target.tagName === "sl-menu-item" || ((_a = event.target.role) == null ? void 0 : _a.startsWith("menuitem")))) {
        this.disableSubmenu();
      }
    };
    // Close this submenu on focus outside of the parent or any descendants.
    this.handleFocusOut = (event) => {
      if (event.relatedTarget && event.relatedTarget instanceof Element && this.host.contains(event.relatedTarget)) {
        return;
      }
      this.disableSubmenu();
    };
    // Prevent the parent menu-item from getting focus on mouse movement on the submenu
    this.handlePopupMouseover = (event) => {
      event.stopPropagation();
    };
    // Set the safe triangle values for the submenu when the position changes
    this.handlePopupReposition = () => {
      const submenuSlot = this.host.renderRoot.querySelector("slot[name='submenu']");
      const menu = submenuSlot == null ? void 0 : submenuSlot.assignedElements({ flatten: true }).filter((el) => el.localName === "sl-menu")[0];
      const isRtl = this.localize.dir() === "rtl";
      if (!menu) {
        return;
      }
      const { left, top, width, height } = menu.getBoundingClientRect();
      this.host.style.setProperty("--safe-triangle-submenu-start-x", `${isRtl ? left + width : left}px`);
      this.host.style.setProperty("--safe-triangle-submenu-start-y", `${top}px`);
      this.host.style.setProperty("--safe-triangle-submenu-end-x", `${isRtl ? left + width : left}px`);
      this.host.style.setProperty("--safe-triangle-submenu-end-y", `${top + height}px`);
    };
    (this.host = host).addController(this);
    this.hasSlotController = hasSlotController;
    this.localize = localize;
  }
  hostConnected() {
    if (this.hasSlotController.test("submenu") && !this.host.disabled) {
      this.addListeners();
    }
  }
  hostDisconnected() {
    this.removeListeners();
  }
  hostUpdated() {
    if (this.hasSlotController.test("submenu") && !this.host.disabled) {
      this.addListeners();
      this.updateSkidding();
    } else {
      this.removeListeners();
    }
  }
  addListeners() {
    if (!this.isConnected) {
      this.host.addEventListener("mousemove", this.handleMouseMove);
      this.host.addEventListener("mouseover", this.handleMouseOver);
      this.host.addEventListener("keydown", this.handleKeyDown);
      this.host.addEventListener("click", this.handleClick);
      this.host.addEventListener("focusout", this.handleFocusOut);
      this.isConnected = true;
    }
    if (!this.isPopupConnected) {
      if (this.popupRef.value) {
        this.popupRef.value.addEventListener("mouseover", this.handlePopupMouseover);
        this.popupRef.value.addEventListener("sl-reposition", this.handlePopupReposition);
        this.isPopupConnected = true;
      }
    }
  }
  removeListeners() {
    if (this.isConnected) {
      this.host.removeEventListener("mousemove", this.handleMouseMove);
      this.host.removeEventListener("mouseover", this.handleMouseOver);
      this.host.removeEventListener("keydown", this.handleKeyDown);
      this.host.removeEventListener("click", this.handleClick);
      this.host.removeEventListener("focusout", this.handleFocusOut);
      this.isConnected = false;
    }
    if (this.isPopupConnected) {
      if (this.popupRef.value) {
        this.popupRef.value.removeEventListener("mouseover", this.handlePopupMouseover);
        this.popupRef.value.removeEventListener("sl-reposition", this.handlePopupReposition);
        this.isPopupConnected = false;
      }
    }
  }
  handleSubmenuEntry(event) {
    const submenuSlot = this.host.renderRoot.querySelector("slot[name='submenu']");
    if (!submenuSlot) {
      console.error("Cannot activate a submenu if no corresponding menuitem can be found.", this);
      return;
    }
    let menuItems = null;
    for (const elt of submenuSlot.assignedElements()) {
      menuItems = elt.querySelectorAll("sl-menu-item, [role^='menuitem']");
      if (menuItems.length !== 0) {
        break;
      }
    }
    if (!menuItems || menuItems.length === 0) {
      return;
    }
    menuItems[0].setAttribute("tabindex", "0");
    for (let i = 1; i !== menuItems.length; ++i) {
      menuItems[i].setAttribute("tabindex", "-1");
    }
    if (this.popupRef.value) {
      event.preventDefault();
      event.stopPropagation();
      if (this.popupRef.value.active) {
        if (menuItems[0] instanceof HTMLElement) {
          menuItems[0].focus();
        }
      } else {
        this.enableSubmenu(false);
        this.host.updateComplete.then(() => {
          if (menuItems[0] instanceof HTMLElement) {
            menuItems[0].focus();
          }
        });
        this.host.requestUpdate();
      }
    }
  }
  setSubmenuState(state) {
    if (this.popupRef.value) {
      if (this.popupRef.value.active !== state) {
        this.popupRef.value.active = state;
        this.host.requestUpdate();
      }
    }
  }
  // Shows the submenu. Supports disabling the opening delay, e.g. for keyboard events that want to set the focus to the
  // newly opened menu.
  enableSubmenu(delay = true) {
    if (delay) {
      this.enableSubmenuTimer = window.setTimeout(() => {
        this.setSubmenuState(true);
      }, this.submenuOpenDelay);
    } else {
      this.setSubmenuState(true);
    }
  }
  disableSubmenu() {
    clearTimeout(this.enableSubmenuTimer);
    this.setSubmenuState(false);
  }
  // Calculate the space the top of a menu takes-up, for aligning the popup menu-item with the activating element.
  updateSkidding() {
    var _a;
    if (!((_a = this.host.parentElement) == null ? void 0 : _a.computedStyleMap)) {
      return;
    }
    const styleMap = this.host.parentElement.computedStyleMap();
    const attrs = ["padding-top", "border-top-width", "margin-top"];
    const skidding = attrs.reduce((accumulator, attr) => {
      var _a2;
      const styleValue = (_a2 = styleMap.get(attr)) != null ? _a2 : new CSSUnitValue(0, "px");
      const unitValue = styleValue instanceof CSSUnitValue ? styleValue : new CSSUnitValue(0, "px");
      const pxValue = unitValue.to("px");
      return accumulator - pxValue.value;
    }, 0);
    this.skidding = skidding;
  }
  isExpanded() {
    return this.popupRef.value ? this.popupRef.value.active : false;
  }
  renderSubmenu() {
    const isLtr = this.localize.dir() === "ltr";
    if (!this.isConnected) {
      return x$4` <slot name="submenu" hidden></slot> `;
    }
    return x$4`
      <sl-popup
        ${n$1(this.popupRef)}
        placement=${isLtr ? "right-start" : "left-start"}
        anchor="anchor"
        flip
        flip-fallback-strategy="best-fit"
        skidding="${this.skidding}"
        strategy="fixed"
      >
        <slot name="submenu"></slot>
      </sl-popup>
    `;
  }
};

var SlMenuItem = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.type = "normal";
    this.checked = false;
    this.value = "";
    this.loading = false;
    this.disabled = false;
    this.localize = new LocalizeController(this);
    this.hasSlotController = new HasSlotController(this, "submenu");
    this.submenuController = new SubmenuController(this, this.hasSlotController, this.localize);
    this.handleHostClick = (event) => {
      if (this.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    this.handleMouseOver = (event) => {
      this.focus();
      event.stopPropagation();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleHostClick);
    this.addEventListener("mouseover", this.handleMouseOver);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleHostClick);
    this.removeEventListener("mouseover", this.handleMouseOver);
  }
  handleDefaultSlotChange() {
    const textLabel = this.getTextLabel();
    if (typeof this.cachedTextLabel === "undefined") {
      this.cachedTextLabel = textLabel;
      return;
    }
    if (textLabel !== this.cachedTextLabel) {
      this.cachedTextLabel = textLabel;
      this.emit("slotchange", { bubbles: true, composed: false, cancelable: false });
    }
  }
  handleCheckedChange() {
    if (this.checked && this.type !== "checkbox") {
      this.checked = false;
      console.error('The checked attribute can only be used on menu items with type="checkbox"', this);
      return;
    }
    if (this.type === "checkbox") {
      this.setAttribute("aria-checked", this.checked ? "true" : "false");
    } else {
      this.removeAttribute("aria-checked");
    }
  }
  handleDisabledChange() {
    this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
  }
  handleTypeChange() {
    if (this.type === "checkbox") {
      this.setAttribute("role", "menuitemcheckbox");
      this.setAttribute("aria-checked", this.checked ? "true" : "false");
    } else {
      this.setAttribute("role", "menuitem");
      this.removeAttribute("aria-checked");
    }
  }
  /** Returns a text label based on the contents of the menu item's default slot. */
  getTextLabel() {
    return getTextContent(this.defaultSlot);
  }
  isSubmenu() {
    return this.hasSlotController.test("submenu");
  }
  render() {
    const isRtl = this.localize.dir() === "rtl";
    const isSubmenuExpanded = this.submenuController.isExpanded();
    return x$4`
      <div
        id="anchor"
        part="base"
        class=${e$3({
      "menu-item": true,
      "menu-item--rtl": isRtl,
      "menu-item--checked": this.checked,
      "menu-item--disabled": this.disabled,
      "menu-item--loading": this.loading,
      "menu-item--has-submenu": this.isSubmenu(),
      "menu-item--submenu-expanded": isSubmenuExpanded
    })}
        ?aria-haspopup="${this.isSubmenu()}"
        ?aria-expanded="${isSubmenuExpanded ? true : false}"
      >
        <span part="checked-icon" class="menu-item__check">
          <sl-icon name="check" library="system" aria-hidden="true"></sl-icon>
        </span>

        <slot name="prefix" part="prefix" class="menu-item__prefix"></slot>

        <slot part="label" class="menu-item__label" @slotchange=${this.handleDefaultSlotChange}></slot>

        <slot name="suffix" part="suffix" class="menu-item__suffix"></slot>

        <span part="submenu-icon" class="menu-item__chevron">
          <sl-icon name=${isRtl ? "chevron-left" : "chevron-right"} library="system" aria-hidden="true"></sl-icon>
        </span>

        ${this.submenuController.renderSubmenu()}
        ${this.loading ? x$4` <sl-spinner part="spinner" exportparts="base:spinner__base"></sl-spinner> ` : ""}
      </div>
    `;
  }
};
SlMenuItem.styles = [component_styles_default, menu_item_styles_default];
SlMenuItem.dependencies = {
  "sl-icon": SlIcon,
  "sl-popup": SlPopup,
  "sl-spinner": SlSpinner
};
__decorateClass([
  e$6("slot:not([name])")
], SlMenuItem.prototype, "defaultSlot", 2);
__decorateClass([
  e$6(".menu-item")
], SlMenuItem.prototype, "menuItem", 2);
__decorateClass([
  n$4()
], SlMenuItem.prototype, "type", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlMenuItem.prototype, "checked", 2);
__decorateClass([
  n$4()
], SlMenuItem.prototype, "value", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlMenuItem.prototype, "loading", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlMenuItem.prototype, "disabled", 2);
__decorateClass([
  watch("checked")
], SlMenuItem.prototype, "handleCheckedChange", 1);
__decorateClass([
  watch("disabled")
], SlMenuItem.prototype, "handleDisabledChange", 1);
__decorateClass([
  watch("type")
], SlMenuItem.prototype, "handleTypeChange", 1);

/*
 * This gets into the published component
 */
const baseStyling = i$6 `
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
    --sl-font-mono: SFMono-Regular, Consolas, "Liberation Mono", Menlo,
      monospace;
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
    --sl-input-background-color-hover: var(--sl-color-neutral-50);
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
`;

// src/styles/form-control.styles.ts
var form_control_styles_default = i$6`
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
`;

// src/components/input/input.styles.ts
var input_styles_default = i$6`
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
`;

// src/internal/default-value.ts
var defaultValue = (propertyName = "value") => (proto, key) => {
  const ctor = proto.constructor;
  const attributeChangedCallback = ctor.prototype.attributeChangedCallback;
  ctor.prototype.attributeChangedCallback = function(name, old, value) {
    var _a;
    const options = ctor.getPropertyOptions(propertyName);
    const attributeName = typeof options.attribute === "string" ? options.attribute : propertyName;
    if (name === attributeName) {
      const converter = options.converter || u$4;
      const fromAttribute = typeof converter === "function" ? converter : (_a = converter == null ? void 0 : converter.fromAttribute) != null ? _a : u$4.fromAttribute;
      const newValue = fromAttribute(value, options.type);
      if (this[propertyName] !== newValue) {
        this[key] = newValue;
      }
    }
    attributeChangedCallback.call(this, name, old, value);
  };
};

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const l$1=e$4(class extends i$2{constructor(r){if(super(r),r.type!==t$1.PROPERTY&&r.type!==t$1.ATTRIBUTE&&r.type!==t$1.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!f$2(r))throw Error("`live` bindings can only contain a single expression")}render(r){return r}update(i,[t]){if(t===T$4||t===E$4)return t;const o=i.element,l=i.name;if(i.type===t$1.PROPERTY){if(t===o[l])return T$4}else if(i.type===t$1.BOOLEAN_ATTRIBUTE){if(!!t===o.hasAttribute(l))return T$4}else if(i.type===t$1.ATTRIBUTE&&o.getAttribute(l)===t+"")return T$4;return m$4(i),t}});

var SlInput = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.formControlController = new FormControlController(this, {
      assumeInteractionOn: ["sl-blur", "sl-input"]
    });
    this.hasSlotController = new HasSlotController(this, "help-text", "label");
    this.localize = new LocalizeController(this);
    this.hasFocus = false;
    this.title = "";
    // make reactive to pass through
    this.__numberInput = Object.assign(document.createElement("input"), { type: "number" });
    this.__dateInput = Object.assign(document.createElement("input"), { type: "date" });
    this.type = "text";
    this.name = "";
    this.value = "";
    this.defaultValue = "";
    this.size = "medium";
    this.filled = false;
    this.pill = false;
    this.label = "";
    this.helpText = "";
    this.clearable = false;
    this.disabled = false;
    this.placeholder = "";
    this.readonly = false;
    this.passwordToggle = false;
    this.passwordVisible = false;
    this.noSpinButtons = false;
    this.form = "";
    this.required = false;
    this.spellcheck = true;
  }
  //
  // NOTE: We use an in-memory input for these getters/setters instead of the one in the template because the properties
  // can be set before the component is rendered.
  //
  /**
   * Gets or sets the current value as a `Date` object. Returns `null` if the value can't be converted. This will use the native `<input type="{{type}}">` implementation and may result in an error.
   */
  get valueAsDate() {
    var _a;
    this.__dateInput.type = this.type;
    this.__dateInput.value = this.value;
    return ((_a = this.input) == null ? void 0 : _a.valueAsDate) || this.__dateInput.valueAsDate;
  }
  set valueAsDate(newValue) {
    this.__dateInput.type = this.type;
    this.__dateInput.valueAsDate = newValue;
    this.value = this.__dateInput.value;
  }
  /** Gets or sets the current value as a number. Returns `NaN` if the value can't be converted. */
  get valueAsNumber() {
    var _a;
    this.__numberInput.value = this.value;
    return ((_a = this.input) == null ? void 0 : _a.valueAsNumber) || this.__numberInput.valueAsNumber;
  }
  set valueAsNumber(newValue) {
    this.__numberInput.valueAsNumber = newValue;
    this.value = this.__numberInput.value;
  }
  /** Gets the validity state object */
  get validity() {
    return this.input.validity;
  }
  /** Gets the validation message */
  get validationMessage() {
    return this.input.validationMessage;
  }
  firstUpdated() {
    this.formControlController.updateValidity();
  }
  handleBlur() {
    this.hasFocus = false;
    this.emit("sl-blur");
  }
  handleChange() {
    this.value = this.input.value;
    this.emit("sl-change");
  }
  handleClearClick(event) {
    this.value = "";
    this.emit("sl-clear");
    this.emit("sl-input");
    this.emit("sl-change");
    this.input.focus();
    event.stopPropagation();
  }
  handleFocus() {
    this.hasFocus = true;
    this.emit("sl-focus");
  }
  handleInput() {
    this.value = this.input.value;
    this.formControlController.updateValidity();
    this.emit("sl-input");
  }
  handleInvalid(event) {
    this.formControlController.setValidity(false);
    this.formControlController.emitInvalidEvent(event);
  }
  handleKeyDown(event) {
    const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.key === "Enter" && !hasModifier) {
      setTimeout(() => {
        if (!event.defaultPrevented && !event.isComposing) {
          this.formControlController.submit();
        }
      });
    }
  }
  handlePasswordToggle() {
    this.passwordVisible = !this.passwordVisible;
  }
  handleDisabledChange() {
    this.formControlController.setValidity(this.disabled);
  }
  handleStepChange() {
    this.input.step = String(this.step);
    this.formControlController.updateValidity();
  }
  async handleValueChange() {
    await this.updateComplete;
    this.formControlController.updateValidity();
  }
  /** Sets focus on the input. */
  focus(options) {
    this.input.focus(options);
  }
  /** Removes focus from the input. */
  blur() {
    this.input.blur();
  }
  /** Selects all the text in the input. */
  select() {
    this.input.select();
  }
  /** Sets the start and end positions of the text selection (0-based). */
  setSelectionRange(selectionStart, selectionEnd, selectionDirection = "none") {
    this.input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  }
  /** Replaces a range of text with a new string. */
  setRangeText(replacement, start, end, selectMode = "preserve") {
    const selectionStart = start != null ? start : this.input.selectionStart;
    const selectionEnd = end != null ? end : this.input.selectionEnd;
    this.input.setRangeText(replacement, selectionStart, selectionEnd, selectMode);
    if (this.value !== this.input.value) {
      this.value = this.input.value;
    }
  }
  /** Displays the browser picker for an input element (only works if the browser supports it for the input type). */
  showPicker() {
    if ("showPicker" in HTMLInputElement.prototype) {
      this.input.showPicker();
    }
  }
  /** Increments the value of a numeric input type by the value of the step attribute. */
  stepUp() {
    this.input.stepUp();
    if (this.value !== this.input.value) {
      this.value = this.input.value;
    }
  }
  /** Decrements the value of a numeric input type by the value of the step attribute. */
  stepDown() {
    this.input.stepDown();
    if (this.value !== this.input.value) {
      this.value = this.input.value;
    }
  }
  /** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
  checkValidity() {
    return this.input.checkValidity();
  }
  /** Gets the associated form, if one exists. */
  getForm() {
    return this.formControlController.getForm();
  }
  /** Checks for validity and shows the browser's validation message if the control is invalid. */
  reportValidity() {
    return this.input.reportValidity();
  }
  /** Sets a custom validation message. Pass an empty string to restore validity. */
  setCustomValidity(message) {
    this.input.setCustomValidity(message);
    this.formControlController.updateValidity();
  }
  render() {
    const hasLabelSlot = this.hasSlotController.test("label");
    const hasHelpTextSlot = this.hasSlotController.test("help-text");
    const hasLabel = this.label ? true : !!hasLabelSlot;
    const hasHelpText = this.helpText ? true : !!hasHelpTextSlot;
    const hasClearIcon = this.clearable && !this.disabled && !this.readonly;
    const isClearIconVisible = hasClearIcon && (typeof this.value === "number" || this.value.length > 0);
    return x$4`
      <div
        part="form-control"
        class=${e$3({
      "form-control": true,
      "form-control--small": this.size === "small",
      "form-control--medium": this.size === "medium",
      "form-control--large": this.size === "large",
      "form-control--has-label": hasLabel,
      "form-control--has-help-text": hasHelpText
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
            class=${e$3({
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
      "input--no-spin-buttons": this.noSpinButtons
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
              name=${o$4(this.name)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              placeholder=${o$4(this.placeholder)}
              minlength=${o$4(this.minlength)}
              maxlength=${o$4(this.maxlength)}
              min=${o$4(this.min)}
              max=${o$4(this.max)}
              step=${o$4(this.step)}
              .value=${l$1(this.value)}
              autocapitalize=${o$4(this.autocapitalize)}
              autocomplete=${o$4(this.autocomplete)}
              autocorrect=${o$4(this.autocorrect)}
              ?autofocus=${this.autofocus}
              spellcheck=${this.spellcheck}
              pattern=${o$4(this.pattern)}
              enterkeyhint=${o$4(this.enterkeyhint)}
              inputmode=${o$4(this.inputmode)}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @keydown=${this.handleKeyDown}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
            />

            ${hasClearIcon ? x$4`
                  <button
                    part="clear-button"
                    class=${e$3({
      input__clear: true,
      "input__clear--visible": isClearIconVisible
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
                ` : ""}
            ${this.passwordToggle && !this.disabled ? x$4`
                  <button
                    part="password-toggle-button"
                    class="input__password-toggle"
                    type="button"
                    aria-label=${this.localize.term(this.passwordVisible ? "hidePassword" : "showPassword")}
                    @click=${this.handlePasswordToggle}
                    tabindex="-1"
                  >
                    ${this.passwordVisible ? x$4`
                          <slot name="show-password-icon">
                            <sl-icon name="eye-slash" library="system"></sl-icon>
                          </slot>
                        ` : x$4`
                          <slot name="hide-password-icon">
                            <sl-icon name="eye" library="system"></sl-icon>
                          </slot>
                        `}
                  </button>
                ` : ""}

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
    `;
  }
};
SlInput.styles = [component_styles_default, form_control_styles_default, input_styles_default];
SlInput.dependencies = { "sl-icon": SlIcon };
__decorateClass([
  e$6(".input__control")
], SlInput.prototype, "input", 2);
__decorateClass([
  r$2()
], SlInput.prototype, "hasFocus", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "title", 2);
__decorateClass([
  n$4({ reflect: true })
], SlInput.prototype, "type", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "name", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "value", 2);
__decorateClass([
  defaultValue()
], SlInput.prototype, "defaultValue", 2);
__decorateClass([
  n$4({ reflect: true })
], SlInput.prototype, "size", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlInput.prototype, "filled", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlInput.prototype, "pill", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "label", 2);
__decorateClass([
  n$4({ attribute: "help-text" })
], SlInput.prototype, "helpText", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlInput.prototype, "clearable", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlInput.prototype, "disabled", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "placeholder", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlInput.prototype, "readonly", 2);
__decorateClass([
  n$4({ attribute: "password-toggle", type: Boolean })
], SlInput.prototype, "passwordToggle", 2);
__decorateClass([
  n$4({ attribute: "password-visible", type: Boolean })
], SlInput.prototype, "passwordVisible", 2);
__decorateClass([
  n$4({ attribute: "no-spin-buttons", type: Boolean })
], SlInput.prototype, "noSpinButtons", 2);
__decorateClass([
  n$4({ reflect: true })
], SlInput.prototype, "form", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlInput.prototype, "required", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "pattern", 2);
__decorateClass([
  n$4({ type: Number })
], SlInput.prototype, "minlength", 2);
__decorateClass([
  n$4({ type: Number })
], SlInput.prototype, "maxlength", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "min", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "max", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "step", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "autocapitalize", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "autocorrect", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "autocomplete", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlInput.prototype, "autofocus", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "enterkeyhint", 2);
__decorateClass([
  n$4({
    type: Boolean,
    converter: {
      // Allow "true|false" attribute values but keep the property boolean
      fromAttribute: (value) => !value || value === "false" ? false : true,
      toAttribute: (value) => value ? "true" : "false"
    }
  })
], SlInput.prototype, "spellcheck", 2);
__decorateClass([
  n$4()
], SlInput.prototype, "inputmode", 2);
__decorateClass([
  watch("disabled", { waitUntilFirstUpdate: true })
], SlInput.prototype, "handleDisabledChange", 1);
__decorateClass([
  watch("step", { waitUntilFirstUpdate: true })
], SlInput.prototype, "handleStepChange", 1);
__decorateClass([
  watch("value", { waitUntilFirstUpdate: true })
], SlInput.prototype, "handleValueChange", 1);

// src/components/checkbox/checkbox.styles.ts
var checkbox_styles_default = i$6`
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
`;

var SlCheckbox = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.formControlController = new FormControlController(this, {
      value: (control) => control.checked ? control.value || "on" : void 0,
      defaultValue: (control) => control.defaultChecked,
      setValue: (control, checked) => control.checked = checked
    });
    this.hasSlotController = new HasSlotController(this, "help-text");
    this.hasFocus = false;
    this.title = "";
    this.name = "";
    this.size = "medium";
    this.disabled = false;
    this.checked = false;
    this.indeterminate = false;
    this.defaultChecked = false;
    this.form = "";
    this.required = false;
    this.helpText = "";
  }
  /** Gets the validity state object */
  get validity() {
    return this.input.validity;
  }
  /** Gets the validation message */
  get validationMessage() {
    return this.input.validationMessage;
  }
  firstUpdated() {
    this.formControlController.updateValidity();
  }
  handleClick() {
    this.checked = !this.checked;
    this.indeterminate = false;
    this.emit("sl-change");
  }
  handleBlur() {
    this.hasFocus = false;
    this.emit("sl-blur");
  }
  handleInput() {
    this.emit("sl-input");
  }
  handleInvalid(event) {
    this.formControlController.setValidity(false);
    this.formControlController.emitInvalidEvent(event);
  }
  handleFocus() {
    this.hasFocus = true;
    this.emit("sl-focus");
  }
  handleDisabledChange() {
    this.formControlController.setValidity(this.disabled);
  }
  handleStateChange() {
    this.input.checked = this.checked;
    this.input.indeterminate = this.indeterminate;
    this.formControlController.updateValidity();
  }
  /** Simulates a click on the checkbox. */
  click() {
    this.input.click();
  }
  /** Sets focus on the checkbox. */
  focus(options) {
    this.input.focus(options);
  }
  /** Removes focus from the checkbox. */
  blur() {
    this.input.blur();
  }
  /** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
  checkValidity() {
    return this.input.checkValidity();
  }
  /** Gets the associated form, if one exists. */
  getForm() {
    return this.formControlController.getForm();
  }
  /** Checks for validity and shows the browser's validation message if the control is invalid. */
  reportValidity() {
    return this.input.reportValidity();
  }
  /**
   * Sets a custom validation message. The value provided will be shown to the user when the form is submitted. To clear
   * the custom validation message, call this method with an empty string.
   */
  setCustomValidity(message) {
    this.input.setCustomValidity(message);
    this.formControlController.updateValidity();
  }
  render() {
    const hasHelpTextSlot = this.hasSlotController.test("help-text");
    const hasHelpText = this.helpText ? true : !!hasHelpTextSlot;
    return x$4`
      <div
        class=${e$3({
      "form-control": true,
      "form-control--small": this.size === "small",
      "form-control--medium": this.size === "medium",
      "form-control--large": this.size === "large",
      "form-control--has-help-text": hasHelpText
    })}
      >
        <label
          part="base"
          class=${e$3({
      checkbox: true,
      "checkbox--checked": this.checked,
      "checkbox--disabled": this.disabled,
      "checkbox--focused": this.hasFocus,
      "checkbox--indeterminate": this.indeterminate,
      "checkbox--small": this.size === "small",
      "checkbox--medium": this.size === "medium",
      "checkbox--large": this.size === "large"
    })}
        >
          <input
            class="checkbox__input"
            type="checkbox"
            title=${this.title}
            name=${this.name}
            value=${o$4(this.value)}
            .indeterminate=${l$1(this.indeterminate)}
            .checked=${l$1(this.checked)}
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
            ${this.checked ? x$4`
                  <sl-icon part="checked-icon" class="checkbox__checked-icon" library="system" name="check"></sl-icon>
                ` : ""}
            ${!this.checked && this.indeterminate ? x$4`
                  <sl-icon
                    part="indeterminate-icon"
                    class="checkbox__indeterminate-icon"
                    library="system"
                    name="indeterminate"
                  ></sl-icon>
                ` : ""}
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
    `;
  }
};
SlCheckbox.styles = [component_styles_default, checkbox_styles_default];
SlCheckbox.dependencies = { "sl-icon": SlIcon };
__decorateClass([
  e$6('input[type="checkbox"]')
], SlCheckbox.prototype, "input", 2);
__decorateClass([
  r$2()
], SlCheckbox.prototype, "hasFocus", 2);
__decorateClass([
  n$4()
], SlCheckbox.prototype, "title", 2);
__decorateClass([
  n$4()
], SlCheckbox.prototype, "name", 2);
__decorateClass([
  n$4()
], SlCheckbox.prototype, "value", 2);
__decorateClass([
  n$4({ reflect: true })
], SlCheckbox.prototype, "size", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlCheckbox.prototype, "disabled", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlCheckbox.prototype, "checked", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlCheckbox.prototype, "indeterminate", 2);
__decorateClass([
  defaultValue("checked")
], SlCheckbox.prototype, "defaultChecked", 2);
__decorateClass([
  n$4({ reflect: true })
], SlCheckbox.prototype, "form", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlCheckbox.prototype, "required", 2);
__decorateClass([
  n$4({ attribute: "help-text" })
], SlCheckbox.prototype, "helpText", 2);
__decorateClass([
  watch("disabled", { waitUntilFirstUpdate: true })
], SlCheckbox.prototype, "handleDisabledChange", 1);
__decorateClass([
  watch(["checked", "indeterminate"], { waitUntilFirstUpdate: true })
], SlCheckbox.prototype, "handleStateChange", 1);

// src/components/tag/tag.styles.ts
var tag_styles_default = i$6`
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
`;

// src/components/icon-button/icon-button.styles.ts
var icon_button_styles_default = i$6`
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
`;

var SlIconButton = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.hasFocus = false;
    this.label = "";
    this.disabled = false;
  }
  handleBlur() {
    this.hasFocus = false;
    this.emit("sl-blur");
  }
  handleFocus() {
    this.hasFocus = true;
    this.emit("sl-focus");
  }
  handleClick(event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  /** Simulates a click on the icon button. */
  click() {
    this.button.click();
  }
  /** Sets focus on the icon button. */
  focus(options) {
    this.button.focus(options);
  }
  /** Removes focus from the icon button. */
  blur() {
    this.button.blur();
  }
  render() {
    const isLink = this.href ? true : false;
    const tag = isLink ? i$1`a` : i$1`button`;
    return u$1`
      <${tag}
        part="base"
        class=${e$3({
      "icon-button": true,
      "icon-button--disabled": !isLink && this.disabled,
      "icon-button--focused": this.hasFocus
    })}
        ?disabled=${o$4(isLink ? void 0 : this.disabled)}
        type=${o$4(isLink ? void 0 : "button")}
        href=${o$4(isLink ? this.href : void 0)}
        target=${o$4(isLink ? this.target : void 0)}
        download=${o$4(isLink ? this.download : void 0)}
        rel=${o$4(isLink && this.target ? "noreferrer noopener" : void 0)}
        role=${o$4(isLink ? void 0 : "button")}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-label="${this.label}"
        tabindex=${this.disabled ? "-1" : "0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @click=${this.handleClick}
      >
        <sl-icon
          class="icon-button__icon"
          name=${o$4(this.name)}
          library=${o$4(this.library)}
          src=${o$4(this.src)}
          aria-hidden="true"
        ></sl-icon>
      </${tag}>
    `;
  }
};
SlIconButton.styles = [component_styles_default, icon_button_styles_default];
SlIconButton.dependencies = { "sl-icon": SlIcon };
__decorateClass([
  e$6(".icon-button")
], SlIconButton.prototype, "button", 2);
__decorateClass([
  r$2()
], SlIconButton.prototype, "hasFocus", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "name", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "library", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "src", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "href", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "target", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "download", 2);
__decorateClass([
  n$4()
], SlIconButton.prototype, "label", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlIconButton.prototype, "disabled", 2);

var SlTag = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.localize = new LocalizeController(this);
    this.variant = "neutral";
    this.size = "medium";
    this.pill = false;
    this.removable = false;
  }
  handleRemoveClick() {
    this.emit("sl-remove");
  }
  render() {
    return x$4`
      <span
        part="base"
        class=${e$3({
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
      "tag--removable": this.removable
    })}
      >
        <slot part="content" class="tag__content"></slot>

        ${this.removable ? x$4`
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
            ` : ""}
      </span>
    `;
  }
};
SlTag.styles = [component_styles_default, tag_styles_default];
SlTag.dependencies = { "sl-icon-button": SlIconButton };
__decorateClass([
  n$4({ reflect: true })
], SlTag.prototype, "variant", 2);
__decorateClass([
  n$4({ reflect: true })
], SlTag.prototype, "size", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlTag.prototype, "pill", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlTag.prototype, "removable", 2);

// src/components/select/select.styles.ts
var select_styles_default = i$6`
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
`;

// src/internal/offset.ts
function getOffset(element, parent) {
  return {
    top: Math.round(element.getBoundingClientRect().top - parent.getBoundingClientRect().top),
    left: Math.round(element.getBoundingClientRect().left - parent.getBoundingClientRect().left)
  };
}
function scrollIntoView(element, container, direction = "vertical", behavior = "smooth") {
  const offset = getOffset(element, container);
  const offsetTop = offset.top + container.scrollTop;
  const offsetLeft = offset.left + container.scrollLeft;
  const minX = container.scrollLeft;
  const maxX = container.scrollLeft + container.offsetWidth;
  const minY = container.scrollTop;
  const maxY = container.scrollTop + container.offsetHeight;
  if (direction === "horizontal" || direction === "both") {
    if (offsetLeft < minX) {
      container.scrollTo({ left: offsetLeft, behavior });
    } else if (offsetLeft + element.clientWidth > maxX) {
      container.scrollTo({ left: offsetLeft - container.offsetWidth + element.clientWidth, behavior });
    }
  }
  if (direction === "vertical" || direction === "both") {
    if (offsetTop < minY) {
      container.scrollTo({ top: offsetTop, behavior });
    } else if (offsetTop + element.clientHeight > maxY) {
      container.scrollTo({ top: offsetTop - container.offsetHeight + element.clientHeight, behavior });
    }
  }
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let e$1 = class e extends i$2{constructor(i){if(super(i),this.it=E$4,i.type!==t$1.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(r){if(r===E$4||null==r)return this._t=void 0,this.it=r;if(r===T$4)return r;if("string"!=typeof r)throw Error(this.constructor.directiveName+"() called with a non-string value");if(r===this.it)return this._t;this.it=r;const s=[r];return s.raw=s,this._t={_$litType$:this.constructor.resultType,strings:s,values:[]}}};e$1.directiveName="unsafeHTML",e$1.resultType=1;const o$1=e$4(e$1);

var SlSelect = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    this.formControlController = new FormControlController(this, {
      assumeInteractionOn: ["sl-blur", "sl-input"]
    });
    this.hasSlotController = new HasSlotController(this, "help-text", "label");
    this.localize = new LocalizeController(this);
    this.typeToSelectString = "";
    this.hasFocus = false;
    this.displayLabel = "";
    this.selectedOptions = [];
    this.name = "";
    this.value = "";
    this.defaultValue = "";
    this.size = "medium";
    this.placeholder = "";
    this.multiple = false;
    this.maxOptionsVisible = 3;
    this.disabled = false;
    this.clearable = false;
    this.open = false;
    this.hoist = false;
    this.filled = false;
    this.pill = false;
    this.label = "";
    this.placement = "bottom";
    this.helpText = "";
    this.form = "";
    this.required = false;
    this.getTag = (option) => {
      return x$4`
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
    `;
    };
    this.handleDocumentFocusIn = (event) => {
      const path = event.composedPath();
      if (this && !path.includes(this)) {
        this.hide();
      }
    };
    this.handleDocumentKeyDown = (event) => {
      const target = event.target;
      const isClearButton = target.closest(".select__clear") !== null;
      const isIconButton = target.closest("sl-icon-button") !== null;
      if (isClearButton || isIconButton) {
        return;
      }
      if (event.key === "Escape" && this.open && !this.closeWatcher) {
        event.preventDefault();
        event.stopPropagation();
        this.hide();
        this.displayInput.focus({ preventScroll: true });
      }
      if (event.key === "Enter" || event.key === " " && this.typeToSelectString === "") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!this.open) {
          this.show();
          return;
        }
        if (this.currentOption && !this.currentOption.disabled) {
          if (this.multiple) {
            this.toggleOptionSelection(this.currentOption);
          } else {
            this.setSelectedOptions(this.currentOption);
          }
          this.updateComplete.then(() => {
            this.emit("sl-input");
            this.emit("sl-change");
          });
          if (!this.multiple) {
            this.hide();
            this.displayInput.focus({ preventScroll: true });
          }
        }
        return;
      }
      if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        const allOptions = this.getAllOptions();
        const currentIndex = allOptions.indexOf(this.currentOption);
        let newIndex = Math.max(0, currentIndex);
        event.preventDefault();
        if (!this.open) {
          this.show();
          if (this.currentOption) {
            return;
          }
        }
        if (event.key === "ArrowDown") {
          newIndex = currentIndex + 1;
          if (newIndex > allOptions.length - 1)
            newIndex = 0;
        } else if (event.key === "ArrowUp") {
          newIndex = currentIndex - 1;
          if (newIndex < 0)
            newIndex = allOptions.length - 1;
        } else if (event.key === "Home") {
          newIndex = 0;
        } else if (event.key === "End") {
          newIndex = allOptions.length - 1;
        }
        this.setCurrentOption(allOptions[newIndex]);
      }
      if (event.key.length === 1 || event.key === "Backspace") {
        const allOptions = this.getAllOptions();
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }
        if (!this.open) {
          if (event.key === "Backspace") {
            return;
          }
          this.show();
        }
        event.stopPropagation();
        event.preventDefault();
        clearTimeout(this.typeToSelectTimeout);
        this.typeToSelectTimeout = window.setTimeout(() => this.typeToSelectString = "", 1e3);
        if (event.key === "Backspace") {
          this.typeToSelectString = this.typeToSelectString.slice(0, -1);
        } else {
          this.typeToSelectString += event.key.toLowerCase();
        }
        for (const option of allOptions) {
          const label = option.getTextLabel().toLowerCase();
          if (label.startsWith(this.typeToSelectString)) {
            this.setCurrentOption(option);
            break;
          }
        }
      }
    };
    this.handleDocumentMouseDown = (event) => {
      const path = event.composedPath();
      if (this && !path.includes(this)) {
        this.hide();
      }
    };
  }
  /** Gets the validity state object */
  get validity() {
    return this.valueInput.validity;
  }
  /** Gets the validation message */
  get validationMessage() {
    return this.valueInput.validationMessage;
  }
  connectedCallback() {
    super.connectedCallback();
    this.open = false;
  }
  addOpenListeners() {
    var _a;
    const root = this.getRootNode();
    if ("CloseWatcher" in window) {
      (_a = this.closeWatcher) == null ? void 0 : _a.destroy();
      this.closeWatcher = new CloseWatcher();
      this.closeWatcher.onclose = () => {
        if (this.open) {
          this.hide();
          this.displayInput.focus({ preventScroll: true });
        }
      };
    }
    root.addEventListener("focusin", this.handleDocumentFocusIn);
    root.addEventListener("keydown", this.handleDocumentKeyDown);
    root.addEventListener("mousedown", this.handleDocumentMouseDown);
  }
  removeOpenListeners() {
    var _a;
    const root = this.getRootNode();
    root.removeEventListener("focusin", this.handleDocumentFocusIn);
    root.removeEventListener("keydown", this.handleDocumentKeyDown);
    root.removeEventListener("mousedown", this.handleDocumentMouseDown);
    (_a = this.closeWatcher) == null ? void 0 : _a.destroy();
  }
  handleFocus() {
    this.hasFocus = true;
    this.displayInput.setSelectionRange(0, 0);
    this.emit("sl-focus");
  }
  handleBlur() {
    this.hasFocus = false;
    this.emit("sl-blur");
  }
  handleLabelClick() {
    this.displayInput.focus();
  }
  handleComboboxMouseDown(event) {
    const path = event.composedPath();
    const isIconButton = path.some((el) => el instanceof Element && el.tagName.toLowerCase() === "sl-icon-button");
    if (this.disabled || isIconButton) {
      return;
    }
    event.preventDefault();
    this.displayInput.focus({ preventScroll: true });
    this.open = !this.open;
  }
  handleComboboxKeyDown(event) {
    if (event.key === "Tab") {
      return;
    }
    event.stopPropagation();
    this.handleDocumentKeyDown(event);
  }
  handleClearClick(event) {
    event.stopPropagation();
    if (this.value !== "") {
      this.setSelectedOptions([]);
      this.displayInput.focus({ preventScroll: true });
      this.updateComplete.then(() => {
        this.emit("sl-clear");
        this.emit("sl-input");
        this.emit("sl-change");
      });
    }
  }
  handleClearMouseDown(event) {
    event.stopPropagation();
    event.preventDefault();
  }
  handleOptionClick(event) {
    const target = event.target;
    const option = target.closest("sl-option");
    const oldValue = this.value;
    if (option && !option.disabled) {
      if (this.multiple) {
        this.toggleOptionSelection(option);
      } else {
        this.setSelectedOptions(option);
      }
      this.updateComplete.then(() => this.displayInput.focus({ preventScroll: true }));
      if (this.value !== oldValue) {
        this.updateComplete.then(() => {
          this.emit("sl-input");
          this.emit("sl-change");
        });
      }
      if (!this.multiple) {
        this.hide();
        this.displayInput.focus({ preventScroll: true });
      }
    }
  }
  handleDefaultSlotChange() {
    const allOptions = this.getAllOptions();
    const value = Array.isArray(this.value) ? this.value : [this.value];
    const values = [];
    if (customElements.get("sl-option")) {
      allOptions.forEach((option) => values.push(option.value));
      this.setSelectedOptions(allOptions.filter((el) => value.includes(el.value)));
    } else {
      customElements.whenDefined("sl-option").then(() => this.handleDefaultSlotChange());
    }
  }
  handleTagRemove(event, option) {
    event.stopPropagation();
    if (!this.disabled) {
      this.toggleOptionSelection(option, false);
      this.updateComplete.then(() => {
        this.emit("sl-input");
        this.emit("sl-change");
      });
    }
  }
  // Gets an array of all <sl-option> elements
  getAllOptions() {
    return [...this.querySelectorAll("sl-option")];
  }
  // Gets the first <sl-option> element
  getFirstOption() {
    return this.querySelector("sl-option");
  }
  // Sets the current option, which is the option the user is currently interacting with (e.g. via keyboard). Only one
  // option may be "current" at a time.
  setCurrentOption(option) {
    const allOptions = this.getAllOptions();
    allOptions.forEach((el) => {
      el.current = false;
      el.tabIndex = -1;
    });
    if (option) {
      this.currentOption = option;
      option.current = true;
      option.tabIndex = 0;
      option.focus();
    }
  }
  // Sets the selected option(s)
  setSelectedOptions(option) {
    const allOptions = this.getAllOptions();
    const newSelectedOptions = Array.isArray(option) ? option : [option];
    allOptions.forEach((el) => el.selected = false);
    if (newSelectedOptions.length) {
      newSelectedOptions.forEach((el) => el.selected = true);
    }
    this.selectionChanged();
  }
  // Toggles an option's selected state
  toggleOptionSelection(option, force) {
    if (force === true || force === false) {
      option.selected = force;
    } else {
      option.selected = !option.selected;
    }
    this.selectionChanged();
  }
  // This method must be called whenever the selection changes. It will update the selected options cache, the current
  // value, and the display value
  selectionChanged() {
    var _a, _b, _c, _d;
    this.selectedOptions = this.getAllOptions().filter((el) => el.selected);
    if (this.multiple) {
      this.value = this.selectedOptions.map((el) => el.value);
      if (this.placeholder && this.value.length === 0) {
        this.displayLabel = "";
      } else {
        this.displayLabel = this.localize.term("numOptionsSelected", this.selectedOptions.length);
      }
    } else {
      this.value = (_b = (_a = this.selectedOptions[0]) == null ? void 0 : _a.value) != null ? _b : "";
      this.displayLabel = (_d = (_c = this.selectedOptions[0]) == null ? void 0 : _c.getTextLabel()) != null ? _d : "";
    }
    this.updateComplete.then(() => {
      this.formControlController.updateValidity();
    });
  }
  get tags() {
    return this.selectedOptions.map((option, index) => {
      if (index < this.maxOptionsVisible || this.maxOptionsVisible <= 0) {
        const tag = this.getTag(option, index);
        return x$4`<div @sl-remove=${(e) => this.handleTagRemove(e, option)}>
          ${typeof tag === "string" ? o$1(tag) : tag}
        </div>`;
      } else if (index === this.maxOptionsVisible) {
        return x$4`<sl-tag>+${this.selectedOptions.length - index}</sl-tag>`;
      }
      return x$4``;
    });
  }
  handleInvalid(event) {
    this.formControlController.setValidity(false);
    this.formControlController.emitInvalidEvent(event);
  }
  handleDisabledChange() {
    if (this.disabled) {
      this.open = false;
      this.handleOpenChange();
    }
  }
  handleValueChange() {
    const allOptions = this.getAllOptions();
    const value = Array.isArray(this.value) ? this.value : [this.value];
    this.setSelectedOptions(allOptions.filter((el) => value.includes(el.value)));
  }
  async handleOpenChange() {
    if (this.open && !this.disabled) {
      this.setCurrentOption(this.selectedOptions[0] || this.getFirstOption());
      this.emit("sl-show");
      this.addOpenListeners();
      await stopAnimations(this);
      this.listbox.hidden = false;
      this.popup.active = true;
      requestAnimationFrame(() => {
        this.setCurrentOption(this.currentOption);
      });
      const { keyframes, options } = getAnimation(this, "select.show", { dir: this.localize.dir() });
      await animateTo(this.popup.popup, keyframes, options);
      if (this.currentOption) {
        scrollIntoView(this.currentOption, this.listbox, "vertical", "auto");
      }
      this.emit("sl-after-show");
    } else {
      this.emit("sl-hide");
      this.removeOpenListeners();
      await stopAnimations(this);
      const { keyframes, options } = getAnimation(this, "select.hide", { dir: this.localize.dir() });
      await animateTo(this.popup.popup, keyframes, options);
      this.listbox.hidden = true;
      this.popup.active = false;
      this.emit("sl-after-hide");
    }
  }
  /** Shows the listbox. */
  async show() {
    if (this.open || this.disabled) {
      this.open = false;
      return void 0;
    }
    this.open = true;
    return waitForEvent(this, "sl-after-show");
  }
  /** Hides the listbox. */
  async hide() {
    if (!this.open || this.disabled) {
      this.open = false;
      return void 0;
    }
    this.open = false;
    return waitForEvent(this, "sl-after-hide");
  }
  /** Checks for validity but does not show a validation message. Returns `true` when valid and `false` when invalid. */
  checkValidity() {
    return this.valueInput.checkValidity();
  }
  /** Gets the associated form, if one exists. */
  getForm() {
    return this.formControlController.getForm();
  }
  /** Checks for validity and shows the browser's validation message if the control is invalid. */
  reportValidity() {
    return this.valueInput.reportValidity();
  }
  /** Sets a custom validation message. Pass an empty string to restore validity. */
  setCustomValidity(message) {
    this.valueInput.setCustomValidity(message);
    this.formControlController.updateValidity();
  }
  /** Sets focus on the control. */
  focus(options) {
    this.displayInput.focus(options);
  }
  /** Removes focus from the control. */
  blur() {
    this.displayInput.blur();
  }
  render() {
    const hasLabelSlot = this.hasSlotController.test("label");
    const hasHelpTextSlot = this.hasSlotController.test("help-text");
    const hasLabel = this.label ? true : !!hasLabelSlot;
    const hasHelpText = this.helpText ? true : !!hasHelpTextSlot;
    const hasClearIcon = this.clearable && !this.disabled && this.value.length > 0;
    const isPlaceholderVisible = this.placeholder && this.value.length === 0;
    return x$4`
      <div
        part="form-control"
        class=${e$3({
      "form-control": true,
      "form-control--small": this.size === "small",
      "form-control--medium": this.size === "medium",
      "form-control--large": this.size === "large",
      "form-control--has-label": hasLabel,
      "form-control--has-help-text": hasHelpText
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
            class=${e$3({
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
      "select--large": this.size === "large"
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

              ${this.multiple ? x$4`<div part="tags" class="select__tags">${this.tags}</div>` : ""}

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

              ${hasClearIcon ? x$4`
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
                  ` : ""}

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
    `;
  }
};
SlSelect.styles = [component_styles_default, form_control_styles_default, select_styles_default];
SlSelect.dependencies = {
  "sl-icon": SlIcon,
  "sl-popup": SlPopup,
  "sl-tag": SlTag
};
__decorateClass([
  e$6(".select")
], SlSelect.prototype, "popup", 2);
__decorateClass([
  e$6(".select__combobox")
], SlSelect.prototype, "combobox", 2);
__decorateClass([
  e$6(".select__display-input")
], SlSelect.prototype, "displayInput", 2);
__decorateClass([
  e$6(".select__value-input")
], SlSelect.prototype, "valueInput", 2);
__decorateClass([
  e$6(".select__listbox")
], SlSelect.prototype, "listbox", 2);
__decorateClass([
  r$2()
], SlSelect.prototype, "hasFocus", 2);
__decorateClass([
  r$2()
], SlSelect.prototype, "displayLabel", 2);
__decorateClass([
  r$2()
], SlSelect.prototype, "currentOption", 2);
__decorateClass([
  r$2()
], SlSelect.prototype, "selectedOptions", 2);
__decorateClass([
  n$4()
], SlSelect.prototype, "name", 2);
__decorateClass([
  n$4({
    converter: {
      fromAttribute: (value) => value.split(" "),
      toAttribute: (value) => value.join(" ")
    }
  })
], SlSelect.prototype, "value", 2);
__decorateClass([
  defaultValue()
], SlSelect.prototype, "defaultValue", 2);
__decorateClass([
  n$4({ reflect: true })
], SlSelect.prototype, "size", 2);
__decorateClass([
  n$4()
], SlSelect.prototype, "placeholder", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlSelect.prototype, "multiple", 2);
__decorateClass([
  n$4({ attribute: "max-options-visible", type: Number })
], SlSelect.prototype, "maxOptionsVisible", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlSelect.prototype, "disabled", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlSelect.prototype, "clearable", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlSelect.prototype, "open", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlSelect.prototype, "hoist", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlSelect.prototype, "filled", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlSelect.prototype, "pill", 2);
__decorateClass([
  n$4()
], SlSelect.prototype, "label", 2);
__decorateClass([
  n$4({ reflect: true })
], SlSelect.prototype, "placement", 2);
__decorateClass([
  n$4({ attribute: "help-text" })
], SlSelect.prototype, "helpText", 2);
__decorateClass([
  n$4({ reflect: true })
], SlSelect.prototype, "form", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlSelect.prototype, "required", 2);
__decorateClass([
  n$4()
], SlSelect.prototype, "getTag", 2);
__decorateClass([
  watch("disabled", { waitUntilFirstUpdate: true })
], SlSelect.prototype, "handleDisabledChange", 1);
__decorateClass([
  watch("value", { waitUntilFirstUpdate: true })
], SlSelect.prototype, "handleValueChange", 1);
__decorateClass([
  watch("open", { waitUntilFirstUpdate: true })
], SlSelect.prototype, "handleOpenChange", 1);
setDefaultAnimation("select.show", {
  keyframes: [
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1 }
  ],
  options: { duration: 100, easing: "ease" }
});
setDefaultAnimation("select.hide", {
  keyframes: [
    { opacity: 1, scale: 1 },
    { opacity: 0, scale: 0.9 }
  ],
  options: { duration: 100, easing: "ease" }
});

// src/components/option/option.styles.ts
var option_styles_default = i$6`
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
`;

var SlOption = class extends ShoelaceElement {
  constructor() {
    super(...arguments);
    // @ts-expect-error - Controller is currently unused
    this.localize = new LocalizeController(this);
    this.current = false;
    this.selected = false;
    this.hasHover = false;
    this.value = "";
    this.disabled = false;
  }
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "option");
    this.setAttribute("aria-selected", "false");
  }
  handleDefaultSlotChange() {
    const textLabel = this.getTextLabel();
    if (typeof this.cachedTextLabel === "undefined") {
      this.cachedTextLabel = textLabel;
      return;
    }
    if (textLabel !== this.cachedTextLabel) {
      this.cachedTextLabel = textLabel;
      this.emit("slotchange", { bubbles: true, composed: false, cancelable: false });
    }
  }
  handleMouseEnter() {
    this.hasHover = true;
  }
  handleMouseLeave() {
    this.hasHover = false;
  }
  handleDisabledChange() {
    this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
  }
  handleSelectedChange() {
    this.setAttribute("aria-selected", this.selected ? "true" : "false");
  }
  handleValueChange() {
    if (typeof this.value !== "string") {
      this.value = String(this.value);
    }
    if (this.value.includes(" ")) {
      console.error(`Option values cannot include a space. All spaces have been replaced with underscores.`, this);
      this.value = this.value.replace(/ /g, "_");
    }
  }
  /** Returns a plain text label based on the option's content. */
  getTextLabel() {
    const nodes = this.childNodes;
    let label = "";
    [...nodes].forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!node.hasAttribute("slot")) {
          label += node.textContent;
        }
      }
      if (node.nodeType === Node.TEXT_NODE) {
        label += node.textContent;
      }
    });
    return label.trim();
  }
  render() {
    return x$4`
      <div
        part="base"
        class=${e$3({
      option: true,
      "option--current": this.current,
      "option--disabled": this.disabled,
      "option--selected": this.selected,
      "option--hover": this.hasHover
    })}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
      >
        <sl-icon part="checked-icon" class="option__check" name="check" library="system" aria-hidden="true"></sl-icon>
        <slot part="prefix" name="prefix" class="option__prefix"></slot>
        <slot part="label" class="option__label" @slotchange=${this.handleDefaultSlotChange}></slot>
        <slot part="suffix" name="suffix" class="option__suffix"></slot>
      </div>
    `;
  }
};
SlOption.styles = [component_styles_default, option_styles_default];
SlOption.dependencies = { "sl-icon": SlIcon };
__decorateClass([
  e$6(".option__label")
], SlOption.prototype, "defaultSlot", 2);
__decorateClass([
  r$2()
], SlOption.prototype, "current", 2);
__decorateClass([
  r$2()
], SlOption.prototype, "selected", 2);
__decorateClass([
  r$2()
], SlOption.prototype, "hasHover", 2);
__decorateClass([
  n$4({ reflect: true })
], SlOption.prototype, "value", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlOption.prototype, "disabled", 2);
__decorateClass([
  watch("disabled")
], SlOption.prototype, "handleDisabledChange", 1);
__decorateClass([
  watch("selected")
], SlOption.prototype, "handleSelectedChange", 1);
__decorateClass([
  watch("value")
], SlOption.prototype, "handleValueChange", 1);

var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!customElements.get("sl-dropdown"))
    customElements.define("sl-dropdown", SlDropdown);
if (!customElements.get("sl-input"))
    customElements.define("sl-input", SlInput);
if (!customElements.get("sl-checkbox"))
    customElements.define("sl-checkbox", SlCheckbox);
if (!customElements.get("sl-select"))
    customElements.define("sl-select", SlSelect);
if (!customElements.get("sl-option"))
    customElements.define("sl-option", SlOption);
if (!customElements.get("sl-button"))
    customElements.define("sl-button", SlButton);
let InlangAddVariable = class InlangAddVariable extends r$4 {
    constructor() {
        super(...arguments);
        //state
        this._newVariable = "";
        //state
        this._localVariableDerivedFrom = undefined;
        //state
        this._isLocalVariable = false;
    }
    static { this.styles = [
        baseStyling,
        i$6 `
      .button-wrapper {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dropdown-container {
        font-size: 14px;
        width: 240px;
        background-color: var(--sl-panel-background-color);
        border: 1px solid var(--sl-input-border-color);
        padding: 12px 0;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .dropdown-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 0 12px;
      }
      .dropdown-item.nested {
        padding-left: 24px;
      }
      .dropdown-item.disable {
        opacity: 0.5;
        pointer-events: none;
      }
      .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--sl-input-color);
        font-size: 12px;
      }
      .dropdown-title {
        font-size: 12px;
        font-weight: 500;
        margin: 6px 0;
      }
      .help-text {
        display: flex;
        gap: 8px;
        color: var(--sl-input-help-text-color);
      }
      .help-text p {
        flex: 1;
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
      }
      .actions {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .separator {
        height: 1px;
        background-color: var(--sl-input-border-color);
      }
      sl-checkbox::part(form-control-help-text) {
        font-size: 13px;
        padding-top: 6px;
        line-height: 1.3;
        color: var(--sl-input-help-text-color);
      }
      sl-checkbox::part(base) {
        font-size: 14px;
      }
      sl-input::part(input) {
        height: 32px;
        font-size: 14px;
        padding-bottom: 2px;
      }
      sl-input::part(base) {
        height: 32px;
      }
      sl-select::part(form-control-label) {
        font-size: 14px;
        padding-bottom: 4px;
      }
      sl-select::part(combobox) {
        height: 32px;
        min-height: 32px;
      }
      sl-select::part(display-input) {
        font-size: 14px;
      }
    `,
    ]; }
    async firstUpdated() {
        await this.updateComplete;
        if (this.bundle) {
            this._localVariableDerivedFrom = this.bundle.declarations[0];
            this._newVariable = "";
            this._isLocalVariable = false;
        }
    }
    render() {
        return x$4 `
      <sl-dropdown
        distance="-4"
        class="dropdown"
        @sl-show=${() => {
            this._localVariableDerivedFrom = this.bundle.declarations[0];
        }}
      >
        <div slot="trigger" class="button-wrapper">
          <slot></slot>
        </div>
        <div class="dropdown-container">
          <div class="dropdown-item">
            <sl-input
              size="small"
              value=${this._newVariable}
              placeholder="Enter name"
              @input=${(e) => {
            this._newVariable = e.target.value;
        }}
            >
            </sl-input>
          </div>
          <div class="separator"></div>
          <div
            class=${this.bundle?.declarations &&
            this.bundle?.declarations.length > 0
            ? "dropdown-item"
            : "dropdown-item disable"}
          >
            <sl-checkbox
              ?checked=${this._isLocalVariable}
              help-text=${this.bundle?.declarations &&
            this.bundle?.declarations.length > 0
            ? "Set to true, if you want to derive a local variable from a input variable."
            : "No input variables available."}
              @sl-change=${(e) => {
            const target = e.target;
            this._isLocalVariable = target.checked;
        }}
              >local</sl-checkbox
            >
          </div>
          ${this._isLocalVariable
            ? x$4 `<div class="dropdown-item">
                <sl-select
                  label="Derive from"
                  value=${this._localVariableDerivedFrom?.name}
                  @sl-change=${(e) => {
                this._localVariableDerivedFrom =
                    this.bundle.declarations.find((declaration) => declaration.name ===
                        e.target.value);
            }}
                >
                  ${this.bundle.declarations.map((declaration) => {
                return x$4 `<sl-option value=${declaration.name}
                      >${declaration.name}</sl-option
                    >`;
            })}
                </sl-select>
              </div>`
            : ``}
          ${this._isLocalVariable
            ? x$4 `<div class="dropdown-item nested">
                <sl-checkbox checked disabled>plural</sl-checkbox>
              </div>`
            : ``}
          <div class="separator"></div>
          <div class="dropdown-item">
            <sl-button
              variant="primary"
              @click=${() => {
            if (this._isLocalVariable && this._localVariableDerivedFrom) {
                if (this._newVariable &&
                    this._newVariable.trim() !== "" &&
                    this.bundle) {
                    this.dispatchEvent(createChangeEvent({
                        entityId: this.bundle.id,
                        entity: "bundle",
                        newData: {
                            ...this.bundle,
                            declarations: [
                                ...this.bundle.declarations,
                                {
                                    type: "local-variable",
                                    name: this._newVariable,
                                    value: {
                                        type: "expression",
                                        arg: {
                                            type: "variable-reference",
                                            name: this._localVariableDerivedFrom.name,
                                        },
                                        annotation: {
                                            type: "function-reference",
                                            name: "plural",
                                            options: [],
                                        },
                                    },
                                },
                            ],
                        },
                    }));
                }
            }
            else {
                if (this._newVariable &&
                    this._newVariable.trim() !== "" &&
                    this.bundle) {
                    this.dispatchEvent(createChangeEvent({
                        entityId: this.bundle.id,
                        entity: "bundle",
                        newData: {
                            ...this.bundle,
                            declarations: [
                                ...this.bundle.declarations,
                                {
                                    name: this._newVariable,
                                    type: "input-variable",
                                },
                            ],
                        },
                    }));
                }
            }
            this._newVariable = "";
            this._isLocalVariable = false;
            this._localVariableDerivedFrom = undefined;
            const dropdown = this.shadowRoot?.querySelector(".dropdown");
            dropdown.hide();
        }}
              >Add variable</sl-button
            >
          </div>
        </div>
      </sl-dropdown>
    `;
    }
};
__decorate$6([
    n$4({ type: Object })
], InlangAddVariable.prototype, "bundle", void 0);
__decorate$6([
    r$2()
], InlangAddVariable.prototype, "_newVariable", void 0);
__decorate$6([
    r$2()
], InlangAddVariable.prototype, "_localVariableDerivedFrom", void 0);
__decorate$6([
    r$2()
], InlangAddVariable.prototype, "_isLocalVariable", void 0);
InlangAddVariable = __decorate$6([
    t$2("inlang-add-variable")
], InlangAddVariable);

var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// // in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-button"))
    customElements.define("sl-button", SlButton);
if (!customElements.get("sl-dropdown"))
    customElements.define("sl-dropdown", SlDropdown);
if (!customElements.get("sl-menu"))
    customElements.define("sl-menu", SlMenu);
if (!customElements.get("sl-menu-item"))
    customElements.define("sl-menu-item", SlMenuItem);
let InlangBundle = class InlangBundle extends r$4 {
    constructor() {
        super(...arguments);
        this._bundleActionsPresent = false;
    }
    static { this.styles = [
        baseStyling,
        i$6 `
      div {
        box-sizing: border-box;
        font-size: 14px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        background-color: var(--sl-color-neutral-300);
        padding: 0 12px;
        min-height: 44px;
      }
      .header-left {
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 16px;
        min-height: 44px;
        color: var(--sl-input-color);
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 44px;
      }
      .separator {
        height: 20px;
        width: 1px;
        background-color: var(--sl-input-border-color-hover);
        opacity: 0.7;
        border-radius: 1px;
      }
      .slotted-menu-wrapper {
        display: flex;
        flex-direction: column;
      }
      .variables-wrapper {
        display: flex;
        align-items: center;
        min-height: 44px;
        gap: 8px;
        color: var(--sl-input-color);
      }
      .variables {
        display: flex;
        align-items: center;
        min-height: 44px;
        gap: 1px;
      }
      .variable-tag::part(base) {
        height: 28px;
        font-weight: 500;
        cursor: pointer;
      }
      .text-button::part(base) {
        background-color: transparent;
        border: 1px solid transparent;
      }
      .text-button::part(base):hover {
        background-color: var(--sl-panel-border-color);
        border: 1px solid transparent;
        color: var(--sl-input-color-hover);
      }
      .alias-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .alias {
        font-weight: 400;
        color: var(--sl-input-placeholder-color);
      }
      .alias-counter {
        height: 20px;
        width: 24px;
        font-weight: 500;
        font-size: 11px;
        color: var(--sl-input-color-hover);
        padding: 4px;
        border-radius: 4px;
        background-color: var(--sl-input-background-color-hover);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      sl-button::part(base) {
        background-color: var(--sl-input-background-color);
        color: var(--sl-input-color);
        border: 1px solid var(--sl-input-border-color);
        font-size: 13px;
      }
      sl-button::part(base):hover {
        background-color: var(--sl-input-background-color-hover);
        color: var(--sl-input-color-hover);
        border: 1px solid var(--sl-input-border-color-hover);
      }
      sl-menu-item::part(label) {
        font-size: 14px;
        padding-left: 12px;
      }
      sl-menu-item::part(base) {
        color: var(--sl-input-color);
      }
      sl-menu-item::part(base):hover {
        background-color: var(--sl-input-background-color-hover);
      }
      sl-menu-item::part(checked-icon) {
        display: none;
      }
      .selector:hover {
        background-color: var(--sl-input-background-color-hover);
      }
    `,
    ]; }
    async firstUpdated() {
        await this.updateComplete;
        if (
        // @ts-expect-error - children is not in the types
        [...this.children].some((child) => child.tagName === "INLANG-BUNDLE-ACTION")) {
            this._bundleActionsPresent = true;
        }
        // override primitive colors to match the design system
        overridePrimitiveColors();
    }
    render() {
        return x$4 `
      <div>
        <div class=${`header`} part="base">
          <div class="header-left">
            <span># ${this.bundle.id}</span>
          </div>

          <div class="header-right">
            ${this.bundle.declarations.length > 0
            ? x$4 `<div class="variables-wrapper">
                  Variables:
                  <div class="variables">
                    ${this.bundle.declarations.map((declaration) => x$4 `<sl-dropdown
                          ><sl-button
                            exportparts="base:variable"
                            slot="trigger"
                            class="variable-tag"
                            variant="neutral"
                            size="small"
                            >${declaration.name}</sl-button
                          ><sl-menu>
                            <sl-menu-item
                              value="delete"
                              @click=${() => {
                const filtered = this.bundle.declarations.filter((d) => d.name !== declaration.name);
                this.dispatchEvent(createChangeEvent({
                    entityId: this.bundle.id,
                    entity: "bundle",
                    newData: {
                        ...this.bundle,
                        declarations: filtered,
                    },
                }));
            }}
                              >Delete</sl-menu-item
                            >
                          </sl-menu>
                        </sl-dropdown>`)}
                    <inlang-add-variable
                      .bundle=${this.bundle}
                      part="add-variable"
                    >
                      <sl-tooltip content="Add a variable to this bundle">
                        <sl-button
                          class="text-button"
                          variant="neutral"
                          size="small"
                          ><svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            style="margin: 0 -2px"
                            slot="prefix"
                          >
                            <path
                              fill="currentColor"
                              d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
                            ></path></svg
                        ></sl-button>
                      </sl-tooltip>
                    </inlang-add-variable>
                  </div>
                </div>`
            : x$4 `<div class="variables-wrapper">
                  <inlang-add-variable .bundle=${this.bundle}>
                    <sl-tooltip content="Add a variable to this bundle">
                      <sl-button class="text-button" variant="text" size="small"
                        ><svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          slot="prefix"
                          style="margin-right: -2px"
                        >
                          <path
                            fill="currentColor"
                            d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
                          ></path></svg
                        >New variable</sl-button
                      >
                    </sl-tooltip>
                  </inlang-add-variable>
                </div>`}
            ${this._bundleActionsPresent
            ? x$4 `<div class="separator"></div>
                  <sl-dropdown class="bundle-actions">
                    <sl-button
                      class="text-button"
                      variant="text"
                      size="small"
                      slot="trigger"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        slot="prefix"
                        style="margin: 0 -2px"
                      >
                        <path
                          fill="currentColor"
                          d="M7 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
                        /></svg
                    ></sl-button>
                    <sl-menu>
                      <slot name="bundle-action"></slot>
                    </sl-menu>
                  </sl-dropdown>`
            : ``}
          </div>
        </div>
        <slot name="message"></slot>
        <!-- TODO: workaround for slot needs a better solution | when conditionally rendered, the slot doesn't get passed into the dom and then can not be queried. That's why we put it here additionally. Will never be renedered under a message. -->
        <slot name="bundle-action"></slot>
      </div>
    `;
    }
};
__decorate$5([
    n$4({ type: Object })
], InlangBundle.prototype, "bundle", void 0);
__decorate$5([
    r$2()
], InlangBundle.prototype, "_bundleActionsPresent", void 0);
InlangBundle = __decorate$5([
    t$2("inlang-bundle")
], InlangBundle);

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}

let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}

const _state = {};
function v7(options, buf, offset) {
    let bytes;
    if (options) {
        bytes = v7Bytes(options.random ?? options.rng?.() ?? rng(), options.msecs, options.seq, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = rng();
        updateV7State(_state, now, rnds);
        bytes = v7Bytes(rnds, _state.msecs, _state.seq, buf, offset);
    }
    return buf ? bytes : unsafeStringify(bytes);
}
function updateV7State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.seq ??= 0;
    if (now > state.msecs) {
        state.seq = (rnds[6] << 23) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
        state.msecs = now;
    }
    else {
        state.seq = (state.seq + 1) | 0;
        if (state.seq === 0) {
            state.msecs++;
        }
    }
    return state;
}
function v7Bytes(rnds, msecs, seq, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    seq ??= ((rnds[6] * 0x7f) << 24) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
    buf[offset++] = (msecs / 0x10000000000) & 0xff;
    buf[offset++] = (msecs / 0x100000000) & 0xff;
    buf[offset++] = (msecs / 0x1000000) & 0xff;
    buf[offset++] = (msecs / 0x10000) & 0xff;
    buf[offset++] = (msecs / 0x100) & 0xff;
    buf[offset++] = msecs & 0xff;
    buf[offset++] = 0x70 | ((seq >>> 28) & 0x0f);
    buf[offset++] = (seq >>> 20) & 0xff;
    buf[offset++] = 0x80 | ((seq >>> 14) & 0x3f);
    buf[offset++] = (seq >>> 6) & 0xff;
    buf[offset++] = ((seq << 2) & 0xff) | (rnds[10] & 0x03);
    buf[offset++] = rnds[11];
    buf[offset++] = rnds[12];
    buf[offset++] = rnds[13];
    buf[offset++] = rnds[14];
    buf[offset++] = rnds[15];
    return buf;
}

var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!customElements.get("sl-tag"))
    customElements.define("sl-tag", SlTag);
if (!customElements.get("sl-dropdown"))
    customElements.define("sl-dropdown", SlDropdown);
if (!customElements.get("sl-menu"))
    customElements.define("sl-menu", SlMenu);
if (!customElements.get("sl-menu-item"))
    customElements.define("sl-menu-item", SlMenuItem);
let InlangMessage = class InlangMessage extends r$4 {
    constructor() {
        super(...arguments);
        this._refLocale = () => {
            return this.settings?.baseLocale;
        };
    }
    static { this.styles = [
        baseStyling,
        i$6 `
			div {
				box-sizing: border-box;
				font-size: 14px;
			}
			:host {
				position: relative;
				display: flex;
				min-height: 44px;
				border: 1px solid var(--sl-input-border-color) !important;
				border-top: none !important;
			}
			.message:first-child {
				border-top: 1px solid var(--sl-input-border-color) !important;
			}
			.language-container {
				font-weight: 500;
				width: 80px;
				min-height: 44px;
				padding-top: 12px;
				padding-left: 12px;
				padding-right: 12px;
				background-color: var(--sl-input-background-color-disabled);
				border-right: 1px solid var(--sl-input-border-color);
				color: var(--sl-input-color);
			}
			.message-body {
				flex: 1;
				display: flex;
				flex-direction: column;
			}
			.message-header {
				width: 100%;
				min-height: 44px;
				display: flex;
				justify-content: space-between;
				background-color: var(--sl-input-background-color-disabled);
				color: var(--sl-input-color);
				border-bottom: 1px solid var(--sl-input-border-color);
			}
			.no-bottom-border {
				border-bottom: none;
			}
			.selector-container {
				min-height: 44px;
				display: flex;
			}
			.selector {
				height: 44px;
				width: 120px;
				display: flex;
				align-items: center;
				padding: 12px;
				border-right: 1px solid var(--sl-input-border-color);
				font-weight: 500;
				cursor: pointer;
			}
			sl-menu-item::part(label) {
				font-size: 14px;
				padding-left: 12px;
			}
			sl-menu-item::part(base) {
				color: var(--sl-input-color);
			}
			sl-menu-item::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
			}
			sl-menu-item::part(checked-icon) {
				display: none;
			}
			.selector:hover {
				background-color: var(--sl-input-background-color-hover);
			}
			.add-selector-container {
				height: 44px;
				width: 44px;
				display: flex;
				align-items: center;
				padding: 12px;
			}
			.add-selector::part(base) {
				height: 28px;
				width: 28px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
			}
			.message-actions {
				height: 44px;
				display: flex;
				align-items: center;
				padding: 12px;
				gap: 8px;
			}
			sl-button::part(base) {
				background-color: var(--sl-input-background-color);
				color: var(--sl-input-color);
				border: 1px solid var(--sl-input-border-color);
			}
			sl-button::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
			.variants-container {
				width: 100%;
				height: 44px;
				display: flex;
				flex-direction: column;
				height: auto;
			}
			.new-variant {
				box-sizing: border-box;
				min-height: 44px;
				width: 100%;
				display: flex;
				gap: 4px;
				align-items: center;
				padding-left: 12px;
				margin: 0;
				background-color: var(--sl-input-background-color);
				color: var(--sl-input-placeholder-color);
				border-top: 1px solid var(--sl-input-border-color);
				cursor: pointer;
				transitions: all 0.5s;
			}
			.new-variant:hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
			}
			.ref-tag::part(base) {
				background-color: var(--sl-input-placeholder-color);
				color: var(--sl-input-background-color);
				height: 22px;
				border: none;
			}
			.selector-button {
				margin-left: 8px;
			}
		`,
    ]; }
    render() {
        return x$4 `
			<div class="language-container">
				<span>${this.message?.locale}</span>
				${this._refLocale() === this.message?.locale
            ? x$4 `<sl-tag class="ref-tag" size="small" variant="neutral"
							>ref</sl-tag
						>`
            : ``}
			</div>
			<div class="message-body">
				${(this.message && this.message.selectors.length > 0) ||
            (this.message &&
                this.variants &&
                this.variants.length > 1 &&
                this.message.selectors.length === 0)
            ? x$4 `<div
							class=${`message-header` +
                ` ` +
                (this.variants && this.variants.length === 0
                    ? `no-bottom-border`
                    : ``)}
						>
							<div class="selector-container">
								${this.message.selectors.map((selector, index) => x$4 `<sl-dropdown>
											<div class="selector" part="selector" slot="trigger">
												${selector.name}
											</div>
											<sl-menu>
												<sl-menu-item
													value="delete"
													@click=${() => {
                if (this.message) {
                    // remove matches from underlying variants
                    for (const variant of this.variants) {
                        this.dispatchEvent(createChangeEvent({
                            entityId: variant.id,
                            entity: "variant",
                            newData: {
                                ...variant,
                                matches: variant.matches.filter((match) => match["key"] !== selector.name),
                            },
                        }));
                    }
                    // remove selector from message
                    this.dispatchEvent(createChangeEvent({
                        entityId: this.message.id,
                        entity: "message",
                        newData: {
                            ...this.message,
                            selectors: this.message.selectors.filter((_, i) => i !== index),
                        },
                    }));
                }
            }}
													><svg
														xmlns="http://www.w3.org/2000/svg"
														width="18px"
														height="18px"
														viewBox="0 0 24 24"
														slot="prefix"
														style="margin-right: -4px; margin-left: 12px"
													>
														<g fill="none">
															<path
																d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
															/>
															<path
																fill="currentColor"
																d="M20 5a1 1 0 1 1 0 2h-1l-.003.071l-.933 13.071A2 2 0 0 1 16.069 22H7.93a2 2 0 0 1-1.995-1.858l-.933-13.07L5 7H4a1 1 0 0 1 0-2zm-3.003 2H7.003l.928 13h8.138zM14 2a1 1 0 1 1 0 2h-4a1 1 0 0 1 0-2z"
															/>
														</g></svg
													>Delete selector</sl-menu-item
												>
											</sl-menu>
										</sl-dropdown>`)}
								<div class="selector-button">
									<slot name="selector-button"></slot>
								</div>
							</div>
							<div class="message-actions"></div>
						</div>`
            : ``}
				<div class="variants-container">
					<slot name="variant"></slot>
					${this.message?.selectors && this.message.selectors.length > 0
            ? x$4 `<p
								part="new-variant"
								@click=${() => {
                const variant = {
                    id: v7(),
                    messageId: this.message.id,
                    // combine the matches that are already present with the new category -> like a matrix
                    matches: this.message.selectors.map((selector) => ({
                        type: "catchall-match",
                        key: selector.name,
                    })),
                    pattern: [],
                };
                this.dispatchEvent(createChangeEvent({
                    entityId: variant.id,
                    entity: "variant",
                    newData: variant,
                }));
            }}
								class="new-variant"
							>
								<svg
									viewBox="0 0 24 24"
									width="18"
									height="18"
									slot="prefix"
									class="w-5 h-5 -mx-1"
								>
									<path
										fill="currentColor"
										d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
									></path>
								</svg>
								New variant
							</p>`
            : ``}
				</div>
			</div>
		`;
    }
};
__decorate$4([
    n$4()
], InlangMessage.prototype, "message", void 0);
__decorate$4([
    n$4()
], InlangMessage.prototype, "variants", void 0);
__decorate$4([
    n$4({ type: Object })
], InlangMessage.prototype, "settings", void 0);
InlangMessage = __decorate$4([
    t$2("inlang-message")
], InlangMessage);

// src/components/tooltip/tooltip.styles.ts
var tooltip_styles_default = i$6`
  :host {
    --max-width: 20rem;
    --hide-delay: 0ms;
    --show-delay: 150ms;

    display: contents;
  }

  .tooltip {
    --arrow-size: var(--sl-tooltip-arrow-size);
    --arrow-color: var(--sl-tooltip-background-color);
  }

  .tooltip::part(popup) {
    z-index: var(--sl-z-index-tooltip);
  }

  .tooltip[placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .tooltip[placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .tooltip[placement^='left']::part(popup) {
    transform-origin: right;
  }

  .tooltip[placement^='right']::part(popup) {
    transform-origin: left;
  }

  .tooltip__body {
    display: block;
    width: max-content;
    max-width: var(--max-width);
    border-radius: var(--sl-tooltip-border-radius);
    background-color: var(--sl-tooltip-background-color);
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    color: var(--sl-tooltip-color);
    padding: var(--sl-tooltip-padding);
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }
`;

var SlTooltip = class extends ShoelaceElement {
  constructor() {
    super();
    this.localize = new LocalizeController(this);
    this.content = "";
    this.placement = "top";
    this.disabled = false;
    this.distance = 8;
    this.open = false;
    this.skidding = 0;
    this.trigger = "hover focus";
    this.hoist = false;
    this.handleBlur = () => {
      if (this.hasTrigger("focus")) {
        this.hide();
      }
    };
    this.handleClick = () => {
      if (this.hasTrigger("click")) {
        if (this.open) {
          this.hide();
        } else {
          this.show();
        }
      }
    };
    this.handleFocus = () => {
      if (this.hasTrigger("focus")) {
        this.show();
      }
    };
    this.handleDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        this.hide();
      }
    };
    this.handleMouseOver = () => {
      if (this.hasTrigger("hover")) {
        const delay = parseDuration(getComputedStyle(this).getPropertyValue("--show-delay"));
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = window.setTimeout(() => this.show(), delay);
      }
    };
    this.handleMouseOut = () => {
      if (this.hasTrigger("hover")) {
        const delay = parseDuration(getComputedStyle(this).getPropertyValue("--hide-delay"));
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = window.setTimeout(() => this.hide(), delay);
      }
    };
    this.addEventListener("blur", this.handleBlur, true);
    this.addEventListener("focus", this.handleFocus, true);
    this.addEventListener("click", this.handleClick);
    this.addEventListener("mouseover", this.handleMouseOver);
    this.addEventListener("mouseout", this.handleMouseOut);
  }
  disconnectedCallback() {
    var _a;
    (_a = this.closeWatcher) == null ? void 0 : _a.destroy();
    document.removeEventListener("keydown", this.handleDocumentKeyDown);
  }
  firstUpdated() {
    this.body.hidden = !this.open;
    if (this.open) {
      this.popup.active = true;
      this.popup.reposition();
    }
  }
  hasTrigger(triggerType) {
    const triggers = this.trigger.split(" ");
    return triggers.includes(triggerType);
  }
  async handleOpenChange() {
    var _a, _b;
    if (this.open) {
      if (this.disabled) {
        return;
      }
      this.emit("sl-show");
      if ("CloseWatcher" in window) {
        (_a = this.closeWatcher) == null ? void 0 : _a.destroy();
        this.closeWatcher = new CloseWatcher();
        this.closeWatcher.onclose = () => {
          this.hide();
        };
      } else {
        document.addEventListener("keydown", this.handleDocumentKeyDown);
      }
      await stopAnimations(this.body);
      this.body.hidden = false;
      this.popup.active = true;
      const { keyframes, options } = getAnimation(this, "tooltip.show", { dir: this.localize.dir() });
      await animateTo(this.popup.popup, keyframes, options);
      this.popup.reposition();
      this.emit("sl-after-show");
    } else {
      this.emit("sl-hide");
      (_b = this.closeWatcher) == null ? void 0 : _b.destroy();
      document.removeEventListener("keydown", this.handleDocumentKeyDown);
      await stopAnimations(this.body);
      const { keyframes, options } = getAnimation(this, "tooltip.hide", { dir: this.localize.dir() });
      await animateTo(this.popup.popup, keyframes, options);
      this.popup.active = false;
      this.body.hidden = true;
      this.emit("sl-after-hide");
    }
  }
  async handleOptionsChange() {
    if (this.hasUpdated) {
      await this.updateComplete;
      this.popup.reposition();
    }
  }
  handleDisabledChange() {
    if (this.disabled && this.open) {
      this.hide();
    }
  }
  /** Shows the tooltip. */
  async show() {
    if (this.open) {
      return void 0;
    }
    this.open = true;
    return waitForEvent(this, "sl-after-show");
  }
  /** Hides the tooltip */
  async hide() {
    if (!this.open) {
      return void 0;
    }
    this.open = false;
    return waitForEvent(this, "sl-after-hide");
  }
  //
  // NOTE: Tooltip is a bit unique in that we're using aria-live instead of aria-labelledby to trick screen readers into
  // announcing the content. It works really well, but it violates an accessibility rule. We're also adding the
  // aria-describedby attribute to a slot, which is required by <sl-popup> to correctly locate the first assigned
  // element, otherwise positioning is incorrect.
  //
  render() {
    return x$4`
      <sl-popup
        part="base"
        exportparts="
          popup:base__popup,
          arrow:base__arrow
        "
        class=${e$3({
      tooltip: true,
      "tooltip--open": this.open
    })}
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        strategy=${this.hoist ? "fixed" : "absolute"}
        flip
        shift
        arrow
        hover-bridge
      >
        ${""}
        <slot slot="anchor" aria-describedby="tooltip"></slot>

        ${""}
        <div part="body" id="tooltip" class="tooltip__body" role="tooltip" aria-live=${this.open ? "polite" : "off"}>
          <slot name="content">${this.content}</slot>
        </div>
      </sl-popup>
    `;
  }
};
SlTooltip.styles = [component_styles_default, tooltip_styles_default];
SlTooltip.dependencies = { "sl-popup": SlPopup };
__decorateClass([
  e$6("slot:not([name])")
], SlTooltip.prototype, "defaultSlot", 2);
__decorateClass([
  e$6(".tooltip__body")
], SlTooltip.prototype, "body", 2);
__decorateClass([
  e$6("sl-popup")
], SlTooltip.prototype, "popup", 2);
__decorateClass([
  n$4()
], SlTooltip.prototype, "content", 2);
__decorateClass([
  n$4()
], SlTooltip.prototype, "placement", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlTooltip.prototype, "disabled", 2);
__decorateClass([
  n$4({ type: Number })
], SlTooltip.prototype, "distance", 2);
__decorateClass([
  n$4({ type: Boolean, reflect: true })
], SlTooltip.prototype, "open", 2);
__decorateClass([
  n$4({ type: Number })
], SlTooltip.prototype, "skidding", 2);
__decorateClass([
  n$4()
], SlTooltip.prototype, "trigger", 2);
__decorateClass([
  n$4({ type: Boolean })
], SlTooltip.prototype, "hoist", 2);
__decorateClass([
  watch("open", { waitUntilFirstUpdate: true })
], SlTooltip.prototype, "handleOpenChange", 1);
__decorateClass([
  watch(["content", "distance", "hoist", "placement", "skidding"])
], SlTooltip.prototype, "handleOptionsChange", 1);
__decorateClass([
  watch("disabled")
], SlTooltip.prototype, "handleDisabledChange", 1);
setDefaultAnimation("tooltip.show", {
  keyframes: [
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1 }
  ],
  options: { duration: 150, easing: "ease" }
});
setDefaultAnimation("tooltip.hide", {
  keyframes: [
    { opacity: 1, scale: 1 },
    { opacity: 0, scale: 0.8 }
  ],
  options: { duration: 150, easing: "ease" }
});

var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!customElements.get("sl-input"))
    customElements.define("sl-input", SlInput);
if (!customElements.get("sl-tooltip"))
    customElements.define("sl-tooltip", SlTooltip);
if (!customElements.get("sl-button"))
    customElements.define("sl-button", SlButton);
let InlangVariant = class InlangVariant extends r$4 {
    constructor() {
        super(...arguments);
        this._updateMatch = (selectorName, value) => {
            //TODO improve this function
            if (this.variant) {
                const newVariant = structuredClone(this.variant);
                // filter the match if it already exists
                const matches = newVariant.matches.filter((m) => m.key !== selectorName);
                // update the match with value (mutates variant)
                if (value === "*") {
                    matches.push({
                        type: "catchall-match",
                        key: selectorName,
                    });
                }
                else {
                    matches.push({
                        type: "literal-match",
                        key: selectorName,
                        value,
                    });
                }
                this.dispatchEvent(createChangeEvent({
                    entityId: this.variant.id,
                    entity: "variant",
                    newData: {
                        ...newVariant,
                        matches,
                    },
                }));
            }
        };
    }
    static { this.styles = [
        baseStyling,
        i$6 `
      div {
        box-sizing: border-box;
        font-size: 14px;
      }
      :host {
        border-top: 1px solid var(--sl-input-border-color) !important;
      }
      :host(:first-child) {
        border-top: none !important;
      }
      .variant {
        position: relative;
        min-height: 44px;
        width: 100%;
        display: flex;
        align-items: stretch;
      }
      .match {
        min-height: 44px;
        width: 120px;
        background-color: var(--sl-input-background-color);
        border-right: 1px solid var(--sl-input-border-color);
        position: relative;
        z-index: 0;
      }
      .match:focus-within {
        z-index: 3;
      }
      .match::part(base) {
        border: none;
        border-radius: 0;
        min-height: 44px;
        color: var(--sl-input-color);
      }
      .match::part(input) {
        min-height: 44px;
        background-color: var(--sl-input-background-color);
      }
      .match::part(input):hover {
        background-color: var(--sl-input-background-color-hover);
      }
      .variant {
        position: relative;
        z-index: 0;
      }
      .variant:focus-within {
        z-index: 3;
      }
      .actions {
        position: absolute;
        top: 0;
        right: 0;
        height: 44px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding-right: 12px;
        z-index: 1;
      }
      .add-selector::part(base) {
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      sl-button::part(base) {
        color: var(--sl-input-color);
        background-color: var(--sl-input-background-color);
        border: 1px solid var(--sl-input-border-color);
      }
      sl-button::part(base):hover {
        color: var(--sl-input-color-hover);
        background-color: var(--sl-input-background-color-hover);
        border: 1px solid var(--sl-input-border-color-hover);
      }
      .history-button {
        position: relative;
        z-index: 0;
      }
    `,
    ]; }
    //hooks
    async firstUpdated() {
        await this.updateComplete;
        //get all sl-inputs and set the color to the inlang colors
        overridePrimitiveColors();
    }
    render() {
        return this.variant
            ? x$4 `<div class="variant">
          ${this.variant
                ? this.variant.matches.map((match) => {
                    return x$4 `
                  <sl-input
                    exportparts="input:match"
                    id="${this.variant.id}-${match.key}"
                    class="match"
                    size="small"
                    value=${match.type === "literal-match" ? match.value : "*"}
                    @sl-blur=${(e) => {
                        const element = this.shadowRoot?.getElementById(`${this.variant.id}-${match}`);
                        if (element && e.target === element) {
                            this._updateMatch(match.key, e.target.value);
                        }
                    }}
                  ></sl-input>
                `;
                })
                : undefined}

          <slot name="pattern-editor" class="pattern-editor"></slot>
          <div class="actions">
            <slot name="variant-action"></slot>
          </div>
        </div>`
            : undefined;
    }
};
__decorate$3([
    n$4()
], InlangVariant.prototype, "variant", void 0);
InlangVariant = __decorate$3([
    t$2("inlang-variant")
], InlangVariant);

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function t(t){return {}}const e={},n={},r={},s={},i={},o={},l={},c={},a={},u={},f={},d$1={},h$2={},g$2={},_$2={},p$2={},y$4={},m$3={},x$3={},v$3={},T$3={},C$3={},S$4={},k$3={},b$2={},w$3={},N$3={},E$3={},P$4={},D$3={},F$2={},O$3={},I$3={},L$3={},A$3={},M$3={},z$2={},W$2={},B$3={},R$4={},K$2={},J$1={},U$2={},V$1={},$$2={},H$2="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,j$2=H$2&&"documentMode"in document?document.documentMode:null,q$2=H$2&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),Q$1=H$2&&/^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent),X$2=!(!H$2||!("InputEvent"in window)||j$2)&&"getTargetRanges"in new window.InputEvent("input"),Y$1=H$2&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),Z$1=H$2&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,G$1=H$2&&/Android/.test(navigator.userAgent),tt=H$2&&/^(?=.*Chrome).*/i.test(navigator.userAgent),et=H$2&&G$1&&tt,nt=H$2&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&!tt,rt=1,st=3,it=0,ot=1,lt=2,ct=0,at=1,ut=2,ft=1,dt=2,ht=4,gt=8,_t=16,pt=32,yt=64,mt=128,xt=112|(3|ht|gt)|mt,vt=1,Tt=2,Ct=3,St=4,kt=5,bt=6,wt=Y$1||Z$1||nt?" ":"​",Nt="\n\n",Et=Q$1?" ":wt,Pt="֑-߿יִ-﷽ﹰ-ﻼ",Dt="A-Za-zÀ-ÖØ-öø-ʸ̀-֐ࠀ-῿‎Ⰰ-﬜︀-﹯﻽-￿",Ft=new RegExp("^[^"+Dt+"]*["+Pt+"]"),Ot=new RegExp("^[^"+Pt+"]*["+Dt+"]"),It={bold:1,code:16,highlight:mt,italic:2,strikethrough:ht,subscript:32,superscript:64,underline:gt},Lt={directionless:1,unmergeable:2},At={center:Tt,end:bt,justify:St,left:vt,right:Ct,start:kt},Mt={[Tt]:"center",[bt]:"end",[St]:"justify",[vt]:"left",[Ct]:"right",[kt]:"start"},zt={normal:0,segmented:2,token:1},Wt={[ct]:"normal",[ut]:"segmented",[at]:"token"};function Bt(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var Rt=Bt((function(t){const e=new URLSearchParams;e.append("code",t);for(let t=1;t<arguments.length;t++)e.append("v",arguments[t]);throw Error(`Minified Lexical error #${t}; visit https://lexical.dev/docs/error?${e} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}));function Kt(...t){const e=[];for(const n of t)if(n&&"string"==typeof n)for(const[t]of n.matchAll(/\S+/g))e.push(t);return e}const Jt=100;let Ut=!1,Vt=0;function $t(t){Vt=t.timeStamp;}function Ht(t,e,n){return e.__lexicalLineBreak===t||void 0!==t[`__lexicalKey_${n._key}`]}function jt(t,e,n){const r=_n(n._window);let s=null,i=null;null!==r&&r.anchorNode===t&&(s=r.anchorOffset,i=r.focusOffset);const o=t.nodeValue;null!==o&&Le(e,o,s,i,!1);}function qt(t,e,n){if(us(t)){const e=t.anchor.getNode();if(e.is(n)&&t.format!==e.getFormat())return !1}return e.nodeType===st&&n.isAttached()}function Qt(t,e,n){Ut=!0;const r=performance.now()-Vt>Jt;try{ii(t,(()=>{const s=ws()||function(t){return t.getEditorState().read((()=>{const t=ws();return null!==t?t.clone():null}))}(t),i=new Map,o=t.getRootElement(),l=t._editorState,c=t._blockCursorElement;let a=!1,u="";for(let n=0;n<e.length;n++){const f=e[n],d=f.type,h=f.target;let g=Te(h,l);if(!(null===g&&h!==o||ui(g)))if("characterData"===d)r&&Gr(g)&&qt(s,h,g)&&jt(h,g,t);else if("childList"===d){a=!0;const e=f.addedNodes;for(let n=0;n<e.length;n++){const r=e[n],s=ve(r),i=r.parentNode;if(null!=i&&r!==c&&null===s&&("BR"!==r.nodeName||!Ht(r,i,t))){if(Q$1){const t=r.innerText||r.nodeValue;t&&(u+=t);}i.removeChild(r);}}const n=f.removedNodes,r=n.length;if(r>0){let e=0;for(let s=0;s<r;s++){const r=n[s];("BR"===r.nodeName&&Ht(r,h,t)||c===r)&&(h.appendChild(r),e++);}r!==e&&(h===o&&(g=be(l)),i.set(h,g));}}}if(i.size>0)for(const[e,n]of i)if(li(n)){const r=n.getChildrenKeys();let s=e.firstChild;for(let n=0;n<r.length;n++){const i=r[n],o=t.getElementByKey(i);null!==o&&(null==s?(e.appendChild(o),s=o):s!==o&&e.replaceChild(o,s),s=s.nextSibling);}}else Gr(n)&&n.markDirty();const f=n.takeRecords();if(f.length>0){for(let e=0;e<f.length;e++){const n=f[e],r=n.addedNodes,s=n.target;for(let e=0;e<r.length;e++){const n=r[e],i=n.parentNode;null==i||"BR"!==n.nodeName||Ht(n,s,t)||i.removeChild(n);}}n.takeRecords();}null!==s&&(a&&(s.dirty=!0,we(s)),Q$1&&Qe(t)&&s.insertRawText(u));}));}finally{Ut=!1;}}function Xt(t){const e=t._observer;if(null!==e){Qt(t,e.takeRecords(),e);}}function Yt(t){!function(t){0===Vt&&rn(t).addEventListener("textInput",$t,!0);}(t),t._observer=new MutationObserver(((e,n)=>{Qt(t,e,n);}));}function Zt(t,e){const n=t.__mode,r=t.__format,s=t.__style,i=e.__mode,o=e.__format,l=e.__style;return !(null!==n&&n!==i||null!==r&&r!==o||null!==s&&s!==l)}function Gt(t,e){const n=t.mergeWithSibling(e),r=js()._normalizedNodes;return r.add(t.__key),r.add(e.__key),n}function te$1(t){let e,n,r=t;if(""!==r.__text||!r.isSimpleText()||r.isUnmergeable()){for(;null!==(e=r.getPreviousSibling())&&Gr(e)&&e.isSimpleText()&&!e.isUnmergeable();){if(""!==e.__text){if(Zt(e,r)){r=Gt(e,r);break}break}e.remove();}for(;null!==(n=r.getNextSibling())&&Gr(n)&&n.isSimpleText()&&!n.isUnmergeable();){if(""!==n.__text){if(Zt(r,n)){r=Gt(r,n);break}break}n.remove();}}else r.remove();}function ee$1(t){return ne$1(t.anchor),ne$1(t.focus),t}function ne$1(t){for(;"element"===t.type;){const e=t.getNode(),n=t.offset;let r,s;if(n===e.getChildrenSize()?(r=e.getChildAtIndex(n-1),s=!0):(r=e.getChildAtIndex(n),s=!1),Gr(r)){t.set(r.__key,s?r.getTextContentSize():0,"text");break}if(!li(r))break;t.set(r.__key,s?r.getChildrenSize():0,"element");}}let re$1=1;function se(){re$1=1;}const ie="function"==typeof queueMicrotask?queueMicrotask:t=>{Promise.resolve().then(t);};function oe$1(t){const e=document.activeElement;if(null===e)return !1;const n=e.nodeName;return ui(Te(t))&&("INPUT"===n||"TEXTAREA"===n||"true"===e.contentEditable&&null==e.__lexicalEditor)}function le$1(t,e,n){const r=t.getRootElement();try{return null!==r&&r.contains(e)&&r.contains(n)&&null!==e&&!oe$1(e)&&ce(e)===t}catch(t){return !1}}function ce(t){let e=t;for(;null!=e;){const t=e.__lexicalEditor;if(null!=t)return t;e=Ge(e);}return null}function ae(t){return t.isToken()||t.isSegmented()}function ue(t){return t.nodeType===st}function fe(t){let e=t;for(;null!=e;){if(ue(e))return e;e=e.firstChild;}return null}function de(t,e,n){const r=It[e];if(null!==n&&(t&r)==(n&r))return t;let s=t^r;return "subscript"===e?s&=~It.superscript:"superscript"===e&&(s&=~It.subscript),s}function he(t){return Gr(t)||Ar(t)||ui(t)}function ge(t,e){if(null!=e)return void(t.__key=e);Vs(),$s();const n=js(),r=Hs(),s=""+re$1++;r._nodeMap.set(s,t),li(t)?n._dirtyElements.set(s,!0):n._dirtyLeaves.add(s),n._cloneNotNeeded.add(s),n._dirtyType=ot,t.__key=s;}function _e(t){const e=t.getParent();if(null!==e){const n=t.getWritable(),r=e.getWritable(),s=t.getPreviousSibling(),i=t.getNextSibling();if(null===s)if(null!==i){const t=i.getWritable();r.__first=i.__key,t.__prev=null;}else r.__first=null;else {const t=s.getWritable();if(null!==i){const e=i.getWritable();e.__prev=t.__key,t.__next=e.__key;}else t.__next=null;n.__prev=null;}if(null===i)if(null!==s){const t=s.getWritable();r.__last=s.__key,t.__next=null;}else r.__last=null;else {const t=i.getWritable();if(null!==s){const e=s.getWritable();e.__next=t.__key,t.__prev=e.__key;}else t.__prev=null;n.__next=null;}r.__size--,n.__parent=null;}}function pe(t){$s();const e=t.getLatest(),n=e.__parent,r=Hs(),s=js(),i=r._nodeMap,o=s._dirtyElements;null!==n&&function(t,e,n){let r=t;for(;null!==r;){if(n.has(r))return;const t=e.get(r);if(void 0===t)break;n.set(r,!1),r=t.__parent;}}(n,i,o);const l=e.__key;s._dirtyType=ot,li(t)?o.set(l,!0):s._dirtyLeaves.add(l);}function ye(t){Vs();const e=js(),n=e._compositionKey;if(t!==n){if(e._compositionKey=t,null!==n){const t=xe(n);null!==t&&t.getWritable();}if(null!==t){const e=xe(t);null!==e&&e.getWritable();}}}function me(){if(Us())return null;return js()._compositionKey}function xe(t,e){const n=(e||Hs())._nodeMap.get(t);return void 0===n?null:n}function ve(t,e){const n=t[`__lexicalKey_${js()._key}`];return void 0!==n?xe(n,e):null}function Te(t,e){let n=t;for(;null!=n;){const t=ve(n,e);if(null!==t)return t;n=Ge(n);}return null}function Ce(t){const e=t._decorators,n=Object.assign({},e);return t._pendingDecorators=n,n}function Se(t){return t.read((()=>ke().getTextContent()))}function ke(){return be(Hs())}function be(t){return t._nodeMap.get("root")}function we(t){Vs();const e=Hs();null!==t&&(t.dirty=!0,t.setCachedNodes(null)),e._selection=t;}function Ne(t){const e=js(),n=function(t,e){let n=t;for(;null!=n;){const t=n[`__lexicalKey_${e._key}`];if(void 0!==t)return t;n=Ge(n);}return null}(t,e);if(null===n){return t===e.getRootElement()?xe("root"):null}return xe(n)}function Ee(t,e){return e?t.getTextContentSize():0}function Pe(t){return /[\uD800-\uDBFF][\uDC00-\uDFFF]/g.test(t)}function De(t){const e=[];let n=t;for(;null!==n;)e.push(n),n=n._parentEditor;return e}function Fe(){return Math.random().toString(36).replace(/[^a-z]+/g,"").substr(0,5)}function Oe(t){return t.nodeType===st?t.nodeValue:null}function Ie(t,e,n){const r=_n(e._window);if(null===r)return;const s=r.anchorNode;let{anchorOffset:i,focusOffset:o}=r;if(null!==s){let e=Oe(s);const r=Te(s);if(null!==e&&Gr(r)){if(e===wt&&n){const t=n.length;e=n,i=t,o=t;}null!==e&&Le(r,e,i,o,t);}}}function Le(t,e,n,r,s){let i=t;if(i.isAttached()&&(s||!i.isDirty())){const o=i.isComposing();let l=e;(o||s)&&e[e.length-1]===wt&&(l=e.slice(0,-1));const c=i.getTextContent();if(s||l!==c){if(""===l){if(ye(null),Y$1||Z$1||nt)i.remove();else {const t=js();setTimeout((()=>{t.update((()=>{i.isAttached()&&i.remove();}));}),20);}return}const e=i.getParent(),s=Ns(),c=i.getTextContentSize(),a=me(),u=i.getKey();if(i.isToken()||null!==a&&u===a&&!o||us(s)&&(null!==e&&!e.canInsertTextBefore()&&0===s.anchor.offset||s.anchor.key===t.__key&&0===s.anchor.offset&&!i.canInsertTextBefore()&&!o||s.focus.key===t.__key&&s.focus.offset===c&&!i.canInsertTextAfter()&&!o))return void i.markDirty();const f=ws();if(!us(f)||null===n||null===r)return void i.setTextContent(l);if(f.setTextNodeRange(i,n,i,r),i.isSegmented()){const t=Zr(i.getTextContent());i.replace(t),i=t;}i.setTextContent(l);}}}function Ae(t,e){if(e.isSegmented())return !0;if(!t.isCollapsed())return !1;const n=t.anchor.offset,r=e.getParentOrThrow(),s=e.isToken();return 0===n?!e.canInsertTextBefore()||!r.canInsertTextBefore()&&!e.isComposing()||s||function(t){const e=t.getPreviousSibling();return (Gr(e)||li(e)&&e.isInline())&&!e.canInsertTextAfter()}(e):n===e.getTextContentSize()&&(!e.canInsertTextAfter()||!r.canInsertTextAfter()&&!e.isComposing()||s)}function Me(t){return "ArrowLeft"===t}function ze(t){return "ArrowRight"===t}function We(t,e){return q$2?t:e}function Be(t){return "Enter"===t}function Re(t){return "Backspace"===t}function Ke(t){return "Delete"===t}function Je(t,e,n){return "a"===t.toLowerCase()&&We(e,n)}function Ue(){const t=ke();we(ee$1(t.select(0,t.getChildrenSize())));}function Ve(t,e){void 0===t.__lexicalClassNameCache&&(t.__lexicalClassNameCache={});const n=t.__lexicalClassNameCache,r=n[e];if(void 0!==r)return r;const s=t[e];if("string"==typeof s){const t=Kt(s);return n[e]=t,t}return s}function $e(t,e,n,r,s){if(0===n.size)return;const i=r.__type,o=r.__key,l=e.get(i);void 0===l&&Rt(33,i);const c=l.klass;let a=t.get(c);void 0===a&&(a=new Map,t.set(c,a));const u=a.get(o),f="destroyed"===u&&"created"===s;(void 0===u||f)&&a.set(o,f?"updated":s);}function He(t){const e=Hs(),n=e._readOnly,r=t.getType(),s=e._nodeMap,i=[];for(const[,e]of s)e instanceof t&&e.__type===r&&(n||e.isAttached())&&i.push(e);return i}function je(t,e,n){const r=t.getParent();let s=n,i=t;return null!==r&&(e&&0===n?(s=i.getIndexWithinParent(),i=r):e||n!==i.getChildrenSize()||(s=i.getIndexWithinParent()+1,i=r)),i.getChildAtIndex(e?s-1:s)}function qe(t,e){const n=t.offset;if("element"===t.type){return je(t.getNode(),e,n)}{const r=t.getNode();if(e&&0===n||!e&&n===r.getTextContentSize()){const t=e?r.getPreviousSibling():r.getNextSibling();return null===t?je(r.getParentOrThrow(),e,r.getIndexWithinParent()+(e?0:1)):t}}return null}function Qe(t){const e=rn(t).event,n=e&&e.inputType;return "insertFromPaste"===n||"insertFromPasteAsQuotation"===n}function Xe(t,e,n){return ni(t,e,n)}function Ye(t){return !di(t)&&!t.isLastChild()&&!t.isInline()}function Ze(t,e){const n=t._keyToDOMMap.get(e);return void 0===n&&Rt(75,e),n}function Ge(t){const e=t.assignedSlot||t.parentElement;return null!==e&&11===e.nodeType?e.host:e}function tn(t){return js()._updateTags.has(t)}function en(t){Vs();js()._updateTags.add(t);}function nn(t,e){let n=t.getParent();for(;null!==n;){if(n.is(e))return !0;n=n.getParent();}return !1}function rn(t){const e=t._window;return null===e&&Rt(78),e}function sn(t){return li(t)&&t.isInline()||ui(t)&&t.isInline()}function on(t){let e=t.getParentOrThrow();for(;null!==e;){if(ln(e))return e;e=e.getParentOrThrow();}return e}function ln(t){return di(t)||li(t)&&t.isShadowRoot()}function cn(t){const e=t.constructor.clone(t);return ge(e,null),e}function an(t){const e=js(),n=t.constructor.getType(),r=e._nodes.get(n);void 0===r&&Rt(97);const s=r.replace;if(null!==s){const e=s(t);return e instanceof t.constructor||Rt(98),e}return t}function un(t,e){!di(t.getParent())||li(e)||ui(e)||Rt(99);}function fn(t){const e=xe(t);return null===e&&Rt(63,t),e}function dn(t){return (ui(t)||li(t)&&!t.canBeEmpty())&&!t.isInline()}function hn(t,e,n){n.style.removeProperty("caret-color"),e._blockCursorElement=null;const r=t.parentElement;null!==r&&r.removeChild(t);}function gn(t,e,n){let r=t._blockCursorElement;if(us(n)&&n.isCollapsed()&&"element"===n.anchor.type&&e.contains(document.activeElement)){const s=n.anchor,i=s.getNode(),o=s.offset;let l=!1,c=null;if(o===i.getChildrenSize()){dn(i.getChildAtIndex(o-1))&&(l=!0);}else {const e=i.getChildAtIndex(o);if(dn(e)){const n=e.getPreviousSibling();(null===n||dn(n))&&(l=!0,c=t.getElementByKey(e.__key));}}if(l){const n=t.getElementByKey(i.__key);return null===r&&(t._blockCursorElement=r=function(t){const e=t.theme,n=document.createElement("div");n.contentEditable="false",n.setAttribute("data-lexical-cursor","true");let r=e.blockCursor;if(void 0!==r){if("string"==typeof r){const t=Kt(r);r=e.blockCursor=t;}void 0!==r&&n.classList.add(...r);}return n}(t._config)),e.style.caretColor="transparent",void(null===c?n.appendChild(r):n.insertBefore(r,c))}}null!==r&&hn(r,t,e);}function _n(t){return H$2?(t||window).getSelection():null}function pn(t,e){let n=t.getChildAtIndex(e);null==n&&(n=t),ln(t)&&Rt(102);const r=t=>{const e=t.getParentOrThrow(),s=ln(e),i=t!==n||s?cn(t):t;if(s)return li(t)&&li(i)||Rt(133),t.insertAfter(i),[t,i,i];{const[n,s,o]=r(e),l=t.getNextSiblings();return o.append(i,...l),[n,s,i]}},[s,i]=r(n);return [s,i]}function yn(t){return mn(t)&&"A"===t.tagName}function mn(t){return 1===t.nodeType}function xn(t){const e=new RegExp(/^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var|#text)$/,"i");return null!==t.nodeName.match(e)}function vn(t){const e=new RegExp(/^(address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hr|li|main|nav|noscript|ol|p|pre|section|table|td|tfoot|ul|video)$/,"i");return null!==t.nodeName.match(e)}function Tn(t){if(di(t)||ui(t)&&!t.isInline())return !0;if(!li(t)||ln(t))return !1;const e=t.getFirstChild(),n=null===e||Ar(e)||Gr(e)||e.isInline();return !t.isInline()&&!1!==t.canBeEmpty()&&n}function Cn(t,e){let n=t;for(;null!==n&&null!==n.getParent()&&!e(n);)n=n.getParentOrThrow();return e(n)?n:null}function Sn(){return js()}function kn(t,e,n,r,s,i){let o=t.getFirstChild();for(;null!==o;){const t=o.__key;o.__parent===e&&(li(o)&&kn(o,t,n,r,s,i),n.has(t)||i.delete(t),s.push(t)),o=o.getNextSibling();}}let bn,wn,Nn,En,Pn,Dn,Fn,On,In,Ln,An="",Mn="",zn=null,Wn="",Bn=!1,Rn=!1,Kn=null;function Jn(t,e){const n=Fn.get(t);if(null!==e){const n=ir(t);n.parentNode===e&&e.removeChild(n);}if(On.has(t)||wn._keyToDOMMap.delete(t),li(n)){const t=tr(n,Fn);Un(t,0,t.length-1,null);}void 0!==n&&$e(Ln,Nn,En,n,"destroyed");}function Un(t,e,n,r){let s=e;for(;s<=n;++s){const e=t[s];void 0!==e&&Jn(e,r);}}function Vn(t,e){t.setProperty("text-align",e);}const $n="40px";function Hn(t,e){const n=bn.theme.indent;if("string"==typeof n){const r=t.classList.contains(n);e>0&&!r?t.classList.add(n):e<1&&r&&t.classList.remove(n);}const r=getComputedStyle(t).getPropertyValue("--lexical-indent-base-value")||$n;t.style.setProperty("padding-inline-start",0===e?"":`calc(${e} * ${r})`);}function jn(t,e){const n=t.style;0===e?Vn(n,""):e===vt?Vn(n,"left"):e===Tt?Vn(n,"center"):e===Ct?Vn(n,"right"):e===St?Vn(n,"justify"):e===kt?Vn(n,"start"):e===bt&&Vn(n,"end");}function qn(t,e,n){const r=On.get(t);void 0===r&&Rt(60);const s=r.createDOM(bn,wn);if(function(t,e,n){const r=n._keyToDOMMap;e["__lexicalKey_"+n._key]=t,r.set(t,e);}(t,s,wn),Gr(r)?s.setAttribute("data-lexical-text","true"):ui(r)&&s.setAttribute("data-lexical-decorator","true"),li(r)){const t=r.__indent,e=r.__size;if(0!==t&&Hn(s,t),0!==e){const t=e-1;!function(t,e,n,r){const s=Mn;Mn="",Qn(t,n,0,e,r,null),Zn(n,r),Mn=s;}(tr(r,On),t,r,s);}const n=r.__format;0!==n&&jn(s,n),r.isInline()||Yn(null,r,s),Ye(r)&&(An+=Nt,Wn+=Nt);}else {const e=r.getTextContent();if(ui(r)){const e=r.decorate(wn,bn);null!==e&&nr(t,e),s.contentEditable="false";}else Gr(r)&&(r.isDirectionless()||(Mn+=e));An+=e,Wn+=e;}if(null!==e)if(null!=n)e.insertBefore(s,n);else {const t=e.__lexicalLineBreak;null!=t?e.insertBefore(s,t):e.appendChild(s);}return $e(Ln,Nn,En,r,"created"),s}function Qn(t,e,n,r,s,i){const o=An;An="";let l=n;for(;l<=r;++l){qn(t[l],s,i);const e=On.get(t[l]);null!==e&&null===zn&&Gr(e)&&(zn=e.getFormat());}Ye(e)&&(An+=Nt),s.__lexicalTextContent=An,An=o+An;}function Xn(t,e){const n=e.get(t);return Ar(n)||ui(n)&&n.isInline()}function Yn(t,e,n){const r=null!==t&&(0===t.__size||Xn(t.__last,Fn)),s=0===e.__size||Xn(e.__last,On);if(r){if(!s){const t=n.__lexicalLineBreak;null!=t&&n.removeChild(t),n.__lexicalLineBreak=null;}}else if(s){const t=document.createElement("br");n.__lexicalLineBreak=t,n.appendChild(t);}}function Zn(t,e){const n=e.__lexicalDirTextContent,r=e.__lexicalDir;if(n!==Mn||r!==Kn){const n=""===Mn,i=n?Kn:(s=Mn,Ft.test(s)?"rtl":Ot.test(s)?"ltr":null);if(i!==r){const s=e.classList,o=bn.theme;let l=null!==r?o[r]:void 0,c=null!==i?o[i]:void 0;if(void 0!==l){if("string"==typeof l){const t=Kt(l);l=o[r]=t;}s.remove(...l);}if(null===i||n&&"ltr"===i)e.removeAttribute("dir");else {if(void 0!==c){if("string"==typeof c){const t=Kt(c);c=o[i]=t;}void 0!==c&&s.add(...c);}e.dir=i;}if(!Rn){t.getWritable().__dir=i;}}Kn=i,e.__lexicalDirTextContent=Mn,e.__lexicalDir=i;}var s;}function Gn(t,e,n){const r=Mn;var s;Mn="",zn=null,function(t,e,n){const r=An,s=t.__size,i=e.__size;if(An="",1===s&&1===i){const r=t.__first,s=e.__first;if(r===s)er(r,n);else {const t=ir(r),e=qn(s,null,null);n.replaceChild(e,t),Jn(r,null);}const i=On.get(s);null===zn&&Gr(i)&&(zn=i.getFormat());}else {const r=tr(t,Fn),o=tr(e,On);if(0===s)0!==i&&Qn(o,e,0,i-1,n,null);else if(0===i){if(0!==s){const t=null==n.__lexicalLineBreak;Un(r,0,s-1,t?null:n),t&&(n.textContent="");}}else !function(t,e,n,r,s,i){const o=r-1,l=s-1;let c,a,u=(h=i,h.firstChild),f=0,d=0;var h;for(;f<=o&&d<=l;){const t=e[f],r=n[d];if(t===r)u=rr(er(r,i)),f++,d++;else {void 0===c&&(c=new Set(e)),void 0===a&&(a=new Set(n));const s=a.has(t),o=c.has(r);if(s)if(o){const t=Ze(wn,r);t===u?u=rr(er(r,i)):(null!=u?i.insertBefore(t,u):i.appendChild(t),er(r,i)),f++,d++;}else qn(r,i,u),d++;else u=rr(ir(t)),Jn(t,i),f++;}const s=On.get(r);null!==s&&null===zn&&Gr(s)&&(zn=s.getFormat());}const g=f>o,_=d>l;if(g&&!_){const e=n[l+1];Qn(n,t,d,l,i,void 0===e?null:wn.getElementByKey(e));}else _&&!g&&Un(e,f,o,i);}(e,r,o,s,i,n);}Ye(e)&&(An+=Nt);n.__lexicalTextContent=An,An=r+An;}(t,e,n),Zn(e,n),vi(s=e)&&null!=zn&&zn!==s.__textFormat&&!Rn&&s.setTextFormat(zn),Mn=r,zn=null;}function tr(t,e){const n=[];let r=t.__first;for(;null!==r;){const t=e.get(r);void 0===t&&Rt(101),n.push(r),r=t.__next;}return n}function er(t,e){const n=Fn.get(t);let r=On.get(t);void 0!==n&&void 0!==r||Rt(61);const s=Bn||Dn.has(t)||Pn.has(t),i=Ze(wn,t);if(n===r&&!s){if(li(n)){const t=i.__lexicalTextContent;void 0!==t&&(An+=t,Wn+=t);const e=i.__lexicalDirTextContent;void 0!==e&&(Mn+=e);}else {const t=n.getTextContent();Gr(n)&&!n.isDirectionless()&&(Mn+=t),Wn+=t,An+=t;}return i}if(n!==r&&s&&$e(Ln,Nn,En,r,"updated"),r.updateDOM(n,i,bn)){const n=qn(t,null,null);return null===e&&Rt(62),e.replaceChild(n,i),Jn(t,null),n}if(li(n)&&li(r)){const t=r.__indent;t!==n.__indent&&Hn(i,t);const e=r.__format;e!==n.__format&&jn(i,e),s&&(Gn(n,r,i),di(r)||r.isInline()||Yn(n,r,i)),Ye(r)&&(An+=Nt,Wn+=Nt);}else {const e=r.getTextContent();if(ui(r)){const e=r.decorate(wn,bn);null!==e&&nr(t,e);}else Gr(r)&&!r.isDirectionless()&&(Mn+=e);An+=e,Wn+=e;}if(!Rn&&di(r)&&r.__cachedText!==Wn){const t=r.getWritable();t.__cachedText=Wn,r=t;}return i}function nr(t,e){let n=wn._pendingDecorators;const r=wn._decorators;if(null===n){if(r[t]===e)return;n=Ce(wn);}n[t]=e;}function rr(t){let e=t.nextSibling;return null!==e&&e===wn._blockCursorElement&&(e=e.nextSibling),e}function sr(t,e,n,r,s,i){An="",Wn="",Mn="",Bn=r===lt,Kn=null,wn=n,bn=n._config,Nn=n._nodes,En=wn._listeners.mutation,Pn=s,Dn=i,Fn=t._nodeMap,On=e._nodeMap,Rn=e._readOnly,In=new Map(n._keyToDOMMap);const o=new Map;return Ln=o,er("root",null),wn=void 0,Nn=void 0,Pn=void 0,Dn=void 0,Fn=void 0,On=void 0,bn=void 0,In=void 0,Ln=void 0,o}function ir(t){const e=In.get(t);return void 0===e&&Rt(75,t),e}const or=Object.freeze({}),lr=30,cr=[["keydown",function(t,e){if(ar=t.timeStamp,ur=t.key,e.isComposing())return;const{key:n,shiftKey:r,ctrlKey:o,metaKey:l,altKey:c}=t;if(Xe(e,_$2,t))return;if(null==n)return;if(function(t,e,n,r){return ze(t)&&!e&&!r&&!n}(n,o,c,l))Xe(e,p$2,t);else if(function(t,e,n,r,s){return ze(t)&&!r&&!n&&(e||s)}(n,o,r,c,l))Xe(e,y$4,t);else if(function(t,e,n,r){return Me(t)&&!e&&!r&&!n}(n,o,c,l))Xe(e,m$3,t);else if(function(t,e,n,r,s){return Me(t)&&!r&&!n&&(e||s)}(n,o,r,c,l))Xe(e,x$3,t);else if(function(t,e,n){return function(t){return "ArrowUp"===t}(t)&&!e&&!n}(n,o,l))Xe(e,v$3,t);else if(function(t,e,n){return function(t){return "ArrowDown"===t}(t)&&!e&&!n}(n,o,l))Xe(e,T$3,t);else if(function(t,e){return Be(t)&&e}(n,r))pr=!0,Xe(e,C$3,t);else if(function(t){return " "===t}(n))Xe(e,S$4,t);else if(function(t,e){return q$2&&e&&"o"===t.toLowerCase()}(n,o))t.preventDefault(),pr=!0,Xe(e,i,!0);else if(function(t,e){return Be(t)&&!e}(n,r))pr=!1,Xe(e,C$3,t);else if(function(t,e,n,r){return q$2?!e&&!n&&(Re(t)||"h"===t.toLowerCase()&&r):!(r||e||n)&&Re(t)}(n,c,l,o))Re(n)?Xe(e,k$3,t):(t.preventDefault(),Xe(e,s,!0));else if(function(t){return "Escape"===t}(n))Xe(e,b$2,t);else if(function(t,e,n,r,s){return q$2?!(n||r||s)&&(Ke(t)||"d"===t.toLowerCase()&&e):!(e||r||s)&&Ke(t)}(n,o,r,c,l))Ke(n)?Xe(e,w$3,t):(t.preventDefault(),Xe(e,s,!1));else if(function(t,e,n){return Re(t)&&(q$2?e:n)}(n,c,o))t.preventDefault(),Xe(e,u,!0);else if(function(t,e,n){return Ke(t)&&(q$2?e:n)}(n,c,o))t.preventDefault(),Xe(e,u,!1);else if(function(t,e){return q$2&&e&&Re(t)}(n,l))t.preventDefault(),Xe(e,f,!0);else if(function(t,e){return q$2&&e&&Ke(t)}(n,l))t.preventDefault(),Xe(e,f,!1);else if(function(t,e,n,r){return "b"===t.toLowerCase()&&!e&&We(n,r)}(n,c,l,o))t.preventDefault(),Xe(e,d$1,"bold");else if(function(t,e,n,r){return "u"===t.toLowerCase()&&!e&&We(n,r)}(n,c,l,o))t.preventDefault(),Xe(e,d$1,"underline");else if(function(t,e,n,r){return "i"===t.toLowerCase()&&!e&&We(n,r)}(n,c,l,o))t.preventDefault(),Xe(e,d$1,"italic");else if(function(t,e,n,r){return "Tab"===t&&!e&&!n&&!r}(n,c,o,l))Xe(e,N$3,t);else if(function(t,e,n,r){return "z"===t.toLowerCase()&&!e&&We(n,r)}(n,r,l,o))t.preventDefault(),Xe(e,h$2,void 0);else if(function(t,e,n,r){return q$2?"z"===t.toLowerCase()&&n&&e:"y"===t.toLowerCase()&&r||"z"===t.toLowerCase()&&r&&e}(n,r,l,o))t.preventDefault(),Xe(e,g$2,void 0);else {ds(e._editorState._selection)?!function(t,e,n,r){return !e&&"c"===t.toLowerCase()&&(q$2?n:r)}(n,r,l,o)?!function(t,e,n,r){return !e&&"x"===t.toLowerCase()&&(q$2?n:r)}(n,r,l,o)?Je(n,l,o)&&(t.preventDefault(),Xe(e,W$2,t)):(t.preventDefault(),Xe(e,z$2,t)):(t.preventDefault(),Xe(e,M$3,t)):!Q$1&&Je(n,l,o)&&(t.preventDefault(),Xe(e,W$2,t));}(function(t,e,n,r){return t||e||n||r})(o,r,c,l)&&Xe(e,$$2,t);}],["pointerdown",function(t,e){const n=t.target,r=t.pointerType;n instanceof Node&&"touch"!==r&&ii(e,(()=>{ui(Te(n))||(_r=!0);}));}],["compositionstart",function(t,e){ii(e,(()=>{const n=ws();if(us(n)&&!e.isComposing()){const r=n.anchor,s=n.anchor.getNode();ye(r.key),(t.timeStamp<ar+lr||"element"===r.type||!n.isCollapsed()||s.getFormat()!==n.format||Gr(s)&&s.getStyle()!==n.style)&&Xe(e,l,Et);}}));}],["compositionend",function(t,e){Q$1?yr=!0:ii(e,(()=>{Sr(e,t.data);}));}],["input",function(t,e){t.stopPropagation(),ii(e,(()=>{const n=ws(),r=t.data,s=Cr(t);if(null!=r&&us(n)&&xr(n,s,r,t.timeStamp,!1)){yr&&(Sr(e,r),yr=!1);const s=n.anchor.getNode(),i=_n(e._window);if(null===i)return;const o=n.isBackward(),c=o?n.anchor.offset:n.focus.offset,a=o?n.focus.offset:n.anchor.offset;X$2&&!n.isCollapsed()&&Gr(s)&&null!==i.anchorNode&&s.getTextContent().slice(0,c)+r+s.getTextContent().slice(c+a)===Oe(i.anchorNode)||Xe(e,l,r);const u=r.length;Q$1&&u>1&&"insertCompositionText"===t.inputType&&!e.isComposing()&&(n.anchor.offset-=u),Y$1||Z$1||nt||!e.isComposing()||(ar=0,ye(null));}else {Ie(!1,e,null!==r?r:void 0),yr&&(Sr(e,r||void 0),yr=!1);}Vs(),Xt(js());})),dr=null;}],["click",function(t,e){ii(e,(()=>{const n=ws(),s=_n(e._window),i=Ns();if(s)if(us(n)){const e=n.anchor,r=e.getNode();if("element"===e.type&&0===e.offset&&n.isCollapsed()&&!di(r)&&1===ke().getChildrenSize()&&r.getTopLevelElementOrThrow().isEmpty()&&null!==i&&n.is(i))s.removeAllRanges(),n.dirty=!0;else if(3===t.detail&&!n.isCollapsed()){r!==n.focus.getNode()&&(li(r)?r.select(0):r.getParentOrThrow().select(0));}}else if("touch"===t.pointerType){const n=s.anchorNode;if(null!==n){const r=n.nodeType;if(r===rt||r===st){we(bs(i,s,e,t));}}}Xe(e,r,t);}));}],["cut",or],["copy",or],["dragstart",or],["dragover",or],["dragend",or],["paste",or],["focus",or],["blur",or],["drop",or]];X$2&&cr.push(["beforeinput",(t,e)=>function(t,e){const n=t.inputType,r=Cr(t);if("deleteCompositionText"===n||Q$1&&Qe(e))return;if("insertCompositionText"===n)return;ii(e,(()=>{const _=ws();if("deleteContentBackward"===n){if(null===_){const t=Ns();if(!us(t))return;we(t.clone());}if(us(_)){const n=_.anchor.key===_.focus.key;if(p=t.timeStamp,"MediaLast"===ur&&p<ar+lr&&e.isComposing()&&n){if(ye(null),ar=0,setTimeout((()=>{ii(e,(()=>{ye(null);}));}),lr),us(_)){const t=_.anchor.getNode();t.markDirty(),_.format=t.getFormat(),Gr(t)||Rt(142),_.style=t.getStyle();}}else {ye(null),t.preventDefault();const r=_.anchor.getNode().getTextContent(),i=0===_.anchor.offset&&_.focus.offset===r.length;et&&n&&!i||Xe(e,s,!0);}return}}var p;if(!us(_))return;const y=t.data;null!==dr&&Ie(!1,e,dr),_.dirty&&null===dr||!_.isCollapsed()||di(_.anchor.getNode())||null===r||_.applyDOMRange(r),dr=null;const m=_.anchor,x=_.focus,v=m.getNode(),T=x.getNode();if("insertText"!==n&&"insertTranspose"!==n)switch(t.preventDefault(),n){case"insertFromYank":case"insertFromDrop":case"insertReplacementText":Xe(e,l,t);break;case"insertFromComposition":ye(null),Xe(e,l,t);break;case"insertLineBreak":ye(null),Xe(e,i,!1);break;case"insertParagraph":ye(null),pr&&!Z$1?(pr=!1,Xe(e,i,!1)):Xe(e,o,void 0);break;case"insertFromPaste":case"insertFromPasteAsQuotation":Xe(e,c,t);break;case"deleteByComposition":(function(t,e){return t!==e||li(t)||li(e)||!t.isToken()||!e.isToken()})(v,T)&&Xe(e,a,t);break;case"deleteByDrag":case"deleteByCut":Xe(e,a,t);break;case"deleteContent":Xe(e,s,!1);break;case"deleteWordBackward":Xe(e,u,!0);break;case"deleteWordForward":Xe(e,u,!1);break;case"deleteHardLineBackward":case"deleteSoftLineBackward":Xe(e,f,!0);break;case"deleteContentForward":case"deleteHardLineForward":case"deleteSoftLineForward":Xe(e,f,!1);break;case"formatStrikeThrough":Xe(e,d$1,"strikethrough");break;case"formatBold":Xe(e,d$1,"bold");break;case"formatItalic":Xe(e,d$1,"italic");break;case"formatUnderline":Xe(e,d$1,"underline");break;case"historyUndo":Xe(e,h$2,void 0);break;case"historyRedo":Xe(e,g$2,void 0);}else {if("\n"===y)t.preventDefault(),Xe(e,i,!1);else if(y===Nt)t.preventDefault(),Xe(e,o,void 0);else if(null==y&&t.dataTransfer){const e=t.dataTransfer.getData("text/plain");t.preventDefault(),_.insertRawText(e);}else null!=y&&xr(_,r,y,t.timeStamp,!0)?(t.preventDefault(),Xe(e,l,y)):dr=y;fr=t.timeStamp;}}));}(t,e)]);let ar=0,ur=null,fr=0,dr=null;const hr=new WeakMap;let gr=!1,_r=!1,pr=!1,yr=!1,mr=[0,"",0,"root",0];function xr(t,e,n,r,s){const i=t.anchor,o=t.focus,l=i.getNode(),c=js(),a=_n(c._window),u=null!==a?a.anchorNode:null,f=i.key,d=c.getElementByKey(f),h=n.length;return f!==o.key||!Gr(l)||(!s&&(!X$2||fr<r+50)||l.isDirty()&&h<2||Pe(n))&&i.offset!==o.offset&&!l.isComposing()||ae(l)||l.isDirty()&&h>1||(s||!X$2)&&null!==d&&!l.isComposing()&&u!==fe(d)||null!==a&&null!==e&&(!e.collapsed||e.startContainer!==a.anchorNode||e.startOffset!==a.anchorOffset)||l.getFormat()!==t.format||l.getStyle()!==t.style||Ae(t,l)}function vr(t,e){return null!==t&&null!==t.nodeValue&&t.nodeType===st&&0!==e&&e!==t.nodeValue.length}function Tr(t,n,r){const{anchorNode:s,anchorOffset:i,focusNode:o,focusOffset:l}=t;gr&&(gr=!1,vr(s,i)&&vr(o,l))||ii(n,(()=>{if(!r)return void we(null);if(!le$1(n,s,o))return;const c=ws();if(us(c)){const e=c.anchor,r=e.getNode();if(c.isCollapsed()){"Range"===t.type&&t.anchorNode===t.focusNode&&(c.dirty=!0);const s=rn(n).event,i=s?s.timeStamp:performance.now(),[o,l,a,u,f]=mr,d=ke(),h=!1===n.isComposing()&&""===d.getTextContent();if(i<f+200&&e.offset===a&&e.key===u)c.format=o,c.style=l;else if("text"===e.type)Gr(r)||Rt(141),c.format=r.getFormat(),c.style=r.getStyle();else if("element"===e.type&&!h){const t=e.getNode();t instanceof yi&&0===t.getChildrenSize()?c.format=t.getTextFormat():c.format=0,c.style="";}}else {const t=e.key,n=c.focus.key,r=c.getNodes(),s=r.length,o=c.isBackward(),a=o?l:i,u=o?i:l,f=o?n:t,d=o?t:n;let h=xt,g=!1;for(let t=0;t<s;t++){const e=r[t],n=e.getTextContentSize();if(Gr(e)&&0!==n&&!(0===t&&e.__key===f&&a===n||t===s-1&&e.__key===d&&0===u)&&(g=!0,h&=e.getFormat(),0===h))break}c.format=g?h:0;}}Xe(n,e,void 0);}));}function Cr(t){if(!t.getTargetRanges)return null;const e=t.getTargetRanges();return 0===e.length?null:e[0]}function Sr(t,e){const n=t._compositionKey;if(ye(null),null!==n&&null!=e){if(""===e){const e=xe(n),r=fe(t.getElementByKey(n));return void(null!==r&&null!==r.nodeValue&&Gr(e)&&Le(e,r.nodeValue,null,null,!0))}if("\n"===e[e.length-1]){const e=ws();if(us(e)){const n=e.focus;return e.anchor.set(n.key,n.offset,n.type),void Xe(t,C$3,null)}}}Ie(!0,t,e);}function kr(t){let e=t.__lexicalEventHandles;return void 0===e&&(e=[],t.__lexicalEventHandles=e),e}const br=new Map;function wr(t){const e=t.target,n=_n(null==e?null:9===e.nodeType?e.defaultView:e.ownerDocument.defaultView);if(null===n)return;const r=ce(n.anchorNode);if(null===r)return;_r&&(_r=!1,ii(r,(()=>{const e=Ns(),s=n.anchorNode;if(null===s)return;const i=s.nodeType;if(i!==rt&&i!==st)return;we(bs(e,n,r,t));})));const s=De(r),i=s[s.length-1],o=i._key,l=br.get(o),c=l||i;c!==r&&Tr(n,c,!1),Tr(n,r,!0),r!==i?br.set(o,r):l&&br.delete(o);}function Nr(t){t._lexicalHandled=!0;}function Er(t){return !0===t._lexicalHandled}function Pr(t){const e=t.ownerDocument,n=hr.get(e);void 0===n&&Rt(162);const r=n-1;r>=0||Rt(164),hr.set(e,r),0===r&&e.removeEventListener("selectionchange",wr);const s=t.__lexicalEditor;null!=s&&(!function(t){if(null!==t._parentEditor){const e=De(t),n=e[e.length-1]._key;br.get(n)===t&&br.delete(n);}else br.delete(t._key);}(s),t.__lexicalEditor=null);const i=kr(t);for(let t=0;t<i.length;t++)i[t]();t.__lexicalEventHandles=[];}function Dr(t,e,n){Vs();const r=t.__key,s=t.getParent();if(null===s)return;const i=function(t){const e=ws();if(!us(e)||!li(t))return e;const{anchor:n,focus:r}=e,s=n.getNode(),i=r.getNode();return nn(s,t)&&n.set(t.__key,0,"element"),nn(i,t)&&r.set(t.__key,0,"element"),e}(t);let o=!1;if(us(i)&&e){const e=i.anchor,n=i.focus;e.key===r&&(Ds(e,t,s,t.getPreviousSibling(),t.getNextSibling()),o=!0),n.key===r&&(Ds(n,t,s,t.getPreviousSibling(),t.getNextSibling()),o=!0);}else ds(i)&&e&&t.isSelected()&&t.selectPrevious();if(us(i)&&e&&!o){const e=t.getIndexWithinParent();_e(t),Es(i,s,e,-1);}else _e(t);n||ln(s)||s.canBeEmpty()||!s.isEmpty()||Dr(s,e),e&&di(s)&&s.isEmpty()&&s.selectEnd();}class Fr{static getType(){Rt(64,this.name);}static clone(t){Rt(65,this.name);}constructor(t){this.__type=this.constructor.getType(),this.__parent=null,this.__prev=null,this.__next=null,ge(this,t);}getType(){return this.__type}isInline(){Rt(137,this.constructor.name);}isAttached(){let t=this.__key;for(;null!==t;){if("root"===t)return !0;const e=xe(t);if(null===e)break;t=e.__parent;}return !1}isSelected(t){const e=t||ws();if(null==e)return !1;const n=e.getNodes().some((t=>t.__key===this.__key));return (Gr(this)||!us(e)||"element"!==e.anchor.type||"element"!==e.focus.type||e.anchor.key!==e.focus.key||e.anchor.offset!==e.focus.offset)&&n}getKey(){return this.__key}getIndexWithinParent(){const t=this.getParent();if(null===t)return -1;let e=t.getFirstChild(),n=0;for(;null!==e;){if(this.is(e))return n;n++,e=e.getNextSibling();}return -1}getParent(){const t=this.getLatest().__parent;return null===t?null:xe(t)}getParentOrThrow(){const t=this.getParent();return null===t&&Rt(66,this.__key),t}getTopLevelElement(){let t=this;for(;null!==t;){const e=t.getParent();if(ln(e))return li(t)||Rt(138),t;t=e;}return null}getTopLevelElementOrThrow(){const t=this.getTopLevelElement();return null===t&&Rt(67,this.__key),t}getParents(){const t=[];let e=this.getParent();for(;null!==e;)t.push(e),e=e.getParent();return t}getParentKeys(){const t=[];let e=this.getParent();for(;null!==e;)t.push(e.__key),e=e.getParent();return t}getPreviousSibling(){const t=this.getLatest().__prev;return null===t?null:xe(t)}getPreviousSiblings(){const t=[],e=this.getParent();if(null===e)return t;let n=e.getFirstChild();for(;null!==n&&!n.is(this);)t.push(n),n=n.getNextSibling();return t}getNextSibling(){const t=this.getLatest().__next;return null===t?null:xe(t)}getNextSiblings(){const t=[];let e=this.getNextSibling();for(;null!==e;)t.push(e),e=e.getNextSibling();return t}getCommonAncestor(t){const e=this.getParents(),n=t.getParents();li(this)&&e.unshift(this),li(t)&&n.unshift(t);const r=e.length,s=n.length;if(0===r||0===s||e[r-1]!==n[s-1])return null;const i=new Set(n);for(let t=0;t<r;t++){const n=e[t];if(i.has(n))return n}return null}is(t){return null!=t&&this.__key===t.__key}isBefore(t){if(this===t)return !1;if(t.isParentOf(this))return !0;if(this.isParentOf(t))return !1;const e=this.getCommonAncestor(t);let n=0,r=0,s=this;for(;;){const t=s.getParentOrThrow();if(t===e){n=s.getIndexWithinParent();break}s=t;}for(s=t;;){const t=s.getParentOrThrow();if(t===e){r=s.getIndexWithinParent();break}s=t;}return n<r}isParentOf(t){const e=this.__key;if(e===t.__key)return !1;let n=t;for(;null!==n;){if(n.__key===e)return !0;n=n.getParent();}return !1}getNodesBetween(t){const e=this.isBefore(t),n=[],r=new Set;let s=this;for(;null!==s;){const i=s.__key;if(r.has(i)||(r.add(i),n.push(s)),s===t)break;const o=li(s)?e?s.getFirstChild():s.getLastChild():null;if(null!==o){s=o;continue}const l=e?s.getNextSibling():s.getPreviousSibling();if(null!==l){s=l;continue}const c=s.getParentOrThrow();if(r.has(c.__key)||n.push(c),c===t)break;let a=null,u=c;do{if(null===u&&Rt(68),a=e?u.getNextSibling():u.getPreviousSibling(),u=u.getParent(),null===u)break;null!==a||r.has(u.__key)||n.push(u);}while(null===a);s=a;}return e||n.reverse(),n}isDirty(){const t=js()._dirtyLeaves;return null!==t&&t.has(this.__key)}getLatest(){const t=xe(this.__key);return null===t&&Rt(113),t}getWritable(){Vs();const t=Hs(),e=js(),n=t._nodeMap,r=this.__key,s=this.getLatest(),i=s.__parent,o=e._cloneNotNeeded,l=ws();if(null!==l&&l.setCachedNodes(null),o.has(r))return pe(s),s;const c=s.constructor.clone(s);return c.__parent=i,c.__next=s.__next,c.__prev=s.__prev,li(s)&&li(c)?(vi(s)&&vi(c)&&(c.__textFormat=s.__textFormat),c.__first=s.__first,c.__last=s.__last,c.__size=s.__size,c.__indent=s.__indent,c.__format=s.__format,c.__dir=s.__dir):Gr(s)&&Gr(c)&&(c.__format=s.__format,c.__style=s.__style,c.__mode=s.__mode,c.__detail=s.__detail),o.add(r),c.__key=r,pe(c),n.set(r,c),c}getTextContent(){return ""}getTextContentSize(){return this.getTextContent().length}createDOM(t,e){Rt(70);}updateDOM(t,e,n){Rt(71);}exportDOM(t){return {element:this.createDOM(t._config,t)}}exportJSON(){Rt(72);}static importJSON(t){Rt(18,this.name);}static transform(){return null}remove(t){Dr(this,!0,t);}replace(t,e){Vs();let n=ws();null!==n&&(n=n.clone()),un(this,t);const r=this.getLatest(),s=this.__key,i=t.__key,o=t.getWritable(),l=this.getParentOrThrow().getWritable(),c=l.__size;_e(o);const a=r.getPreviousSibling(),u=r.getNextSibling(),f=r.__prev,d=r.__next,h=r.__parent;if(Dr(r,!1,!0),null===a)l.__first=i;else {a.getWritable().__next=i;}if(o.__prev=f,null===u)l.__last=i;else {u.getWritable().__prev=i;}if(o.__next=d,o.__parent=h,l.__size=c,e&&(li(this)&&li(o)||Rt(139),this.getChildren().forEach((t=>{o.append(t);}))),us(n)){we(n);const t=n.anchor,e=n.focus;t.key===s&&ls(t,o),e.key===s&&ls(e,o);}return me()===s&&ye(i),o}insertAfter(t,e=!0){Vs(),un(this,t);const n=this.getWritable(),r=t.getWritable(),s=r.getParent(),i=ws();let o=!1,l=!1;if(null!==s){const e=t.getIndexWithinParent();if(_e(r),us(i)){const t=s.__key,n=i.anchor,r=i.focus;o="element"===n.type&&n.key===t&&n.offset===e+1,l="element"===r.type&&r.key===t&&r.offset===e+1;}}const c=this.getNextSibling(),a=this.getParentOrThrow().getWritable(),u=r.__key,f=n.__next;if(null===c)a.__last=u;else {c.getWritable().__prev=u;}if(a.__size++,n.__next=u,r.__next=f,r.__prev=n.__key,r.__parent=n.__parent,e&&us(i)){const t=this.getIndexWithinParent();Es(i,a,t+1);const e=a.__key;o&&i.anchor.set(e,t+2,"element"),l&&i.focus.set(e,t+2,"element");}return t}insertBefore(t,e=!0){Vs(),un(this,t);const n=this.getWritable(),r=t.getWritable(),s=r.__key;_e(r);const i=this.getPreviousSibling(),o=this.getParentOrThrow().getWritable(),l=n.__prev,c=this.getIndexWithinParent();if(null===i)o.__first=s;else {i.getWritable().__next=s;}o.__size++,n.__prev=s,r.__prev=l,r.__next=n.__key,r.__parent=n.__parent;const a=ws();if(e&&us(a)){Es(a,this.getParentOrThrow(),c);}return t}isParentRequired(){return !1}createParentElementNode(){return xi()}selectStart(){return this.selectPrevious()}selectEnd(){return this.selectNext(0,0)}selectPrevious(t,e){Vs();const n=this.getPreviousSibling(),r=this.getParentOrThrow();if(null===n)return r.select(0,0);if(li(n))return n.select();if(!Gr(n)){const t=n.getIndexWithinParent()+1;return r.select(t,t)}return n.select(t,e)}selectNext(t,e){Vs();const n=this.getNextSibling(),r=this.getParentOrThrow();if(null===n)return r.select();if(li(n))return n.select(0,0);if(!Gr(n)){const t=n.getIndexWithinParent();return r.select(t,t)}return n.select(t,e)}markDirty(){this.getWritable();}}class Or extends Fr{static getType(){return "linebreak"}static clone(t){return new Or(t.__key)}constructor(t){super(t);}getTextContent(){return "\n"}createDOM(){return document.createElement("br")}updateDOM(){return !1}static importDOM(){return {br:t=>function(t){const e=t.parentElement;if(null!==e){const n=e.firstChild;if(n===t||n.nextSibling===t&&Mr(n)){const n=e.lastChild;if(n===t||n.previousSibling===t&&Mr(n))return !0}}return !1}(t)?null:{conversion:Ir,priority:0}}}static importJSON(t){return Lr()}exportJSON(){return {type:"linebreak",version:1}}}function Ir(t){return {node:Lr()}}function Lr(){return an(new Or)}function Ar(t){return t instanceof Or}function Mr(t){return t.nodeType===st&&/^( |\t|\r?\n)+$/.test(t.textContent||"")}function zr(t,e){return 16&e?"code":e&mt?"mark":32&e?"sub":64&e?"sup":null}function Wr(t,e){return 1&e?"strong":2&e?"em":"span"}function Br(t,e,n,r,s){const i=r.classList;let o=Ve(s,"base");void 0!==o&&i.add(...o),o=Ve(s,"underlineStrikethrough");let l=!1;const c=e&gt&&e&ht;void 0!==o&&(n&gt&&n&ht?(l=!0,c||i.add(...o)):c&&i.remove(...o));for(const t in It){const r=It[t];if(o=Ve(s,t),void 0!==o)if(n&r){if(l&&("underline"===t||"strikethrough"===t)){e&r&&i.remove(...o);continue}e&r&&(!c||"underline"!==t)&&"strikethrough"!==t||i.add(...o);}else e&r&&i.remove(...o);}}function Rr(t,e,n){const r=e.firstChild,s=n.isComposing(),i=t+(s?wt:"");if(null==r)e.textContent=i;else {const t=r.nodeValue;if(t!==i)if(s||Q$1){const[e,n,s]=function(t,e){const n=t.length,r=e.length;let s=0,i=0;for(;s<n&&s<r&&t[s]===e[s];)s++;for(;i+s<n&&i+s<r&&t[n-i-1]===e[r-i-1];)i++;return [s,n-s-i,e.slice(s,r-i)]}(t,i);0!==n&&r.deleteData(e,n),r.insertData(e,s);}else r.nodeValue=i;}}function Kr(t,e,n,r,s,i){Rr(s,t,e);const o=i.theme.text;void 0!==o&&Br(0,0,r,t,o);}function Jr(t,e){const n=document.createElement(e);return n.appendChild(t),n}class Ur extends Fr{static getType(){return "text"}static clone(t){return new Ur(t.__text,t.__key)}constructor(t,e){super(e),this.__text=t,this.__format=0,this.__style="",this.__mode=0,this.__detail=0;}getFormat(){return this.getLatest().__format}getDetail(){return this.getLatest().__detail}getMode(){const t=this.getLatest();return Wt[t.__mode]}getStyle(){return this.getLatest().__style}isToken(){return 1===this.getLatest().__mode}isComposing(){return this.__key===me()}isSegmented(){return 2===this.getLatest().__mode}isDirectionless(){return !!(1&this.getLatest().__detail)}isUnmergeable(){return !!(2&this.getLatest().__detail)}hasFormat(t){const e=It[t];return !!(this.getFormat()&e)}isSimpleText(){return "text"===this.__type&&0===this.__mode}getTextContent(){return this.getLatest().__text}getFormatFlags(t,e){return de(this.getLatest().__format,t,e)}canHaveFormat(){return !0}createDOM(t,e){const n=this.__format,r=zr(0,n),s=Wr(0,n),i=null===r?s:r,o=document.createElement(i);let l=o;this.hasFormat("code")&&o.setAttribute("spellcheck","false"),null!==r&&(l=document.createElement(s),o.appendChild(l));Kr(l,this,0,n,this.__text,t);const c=this.__style;return ""!==c&&(o.style.cssText=c),o}updateDOM(t,e,n){const r=this.__text,s=t.__format,i=this.__format,o=zr(0,s),l=zr(0,i),c=Wr(0,s),a=Wr(0,i);if((null===o?c:o)!==(null===l?a:l))return !0;if(o===l&&c!==a){const t=e.firstChild;null==t&&Rt(48);const s=document.createElement(a);return Kr(s,this,0,i,r,n),e.replaceChild(s,t),!1}let u=e;null!==l&&null!==o&&(u=e.firstChild,null==u&&Rt(49)),Rr(r,u,this);const f=n.theme.text;void 0!==f&&s!==i&&Br(0,s,i,u,f);const d=t.__style,h=this.__style;return d!==h&&(e.style.cssText=h),!1}static importDOM(){return {"#text":()=>({conversion:qr,priority:0}),b:()=>({conversion:$r,priority:0}),code:()=>({conversion:Yr,priority:0}),em:()=>({conversion:Yr,priority:0}),i:()=>({conversion:Yr,priority:0}),s:()=>({conversion:Yr,priority:0}),span:()=>({conversion:Vr,priority:0}),strong:()=>({conversion:Yr,priority:0}),sub:()=>({conversion:Yr,priority:0}),sup:()=>({conversion:Yr,priority:0}),u:()=>({conversion:Yr,priority:0})}}static importJSON(t){const e=Zr(t.text);return e.setFormat(t.format),e.setDetail(t.detail),e.setMode(t.mode),e.setStyle(t.style),e}exportDOM(t){let{element:e}=super.exportDOM(t);return null!==e&&mn(e)||Rt(132),e.style.whiteSpace="pre-wrap",this.hasFormat("bold")&&(e=Jr(e,"b")),this.hasFormat("italic")&&(e=Jr(e,"i")),this.hasFormat("strikethrough")&&(e=Jr(e,"s")),this.hasFormat("underline")&&(e=Jr(e,"u")),{element:e}}exportJSON(){return {detail:this.getDetail(),format:this.getFormat(),mode:this.getMode(),style:this.getStyle(),text:this.getTextContent(),type:"text",version:1}}selectionTransform(t,e){}setFormat(t){const e=this.getWritable();return e.__format="string"==typeof t?It[t]:t,e}setDetail(t){const e=this.getWritable();return e.__detail="string"==typeof t?Lt[t]:t,e}setStyle(t){const e=this.getWritable();return e.__style=t,e}toggleFormat(t){const e=de(this.getFormat(),t,null);return this.setFormat(e)}toggleDirectionless(){const t=this.getWritable();return t.__detail^=1,t}toggleUnmergeable(){const t=this.getWritable();return t.__detail^=2,t}setMode(t){const e=zt[t];if(this.__mode===e)return this;const n=this.getWritable();return n.__mode=e,n}setTextContent(t){if(this.__text===t)return this;const e=this.getWritable();return e.__text=t,e}select(t,e){Vs();let n=t,r=e;const s=ws(),i=this.getTextContent(),o=this.__key;if("string"==typeof i){const t=i.length;void 0===n&&(n=t),void 0===r&&(r=t);}else n=0,r=0;if(!us(s))return Ts(o,n,o,r,"text","text");{const t=me();t!==s.anchor.key&&t!==s.focus.key||ye(o),s.setTextNodeRange(this,n,this,r);}return s}selectStart(){return this.select(0,0)}selectEnd(){const t=this.getTextContentSize();return this.select(t,t)}spliceText(t,e,n,r){const s=this.getWritable(),i=s.__text,o=n.length;let l=t;l<0&&(l=o+l,l<0&&(l=0));const c=ws();if(r&&us(c)){const e=t+o;c.setTextNodeRange(s,e,s,e);}const a=i.slice(0,l)+n+i.slice(l+e);return s.__text=a,s}canInsertTextBefore(){return !0}canInsertTextAfter(){return !0}splitText(...t){Vs();const e=this.getLatest(),n=e.getTextContent(),r=e.__key,s=me(),i=new Set(t),o=[],l=n.length;let c="";for(let t=0;t<l;t++)""!==c&&i.has(t)&&(o.push(c),c=""),c+=n[t];""!==c&&o.push(c);const a=o.length;if(0===a)return [];if(o[0]===n)return [e];const u=o[0],f=e.getParentOrThrow();let d;const h=e.getFormat(),g=e.getStyle(),_=e.__detail;let p=!1;e.isSegmented()?(d=Zr(u),d.__format=h,d.__style=g,d.__detail=_,p=!0):(d=e.getWritable(),d.__text=u);const y=ws(),m=[d];let x=u.length;for(let t=1;t<a;t++){const e=o[t],n=e.length,i=Zr(e).getWritable();i.__format=h,i.__style=g,i.__detail=_;const l=i.__key,c=x+n;if(us(y)){const t=y.anchor,e=y.focus;t.key===r&&"text"===t.type&&t.offset>x&&t.offset<=c&&(t.key=l,t.offset-=x,y.dirty=!0),e.key===r&&"text"===e.type&&e.offset>x&&e.offset<=c&&(e.key=l,e.offset-=x,y.dirty=!0);}s===r&&ye(l),x=c,m.push(i);}!function(t){const e=t.getPreviousSibling(),n=t.getNextSibling();null!==e&&pe(e),null!==n&&pe(n);}(this);const v=f.getWritable(),T=this.getIndexWithinParent();return p?(v.splice(T,0,m),this.remove()):v.splice(T,1,m),us(y)&&Es(y,f,T,a-1),m}mergeWithSibling(t){const e=t===this.getPreviousSibling();e||t===this.getNextSibling()||Rt(50);const n=this.__key,r=t.__key,s=this.__text,i=s.length;me()===r&&ye(n);const o=ws();if(us(o)){const s=o.anchor,l=o.focus;null!==s&&s.key===r&&(Fs(s,e,n,t,i),o.dirty=!0),null!==l&&l.key===r&&(Fs(l,e,n,t,i),o.dirty=!0);}const l=t.__text,c=e?l+s:s+l;this.setTextContent(c);const a=this.getWritable();return t.remove(),a}isTextEntity(){return !1}}function Vr(t){return {forChild:ts(t.style),node:null}}function $r(t){const e=t,n="normal"===e.style.fontWeight;return {forChild:ts(e.style,n?void 0:"bold"),node:null}}const Hr=new WeakMap;function jr(t){return "PRE"===t.nodeName||t.nodeType===rt&&void 0!==t.style&&void 0!==t.style.whiteSpace&&t.style.whiteSpace.startsWith("pre")}function qr(t){const e=t;null===t.parentElement&&Rt(129);let n=e.textContent||"";if(null!==function(t){let e,n=t.parentNode;const r=[t];for(;null!==n&&void 0===(e=Hr.get(n))&&!jr(n);)r.push(n),n=n.parentNode;const s=void 0===e?n:e;for(let t=0;t<r.length;t++)Hr.set(r[t],s);return s}(e)){const t=n.split(/(\r?\n|\t)/),e=[],r=t.length;for(let n=0;n<r;n++){const r=t[n];"\n"===r||"\r\n"===r?e.push(Lr()):"\t"===r?e.push(ns()):""!==r&&e.push(Zr(r));}return {node:e}}if(n=n.replace(/\r/g,"").replace(/[ \t\n]+/g," "),""===n)return {node:null};if(" "===n[0]){let t=e,r=!0;for(;null!==t&&null!==(t=Qr(t,!1));){const e=t.textContent||"";if(e.length>0){/[ \t\n]$/.test(e)&&(n=n.slice(1)),r=!1;break}}r&&(n=n.slice(1));}if(" "===n[n.length-1]){let t=e,r=!0;for(;null!==t&&null!==(t=Qr(t,!0));){if((t.textContent||"").replace(/^( |\t|\r?\n)+/,"").length>0){r=!1;break}}r&&(n=n.slice(0,n.length-1));}return ""===n?{node:null}:{node:Zr(n)}}function Qr(t,e){let n=t;for(;;){let t;for(;null===(t=e?n.nextSibling:n.previousSibling);){const t=n.parentElement;if(null===t)return null;n=t;}if(n=t,n.nodeType===rt){const t=n.style.display;if(""===t&&!xn(n)||""!==t&&!t.startsWith("inline"))return null}let r=n;for(;null!==(r=e?n.firstChild:n.lastChild);)n=r;if(n.nodeType===st)return n;if("BR"===n.nodeName)return null}}const Xr={code:"code",em:"italic",i:"italic",s:"strikethrough",strong:"bold",sub:"subscript",sup:"superscript",u:"underline"};function Yr(t){const e=Xr[t.nodeName.toLowerCase()];return void 0===e?{node:null}:{forChild:ts(t.style,e),node:null}}function Zr(t=""){return an(new Ur(t))}function Gr(t){return t instanceof Ur}function ts(t,e){const n=t.fontWeight,r=t.textDecoration.split(" "),s="700"===n||"bold"===n,i=r.includes("line-through"),o="italic"===t.fontStyle,l=r.includes("underline"),c=t.verticalAlign;return t=>Gr(t)?(s&&!t.hasFormat("bold")&&t.toggleFormat("bold"),i&&!t.hasFormat("strikethrough")&&t.toggleFormat("strikethrough"),o&&!t.hasFormat("italic")&&t.toggleFormat("italic"),l&&!t.hasFormat("underline")&&t.toggleFormat("underline"),"sub"!==c||t.hasFormat("subscript")||t.toggleFormat("subscript"),"super"!==c||t.hasFormat("superscript")||t.toggleFormat("superscript"),e&&!t.hasFormat(e)&&t.toggleFormat(e),t):t}class es extends Ur{static getType(){return "tab"}static clone(t){const e=new es(t.__key);return e.__text=t.__text,e.__format=t.__format,e.__style=t.__style,e}constructor(t){super("\t",t),this.__detail=2;}static importDOM(){return null}static importJSON(t){const e=ns();return e.setFormat(t.format),e.setStyle(t.style),e}exportJSON(){return {...super.exportJSON(),type:"tab",version:1}}setTextContent(t){Rt(126);}setDetail(t){Rt(127);}setMode(t){Rt(128);}canInsertTextBefore(){return !1}canInsertTextAfter(){return !1}}function ns(){return an(new es)}function rs(t){return t instanceof es}class ss{constructor(t,e,n){this._selection=null,this.key=t,this.offset=e,this.type=n;}is(t){return this.key===t.key&&this.offset===t.offset&&this.type===t.type}isBefore(t){let e=this.getNode(),n=t.getNode();const r=this.offset,s=t.offset;if(li(e)){const t=e.getDescendantByIndex(r);e=null!=t?t:e;}if(li(n)){const t=n.getDescendantByIndex(s);n=null!=t?t:n;}return e===n?r<s:e.isBefore(n)}getNode(){const t=xe(this.key);return null===t&&Rt(20),t}set(t,e,n){const r=this._selection,s=this.key;this.key=t,this.offset=e,this.type=n,Us()||(me()===s&&ye(t),null!==r&&(r.setCachedNodes(null),r.dirty=!0));}}function is(t,e,n){return new ss(t,e,n)}function os(t,e){let n=e.__key,r=t.offset,s="element";if(Gr(e)){s="text";const t=e.getTextContentSize();r>t&&(r=t);}else if(!li(e)){const t=e.getNextSibling();if(Gr(t))n=t.__key,r=0,s="text";else {const t=e.getParent();t&&(n=t.__key,r=e.getIndexWithinParent()+1);}}t.set(n,r,s);}function ls(t,e){if(li(e)){const n=e.getLastDescendant();li(n)||Gr(n)?os(t,n):os(t,e);}else os(t,e);}function cs(t,e,n,r){t.key=e,t.offset=n,t.type=r;}class as{constructor(t){this._cachedNodes=null,this._nodes=t,this.dirty=!1;}getCachedNodes(){return this._cachedNodes}setCachedNodes(t){this._cachedNodes=t;}is(t){if(!ds(t))return !1;const e=this._nodes,n=t._nodes;return e.size===n.size&&Array.from(e).every((t=>n.has(t)))}isCollapsed(){return !1}isBackward(){return !1}getStartEndPoints(){return null}add(t){this.dirty=!0,this._nodes.add(t),this._cachedNodes=null;}delete(t){this.dirty=!0,this._nodes.delete(t),this._cachedNodes=null;}clear(){this.dirty=!0,this._nodes.clear(),this._cachedNodes=null;}has(t){return this._nodes.has(t)}clone(){return new as(new Set(this._nodes))}extract(){return this.getNodes()}insertRawText(t){}insertText(){}insertNodes(t){const e=this.getNodes(),n=e.length,r=e[n-1];let s;if(Gr(r))s=r.select();else {const t=r.getIndexWithinParent()+1;s=r.getParentOrThrow().select(t,t);}s.insertNodes(t);for(let t=0;t<n;t++)e[t].remove();}getNodes(){const t=this._cachedNodes;if(null!==t)return t;const e=this._nodes,n=[];for(const t of e){const e=xe(t);null!==e&&n.push(e);}return Us()||(this._cachedNodes=n),n}getTextContent(){const t=this.getNodes();let e="";for(let n=0;n<t.length;n++)e+=t[n].getTextContent();return e}}function us(t){return t instanceof fs}class fs{constructor(t,e,n,r){this.anchor=t,this.focus=e,t._selection=this,e._selection=this,this._cachedNodes=null,this.format=n,this.style=r,this.dirty=!1;}getCachedNodes(){return this._cachedNodes}setCachedNodes(t){this._cachedNodes=t;}is(t){return !!us(t)&&(this.anchor.is(t.anchor)&&this.focus.is(t.focus)&&this.format===t.format&&this.style===t.style)}isCollapsed(){return this.anchor.is(this.focus)}getNodes(){const t=this._cachedNodes;if(null!==t)return t;const e=this.anchor,n=this.focus,r=e.isBefore(n),s=r?e:n,i=r?n:e;let o=s.getNode(),l=i.getNode();const c=s.offset,a=i.offset;if(li(o)){const t=o.getDescendantByIndex(c);o=null!=t?t:o;}if(li(l)){let t=l.getDescendantByIndex(a);null!==t&&t!==o&&l.getChildAtIndex(a)===t&&(t=t.getPreviousSibling()),l=null!=t?t:l;}let u;return u=o.is(l)?li(o)&&o.getChildrenSize()>0?[]:[o]:o.getNodesBetween(l),Us()||(this._cachedNodes=u),u}setTextNodeRange(t,e,n,r){cs(this.anchor,t.__key,e,"text"),cs(this.focus,n.__key,r,"text"),this._cachedNodes=null,this.dirty=!0;}getTextContent(){const t=this.getNodes();if(0===t.length)return "";const e=t[0],n=t[t.length-1],r=this.anchor,s=this.focus,i=r.isBefore(s),[o,l]=gs(this);let c="",a=!0;for(let u=0;u<t.length;u++){const f=t[u];if(li(f)&&!f.isInline())a||(c+="\n"),a=!f.isEmpty();else if(a=!1,Gr(f)){let t=f.getTextContent();f===e?f===n?"element"===r.type&&"element"===s.type&&s.offset!==r.offset||(t=o<l?t.slice(o,l):t.slice(l,o)):t=i?t.slice(o):t.slice(l):f===n&&(t=i?t.slice(0,l):t.slice(0,o)),c+=t;}else !ui(f)&&!Ar(f)||f===n&&this.isCollapsed()||(c+=f.getTextContent());}return c}applyDOMRange(t){const e=js(),n=e.getEditorState()._selection,r=xs(t.startContainer,t.startOffset,t.endContainer,t.endOffset,e,n);if(null===r)return;const[s,i]=r;cs(this.anchor,s.key,s.offset,s.type),cs(this.focus,i.key,i.offset,i.type),this._cachedNodes=null;}clone(){const t=this.anchor,e=this.focus;return new fs(is(t.key,t.offset,t.type),is(e.key,e.offset,e.type),this.format,this.style)}toggleFormat(t){this.format=de(this.format,t,null),this.dirty=!0;}setStyle(t){this.style=t,this.dirty=!0;}hasFormat(t){const e=It[t];return !!(this.format&e)}insertRawText(t){const e=t.split(/(\r?\n|\t)/),n=[],r=e.length;for(let t=0;t<r;t++){const r=e[t];"\n"===r||"\r\n"===r?n.push(Lr()):"\t"===r?n.push(ns()):n.push(Zr(r));}this.insertNodes(n);}insertText(t){const e=this.anchor,n=this.focus,r=this.format,s=this.style;let i=e,o=n;!this.isCollapsed()&&n.isBefore(e)&&(i=n,o=e),"element"===i.type&&function(t,e,n,r){const s=t.getNode(),i=s.getChildAtIndex(t.offset),o=Zr(),l=di(s)?xi().append(o):o;o.setFormat(n),o.setStyle(r),null===i?s.append(l):i.insertBefore(l),t.is(e)&&e.set(o.__key,0,"text"),t.set(o.__key,0,"text");}(i,o,r,s);const l=i.offset;let c=o.offset;const a=this.getNodes(),u=a.length;let f=a[0];Gr(f)||Rt(26);const d=f.getTextContent().length,h=f.getParentOrThrow();let g=a[u-1];if(1===u&&"element"===o.type&&(c=d,o.set(i.key,c,"text")),this.isCollapsed()&&l===d&&(f.isSegmented()||f.isToken()||!f.canInsertTextAfter()||!h.canInsertTextAfter()&&null===f.getNextSibling())){let e=f.getNextSibling();if(Gr(e)&&e.canInsertTextBefore()&&!ae(e)||(e=Zr(),e.setFormat(r),e.setStyle(s),h.canInsertTextAfter()?f.insertAfter(e):h.insertAfter(e)),e.select(0,0),f=e,""!==t)return void this.insertText(t)}else if(this.isCollapsed()&&0===l&&(f.isSegmented()||f.isToken()||!f.canInsertTextBefore()||!h.canInsertTextBefore()&&null===f.getPreviousSibling())){let e=f.getPreviousSibling();if(Gr(e)&&!ae(e)||(e=Zr(),e.setFormat(r),h.canInsertTextBefore()?f.insertBefore(e):h.insertBefore(e)),e.select(),f=e,""!==t)return void this.insertText(t)}else if(f.isSegmented()&&l!==d){const t=Zr(f.getTextContent());t.setFormat(r),f.replace(t),f=t;}else if(!this.isCollapsed()&&""!==t){const e=g.getParent();if(!h.canInsertTextBefore()||!h.canInsertTextAfter()||li(e)&&(!e.canInsertTextBefore()||!e.canInsertTextAfter()))return this.insertText(""),ms(this.anchor,this.focus,null),void this.insertText(t)}if(1===u){if(f.isToken()){const e=Zr(t);return e.select(),void f.replace(e)}const e=f.getFormat(),n=f.getStyle();if(l!==c||e===r&&n===s){if(rs(f)){const e=Zr(t);return e.setFormat(r),e.setStyle(s),e.select(),void f.replace(e)}}else {if(""!==f.getTextContent()){const e=Zr(t);if(e.setFormat(r),e.setStyle(s),e.select(),0===l)f.insertBefore(e,!1);else {const[t]=f.splitText(l);t.insertAfter(e,!1);}return void(e.isComposing()&&"text"===this.anchor.type&&(this.anchor.offset-=t.length))}f.setFormat(r),f.setStyle(s);}const i=c-l;f=f.spliceText(l,i,t,!0),""===f.getTextContent()?f.remove():"text"===this.anchor.type&&(f.isComposing()?this.anchor.offset-=t.length:(this.format=e,this.style=n));}else {const e=new Set([...f.getParentKeys(),...g.getParentKeys()]),n=li(f)?f:f.getParentOrThrow();let r=li(g)?g:g.getParentOrThrow(),s=g;if(!n.is(r)&&r.isInline())do{s=r,r=r.getParentOrThrow();}while(r.isInline());if("text"===o.type&&(0!==c||""===g.getTextContent())||"element"===o.type&&g.getIndexWithinParent()<c)if(Gr(g)&&!g.isToken()&&c!==g.getTextContentSize()){if(g.isSegmented()){const t=Zr(g.getTextContent());g.replace(t),g=t;}di(o.getNode())||"text"!==o.type||(g=g.spliceText(0,c,"")),e.add(g.__key);}else {const t=g.getParentOrThrow();t.canBeEmpty()||1!==t.getChildrenSize()?g.remove():t.remove();}else e.add(g.__key);const i=r.getChildren(),h=new Set(a),_=n.is(r),p=n.isInline()&&null===f.getNextSibling()?n:f;for(let t=i.length-1;t>=0;t--){const e=i[t];if(e.is(f)||li(e)&&e.isParentOf(f))break;e.isAttached()&&(!h.has(e)||e.is(s)?_||p.insertAfter(e,!1):e.remove());}if(!_){let t=r,n=null;for(;null!==t;){const r=t.getChildren(),s=r.length;(0===s||r[s-1].is(n))&&(e.delete(t.__key),n=t),t=t.getParent();}}if(f.isToken())if(l===d)f.select();else {const e=Zr(t);e.select(),f.replace(e);}else f=f.spliceText(l,d-l,t,!0),""===f.getTextContent()?f.remove():f.isComposing()&&"text"===this.anchor.type&&(this.anchor.offset-=t.length);for(let t=1;t<u;t++){const n=a[t],r=n.__key;e.has(r)||n.remove();}}}removeText(){this.insertText("");}formatText(t){if(this.isCollapsed())return this.toggleFormat(t),void ye(null);const e=this.getNodes(),n=[];for(const t of e)Gr(t)&&n.push(t);const r=n.length;if(0===r)return this.toggleFormat(t),void ye(null);const s=this.anchor,i=this.focus,o=this.isBackward(),l=o?i:s,c=o?s:i;let a=0,u=n[0],f="element"===l.type?0:l.offset;if("text"===l.type&&f===u.getTextContentSize()&&(a=1,u=n[1],f=0),null==u)return;const d=u.getFormatFlags(t,null),h=r-1;let g=n[h];const _="text"===c.type?c.offset:g.getTextContentSize();if(u.is(g)){if(f===_)return;if(ae(u)||0===f&&_===u.getTextContentSize())u.setFormat(d);else {const t=u.splitText(f,_),e=0===f?t[0]:t[1];e.setFormat(d),"text"===l.type&&l.set(e.__key,0,"text"),"text"===c.type&&c.set(e.__key,_-f,"text");}return void(this.format=d)}0===f||ae(u)||([,u]=u.splitText(f),f=0),u.setFormat(d);const p=g.getFormatFlags(t,d);_>0&&(_===g.getTextContentSize()||ae(g)||([g]=g.splitText(_)),g.setFormat(p));for(let e=a+1;e<h;e++){const r=n[e],s=r.getFormatFlags(t,p);r.setFormat(s);}"text"===l.type&&l.set(u.__key,f,"text"),"text"===c.type&&c.set(g.__key,_,"text"),this.format=d|p;}insertNodes(t){if(0===t.length)return;if("root"===this.anchor.key){this.insertParagraph();const e=ws();return us(e)||Rt(134),e.insertNodes(t)}const e=Cn((this.isBackward()?this.focus:this.anchor).getNode(),Tn),n=t[t.length-1];if("__language"in e&&li(e)){if("__language"in t[0])this.insertText(t[0].getTextContent());else {const r=As(this);e.splice(r,0,t),n.selectEnd();}return}if(!t.some((t=>(li(t)||ui(t))&&!t.isInline()))){li(e)||Rt(135);const r=As(this);return e.splice(r,0,t),void n.selectEnd()}const r=function(t){const e=xi();let n=null;for(let r=0;r<t.length;r++){const s=t[r],i=Ar(s);if(i||ui(s)&&s.isInline()||li(s)&&s.isInline()||Gr(s)||s.isParentRequired()){if(null===n&&(n=s.createParentElementNode(),e.append(n),i))continue;null!==n&&n.append(s);}else e.append(s),n=null;}return e}(t),s=r.getLastDescendant(),i=r.getChildren(),o=t=>"__value"in t&&"__checked"in t,l=!li(e)||!e.isEmpty()?this.insertParagraph():null,c=i[i.length-1];let a=i[0];var u;li(u=a)&&Tn(u)&&!u.isEmpty()&&li(e)&&(!e.isEmpty()||o(e))&&(li(e)||Rt(135),e.append(...a.getChildren()),a=i[1]),a&&function(t,e,n){const r=e.getParentOrThrow().getLastChild();let s=e;const i=[e];for(;s!==r;)s.getNextSibling()||Rt(140),s=s.getNextSibling(),i.push(s);let o=t;for(const t of i)o=o.insertAfter(t);}(e,a);const f=Cn(s,Tn);l&&li(f)&&(o(l)||Tn(c))&&(f.append(...l.getChildren()),l.remove()),li(e)&&e.isEmpty()&&e.remove(),s.selectEnd();const d=li(e)?e.getLastChild():null;Ar(d)&&f!==e&&d.remove();}insertParagraph(){if("root"===this.anchor.key){const t=xi();return ke().splice(this.anchor.offset,0,[t]),t.select(),t}const t=As(this),e=Cn(this.anchor.getNode(),Tn);li(e)||Rt(136);const n=e.getChildAtIndex(t),r=n?[n,...n.getNextSiblings()]:[],s=e.insertNewAfter(this,!1);return s?(s.append(...r),s.selectStart(),s):null}insertLineBreak(t){const e=Lr();if(this.insertNodes([e]),t){const t=e.getParentOrThrow(),n=e.getIndexWithinParent();t.select(n,n);}}extract(){const t=this.getNodes(),e=t.length,n=e-1,r=this.anchor,s=this.focus;let i=t[0],o=t[n];const[l,c]=gs(this);if(0===e)return [];if(1===e){if(Gr(i)&&!this.isCollapsed()){const t=l>c?c:l,e=l>c?l:c,n=i.splitText(t,e),r=0===t?n[0]:n[1];return null!=r?[r]:[]}return [i]}const a=r.isBefore(s);if(Gr(i)){const e=a?l:c;e===i.getTextContentSize()?t.shift():0!==e&&([,i]=i.splitText(e),t[0]=i);}if(Gr(o)){const e=o.getTextContent().length,r=a?c:l;0===r?t.pop():r!==e&&([o]=o.splitText(r),t[n]=o);}return t}modify(t,e,n){const r=this.focus,s=this.anchor,i="move"===t,o=qe(r,e);if(ui(o)&&!o.isIsolated()){if(i&&o.isKeyboardSelectable()){const t=Ss();return t.add(o.__key),void we(t)}const t=e?o.getPreviousSibling():o.getNextSibling();if(Gr(t)){const n=t.__key,o=e?t.getTextContent().length:0;return r.set(n,o,"text"),void(i&&s.set(n,o,"text"))}{const n=o.getParentOrThrow();let l,c;return li(t)?(c=t.__key,l=e?t.getChildrenSize():0):(l=o.getIndexWithinParent(),c=n.__key,e||l++),r.set(c,l,"element"),void(i&&s.set(c,l,"element"))}}const l=js(),c=_n(l._window);if(!c)return;const a=l._blockCursorElement,u=l._rootElement;if(null===u||null===a||!li(o)||o.isInline()||o.canBeEmpty()||hn(a,l,u),function(t,e,n,r){t.modify(e,n,r);}(c,t,e?"backward":"forward",n),c.rangeCount>0){const t=c.getRangeAt(0),n=this.anchor.getNode(),r=di(n)?n:on(n);if(this.applyDOMRange(t),this.dirty=!0,!i){const n=this.getNodes(),s=[];let i=!1;for(let t=0;t<n.length;t++){const e=n[t];nn(e,r)?s.push(e):i=!0;}if(i&&s.length>0)if(e){const t=s[0];li(t)?t.selectStart():t.getParentOrThrow().selectStart();}else {const t=s[s.length-1];li(t)?t.selectEnd():t.getParentOrThrow().selectEnd();}c.anchorNode===t.startContainer&&c.anchorOffset===t.startOffset||function(t){const e=t.focus,n=t.anchor,r=n.key,s=n.offset,i=n.type;cs(n,e.key,e.offset,e.type),cs(e,r,s,i),t._cachedNodes=null;}(this);}}}forwardDeletion(t,e,n){if(!n&&("element"===t.type&&li(e)&&t.offset===e.getChildrenSize()||"text"===t.type&&t.offset===e.getTextContentSize())){const t=e.getParent(),n=e.getNextSibling()||(null===t?null:t.getNextSibling());if(li(n)&&n.isShadowRoot())return !0}return !1}deleteCharacter(t){const n=this.isCollapsed();if(this.isCollapsed()){const n=this.anchor;let r=n.getNode();if(this.forwardDeletion(n,r,t))return;const s=this.focus,i=qe(s,t);if(ui(i)&&!i.isIsolated()){if(i.isKeyboardSelectable()&&li(r)&&0===r.getChildrenSize()){r.remove();const t=Ss();t.add(i.__key),we(t);}else {i.remove();js().dispatchCommand(e,void 0);}return}if(!t&&li(i)&&li(r)&&r.isEmpty())return r.remove(),void i.selectStart();if(this.modify("extend",t,"character"),this.isCollapsed()){if(t&&0===n.offset){if(("element"===n.type?n.getNode():n.getNode().getParentOrThrow()).collapseAtStart(this))return}}else {const e="text"===s.type?s.getNode():null;if(r="text"===n.type?n.getNode():null,null!==e&&e.isSegmented()){const n=s.offset,i=e.getTextContentSize();if(e.is(r)||t&&n!==i||!t&&0!==n)return void _s(e,t,n)}else if(null!==r&&r.isSegmented()){const s=n.offset,i=r.getTextContentSize();if(r.is(e)||t&&0!==s||!t&&s!==i)return void _s(r,t,s)}!function(t,e){const n=t.anchor,r=t.focus,s=n.getNode(),i=r.getNode();if(s===i&&"text"===n.type&&"text"===r.type){const t=n.offset,i=r.offset,o=t<i,l=o?t:i,c=o?i:t,a=c-1;if(l!==a){Pe(s.getTextContent().slice(l,c))||(e?r.offset=a:n.offset=a);}}}(this,t);}}if(this.removeText(),t&&!n&&this.isCollapsed()&&"element"===this.anchor.type&&0===this.anchor.offset){const t=this.anchor.getNode();t.isEmpty()&&di(t.getParent())&&0===t.getIndexWithinParent()&&t.collapseAtStart(this);}}deleteLine(t){if(this.isCollapsed()){const e="element"===this.anchor.type;e&&this.insertText(" "),this.modify("extend",t,"lineboundary");if(0===(t?this.focus:this.anchor).offset&&this.modify("extend",t,"character"),e){const e=t?this.anchor:this.focus;e.set(e.key,e.offset+1,e.type);}}this.removeText();}deleteWord(t){if(this.isCollapsed()){const e=this.anchor,n=e.getNode();if(this.forwardDeletion(e,n,t))return;this.modify("extend",t,"word");}this.removeText();}isBackward(){return this.focus.isBefore(this.anchor)}getStartEndPoints(){return [this.anchor,this.focus]}}function ds(t){return t instanceof as}function hs(t){const e=t.offset;if("text"===t.type)return e;const n=t.getNode();return e===n.getChildrenSize()?n.getTextContent().length:0}function gs(t){const e=t.getStartEndPoints();if(null===e)return [0,0];const[n,r]=e;return "element"===n.type&&"element"===r.type&&n.key===r.key&&n.offset===r.offset?[0,0]:[hs(n),hs(r)]}function _s(t,e,n){const r=t,s=r.getTextContent().split(/(?=\s)/g),i=s.length;let o=0,l=0;for(let t=0;t<i;t++){const r=t===i-1;if(l=o,o+=s[t].length,e&&o===n||o>n||r){s.splice(t,1),r&&(l=void 0);break}}const c=s.join("").trim();""===c?r.remove():(r.setTextContent(c),r.select(l,l));}function ps(t,e,n,r){let s,i=e;if(t.nodeType===rt){let o=!1;const l=t.childNodes,c=l.length,a=r._blockCursorElement;i===c&&(o=!0,i=c-1);let u=l[i],f=!1;if(u===a)u=l[i+1],f=!0;else if(null!==a){const n=a.parentNode;if(t===n){e>Array.prototype.indexOf.call(n.children,a)&&i--;}}if(s=Ne(u),Gr(s))i=Ee(s,o);else {let r=Ne(t);if(null===r)return null;if(li(r)){i=Math.min(r.getChildrenSize(),i);let t=r.getChildAtIndex(i);if(li(t)&&function(t,e,n){const r=t.getParent();return null===n||null===r||!r.canBeEmpty()||r!==n.getNode()}(t,0,n)){const e=o?t.getLastDescendant():t.getFirstDescendant();null===e?r=t:(t=e,r=li(t)?t:t.getParentOrThrow()),i=0;}Gr(t)?(s=t,r=null,i=Ee(t,o)):t!==r&&o&&!f&&i++;}else {const n=r.getIndexWithinParent();i=0===e&&ui(r)&&Ne(t)===r?n:n+1,r=r.getParentOrThrow();}if(li(r))return is(r.__key,i,"element")}}else s=Ne(t);return Gr(s)?is(s.__key,i,"text"):null}function ys(t,e,n){const r=t.offset,s=t.getNode();if(0===r){const r=s.getPreviousSibling(),i=s.getParent();if(e){if((n||!e)&&null===r&&li(i)&&i.isInline()){const e=i.getPreviousSibling();Gr(e)&&(t.key=e.__key,t.offset=e.getTextContent().length);}}else li(r)&&!n&&r.isInline()?(t.key=r.__key,t.offset=r.getChildrenSize(),t.type="element"):Gr(r)&&(t.key=r.__key,t.offset=r.getTextContent().length);}else if(r===s.getTextContent().length){const r=s.getNextSibling(),i=s.getParent();if(e&&li(r)&&r.isInline())t.key=r.__key,t.offset=0,t.type="element";else if((n||e)&&null===r&&li(i)&&i.isInline()&&!i.canInsertTextAfter()){const e=i.getNextSibling();Gr(e)&&(t.key=e.__key,t.offset=0);}}}function ms(t,e,n){if("text"===t.type&&"text"===e.type){const r=t.isBefore(e),s=t.is(e);ys(t,r,s),ys(e,!r,s),s&&(e.key=t.key,e.offset=t.offset,e.type=t.type);const i=js();if(i.isComposing()&&i._compositionKey!==t.key&&us(n)){const r=n.anchor,s=n.focus;cs(t,r.key,r.offset,r.type),cs(e,s.key,s.offset,s.type);}}}function xs(t,e,n,r,s,i){if(null===t||null===n||!le$1(s,t,n))return null;const o=ps(t,e,us(i)?i.anchor:null,s);if(null===o)return null;const l=ps(n,r,us(i)?i.focus:null,s);if(null===l)return null;if("element"===o.type&&"element"===l.type){const e=Ne(t),r=Ne(n);if(ui(e)&&ui(r))return null}return ms(o,l,i),[o,l]}function vs(t){return li(t)&&!t.isInline()}function Ts(t,e,n,r,s,i){const o=Hs(),l=new fs(is(t,e,s),is(n,r,i),0,"");return l.dirty=!0,o._selection=l,l}function Cs(){const t=is("root",0,"element"),e=is("root",0,"element");return new fs(t,e,0,"")}function Ss(){return new as(new Set)}function ks(t,e){return bs(null,t,e,null)}function bs(t,e,n,r){const s=n._window;if(null===s)return null;const i=r||s.event,o=i?i.type:void 0,l="selectionchange"===o,c=!Ut&&(l||"beforeinput"===o||"compositionstart"===o||"compositionend"===o||"click"===o&&i&&3===i.detail||"drop"===o||void 0===o);let a,u,f,d;if(us(t)&&!c)return t.clone();if(null===e)return null;if(a=e.anchorNode,u=e.focusNode,f=e.anchorOffset,d=e.focusOffset,l&&us(t)&&!le$1(n,a,u))return t.clone();const h=xs(a,f,u,d,n,t);if(null===h)return null;const[g,_]=h;return new fs(g,_,us(t)?t.format:0,us(t)?t.style:"")}function ws(){return Hs()._selection}function Ns(){return js()._editorState._selection}function Es(t,e,n,r=1){const s=t.anchor,i=t.focus,o=s.getNode(),l=i.getNode();if(!e.is(o)&&!e.is(l))return;const c=e.__key;if(t.isCollapsed()){const e=s.offset;if(n<=e&&r>0||n<e&&r<0){const n=Math.max(0,e+r);s.set(c,n,"element"),i.set(c,n,"element"),Ps(t);}}else {const o=t.isBackward(),l=o?i:s,a=l.getNode(),u=o?s:i,f=u.getNode();if(e.is(a)){const t=l.offset;(n<=t&&r>0||n<t&&r<0)&&l.set(c,Math.max(0,t+r),"element");}if(e.is(f)){const t=u.offset;(n<=t&&r>0||n<t&&r<0)&&u.set(c,Math.max(0,t+r),"element");}}Ps(t);}function Ps(t){const e=t.anchor,n=e.offset,r=t.focus,s=r.offset,i=e.getNode(),o=r.getNode();if(t.isCollapsed()){if(!li(i))return;const t=i.getChildrenSize(),s=n>=t,o=s?i.getChildAtIndex(t-1):i.getChildAtIndex(n);if(Gr(o)){let t=0;s&&(t=o.getTextContentSize()),e.set(o.__key,t,"text"),r.set(o.__key,t,"text");}}else {if(li(i)){const t=i.getChildrenSize(),r=n>=t,s=r?i.getChildAtIndex(t-1):i.getChildAtIndex(n);if(Gr(s)){let t=0;r&&(t=s.getTextContentSize()),e.set(s.__key,t,"text");}}if(li(o)){const t=o.getChildrenSize(),e=s>=t,n=e?o.getChildAtIndex(t-1):o.getChildAtIndex(s);if(Gr(n)){let t=0;e&&(t=n.getTextContentSize()),r.set(n.__key,t,"text");}}}}function Ds(t,e,n,r,s){let i=null,o=0,l=null;null!==r?(i=r.__key,Gr(r)?(o=r.getTextContentSize(),l="text"):li(r)&&(o=r.getChildrenSize(),l="element")):null!==s&&(i=s.__key,Gr(s)?l="text":li(s)&&(l="element")),null!==i&&null!==l?t.set(i,o,l):(o=e.getIndexWithinParent(),-1===o&&(o=n.getChildrenSize()),t.set(n.__key,o,"element"));}function Fs(t,e,n,r,s){"text"===t.type?(t.key=n,e||(t.offset+=s)):t.offset>r.getIndexWithinParent()&&(t.offset-=1);}function Os(t,e,n,r,s,i,o){const l=r.anchorNode,c=r.focusNode,a=r.anchorOffset,u=r.focusOffset,f=document.activeElement;if(s.has("collaboration")&&f!==i||null!==f&&oe$1(f))return;if(!us(e))return void(null!==t&&le$1(n,l,c)&&r.removeAllRanges());const d=e.anchor,h=e.focus,g=d.key,_=h.key,p=Ze(n,g),y=Ze(n,_),m=d.offset,x=h.offset,v=e.format,T=e.style,C=e.isCollapsed();let S=p,k=y,b=!1;if("text"===d.type){S=fe(p);const t=d.getNode();b=t.getFormat()!==v||t.getStyle()!==T;}else us(t)&&"text"===t.anchor.type&&(b=!0);var w,N,E,P,D;if(("text"===h.type&&(k=fe(y)),null!==S&&null!==k)&&(C&&(null===t||b||us(t)&&(t.format!==v||t.style!==T))&&(w=v,N=T,E=m,P=g,D=performance.now(),mr=[w,N,E,P,D]),a!==m||u!==x||l!==S||c!==k||"Range"===r.type&&C||(null!==f&&i.contains(f)||i.focus({preventScroll:!0}),"element"===d.type))){try{r.setBaseAndExtent(S,m,k,x);}catch(t){}if(!s.has("skip-scroll-into-view")&&e.isCollapsed()&&null!==i&&i===document.activeElement){const t=e instanceof fs&&"element"===e.anchor.type?S.childNodes[m]||null:r.rangeCount>0?r.getRangeAt(0):null;if(null!==t){let e;if(t instanceof Text){const n=document.createRange();n.selectNode(t),e=n.getBoundingClientRect();}else e=t.getBoundingClientRect();!function(t,e,n){const r=n.ownerDocument,s=r.defaultView;if(null===s)return;let{top:i,bottom:o}=e,l=0,c=0,a=n;for(;null!==a;){const e=a===r.body;if(e)l=0,c=rn(t).innerHeight;else {const t=a.getBoundingClientRect();l=t.top,c=t.bottom;}let n=0;if(i<l?n=-(l-i):o>c&&(n=o-c),0!==n)if(e)s.scrollBy(0,n);else {const t=a.scrollTop;a.scrollTop+=n;const e=a.scrollTop-t;i-=e,o-=e;}if(e)break;a=Ge(a);}}(n,e,i);}}gr=!0;}}function Is(t){let e=ws()||Ns();null===e&&(e=ke().selectEnd()),e.insertNodes(t);}function Ls(){const t=ws();return null===t?"":t.getTextContent()}function As(t){let e=t;t.isCollapsed()||e.removeText();const n=ws();us(n)&&(e=n),us(e)||Rt(161);const r=e.anchor;let s=r.getNode(),i=r.offset;for(;!Tn(s);)[s,i]=Ms(s,i);return i}function Ms(t,e){const n=t.getParent();if(!n){const t=xi();return ke().append(t),t.select(),[ke(),0]}if(Gr(t)){const r=t.splitText(e);if(0===r.length)return [n,t.getIndexWithinParent()];const s=0===e?0:1;return [n,r[0].getIndexWithinParent()+s]}if(!li(t)||0===e)return [n,t.getIndexWithinParent()];const r=t.getChildAtIndex(e);if(r){const n=new fs(is(t.__key,e,"element"),is(t.__key,e,"element"),0,""),s=t.insertNewAfter(n);s&&s.append(r,...r.getNextSiblings());}return [n,t.getIndexWithinParent()+1]}let zs=null,Ws=null,Bs=!1,Rs=!1,Ks=0;const Js={characterData:!0,childList:!0,subtree:!0};function Us(){return Bs||null!==zs&&zs._readOnly}function Vs(){Bs&&Rt(13);}function $s(){Ks>99&&Rt(14);}function Hs(){return null===zs&&Rt(15),zs}function js(){return null===Ws&&Rt(16),Ws}function qs(){return Ws}function Qs(t,e,n){const r=e.__type,s=function(t,e){const n=t._nodes.get(e);return void 0===n&&Rt(30,e),n}(t,r);let i=n.get(r);void 0===i&&(i=Array.from(s.transforms),n.set(r,i));const o=i.length;for(let t=0;t<o&&(i[t](e),e.isAttached());t++);}function Xs(t,e){return void 0!==t&&t.__key!==e&&t.isAttached()}function Ys(t){return Zs(t,js()._nodes)}function Zs(t,e){const n=t.type,r=e.get(n);void 0===r&&Rt(17,n);const s=r.klass;t.type!==s.getType()&&Rt(18,s.name);const i=s.importJSON(t),o=t.children;if(li(i)&&Array.isArray(o))for(let t=0;t<o.length;t++){const n=Zs(o[t],e);i.append(n);}return i}function Gs(t,e){const n=zs,r=Bs,s=Ws;zs=t,Bs=!0,Ws=null;try{return e()}finally{zs=n,Bs=r,Ws=s;}}function ti(t,n){const r=t._pendingEditorState,s=t._rootElement,i=t._headless||null===s;if(null===r)return;const o=t._editorState,l=o._selection,c=r._selection,a=t._dirtyType!==it,u=zs,f=Bs,d=Ws,h=t._updating,g=t._observer;let _=null;if(t._pendingEditorState=null,t._editorState=r,!i&&a&&null!==g){Ws=t,zs=r,Bs=!1,t._updating=!0;try{const e=t._dirtyType,n=t._dirtyElements,s=t._dirtyLeaves;g.disconnect(),_=sr(o,r,t,e,n,s);}catch(e){if(e instanceof Error&&t._onError(e),Rs)throw e;return wi(t,null,s,r),Yt(t),t._dirtyType=lt,Rs=!0,ti(t,o),void(Rs=!1)}finally{g.observe(s,Js),t._updating=h,zs=u,Bs=f,Ws=d;}}r._readOnly||(r._readOnly=!0);const p=t._dirtyLeaves,y=t._dirtyElements,m=t._normalizedNodes,x=t._updateTags,v=t._deferred;a&&(t._dirtyType=it,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements=new Map,t._normalizedNodes=new Set,t._updateTags=new Set),function(t,e){const n=t._decorators;let r=t._pendingDecorators||n;const s=e._nodeMap;let i;for(i in r)s.has(i)||(r===n&&(r=Ce(t)),delete r[i]);}(t,r);const T=i?null:_n(t._window);if(t._editable&&null!==T&&(a||null===c||c.dirty)){Ws=t,zs=r;try{if(null!==g&&g.disconnect(),a||null===c||c.dirty){const e=t._blockCursorElement;null!==e&&hn(e,t,s),Os(l,c,t,T,x,s);}gn(t,s,c),null!==g&&g.observe(s,Js);}finally{Ws=d,zs=u;}}null!==_&&function(t,e,n,r,s){const i=Array.from(t._listeners.mutation),o=i.length;for(let t=0;t<o;t++){const[o,l]=i[t],c=e.get(l);void 0!==c&&o(c,{dirtyLeaves:r,prevEditorState:s,updateTags:n});}}(t,_,x,p,o),us(c)||null===c||null!==l&&l.is(c)||t.dispatchCommand(e,void 0);const C=t._pendingDecorators;null!==C&&(t._decorators=C,t._pendingDecorators=null,ei("decorator",t,!0,C)),function(t,e,n){const r=Se(e),s=Se(n);r!==s&&ei("textcontent",t,!0,s);}(t,n||o,r),ei("update",t,!0,{dirtyElements:y,dirtyLeaves:p,editorState:r,normalizedNodes:m,prevEditorState:n||o,tags:x}),function(t,e){if(t._deferred=[],0!==e.length){const n=t._updating;t._updating=!0;try{for(let t=0;t<e.length;t++)e[t]();}finally{t._updating=n;}}}(t,v),function(t){const e=t._updates;if(0!==e.length){const n=e.shift();if(n){const[e,r]=n;si(t,e,r);}}}(t);}function ei(t,e,n,...r){const s=e._updating;e._updating=n;try{const n=Array.from(e._listeners[t]);for(let t=0;t<n.length;t++)n[t].apply(null,r);}finally{e._updating=s;}}function ni(t,e,n){if(!1===t._updating||Ws!==t){let r=!1;return t.update((()=>{r=ni(t,e,n);})),r}const r=De(t);for(let s=4;s>=0;s--)for(let i=0;i<r.length;i++){const o=r[i]._commands.get(e);if(void 0!==o){const e=o[s];if(void 0!==e){const r=Array.from(e),s=r.length;for(let e=0;e<s;e++)if(!0===r[e](n,t))return !0}}}return !1}function ri(t,e){const n=t._updates;let r=e||!1;for(;0!==n.length;){const e=n.shift();if(e){const[n,s]=e;let i,o;void 0!==s&&(i=s.onUpdate,o=s.tag,s.skipTransforms&&(r=!0),i&&t._deferred.push(i),o&&t._updateTags.add(o)),n();}}return r}function si(t,e,n){const r=t._updateTags;let s,i,o=!1,l=!1;void 0!==n&&(s=n.onUpdate,i=n.tag,null!=i&&r.add(i),o=n.skipTransforms||!1,l=n.discrete||!1),s&&t._deferred.push(s);const c=t._editorState;let a=t._pendingEditorState,u=!1;(null===a||a._readOnly)&&(a=t._pendingEditorState=new _i(new Map((a||c)._nodeMap)),u=!0),a._flushSync=l;const f=zs,d=Bs,h=Ws,g=t._updating;zs=a,Bs=!1,t._updating=!0,Ws=t;try{u&&(t._headless?null!==c._selection&&(a._selection=c._selection.clone()):a._selection=function(t){const e=t.getEditorState()._selection,n=_n(t._window);return us(e)||null==e?bs(e,n,t,null):e.clone()}(t));const n=t._compositionKey;e(),o=ri(t,o),function(t,e){const n=e.getEditorState()._selection,r=t._selection;if(us(r)){const t=r.anchor,e=r.focus;let s;if("text"===t.type&&(s=t.getNode(),s.selectionTransform(n,r)),"text"===e.type){const t=e.getNode();s!==t&&t.selectionTransform(n,r);}}}(a,t),t._dirtyType!==it&&(o?function(t,e){const n=e._dirtyLeaves,r=t._nodeMap;for(const t of n){const e=r.get(t);Gr(e)&&e.isAttached()&&e.isSimpleText()&&!e.isUnmergeable()&&te$1(e);}}(a,t):function(t,e){const n=e._dirtyLeaves,r=e._dirtyElements,s=t._nodeMap,i=me(),o=new Map;let l=n,c=l.size,a=r,u=a.size;for(;c>0||u>0;){if(c>0){e._dirtyLeaves=new Set;for(const t of l){const r=s.get(t);Gr(r)&&r.isAttached()&&r.isSimpleText()&&!r.isUnmergeable()&&te$1(r),void 0!==r&&Xs(r,i)&&Qs(e,r,o),n.add(t);}if(l=e._dirtyLeaves,c=l.size,c>0){Ks++;continue}}e._dirtyLeaves=new Set,e._dirtyElements=new Map;for(const t of a){const n=t[0],l=t[1];if("root"!==n&&!l)continue;const c=s.get(n);void 0!==c&&Xs(c,i)&&Qs(e,c,o),r.set(n,l);}l=e._dirtyLeaves,c=l.size,a=e._dirtyElements,u=a.size,Ks++;}e._dirtyLeaves=n,e._dirtyElements=r;}(a,t),ri(t),function(t,e,n,r){const s=t._nodeMap,i=e._nodeMap,o=[];for(const[t]of r){const e=i.get(t);void 0!==e&&(e.isAttached()||(li(e)&&kn(e,t,s,i,o,r),s.has(t)||r.delete(t),o.push(t)));}for(const t of o)i.delete(t);for(const t of n){const e=i.get(t);void 0===e||e.isAttached()||(s.has(t)||n.delete(t),i.delete(t));}}(c,a,t._dirtyLeaves,t._dirtyElements));n!==t._compositionKey&&(a._flushSync=!0);const r=a._selection;if(us(r)){const t=a._nodeMap,e=r.anchor.key,n=r.focus.key;void 0!==t.get(e)&&void 0!==t.get(n)||Rt(19);}else ds(r)&&0===r._nodes.size&&(a._selection=null);}catch(e){return e instanceof Error&&t._onError(e),t._pendingEditorState=c,t._dirtyType=lt,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements.clear(),void ti(t)}finally{zs=f,Bs=d,Ws=h,t._updating=g,Ks=0;}const _=t._dirtyType!==it||function(t,e){const n=e.getEditorState()._selection,r=t._selection;if(null!==r){if(r.dirty||!r.is(n))return !0}else if(null!==n)return !0;return !1}(a,t);_?a._flushSync?(a._flushSync=!1,ti(t)):u&&ie((()=>{ti(t);})):(a._flushSync=!1,u&&(r.clear(),t._deferred=[],t._pendingEditorState=null));}function ii(t,e,n){t._updating?t._updates.push([e,n]):si(t,e,n);}class oi extends Fr{constructor(t){super(t),this.__first=null,this.__last=null,this.__size=0,this.__format=0,this.__indent=0,this.__dir=null;}getFormat(){return this.getLatest().__format}getFormatType(){const t=this.getFormat();return Mt[t]||""}getIndent(){return this.getLatest().__indent}getChildren(){const t=[];let e=this.getFirstChild();for(;null!==e;)t.push(e),e=e.getNextSibling();return t}getChildrenKeys(){const t=[];let e=this.getFirstChild();for(;null!==e;)t.push(e.__key),e=e.getNextSibling();return t}getChildrenSize(){return this.getLatest().__size}isEmpty(){return 0===this.getChildrenSize()}isDirty(){const t=js()._dirtyElements;return null!==t&&t.has(this.__key)}isLastChild(){const t=this.getLatest(),e=this.getParentOrThrow().getLastChild();return null!==e&&e.is(t)}getAllTextNodes(){const t=[];let e=this.getFirstChild();for(;null!==e;){if(Gr(e)&&t.push(e),li(e)){const n=e.getAllTextNodes();t.push(...n);}e=e.getNextSibling();}return t}getFirstDescendant(){let t=this.getFirstChild();for(;li(t);){const e=t.getFirstChild();if(null===e)break;t=e;}return t}getLastDescendant(){let t=this.getLastChild();for(;li(t);){const e=t.getLastChild();if(null===e)break;t=e;}return t}getDescendantByIndex(t){const e=this.getChildren(),n=e.length;if(t>=n){const t=e[n-1];return li(t)&&t.getLastDescendant()||t||null}const r=e[t];return li(r)&&r.getFirstDescendant()||r||null}getFirstChild(){const t=this.getLatest().__first;return null===t?null:xe(t)}getFirstChildOrThrow(){const t=this.getFirstChild();return null===t&&Rt(45,this.__key),t}getLastChild(){const t=this.getLatest().__last;return null===t?null:xe(t)}getLastChildOrThrow(){const t=this.getLastChild();return null===t&&Rt(96,this.__key),t}getChildAtIndex(t){const e=this.getChildrenSize();let n,r;if(t<e/2){for(n=this.getFirstChild(),r=0;null!==n&&r<=t;){if(r===t)return n;n=n.getNextSibling(),r++;}return null}for(n=this.getLastChild(),r=e-1;null!==n&&r>=t;){if(r===t)return n;n=n.getPreviousSibling(),r--;}return null}getTextContent(){let t="";const e=this.getChildren(),n=e.length;for(let r=0;r<n;r++){const s=e[r];t+=s.getTextContent(),li(s)&&r!==n-1&&!s.isInline()&&(t+=Nt);}return t}getTextContentSize(){let t=0;const e=this.getChildren(),n=e.length;for(let r=0;r<n;r++){const s=e[r];t+=s.getTextContentSize(),li(s)&&r!==n-1&&!s.isInline()&&(t+=Nt.length);}return t}getDirection(){return this.getLatest().__dir}hasFormat(t){if(""!==t){const e=At[t];return !!(this.getFormat()&e)}return !1}select(t,e){Vs();const n=ws();let r=t,s=e;const i=this.getChildrenSize();if(!this.canBeEmpty())if(0===t&&0===e){const t=this.getFirstChild();if(Gr(t)||li(t))return t.select(0,0)}else if(!(void 0!==t&&t!==i||void 0!==e&&e!==i)){const t=this.getLastChild();if(Gr(t)||li(t))return t.select()}void 0===r&&(r=i),void 0===s&&(s=i);const o=this.__key;return us(n)?(n.anchor.set(o,r,"element"),n.focus.set(o,s,"element"),n.dirty=!0,n):Ts(o,r,o,s,"element","element")}selectStart(){const t=this.getFirstDescendant();return t?t.selectStart():this.select()}selectEnd(){const t=this.getLastDescendant();return t?t.selectEnd():this.select()}clear(){const t=this.getWritable();return this.getChildren().forEach((t=>t.remove())),t}append(...t){return this.splice(this.getChildrenSize(),0,t)}setDirection(t){const e=this.getWritable();return e.__dir=t,e}setFormat(t){return this.getWritable().__format=""!==t?At[t]:0,this}setIndent(t){return this.getWritable().__indent=t,this}splice(t,e,n){const r=n.length,s=this.getChildrenSize(),i=this.getWritable(),o=i.__key,l=[],c=[],a=this.getChildAtIndex(t+e);let u=null,f=s-e+r;if(0!==t)if(t===s)u=this.getLastChild();else {const e=this.getChildAtIndex(t);null!==e&&(u=e.getPreviousSibling());}if(e>0){let t=null===u?this.getFirstChild():u.getNextSibling();for(let n=0;n<e;n++){null===t&&Rt(100);const e=t.getNextSibling(),n=t.__key;_e(t.getWritable()),c.push(n),t=e;}}let d=u;for(let t=0;t<r;t++){const e=n[t];null!==d&&e.is(d)&&(u=d=d.getPreviousSibling());const r=e.getWritable();r.__parent===o&&f--,_e(r);const s=e.__key;if(null===d)i.__first=s,r.__prev=null;else {const t=d.getWritable();t.__next=s,r.__prev=t.__key;}e.__key===o&&Rt(76),r.__parent=o,l.push(s),d=e;}if(t+e===s){if(null!==d){d.getWritable().__next=null,i.__last=d.__key;}}else if(null!==a){const t=a.getWritable();if(null!==d){const e=d.getWritable();t.__prev=d.__key,e.__next=a.__key;}else t.__prev=null;}if(i.__size=f,c.length){const t=ws();if(us(t)){const e=new Set(c),n=new Set(l),{anchor:r,focus:s}=t;ci(r,e,n)&&Ds(r,r.getNode(),this,u,a),ci(s,e,n)&&Ds(s,s.getNode(),this,u,a),0!==f||this.canBeEmpty()||ln(this)||this.remove();}}return i}exportJSON(){return {children:[],direction:this.getDirection(),format:this.getFormatType(),indent:this.getIndent(),type:"element",version:1}}insertNewAfter(t,e){return null}canIndent(){return !0}collapseAtStart(t){return !1}excludeFromCopy(t){return !1}canReplaceWith(t){return !0}canInsertAfter(t){return !0}canBeEmpty(){return !0}canInsertTextBefore(){return !0}canInsertTextAfter(){return !0}isInline(){return !1}isShadowRoot(){return !1}canMergeWith(t){return !1}extractWithChild(t,e,n){return !1}}function li(t){return t instanceof oi}function ci(t,e,n){let r=t.getNode();for(;r;){const t=r.__key;if(e.has(t)&&!n.has(t))return !0;r=r.getParent();}return !1}class ai extends Fr{constructor(t){super(t);}decorate(t,e){Rt(47);}isIsolated(){return !1}isInline(){return !0}isKeyboardSelectable(){return !0}}function ui(t){return t instanceof ai}class fi extends oi{static getType(){return "root"}static clone(){return new fi}constructor(){super("root"),this.__cachedText=null;}getTopLevelElementOrThrow(){Rt(51);}getTextContent(){const t=this.__cachedText;return !Us()&&js()._dirtyType!==it||null===t?super.getTextContent():t}remove(){Rt(52);}replace(t){Rt(53);}insertBefore(t){Rt(54);}insertAfter(t){Rt(55);}updateDOM(t,e){return !1}append(...t){for(let e=0;e<t.length;e++){const n=t[e];li(n)||ui(n)||Rt(56);}return super.append(...t)}static importJSON(t){const e=ke();return e.setFormat(t.format),e.setIndent(t.indent),e.setDirection(t.direction),e}exportJSON(){return {children:[],direction:this.getDirection(),format:this.getFormatType(),indent:this.getIndent(),type:"root",version:1}}collapseAtStart(){return !0}}function di(t){return t instanceof fi}function hi(){return new _i(new Map([["root",new fi]]))}function gi(t){const e=t.exportJSON(),n=t.constructor;if(e.type!==n.getType()&&Rt(130,n.name),li(t)){const r=e.children;Array.isArray(r)||Rt(59,n.name);const s=t.getChildren();for(let t=0;t<s.length;t++){const e=gi(s[t]);r.push(e);}}return e}class _i{constructor(t,e){this._nodeMap=t,this._selection=e||null,this._flushSync=!1,this._readOnly=!1;}isEmpty(){return 1===this._nodeMap.size&&null===this._selection}read(t){return Gs(this,t)}clone(t){const e=new _i(this._nodeMap,void 0===t?this._selection:t);return e._readOnly=!0,e}toJSON(){return Gs(this,(()=>({root:gi(ke())})))}}class pi extends oi{static getType(){return "artificial"}createDOM(t){return document.createElement("div")}}class yi extends oi{constructor(t){super(t),this.__textFormat=0;}static getType(){return "paragraph"}getTextFormat(){return this.getLatest().__textFormat}setTextFormat(t){const e=this.getWritable();return e.__textFormat=t,e}hasTextFormat(t){const e=It[t];return !!(this.getTextFormat()&e)}static clone(t){return new yi(t.__key)}createDOM(t){const e=document.createElement("p"),n=Ve(t.theme,"paragraph");if(void 0!==n){e.classList.add(...n);}return e}updateDOM(t,e,n){return !1}static importDOM(){return {p:t=>({conversion:mi,priority:0})}}exportDOM(t){const{element:e}=super.exportDOM(t);if(e&&mn(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();e.style.textAlign=t;const n=this.getDirection();n&&(e.dir=n);const r=this.getIndent();r>0&&(e.style.textIndent=20*r+"px");}return {element:e}}static importJSON(t){const e=xi();return e.setFormat(t.format),e.setIndent(t.indent),e.setDirection(t.direction),e.setTextFormat(t.textFormat),e}exportJSON(){return {...super.exportJSON(),textFormat:this.getTextFormat(),type:"paragraph",version:1}}insertNewAfter(t,e){const n=xi();n.setTextFormat(t.format);const r=this.getDirection();return n.setDirection(r),n.setFormat(this.getFormatType()),this.insertAfter(n,e),n}collapseAtStart(){const t=this.getChildren();if(0===t.length||Gr(t[0])&&""===t[0].getTextContent().trim()){if(null!==this.getNextSibling())return this.selectNext(),this.remove(),!0;if(null!==this.getPreviousSibling())return this.selectPrevious(),this.remove(),!0}return !1}}function mi(t){const e=xi();if(t.style){e.setFormat(t.style.textAlign);const n=parseInt(t.style.textIndent,10)/20;n>0&&e.setIndent(n);}return {node:e}}function xi(){return an(new yi)}function vi(t){return t instanceof yi}const Ti=0,Ci=1,Si=2,ki=3,bi=4;function wi(t,e,n,r){const s=t._keyToDOMMap;s.clear(),t._editorState=hi(),t._pendingEditorState=r,t._compositionKey=null,t._dirtyType=it,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements.clear(),t._normalizedNodes=new Set,t._updateTags=new Set,t._updates=[],t._blockCursorElement=null;const i=t._observer;null!==i&&(i.disconnect(),t._observer=null),null!==e&&(e.textContent=""),null!==n&&(n.textContent="",s.set("root",n));}function Ni(t){const e=t||{},n=qs(),r=e.theme||{},s=void 0===t?n:e.parentEditor||null,i=e.disableEvents||!1,o=hi(),l=e.namespace||(null!==s?s._config.namespace:Fe()),c=e.editorState,a=[fi,Ur,Or,es,yi,pi,...e.nodes||[]],{onError:u,html:f}=e,d=void 0===e.editable||e.editable;let h;if(void 0===t&&null!==n)h=n._nodes;else {h=new Map;for(let t=0;t<a.length;t++){let e=a[t],n=null,r=null;if("function"!=typeof e){const t=e;e=t.replace,n=t.with,r=t.withKlass||null;}const s=e.getType(),i=e.transform(),o=new Set;null!==i&&o.add(i),h.set(s,{exportDOM:f&&f.export?f.export.get(e):void 0,klass:e,replace:n,replaceWithKlass:r,transforms:o});}}const g=new Ei(o,s,h,{disableEvents:i,namespace:l,theme:r},u||console.error,function(t,e){const n=new Map,r=new Set,s=t=>{Object.keys(t).forEach((e=>{let r=n.get(e);void 0===r&&(r=[],n.set(e,r)),r.push(t[e]);}));};return t.forEach((t=>{const e=t.klass.importDOM;if(null==e||r.has(e))return;r.add(e);const n=e.call(t.klass);null!==n&&s(n);})),e&&s(e),n}(h,f?f.import:void 0),d);return void 0!==c&&(g._pendingEditorState=c,g._dirtyType=lt),g}class Ei{constructor(t,e,n,r,s,i,o){this._parentEditor=e,this._rootElement=null,this._editorState=t,this._pendingEditorState=null,this._compositionKey=null,this._deferred=[],this._keyToDOMMap=new Map,this._updates=[],this._updating=!1,this._listeners={decorator:new Set,editable:new Set,mutation:new Map,root:new Set,textcontent:new Set,update:new Set},this._commands=new Map,this._config=r,this._nodes=n,this._decorators={},this._pendingDecorators=null,this._dirtyType=it,this._cloneNotNeeded=new Set,this._dirtyLeaves=new Set,this._dirtyElements=new Map,this._normalizedNodes=new Set,this._updateTags=new Set,this._observer=null,this._key=Fe(),this._onError=s,this._htmlConversions=i,this._editable=o,this._headless=null!==e&&e._headless,this._window=null,this._blockCursorElement=null;}isComposing(){return null!=this._compositionKey}registerUpdateListener(t){const e=this._listeners.update;return e.add(t),()=>{e.delete(t);}}registerEditableListener(t){const e=this._listeners.editable;return e.add(t),()=>{e.delete(t);}}registerDecoratorListener(t){const e=this._listeners.decorator;return e.add(t),()=>{e.delete(t);}}registerTextContentListener(t){const e=this._listeners.textcontent;return e.add(t),()=>{e.delete(t);}}registerRootListener(t){const e=this._listeners.root;return t(this._rootElement,null),e.add(t),()=>{t(null,this._rootElement),e.delete(t);}}registerCommand(t,e,n){void 0===n&&Rt(35);const r=this._commands;r.has(t)||r.set(t,[new Set,new Set,new Set,new Set,new Set]);const s=r.get(t);void 0===s&&Rt(36,String(t));const i=s[n];return i.add(e),()=>{i.delete(e),s.every((t=>0===t.size))&&r.delete(t);}}registerMutationListener(t,e){let n=this._nodes.get(t.getType());void 0===n&&Rt(37,t.name);let r=t,s=null;for(;s=n.replaceWithKlass;)r=s,n=this._nodes.get(s.getType()),void 0===n&&Rt(37,s.name);const i=this._listeners.mutation;return i.set(e,r),()=>{i.delete(e);}}registerNodeTransformToKlass(t,e){const n=t.getType(),r=this._nodes.get(n);void 0===r&&Rt(37,t.name);return r.transforms.add(e),r}registerNodeTransform(t,e){const n=this.registerNodeTransformToKlass(t,e),r=[n],s=n.replaceWithKlass;if(null!=s){const t=this.registerNodeTransformToKlass(s,e);r.push(t);}var i,o;return i=this,o=t.getType(),ii(i,(()=>{const t=Hs();if(t.isEmpty())return;if("root"===o)return void ke().markDirty();const e=t._nodeMap;for(const[,t]of e)t.markDirty();}),null===i._pendingEditorState?{tag:"history-merge"}:void 0),()=>{r.forEach((t=>t.transforms.delete(e)));}}hasNode(t){return this._nodes.has(t.getType())}hasNodes(t){return t.every(this.hasNode.bind(this))}dispatchCommand(t,e){return Xe(this,t,e)}getDecorators(){return this._decorators}getRootElement(){return this._rootElement}getKey(){return this._key}setRootElement(t){const e=this._rootElement;if(t!==e){const n=Ve(this._config.theme,"root"),r=this._pendingEditorState||this._editorState;if(this._rootElement=t,wi(this,e,t,r),null!==e&&(this._config.disableEvents||Pr(e),null!=n&&e.classList.remove(...n)),null!==t){const e=function(t){const e=t.ownerDocument;return e&&e.defaultView||null}(t),r=t.style;r.userSelect="text",r.whiteSpace="pre-wrap",r.wordBreak="break-word",t.setAttribute("data-lexical-editor","true"),this._window=e,this._dirtyType=lt,Yt(this),this._updateTags.add("history-merge"),ti(this),this._config.disableEvents||function(t,e){const n=t.ownerDocument,r=hr.get(n);(void 0===r||r<1)&&n.addEventListener("selectionchange",wr),hr.set(n,(r||0)+1),t.__lexicalEditor=e;const s=kr(t);for(let n=0;n<cr.length;n++){const[r,i]=cr[n],o="function"==typeof i?t=>{Er(t)||(Nr(t),(e.isEditable()||"click"===r)&&i(t,e));}:t=>{if(Er(t))return;Nr(t);const n=e.isEditable();switch(r){case"cut":return n&&Xe(e,z$2,t);case"copy":return Xe(e,M$3,t);case"paste":return n&&Xe(e,c,t);case"dragstart":return n&&Xe(e,I$3,t);case"dragover":return n&&Xe(e,L$3,t);case"dragend":return n&&Xe(e,A$3,t);case"focus":return n&&Xe(e,U$2,t);case"blur":return n&&Xe(e,V$1,t);case"drop":return n&&Xe(e,F$2,t)}};t.addEventListener(r,o),s.push((()=>{t.removeEventListener(r,o);}));}}(t,this),null!=n&&t.classList.add(...n);}else this._editorState=r,this._pendingEditorState=null,this._window=null;ei("root",this,!1,t,e);}}getElementByKey(t){return this._keyToDOMMap.get(t)||null}getEditorState(){return this._editorState}setEditorState(t,e){t.isEmpty()&&Rt(38),Xt(this);const n=this._pendingEditorState,r=this._updateTags,s=void 0!==e?e.tag:null;null===n||n.isEmpty()||(null!=s&&r.add(s),ti(this)),this._pendingEditorState=t,this._dirtyType=lt,this._dirtyElements.set("root",!1),this._compositionKey=null,null!=s&&r.add(s),ti(this);}parseEditorState(t,e){return function(t,e,n){const r=hi(),s=zs,i=Bs,o=Ws,l=e._dirtyElements,c=e._dirtyLeaves,a=e._cloneNotNeeded,u=e._dirtyType;e._dirtyElements=new Map,e._dirtyLeaves=new Set,e._cloneNotNeeded=new Set,e._dirtyType=0,zs=r,Bs=!1,Ws=e;try{const s=e._nodes;Zs(t.root,s),n&&n(),r._readOnly=!0;}catch(t){t instanceof Error&&e._onError(t);}finally{e._dirtyElements=l,e._dirtyLeaves=c,e._cloneNotNeeded=a,e._dirtyType=u,zs=s,Bs=i,Ws=o;}return r}("string"==typeof t?JSON.parse(t):t,this,e)}update(t,e){ii(this,t,e);}focus(t,e={}){const n=this._rootElement;null!==n&&(n.setAttribute("autocapitalize","off"),ii(this,(()=>{const t=ws(),n=ke();null!==t?t.dirty=!0:0!==n.getChildrenSize()&&("rootStart"===e.defaultSelection?n.selectStart():n.selectEnd());}),{onUpdate:()=>{n.removeAttribute("autocapitalize"),t&&t();},tag:"focus"}),null===this._pendingEditorState&&n.removeAttribute("autocapitalize"));}blur(){const t=this._rootElement;null!==t&&t.blur();const e=_n(this._window);null!==e&&e.removeAllRanges();}isEditable(){return this._editable}setEditable(t){this._editable!==t&&(this._editable=t,ei("editable",this,!0,t));}toJSON(){return {editorState:this._editorState.toJSON()}}}

var modProd$5 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $addUpdateTag: en,
    $applyNodeReplacement: an,
    $copyNode: cn,
    $createLineBreakNode: Lr,
    $createNodeSelection: Ss,
    $createParagraphNode: xi,
    $createPoint: is,
    $createRangeSelection: Cs,
    $createRangeSelectionFromDom: ks,
    $createTabNode: ns,
    $createTextNode: Zr,
    $getAdjacentNode: qe,
    $getCharacterOffsets: gs,
    $getEditor: Sn,
    $getNearestNodeFromDOMNode: Te,
    $getNearestRootOrShadowRoot: on,
    $getNodeByKey: xe,
    $getNodeByKeyOrThrow: fn,
    $getPreviousSelection: Ns,
    $getRoot: ke,
    $getSelection: ws,
    $getTextContent: Ls,
    $hasAncestor: nn,
    $hasUpdateTag: tn,
    $insertNodes: Is,
    $isBlockElementNode: vs,
    $isDecoratorNode: ui,
    $isElementNode: li,
    $isInlineElementOrDecoratorNode: sn,
    $isLeafNode: he,
    $isLineBreakNode: Ar,
    $isNodeSelection: ds,
    $isParagraphNode: vi,
    $isRangeSelection: us,
    $isRootNode: di,
    $isRootOrShadowRoot: ln,
    $isTabNode: rs,
    $isTextNode: Gr,
    $nodesOfType: He,
    $normalizeSelection__EXPERIMENTAL: ee$1,
    $parseSerializedNode: Ys,
    $selectAll: Ue,
    $setCompositionKey: ye,
    $setSelection: we,
    $splitNode: pn,
    ArtificialNode__DO_NOT_USE: pi,
    BLUR_COMMAND: V$1,
    CAN_REDO_COMMAND: K$2,
    CAN_UNDO_COMMAND: J$1,
    CLEAR_EDITOR_COMMAND: B$3,
    CLEAR_HISTORY_COMMAND: R$4,
    CLICK_COMMAND: r,
    COMMAND_PRIORITY_CRITICAL: bi,
    COMMAND_PRIORITY_EDITOR: Ti,
    COMMAND_PRIORITY_HIGH: ki,
    COMMAND_PRIORITY_LOW: Ci,
    COMMAND_PRIORITY_NORMAL: Si,
    CONTROLLED_TEXT_INSERTION_COMMAND: l,
    COPY_COMMAND: M$3,
    CUT_COMMAND: z$2,
    DELETE_CHARACTER_COMMAND: s,
    DELETE_LINE_COMMAND: f,
    DELETE_WORD_COMMAND: u,
    DRAGEND_COMMAND: A$3,
    DRAGOVER_COMMAND: L$3,
    DRAGSTART_COMMAND: I$3,
    DROP_COMMAND: F$2,
    DecoratorNode: ai,
    ElementNode: oi,
    FOCUS_COMMAND: U$2,
    FORMAT_ELEMENT_COMMAND: O$3,
    FORMAT_TEXT_COMMAND: d$1,
    INDENT_CONTENT_COMMAND: P$4,
    INSERT_LINE_BREAK_COMMAND: i,
    INSERT_PARAGRAPH_COMMAND: o,
    INSERT_TAB_COMMAND: E$3,
    IS_ALL_FORMATTING: xt,
    IS_BOLD: ft,
    IS_CODE: _t,
    IS_HIGHLIGHT: mt,
    IS_ITALIC: dt,
    IS_STRIKETHROUGH: ht,
    IS_SUBSCRIPT: pt,
    IS_SUPERSCRIPT: yt,
    IS_UNDERLINE: gt,
    KEY_ARROW_DOWN_COMMAND: T$3,
    KEY_ARROW_LEFT_COMMAND: m$3,
    KEY_ARROW_RIGHT_COMMAND: p$2,
    KEY_ARROW_UP_COMMAND: v$3,
    KEY_BACKSPACE_COMMAND: k$3,
    KEY_DELETE_COMMAND: w$3,
    KEY_DOWN_COMMAND: _$2,
    KEY_ENTER_COMMAND: C$3,
    KEY_ESCAPE_COMMAND: b$2,
    KEY_MODIFIER_COMMAND: $$2,
    KEY_SPACE_COMMAND: S$4,
    KEY_TAB_COMMAND: N$3,
    LineBreakNode: Or,
    MOVE_TO_END: y$4,
    MOVE_TO_START: x$3,
    OUTDENT_CONTENT_COMMAND: D$3,
    PASTE_COMMAND: c,
    ParagraphNode: yi,
    REDO_COMMAND: g$2,
    REMOVE_TEXT_COMMAND: a,
    RootNode: fi,
    SELECTION_CHANGE_COMMAND: e,
    SELECTION_INSERT_CLIPBOARD_NODES_COMMAND: n,
    SELECT_ALL_COMMAND: W$2,
    TEXT_TYPE_TO_FORMAT: It,
    TabNode: es,
    TextNode: Ur,
    UNDO_COMMAND: h$2,
    createCommand: t,
    createEditor: Ni,
    getNearestEditorFromDOMNode: ce,
    isBlockDomNode: vn,
    isCurrentlyReadOnlyMode: Us,
    isHTMLAnchorElement: yn,
    isHTMLElement: mn,
    isInlineDomNode: xn,
    isSelectionCapturedInDecoratorInput: oe$1,
    isSelectionWithinEditor: le$1,
    resetRandomKey: se
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const mod$5 = modProd$5;
const $createLineBreakNode = mod$5.$createLineBreakNode;
const $createParagraphNode = mod$5.$createParagraphNode;
const $createTabNode = mod$5.$createTabNode;
const $createTextNode = mod$5.$createTextNode;
const $getAdjacentNode = mod$5.$getAdjacentNode;
const $getCharacterOffsets = mod$5.$getCharacterOffsets;
const $getNodeByKey = mod$5.$getNodeByKey;
const $getPreviousSelection = mod$5.$getPreviousSelection;
const $getRoot = mod$5.$getRoot;
const $getSelection = mod$5.$getSelection;
const $hasAncestor = mod$5.$hasAncestor;
const $isBlockElementNode = mod$5.$isBlockElementNode;
const $isDecoratorNode = mod$5.$isDecoratorNode;
const $isElementNode = mod$5.$isElementNode;
const $isLeafNode = mod$5.$isLeafNode;
const $isLineBreakNode = mod$5.$isLineBreakNode;
const $isParagraphNode = mod$5.$isParagraphNode;
const $isRangeSelection = mod$5.$isRangeSelection;
const $isRootNode = mod$5.$isRootNode;
const $isRootOrShadowRoot = mod$5.$isRootOrShadowRoot;
const $isTextNode = mod$5.$isTextNode;
const $parseSerializedNode = mod$5.$parseSerializedNode;
const $selectAll = mod$5.$selectAll;
const $setSelection = mod$5.$setSelection;
const $splitNode = mod$5.$splitNode;
const ArtificialNode__DO_NOT_USE = mod$5.ArtificialNode__DO_NOT_USE;
const COMMAND_PRIORITY_CRITICAL = mod$5.COMMAND_PRIORITY_CRITICAL;
const COMMAND_PRIORITY_EDITOR = mod$5.COMMAND_PRIORITY_EDITOR;
const CONTROLLED_TEXT_INSERTION_COMMAND = mod$5.CONTROLLED_TEXT_INSERTION_COMMAND;
const COPY_COMMAND = mod$5.COPY_COMMAND;
const CUT_COMMAND = mod$5.CUT_COMMAND;
const DELETE_CHARACTER_COMMAND = mod$5.DELETE_CHARACTER_COMMAND;
const DELETE_LINE_COMMAND = mod$5.DELETE_LINE_COMMAND;
const DELETE_WORD_COMMAND = mod$5.DELETE_WORD_COMMAND;
const DRAGSTART_COMMAND = mod$5.DRAGSTART_COMMAND;
const DROP_COMMAND = mod$5.DROP_COMMAND;
const INSERT_LINE_BREAK_COMMAND = mod$5.INSERT_LINE_BREAK_COMMAND;
const INSERT_PARAGRAPH_COMMAND = mod$5.INSERT_PARAGRAPH_COMMAND;
const KEY_ARROW_LEFT_COMMAND = mod$5.KEY_ARROW_LEFT_COMMAND;
const KEY_ARROW_RIGHT_COMMAND = mod$5.KEY_ARROW_RIGHT_COMMAND;
const KEY_BACKSPACE_COMMAND = mod$5.KEY_BACKSPACE_COMMAND;
const KEY_DELETE_COMMAND = mod$5.KEY_DELETE_COMMAND;
const KEY_ENTER_COMMAND = mod$5.KEY_ENTER_COMMAND;
const PASTE_COMMAND = mod$5.PASTE_COMMAND;
const REMOVE_TEXT_COMMAND = mod$5.REMOVE_TEXT_COMMAND;
const SELECTION_INSERT_CLIPBOARD_NODES_COMMAND = mod$5.SELECTION_INSERT_CLIPBOARD_NODES_COMMAND;
const SELECT_ALL_COMMAND = mod$5.SELECT_ALL_COMMAND;
const TextNode = mod$5.TextNode;
const createEditor = mod$5.createEditor;
const isBlockDomNode$1 = mod$5.isBlockDomNode;
const isHTMLAnchorElement = mod$5.isHTMLAnchorElement;
const isHTMLElement$1 = mod$5.isHTMLElement;
const isInlineDomNode = mod$5.isInlineDomNode;
const isSelectionWithinEditor = mod$5.isSelectionWithinEditor;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function m$2(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var y$3=m$2((function(e){const t=new URLSearchParams;t.append("code",e);for(let e=1;e<arguments.length;e++)t.append("v",arguments[e]);throw Error(`Minified Lexical error #${e}; visit https://lexical.dev/docs/error?${t} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}));const x$2=new Map;function T$2(e){let t=e;for(;null!=t;){if(t.nodeType===Node.TEXT_NODE)return t;t=t.firstChild;}return null}function S$3(e){const t=e.parentNode;if(null==t)throw new Error("Should never happen");return [t,Array.from(t.childNodes).indexOf(e)]}function v$2(t,n,o,l,r){const s=n.getKey(),i=l.getKey(),c=document.createRange();let f=t.getElementByKey(s),u=t.getElementByKey(i),a=o,g=r;if($isTextNode(n)&&(f=T$2(f)),$isTextNode(l)&&(u=T$2(u)),void 0===n||void 0===l||null===f||null===u)return null;"BR"===f.nodeName&&([f,a]=S$3(f)),"BR"===u.nodeName&&([u,g]=S$3(u));const d=f.firstChild;f===u&&null!=d&&"BR"===d.nodeName&&0===a&&0===g&&(g=1);try{c.setStart(f,a),c.setEnd(u,g);}catch(e){return null}return !c.collapsed||a===g&&s===i||(c.setStart(u,g),c.setEnd(f,a)),c}function C$2(e,t){const n=e.getRootElement();if(null===n)return [];const o=n.getBoundingClientRect(),l=getComputedStyle(n),r=parseFloat(l.paddingLeft)+parseFloat(l.paddingRight),s=Array.from(t.getClientRects());let i,c=s.length;s.sort(((e,t)=>{const n=e.top-t.top;return Math.abs(n)<=3?e.left-t.left:n}));for(let e=0;e<c;e++){const t=s[e],n=i&&i.top<=t.top&&i.top+i.height>t.top&&i.left+i.width>t.left,l=t.width+r===o.width;n||l?(s.splice(e--,1),c--):i=t;}return s}function w$2(e){const t={},n=e.split(";");for(const e of n)if(""!==e){const[n,o]=e.split(/:([^]+)/);n&&o&&(t[n.trim()]=o.trim());}return t}function N$2(e){let t=x$2.get(e);return void 0===t&&(t=w$2(e),x$2.set(e,t)),t}function P$3(o){const l=o.constructor.clone(o);return l.__parent=o.__parent,l.__next=o.__next,l.__prev=o.__prev,$isElementNode(o)&&$isElementNode(l)?(s=o,(r=l).__first=s.__first,r.__last=s.__last,r.__size=s.__size,r.__format=s.__format,r.__indent=s.__indent,r.__dir=s.__dir,r):$isTextNode(o)&&$isTextNode(l)?function(e,t){return e.__format=t.__format,e.__style=t.__style,e.__mode=t.__mode,e.__detail=t.__detail,e}(l,o):$isParagraphNode(o)&&$isParagraphNode(l)?function(e,t){return e.__textFormat=t.__textFormat,e}(l,o):l;var r,s;}function E$2(e,t){const n=e.getStartEndPoints();if(t.isSelected(e)&&!t.isSegmented()&&!t.isToken()&&null!==n){const[l,r]=n,s=e.isBackward(),i=l.getNode(),c=r.getNode(),f=t.is(i),u=t.is(c);if(f||u){const[n,l]=$getCharacterOffsets(e),r=i.is(c),f=t.is(s?c:i),u=t.is(s?i:c);let a,g=0;if(r)g=n>l?l:n,a=n>l?n:l;else if(f){g=s?l:n,a=void 0;}else if(u){g=0,a=s?n:l;}return t.__text=t.__text.slice(g,a),t}}return t}function F$1(e){if("text"===e.type)return e.offset===e.getNode().getTextContentSize();const n=e.getNode();return $isElementNode(n)||y$3(177),e.offset===n.getChildrenSize()}function K$1(n,o,f){let u=o.getNode(),a=f;if($isElementNode(u)){const e=u.getDescendantByIndex(o.offset);null!==e&&(u=e);}for(;a>0&&null!==u;){if($isElementNode(u)){const e=u.getLastDescendant();null!==e&&(u=e);}let f=u.getPreviousSibling(),g=0;if(null===f){let e=u.getParentOrThrow(),t=e.getPreviousSibling();for(;null===t;){if(e=e.getParent(),null===e){f=null;break}t=e.getPreviousSibling();}null!==e&&(g=e.isInline()?0:2,f=t);}let d=u.getTextContent();""===d&&$isElementNode(u)&&!u.isInline()&&(d="\n\n");const p=d.length;if(!$isTextNode(u)||a>=p){const e=u.getParent();u.remove(),null==e||0!==e.getChildrenSize()||$isRootNode(e)||e.remove(),a-=p+g,u=f;}else {const t=u.getKey(),l=n.getEditorState().read((()=>{const n=$getNodeByKey(t);return $isTextNode(n)&&n.isSimpleText()?n.getTextContent():null})),f=p-a,g=d.slice(0,f);if(null!==l&&l!==d){const e=$getPreviousSelection();let t=u;if(u.isSimpleText())u.setTextContent(l);else {const e=$createTextNode(l);u.replace(e),t=e;}if($isRangeSelection(e)&&e.isCollapsed()){const n=e.anchor.offset;t.select(n,n);}}else if(u.isSimpleText()){const e=o.key===t;let n=o.offset;n<a&&(n=p);const l=e?n-a:0,r=e?n:f;if(e&&0===l){const[e]=u.splitText(l,r);e.remove();}else {const[,e]=u.splitText(l,r);e.remove();}}else {const e=$createTextNode(g);u.replace(e);}a=0;}}}function I$2(e){const t=e.getStyle(),n=w$2(t);x$2.set(t,n);}function O$2(e,t){const n=N$2("getStyle"in e?e.getStyle():e.style),o=Object.entries(t).reduce(((e,[t,o])=>(o instanceof Function?e[t]=o(n[t]):null===o?delete e[t]:e[t]=o,e)),{...n}||{}),l=function(e){let t="";for(const n in e)n&&(t+=`${n}: ${e[n]};`);return t}(o);e.setStyle(l),x$2.set(l,o);}function B$2(t,n){const o=t.getNodes(),l=o.length,r=t.getStartEndPoints();if(null===r)return;const[s,i]=r,f=l-1;let u=o[0],a=o[f];if(t.isCollapsed()&&$isRangeSelection(t))return void O$2(t,n);const g=u.getTextContent().length,d=i.offset;let p=s.offset;const h=s.isBefore(i);let _=h?p:d,m=h?d:p;const y=h?s.type:i.type,x=h?i.type:s.type,T=h?i.key:s.key;if($isTextNode(u)&&_===g){const t=u.getNextSibling();$isTextNode(t)&&(p=0,_=0,u=t);}if(1===o.length){if($isTextNode(u)&&u.canHaveFormat()){if(_="element"===y?0:p>d?d:p,m="element"===x?g:p>d?p:d,_===m)return;if(0===_&&m===g)O$2(u,n),u.select(_,m);else {const e=u.splitText(_,m),t=0===_?e[0]:e[1];O$2(t,n),t.select(0,m-_);}}}else {if($isTextNode(u)&&_<u.getTextContentSize()&&u.canHaveFormat()&&(0!==_&&(u=u.splitText(_)[1],_=0,h?s.set(u.getKey(),_,"text"):i.set(u.getKey(),_,"text")),O$2(u,n)),$isTextNode(a)&&a.canHaveFormat()){const e=a.getTextContent().length;a.__key!==T&&0!==m&&(m=e),m!==e&&([a]=a.splitText(m)),0===m&&"element"!==x||O$2(a,n);}for(let t=1;t<f;t++){const l=o[t],r=l.getKey();$isTextNode(l)&&l.canHaveFormat()&&r!==u.getKey()&&r!==a.getKey()&&!l.isToken()&&O$2(l,n);}}}function k$2(e,n){if(null===e)return;const o=e.getStartEndPoints(),l=o?o[0]:null;if(null!==l&&"root"===l.key){const e=n(),t=$getRoot(),o=t.getFirstChild();return void(o?o.replace(e,!0):t.append(e))}const r=e.getNodes(),s=null!==l&&function(e,t){let n=e;for(;null!==n&&null!==n.getParent()&&!t(n);)n=n.getParentOrThrow();return t(n)?n:null}(l.getNode(),X$1);s&&-1===r.indexOf(s)&&r.push(s);for(let e=0;e<r.length;e++){const o=r[e];if(!X$1(o))continue;$isElementNode(o)||y$3(178);const l=n();l.setFormat(o.getFormatType()),l.setIndent(o.getIndent()),o.replace(l,!0);}}function b$1(e){return e.getNode().isAttached()}function z$1(e){let t=e;for(;null!==t&&!$isRootOrShadowRoot(t);){const e=t.getLatest(),n=t.getParent();0===e.getChildrenSize()&&t.remove(!0),t=n;}}function R$3(e,t,n=null){const o=e.getStartEndPoints(),l=o?o[0]:null,r=e.getNodes(),s=r.length;if(null!==l&&(0===s||1===s&&"element"===l.type&&0===l.getNode().getChildrenSize())){const e="text"===l.type?l.getNode().getParentOrThrow():l.getNode(),o=e.getChildren();let r=t();return r.setFormat(e.getFormatType()),r.setIndent(e.getIndent()),o.forEach((e=>r.append(e))),n&&(r=n.append(r)),void e.replace(r)}let i=null,c=[];for(let o=0;o<s;o++){const l=r[o];$isRootOrShadowRoot(l)?(A$2(e,c,c.length,t,n),c=[],i=l):null===i||null!==i&&$hasAncestor(l,i)?c.push(l):(A$2(e,c,c.length,t,n),c=[l]);}A$2(e,c,c.length,t,n);}function A$2(e,n,o,l,r=null){if(0===n.length)return;const i=n[0],f=new Map,a=[];let p=$isElementNode(i)?i:i.getParentOrThrow();p.isInline()&&(p=p.getParentOrThrow());let h=!1;for(;null!==p;){const e=p.getPreviousSibling();if(null!==e){p=e,h=!0;break}if(p=p.getParentOrThrow(),$isRootOrShadowRoot(p))break}const _=new Set;for(let e=0;e<o;e++){const o=n[e];$isElementNode(o)&&0===o.getChildrenSize()&&_.add(o.getKey());}const m=new Set;for(let e=0;e<o;e++){const o=n[e];let r=o.getParent();if(null!==r&&r.isInline()&&(r=r.getParent()),null!==r&&$isLeafNode(o)&&!m.has(o.getKey())){const e=r.getKey();if(void 0===f.get(e)){const n=l();n.setFormat(r.getFormatType()),n.setIndent(r.getIndent()),a.push(n),f.set(e,n),r.getChildren().forEach((e=>{n.append(e),m.add(e.getKey()),$isElementNode(e)&&e.getChildrenKeys().forEach((e=>m.add(e)));})),z$1(r);}}else if(_.has(o.getKey())){$isElementNode(o)||y$3(179);const e=l();e.setFormat(o.getFormatType()),e.setIndent(o.getIndent()),a.push(e),o.remove(!0);}}if(null!==r)for(let e=0;e<a.length;e++){const t=a[e];r.append(t);}let x=null;if($isRootOrShadowRoot(p))if(h)if(null!==r)p.insertAfter(r);else for(let e=a.length-1;e>=0;e--){const t=a[e];p.insertAfter(t);}else {const e=p.getFirstChild();if($isElementNode(e)&&(p=e),null===e)if(r)p.append(r);else for(let e=0;e<a.length;e++){const t=a[e];p.append(t),x=t;}else if(null!==r)e.insertBefore(r);else for(let t=0;t<a.length;t++){const n=a[t];e.insertBefore(n),x=n;}}else if(r)p.insertAfter(r);else for(let e=a.length-1;e>=0;e--){const t=a[e];p.insertAfter(t),x=t;}const T=$getPreviousSelection();$isRangeSelection(T)&&b$1(T.anchor)&&b$1(T.focus)?$setSelection(T.clone()):null!==x?x.selectEnd():e.dirty=!0;}function L$2(e,n){const o=$getAdjacentNode(e.focus,n);return $isDecoratorNode(o)&&!o.isIsolated()||$isElementNode(o)&&!o.isInline()&&!o.canBeEmpty()}function D$2(e,t,n,o){e.modify(t?"extend":"move",n,o);}function M$2(e){const t=e.anchor.getNode();return "rtl"===($isRootNode(t)?t:t.getParentOrThrow()).getDirection()}function H$1(e,t,n){const o=M$2(e);D$2(e,t,n?!o:o,"character");}function $$1(n){const o=n.anchor,l=n.focus,r=o.getNode().getTopLevelElementOrThrow().getParentOrThrow();let s=r.getFirstDescendant(),i=r.getLastDescendant(),c="element",f="element",u=0;$isTextNode(s)?c="text":$isElementNode(s)||null===s||(s=s.getParentOrThrow()),$isTextNode(i)?(f="text",u=i.getTextContentSize()):$isElementNode(i)||null===i||(i=i.getParentOrThrow()),s&&i&&(o.set(s.getKey(),0,c),l.set(i.getKey(),u,f));}function j$1(e,t,n){const o=N$2(e.getStyle());return null!==o&&o[t]||n}function U$1(t,n,o=""){let l=null;const r=t.getNodes(),s=t.anchor,i=t.focus,f=t.isBackward(),u=f?i.offset:s.offset,a=f?i.getNode():s.getNode();if($isRangeSelection(t)&&t.isCollapsed()&&""!==t.style){const e=N$2(t.style);if(null!==e&&n in e)return e[n]}for(let t=0;t<r.length;t++){const s=r[t];if((0===t||0!==u||!s.is(a))&&$isTextNode(s)){const e=j$1(s,n,o);if(null===l)l=e;else if(l!==e){l="";break}}}return null===l?o:l}function X$1(n){if($isDecoratorNode(n))return !1;if(!$isElementNode(n)||$isRootOrShadowRoot(n))return !1;const o=n.getFirstChild(),l=null===o||$isLineBreakNode(o)||$isTextNode(o)||o.isInline();return !n.isInline()&&!1!==n.canBeEmpty()&&l}const q$1=K$1;

var modProd$4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $addNodeStyle: I$2,
    $cloneWithProperties: P$3,
    $getSelectionStyleValueForProperty: U$1,
    $isAtNodeEnd: F$1,
    $isParentElementRTL: M$2,
    $moveCaretSelection: D$2,
    $moveCharacter: H$1,
    $patchStyleText: B$2,
    $selectAll: $$1,
    $setBlocksType: k$2,
    $shouldOverrideDefaultCharacterSelection: L$2,
    $sliceSelectedTextNodeContent: E$2,
    $trimTextContentFromAnchor: K$1,
    $wrapNodes: R$3,
    createDOMRange: v$2,
    createRectsFromDOMRange: C$2,
    getStyleObjectFromCSS: N$2,
    trimTextContentFromAnchor: q$1
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const mod$4 = modProd$4;
const $addNodeStyle = mod$4.$addNodeStyle;
const $cloneWithProperties = mod$4.$cloneWithProperties;
const $moveCharacter = mod$4.$moveCharacter;
const $shouldOverrideDefaultCharacterSelection = mod$4.$shouldOverrideDefaultCharacterSelection;
const $sliceSelectedTextNodeContent = mod$4.$sliceSelectedTextNodeContent;
const createRectsFromDOMRange = mod$4.createRectsFromDOMRange;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function g$1(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var p$1=g$1((function(e){const t=new URLSearchParams;t.append("code",e);for(let e=1;e<arguments.length;e++)t.append("v",arguments[e]);throw Error(`Minified Lexical error #${e}; visit https://lexical.dev/docs/error?${t} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}));const h$1="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,m$1=h$1&&"documentMode"in document?document.documentMode:null,v$1=h$1&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),y$2=h$1&&/^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent),w$1=!(!h$1||!("InputEvent"in window)||m$1)&&"getTargetRanges"in new window.InputEvent("input"),E$1=h$1&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),x$1=h$1&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,P$2=h$1&&/Android/.test(navigator.userAgent),S$2=h$1&&/^(?=.*Chrome).*/i.test(navigator.userAgent),N$1=h$1&&P$2&&S$2,A$1=h$1&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&!S$2;function L$1(...e){const t=[];for(const n of e)if(n&&"string"==typeof n)for(const[e]of n.matchAll(/\S+/g))t.push(e);return t}function b(...e){return ()=>{for(let t=e.length-1;t>=0;t--)e[t]();e.length=0;}}function T$1(e){return `${e}px`}const _$1={attributes:!0,characterData:!0,childList:!0,subtree:!0};function M$1(t,n,o){let r=null,l=null,i=null,s=[];const u=document.createElement("div");function c(){null===r&&p$1(182),null===l&&p$1(183);const{left:i,top:c}=r.getBoundingClientRect(),f=l,a=createRectsFromDOMRange(t,n);u.isConnected||f.append(u);let d=!1;for(let e=0;e<a.length;e++){const t=a[e],n=s[e]||document.createElement("div"),o=n.style;"absolute"!==o.position&&(o.position="absolute",d=!0);const r=T$1(t.left-i);o.left!==r&&(o.left=r,d=!0);const l=T$1(t.top-c);o.top!==l&&(n.style.top=l,d=!0);const f=T$1(t.width);o.width!==f&&(n.style.width=f,d=!0);const g=T$1(t.height);o.height!==g&&(n.style.height=g,d=!0),n.parentNode!==u&&(u.append(n),d=!0),s[e]=n;}for(;s.length>a.length;)s.pop();d&&o(s);}function f(){l=null,r=null,null!==i&&i.disconnect(),i=null,u.remove();for(const e of s)e.remove();s=[];}const a=t.registerRootListener((function e(){const n=t.getRootElement();if(null===n)return f();const o=n.parentElement;if(!(o instanceof HTMLElement))return f();f(),r=n,l=o,i=new MutationObserver((n=>{const o=t.getRootElement(),i=o&&o.parentElement;if(o!==r||i!==l)return e();for(const e of n)if(!u.contains(e.target))return c()})),i.observe(o,_$1),c();}));return ()=>{a(),f();}}function C$1(e,t){let l=null,i=null,s=null,u=null,c=()=>{};function f(f){f.read((()=>{const f=$getSelection();if(!$isRangeSelection(f))return l=null,i=null,s=null,u=null,c(),void(c=()=>{});const{anchor:a,focus:d}=f,g=a.getNode(),h=g.getKey(),m=a.offset,v=d.getNode(),y=v.getKey(),w=d.offset,E=e.getElementByKey(h),x=e.getElementByKey(y),P=null===l||null===E||m!==i||h!==l.getKey()||g!==l&&(!(l instanceof TextNode)||g.updateDOM(l,E,e._config)),S=null===s||null===x||w!==u||y!==s.getKey()||v!==s&&(!(s instanceof TextNode)||v.updateDOM(s,x,e._config));if(P||S){const n=e.getElementByKey(a.getNode().getKey()),o=e.getElementByKey(d.getNode().getKey());if(null!==n&&null!==o&&"SPAN"===n.tagName&&"SPAN"===o.tagName){const r=document.createRange();let l,i,s,u;d.isBefore(a)?(l=o,i=d.offset,s=n,u=a.offset):(l=n,i=a.offset,s=o,u=d.offset);const f=l.firstChild;null===f&&p$1(181);const g=s.firstChild;null===g&&p$1(181),r.setStart(f,i),r.setEnd(g,u),c(),c=M$1(e,r,(e=>{for(const t of e){const e=t.style;"Highlight"!==e.background&&(e.background="Highlight"),"HighlightText"!==e.color&&(e.color="HighlightText"),"-1"!==e.zIndex&&(e.zIndex="-1"),"none"!==e.pointerEvents&&(e.pointerEvents="none"),e.marginTop!==T$1(-1.5)&&(e.marginTop=T$1(-1.5)),e.paddingTop!==T$1(4)&&(e.paddingTop=T$1(4)),e.paddingBottom!==T$1(0)&&(e.paddingBottom=T$1(0));}void 0!==t&&t(e);}));}}l=g,i=m,s=v,u=w;}));}return f(e.getEditorState()),b(e.registerUpdateListener((({editorState:e})=>f(e))),c,(()=>{c();}))}const B$1=w$1,K=h$1,O$1=P$2,R$2=N$1,I$1=v$1,D$1=A$1,H=S$2,z=y$2,k$1=x$1,F=E$1;function $(e,...t){const n=L$1(...t);n.length>0&&e.classList.add(...n);}function U(e,...t){const n=L$1(...t);n.length>0&&e.classList.remove(...n);}function W$1(e,t){for(const n of t)if(e.type.startsWith(n))return !0;return !1}function j(e,t){const n=e[Symbol.iterator]();return new Promise(((e,o)=>{const r=[],l=()=>{const{done:i,value:s}=n.next();if(i)return e(r);const u=new FileReader;u.addEventListener("error",o),u.addEventListener("load",(()=>{const e=u.result;"string"==typeof e&&r.push({file:s,result:e}),l();})),W$1(s,t)?u.readAsDataURL(s):l();};l();}))}function V(e,t){const n=[],o=(e||$getRoot()).getLatest(),r=t||$isElementNode(o)&&o.getLastDescendant()||o;let s=o,u=function(e){let t=e,n=0;for(;null!==(t=t.getParent());)n++;return n}(s);for(;null!==s&&!s.is(r);)if(n.push({depth:u,node:s}),$isElementNode(s)&&s.getChildrenSize()>0)s=s.getFirstChild(),u++;else {let e=null;for(;null===e&&null!==s;)e=s.getNextSibling(),null===e?(s=s.getParent(),u--):s=e;}return null!==s&&s.is(r)&&n.push({depth:u,node:s}),n}function q(e){let t=e;if($isElementNode(t)&&t.getChildrenSize()>0)t=t.getLastChild();else {let e=null;for(;null===e&&null!==t;)e=t.getPreviousSibling(),t=null===e?t.getParent():e;}return t}function G(e,t){let n=e;for(;null!=n;){if(n instanceof t)return n;n=n.getParent();}return null}function J(e){const t=Q(e,(e=>$isElementNode(e)&&!e.isInline()));return $isElementNode(t)||p$1(4,e.__key),t}const Q=(e,t)=>{let n=e;for(;n!==$getRoot()&&null!=n;){if(t(n))return n;n=n.getParent();}return null};function X(e,t,n,o){const r=e=>e instanceof t;return e.registerNodeTransform(t,(e=>{const t=(e=>{const t=e.getChildren();for(let e=0;e<t.length;e++){const n=t[e];if(r(n))return null}let n=e,o=e;for(;null!==n;)if(o=n,n=n.getParent(),r(n))return {child:o,parent:n};return null})(e);if(null!==t){const{child:r,parent:l}=t;if(r.is(e)){o(l,e);const t=r.getNextSiblings(),i=t.length;if(l.insertAfter(r),0!==i){const e=n(l);r.insertAfter(e);for(let n=0;n<i;n++)e.append(t[n]);}l.canBeEmpty()||0!==l.getChildrenSize()||l.remove();}}}))}function Y(e,n){const o=new Map,r=e._pendingEditorState;for(const[e,r]of n._nodeMap){const n=$cloneWithProperties(r);$isTextNode(n)&&($isTextNode(r)||p$1(180),n.__text=r.__text),o.set(e,n);}r&&(r._nodeMap=o),e._dirtyType=2;const l=n._selection;$setSelection(null===l?null:l.clone());}function Z(e){const t=$getSelection()||$getPreviousSelection();if($isRangeSelection(t)){const{focus:n}=t,o=n.getNode(),r=n.offset;if($isRootOrShadowRoot(o)){const t=o.getChildAtIndex(r);null==t?o.append(e):t.insertBefore(e),e.selectNext();}else {let t,n;$isTextNode(o)?(t=o.getParentOrThrow(),n=o.getIndexWithinParent(),r>0&&(n+=1,o.splitText(r))):(t=o,n=r);const[,l]=$splitNode(t,n);l.insertBefore(e),l.selectStart();}}else {if(null!=t){const n=t.getNodes();n[n.length-1].getTopLevelElementOrThrow().insertAfter(e);}else {$getRoot().append(e);}const n=$createParagraphNode();e.insertAfter(n),n.select();}return e.getLatest()}function ee(e,t){const n=t();return e.replace(n),n.append(e),n}function te(e,t){return null!==e&&Object.getPrototypeOf(e).constructor.name===t.name}function ne(e,t){const n=[];for(let o=0;o<e.length;o++){const r=t(e[o]);null!==r&&n.push(r);}return n}function oe(e,t){const n=e.getFirstChild();null!==n?n.insertBefore(t):e.append(t);}function re(e){if(z)return 1;let t=1;for(;e;)t*=Number(window.getComputedStyle(e).getPropertyValue("zoom")),e=e.parentElement;return t}function le(e){return null!==e._parentEditor}

var modProd$3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $dfs: V,
    $filter: ne,
    $findMatchingParent: Q,
    $getNearestBlockElementAncestorOrThrow: J,
    $getNearestNodeOfType: G,
    $getNextRightPreorderNode: q,
    $insertFirst: oe,
    $insertNodeToNearestRoot: Z,
    $isEditorIsNestedEditor: le,
    $restoreEditorState: Y,
    $splitNode: $splitNode,
    $wrapNodeInElement: ee,
    CAN_USE_BEFORE_INPUT: B$1,
    CAN_USE_DOM: K,
    IS_ANDROID: O$1,
    IS_ANDROID_CHROME: R$2,
    IS_APPLE: I$1,
    IS_APPLE_WEBKIT: D$1,
    IS_CHROME: H,
    IS_FIREFOX: z,
    IS_IOS: k$1,
    IS_SAFARI: F,
    addClassNamesToElement: $,
    calculateZoomLevel: re,
    isBlockDomNode: isBlockDomNode$1,
    isHTMLAnchorElement: isHTMLAnchorElement,
    isHTMLElement: isHTMLElement$1,
    isInlineDomNode: isInlineDomNode,
    isMimeType: W$1,
    markSelection: C$1,
    mediaFileReader: j,
    mergeRegister: b,
    objectKlassEquals: te,
    positionNodeOnRange: M$1,
    registerNestedElementResolver: X,
    removeClassNamesFromElement: U
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const mod$3 = modProd$3;
const isBlockDomNode = mod$3.isBlockDomNode;
const isHTMLElement = mod$3.isHTMLElement;
const mergeRegister = mod$3.mergeRegister;
const objectKlassEquals = mod$3.objectKlassEquals;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function d(e,n){const t=n.body?n.body.childNodes:[];let o=[];const l=[];for(let n=0;n<t.length;n++){const r=t[n];if(!m.has(r.nodeName)){const n=g(r,e,l,!1);null!==n&&(o=o.concat(n));}}return function(e){for(const n of e)n.getNextSibling()instanceof ArtificialNode__DO_NOT_USE&&n.insertAfter($createLineBreakNode());for(const n of e){const e=n.getChildren();for(const t of e)n.insertBefore(t);n.remove();}}(l),o}function h(e,n){if("undefined"==typeof document||"undefined"==typeof window&&void 0===global.window)throw new Error("To use $generateHtmlFromNodes in headless mode please initialize a headless browser implementation such as JSDom before calling this function.");const t=document.createElement("div"),o=$getRoot().getChildren();for(let l=0;l<o.length;l++){p(e,o[l],t,n);}return t.innerHTML}function p(o,l,s,c=null){let u=null===c||l.isSelected(c);const f=$isElementNode(l)&&l.excludeFromCopy("html");let a=l;if(null!==c){let t=$cloneWithProperties(l);t=$isTextNode(t)&&null!==c?$sliceSelectedTextNodeContent(c,t):t,a=t;}const d=$isElementNode(a)?a.getChildren():[],h=o._nodes.get(a.getType());let m;m=h&&void 0!==h.exportDOM?h.exportDOM(o,a):a.exportDOM(o);const{element:g,after:y}=m;if(!g)return !1;const w=document.createDocumentFragment();for(let e=0;e<d.length;e++){const n=d[e],t=p(o,n,w,c);!u&&$isElementNode(l)&&t&&l.extractWithChild(n,c,"html")&&(u=!0);}if(u&&!f){if(isHTMLElement(g)&&g.append(w),s.append(g),y){const e=y.call(a,g);e&&g.replaceWith(e);}}else s.append(w);return u}const m=new Set(["STYLE","SCRIPT"]);function g(e,n,t,l,i=new Map,f){let d=[];if(m.has(e.nodeName))return d;let h=null;const p=function(e,n){const{nodeName:t}=e,o=n._htmlConversions.get(t.toLowerCase());let l=null;if(void 0!==o)for(const n of o){const t=n(e);null!==t&&(null===l||(l.priority||0)<(t.priority||0))&&(l=t);}return null!==l?l.conversion:null}(e,n),w=p?p(e):null;let x=null;if(null!==w){x=w.after;const n=w.node;if(h=Array.isArray(n)?n[n.length-1]:n,null!==h){for(const[,e]of i)if(h=e(h,f),!h)break;h&&d.push(...Array.isArray(n)?n:[h]);}null!=w.forChild&&i.set(e.nodeName,w.forChild);}const C=e.childNodes;let N=[];const b=(null==h||!$isRootOrShadowRoot(h))&&(null!=h&&$isBlockElementNode(h)||l);for(let e=0;e<C.length;e++)N.push(...g(C[e],n,t,b,new Map(i),h));return null!=x&&(N=x(N)),isBlockDomNode(e)&&(N=y$1(e,N,b?()=>{const e=new ArtificialNode__DO_NOT_USE;return t.push(e),e}:$createParagraphNode)),null==h?d=d.concat(N):$isElementNode(h)&&h.append(...N),d}function y$1(e,n,t){const o=e.style.textAlign,l=[];let r=[];for(let e=0;e<n.length;e++){const i=n[e];if($isBlockElementNode(i))o&&!i.getFormat()&&i.setFormat(o),l.push(i);else if(r.push(i),e===n.length-1||e<n.length-1&&$isBlockElementNode(n[e+1])){const e=t();e.setFormat(o),e.append(...r),l.push(e),r=[];}}return l}

var modProd$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $generateHtmlFromNodes: h,
    $generateNodesFromDOM: d
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const mod$2 = modProd$2;
const $generateHtmlFromNodes = mod$2.$generateHtmlFromNodes;
const $generateNodesFromDOM = mod$2.$generateNodesFromDOM;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function x(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var w=x((function(t){const e=new URLSearchParams;e.append("code",t);for(let t=1;t<arguments.length;t++)e.append("v",arguments[t]);throw Error(`Minified Lexical error #${t}; visit https://lexical.dev/docs/error?${e} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}));const y="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,v=t=>y?(t||window).getSelection():null;function D(e){const n=$getSelection();return null==n&&w(166),$isRangeSelection(n)&&n.isCollapsed()||0===n.getNodes().length?"":$generateHtmlFromNodes(e,n)}function C(t){const e=$getSelection();return null==e&&w(166),$isRangeSelection(e)&&e.isCollapsed()||0===e.getNodes().length?null:JSON.stringify(A(t,e))}function N(t,e){const n=t.getData("text/plain")||t.getData("text/uri-list");null!=n&&e.insertRawText(n);}function _(t,n,o){const l=t.getData("application/x-lexical-editor");if(l)try{const t=JSON.parse(l);if(t.namespace===o._config.namespace&&Array.isArray(t.nodes)){return T(o,R$1(t.nodes),n)}}catch(t){}const r=t.getData("text/html");if(r)try{const t=(new DOMParser).parseFromString(r,"text/html");return T(o,$generateNodesFromDOM(o,t),n)}catch(t){}const c=t.getData("text/plain")||t.getData("text/uri-list");if(null!=c)if($isRangeSelection(n)){const t=c.split(/(\r?\n|\t)/);""===t[t.length-1]&&t.pop();for(let e=0;e<t.length;e++){const n=$getSelection();if($isRangeSelection(n)){const o=t[e];"\n"===o||"\r\n"===o?n.insertParagraph():"\t"===o?n.insertNodes([$createTabNode()]):n.insertText(o);}}}else n.insertRawText(c);}function T(t,e,n){t.dispatchCommand(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,{nodes:e,selection:n})||n.insertNodes(e);}function S$1(t,e,n,r=[]){let i=null===e||n.isSelected(e);const s=$isElementNode(n)&&n.excludeFromCopy("html");let a=n;if(null!==e){let t=$cloneWithProperties(n);t=$isTextNode(t)&&null!==e?$sliceSelectedTextNodeContent(e,t):t,a=t;}const c=$isElementNode(a)?a.getChildren():[],u=function(t){const e=t.exportJSON(),n=t.constructor;if(e.type!==n.getType()&&w(58,n.name),$isElementNode(t)){const t=e.children;Array.isArray(t)||w(59,n.name);}return e}(a);if($isTextNode(a)){const t=a.__text;t.length>0?u.text=t:i=!1;}for(let o=0;o<c.length;o++){const l=c[o],r=S$1(t,e,l,u.children);!i&&$isElementNode(n)&&r&&n.extractWithChild(l,e,"clone")&&(i=!0);}if(i&&!s)r.push(u);else if(Array.isArray(u.children))for(let t=0;t<u.children.length;t++){const e=u.children[t];r.push(e);}return i}function A(t,e){const n=[],o=$getRoot().getChildren();for(let l=0;l<o.length;l++){S$1(t,e,o[l],n);}return {namespace:t._config.namespace,nodes:n}}function R$1(t){const e=[];for(let o=0;o<t.length;o++){const l=t[o],r=$parseSerializedNode(l);$isTextNode(r)&&$addNodeStyle(r),e.push(r);}return e}let E=null;async function O(t,e){if(null!==E)return !1;if(null!==e)return new Promise(((n,o)=>{t.update((()=>{n(P$1(t,e));}));}));const n=t.getRootElement(),o=null==t._window?window.document:t._window.document,l=v(t._window);if(null===n||null===l)return !1;const i=o.createElement("span");i.style.cssText="position: fixed; top: -1000px;",i.append(o.createTextNode("#")),n.append(i);const s=new Range;return s.setStart(i,0),s.setEnd(i,1),l.removeAllRanges(),l.addRange(s),new Promise(((e,n)=>{const l=t.registerCommand(COPY_COMMAND,(n=>(objectKlassEquals(n,ClipboardEvent)&&(l(),null!==E&&(window.clearTimeout(E),E=null),e(P$1(t,n))),!0)),COMMAND_PRIORITY_CRITICAL);E=window.setTimeout((()=>{l(),E=null,e(!1);}),50),o.execCommand("copy"),i.remove();}))}function P$1(t,e){const n=v(t._window);if(!n)return !1;const o=n.anchorNode,l=n.focusNode;if(null!==o&&null!==l&&!isSelectionWithinEditor(t,o,l))return !1;e.preventDefault();const r=e.clipboardData,s=$getSelection();if(null===r||null===s)return !1;const a=D(t),c=C(t);let u="";return null!==s&&(u=s.getTextContent()),null!==a&&r.setData("text/html",a),null!==c&&r.setData("application/x-lexical-editor",c),r.setData("text/plain",u),!0}

var modProd$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $generateJSONFromSelectedNodes: A,
    $generateNodesFromSerializedNodes: R$1,
    $getHtmlContent: D,
    $getLexicalContent: C,
    $insertDataTransferForPlainText: N,
    $insertDataTransferForRichText: _,
    $insertGeneratedNodes: T,
    copyToClipboard: O
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const mod$1 = modProd$1;
const $getHtmlContent = mod$1.$getHtmlContent;
const $insertDataTransferForPlainText = mod$1.$insertDataTransferForPlainText;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const L="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,M=L&&"documentMode"in document?document.documentMode:null,P=!(!L||!("InputEvent"in window)||M)&&"getTargetRanges"in new window.InputEvent("input"),S=L&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),k=L&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,B=L&&/^(?=.*Chrome).*/i.test(navigator.userAgent),I=L&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&!B;function W(e,n){n.update((()=>{if(null!==e){const r=objectKlassEquals(e,KeyboardEvent)?null:e.clipboardData,o=$getSelection();if(null!==o&&null!=r){e.preventDefault();const i=$getHtmlContent(n);null!==i&&r.setData("text/html",i),r.setData("text/plain",o.getTextContent());}}}));}function R(t){return mergeRegister(t.registerCommand(DELETE_CHARACTER_COMMAND,(e=>{const t=$getSelection();return !!$isRangeSelection(t)&&(t.deleteCharacter(e),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(DELETE_WORD_COMMAND,(e=>{const t=$getSelection();return !!$isRangeSelection(t)&&(t.deleteWord(e),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(DELETE_LINE_COMMAND,(e=>{const t=$getSelection();return !!$isRangeSelection(t)&&(t.deleteLine(e),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(CONTROLLED_TEXT_INSERTION_COMMAND,(t=>{const n=$getSelection();if(!$isRangeSelection(n))return !1;if("string"==typeof t)n.insertText(t);else {const r=t.dataTransfer;if(null!=r)$insertDataTransferForPlainText(r,n);else {const e=t.data;e&&n.insertText(e);}}return !0}),COMMAND_PRIORITY_EDITOR),t.registerCommand(REMOVE_TEXT_COMMAND,(()=>{const e=$getSelection();return !!$isRangeSelection(e)&&(e.removeText(),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(INSERT_LINE_BREAK_COMMAND,(e=>{const t=$getSelection();return !!$isRangeSelection(t)&&(t.insertLineBreak(e),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(INSERT_PARAGRAPH_COMMAND,(()=>{const e=$getSelection();return !!$isRangeSelection(e)&&(e.insertLineBreak(),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(KEY_ARROW_LEFT_COMMAND,(e=>{const t=$getSelection();if(!$isRangeSelection(t))return !1;const o=e,i=o.shiftKey;return !!$shouldOverrideDefaultCharacterSelection(t,!0)&&(o.preventDefault(),$moveCharacter(t,i,!0),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(KEY_ARROW_RIGHT_COMMAND,(e=>{const t=$getSelection();if(!$isRangeSelection(t))return !1;const o=e,i=o.shiftKey;return !!$shouldOverrideDefaultCharacterSelection(t,!1)&&(o.preventDefault(),$moveCharacter(t,i,!1),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(KEY_BACKSPACE_COMMAND,(e=>{const n=$getSelection();return !!$isRangeSelection(n)&&(e.preventDefault(),t.dispatchCommand(DELETE_CHARACTER_COMMAND,!0))}),COMMAND_PRIORITY_EDITOR),t.registerCommand(KEY_DELETE_COMMAND,(e=>{const n=$getSelection();return !!$isRangeSelection(n)&&(e.preventDefault(),t.dispatchCommand(DELETE_CHARACTER_COMMAND,!1))}),COMMAND_PRIORITY_EDITOR),t.registerCommand(KEY_ENTER_COMMAND,(e=>{const n=$getSelection();if(!$isRangeSelection(n))return !1;if(null!==e){if((k||S||I)&&P)return !1;e.preventDefault();}return t.dispatchCommand(INSERT_LINE_BREAK_COMMAND,!1)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(SELECT_ALL_COMMAND,(()=>($selectAll(),!0)),COMMAND_PRIORITY_EDITOR),t.registerCommand(COPY_COMMAND,(e=>{const n=$getSelection();return !!$isRangeSelection(n)&&(W(e,t),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(CUT_COMMAND,(e=>{const n=$getSelection();return !!$isRangeSelection(n)&&(function(e,t){W(e,t),t.update((()=>{const e=$getSelection();$isRangeSelection(e)&&e.removeText();}));}(e,t),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(PASTE_COMMAND,(n=>{const r=$getSelection();return !!$isRangeSelection(r)&&(function(t,n){t.preventDefault(),n.update((()=>{const n=$getSelection(),{clipboardData:r}=t;null!=r&&$isRangeSelection(n)&&$insertDataTransferForPlainText(r,n);}),{tag:"paste"});}(n,t),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(DROP_COMMAND,(e=>{const t=$getSelection();return !!$isRangeSelection(t)&&(e.preventDefault(),!0)}),COMMAND_PRIORITY_EDITOR),t.registerCommand(DRAGSTART_COMMAND,(e=>{const t=$getSelection();return !!$isRangeSelection(t)&&(e.preventDefault(),!0)}),COMMAND_PRIORITY_EDITOR))}

var modProd = /*#__PURE__*/Object.freeze({
    __proto__: null,
    registerPlainText: R
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const mod = modProd;
const registerPlainText = mod.registerPlainText;

/**
 * MVP version of the function
 *
 * Converts a pattern to a string.
 * @param props.pattern The pattern to convert to a string.
 * @returns The pattern as a string.
 *
 * @example
 * patternToString({ pattern: [{ value: "Hello" }, { type: "expression", arg: { type: "variable-reference", name: "name" } }] }) -> "Hello {name}"
 */
const patternToString = (props) => {
    if (!props.pattern) {
        return "";
    }
    return props.pattern
        .map((p) => {
        if ("value" in p) {
            return p.value;
        }
        else if (p.type === "expression" &&
            p.arg.type === "variable-reference") {
            return `{${p.arg.name}}`;
        }
        return "";
    })
        .join("");
};

/**
 * MVP version of the function
 *
 * Converts a string to a pattern.
 * @param props.text The text to convert to a pattern.
 * @returns The pattern of the text.
 *
 * @example
 * stringToPattern({ text: "Hello {name}" }) -> [{ value: "Hello" }, { type: "expression", arg: { type: "variable-reference", name: "name" } }]
 */
const stringToPattern = (props) => {
    const pattern = [];
    const regex = /{(.*?)}/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(props.text)) !== null) {
        // Add text node for text before the variable
        if (match.index > lastIndex) {
            pattern.push({
                type: "text",
                value: props.text.slice(lastIndex, match.index),
            });
        }
        // Add variable node
        if (match[1]) {
            pattern.push({
                type: "expression",
                arg: {
                    type: "variable-reference",
                    name: match[1],
                },
            });
            lastIndex = regex.lastIndex;
        }
    }
    // Add remaining text node after the last variable
    if (lastIndex < props.text.length) {
        pattern.push({
            type: "text",
            value: props.text.slice(lastIndex),
        });
    }
    return pattern;
};

var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
//editor config
const config = {
    namespace: "MyEditor",
    onError: console.error,
};
let InlangPatternEditor = class InlangPatternEditor extends r$4 {
    constructor() {
        super(...arguments);
        // refs
        this.contentEditableElementRef = e$2();
        // create editor
        this.editor = createEditor(config);
        // set editor state
        this._setEditorState = () => {
            // remove text content listener
            this._removeTextContentListener?.();
            // override pattern state
            this._patternState = this.variant?.pattern;
            //update editor
            this.editor.update(() => {
                const root = $getRoot();
                if (root.getChildren().length === 0) {
                    const paragraphNode = $createParagraphNode();
                    const textNode = $createTextNode(this.variant?.pattern
                        ? patternToString({ pattern: this.variant?.pattern })
                        : "");
                    paragraphNode.append(textNode);
                    root.append(paragraphNode);
                }
                else {
                    const paragraphNode = root.getChildren()[0];
                    paragraphNode.remove();
                    const newpParagraphNode = $createParagraphNode();
                    const textNode = $createTextNode(this.variant?.pattern
                        ? patternToString({ pattern: this.variant?.pattern })
                        : "");
                    newpParagraphNode.append(textNode);
                    root.append(newpParagraphNode);
                }
            }, {
                discrete: true,
            });
            // readd text content listener
            this._removeTextContentListener = this.editor.registerTextContentListener((textContent) => {
                this._handleListenToTextContent(textContent);
            });
        };
        this._handleListenToTextContent = (textContent) => {
            this._patternState = stringToPattern({ text: textContent });
            this.dispatchEvent(createChangeEvent({
                entityId: this.variant.id,
                entity: "variant",
                newData: { ...this.variant, pattern: this._patternState },
            }));
        };
    }
    //disable shadow root -> because of contenteditable selection API
    createRenderRoot() {
        return this;
    }
    // update editor state when variant prop changes
    updated(changedProperties) {
        if (changedProperties.has("variant") &&
            JSON.stringify(this.variant?.pattern) !==
                JSON.stringify(this._patternState)) {
            this._setEditorState();
        }
    }
    async firstUpdated() {
        // initialize editor
        const contentEditableElement = this.contentEditableElementRef.value;
        if (contentEditableElement) {
            // set root element of editor and register plain text
            this.editor.setRootElement(contentEditableElement);
            registerPlainText(this.editor);
            // listen to text content changes and dispatch `change` event
            this._removeTextContentListener = this.editor.registerTextContentListener((textContent) => {
                this._handleListenToTextContent(textContent);
            });
            contentEditableElement.addEventListener("focus", () => {
                const onPatternEditorFocus = new CustomEvent("pattern-editor-focus");
                this.dispatchEvent(onPatternEditorFocus);
            });
            contentEditableElement.addEventListener("blur", () => {
                const onPatternEditorBlur = new CustomEvent("pattern-editor-blur");
                this.dispatchEvent(onPatternEditorBlur);
            });
        }
    }
    render() {
        return x$4 `
      <style>
        div {
          box-sizing: border-box;
          font-size: 14px;
        }
        p {
          margin: 0;
        }
        inlang-pattern-editor {
          width: 100%;
        }
        .inlang-pattern-editor-wrapper {
          min-height: 44px;
          width: 100%;
          position: relative;
        }
        .inlang-pattern-editor-wrapper:focus-within {
          z-index: 1;
        }
        .inlang-pattern-editor-contenteditable {
          background-color: #ffffff;
          padding: 14px 12px;
          min-height: 44px;
          width: 100%;
          color: #242424;
          outline: none;
        }
        .inlang-pattern-editor-contenteditable:focus {
          box-shadow: 0 0 0 var(--sl-focus-ring-width)
            var(--sl-input-focus-ring-color);
        }
        .inlang-pattern-editor-contenteditable:hover {
          background-color: #f9f9f9;
          color: #000;
        }
        .inlang-pattern-editor-placeholder {
          opacity: 0.5;
          position: absolute;
          top: 14px;
          left: 12px;
          font-size: 14px;
          font-weight: 500;
          pointer-events: none;
          font-family: var(--sl-font-sans);
        }
      </style>
      <div class="inlang-pattern-editor-wrapper">
        <div
          class="inlang-pattern-editor-contenteditable"
          contenteditable
          ${n$1(this.contentEditableElementRef)}
        ></div>
        ${this._patternState === undefined ||
            this._patternState.length === 0 ||
            (this._patternState.length === 1 &&
                this._patternState[0].value
                    .length === 0)
            ? x$4 `<p class="inlang-pattern-editor-placeholder">
              Enter pattern ...
            </p>`
            : ""}
      </div>
    `;
    }
};
__decorate$2([
    n$4({ type: Object })
], InlangPatternEditor.prototype, "variant", void 0);
__decorate$2([
    r$2()
], InlangPatternEditor.prototype, "_patternState", void 0);
InlangPatternEditor = __decorate$2([
    t$2("inlang-pattern-editor")
], InlangPatternEditor);

var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-button"))
    customElements.define("sl-button", SlButton);
let InlangBundleAction = class InlangBundleAction extends r$4 {
    static { this.styles = [
        baseStyling,
        i$6 `
      div {
        box-sizing: border-box;
        font-size: 13px;
      }
      sl-button::part(base) {
        color: var(--sl-input-color);
        background-color: var(--sl-input-background-color);
        border: 1px solid var(--sl-input-border-color);
        border-radius: 4px;
        font-size: 13px;
      }
      sl-button::part(base):hover {
        color: var(--sl-input-color-hover);
        background-color: var(--sl-input-background-color-hover);
        border: 1px solid var(--sl-input-border-color-hover);
      }
    `,
    ]; }
    render() {
        return x$4 `<sl-menu-item>${this.actionTitle}</sl-menu-item>`;
    }
};
__decorate$1([
    n$4()
], InlangBundleAction.prototype, "actionTitle", void 0);
InlangBundleAction = __decorate$1([
    t$2("inlang-bundle-action")
], InlangBundleAction);

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!customElements.get("sl-dropdown"))
    customElements.define("sl-dropdown", SlDropdown);
if (!customElements.get("sl-select"))
    customElements.define("sl-select", SlSelect);
if (!customElements.get("sl-input"))
    customElements.define("sl-input", SlInput);
if (!customElements.get("sl-option"))
    customElements.define("sl-option", SlOption);
if (!customElements.get("sl-button"))
    customElements.define("sl-button", SlButton);
if (!customElements.get("sl-tooltip"))
    customElements.define("sl-tooltip", SlTooltip);
let InlangAddSelector = class InlangAddSelector extends r$4 {
    constructor() {
        super(...arguments);
        this._getPluralCategories = () => {
            return this.message?.locale
                ? [
                    ...new Intl.PluralRules(this.message.locale).resolvedOptions()
                        .pluralCategories,
                    "*",
                ]
                : undefined;
        };
        this._getAvailablevariables = () => {
            const variables = [];
            for (const declaration of this.bundle.declarations) {
                if (!variables.some((d) => d.name === declaration.name)) {
                    variables.push(declaration);
                }
            }
            return variables;
        };
        this._handleAddSelector = (newMatchers) => {
            if (this._variable && this.message) {
                // get variant matcher
                const message = structuredClone(this.message);
                const variants = structuredClone(this.variants);
                const _variantsMatcher = (message ? variants : [])?.map((variant) => variant.matches);
                // Step 1 | add selector to message
                this._updateSelector();
                // Step 2 | add "*" to existing variants
                this._addMatchToExistingVariants();
                // Step 3 | get newCombinations and add new variants
                const newCombinations = this._generateNewMatcherCombinations({
                    variantsMatcher: _variantsMatcher,
                    newMatchers: newMatchers,
                    newSelectorName: this._variable.name,
                });
                this._addVariantsFromNewCombinations(newCombinations);
                this.dispatchEvent(new CustomEvent("submit"));
            }
        };
        this._updateSelector = () => {
            if (this.message && this._variable) {
                this.message.selectors.push({
                    type: "variable-reference",
                    name: this._variable.name,
                });
                this.dispatchEvent(createChangeEvent({
                    entityId: this.message.id,
                    entity: "message",
                    newData: this.message,
                }));
            }
        };
        this._addMatchToExistingVariants = () => {
            if (this.message && this._variable && this.variants) {
                for (const variant of this.variants) {
                    const newVariant = structuredClone(variant);
                    newVariant.matches.push({
                        type: "catchall-match",
                        key: this._variable.name,
                    });
                    this.dispatchEvent(createChangeEvent({
                        entityId: newVariant.id,
                        entity: "variant",
                        newData: newVariant,
                    }));
                }
            }
        };
        // TODO verify if this is needed from UX perspective.
        this._addVariantsFromNewCombinations = (newCombinations) => {
            if (this.message) {
                for (const combination of newCombinations) {
                    const newVariant = {
                        id: v7(),
                        pattern: [],
                        messageId: this.message.id,
                        matches: combination,
                    };
                    this.dispatchEvent(createChangeEvent({
                        entityId: newVariant.id,
                        entity: "variant",
                        newData: newVariant,
                    }));
                }
            }
        };
        this._generateNewMatcherCombinations = (props) => {
            const newMatchers = props.newMatchers.filter((category) => category !== "*");
            const newCombinations = [];
            // Loop over each variant matcher (current combinations)
            for (const variantMatcher of props.variantsMatcher) {
                // Now we generate new combinations by replacing the wildcard (*) with each new matcher
                for (const newMatch of newMatchers) {
                    if (variantMatcher) {
                        const newCombination = [
                            ...variantMatcher,
                            {
                                type: "literal-match",
                                key: props.newSelectorName,
                                value: newMatch,
                            },
                        ];
                        newCombinations.push(newCombination);
                    }
                }
            }
            return newCombinations;
        };
    }
    static { this.styles = [
        baseStyling,
        i$6 `
      .button-wrapper {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dropdown-container {
        font-size: 14px;
        width: full;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .dropdown-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--sl-input-color);
        font-size: 12px;
      }
      .dropdown-title {
        font-size: 14px;
        font-weight: 500;
        margin: 6px 0;
      }
      .add-input::part(base) {
        color: var(--sl-color-neutral-500);
      }
      .add-input::part(base):hover {
        background-color: var(--sl-input-background-color-hover);
        color: var(--sl-input-color-hover);
      }
      sl-select::part(form-control-label) {
        font-size: 14px;
      }
      sl-select::part(display-input) {
        font-size: 14px;
      }
      sl-option::part(label) {
        font-size: 14px;
      }
      sl-menu-item::part(label) {
        font-size: 14px;
        padding-left: 12px;
      }
      sl-menu-item::part(base) {
        color: var(--sl-input-color);
      }
      sl-menu-item::part(base):hover {
        background-color: var(--sl-input-background-color-hover);
      }
      sl-menu-item::part(checked-icon) {
        display: none;
      }
      .options-title {
        font-size: 14px;
        color: var(--sl-input-color);
        background-color: var(--sl-input-background-color);
        margin: 0;
        padding-bottom: 4px;
      }
      .options-wrapper {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        margin-top: 4px;
      }
      .option {
        width: 100%;
      }
      .option::part(base) {
        background-color: var(--sl-input-background-color-hover);
        border-radius: var(--sl-input-border-radius-small);
      }
      .option {
        width: 100%;
        background-color: var(--sl-input-background-color-hover);
      }
      .delete-icon {
        color: var(--sl-color-neutral-400);
        cursor: pointer;
      }
      .delete-icon:hover {
        color: var(--sl-input-color-hover);
      }
      .help-text {
        display: flex;
        gap: 8px;
        color: var(--sl-input-help-text-color);
      }
      .help-text p {
        flex: 1;
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
      }
      .empty-image {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 12px;
      }
      .actions {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .actions.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
      sl-input::part(base) {
        font-size: 14px;
      }
      .add-selector::part(base) {
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .add-selector::part(base):hover {
        background-color: var(--sl-input-background-color-hover);
        color: var(--sl-input-color-hover);
        border: 1px solid var(--sl-input-border-color-hover);
      }
      .no-variable-available-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px;
        padding-top: 24px;
        background-color: var(--sl-input-background-color-hover);
        border: 1px solid var(--sl-input-border-color);
        border-radius: var(--sl-input-border-radius-small);
        color: var(--sl-input-color);
      }
    `,
    ]; }
    updated(changedProperties) {
        if (changedProperties.has("bundle") &&
            JSON.stringify(this.bundle.declarations) !==
                JSON.stringify(this._oldDeclarations)) {
            //check if bundle.declarations has changed
            this._oldDeclarations = this.bundle.declarations;
            this._variable = this._getAvailablevariables()?.[0];
        }
        if (changedProperties.has("message")) {
            //check if message has changed
            this._matchers = this._getPluralCategories() || ["*"];
        }
    }
    async firstUpdated() {
        await this.updateComplete;
        this._variable = this._getAvailablevariables()?.[0];
        this._matchers = this._getPluralCategories() || ["*"];
    }
    render() {
        return x$4 `
			<div class="dropdown-container">
				${this._variable && this._variable.name.length > 0
            ? x$4 `<div class="dropdown-item">
					<div class="dropdown-header">
							<p class="dropdown-title">Input</p>
						</div>
						<sl-select
							@sl-change=${(e) => {
                const inputElement = e.target;
                this._variable = this._getAvailablevariables()?.find((input) => input.name === inputElement.value);
            }}
							size="medium"
							value=${this._variable.name || this._getAvailablevariables()?.[0]?.name}
						>
							${this._getAvailablevariables() &&
                this._getAvailablevariables().map((input) => {
                    return x$4 `<sl-option value=${input.name}
                    >${input.name}</sl-option
                  >`;
                })}
						</sl-select>
					</div> 
				</div>`
            : x$4 `<div class="dropdown-item">
                <div class="no-variable-available-card">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      fill-rule="evenodd"
                      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10m-4.906-3.68L18.32 7.094A8 8 0 0 1 7.094 18.32M5.68 16.906A8 8 0 0 1 16.906 5.68z"
                    />
                  </svg>
                  <p>
                    No variable present. Add a new variable to create a
                    selector.
                  </p>
                </div>
              </div>`}
					${this._variable && this._variable.type === "local-variable"
            ? x$4 `<div class="options-container">
                    <div class="dropdown-header">
                      <p class="dropdown-title">Match</p>
                      <sl-tooltip content="Add a match to this selector">
                        <sl-button
                          class="add-input"
                          variant="text"
                          size="small"
                          @click=${() => {
                this._matchers?.push("");
                this.requestUpdate();
                // get the last input element and focus it
                setTimeout(() => {
                    const inputs = this.shadowRoot?.querySelectorAll(".option");
                    const lastInput = 
                    // @ts-expect-error -- .at seems not to be available in the type? @NilsJacobsen
                    inputs && inputs.at(-1);
                    lastInput?.focus();
                });
            }}
                          ><svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            slot="prefix"
                            style="margin: 0 -2px"
                          >
                            <path
                              fill="currentColor"
                              d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
                            ></path></svg
                        ></sl-button>
                      </sl-tooltip>
                    </div>
                    <div class="options-wrapper">
                      ${this._matchers?.map((category, index) => {
                return x$4 `<sl-input
                          class="option"
                          size="small"
                          value=${category}
                          filled
                          @input=${(e) => {
                    this._matchers = this._matchers || [];
                    this._matchers[index] = e.target.value;
                }}
                          ><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18px"
                            height="18px"
                            viewBox="0 0 24 24"
                            slot="suffix"
                            class="delete-icon"
                            style="margin-left: -4px; margin-right: 8px"
                            @click=${() => {
                    //delete with splic
                    this._matchers = this._matchers || [];
                    this._matchers.splice(index, 1);
                    this.requestUpdate();
                }}
                          >
                            <path
                              fill="currentColor"
                              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
                            /></svg
                        ></sl-input>`;
            })}
                    </div>
                  </div>
                  <div class="help-text">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      viewBox="0 0 256 256"
                    >
                      <path
                        fill="currentColor"
                        d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"
                      />
                    </svg>
                    <p>
                      The selector automatically adds the variants from the list
                      of matchers.
                    </p>
                  </div>`
            : ``}
					
					<div class=${this._variable ? "actions" : "actions disabled"}>
						<sl-button
							@click=${() => {
            if (this._matchers) {
                if (this._variable?.type === "local-variable") {
                    this._handleAddSelector(this._matchers);
                }
                else {
                    this._handleAddSelector(["*"]);
                }
            }
            else {
                console.info("No matchers present");
            }
        }}
							size="medium"
							variant="primary"
							>Add selector</sl-button
						>
					</div>
				</div>
			</div>
		`;
    }
};
__decorate([
    n$4()
], InlangAddSelector.prototype, "bundle", void 0);
__decorate([
    n$4()
], InlangAddSelector.prototype, "message", void 0);
__decorate([
    n$4()
], InlangAddSelector.prototype, "variants", void 0);
__decorate([
    r$2()
], InlangAddSelector.prototype, "_variable", void 0);
__decorate([
    r$2()
], InlangAddSelector.prototype, "_matchers", void 0);
__decorate([
    r$2()
], InlangAddSelector.prototype, "_oldDeclarations", void 0);
InlangAddSelector = __decorate([
    t$2("inlang-add-selector")
], InlangAddSelector);
