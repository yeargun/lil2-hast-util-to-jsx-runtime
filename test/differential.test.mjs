// Same React elements as upstream hast-util-to-jsx-runtime on upstream's hast: element trees (type, key,
// props) and rendered HTML, with and without custom components. lil2 passes a component its node as an id
// into `tree` (the hast columns); upstream passes an object. Both are compared as the same row.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toHast} from 'mdast-util-to-hast'
import {toJsxRuntime} from 'hast-util-to-jsx-runtime'
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'
import {renderToStaticMarkup} from 'react-dom/server'
import {corpus} from './corpus.mjs'
const {render} = await import(new URL(process.env.LIL2_RENDER ?? '../.dev/render/render.js', import.meta.url))

// Column helpers (the lil2 component API).
const T = {tagName: 4, start: 6, end: 7, flags: 8, meta: 9, propHead: 10, propName: 11, propKind: 12, propString: 13, propNumber: 14, propNext: 15, lineStarts: 16}
const lineOf = (tree, offset) => { const starts = tree[T.lineStarts]; let low = 0, high = starts.length - 1; while (low < high) { const mid = (low + high + 1) >> 1; if (starts[mid] <= offset) low = mid; else high = mid - 1 } return low + 1 }
const columnOf = (tree, offset) => offset - tree[T.lineStarts][lineOf(tree, offset) - 1] + 1
const propValue = (tree, prop) => [tree[T.propString][prop], tree[T.propNumber][prop], tree[T.propNumber][prop] !== 0, tree[T.propString][prop].split(' ')][tree[T.propKind][prop]]

function nodeRowFromColumns(tree, id) {
  const properties = []
  for (let prop = tree[T.propHead][id]; prop >= 0; prop = tree[T.propNext][prop]) properties.push([tree[T.propName][prop], propValue(tree, prop)])
  const s = tree[T.start][id], e = tree[T.end][id]
  const position = tree[T.flags][id] & 1 ? [lineOf(tree, s), columnOf(tree, s), s, lineOf(tree, e), columnOf(tree, e), e] : null
  return [tree[T.tagName][id], properties, position, tree[T.flags][id] & 2 ? tree[T.meta][id] : null]
}
function nodeRowFromObject(node) {
  const p = node.position
  return [node.tagName, Object.entries(node.properties), p ? [p.start.line, p.start.column, p.start.offset, p.end.line, p.end.column, p.end.offset] : null, node.data?.meta ?? null]
}

function view(element) {
  if (element === null || typeof element !== 'object') return element
  if (Array.isArray(element)) return element.map(view)
  const {children, node, tree, ...props} = element.props
  const nodeRow = node === undefined ? null : tree ? nodeRowFromColumns(tree, node) : nodeRowFromObject(node)
  return {type: typeof element.type === 'string' ? element.type : element.type === Fragment ? 'Fragment' : element.type.name, key: element.key, props, node: nodeRow, children: view(children)}
}

function H1(props) { return jsx('h1', {className: 'custom', children: props.children}) }
const upstreamComponents = {
  h1: H1,
  a: function A(props) { return jsx('a', {href: props.href, 'data-line': props.node.position?.start.line, children: props.children}) },
  code: function Code(props) { return jsx('code', {'data-meta': props.node.data?.meta, className: props.className, children: props.children}) }
}
const lil2Components = {
  h1: H1,
  a: function A(props) { const {tree, node} = props; return jsx('a', {href: props.href, 'data-line': tree[T.flags][node] & 1 ? lineOf(tree, tree[T.start][node]) : undefined, children: props.children}) },
  code: function Code(props) { const {tree, node} = props; return jsx('code', {'data-meta': tree[T.flags][node] & 2 ? tree[T.meta][node] : undefined, className: props.className, children: props.children}) }
}

for (const [label, upstreamComps, lil2Comps, passNode] of [['default', undefined, undefined, false], ['components', upstreamComponents, lil2Components, true]]) {
  test(`React output equals upstream (${label})`, () => {
    const failures = []
    for (const c of corpus()) {
      const expected = toJsxRuntime(toHast(fromMarkdown(c.markdown)), {Fragment, jsx, jsxs, components: upstreamComps, passKeys: true, passNode})
      const actual = render(c.markdown, Fragment, jsx, jsxs, lil2Comps, passNode)
      try {
        assert.deepStrictEqual(view(actual), view(expected))
        assert.equal(renderToStaticMarkup(actual), renderToStaticMarkup(expected))
      } catch (error) {
        failures.push({name: c.name, markdown: c.markdown.slice(0, 120), error: String(error.message).slice(0, 800)})
      }
    }
    if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 3)}, null, 1))
    assert.equal(failures.length, 0)
  })
}
