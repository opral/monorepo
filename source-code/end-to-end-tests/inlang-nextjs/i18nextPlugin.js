var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../node_modules/parsimmon/src/parsimmon.js
var require_parsimmon = __commonJS({
  "../../../node_modules/parsimmon/src/parsimmon.js"(exports, module) {
    "use strict";
    function Parsimmon2(action) {
      if (!(this instanceof Parsimmon2)) {
        return new Parsimmon2(action);
      }
      this._ = action;
    }
    var _ = Parsimmon2.prototype;
    function times(n, f) {
      var i = 0;
      for (i; i < n; i++) {
        f(i);
      }
    }
    function forEach(f, arr) {
      times(arr.length, function(i) {
        f(arr[i], i, arr);
      });
    }
    function reduce(f, seed, arr) {
      forEach(function(elem, i, arr2) {
        seed = f(seed, elem, i, arr2);
      }, arr);
      return seed;
    }
    function map(f, arr) {
      return reduce(
        function(acc, elem, i, a) {
          return acc.concat([f(elem, i, a)]);
        },
        [],
        arr
      );
    }
    function lshiftBuffer(input) {
      var asTwoBytes = reduce(
        function(a, v, i, b) {
          return a.concat(
            i === b.length - 1 ? Buffer.from([v, 0]).readUInt16BE(0) : b.readUInt16BE(i)
          );
        },
        [],
        input
      );
      return Buffer.from(
        map(function(x) {
          return (x << 1 & 65535) >> 8;
        }, asTwoBytes)
      );
    }
    function consumeBitsFromBuffer(n, input) {
      var state = { v: 0, buf: input };
      times(n, function() {
        state = {
          v: state.v << 1 | bitPeekBuffer(state.buf),
          buf: lshiftBuffer(state.buf)
        };
      });
      return state;
    }
    function bitPeekBuffer(input) {
      return input[0] >> 7;
    }
    function sum(numArr) {
      return reduce(
        function(x, y) {
          return x + y;
        },
        0,
        numArr
      );
    }
    function find(pred, arr) {
      return reduce(
        function(found, elem) {
          return found || (pred(elem) ? elem : found);
        },
        null,
        arr
      );
    }
    function bufferExists() {
      return typeof Buffer !== "undefined";
    }
    function setExists() {
      if (Parsimmon2._supportsSet !== void 0) {
        return Parsimmon2._supportsSet;
      }
      var exists = typeof Set !== "undefined";
      Parsimmon2._supportsSet = exists;
      return exists;
    }
    function ensureBuffer() {
      if (!bufferExists()) {
        throw new Error(
          "Buffer global does not exist; please use webpack if you need to parse Buffers in the browser."
        );
      }
    }
    function bitSeq(alignments) {
      ensureBuffer();
      var totalBits = sum(alignments);
      if (totalBits % 8 !== 0) {
        throw new Error(
          "The bits [" + alignments.join(", ") + "] add up to " + totalBits + " which is not an even number of bytes; the total should be divisible by 8"
        );
      }
      var bytes = totalBits / 8;
      var tooBigRange = find(function(x) {
        return x > 48;
      }, alignments);
      if (tooBigRange) {
        throw new Error(
          tooBigRange + " bit range requested exceeds 48 bit (6 byte) Number max."
        );
      }
      return new Parsimmon2(function(input, i) {
        var newPos = bytes + i;
        if (newPos > input.length) {
          return makeFailure(i, bytes.toString() + " bytes");
        }
        return makeSuccess(
          newPos,
          reduce(
            function(acc, bits) {
              var state = consumeBitsFromBuffer(bits, acc.buf);
              return {
                coll: acc.coll.concat(state.v),
                buf: state.buf
              };
            },
            { coll: [], buf: input.slice(i, newPos) },
            alignments
          ).coll
        );
      });
    }
    function bitSeqObj(namedAlignments) {
      ensureBuffer();
      var seenKeys = {};
      var totalKeys = 0;
      var fullAlignments = map(function(item) {
        if (isArray(item)) {
          var pair = item;
          if (pair.length !== 2) {
            throw new Error(
              "[" + pair.join(", ") + "] should be length 2, got length " + pair.length
            );
          }
          assertString(pair[0]);
          assertNumber(pair[1]);
          if (Object.prototype.hasOwnProperty.call(seenKeys, pair[0])) {
            throw new Error("duplicate key in bitSeqObj: " + pair[0]);
          }
          seenKeys[pair[0]] = true;
          totalKeys++;
          return pair;
        } else {
          assertNumber(item);
          return [null, item];
        }
      }, namedAlignments);
      if (totalKeys < 1) {
        throw new Error(
          "bitSeqObj expects at least one named pair, got [" + namedAlignments.join(", ") + "]"
        );
      }
      var namesOnly = map(function(pair) {
        return pair[0];
      }, fullAlignments);
      var alignmentsOnly = map(function(pair) {
        return pair[1];
      }, fullAlignments);
      return bitSeq(alignmentsOnly).map(function(parsed) {
        var namedParsed = map(function(name, i) {
          return [name, parsed[i]];
        }, namesOnly);
        return reduce(
          function(obj, kv) {
            if (kv[0] !== null) {
              obj[kv[0]] = kv[1];
            }
            return obj;
          },
          {},
          namedParsed
        );
      });
    }
    function parseBufferFor(other, length) {
      return new Parsimmon2(function(input, i) {
        ensureBuffer();
        if (i + length > input.length) {
          return makeFailure(i, length + " bytes for " + other);
        }
        return makeSuccess(i + length, input.slice(i, i + length));
      });
    }
    function parseBuffer(length) {
      return parseBufferFor("buffer", length).map(function(unsafe) {
        return Buffer.from(unsafe);
      });
    }
    function encodedString(encoding, length) {
      return parseBufferFor("string", length).map(function(buff) {
        return buff.toString(encoding);
      });
    }
    function isInteger(value) {
      return typeof value === "number" && Math.floor(value) === value;
    }
    function assertValidIntegerByteLengthFor(who, length) {
      if (!isInteger(length) || length < 0 || length > 6) {
        throw new Error(who + " requires integer length in range [0, 6].");
      }
    }
    function uintBE(length) {
      assertValidIntegerByteLengthFor("uintBE", length);
      return parseBufferFor("uintBE(" + length + ")", length).map(function(buff) {
        return buff.readUIntBE(0, length);
      });
    }
    function uintLE(length) {
      assertValidIntegerByteLengthFor("uintLE", length);
      return parseBufferFor("uintLE(" + length + ")", length).map(function(buff) {
        return buff.readUIntLE(0, length);
      });
    }
    function intBE(length) {
      assertValidIntegerByteLengthFor("intBE", length);
      return parseBufferFor("intBE(" + length + ")", length).map(function(buff) {
        return buff.readIntBE(0, length);
      });
    }
    function intLE(length) {
      assertValidIntegerByteLengthFor("intLE", length);
      return parseBufferFor("intLE(" + length + ")", length).map(function(buff) {
        return buff.readIntLE(0, length);
      });
    }
    function floatBE() {
      return parseBufferFor("floatBE", 4).map(function(buff) {
        return buff.readFloatBE(0);
      });
    }
    function floatLE() {
      return parseBufferFor("floatLE", 4).map(function(buff) {
        return buff.readFloatLE(0);
      });
    }
    function doubleBE() {
      return parseBufferFor("doubleBE", 8).map(function(buff) {
        return buff.readDoubleBE(0);
      });
    }
    function doubleLE() {
      return parseBufferFor("doubleLE", 8).map(function(buff) {
        return buff.readDoubleLE(0);
      });
    }
    function toArray(arrLike) {
      return Array.prototype.slice.call(arrLike);
    }
    function isParser(obj) {
      return obj instanceof Parsimmon2;
    }
    function isArray(x) {
      return {}.toString.call(x) === "[object Array]";
    }
    function isBuffer(x) {
      return bufferExists() && Buffer.isBuffer(x);
    }
    function makeSuccess(index2, value) {
      return {
        status: true,
        index: index2,
        value,
        furthest: -1,
        expected: []
      };
    }
    function makeFailure(index2, expected) {
      if (!isArray(expected)) {
        expected = [expected];
      }
      return {
        status: false,
        index: -1,
        value: null,
        furthest: index2,
        expected
      };
    }
    function mergeReplies(result, last) {
      if (!last) {
        return result;
      }
      if (result.furthest > last.furthest) {
        return result;
      }
      var expected = result.furthest === last.furthest ? union(result.expected, last.expected) : last.expected;
      return {
        status: result.status,
        index: result.index,
        value: result.value,
        furthest: last.furthest,
        expected
      };
    }
    var lineColumnIndex = {};
    function makeLineColumnIndex(input, i) {
      if (isBuffer(input)) {
        return {
          offset: i,
          line: -1,
          column: -1
        };
      }
      if (!(input in lineColumnIndex)) {
        lineColumnIndex[input] = {};
      }
      var inputIndex = lineColumnIndex[input];
      var prevLine = 0;
      var newLines = 0;
      var lineStart = 0;
      var j = i;
      while (j >= 0) {
        if (j in inputIndex) {
          prevLine = inputIndex[j].line;
          if (lineStart === 0) {
            lineStart = inputIndex[j].lineStart;
          }
          break;
        }
        if (
          // Unix LF (\n) or Windows CRLF (\r\n) line ending
          input.charAt(j) === "\n" || // Old Mac CR (\r) line ending
          input.charAt(j) === "\r" && input.charAt(j + 1) !== "\n"
        ) {
          newLines++;
          if (lineStart === 0) {
            lineStart = j + 1;
          }
        }
        j--;
      }
      var lineWeAreUpTo = prevLine + newLines;
      var columnWeAreUpTo = i - lineStart;
      inputIndex[i] = { line: lineWeAreUpTo, lineStart };
      return {
        offset: i,
        line: lineWeAreUpTo + 1,
        column: columnWeAreUpTo + 1
      };
    }
    function union(xs, ys) {
      if (setExists() && Array.from) {
        var set = new Set(xs);
        for (var y = 0; y < ys.length; y++) {
          set.add(ys[y]);
        }
        var arr = Array.from(set);
        arr.sort();
        return arr;
      }
      var obj = {};
      for (var i = 0; i < xs.length; i++) {
        obj[xs[i]] = true;
      }
      for (var j = 0; j < ys.length; j++) {
        obj[ys[j]] = true;
      }
      var keys = [];
      for (var k in obj) {
        if ({}.hasOwnProperty.call(obj, k)) {
          keys.push(k);
        }
      }
      keys.sort();
      return keys;
    }
    function assertParser(p) {
      if (!isParser(p)) {
        throw new Error("not a parser: " + p);
      }
    }
    function get(input, i) {
      if (typeof input === "string") {
        return input.charAt(i);
      }
      return input[i];
    }
    function assertArray(x) {
      if (!isArray(x)) {
        throw new Error("not an array: " + x);
      }
    }
    function assertNumber(x) {
      if (typeof x !== "number") {
        throw new Error("not a number: " + x);
      }
    }
    function assertRegexp(x) {
      if (!(x instanceof RegExp)) {
        throw new Error("not a regexp: " + x);
      }
      var f = flags(x);
      for (var i = 0; i < f.length; i++) {
        var c = f.charAt(i);
        if (c !== "i" && c !== "m" && c !== "u" && c !== "s") {
          throw new Error('unsupported regexp flag "' + c + '": ' + x);
        }
      }
    }
    function assertFunction(x) {
      if (typeof x !== "function") {
        throw new Error("not a function: " + x);
      }
    }
    function assertString(x) {
      if (typeof x !== "string") {
        throw new Error("not a string: " + x);
      }
    }
    var linesBeforeStringError = 2;
    var linesAfterStringError = 3;
    var bytesPerLine = 8;
    var bytesBefore = bytesPerLine * 5;
    var bytesAfter = bytesPerLine * 4;
    var defaultLinePrefix = "  ";
    function repeat(string2, amount) {
      return new Array(amount + 1).join(string2);
    }
    function formatExpected(expected) {
      if (expected.length === 1) {
        return "Expected:\n\n" + expected[0];
      }
      return "Expected one of the following: \n\n" + expected.join(", ");
    }
    function leftPad(str, pad, char) {
      var add = pad - str.length;
      if (add <= 0) {
        return str;
      }
      return repeat(char, add) + str;
    }
    function toChunks(arr, chunkSize) {
      var length = arr.length;
      var chunks = [];
      var chunkIndex = 0;
      if (length <= chunkSize) {
        return [arr.slice()];
      }
      for (var i = 0; i < length; i++) {
        if (!chunks[chunkIndex]) {
          chunks.push([]);
        }
        chunks[chunkIndex].push(arr[i]);
        if ((i + 1) % chunkSize === 0) {
          chunkIndex++;
        }
      }
      return chunks;
    }
    function rangeFromIndexAndOffsets(i, before, after, length) {
      return {
        // Guard against the negative upper bound for lines included in the output.
        from: i - before > 0 ? i - before : 0,
        to: i + after > length ? length : i + after
      };
    }
    function byteRangeToRange(byteRange) {
      if (byteRange.from === 0 && byteRange.to === 1) {
        return {
          from: byteRange.from,
          to: byteRange.to
        };
      }
      return {
        from: byteRange.from / bytesPerLine,
        // Round `to`, so we don't get float if the amount of bytes is not divisible by `bytesPerLine`
        to: Math.floor(byteRange.to / bytesPerLine)
      };
    }
    function formatGot(input, error) {
      var index2 = error.index;
      var i = index2.offset;
      var verticalMarkerLength = 1;
      var column;
      var lineWithErrorIndex;
      var lines;
      var lineRange;
      var lastLineNumberLabelLength;
      if (i === input.length) {
        return "Got the end of the input";
      }
      if (isBuffer(input)) {
        var byteLineWithErrorIndex = i - i % bytesPerLine;
        var columnByteIndex = i - byteLineWithErrorIndex;
        var byteRange = rangeFromIndexAndOffsets(
          byteLineWithErrorIndex,
          bytesBefore,
          bytesAfter + bytesPerLine,
          input.length
        );
        var bytes = input.slice(byteRange.from, byteRange.to);
        var bytesInChunks = toChunks(bytes.toJSON().data, bytesPerLine);
        var byteLines = map(function(byteRow) {
          return map(function(byteValue) {
            return leftPad(byteValue.toString(16), 2, "0");
          }, byteRow);
        }, bytesInChunks);
        lineRange = byteRangeToRange(byteRange);
        lineWithErrorIndex = byteLineWithErrorIndex / bytesPerLine;
        column = columnByteIndex * 3;
        if (columnByteIndex >= 4) {
          column += 1;
        }
        verticalMarkerLength = 2;
        lines = map(function(byteLine) {
          return byteLine.length <= 4 ? byteLine.join(" ") : byteLine.slice(0, 4).join(" ") + "  " + byteLine.slice(4).join(" ");
        }, byteLines);
        lastLineNumberLabelLength = ((lineRange.to > 0 ? lineRange.to - 1 : lineRange.to) * 8).toString(16).length;
        if (lastLineNumberLabelLength < 2) {
          lastLineNumberLabelLength = 2;
        }
      } else {
        var inputLines = input.split(/\r\n|[\n\r\u2028\u2029]/);
        column = index2.column - 1;
        lineWithErrorIndex = index2.line - 1;
        lineRange = rangeFromIndexAndOffsets(
          lineWithErrorIndex,
          linesBeforeStringError,
          linesAfterStringError,
          inputLines.length
        );
        lines = inputLines.slice(lineRange.from, lineRange.to);
        lastLineNumberLabelLength = lineRange.to.toString().length;
      }
      var lineWithErrorCurrentIndex = lineWithErrorIndex - lineRange.from;
      if (isBuffer(input)) {
        lastLineNumberLabelLength = ((lineRange.to > 0 ? lineRange.to - 1 : lineRange.to) * 8).toString(16).length;
        if (lastLineNumberLabelLength < 2) {
          lastLineNumberLabelLength = 2;
        }
      }
      var linesWithLineNumbers = reduce(
        function(acc, lineSource, index3) {
          var isLineWithError = index3 === lineWithErrorCurrentIndex;
          var prefix = isLineWithError ? "> " : defaultLinePrefix;
          var lineNumberLabel;
          if (isBuffer(input)) {
            lineNumberLabel = leftPad(
              ((lineRange.from + index3) * 8).toString(16),
              lastLineNumberLabelLength,
              "0"
            );
          } else {
            lineNumberLabel = leftPad(
              (lineRange.from + index3 + 1).toString(),
              lastLineNumberLabelLength,
              " "
            );
          }
          return [].concat(
            acc,
            [prefix + lineNumberLabel + " | " + lineSource],
            isLineWithError ? [
              defaultLinePrefix + repeat(" ", lastLineNumberLabelLength) + " | " + leftPad("", column, " ") + repeat("^", verticalMarkerLength)
            ] : []
          );
        },
        [],
        lines
      );
      return linesWithLineNumbers.join("\n");
    }
    function formatError(input, error) {
      return [
        "\n",
        "-- PARSING FAILED " + repeat("-", 50),
        "\n\n",
        formatGot(input, error),
        "\n\n",
        formatExpected(error.expected),
        "\n"
      ].join("");
    }
    function flags(re) {
      if (re.flags !== void 0) {
        return re.flags;
      }
      return [
        re.global ? "g" : "",
        re.ignoreCase ? "i" : "",
        re.multiline ? "m" : "",
        re.unicode ? "u" : "",
        re.sticky ? "y" : ""
      ].join("");
    }
    function anchoredRegexp(re) {
      return RegExp("^(?:" + re.source + ")", flags(re));
    }
    function seq() {
      var parsers = [].slice.call(arguments);
      var numParsers = parsers.length;
      for (var j = 0; j < numParsers; j += 1) {
        assertParser(parsers[j]);
      }
      return Parsimmon2(function(input, i) {
        var result;
        var accum = new Array(numParsers);
        for (var j2 = 0; j2 < numParsers; j2 += 1) {
          result = mergeReplies(parsers[j2]._(input, i), result);
          if (!result.status) {
            return result;
          }
          accum[j2] = result.value;
          i = result.index;
        }
        return mergeReplies(makeSuccess(i, accum), result);
      });
    }
    function seqObj() {
      var seenKeys = {};
      var totalKeys = 0;
      var parsers = toArray(arguments);
      var numParsers = parsers.length;
      for (var j = 0; j < numParsers; j += 1) {
        var p = parsers[j];
        if (isParser(p)) {
          continue;
        }
        if (isArray(p)) {
          var isWellFormed = p.length === 2 && typeof p[0] === "string" && isParser(p[1]);
          if (isWellFormed) {
            var key = p[0];
            if (Object.prototype.hasOwnProperty.call(seenKeys, key)) {
              throw new Error("seqObj: duplicate key " + key);
            }
            seenKeys[key] = true;
            totalKeys++;
            continue;
          }
        }
        throw new Error(
          "seqObj arguments must be parsers or [string, parser] array pairs."
        );
      }
      if (totalKeys === 0) {
        throw new Error("seqObj expects at least one named parser, found zero");
      }
      return Parsimmon2(function(input, i) {
        var result;
        var accum = {};
        for (var j2 = 0; j2 < numParsers; j2 += 1) {
          var name;
          var parser;
          if (isArray(parsers[j2])) {
            name = parsers[j2][0];
            parser = parsers[j2][1];
          } else {
            name = null;
            parser = parsers[j2];
          }
          result = mergeReplies(parser._(input, i), result);
          if (!result.status) {
            return result;
          }
          if (name) {
            accum[name] = result.value;
          }
          i = result.index;
        }
        return mergeReplies(makeSuccess(i, accum), result);
      });
    }
    function seqMap() {
      var args = [].slice.call(arguments);
      if (args.length === 0) {
        throw new Error("seqMap needs at least one argument");
      }
      var mapper = args.pop();
      assertFunction(mapper);
      return seq.apply(null, args).map(function(results) {
        return mapper.apply(null, results);
      });
    }
    function createLanguage(parsers) {
      var language = {};
      for (var key in parsers) {
        if ({}.hasOwnProperty.call(parsers, key)) {
          (function(key2) {
            var func = function() {
              return parsers[key2](language);
            };
            language[key2] = lazy(func);
          })(key);
        }
      }
      return language;
    }
    function alt() {
      var parsers = [].slice.call(arguments);
      var numParsers = parsers.length;
      if (numParsers === 0) {
        return fail("zero alternates");
      }
      for (var j = 0; j < numParsers; j += 1) {
        assertParser(parsers[j]);
      }
      return Parsimmon2(function(input, i) {
        var result;
        for (var j2 = 0; j2 < parsers.length; j2 += 1) {
          result = mergeReplies(parsers[j2]._(input, i), result);
          if (result.status) {
            return result;
          }
        }
        return result;
      });
    }
    function sepBy(parser, separator) {
      return sepBy1(parser, separator).or(succeed([]));
    }
    function sepBy1(parser, separator) {
      assertParser(parser);
      assertParser(separator);
      var pairs = separator.then(parser).many();
      return seqMap(parser, pairs, function(r, rs) {
        return [r].concat(rs);
      });
    }
    _.parse = function(input) {
      if (typeof input !== "string" && !isBuffer(input)) {
        throw new Error(
          ".parse must be called with a string or Buffer as its argument"
        );
      }
      var parseResult = this.skip(eof)._(input, 0);
      var result;
      if (parseResult.status) {
        result = {
          status: true,
          value: parseResult.value
        };
      } else {
        result = {
          status: false,
          index: makeLineColumnIndex(input, parseResult.furthest),
          expected: parseResult.expected
        };
      }
      delete lineColumnIndex[input];
      return result;
    };
    _.tryParse = function(str) {
      var result = this.parse(str);
      if (result.status) {
        return result.value;
      } else {
        var msg = formatError(str, result);
        var err = new Error(msg);
        err.type = "ParsimmonError";
        err.result = result;
        throw err;
      }
    };
    _.assert = function(condition, errorMessage) {
      return this.chain(function(value) {
        return condition(value) ? succeed(value) : fail(errorMessage);
      });
    };
    _.or = function(alternative) {
      return alt(this, alternative);
    };
    _.trim = function(parser) {
      return this.wrap(parser, parser);
    };
    _.wrap = function(leftParser, rightParser) {
      return seqMap(leftParser, this, rightParser, function(left, middle) {
        return middle;
      });
    };
    _.thru = function(wrapper) {
      return wrapper(this);
    };
    _.then = function(next) {
      assertParser(next);
      return seq(this, next).map(function(results) {
        return results[1];
      });
    };
    _.many = function() {
      var self = this;
      return Parsimmon2(function(input, i) {
        var accum = [];
        var result = void 0;
        for (; ; ) {
          result = mergeReplies(self._(input, i), result);
          if (result.status) {
            if (i === result.index) {
              throw new Error(
                "infinite loop detected in .many() parser --- calling .many() on a parser which can accept zero characters is usually the cause"
              );
            }
            i = result.index;
            accum.push(result.value);
          } else {
            return mergeReplies(makeSuccess(i, accum), result);
          }
        }
      });
    };
    _.tieWith = function(separator) {
      assertString(separator);
      return this.map(function(args) {
        assertArray(args);
        if (args.length) {
          assertString(args[0]);
          var s = args[0];
          for (var i = 1; i < args.length; i++) {
            assertString(args[i]);
            s += separator + args[i];
          }
          return s;
        } else {
          return "";
        }
      });
    };
    _.tie = function() {
      return this.tieWith("");
    };
    _.times = function(min, max) {
      var self = this;
      if (arguments.length < 2) {
        max = min;
      }
      assertNumber(min);
      assertNumber(max);
      return Parsimmon2(function(input, i) {
        var accum = [];
        var result = void 0;
        var prevResult = void 0;
        for (var times2 = 0; times2 < min; times2 += 1) {
          result = self._(input, i);
          prevResult = mergeReplies(result, prevResult);
          if (result.status) {
            i = result.index;
            accum.push(result.value);
          } else {
            return prevResult;
          }
        }
        for (; times2 < max; times2 += 1) {
          result = self._(input, i);
          prevResult = mergeReplies(result, prevResult);
          if (result.status) {
            i = result.index;
            accum.push(result.value);
          } else {
            break;
          }
        }
        return mergeReplies(makeSuccess(i, accum), prevResult);
      });
    };
    _.result = function(res) {
      return this.map(function() {
        return res;
      });
    };
    _.atMost = function(n) {
      return this.times(0, n);
    };
    _.atLeast = function(n) {
      return seqMap(this.times(n), this.many(), function(init, rest) {
        return init.concat(rest);
      });
    };
    _.map = function(fn) {
      assertFunction(fn);
      var self = this;
      return Parsimmon2(function(input, i) {
        var result = self._(input, i);
        if (!result.status) {
          return result;
        }
        return mergeReplies(makeSuccess(result.index, fn(result.value)), result);
      });
    };
    _.contramap = function(fn) {
      assertFunction(fn);
      var self = this;
      return Parsimmon2(function(input, i) {
        var result = self.parse(fn(input.slice(i)));
        if (!result.status) {
          return result;
        }
        return makeSuccess(i + input.length, result.value);
      });
    };
    _.promap = function(f, g) {
      assertFunction(f);
      assertFunction(g);
      return this.contramap(f).map(g);
    };
    _.skip = function(next) {
      return seq(this, next).map(function(results) {
        return results[0];
      });
    };
    _.mark = function() {
      return seqMap(index, this, index, function(start, value, end2) {
        return {
          start,
          value,
          end: end2
        };
      });
    };
    _.node = function(name) {
      return seqMap(index, this, index, function(start, value, end2) {
        return {
          name,
          value,
          start,
          end: end2
        };
      });
    };
    _.sepBy = function(separator) {
      return sepBy(this, separator);
    };
    _.sepBy1 = function(separator) {
      return sepBy1(this, separator);
    };
    _.lookahead = function(x) {
      return this.skip(lookahead(x));
    };
    _.notFollowedBy = function(x) {
      return this.skip(notFollowedBy(x));
    };
    _.desc = function(expected) {
      if (!isArray(expected)) {
        expected = [expected];
      }
      var self = this;
      return Parsimmon2(function(input, i) {
        var reply = self._(input, i);
        if (!reply.status) {
          reply.expected = expected;
        }
        return reply;
      });
    };
    _.fallback = function(result) {
      return this.or(succeed(result));
    };
    _.ap = function(other) {
      return seqMap(other, this, function(f, x) {
        return f(x);
      });
    };
    _.chain = function(f) {
      var self = this;
      return Parsimmon2(function(input, i) {
        var result = self._(input, i);
        if (!result.status) {
          return result;
        }
        var nextParser = f(result.value);
        return mergeReplies(nextParser._(input, result.index), result);
      });
    };
    function string(str) {
      assertString(str);
      var expected = "'" + str + "'";
      return Parsimmon2(function(input, i) {
        var j = i + str.length;
        var head = input.slice(i, j);
        if (head === str) {
          return makeSuccess(j, head);
        } else {
          return makeFailure(i, expected);
        }
      });
    }
    function byte(b) {
      ensureBuffer();
      assertNumber(b);
      if (b > 255) {
        throw new Error(
          "Value specified to byte constructor (" + b + "=0x" + b.toString(16) + ") is larger in value than a single byte."
        );
      }
      var expected = (b > 15 ? "0x" : "0x0") + b.toString(16);
      return Parsimmon2(function(input, i) {
        var head = get(input, i);
        if (head === b) {
          return makeSuccess(i + 1, head);
        } else {
          return makeFailure(i, expected);
        }
      });
    }
    function regexp(re, group) {
      assertRegexp(re);
      if (arguments.length >= 2) {
        assertNumber(group);
      } else {
        group = 0;
      }
      var anchored = anchoredRegexp(re);
      var expected = "" + re;
      return Parsimmon2(function(input, i) {
        var match = anchored.exec(input.slice(i));
        if (match) {
          if (0 <= group && group <= match.length) {
            var fullMatch = match[0];
            var groupMatch = match[group];
            return makeSuccess(i + fullMatch.length, groupMatch);
          }
          var message = "valid match group (0 to " + match.length + ") in " + expected;
          return makeFailure(i, message);
        }
        return makeFailure(i, expected);
      });
    }
    function succeed(value) {
      return Parsimmon2(function(input, i) {
        return makeSuccess(i, value);
      });
    }
    function fail(expected) {
      return Parsimmon2(function(input, i) {
        return makeFailure(i, expected);
      });
    }
    function lookahead(x) {
      if (isParser(x)) {
        return Parsimmon2(function(input, i) {
          var result = x._(input, i);
          result.index = i;
          result.value = "";
          return result;
        });
      } else if (typeof x === "string") {
        return lookahead(string(x));
      } else if (x instanceof RegExp) {
        return lookahead(regexp(x));
      }
      throw new Error("not a string, regexp, or parser: " + x);
    }
    function notFollowedBy(parser) {
      assertParser(parser);
      return Parsimmon2(function(input, i) {
        var result = parser._(input, i);
        var text = input.slice(i, result.index);
        return result.status ? makeFailure(i, 'not "' + text + '"') : makeSuccess(i, null);
      });
    }
    function test(predicate) {
      assertFunction(predicate);
      return Parsimmon2(function(input, i) {
        var char = get(input, i);
        if (i < input.length && predicate(char)) {
          return makeSuccess(i + 1, char);
        } else {
          return makeFailure(i, "a character/byte matching " + predicate);
        }
      });
    }
    function oneOf(str) {
      var expected = str.split("");
      for (var idx = 0; idx < expected.length; idx++) {
        expected[idx] = "'" + expected[idx] + "'";
      }
      return test(function(ch) {
        return str.indexOf(ch) >= 0;
      }).desc(expected);
    }
    function noneOf(str) {
      return test(function(ch) {
        return str.indexOf(ch) < 0;
      }).desc("none of '" + str + "'");
    }
    function custom(parsingFunction) {
      return Parsimmon2(parsingFunction(makeSuccess, makeFailure));
    }
    function range(begin, end2) {
      return test(function(ch) {
        return begin <= ch && ch <= end2;
      }).desc(begin + "-" + end2);
    }
    function takeWhile(predicate) {
      assertFunction(predicate);
      return Parsimmon2(function(input, i) {
        var j = i;
        while (j < input.length && predicate(get(input, j))) {
          j++;
        }
        return makeSuccess(j, input.slice(i, j));
      });
    }
    function lazy(desc, f) {
      if (arguments.length < 2) {
        f = desc;
        desc = void 0;
      }
      var parser = Parsimmon2(function(input, i) {
        parser._ = f()._;
        return parser._(input, i);
      });
      if (desc) {
        return parser.desc(desc);
      } else {
        return parser;
      }
    }
    function empty() {
      return fail("fantasy-land/empty");
    }
    _.concat = _.or;
    _.empty = empty;
    _.of = succeed;
    _["fantasy-land/ap"] = _.ap;
    _["fantasy-land/chain"] = _.chain;
    _["fantasy-land/concat"] = _.concat;
    _["fantasy-land/empty"] = _.empty;
    _["fantasy-land/of"] = _.of;
    _["fantasy-land/map"] = _.map;
    var index = Parsimmon2(function(input, i) {
      return makeSuccess(i, makeLineColumnIndex(input, i));
    });
    var any = Parsimmon2(function(input, i) {
      if (i >= input.length) {
        return makeFailure(i, "any character/byte");
      }
      return makeSuccess(i + 1, get(input, i));
    });
    var all = Parsimmon2(function(input, i) {
      return makeSuccess(input.length, input.slice(i));
    });
    var eof = Parsimmon2(function(input, i) {
      if (i < input.length) {
        return makeFailure(i, "EOF");
      }
      return makeSuccess(i, null);
    });
    var digit = regexp(/[0-9]/).desc("a digit");
    var digits = regexp(/[0-9]*/).desc("optional digits");
    var letter = regexp(/[a-z]/i).desc("a letter");
    var letters = regexp(/[a-z]*/i).desc("optional letters");
    var optWhitespace = regexp(/\s*/).desc("optional whitespace");
    var whitespace = regexp(/\s+/).desc("whitespace");
    var cr = string("\r");
    var lf = string("\n");
    var crlf = string("\r\n");
    var newline = alt(crlf, lf, cr).desc("newline");
    var end = alt(newline, eof);
    Parsimmon2.all = all;
    Parsimmon2.alt = alt;
    Parsimmon2.any = any;
    Parsimmon2.cr = cr;
    Parsimmon2.createLanguage = createLanguage;
    Parsimmon2.crlf = crlf;
    Parsimmon2.custom = custom;
    Parsimmon2.digit = digit;
    Parsimmon2.digits = digits;
    Parsimmon2.empty = empty;
    Parsimmon2.end = end;
    Parsimmon2.eof = eof;
    Parsimmon2.fail = fail;
    Parsimmon2.formatError = formatError;
    Parsimmon2.index = index;
    Parsimmon2.isParser = isParser;
    Parsimmon2.lazy = lazy;
    Parsimmon2.letter = letter;
    Parsimmon2.letters = letters;
    Parsimmon2.lf = lf;
    Parsimmon2.lookahead = lookahead;
    Parsimmon2.makeFailure = makeFailure;
    Parsimmon2.makeSuccess = makeSuccess;
    Parsimmon2.newline = newline;
    Parsimmon2.noneOf = noneOf;
    Parsimmon2.notFollowedBy = notFollowedBy;
    Parsimmon2.of = succeed;
    Parsimmon2.oneOf = oneOf;
    Parsimmon2.optWhitespace = optWhitespace;
    Parsimmon2.Parser = Parsimmon2;
    Parsimmon2.range = range;
    Parsimmon2.regex = regexp;
    Parsimmon2.regexp = regexp;
    Parsimmon2.sepBy = sepBy;
    Parsimmon2.sepBy1 = sepBy1;
    Parsimmon2.seq = seq;
    Parsimmon2.seqMap = seqMap;
    Parsimmon2.seqObj = seqObj;
    Parsimmon2.string = string;
    Parsimmon2.succeed = succeed;
    Parsimmon2.takeWhile = takeWhile;
    Parsimmon2.test = test;
    Parsimmon2.whitespace = whitespace;
    Parsimmon2["fantasy-land/empty"] = empty;
    Parsimmon2["fantasy-land/of"] = succeed;
    Parsimmon2.Binary = {
      bitSeq,
      bitSeqObj,
      byte,
      buffer: parseBuffer,
      encodedString,
      uintBE,
      uint8BE: uintBE(1),
      uint16BE: uintBE(2),
      uint32BE: uintBE(4),
      uintLE,
      uint8LE: uintLE(1),
      uint16LE: uintLE(2),
      uint32LE: uintLE(4),
      intBE,
      int8BE: intBE(1),
      int16BE: intBE(2),
      int32BE: intBE(4),
      intLE,
      int8LE: intLE(1),
      int16LE: intLE(2),
      int32LE: intLE(4),
      floatBE: floatBE(),
      floatLE: floatLE(),
      doubleBE: doubleBE(),
      doubleLE: doubleLE()
    };
    module.exports = Parsimmon2;
  }
});

