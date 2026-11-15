# Virentia Documentation

Documentation site for Virentia, built with VitePress.

```sh
pnpm install
pnpm dev
pnpm build
```

Package guides have shared EN/RU TypeScript snippets in
`docs/examples/packages`. The snippets and their executable tests are checked
against built sibling repositories (`../virentia`, `../forms`, `../storage`,
`../net`, `../router`):

```sh
# From ../virentia: prepare the local links and build all 19 packages.
node scripts/check-ecosystem.mjs --phase build
# From this documentation repository:
pnpm check:packages
pnpm check:ui
pnpm docs:build
```

`check:packages` checks EN/RU page and snippet parity, navigation, local links
and anchors for Forms/Storage/Net/Router. It compiles the included examples and
runs their tests sequentially, including child/ref ownership, nested DTO/snapshot
transfer, storage cleanup, Net units and router history cleanup. Temporary emitted
files are removed. `VIRENTIA_SOURCE_ROOT` can point to another main Virentia
checkout with the same sibling layout. It does not install or publish packages.

The native UI SSR/hydration regression for nested form fields lives in
`../virentia/ecosystem/tests/nested-fields-hydration.test.ts`; run
`node scripts/check-ecosystem.mjs --phase integration` from that repository.
The package-doc checker covers the maintained included snippets, not every
illustrative Markdown fence on the site.
