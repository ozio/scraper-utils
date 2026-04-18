import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'site')
const ASSETS_DIR = path.join(OUTPUT_DIR, 'assets')

const SOURCE_GROUPS = [
  { title: 'Helpers', dir: 'helpers' },
  { title: 'File System', dir: 'fs' },
  { title: 'Formatters', dir: 'formatters' },
  { title: 'Validators', dir: 'validators' },
  { title: 'Network', dir: 'network' },
  { title: 'Classes', dir: 'classes' },
  { title: 'Printers', dir: 'printers' },
]

const DOC_PAGES = [
  { title: 'Home', source: 'docs/HOME.md', target: 'index.html' },
  { title: 'API Style', source: 'docs/API_STYLE.md', target: 'guides/api-style.html' },
]
const API_STYLE_OPTIONS = [
  { value: 'target', label: 'Target Style' },
  { value: 'legacy', label: 'Legacy Style' },
  { value: 'both', label: 'Both' },
]
const API_STYLE_STORAGE_KEY = 'scraper-utils-docs-api-style'
const API_STYLE_LABELS = Object.fromEntries(API_STYLE_OPTIONS.map(({ value, label }) => [value, label]))

const escapeHtml = (string = '') =>
  string.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const slugify = (string) =>
  string
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

const titleCase = (string) =>
  string
    .split(/[-_/]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')

const normalizeComparableText = (string = '') => string.toLowerCase().replaceAll(/[^a-z0-9]+/g, '')

const formatDisplayDate = (value) => {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return `${value}`
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date)
}

