import "urlpattern-polyfill";

const pattern = new URLPattern("/*", "https://example.com");

console.log(pattern.test("/", "https://example.com"));

console.log(pattern.test("/page", "https://example.com"));

console.log(pattern.test("/page/blabla", "https://example.com"));