// ../../../node_modules/flat/index.js
var require_flat = __commonJS({
  "../../../node_modules/flat/index.js"(exports, module) {
    module.exports = flatten2;
    flatten2.flatten = flatten2;
    flatten2.unflatten = unflatten2;
    function isBuffer(obj) {
      return obj && obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    function keyIdentity(key) {
      return key;
    }
    function flatten2(target, opts) {
      opts = opts || {};
      const delimiter = opts.delimiter || ".";
      const maxDepth = opts.maxDepth;
      const transformKey = opts.transformKey || keyIdentity;
      const output = {};
      function step(object, prev, currentDepth) {
        currentDepth = currentDepth || 1;
        Object.keys(object).forEach(function(key) {
          const value = object[key];
          const isarray = opts.safe && Array.isArray(value);
          const type = Object.prototype.toString.call(value);
          const isbuffer = isBuffer(value);
          const isobject = type === "[object Object]" || type === "[object Array]";
          const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);
          if (!isarray && !isbuffer && isobject && Object.keys(value).length && (!opts.maxDepth || currentDepth < maxDepth)) {
            return step(value, newKey, currentDepth + 1);
          }
          output[newKey] = value;
        });
      }
      step(target);
      return output;
    }
    function unflatten2(target, opts) {
      opts = opts || {};
      const delimiter = opts.delimiter || ".";
      const overwrite = opts.overwrite || false;
      const transformKey = opts.transformKey || keyIdentity;
      const result = {};
      const isbuffer = isBuffer(target);
      if (isbuffer || Object.prototype.toString.call(target) !== "[object Object]") {
        return target;
      }
      function getkey(key) {
        const parsedKey = Number(key);
        return isNaN(parsedKey) || key.indexOf(".") !== -1 || opts.object ? key : parsedKey;
      }
      function addKeys(keyPrefix, recipient, target2) {
        return Object.keys(target2).reduce(function(result2, key) {
          result2[keyPrefix + delimiter + key] = target2[key];
          return result2;
        }, recipient);
      }
      function isEmpty(val) {
        const type = Object.prototype.toString.call(val);
        const isArray = type === "[object Array]";
        const isObject = type === "[object Object]";
        if (!val) {
          return true;
        } else if (isArray) {
          return !val.length;
        } else if (isObject) {
          return !Object.keys(val).length;
        }
      }
      target = Object.keys(target).reduce(function(result2, key) {
        const type = Object.prototype.toString.call(target[key]);
        const isObject = type === "[object Object]" || type === "[object Array]";
        if (!isObject || isEmpty(target[key])) {
          result2[key] = target[key];
          return result2;
        } else {
          return addKeys(
            key,
            result2,
            flatten2(target[key], opts)
          );
        }
      }, {});
      Object.keys(target).forEach(function(key) {
        const split = key.split(delimiter).map(transformKey);
        let key1 = getkey(split.shift());
        let key2 = getkey(split[0]);
        let recipient = result;
        while (key2 !== void 0) {
          if (key1 === "__proto__") {
            return;
          }
          const type = Object.prototype.toString.call(recipient[key1]);
          const isobject = type === "[object Object]" || type === "[object Array]";
          if (!overwrite && !isobject && typeof recipient[key1] !== "undefined") {
            return;
          }
          if (overwrite && !isobject || !overwrite && recipient[key1] == null) {
            recipient[key1] = typeof key2 === "number" && !opts.object ? [] : {};
          }
          recipient = recipient[key1];
          if (split.length > 0) {
            key1 = getkey(split.shift());
            key2 = getkey(split[0]);
          }
        }
        recipient[key1] = unflatten2(target[key], opts);
      });
      return result;
    }
  }
});

