export const isSnakeCase = (str: string): boolean => {
  // Check if the string is not null or undefined
  if (str == undefined || !str[0]) {
    return false;
  }

  // Check if the first character is lowercase
  if (str[0] !== str[0].toLowerCase() || str[0] === "_") {
    return false;
  }

  // Check if the string consists of lowercase letters and underscores
  for (const char of str) {
    if (!(char === "_" || (char >= "a" && char <= "z"))) {
      return false;
    }
  }

  // Check if consecutive underscores are not present
  if (str.includes("__")) {
    return false;
  }

  // Check if the string does not end with an underscore
  if (str.endsWith("_")) {
    return false;
  }

  return true;
};
