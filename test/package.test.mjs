// The published entry: `toJsxRuntime(columns, {Fragment, jsx, jsxs, ...})` over hast columns, against upstream
// hast-util-to-jsx-runtime on upstream's hast, through React's runtime.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toHast} from 'mdast-util-to-hast'
import {toJsxRuntime as upstream} from 'hast-util-to-jsx-runtime'
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'
import {renderToStaticMarkup} from 'react-dom/server'
import {corpus} from './corpus.mjs'
const {toJsxRuntime} = await import(new URL(process.env.LIL2_ARTIFACT ?? '../dist/to-jsx-runtime.js', import.meta.url))
const {markdownToHast} = await import(new URL(process.env.LIL2_COLUMNS ?? '../.dev/columns/columns.js', import.meta.url))
const runtime = {Fragment, jsx, jsxs}

test('same markup as hast-util-to-jsx-runtime on every corpus document', () => {
  let count = 0
  for (const {name, markdown} of corpus()) {
    const ours = renderToStaticMarkup(toJsxRuntime(markdownToHast(markdown), runtime))
    const theirs = renderToStaticMarkup(upstream(toHast(fromMarkdown(markdown)), runtime))
    assert.equal(ours, theirs, name)
    count++
  }
  assert.ok(count > 700)
})

test('same keys as hast-util-to-jsx-runtime, and none with passKeys false', () => {
  const markdown = '# a\n\n- b\n- c\n\n> d'
  const keys = element => element && typeof element === 'object' ? [element.key, ...[].concat(element.props.children ?? []).flatMap(keys)] : []
  assert.deepEqual(keys(toJsxRuntime(markdownToHast(markdown), runtime)), keys(upstream(toHast(fromMarkdown(markdown)), runtime)))
  assert.ok(keys(toJsxRuntime(markdownToHast(markdown), {...runtime, passKeys: false})).every(key => key === null))
})

test('components are [tag, component] pairs and get node and tree with passNode', () => {
  const tree = markdownToHast('# Title\n\n[link](https://example.com)')
  const tagNames = tree[18], h1 = tagNames.indexOf('h1'), a = tagNames.indexOf('a')
  const seen = []
  const Heading = props => { seen.push([props.node, props.tree[4][props.node], props.tree[17][props.tree[4][props.node]]]); return jsx('h2', {children: props.children}) }
  const Link = props => jsx('a', {href: props.href, rel: 'nofollow', children: props.children})
  const html = renderToStaticMarkup(toJsxRuntime(tree, {...runtime, components: [h1, Heading, a, Link], passNode: true}))
  assert.equal(html, '<h2>Title</h2>\n<p><a href="https://example.com" rel="nofollow">link</a></p>')
  assert.equal(seen.length, 1)
  assert.equal(seen[0][2], 'h1')
})

test('refuses columns beyond the core vocabulary', () => {
  const tree = markdownToHast('x')
  const wider = [...tree.slice(0, 18), [...tree[18], 'mrow']]
  assert.throws(() => toJsxRuntime(wider, runtime), /beyond the core vocabulary/)
})
