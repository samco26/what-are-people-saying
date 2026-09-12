# Checking the app without Node

A stand-in for `npm run build` on a machine with no Node.js. It is not a
build: it parses every source file with Babel's TypeScript and JSX parser
(a syntax check, not a type check), mounts the app in a frame with React
and the Tailwind Play CDN, and answers `/api/consensus` by calling the
route handler directly. It found the app working on 11 September 2026.

```
powershell -NoProfile -ExecutionPolicy Bypass -File tools\no-node-check\serve.ps1
```

Then open http://localhost:8899/tools/no-node-check/harness.html in a
browser. The log at the top reports the syntax pass and any runtime error.
The console has helpers: `__type("the Keychron K2")`, `__submit()`,
`__click("Get Specific")`, `__size(390, 740)` (which also dispatches a resize event, since the pane fires none for a restyled frame), and `__respond(body)` to answer the next search with a given response.

Two things it cannot do: check types, and load the real Next.js. A passing
run here still needs `npm run build` before anything is called verified.