const stripLeadingTitle = ({ from, matching }) => {
  const lines = from.split('\n')
  const firstContentLineIndex = lines.findIndex((line) => line.trim())

  if (firstContentLineIndex === -1) {
    return from
  }

  const heading = lines[firstContentLineIndex].match(/^(#{1,6})\s+(.+)$/)

  if (!heading) {
    return from
  }

  if (normalizeComparableText(heading[2]) !== normalizeComparableText(matching)) {
    return from
  }

  lines.splice(firstContentLineIndex, 1)

  if (!lines[firstContentLineIndex]?.trim()) {
    lines.splice(firstContentLineIndex, 1)
  }

  return lines.join('\n')
}

const toRelativeHref = (fromPagePath, targetPath) => {
  const fromDirectory = path.posix.dirname(fromPagePath)

  if (fromDirectory === '.') {
    return targetPath
  }

  return path.posix.relative(fromDirectory, targetPath)
}

const renderInlineMarkdown = (source) => {
  let html = escapeHtml(source)

  html = html.replaceAll(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  return html
}

const renderMarkdown = (source) => {
  const lines = source.split('\n')
  const parts = []
  let paragraph = []
  let listItems = []
  let codeLines = []
  let codeLanguage = ''
  let inCodeBlock = false

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    parts.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    parts.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`)
    listItems = []
  }

  const flushCode = () => {
    if (codeLines.length === 0) return
    const langClass = codeLanguage ? `class="language-${escapeHtml(codeLanguage)}"` : 'class="language-javascript"'
    parts.push(
      `<div class="code-block-wrapper"><pre><code ${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre></div>`
    )
    codeLines = []
    codeLanguage = ''
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCode()
        inCodeBlock = false
      } else {
        flushParagraph()
        flushList()
        inCodeBlock = true
        codeLanguage = line.slice(3).trim()
      }

      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)

    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const text = heading[2].trim()
      const id = slugify(text)

      parts.push(`<h${level} id="${id}">${renderInlineMarkdown(text)}</h${level}>`)
      continue
    }

    const listItem = line.match(/^-\s+(.+)$/)

    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      continue
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/)

    if (orderedItem) {
      flushParagraph()
      listItems.push(orderedItem[1])
      continue
    }

    paragraph.push(line.trim())
  }

  flushParagraph()
  flushList()
  flushCode()

  return parts.join('\n')
}

const parseTypedTag = (line, tag) => {
  const value = line.slice(tag.length).trim()

  if (!value.startsWith('{')) {
    return { type: '', rest: value }
  }

  let depth = 0

  for (let index = 0; index < value.length; index++) {
    const character = value[index]

    if (character === '{') depth += 1
    if (character === '}') depth -= 1

    if (depth === 0) {
      return {
        type: value.slice(1, index),
        rest: value.slice(index + 1).trim(),
      }
    }
  }

  return { type: value.slice(1), rest: '' }
}

const parseJsdoc = (comment) => {
  if (!comment) {
    return {
      description: '',
      params: [],
      returns: null,
      examples: [],
      since: '',
      version: '',
      date: '',
      style: '',
    }
  }

  const lines = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))

  const description = []
  const params = []
  const examples = []
  let returns = null
  let since = ''
  let version = ''
  let date = ''
  let style = ''
  let currentTag = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (line.startsWith('@param ')) {
      currentTag = 'param'
      const { type, rest } = parseTypedTag(line, '@param')
      const match = rest.match(/^(\[?[^\s\]]+\]?)(?:\s+(.*))?$/)

      params.push({
        type,
        name: match?.[1] || '',
        description: match?.[2] || '',
      })
      continue
    }

    if (line.startsWith('@returns ')) {
      currentTag = 'returns'
      const { type, rest } = parseTypedTag(line, '@returns')
      returns = {
        type,
        description: rest,
      }
      continue
    }

    if (line.startsWith('@since ')) {
      currentTag = 'since'
      since = line.replace('@since', '').trim()
      continue
    }

    if (line.startsWith('@version ')) {
      currentTag = 'version'
      version = line.replace('@version', '').trim()
      continue
    }

    if (line.startsWith('@date ')) {
      currentTag = 'date'
      date = line.replace('@date', '').trim()
      continue
    }

    if (trimmed.startsWith('@style ')) {
      currentTag = 'style'
      style = trimmed.replace('@style', '').trim()
      continue
    }

    if (line.startsWith('@example')) {
      currentTag = 'example'
      const value = line.replace('@example', '').trim()
      examples.push(value ? [value] : [])
      continue
    }

    if (line.startsWith('@')) {
      currentTag = null
      continue
    }

    if (!line.trim()) {
      currentTag = null
      description.push('')
      continue
    }

    if (currentTag === 'param' && params.length > 0) {
      params[params.length - 1].description = [params[params.length - 1].description, line.trim()]
        .filter(Boolean)
        .join(' ')
      continue
    }

    if (currentTag === 'returns') {
      returns = returns || { type: '', description: '' }
      returns.description = [returns.description, line.trim()].filter(Boolean).join(' ')
      continue
    }

    if (currentTag === 'since') {
      since = [since, line.trim()].filter(Boolean).join(' ')
      continue
    }

    if (currentTag === 'version') {
      version = [version, line.trim()].filter(Boolean).join(' ')
      continue
    }

    if (currentTag === 'date') {
      date = [date, line.trim()].filter(Boolean).join(' ')
      continue
    }

    if (currentTag === 'example' && examples.length > 0) {
      examples[examples.length - 1].push(line)
      continue
    }

    description.push(line)
  }

  return {
    description: description.join('\n').trim(),
    params,
    returns,
    examples: examples.map((example) => example.join('\n').trim()).filter(Boolean),
    since,
    version,
    date,
    style,
  }
}

const countBraces = (line) => ({
  open: (line.match(/{/g) || []).length,
  close: (line.match(/}/g) || []).length,
})

const braceDelta = (line) => {
  const { open, close } = countBraces(line)
  return open - close
}

const readJsdocComment = (lines, startIndex) => {
  const commentLines = [lines[startIndex]]
  let index = startIndex

  while (!lines[index].includes('*/')) {
    index += 1
    commentLines.push(lines[index])
  }

  return {
    comment: commentLines.join('\n'),
    endIndex: index,
  }
}

const findBlockEndIndex = (lines, startIndex) => {
  let depth = 0
  let sawOpeningBrace = false

  for (let index = startIndex; index < lines.length; index++) {
    depth += braceDelta(lines[index])

    if (!sawOpeningBrace && lines[index].includes('{')) {
      sawOpeningBrace = true
    }

    if (sawOpeningBrace && depth === 0) {
      return index
    }
  }

  return startIndex
}

const readSignatureUntilBody = (lines, startIndex) => {
  const signature = []

  for (let index = startIndex; index < lines.length; index++) {
    const line = lines[index]
    signature.push(line.trimEnd())

    if (line.trim().endsWith('{')) {
      return {
        signature: signature.join('\n').trim(),
        endIndex: index,
      }
    }
  }

  return {
    signature: signature.join('\n').trim(),
    endIndex: startIndex,
  }
}

const hasRenderableDocs = (docs = {}) =>
  Boolean(
    docs.description ||
      docs.params?.length ||
      docs.returns ||
      docs.examples?.length ||
      docs.since ||
      docs.version ||
      docs.date
  )

const isDocumentedEntity = (docs = {}, explicitlyDocumented = false) =>
  explicitlyDocumented ||
  Boolean(
    docs.description ||
      docs.params?.length ||
      docs.returns ||
      docs.examples?.length ||
      docs.since ||
      docs.version ||
      docs.date ||
      docs.style
  )

const getDocumentedItemCount = (items = []) =>
  items.reduce((count, item) => {
    const memberCount =
      item.members?.filter((member) => isDocumentedEntity(member.docs, member.isDocumented)).length || 0
    return count + (hasRenderableDocs(item.docs) ? 1 : 0) + memberCount
  }, 0)

const getMemberStyleCounts = (item) =>
  (item.members || []).reduce(
    (counts, member) => {
      if (!isDocumentedEntity(member.docs, member.isDocumented)) {
        return counts
      }

      if (member.docs.style === 'target') {
        counts.target += 1
      }

      if (member.docs.style === 'legacy') {
        counts.legacy += 1
      }

      return counts
    },
    { target: 0, legacy: 0 }
  )

const getExportStyleCounts = (item) => {
  const memberCounts = getMemberStyleCounts(item)
  const counts = {
    target: memberCounts.target,
    legacy: memberCounts.legacy,
  }

  if (item.docs?.style === 'target') {
    counts.target += 1
  }

  if (item.docs?.style === 'legacy') {
    counts.legacy += 1
  }

  return counts
}

const parseClassMembers = (lines, classStartIndex) => {
  const members = []
  const classEndIndex = findBlockEndIndex(lines, classStartIndex)
  let pendingComment = null
  let depth = 1

  for (let index = classStartIndex + 1; index < classEndIndex; index++) {
    const line = lines[index]
    const trimmed = line.trim()

    if (trimmed.startsWith('/**') && depth === 1) {
      const { comment, endIndex } = readJsdocComment(lines, index)
      pendingComment = comment
      index = endIndex
      continue
    }

    if (depth !== 1) {
      depth += braceDelta(line)
      continue
    }

    if (!trimmed || trimmed.startsWith('//')) {
      continue
    }

    if (trimmed.startsWith('#') || trimmed.startsWith('static #')) {
      depth += braceDelta(line)
      pendingComment = null
      continue
    }

    const docs = parseJsdoc(pendingComment)

    if (trimmed.startsWith('constructor(')) {
      const { signature } = readSignatureUntilBody(lines, index)
      const endIndex = findBlockEndIndex(lines, index)

      members.push({
        kind: 'constructor',
        name: 'constructor',
        signature,
        docs,
        isDocumented: Boolean(pendingComment),
      })

      pendingComment = null
      index = endIndex
      continue
    }

    const methodMatch = trimmed.match(/^(static\s+)?(async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/)

    if (methodMatch) {
      const { signature } = readSignatureUntilBody(lines, index)
      const endIndex = findBlockEndIndex(lines, index)
      const [, staticKeyword, asyncKeyword, name] = methodMatch

      members.push({
        kind: 'method',
        name,
        signature,
        isStatic: Boolean(staticKeyword),
        isAsync: Boolean(asyncKeyword),
        docs,
        isDocumented: Boolean(pendingComment),
      })

      pendingComment = null
      index = endIndex
      continue
    }

    const arrowMethodMatch = trimmed.match(/^(static\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(async\s+)?\(/)

    if (arrowMethodMatch) {
      const { signature } = readSignatureUntilBody(lines, index)
      const endIndex = findBlockEndIndex(lines, index)
      const [, staticKeyword, name, asyncKeyword] = arrowMethodMatch

      members.push({
        kind: 'method',
        name,
        signature,
        isStatic: Boolean(staticKeyword),
        isAsync: Boolean(asyncKeyword),
        docs,
        isDocumented: Boolean(pendingComment),
      })

      pendingComment = null
      index = endIndex
      continue
    }

    const fieldMatch = trimmed.match(/^(static\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\b/)

    if (fieldMatch && !trimmed.includes('(')) {
      const [, staticKeyword, name] = fieldMatch

      members.push({
        kind: 'field',
        name,
        signature: line.trim(),
        isStatic: Boolean(staticKeyword),
        docs,
        isDocumented: Boolean(pendingComment),
      })

      pendingComment = null
      continue
    }

    pendingComment = null
    depth += braceDelta(line)
  }

  return {
    members,
    endIndex: classEndIndex,
  }
}

const getConstSignature = (lines, startIndex) => {
  const signature = []

  for (let index = startIndex; index < lines.length; index++) {
    const line = lines[index]
    signature.push(line.trimEnd())

    if (line.includes('=>')) {
      break
    }
  }

  return signature.join('\n').trim()
}

const getClassSignature = (lines, startIndex) => lines[startIndex].trim()

const parseExports = async (relativePath) => {
  const fullPath = path.join(ROOT, relativePath)
  const source = await fs.readFile(fullPath, 'utf-8')
  const lines = source.split('\n')
  const exports = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const trimmed = line.trim()
    let comment = null

    if (trimmed.startsWith('/**')) {
      const parsedComment = readJsdocComment(lines, index)
      comment = parsedComment.comment
      index = parsedComment.endIndex + 1
    }

    const exportLine = lines[index]
    const exportTrimmed = exportLine?.trim()

    if (!exportTrimmed?.startsWith('export ')) {
      continue
    }

    if (exportTrimmed.startsWith('export const ')) {
      const name = exportTrimmed.match(/^export const\s+([A-Za-z0-9_$]+)/)?.[1]

      if (!name) continue

      const docs = parseJsdoc(comment)

      if (!docs.style) {
        throw new Error(`Missing @style for export ${name} in ${relativePath}`)
      }

      if (!['target', 'legacy'].includes(docs.style)) {
        throw new Error(`Invalid @style "${docs.style}" for export ${name} in ${relativePath}`)
      }

      exports.push({
        kind: 'const',
        name,
        signature: getConstSignature(lines, index),
        docs,
      })
      continue
    }

    if (exportTrimmed.startsWith('export class ')) {
      const name = exportTrimmed.match(/^export class\s+([A-Za-z0-9_$]+)/)?.[1]

      if (!name) continue

      const { members, endIndex } = parseClassMembers(lines, index)

      const docs = parseJsdoc(comment)

      if (!docs.style) {
        throw new Error(`Missing @style for export ${name} in ${relativePath}`)
      }

      if (!['target', 'legacy'].includes(docs.style)) {
        throw new Error(`Invalid @style "${docs.style}" for export ${name} in ${relativePath}`)
      }

      for (const member of members) {
        if (!isDocumentedEntity(member.docs, member.isDocumented)) {
          continue
        }

        if (!member.docs.style) {
          throw new Error(`Missing @style for member ${name}.${member.name} in ${relativePath}`)
        }

        if (!['target', 'legacy'].includes(member.docs.style)) {
          throw new Error(`Invalid @style "${member.docs.style}" for member ${name}.${member.name} in ${relativePath}`)
        }
      }

      exports.push({
        kind: 'class',
        name,
        signature: getClassSignature(lines, index),
        docs,
        members,
      })

      index = endIndex
    }
  }

  return exports
}

const readModules = async () => {
  const modules = []

  for (const group of SOURCE_GROUPS) {
    const folderPath = path.join(ROOT, group.dir)
    const fileNames = (await fs.readdir(folderPath)).filter((fileName) => fileName.endsWith('.mjs')).sort()

    for (const fileName of fileNames) {
      const relativePath = path.join(group.dir, fileName)
      const baseName = fileName.replace(/\.mjs$/, '')
      const pagePath = `api/${group.dir}-${baseName}.html`
      const exports = await parseExports(relativePath)

      modules.push({
        title: titleCase(baseName),
        slug: `${group.dir}-${baseName}`,
        group,
        fileName,
        relativePath,
        pagePath,
        exports,
      })
    }
  }

  return modules
}

const readPackageInfo = async () => {
  const packageJson = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf-8'))

  return {
    name: packageJson.name || 'scraper-utils',
    version: packageJson.version || '0.0.0',
    description: packageJson.description || '',
    generatedAt: formatDisplayDate(new Date()),
  }
}

const THEME_STORAGE_KEY = 'scraper-utils-docs-theme'

const THEME_BOOTSTRAP_SCRIPT = `(() => {
  const key = '${THEME_STORAGE_KEY}'
  const preference = localStorage.getItem(key) || 'system'
  const apiStyleKey = '${API_STYLE_STORAGE_KEY}'
  const apiStylePreference = localStorage.getItem(apiStyleKey) || 'target'
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedTheme = preference === 'system' ? (isDark ? 'dark' : 'light') : preference

  document.documentElement.dataset.theme = resolvedTheme
  document.documentElement.dataset.themePreference = preference
  document.documentElement.dataset.apiStyleMode = apiStylePreference
})()`

const PAGE_BEHAVIOR_SCRIPT = `(() => {
  const key = '${THEME_STORAGE_KEY}'
  const apiStyleKey = '${API_STYLE_STORAGE_KEY}'
  const root = document.documentElement
  const themeSelect = document.querySelector('[data-theme-select]')
  const apiStyleSelect = document.querySelector('[data-api-style-select]')
  const navSearch = document.querySelector('[data-nav-search]')
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const applyTheme = (preference) => {
    const resolvedTheme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference
    root.dataset.theme = resolvedTheme
    root.dataset.themePreference = preference
  }

  const syncThemeControl = () => {
    if (!themeSelect) return
    themeSelect.value = root.dataset.themePreference || 'system'
  }

  const applyApiStyleMode = (mode) => {
    root.dataset.apiStyleMode = mode

    const memberSections = document.querySelectorAll('[data-style-section-kind="member"]')
    memberSections.forEach((section) => {
      section.hidden = mode !== 'both' && section.dataset.styleSection !== mode
    })

    const apiCards = document.querySelectorAll('[data-target-count][data-legacy-count].api-card')
    apiCards.forEach((card) => {
      const targetCount = Number(card.dataset.targetCount || 0)
      const legacyCount = Number(card.dataset.legacyCount || 0)
      const shouldShow = mode === 'both' || (mode === 'target' ? targetCount > 0 : legacyCount > 0)
      card.hidden = !shouldShow
    })

    const exportSections = document.querySelectorAll('[data-style-section-kind="export"]')
    exportSections.forEach((section) => {
      const visibleCards = [...section.querySelectorAll('.api-card')].filter((card) => !card.hidden)
      section.hidden = visibleCards.length === 0
    })

    const moduleCards = document.querySelectorAll('[data-module-card]')
    moduleCards.forEach((card) => {
      const targetCount = Number(card.dataset.targetCount || 0)
      const legacyCount = Number(card.dataset.legacyCount || 0)
      const shouldShow = mode === 'both' || (mode === 'target' ? targetCount > 0 : legacyCount > 0)
      card.hidden = !shouldShow
    })

    const moduleGroups = document.querySelectorAll('[data-module-group]')
    moduleGroups.forEach((group) => {
      const visibleCards = [...group.querySelectorAll('[data-module-card]')].filter((card) => !card.hidden)
      group.hidden = visibleCards.length === 0
    })
  }

  const syncApiStyleControl = () => {
    if (!apiStyleSelect) return
    apiStyleSelect.value = root.dataset.apiStyleMode || 'target'
  }

  const handleSystemThemeChange = () => {
    if ((root.dataset.themePreference || 'system') !== 'system') return
    applyTheme('system')
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', (event) => {
      const preference = event.currentTarget.value
      localStorage.setItem(key, preference)
      applyTheme(preference)
    })
  }

  if (apiStyleSelect) {
    apiStyleSelect.addEventListener('change', (event) => {
      const mode = event.currentTarget.value
      localStorage.setItem(apiStyleKey, mode)
      applyApiStyleMode(mode)
    })
  }

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handleSystemThemeChange)
  } else if (typeof media.addListener === 'function') {
    media.addListener(handleSystemThemeChange)
  }

  syncThemeControl()
  syncApiStyleControl()
  applyApiStyleMode(root.dataset.apiStyleMode || 'target')

  const applyNavigationFilter = (query) => {
    const normalizedQuery = query.trim().toLowerCase()
    const groups = document.querySelectorAll('.navigation .nav-group')

    groups.forEach((group) => {
      const items = group.querySelectorAll('li')
      let visibleCount = 0

      items.forEach((item) => {
        const link = item.querySelector('a')
        const matches = !normalizedQuery || link.textContent.toLowerCase().includes(normalizedQuery)

        item.hidden = !matches

        if (matches) {
          visibleCount += 1
        }
      })

      group.hidden = visibleCount === 0
    })
  }

  if (navSearch) {
    navSearch.addEventListener('input', (event) => {
      applyNavigationFilter(event.currentTarget.value)
    })
  }

  applyNavigationFilter(navSearch?.value || '')

  const activeLink = document.querySelector('.navigation a[aria-current="page"]')

  if (activeLink) {
    requestAnimationFrame(() => {
      activeLink.scrollIntoView({ block: 'center', inline: 'nearest' })
    })
  }
})()`

const pageTemplate = ({ title, eyebrow, content, navigation, pagePath, packageInfo }) => {
  const pageDepth = pagePath.split('/').length - 1
  const assetPrefix = '../'.repeat(pageDepth)
  const libraryMeta = `v${packageInfo.version} · Generated ${packageInfo.generatedAt}`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>${THEME_BOOTSTRAP_SCRIPT}</script>
    <title>${escapeHtml(title)} · scraper-utils</title>
    <link rel="stylesheet" href="${assetPrefix}assets/style.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" />
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-sticky">
          <a class="brand" href="${assetPrefix}index.html">scraper-utils</a>
          ${packageInfo.description ? `<p class="brand-copy">${escapeHtml(packageInfo.description)}</p>` : ''}
          <p class="brand-meta">${escapeHtml(libraryMeta)}</p>
          <div class="sidebar-separator" aria-hidden="true"></div>
          <label class="nav-search">
            <span class="nav-search-label">Search</span>
            <input class="nav-search-input" type="search" placeholder="Filter sidebar" data-nav-search />
          </label>
          <label class="api-style-control">
            <span class="api-style-control-label">API Style</span>
            <select class="api-style-select" data-api-style-select>
              ${API_STYLE_OPTIONS.map(({ value, label }) => `<option value="${value}">${label}</option>`).join('')}
            </select>
          </label>
          <!--
          <label class="theme-control">
            <span class="theme-control-label">Theme</span>
            <select class="theme-select" data-theme-select>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          -->
          ${navigation}
        </div>
      </aside>
      <main class="content">
        <header class="content-header">
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="page-meta">${escapeHtml(`${packageInfo.name} · ${libraryMeta}`)}</p>
        </header>
        ${content}
      </main>
    </div>
    
    <!-- Syntax Highlighting Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
    <script>${PAGE_BEHAVIOR_SCRIPT}</script>
  </body>
</html>`
}