// src/settings.ts
function throwIfInvalidSettings(settings) {
  if (typeof settings.pathPattern === "string") {
    if (settings.pathPattern.includes("{languageTag}") === false) {
      throw new Error(
        "The pathPattern setting must be defined and include the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
      );
    } else if (settings.pathPattern.includes("{{languageTag}}") === true) {
      throw new Error(
        "The pathPattern setting must use single brackets instead of double brackets for the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
      );
    } else if (settings.pathPattern.endsWith(".json") === false) {
      throw new Error(
        "The pathPattern setting must end with '.json'. An example would be './resources/{languageTag}.json'."
      );
    } else if (settings.pathPattern.includes("*")) {
      throw new Error(
        "The pathPattern includes a '*' wildcard. This was depricated in version 3.0.0. Check https://github.com/inlang/inlang/tree/main/source-code/plugins/i18next/ for how to use Pluginsettings"
      );
    }
  } else {
    for (const [prefix, path] of Object.entries(settings.pathPattern)) {
      if (path === void 0 || path.includes("{languageTag}") === false) {
        throw new Error(
          "The pathPattern setting must be defined and include the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
        );
      } else if (path === void 0 || path.includes("{{languageTag}}") === true) {
        throw new Error(
          "The pathPattern setting must use single brackets instead of double brackets for the {languageTag} variable reference. An example would be './resources/{languageTag}.json'."
        );
      } else if (path.endsWith(".json") === false) {
        throw new Error(
          "The pathPattern setting must end with '.json'. An example would be './resources/{languageTag}.json'."
        );
      } else if (prefix.includes(".")) {
        throw new Error(
          "A prefix of pathPattern includes an '.'. Use a string without dot notations. An example would be 'common'."
        );
      }
    }
  }
}

