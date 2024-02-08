// Browser Detection patterns have changed in the past and may change again in the future,
// so it's centralised here to make it easier to update if necessary.

const isBrowser = typeof window !== "undefined"

export const browser = isBrowser
export const server = !isBrowser
