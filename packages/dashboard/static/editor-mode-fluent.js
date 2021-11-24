/* global ace */

ace.define(
    "ace/mode/fluent_highlight_rules",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"],
    highlighting
);

ace.define(
    "ace/mode/fluent",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/fluent_highlight_rules"],
    mode
);

function highlighting(acequire, exports) {
    const oop = acequire("../lib/oop");
    const TextHighlightRules = acequire("./text_highlight_rules").TextHighlightRules;

    const FluentHighlightRules = function() {

        const _ = '\\s*';
        const number = '[0-9]+(?:\\.[0-9]+)?';
        const identifier = '[a-zA-Z-][a-zA-Z0-9_-]*';

        this.$rules = {
            start : [
                {
                    token: "comment",
                    regex: /^#{1,3}($| .*$)/
                },
                {
                    token: "entity.name",
                    regex: `^-?${identifier}${_}=`,
                    push: "value"
                },
                {
                    token: "entity.name",
                    regex: `^${_}\\.${identifier}${_}=`,
                    push: "value"
                },
                {
                    defaultToken: "invalid"
                }
            ],
            value : [
                {
                    // block_text
                    regex: /^\s+[^.*[{}\s]/,
                    token: "string.unquoted"
                },
                {
                    // inline_placeable
                    regex : /{/,
                    token : "paren",
                    push : "placeable"
                },
                {
                    // block_placeable
                    regex : /^\s*{/,
                    token : "paren",
                    push : "placeable"
                },
                {
                    // blank_line
                    regex: /^\s*$/,
                    token: "string.unquoted"
                },
                {
                    regex: /^/,
                    next: "pop"
                },
                {
                    // inline_text
                    defaultToken: "string.unquoted"
                }
            ],
            placeable : [
                {
                    regex : `^(${_})(\\*?\\[${_})(${number})(${_}\\])`,
                    token : ["blank", "keyword", "constant.numeric", "keyword"],
                    push: "value"
                },
                {
                    regex : `^(${_})(\\*?\\[${_})(${identifier})(${_}\\])`,
                    token : ["blank", "keyword", "keyword", "keyword"],
                    push: "value"
                },
                {
                    regex : /".*"/,
                    token : "string.quoted"
                },
                {
                    regex : /[A-Z][A-Z_?-]*/,
                    token : "entity.name.function",
                },
                {
                    regex : /\(/,
                    token : "paren",
                },
                {
                    regex : /\s*,\s*/,
                    token : "punctuation",
                },
                {
                    regex : `${identifier}\\s*:\\s*`,
                    token : "keyword",
                },
                {
                    regex : /\)/,
                    token : "paren"
                },
                {
                    regex : number,
                    token : "constant.numeric"
                },
                {
                    regex : `\\$${identifier}`,
                    token : "variable.parameter"
                },
                {
                    regex : `(-${identifier})(\\[)(${number})(\\])`,
                    token : ["variable", "paren", "constant.numeric", "paren"]
                },
                {
                    regex : `(-${identifier})(\\[)(${identifier})(\\])`,
                    token : ["variable", "paren", "keyword", "paren"]
                },
                {
                    regex : `(${identifier})(\\.)(${identifier})`,
                    token : ["variable", "punctuation.operator", "keyword"]
                },
                {
                    regex : identifier,
                    token : "variable"
                },
                {
                    regex : `-${identifier}`,
                    token : "variable"
                },
                {
                    regex : /\s*->\s*$/,
                    token : "keyword.operator",
                },
                {
                    regex: /\s+/,
                    token: "blank"
                },
                {
                    regex : /}/,
                    token : "paren",
                    next : "pop"
                },
                {
                    defaultToken: "invalid"
                }
            ]
        };

        this.normalizeRules();

    };

    oop.inherits(FluentHighlightRules, TextHighlightRules);
    exports.FluentHighlightRules = FluentHighlightRules;
}

function mode(acequire, exports) {
    const oop = acequire("../lib/oop");
    const TextMode = acequire("./text").Mode;
    const FluentHighlightRules = acequire("./fluent_highlight_rules").FluentHighlightRules;

    const Mode = function() {
        this.HighlightRules = FluentHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function() {
        this.$id = "ace/mode/fluent";
    }).call(Mode.prototype);

    exports.Mode = Mode;
}