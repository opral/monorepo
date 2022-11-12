# inlang/cors-proxy

GitHub and Gitlab require cors proxies. Otherwise, cloning and pushing is blocked.

Nice side benefit: We can use the [http-only cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies) which contains the github access token to
requests.
