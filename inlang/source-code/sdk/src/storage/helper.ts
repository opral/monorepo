import { Message, Variant } from "../versionedInterfaces.js";

const fileExtension = ".json";

export function getMessageIdFromPath(path: string) {
  if (!path.endsWith(fileExtension)) {
    return;
  }

  const cleanedPath = path.replace(/\/$/, ""); // This regex matches a trailing slash and replaces it with an empty string
  const messageFileName = cleanedPath.split("/").join("_"); // we split by the first leading namespace or _ separator - make sure slashes don't exit in the id
  // const messageFileName = pathParts.at(-1)!

  const lastDotIndex = messageFileName.lastIndexOf(".");

  // Extract until the last dot (excluding the dot)
  return messageFileName.slice(0, Math.max(0, lastDotIndex));
}

export function getPathFromMessageId(id: string) {
  const path = id.replace("_", "/") + fileExtension;
  return path;
}

/**
 * Returns a copy of a message object with sorted variants and object keys.
 * This produces a deterministic result when passed to stringify
 * independent of the initialization order.
 */
export function normalizeMessage(message: Message) {
  // order keys in message
  const messageWithSortedKeys: any = {};
  for (const key of Object.keys(message).sort()) {
    messageWithSortedKeys[key] = (message as any)[key];
  }

  // order variants
  messageWithSortedKeys["variants"] = messageWithSortedKeys["variants"]
    .sort((variantA: Variant, variantB: Variant) => {
      // compare by language
      const languageComparison = variantA.languageTag.localeCompare(
        variantB.languageTag,
      );

      // if languages are the same, compare by match
      if (languageComparison === 0) {
        return variantA.match.join("-").localeCompare(variantB.match.join("-"));
      }

      return languageComparison;
    })
    // order keys in each variant
    .map((variant: Variant) => {
      const variantWithSortedKeys: any = {};
      for (const variantKey of Object.keys(variant).sort()) {
        if (variantKey === "pattern") {
          variantWithSortedKeys[variantKey] = (variant as any)["pattern"].map(
            (token: any) => {
              const tokenWithSortedKey: any = {};
              for (const tokenKey of Object.keys(token).sort()) {
                tokenWithSortedKey[tokenKey] = token[tokenKey];
              }
              return tokenWithSortedKey;
            },
          );
        } else {
          variantWithSortedKeys[variantKey] = (variant as any)[variantKey];
        }
      }
      return variantWithSortedKeys;
    });

  return messageWithSortedKeys as Message;
}

export function stringifyMessage(message: Message) {
  return JSON.stringify(normalizeMessage(message), undefined, 4);
}
