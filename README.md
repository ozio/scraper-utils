# `@mr_ozio/scraper-utils`

Small utilities for scraping, formatting, files, queues, and network work, with APIs that try to read like intent.

## Install

```bash
npm install @mr_ozio/scraper-utils
```

This package is ESM-only and targets Node.js 18+.

## The shape

You can import from the package root:

```js
import {
  writeFileTo,
  readFileFrom,
  readPage,
  Queue,
  formatTimeRange,
} from '@mr_ozio/scraper-utils'
```

Or use extensionless subpath imports when you want a narrower surface:

```js
import { writeFileTo } from '@mr_ozio/scraper-utils/fs/file'
import { averageOf } from '@mr_ozio/scraper-utils/helpers/calculateAverage'
import { Queue } from '@mr_ozio/scraper-utils/classes/Queue'
```

## Examples

Write a file with a named destination:

```js
import { writeFileTo, readFileFrom } from '@mr_ozio/scraper-utils'

await writeFileTo('hello', {
  to: '/tmp/greeting.txt',
  createDirectories: true,
})

const greeting = await readFileFrom({
  from: '/tmp/greeting.txt',
})
```

Read a page with a named URL:

```js
import { readPage } from '@mr_ozio/scraper-utils'

const html = await readPage({
  at: 'https://example.com',
})
```

Use the queue class directly:

```js
import { Queue } from '@mr_ozio/scraper-utils'

const queue = new Queue({
  streams: 2,
  process: async (item) => item,
})

queue.addMany(['a', 'b', 'c'])
```

## Included modules

- `classes`
- `constants`
- `formatters`
- `fs`
- `helpers`
- `network`
- `printers`
- `validators`

## Publishing notes

The package only publishes the runtime source directories plus the root entrypoint, so tests, docs output, and scripts stay out of the npm tarball.
