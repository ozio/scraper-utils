# API Style

This repo likes helpers that feel nice to call.

Not merely usable. Not merely short. Nice.

The target is an API shape that reads like intent, with names and arguments doing as much work as possible.

## Core taste

- Prefer direct names.
- Prefer early clarity over abstraction.
- Prefer call sites that almost read like prose.
- Prefer defaults in destructuring when an options object makes the API easier to love.
- Prefer tiny convenience wrappers when they remove friction from the calling code.

## Prefer this

```js
saveFile('hello', {
  to: '/tmp/greeting.txt',
  overwrite: true,
})
```

```js
downloadFile({
  from: imageURL,
  to: cachePath,
  createDirectories: true,
})
```

```js
const fixedAt = getFixedDate(new Date())
const median = calculateMedian(prices)
const phone = formatPhone('9265772603')
```

## Over this

```js
saveFile(path, data, (options = {}))
downloadFile(url, dest, opts)
formatPhone(int)
```

The problem is not that positional arguments are forbidden.

The problem is that they often hide intent at the call site.

If a function is still crystal clear with one or two positional arguments, keep it simple. If the call starts feeling anonymous, give the arguments names.

## Options object patterns

When an options object helps, prefer names like these:

- `to`
- `from`
- `at`
- `in`
- `with`
- `as`
- `for`
- `using`
- `overwrite`
- `encoding`
- `createDirectories`

Good:

```js
writeFile(contents, {
  to: outputPath,
  encoding: 'utf-8',
})
```

Also good:

```js
copyFile({
  from: sourcePath,
  to: destinationPath,
  onProgress,
})
```

Avoid this:

```js
listFilesIn({ in: directoryPath })
readEachSnapshotIn({ in: snapshotPath })
```

Prefer this:

```js
listFiles({ in: directoryPath })
readEachSnapshot({ in: snapshotPath })
```

If the function name already says the preposition, the options object should not have to say it again.

## Wrapper helpers are welcome

If an existing low-level helper works fine but is slightly clunky to call, it is okay to add a nicer entry point on top of it.

Example:

```js
export const writeFileTo = (to, contents) => {
  return writeFile(to, contents)
}
```

Even better when the final shape reads naturally:

```js
export const saveFile = (contents, options) => {
  return writeFile(options.to, contents)
}
```

The wrapper should not feel ornamental. It should make the common path feel more obvious.

## Documentation style

Every notable helper should ideally have:

1. A short JSDoc sentence.
2. A signature that communicates intent.
3. One example that looks good enough to copy into real code.

Example:

```js
/**
 * Saves text to a file, creating parent directories when needed.
 */
saveFile('hello', {
  to: '/tmp/greeting.txt',
  createDirectories: true,
})
```

## Standard for new helpers

Before adding a helper, ask:

- Does the name feel obvious?
- Does the call site feel named instead of positional?
- Would a tiny wrapper make this more lovable?
- Is the default path visible in one screenful?
- Does the JSDoc show the intended usage?

If yes, it probably belongs here.