const renderNavigation = (modules, currentPagePath) => {
  const docsLinks = DOC_PAGES.map((page) => {
    const href = toRelativeHref(currentPagePath, page.target)
    const isActive = page.target === currentPagePath
    return `<li><a class="nav-link${isActive ? ' is-active' : ''}" href="${href}"${
      isActive ? ' aria-current="page"' : ''
    }>${escapeHtml(page.title)}</a></li>`
  }).join('')

  const groups = SOURCE_GROUPS.map((group) => {
    const links = modules
      .filter((module) => module.group.dir === group.dir)
      .map(
        (module) =>
          `<li><a class="nav-link${module.pagePath === currentPagePath ? ' is-active' : ''}" href="${toRelativeHref(
            currentPagePath,
            module.pagePath
          )}"${module.pagePath === currentPagePath ? ' aria-current="page"' : ''}>${escapeHtml(
            module.fileName
          )}</a></li>`
      )
      .join('')

    return `<section class="nav-group"><h2>${escapeHtml(group.title)}</h2><ul>${links}</ul></section>`
  }).join('')

  return `<nav class="navigation"><section class="nav-group"><h2>Guides</h2><ul>${docsLinks}</ul></section>${groups}</nav>`
}

const renderTypeBadge = (type) => `<span class="type-badge">${escapeHtml(type)}</span>`
const renderStyleBadge = (style) =>
  `<span class="style-badge style-badge-${escapeHtml(style)}">${escapeHtml(API_STYLE_LABELS[style] || style)}</span>`

