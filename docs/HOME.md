# Scraper Utils

Small utilities for scraping, formatting, files, queues, network access, and the kind of helper functions that should feel pleasant to call.

This site is generated from the repo itself:

- `JSDoc` from exported utilities
- markdown guides from the `docs/` folder
- explicit `target` and `legacy` style metadata from exported utilities

## What lives here

- expressive wrappers around low-level helpers
- file and gzip utilities
- network fetch/download helpers
- formatting and validation helpers
- queue and text classes

## Docs modes

The generated docs now separate public APIs into two styles:

- `Target Style` is the preferred style for new code.
- `Legacy Style` is older public API that still exists, but is not the default direction.
- `Both` shows the split side by side when you want to compare or migrate.

The global selector in the sidebar controls which style the docs emphasize. The default is `Target Style`.

## Taste

This repo likes APIs that read like intent.

```js
await writeFile('hello', {
  to: '/tmp/greeting.txt',
  createDirectories: true,
})

const html = await readPage({
  at: 'https://example.com',
})
```

Not this:

```js
writeFile(path, data, options)
goto(url, proxy)
```

## Deployment

The site is built with `npm run docs:build`.

On GitHub, the `docs` workflow publishes the generated `site/` directory to GitHub Pages on every push to `master`.
