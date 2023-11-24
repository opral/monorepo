const sourceLanguageTag = "en";
let languageTag = () => sourceLanguageTag;
const setLanguageTag = (tag) => {
  if (typeof tag === "function") {
    languageTag = tag;
  } else {
    languageTag = () => tag;
  }
};
export {
  languageTag as l,
  setLanguageTag as s
};