const renderMetaLine = ({ type = '', description = '' }) =>
  [type ? renderTypeBadge(type) : '', description ? `<span>${renderInlineMarkdown(description)}</span>` : '']
    .filter(Boolean)
    .join('')

const renderJsdocMeta = (docs) =>
  [
    docs.version ? `<span class="doc-meta-pill">Version ${escapeHtml(docs.version)}</span>` : '',
    docs.since ? `<span class="doc-meta-pill">Since ${escapeHtml(docs.since)}</span>` : '',
    docs.date ? `<span class="doc-meta-pill">Date ${escapeHtml(formatDisplayDate(docs.date))}</span>` : '',
  ]
    .filter(Boolean)
    .join('')

const renderDocsMetaSection = (docs) => {
  const jsdocMeta = renderJsdocMeta(docs)

  const params = docs.params.length
    ? `<div class="meta-block"><h3>Parameters</h3><ul class="meta-list">${docs.params
        .map(
          (param) =>
            `<li><code>${escapeHtml(param.name)}</code><span class="meta-line">${renderMetaLine(param)}</span></li>`
        )
        .join('')}</ul></div>`
    : ''

  const returns = docs.returns
    ? `<div class="meta-block"><h3>Returns</h3><p class="meta-line">${renderMetaLine(docs.returns)}</p></div>`
    : ''

  const examples = docs.examples
    .map(
      (example) =>
        `<div class="meta-block"><h3>Example</h3><div class="code-block-wrapper"><pre><code class="language-javascript">${escapeHtml(
          example
        )}</code></pre></div></div>`
    )
    .join('')

  if (!jsdocMeta && !params && !returns && !examples) {
    return ''
  }

  return `
    ${jsdocMeta ? `<div class="doc-meta-row">${jsdocMeta}</div>` : ''}
    <div class="meta-section">
      ${params}
      ${returns}
      ${examples}
    </div>
  `
}

