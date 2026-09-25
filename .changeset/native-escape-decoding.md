---
'seroval': patch
---

Decode escaped strings with an index scan instead of a per-match `replace` callback, and hand JSON-compatible escapes to `JSON.parse`.
