// @ts-nocheck
/* eslint-disable prefer-rest-params */

// copied from https://raw.githubusercontent.com/ionic-team/rollup-plugin-node-polyfills/master/polyfills/util.js and slightly modified

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
export function inspect(obj: any, opts: object) {
	// default options
	const ctx = {
		seen: [],
		stylize: stylizeNoColor,
	}
	// legacy...
	if (arguments.length >= 3) ctx.depth = arguments[2]
	if (arguments.length >= 4) ctx.colors = arguments[3]
	if (isBoolean(opts)) {
		// legacy...
		ctx.showHidden = opts
	} else if (opts) {
		// got an "options" object
		_extend(ctx, opts)
	}
	// set default options
	if (isUndefined(ctx.showHidden)) ctx.showHidden = false
	if (isUndefined(ctx.depth)) ctx.depth = 2
	if (isUndefined(ctx.colors)) ctx.colors = false
	if (isUndefined(ctx.customInspect)) ctx.customInspect = true
	if (ctx.colors) ctx.stylize = stylizeWithColor
	return formatValue(ctx, obj, ctx.depth)
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
	bold: [1, 22],
	italic: [3, 23],
	underline: [4, 24],
	inverse: [7, 27],
	white: [37, 39],
	grey: [90, 39],
	black: [30, 39],
	blue: [34, 39],
	cyan: [36, 39],
	green: [32, 39],
	magenta: [35, 39],
	red: [31, 39],
	yellow: [33, 39],
}

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
	special: "cyan",
	number: "yellow",
	boolean: "yellow",
	undefined: "grey",
	null: "bold",
	string: "green",
	date: "magenta",
	// "name": intentionally not styling
	regexp: "red",
}

function stylizeWithColor(str, styleType) {
	const style = inspect.styles[styleType]

	if (style) {
		return (
			"\u001b[" + inspect.colors[style][0] + "m" + str + "\u001b[" + inspect.colors[style][1] + "m"
		)
	} else {
		return str
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function stylizeNoColor(str, _styleType) {
	return str
}

function arrayToHash(array) {
	const hash = {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const [_idx, val] of array.entries()) {
		hash[val] = true
	}

	return hash
}

function formatValue(ctx, value, recurseTimes) {
	// Provide a hook for user-specified inspect functions.
	// Check that value is an object with an inspect function on it
	if (
		ctx.customInspect &&
		value &&
		isFunction(value.inspect) &&
		// Filter out the util module, it's inspect function is special
		value.inspect !== inspect &&
		// Also filter out any prototype objects using the circular check.
		!(value.constructor && value.constructor.prototype === value)
	) {
		let ret = value.inspect(recurseTimes, ctx)
		if (!isString(ret)) {
			ret = formatValue(ctx, ret, recurseTimes)
		}
		return ret
	}

	// Primitive types cannot have properties
	const primitive = formatPrimitive(ctx, value)
	if (primitive) {
		return primitive
	}

	// Look up the keys of the object.
	let keys = Object.keys(value)
	const visibleKeys = arrayToHash(keys)

	if (ctx.showHidden) {
		keys = Object.getOwnPropertyNames(value)
	}

	// IE doesn't make error fields non-enumerable
	// http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	if (isError(value) && (keys.includes("message") || keys.includes("description"))) {
		return formatError(value)
	}

	// Some type of object without properties can be shortcutted.
	if (keys.length === 0) {
		if (isFunction(value)) {
			const name = value.name ? ": " + value.name : ""
			return ctx.stylize("[Function" + name + "]", "special")
		}
		if (isRegExp(value)) {
			return ctx.stylize(RegExp.prototype.toString.call(value), "regexp")
		}
		if (isDate(value)) {
			return ctx.stylize(Date.prototype.toString.call(value), "date")
		}
		if (isError(value)) {
			return formatError(value)
		}
	}

	let base = "",
		array = false,
		braces = ["{", "}"]

	// Make Array say that they are Array
	if (isArray(value)) {
		array = true
		braces = ["[", "]"]
	}

	// Make functions say that they are functions
	if (isFunction(value)) {
		const n = value.name ? ": " + value.name : ""
		base = " [Function" + n + "]"
	}

	// Make RegExps say that they are RegExps
	if (isRegExp(value)) {
		base = " " + RegExp.prototype.toString.call(value)
	}

	// Make dates with properties first say the date
	if (isDate(value)) {
		base = " " + Date.prototype.toUTCString.call(value)
	}

	// Make error with message first say the error
	if (isError(value)) {
		base = " " + formatError(value)
	}

	if (keys.length === 0 && (!array || value.length == 0)) {
		return braces[0] + base + braces[1]
	}

	if (recurseTimes < 0) {
		if (isRegExp(value)) {
			return ctx.stylize(RegExp.prototype.toString.call(value), "regexp")
		} else {
			return ctx.stylize("[Object]", "special")
		}
	}

	ctx.seen.push(value)

	let output
	if (array) {
		output = formatArray(ctx, value, recurseTimes, visibleKeys, keys)
	} else {
		output = keys.map(function (key) {
			return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array)
		})
	}

	ctx.seen.pop()

	return reduceToSingleString(output, base, braces)
}

