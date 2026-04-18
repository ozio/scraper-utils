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

## Target style

The target here is not "generic modern JavaScript."

The target is a JavaScript API that feels calm, named, and a little framework-like. Think Apple or Swift API design taste, translated into JS without pretending JS has Swift syntax.

In the generated docs, this preferred shape is labeled `Target Style`. Older public APIs are labeled `Legacy Style`. The docs can show either one or both, but `Target Style` is the default view.

That usually means:

- the function name is an action
- the important argument names are visible at the call site
- the function name and first argument almost read like a phrase
- defaults are obvious in the signature
- booleans read clearly as booleans
- the common path looks beautiful without needing comments

Good:

```js
writeFile('hello', {
  to: '/tmp/greeting.txt',
  createDirectories: true,
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
readPage({
  at: 'https://example.com',
  proxy: 'tor',
})
```

Less in taste:

```js
writeFile(path, data, opts)
downloadFile(url, dest, opts)
showAlert(title, message, buttons)
```

The issue is not just positional arguments.

The issue is that the call site stops carrying meaning.

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

## Naming principles

When shaping a new API, aim for these defaults:

- Side-effecting functions should usually be verbs: `save`, `write`, `load`, `present`, `remove`, `move`, `request`.
- Value-returning helpers can be more neutral when that reads better.
- Booleans should read like booleans: `isOpaque`, `hasBorders`, `allowsCaching`, `shouldRetry`.
- Prefer semantic parameter names over technical ones: `completionHandler` over `cb`, `preferredAction` over `defaultButton`.
- If a function already communicates the relationship, do not restate it in the name. Prefer `copyFile({ from, to })` over `copyFileTo({ from, to })`.
- If a tiny namespace or focused class makes the call site feel more obvious, that is welcome: `FileSystem.save(...)`, `ImageRenderer.render(...)`.

Another good test:

- Does the name feel like something you would be happy to autocomplete and call ten times in a row?

## Async and completion-style APIs

If an API benefits from both promise-based and completion-style usage, prefer shapes that feel related rather than invented independently.

Example:

```js
async function requestAuthorization(forResource) {
  return { granted: true }
}
```

```js
function requestAuthorization(forResource, completionHandler) {
  const operation = Promise.resolve({ granted: true })

  if (completionHandler) {
    operation.then((result) => completionHandler(result, null)).catch((error) => completionHandler(null, error))
  }

  return operation
}
```

This is not a rule that every helper needs both forms.

It is a naming rule: if both forms exist, they should feel like the same API family.

## Wrapper helpers are welcome

If an existing low-level helper works fine but is slightly clunky to call, it is okay to add a nicer entry point on top of it.

Example:

```js
export const writeReport = (contents, { to }) => {
  return writeFile(contents, { to })
}
```

Even better when the final shape reads naturally:

```js
export const saveFile = (contents, options) => {
  return writeFile(contents, options)
}
```

The wrapper should not feel ornamental. It should make the common path feel more obvious, not repeat a preposition the options object already says.

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
writeFile('hello', {
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
