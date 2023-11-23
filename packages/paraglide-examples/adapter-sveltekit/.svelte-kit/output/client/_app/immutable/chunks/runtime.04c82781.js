let _onSetLanguageTag;
const sourceLanguageTag = "en";
let languageTag = () => sourceLanguageTag;
const setLanguageTag = (tag) => {
  if (typeof tag === "function") {
    languageTag = tag;
  } else {
    languageTag = () => tag;
  }
  if (_onSetLanguageTag !== void 0) {
    _onSetLanguageTag(languageTag());
  }
};
const onSetLanguageTag = (fn) => {
  if (_onSetLanguageTag !== void 0) {
    throw new Error("@inlang/paraglide-js: The `onSetLanguageTag()` callback has already been defined.\n\nThe `onSetLanguageTag()` callback can only be defined once to avoid unexpected behavior.\n\n 1) Try searching for `onSetLanguageTag()` in your codebase for potential duplicated.\n 2) It might be that your framework is calling `onSetLanguageTag()` multiple times. Try to move the `onSetLanguageTag()` out of the rendering scope like a React component.");
  }
  _onSetLanguageTag = fn;
};
export {
  languageTag as l,
  onSetLanguageTag as o,
  setLanguageTag as s
};
