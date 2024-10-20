export function joinPath(...parts: string[]): string {
  return parts.map((part) => part.replace(/\/$/, "")).join("/");
}