const renderDescription = (docs, emptyMessage = 'No description provided.') =>
  docs.description
    ? `<div class="prose">${renderMarkdown(docs.description)}</div>`
    : `<p class="muted empty-state">${emptyMessage}</p>`

const renderStyleNote = (style) => {
  if (style === 'legacy') {
    return `<p class="style-note style-note-legacy">Legacy API. Kept for older code and not the preferred choice for new code.</p>`
  }

  if (style === 'target') {
    return `<p class="style-note style-note-target">Target style API. Preferred for new code.</p>`
  }

  return ''
}

const renderMember = (member, ownerName) => {
  const memberId = slugify(`${ownerName}-${member.isStatic ? 'static-' : ''}${member.name}`)
  const kindLabel = [member.isStatic ? 'static' : '', member.kind].filter(Boolean).join(' ')

  return `<article class="member-card" id="${memberId}" data-style="${escapeHtml(member.docs.style)}">
    <div class="member-header">
      <div>
        <p class="api-kind">${escapeHtml(kindLabel)}</p>
        <h3 class="member-title">${escapeHtml(member.name)}</h3>
      </div>
      ${renderStyleBadge(member.docs.style)}
      <a class="anchor" href="#${memberId}" title="Link to ${escapeHtml(member.name)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </a>
    </div>
    <div class="code-block-wrapper member-signature">
      <pre><code class="language-javascript">${escapeHtml(member.signature)}</code></pre>
    </div>
    ${renderDescription(member.docs)}
    ${renderDocsMetaSection(member.docs)}
  </article>`
}

const renderMemberStyleSection = ({ style, members, ownerName, emptyMessage }) => `<section
  class="member-style-section"
  data-style-section="${style}"
  data-style-section-kind="member"
>
  <div class="style-section-header">
    <div>
      <p class="api-kind">${escapeHtml(API_STYLE_LABELS[style])}</p>
      <h3>${escapeHtml(API_STYLE_LABELS[style])}</h3>
    </div>
    <span class="badge">${members.length} members</span>
  </div>
  ${
    members.length > 0
      ? `<div class="members-grid">
          ${members.map((member) => renderMember(member, ownerName)).join('')}
        </div>`
      : `<p class="muted empty-state">${escapeHtml(emptyMessage)}</p>`
  }
</section>`

