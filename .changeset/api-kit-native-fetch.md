---
'@safe-global/api-kit': patch
---

Use the native `fetch` API instead of `node-fetch`. Node.js >= 22 ships a stable global `fetch`, so the `node-fetch` dependency and its `@types/node-fetch` types are removed. `sendRequest` now calls the global `fetch` in every runtime (browsers, Node.js, workers and edge runtimes without a `window` object) and no longer picks an implementation based on `window`. Network errors thrown by `fetch` surface as the runtime's own `TypeError` instead of node-fetch's `FetchError`; HTTP error responses still throw `HttpError` as before.
