---
'seroval': patch
---

Skip the escape loop for strings that need no escaping, and let long strings containing `<`, U+2028 or U+2029 use the native `JSON.stringify` path.