const renderExport = (item) => {
  const documentedMembers = (item.members || []).filter((member) =>
    isDocumentedEntity(member.docs, member.isDocumented)
  )
  const targetMembers = documentedMembers.filter((member) => member.docs.style === 'target')
  const legacyMembers = documentedMembers.filter((member) => member.docs.style === 'legacy')
  const counts = getExportStyleCounts(item)
  const members =
    item.kind === 'class' && documentedMembers.length
      ? `<div class="class-members">
        <div class="class-members-header">
          <h3>Members</h3>
          <span class="badge">${documentedMembers.length} items</span>
        </div>
        <div class="member-style-sections">
          ${renderMemberStyleSection({
            style: 'target',
            members: targetMembers,
            ownerName: item.name,
            emptyMessage: 'No target-style members on this class.',
          })}
          ${renderMemberStyleSection({
            style: 'legacy',
            members: legacyMembers,
            ownerName: item.name,
            emptyMessage: 'No legacy members on this class.',
          })}
        </div>
      </div>`
      : ''

  return `<article class="api-card" id="${escapeHtml(item.name)}" data-style="${escapeHtml(
    item.docs.style
  )}" data-target-count="${counts.target}" data-legacy-count="${counts.legacy}">
    <div class="api-header">
      <div>
        <p class="api-kind">${escapeHtml(item.kind)}</p>
        <h2>${escapeHtml(item.name)}</h2>
      </div>
      ${renderStyleBadge(item.docs.style)}
      <a class="anchor" href="#${escapeHtml(item.name)}" title="Link to ${escapeHtml(item.name)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </a>
    </div>
    
    <!-- Code block formatted for Prism.js -->
    <div class="code-block-wrapper signature-block">
      <pre><code class="language-javascript">${escapeHtml(item.signature)}</code></pre>
    </div>
    
    ${renderDescription(item.docs)}
    ${renderStyleNote(item.docs.style)}
    ${renderDocsMetaSection(item.docs)}
    ${members}
  </article>`
}

const renderStyleSection = ({
  style,
  exports,
  emptyMessage,
}) => `<section class="style-section" data-style-section="${style}" data-style-section-kind="export">
  <div class="style-section-header">
    <div>
      <p class="api-kind">${escapeHtml(API_STYLE_LABELS[style])}</p>
      <h2>${escapeHtml(API_STYLE_LABELS[style])}</h2>
    </div>
    <span class="badge">${exports.length} exports</span>
  </div>
  <div class="exports-container">
    ${
      exports.length > 0
        ? exports.map(renderExport).join('\n')
        : `<p class="muted empty-state">${escapeHtml(emptyMessage)}</p>`
    }
  </div>
</section>`

const buildApiPages = async (modules, packageInfo) => {
  for (const module of modules) {
    const navigation = renderNavigation(modules, module.pagePath)
    const targetExports = module.exports.filter((item) => item.docs.style === 'target')
    const legacyExports = module.exports.filter((item) => item.docs.style === 'legacy')
    const content = `<p class="source-link">Source: <a href="#">${escapeHtml(module.relativePath)}</a></p>
      <div class="style-sections">
        ${renderStyleSection({
          style: 'target',
          exports: targetExports,
          emptyMessage: 'No target-style exports in this module.',
        })}
        ${renderStyleSection({
          style: 'legacy',
          exports: legacyExports,
          emptyMessage: 'No legacy exports in this module.',
        })}
      </div>`

    const html = pageTemplate({
      title: module.fileName,
      eyebrow: module.group.title,
      content,
      navigation,
      pagePath: module.pagePath,
      packageInfo,
    })

    await fs.mkdir(path.dirname(path.join(OUTPUT_DIR, module.pagePath)), { recursive: true })
    await fs.writeFile(path.join(OUTPUT_DIR, module.pagePath), html)
  }
}

const buildGuidePages = async (modules, packageInfo) => {
  for (const page of DOC_PAGES) {
    const source = await fs.readFile(path.join(ROOT, page.source), 'utf-8')
    const content = `<div class="prose large-prose">${renderMarkdown(
      stripLeadingTitle({ from: source, matching: page.title })
    )}</div>`
    const navigation = renderNavigation(modules, page.target)
    const html = pageTemplate({
      title: page.title,
      eyebrow: 'Guide',
      content,
      navigation,
      pagePath: page.target,
      packageInfo,
    })

    await fs.mkdir(path.dirname(path.join(OUTPUT_DIR, page.target)), { recursive: true })
    await fs.writeFile(path.join(OUTPUT_DIR, page.target), html)
  }
}

const buildHomePage = async (modules, packageInfo) => {
  const source = await fs.readFile(path.join(ROOT, 'docs/HOME.md'), 'utf-8')
  const navigation = renderNavigation(modules, 'index.html')
  const documentedApiCount = modules.reduce((count, module) => count + getDocumentedItemCount(module.exports), 0)
  const targetExportCount = modules.reduce((count, module) => {
    return count + module.exports.reduce((moduleCount, item) => moduleCount + getExportStyleCounts(item).target, 0)
  }, 0)
  const legacyExportCount = modules.reduce((count, module) => {
    return count + module.exports.reduce((moduleCount, item) => moduleCount + getExportStyleCounts(item).legacy, 0)
  }, 0)
  const groups = SOURCE_GROUPS.map((group) => {
    const items = modules.filter((module) => module.group.dir === group.dir)

    return `<section class="module-group" data-module-group>
      <div class="group-heading">
        <h2>${escapeHtml(group.title)}</h2>
        <span class="badge">${items.length} modules</span>
      </div>
      <div class="module-grid">
        ${items
          .map((module) => {
            const targetCount = module.exports.reduce((count, item) => count + getExportStyleCounts(item).target, 0)
            const legacyCount = module.exports.reduce((count, item) => count + getExportStyleCounts(item).legacy, 0)

            return `<a class="module-card" href="${
              module.pagePath
            }" data-module-card data-target-count="${targetCount}" data-legacy-count="${legacyCount}">
              <div class="module-card-header">
                <span class="module-file">${escapeHtml(module.fileName)}</span>
              </div>
              <div class="module-style-pills">
                <span class="style-badge style-badge-target">${targetCount} target</span>
                <span class="style-badge style-badge-legacy">${legacyCount} legacy</span>
              </div>
              <div class="module-entities">
                ${module.exports.map((item) => `<span class="module-entity">${escapeHtml(item.name)}</span>`).join('')}
              </div>
            </a>`
          })
          .join('')}
      </div>
    </section>`
  }).join('')

  const content = `<div class="prose">${renderMarkdown(
    stripLeadingTitle({ from: source, matching: 'Scraper Utils' })
  )}</div>
    <section class="summary-grid mt-large">
      <article class="stat-card"><span>${modules.length}</span><p>Modules Indexed</p></article>
      <article class="stat-card"><span>${modules.reduce(
        (count, module) => count + module.exports.length,
        0
      )}</span><p>Total Exports</p></article>
      <article class="stat-card"><span>${targetExportCount}</span><p>Target Style Exports</p></article>
      <article class="stat-card"><span>${legacyExportCount}</span><p>Legacy Style Exports</p></article>
      <article class="stat-card"><span>${documentedApiCount}</span><p>Documented APIs</p></article>
    </section>
    <div class="groups-container">
      ${groups}
    </div>`

  const html = pageTemplate({
    title: 'Scraper Utils',
    eyebrow: 'Documentation',
    content,
    navigation,
    pagePath: 'index.html',
    packageInfo,
  })

  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), html)
}