// src/utilities.ts
var detectIsNested = (file) => {
  const json = JSON.parse(file);
  if (file === "{}")
    return void 0;
  for (const value of Object.values(json)) {
    if (typeof value === "object") {
      return true;
    }
  }
  return false;
};
var detectJsonSpacing = (jsonString) => {
  const patterns = [
    {
      spacing: 1,
      regex: /^{\n {1}[^ ]+.*$/m
    },
    {
      spacing: 2,
      regex: /^{\n {2}[^ ]+.*$/m
    },
    {
      spacing: 3,
      regex: /^{\n {3}[^ ]+.*$/m
    },
    {
      spacing: 4,
      regex: /^{\n {4}[^ ]+.*$/m
    },
    {
      spacing: 6,
      regex: /^{\n {6}[^ ]+.*$/m
    },
    {
      spacing: 8,
      regex: /^{\n {8}[^ ]+.*$/m
    },
    {
      spacing: "	",
      regex: /^{\n\t[^ ]+.*$/m
    }
  ];
  for (const { spacing, regex } of patterns) {
    if (regex.test(jsonString)) {
      return spacing;
    }
  }
  return void 0;
};
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/ideExtension/messageReferenceMatchers.ts
var import_parsimmon = __toESM(require_parsimmon(), 1);
var createParser = (settings) => {
  return import_parsimmon.default.createLanguage({
    // The entry point for message reference matching.
    //
    // 1. Match a t function call or any other character.
    // 2. Match as many of these as possible.
    // 3. Filter out any non-object matches.
    entry: (r) => {
      return import_parsimmon.default.alt(r.FunctionCall, import_parsimmon.default.any).many().map((matches) => {
        return matches.filter((match) => typeof match === "object");
      });
    },
    // A string literal is either a single or double quoted string
    stringLiteral: (r) => {
      return import_parsimmon.default.alt(r.doubleQuotedString, r.singleQuotedString);
    },
    // Double quoted string literal parser
    //
    // 1. Start with a double quote.
    // 2. Then match any character that is not a double quote.
    // 3. End with a double quote.
    doubleQuotedString: () => {
      return import_parsimmon.default.string('"').then(import_parsimmon.default.regex(/[^"]*/)).skip(import_parsimmon.default.string('"'));
    },
    // Single quoted string literal parser
    //
    // 1. Start with a single quote.
    // 2. Then match any character that is not a single quote.
    // 3. End with a single quote.
    singleQuotedString: () => {
      return import_parsimmon.default.string("'").then(import_parsimmon.default.regex(/[^']*/)).skip(import_parsimmon.default.string("'"));
    },
    // Whitespace parser
    whitespace: () => {
      return import_parsimmon.default.optWhitespace;
    },
    // Colon parser
    colon: (r) => {
      return import_parsimmon.default.string(":").trim(r.whitespace);
    },
    // Comma parser
    comma: (r) => {
      return import_parsimmon.default.string(",").trim(r.whitespace);
    },
    // Parser for namespace value
    nsValue: (r) => {
      return import_parsimmon.default.seq(
        r.whitespace,
        import_parsimmon.default.string("ns").trim(r.whitespace).skip(r.colon),
        // namespace key parser
        r.stringLiteral.trim(r.whitespace)
      ).map(([, , val]) => `${val}`);
    },
    // Parser for t function calls
    FunctionCall: function(r) {
      return import_parsimmon.default.seqMap(
        import_parsimmon.default.regex(/[^a-zA-Z0-9]/),
        // no preceding letters or numbers
        import_parsimmon.default.string("t"),
        // starts with t
        import_parsimmon.default.string("("),
        // then an opening parenthesis
        import_parsimmon.default.index,
        // start position of the message id
        r.stringLiteral,
        // message id
        import_parsimmon.default.index,
        // end position of the message id
        import_parsimmon.default.regex(/[^)]*/),
        // ignore the rest of the function call
        import_parsimmon.default.string(")"),
        // end with a closing parenthesis
        (_, __, ___, start, messageId, end, rest) => {
          const namespaceParser = r.comma.then(import_parsimmon.default.string("{")).trim(r.whitespace).then(r.nsValue).skip(import_parsimmon.default.string("}")).skip(import_parsimmon.default.regex(/[^)]*/)).trim(r.whitespace);
          const namespace = namespaceParser.parse(rest).value;
          if (typeof settings.pathPattern === "object") {
            if (namespace) {
              messageId = namespace + ":" + messageId;
            } else if (!messageId.includes(":")) {
              const defaultNamespace = Object.keys(settings.pathPattern)[0];
              messageId = defaultNamespace + ":" + messageId;
            }
          }
          return {
            messageId,
            position: {
              start: {
                line: start.line,
                character: start.column
              },
              end: {
                line: end.line,
                character: end.column
              }
            }
          };
        }
      );
    }
  });
};
function parse(sourceCode, settings) {
  try {
    const parser = createParser(settings);
    return parser.entry.tryParse(sourceCode);
  } catch {
    return [];
  }
}

// src/ideExtension/config.ts
var ideExtensionConfig = (settings) => () => ({
  "inlang.app.ideExtension": {
    messageReferenceMatchers: [
      async (args) => {
        return parse(args.documentText, settings);
      }
    ],
    extractMessageOptions: [
      {
        callback: (args) => `{t("${args.messageId}")}`
      }
    ],
    documentSelectors: [
      {
        language: "javascript"
      },
      {
        language: "typescript"
      },
      {
        language: "svelte"
      }
    ]
  }
});

// src/plugin.ts
var import_flat = __toESM(require_flat(), 1);
var SPACING = {};
var NESTED = {};
var FILE_HAS_NEW_LINE = {};
function defaultSpacing() {
  const values = Object.values(SPACING);
  return values.sort((a, b) => values.filter((v) => v === a).length - values.filter((v) => v === b).length).pop() ?? 2;
}
function defaultNesting() {
  const values = Object.values(NESTED);
  return values.sort((a, b) => values.filter((v) => v === a).length - values.filter((v) => v === b).length).pop() ?? false;
}
var plugin = {
  meta: {
    id: "inlang.plugin.i18next",
    displayName: { en: "i18next" },
    description: { en: "i18next plugin for inlang" },
    marketplace: {
      icon: "https://github.com/inlang/inlang/blob/main/source-code/plugins/i18next/assets/icon.png?raw=true",
      linkToReadme: {
        en: "https://github.com/inlang/inlang/tree/main/source-code/plugins/i18next"
      },
      keywords: ["i18next", "react", "nextjs"],
      publisherName: "inlang",
      publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg"
    }
  },
  loadMessages: async ({ languageTags, settings, nodeishFs }) => {
    settings.variableReferencePattern = settings.variableReferencePattern || ["{{", "}}"];
    throwIfInvalidSettings(settings);
    SPACING = {};
    NESTED = {};
    FILE_HAS_NEW_LINE = {};
    return loadMessages({
      nodeishFs,
      settings,
      languageTags
    });
  },
  saveMessages: async ({ messages, settings, nodeishFs }) => {
    settings.variableReferencePattern = settings.variableReferencePattern || ["{{", "}}"];
    throwIfInvalidSettings(settings);
    return saveMessages({
      nodeishFs,
      settings,
      messages
    });
  },
  detectedLanguageTags: async ({ nodeishFs, settings }) => {
    settings.ignore = settings.ignore || [];
    return detectLanguageTags({
      nodeishFs,
      settings
    });
  },
  addAppSpecificApi: ({ settings }) => {
    return { ...ideExtensionConfig(settings) };
  }
};
async function loadMessages(args) {
  const messages = [];
  for (const languageTag of args.languageTags) {
    if (typeof args.settings.pathPattern !== "string") {
      for (const [prefix, path] of Object.entries(args.settings.pathPattern)) {
        const messagesFromFile = await getFileToParse(path, languageTag, args.nodeishFs);
        for (const [key, value] of Object.entries(messagesFromFile)) {
          const prefixedKey = prefix + ":" + replaceAll(key, "u002E", ".");
          addVariantToMessages(messages, prefixedKey, languageTag, value, args.settings);
        }
      }
    } else {
      const messagesFromFile = await getFileToParse(
        args.settings.pathPattern,
        languageTag,
        args.nodeishFs
      );
      for (const [key, value] of Object.entries(messagesFromFile)) {
        addVariantToMessages(
          messages,
          replaceAll(key, "u002E", "."),
          languageTag,
          value,
          args.settings
        );
      }
    }
  }
  return messages;
}
async function getFileToParse(path, languageTag, nodeishFs) {
  const pathWithLanguage = path.replace("{languageTag}", languageTag);
  try {
    const file = await nodeishFs.readFile(pathWithLanguage, { encoding: "utf-8" });
    SPACING[pathWithLanguage] = detectJsonSpacing(file);
    NESTED[pathWithLanguage] = detectIsNested(file);
    FILE_HAS_NEW_LINE[pathWithLanguage] = file.endsWith("\n");
    const flattenedMessages = NESTED[pathWithLanguage] ? (0, import_flat.flatten)(JSON.parse(file), {
      transformKey: function(key) {
        return replaceAll(key, ".", "u002E");
      }
    }) : JSON.parse(file);
    return flattenedMessages;
  } catch (e) {
    if (e.code === "FileNotFound" || e.code === "ENOENT") {
      return {};
    }
    throw e;
  }
}
var addVariantToMessages = (messages, key, languageTag, value, settings) => {
  const messageIndex = messages.findIndex((m) => m.id === key);
  if (messageIndex !== -1) {
    const variant = {
      languageTag,
      match: {},
      pattern: parsePattern(value, settings.variableReferencePattern)
    };
    messages[messageIndex]?.variants.push(variant);
  } else {
    const message = {
      id: key,
      selectors: [],
      variants: []
    };
    message.variants = [
      {
        languageTag,
        match: {},
        pattern: parsePattern(value, settings.variableReferencePattern)
      }
    ];
    messages.push(message);
  }
};
function parsePattern(text, variableReferencePattern) {
  const expression = variableReferencePattern[1] ? new RegExp(
    `(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`,
    "g"
  ) : new RegExp(`(${variableReferencePattern}\\w+)`, "g");
  const pattern = text.split(expression).filter((element) => element !== "").map((element) => {
    if (expression.test(element) && variableReferencePattern[0]) {
      return {
        type: "VariableReference",
        name: variableReferencePattern[1] ? element.slice(
          variableReferencePattern[0].length,
          // negative index, removing the trailing pattern
          -variableReferencePattern[1].length
        ) : element.slice(variableReferencePattern[0].length)
      };
    } else {
      return {
        type: "Text",
        value: element
      };
    }
  });
  return pattern;
}
async function saveMessages(args) {
  if (typeof args.settings.pathPattern === "object") {
    const storage = {};
    for (const message of args.messages) {
      for (const variant of message.variants) {
        const prefix = message.id.includes(":") ? message.id.split(":")[0] : (
          // TODO remove default namespace functionallity, add better parser
          Object.keys(args.settings.pathPattern)[0]
        );
        const resolvedId = message.id.replace(prefix + ":", "");
        storage[variant.languageTag] ??= {};
        storage[variant.languageTag][prefix] ??= {};
        storage[variant.languageTag][prefix][resolvedId] = variant.pattern;
      }
    }
    for (const [languageTag, _value] of Object.entries(storage)) {
      for (const path of Object.values(args.settings.pathPattern)) {
        const directoryPath = path.replace("{languageTag}", languageTag).split("/").slice(0, -1).join("/");
        try {
          await args.nodeishFs.readdir(directoryPath);
        } catch {
          await args.nodeishFs.mkdir(directoryPath);
        }
      }
      for (const [prefix, value] of Object.entries(_value)) {
        const pathWithLanguage = args.settings.pathPattern[prefix].replace(
          "{languageTag}",
          languageTag
        );
        await args.nodeishFs.writeFile(
          pathWithLanguage,
          serializeFile(
            value,
            SPACING[pathWithLanguage] ?? defaultSpacing(),
            FILE_HAS_NEW_LINE[pathWithLanguage],
            NESTED[pathWithLanguage] ?? defaultNesting(),
            args.settings.variableReferencePattern
          )
        );
      }
    }
  } else {
    const storage = {};
    for (const message of args.messages) {
      for (const variant of message.variants) {
        storage[variant.languageTag] ??= {};
        storage[variant.languageTag][message.id] = variant.pattern;
      }
    }
    for (const [languageTag, value] of Object.entries(storage)) {
      const pathWithLanguage = args.settings.pathPattern.replace("{languageTag}", languageTag);
      try {
        await args.nodeishFs.readdir(pathWithLanguage.split("/").slice(0, -1).join("/"));
      } catch {
        await args.nodeishFs.mkdir(pathWithLanguage.split("/").slice(0, -1).join("/"), {
          recursive: true
        });
      }
      await args.nodeishFs.writeFile(
        pathWithLanguage,
        serializeFile(
          value,
          SPACING[pathWithLanguage] ?? defaultSpacing(),
          FILE_HAS_NEW_LINE[pathWithLanguage],
          NESTED[pathWithLanguage] ?? defaultNesting(),
          args.settings.variableReferencePattern
        )
      );
    }
  }
}
function serializeFile(messages, space, endsWithNewLine, nested, variableReferencePattern) {
  let result = {};
  for (const [messageId, pattern] of Object.entries(messages)) {
    let id = replaceAll(messageId, "..", "u002E.");
    if (id.slice(-1) === ".") {
      id = id.replace(/.$/, "u002E");
    }
    result[id] = serializePattern(pattern, variableReferencePattern);
  }
  if (nested) {
    result = (0, import_flat.unflatten)(result, {
      //prevent numbers from creating arrays automatically
      object: true
    });
  }
  return replaceAll(JSON.stringify(result, void 0, space), "u002E", ".") + (endsWithNewLine ? "\n" : "");
}
function serializePattern(pattern, variableReferencePattern) {
  const result = [];
  for (const element of pattern) {
    switch (element.type) {
      case "Text":
        result.push(element.value);
        break;
      case "VariableReference":
        result.push(
          variableReferencePattern[1] ? `${variableReferencePattern[0]}${element.name}${variableReferencePattern[1]}` : `${variableReferencePattern[0]}${element.name}`
        );
        break;
      default:
        throw new Error(`Unknown message pattern element of type: ${element?.type}`);
    }
  }
  return result.join("");
}
async function detectLanguageTags(args) {
  const languages = [];
  const pathArray = typeof args.settings.pathPattern !== "string" ? Object.values(args.settings.pathPattern) : [args.settings.pathPattern];
  for (const path of pathArray) {
    const [pathBeforeLanguage] = path.split("{languageTag}");
    const parentDirectory = await args.nodeishFs.readdir(pathBeforeLanguage);
    for (const filePath of parentDirectory) {
      const fileExists = await Promise.resolve(
        args.nodeishFs.readFile(path.replace("{languageTag}", filePath.replace(".json", ""))).then(() => true).catch(() => false)
      );
      if (fileExists && args.settings.ignore?.some((s) => s === filePath) === false) {
        languages.push(filePath.replace(".json", ""));
      }
    }
  }
  return [...new Set(languages)];
}

// src/index.ts
var src_default = {
  plugins: [plugin]
};
export {
  src_default as default
};
