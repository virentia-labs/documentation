# JSX and SID metadata

There is no reactivity compiler. Plain JavaScript with h has the same update semantics; JSX is descriptor syntax only.

Configure standard jsx: react-jsx and jsxImportSource: @virentia/ui. jsx-runtime exports jsx/jsxs/Fragment/JSX; dev-runtime exports jsxDEV/Fragment/JSX. They return inert ElementDescriptors without executing view.

Core/compiler is a Babel metadata plugin; Core/compiler/vite is its Vite adapter. They assign SIDs to stores/events/model definitions/mutableStore, preserve explicit SIDs and leave JSX, branches, callbacks and await unchanged.

The UI Vite helper configures standard JSX and delegates optional SID instrumentation. ViteOptions includes root/namespace/sid and include/exclude RegExp or filename predicate. sid: false disables instrumentation; Babel is only required when instrumentation is enabled.

Match server/client root and namespace. Generated IDs are stable for the same source, not arbitrary declaration rearrangements across edits; use explicit SIDs for externally persisted state.

Root tags are declared metadata, not compiler-inferred reactive structure.