const STYLE = `
:root {
  color-scheme: light;
  
  /* Core Apple-like colors */
  --bg: #f5f5f7;
  --surface: rgba(255, 255, 255, 0.75);
  --surface-solid: #ffffff;
  --line: rgba(0, 0, 0, 0.06);
  --line-strong: rgba(0, 0, 0, 0.12);
  
  /* Text */
  --text: #1d1d1f;
  --muted: #86868b;
  --muted-light: #a1a1a6;
  
  /* Accents - A tasteful indigo */
  --accent: #5e5ce6;
  --accent-soft: rgba(94, 92, 230, 0.08);
  --accent-hover: rgba(94, 92, 230, 0.15);
  --accent-strong: rgba(94, 92, 230, 0.22);
  
  /* Effects */
  --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 8px 30px rgba(0, 0, 0, 0.04), 0 4px 10px rgba(0, 0, 0, 0.02);
  --shadow-lg: 0 14px 40px rgba(0, 0, 0, 0.06), 0 6px 14px rgba(0, 0, 0, 0.03);
  --code-bg: #fcfcfd;
  --code-border: rgba(17, 24, 39, 0.08);
  --code-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset;
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  
  /* Typography */
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0d1117;
  --surface: rgba(17, 23, 32, 0.78);
  --surface-solid: #111722;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.16);
  --text: #f3f5f8;
  --muted: #b0b8c6;
  --muted-light: #8792a5;
  --accent: #7c8cff;
  --accent-soft: rgba(124, 140, 255, 0.16);
  --accent-hover: rgba(124, 140, 255, 0.22);
  --accent-strong: rgba(124, 140, 255, 0.35);
  --shadow-sm: 0 8px 24px rgba(0, 0, 0, 0.24);
  --shadow-md: 0 18px 44px rgba(0, 0, 0, 0.34);
  --shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.44);
  --code-bg: #0b1020;
  --code-border: rgba(124, 140, 255, 0.18);
  --code-shadow: 0 1px 0 rgba(255, 255, 255, 0.03) inset;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }

body {
  margin: 0;
  background-color: var(--bg);
  background-image: 
    radial-gradient(circle at 15% 0%, rgba(94, 92, 230, 0.03), transparent 40%),
    radial-gradient(circle at 85% 100%, rgba(0, 122, 255, 0.03), transparent 40%);
  color: var(--text);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }
h1, h2, h3, h4, h5, h6 { color: var(--text); margin: 0; }

h1 {
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

h2 {
  font-size: clamp(20px, 3vw, 26px);
  font-weight: 600;
  letter-spacing: -0.02em;
}

h3 {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

/* Base Layout */
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 32px;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Sidebar Glassmorphism */
.sidebar {
  position: relative;
}

.sidebar-sticky {
  position: sticky;
  top: 32px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  box-shadow: var(--shadow-sm);
  
  /* Hide scrollbar for a cleaner look */
  scrollbar-width: none; 
}
.sidebar-sticky::-webkit-scrollbar { display: none; }

.brand {
  display: inline-block;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text);
}

.brand-copy {
  margin: 8px 0 10px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.4;
}

.brand-meta {
  margin: 0 0 18px;
  font-size: 12px;
  color: var(--muted-light);
}

.sidebar-separator {
  height: 1px;
  margin: 0 0 28px;
  background: var(--line);
}

.nav-search {
  display: grid;
  gap: 8px;
  margin-bottom: 24px;
}

.nav-search-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-light);
}

.nav-search-input {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--surface-solid);
  color: var(--text);
  border-radius: 10px;
  padding: 9px 12px;
  font: inherit;
  box-shadow: var(--shadow-sm);
}

.nav-search-input::placeholder {
  color: var(--muted-light);
}

.nav-search-input:focus {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.theme-control {
  display: grid;
  gap: 8px;
  margin-bottom: 28px;
}

.api-style-control {
  display: grid;
  gap: 8px;
  margin-bottom: 28px;
}

.theme-control-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-light);
}

.api-style-control-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-light);
}

.theme-select {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--surface-solid);
  color: var(--text);
  border-radius: 10px;
  padding: 9px 12px;
  font: inherit;
  box-shadow: var(--shadow-sm);
}

.api-style-select {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--surface-solid);
  color: var(--text);
  border-radius: 10px;
  padding: 9px 12px;
  font: inherit;
  box-shadow: var(--shadow-sm);
}

.api-style-select:focus {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.theme-select:focus {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

/* Navigation */
.navigation { display: grid; gap: 28px; }
.nav-group h2 {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-light);
}

.nav-group ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.nav-group a {
  display: block;
  padding: 8px 12px;
  margin: 0 -12px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}

.nav-group a:hover {
  background: var(--line);
  color: var(--text);
}

.nav-link.is-active,
.nav-group a[aria-current='page'] {
  background: var(--accent-soft);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--accent-strong);
}

/* Main Content Area */
.content {
  background: var(--surface-solid);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 48px;
  box-shadow: var(--shadow-md);
}

.content-header {
  margin-bottom: 40px;
}

.page-meta {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
}

.mt-large { margin-top: 48px; }

/* Prose & Typography */
.prose p, .prose li {
  color: var(--muted);
  line-height: 1.6;
  font-size: 15px;
  margin-top: 0;
  margin-bottom: 16px;
}
.prose ul { padding-left: 20px; margin-bottom: 16px; }
.prose p:last-child, .prose ul:last-child { margin-bottom: 0; }
.prose a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px;}
.prose a:hover { text-decoration-thickness: 2px; }
.muted { color: var(--muted); }

/* Inline Code styling */
code {
  font-family: var(--mono);
  font-size: 0.85em;
  background: var(--line);
  padding: 3px 6px;
  border-radius: 6px;
  color: var(--text);
}

/* Markdown overrides for inline code */
pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 13px;
}

/* Code Block Wrapper */
.code-block-wrapper {
  margin: 16px 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  box-shadow: var(--code-shadow);
}

.code-block-wrapper pre {
  margin: 0 !important; /* Override prism default */
  padding: 20px !important;
  background: transparent !important;
  overflow-x: auto;
}

:root[data-theme='dark'] code[class*='language-'],
:root[data-theme='dark'] pre[class*='language-'] {
  color: #d7dee9;
  text-shadow: none;
}

:root[data-theme='dark'] .token.comment,
:root[data-theme='dark'] .token.prolog,
:root[data-theme='dark'] .token.doctype,
:root[data-theme='dark'] .token.cdata {
  color: #7f8ea3;
}

:root[data-theme='dark'] .token.keyword,
:root[data-theme='dark'] .token.boolean,
:root[data-theme='dark'] .token.operator {
  color: #9bb1ff;
  background: transparent;
}

:root[data-theme='dark'] .token.string,
:root[data-theme='dark'] .token.char,
:root[data-theme='dark'] .token.attr-value {
  color: #9fe0b0;
}

:root[data-theme='dark'] .token.function,
:root[data-theme='dark'] .token.class-name {
  color: #ffd37b;
}

:root[data-theme='dark'] .token.number,
:root[data-theme='dark'] .token.constant,
:root[data-theme='dark'] .token.symbol {
  color: #ffb38f;
}

/* Cards (Stats & Modules) */
.summary-grid, .module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-grid { margin-bottom: 48px; }

.stat-card {
  padding: 24px;
  background: var(--surface-solid);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.stat-card span {
  display: block;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--text);
}

.stat-card p { 
  margin: 4px 0 0; 
  font-size: 14px;
  font-weight: 500;
  color: var(--muted); 
}

/* Module Groups */
.module-group { margin-top: 48px; }
.group-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.badge {
  background: var(--line);
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
}

/* Module Cards */
.module-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--surface-solid);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.module-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-md);
}

.module-file {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
}

.module-entities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.module-style-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.module-entity {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--line);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
}

.source-link {
  margin: -24px 0 32px;
  font-size: 14px;
  color: var(--muted);
}
.source-link a {
  font-family: var(--mono);
  color: var(--muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* API Cards */
.exports-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.style-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.style-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.style-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.api-card {
  padding: 32px;
  background: var(--surface-solid);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.class-members {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}

.class-members-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.member-style-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.member-style-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.members-grid {
  display: grid;
  gap: 16px;
}

.member-card {
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.member-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.member-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-transform: none;
  color: var(--text);
}

.member-signature {
  margin-bottom: 20px;
}

.api-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.api-kind {
  margin: 0 0 6px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
  font-weight: 700;
}

/* Anchor Link styling */
.anchor {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--muted-light);
  background: transparent;
}

.anchor:hover {
  background: var(--line);
  color: var(--text);
}

.signature-block { margin-top: 0; margin-bottom: 24px; }

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.meta-block { margin: 0; }
.meta-block h3 { margin-bottom: 12px; }

.doc-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.doc-meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.style-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.style-badge-target {
  background: rgba(40, 167, 69, 0.12);
  color: #1f7a36;
}

.style-badge-legacy {
  background: rgba(255, 159, 10, 0.14);
  color: #a85d00;
}

:root[data-theme='dark'] .style-badge-target {
  background: rgba(69, 201, 111, 0.18);
  color: #8ce99a;
}

:root[data-theme='dark'] .style-badge-legacy {
  background: rgba(255, 179, 64, 0.2);
  color: #ffd08a;
}

.style-note {
  margin: 18px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.meta-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.meta-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  color: var(--muted);
}

.meta-line {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.type-badge {
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.empty-state {
  font-style: italic;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 980px) {
  .shell {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  .sidebar-sticky {
    position: static;
    height: auto;
    padding: 24px;
  }

  .content {
    padding: 24px;
  }
  
  .api-card {
    padding: 24px;
  }
}
`

const buildDocs = async () => {
  await fs.rm(OUTPUT_DIR, { force: true, recursive: true })
  await fs.mkdir(ASSETS_DIR, { recursive: true })
  await fs.writeFile(path.join(ASSETS_DIR, 'style.css'), STYLE.trim())
  await fs.writeFile(path.join(OUTPUT_DIR, '.nojekyll'), '')

  const packageInfo = await readPackageInfo()
  const modules = await readModules()

  await buildGuidePages(modules, packageInfo)
  await buildApiPages(modules, packageInfo)
  await buildHomePage(modules, packageInfo)

  console.log(`Generated docs for ${modules.length} modules in ${path.relative(ROOT, OUTPUT_DIR)}`)
}

export {
  PAGE_BEHAVIOR_SCRIPT,
  SOURCE_GROUPS,
  STYLE,
  THEME_BOOTSTRAP_SCRIPT,
  buildDocs,
  getDocumentedItemCount,
  parseClassMembers,
  parseExports,
  parseJsdoc,
  renderExport,
  renderNavigation,
  stripLeadingTitle,
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildDocs()
}
