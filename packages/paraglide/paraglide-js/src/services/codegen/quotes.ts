/** Wrap the given string in double quotes */
export const doubleQuote = (str: string) => `"${str.replace(/"/g, '\\"')}"`;
/** Wrap the given string in backticks */
export const backtick = (str: string) => `\`${str}\``;
