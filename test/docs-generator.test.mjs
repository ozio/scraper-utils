import fs from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'bun:test'

import {
  PAGE_BEHAVIOR_SCRIPT,
  THEME_BOOTSTRAP_SCRIPT,
  buildDocs,
  getDocumentedItemCount,
  parseClassMembers,
  parseJsdoc,
  renderNavigation,
  stripLeadingTitle,
} from '../scripts/generate-docs.mjs'

const ROOT = process.cwd()

describe('docs generator', () => {
  test('stripLeadingTitle removes only the matching leading heading', () => {
    expect(
      stripLeadingTitle({
        from: '# Scraper Utils\n\nWelcome.\n',
        matching: 'scraper-utils',
      })
    ).toBe('Welcome.\n')

    expect(
      stripLeadingTitle({
        from: '# Another Title\n\nWelcome.\n',
        matching: 'scraper-utils',
      })
    ).toBe('# Another Title\n\nWelcome.\n')
  })

  test('parseJsdoc keeps nested types and metadata tags intact', () => {
    const docs = parseJsdoc(`/**
 * Runs a command.
 *
 * @param {string} command The shell command.
 * @returns {Promise<{ stdout: string, stderr: string }>} Process output.
 * @since 1.0.0
 * @version 1.2.3
 * @date 2026-04-17
 */`)

    expect(docs.params).toEqual([
      {
        type: 'string',
        name: 'command',
        description: 'The shell command.',
      },
    ])
    expect(docs.returns).toEqual({
      type: 'Promise<{ stdout: string, stderr: string }>',
      description: 'Process output.',
    })
    expect(docs.since).toBe('1.0.0')
    expect(docs.version).toBe('1.2.3')
    expect(docs.date).toBe('2026-04-17')
  })

  test('parseClassMembers captures public fields, constructor, methods, and skips private members', () => {
    const lines = [
      'export class Example {',
      '  static LIMIT = 3',
      '  value = 1',
      '',
      '  /**',
      '   * Builds the instance.',
      '   */',
      '  constructor({ value } = {}) {',
      '    this.value = value',
      '  }',
      '',
      '  /**',
      '   * Reads the value.',
      '   * @returns {number}',
      '   */',
      '  getValue() {',
      '    return this.value',
      '  }',
      '',
      '  add = (step) => {',
      '    return this.value + step',
      '  }',
      '',
      '  #secret = () => 42',
      '}',
    ]

    const { members } = parseClassMembers(lines, 0)

    expect(members.map((member) => `${member.kind}:${member.name}`)).toEqual([
      'field:LIMIT',
      'field:value',
      'constructor:constructor',
      'method:getValue',
      'method:add',
    ])
    expect(members.find((member) => member.name === 'getValue')?.docs.returns).toEqual({
      type: 'number',
      description: '',
    })
  })

  test('renderNavigation marks the current page as active', () => {
    const html = renderNavigation(
      [
        {
          group: { dir: 'classes' },
          fileName: 'Queue.mjs',
          pagePath: 'api/classes-Queue.html',
        },
      ],
      'api/classes-Queue.html'
    )

    expect(html).toContain('aria-current="page"')
    expect(html).toContain('class="nav-link is-active"')
  })

  test('getDocumentedItemCount includes documented class members', () => {
    expect(
      getDocumentedItemCount([
        {
          docs: parseJsdoc('/** Top-level docs. */'),
          members: [
            { docs: parseJsdoc('/** Member docs. */') },
            { docs: parseJsdoc(null) },
          ],
        },
      ])
    ).toBe(2)
  })

  test('buildDocs generates theme controls, active navigation, and class members', async () => {
    await buildDocs()

    const packageJson = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf-8'))
    const queuePage = await fs.readFile(path.join(ROOT, 'site/api/classes-Queue.html'), 'utf-8')
    const homePage = await fs.readFile(path.join(ROOT, 'site/index.html'), 'utf-8')
    const stylesheet = await fs.readFile(path.join(ROOT, 'site/assets/style.css'), 'utf-8')

    expect(queuePage).toContain('<option value="system">System</option>')
    expect(queuePage).toContain('aria-current="page"')
    expect(queuePage).toContain('Members</h3>')
    expect(queuePage).toContain('constructor')
    expect(queuePage).toContain('DEFAULT_STREAMS')
    expect(queuePage).toContain('addMany')
    expect(homePage).toContain(packageJson.description)
    expect(homePage).toContain('data-nav-search')
    expect(homePage).toContain('data-theme-select')
    expect(stylesheet).toContain(":root[data-theme='dark']")
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('scraper-utils-docs-theme')
    expect(PAGE_BEHAVIOR_SCRIPT).toContain('scrollIntoView')
    expect(PAGE_BEHAVIOR_SCRIPT).toContain('applyNavigationFilter')
  })
})