function formatPrimitive(ctx, value) {
	if (isUndefined(value)) return ctx.stylize("undefined", "undefined")
	if (isString(value)) {
		const simple =
			"'" +
			JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') +
			"'"
		return ctx.stylize(simple, "string")
	}
	if (isNumber(value)) return ctx.stylize("" + value, "number")
	if (isBoolean(value)) return ctx.stylize("" + value, "boolean")
	// For some reason typeof null is "object", so special case here.
	if (isNull(value)) return ctx.stylize("null", "null")
}

function formatError(value) {
	return "[" + Error.prototype.toString.call(value) + "]"
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	const output = []
	for (let i = 0, l = value.length; i < l; ++i) {
		if (hasOwnProperty(value, String(i))) {
			output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true))
		} else {
			output.push("")
		}
	}
	for (const key of keys) {
		if (!key.match(/^\d+$/)) {
			output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true))
		}
	}
	return output
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	let name, str
	const desc = Object.getOwnPropertyDescriptor(value, key) || {
		value: value[key],
	}
	if (desc.get) {
		if (desc.set) {
			str = ctx.stylize("[Getter/Setter]", "special")
		} else {
			str = ctx.stylize("[Getter]", "special")
		}
	} else {
		if (desc.set) {
			str = ctx.stylize("[Setter]", "special")
		}
	}
	if (!hasOwnProperty(visibleKeys, key)) {
		name = "[" + key + "]"
	}
	if (!str) {
		if (!ctx.seen.includes(desc.value)) {
			if (isNull(recurseTimes)) {
				// eslint-disable-next-line unicorn/no-null
				str = formatValue(ctx, desc.value, null)
			} else {
				str = formatValue(ctx, desc.value, recurseTimes - 1)
			}
			if (str.includes("\n")) {
				if (array) {
					str = str
						.split("\n")
						.map(function (line) {
							return "  " + line
						})
						.join("\n")
						.slice(2)
				} else {
					str =
						"\n" +
						str
							.split("\n")
							.map(function (line) {
								return "   " + line
							})
							.join("\n")
				}
			}
		} else {
			str = ctx.stylize("[Circular]", "special")
		}
	}
	if (isUndefined(name)) {
		if (array && key.match(/^\d+$/)) {
			return str
		}
		name = JSON.stringify("" + key)
		if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
			name = name.slice(1, 1 + name.length - 2)
			name = ctx.stylize(name, "name")
		} else {
			name = name
				.replace(/'/g, "\\'")
				.replace(/\\"/g, '"')
				.replace(/(^"|"$)/g, "'")
			name = ctx.stylize(name, "string")
		}
	}

	return name + ": " + str
}

function reduceToSingleString(output, base, braces) {
	const length = output.reduce(function (prev, cur) {
		numLinesEst++
		if (cur.includes("\n")) numLinesEst++
		// eslint-disable-next-line no-control-regex
		return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1
	}, 0)

	if (length > 60) {
		return (
			braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1]
		)
	}

	return braces[0] + base + " " + output.join(", ") + " " + braces[1]
}

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
export function isArray(ar) {
	return Array.isArray(ar)
}

export function isBoolean(arg) {
	return typeof arg === "boolean"
}

export function isNull(arg) {
	return arg === null
}

export function isNullOrUndefined(arg) {
	return arg == undefined
}

export function isNumber(arg) {
	return typeof arg === "number"
}

export function isString(arg) {
	return typeof arg === "string"
}

export function isSymbol(arg) {
	return typeof arg === "symbol"
}

export function isUndefined(arg) {
	return arg === void 0
}

export function isRegExp(re) {
	return isObject(re) && objectToString(re) === "[object RegExp]"
}

export function isObject(arg) {
	return typeof arg === "object" && arg !== null
}

export function isDate(d) {
	return isObject(d) && objectToString(d) === "[object Date]"
}

export function isError(e) {
	return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error)
}

export function isFunction(arg) {
	return typeof arg === "function"
}

export function isPrimitive(arg) {
	return (
		arg === null ||
		typeof arg === "boolean" ||
		typeof arg === "number" ||
		typeof arg === "string" ||
		typeof arg === "symbol" || // ES6 symbol
		typeof arg === "undefined"
	)
}

export function isBuffer(maybeBuf) {
	return Buffer.isBuffer(maybeBuf)
}

function objectToString(o) {
	return Object.prototype.toString.call(o)
}

export function _extend(origin, add) {
	// Don't do anything if add isn't an object
	if (!add || !isObject(add)) return origin

	const keys = Object.keys(add)
	let i = keys.length
	while (i--) {
		origin[keys[i]] = add[keys[i]]
	}
	return origin
}

function hasOwnProperty(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop)
}
