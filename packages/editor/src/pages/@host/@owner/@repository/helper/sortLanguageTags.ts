export function sortLanguageTags(arr: string[], sourceLanguage: string) {
  arr.sort();
  const sourceIndex = arr.indexOf(sourceLanguage);
  arr.splice(sourceIndex, 1);
  arr.unshift(sourceLanguage);
  return arr;
}
