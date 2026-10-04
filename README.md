# lil2-hast-util-to-jsx-runtime

[hast-util-to-jsx-runtime](https://github.com/syntax-tree/hast-util-to-jsx-runtime) 2.3.6 rewritten in typed
[LilScript](https://lilscript.eddocu.com): a hast arena to React elements through `jsx`/`jsxs`, with the same
element trees as upstream. Fourth layer of the **lil2** family; it embeds the lower layers as pinned source.

## Flat data, changed API

Everything before React is typed and flat. React props are the only objects, and they're built only at the
`jsx` call. Tags and properties are int ids: the element type is read from `tagNames` and each prop key from the
hast layer's property table (property-information and `hastToReact`, per schema) only at that call.

- Components are `[tag, component, …]` pairs (`componentTable` makes a dense array by tag id).
- With `passNode`, a component does not get a node object: it gets `node`, an id, and `tree`, the hast columns
  (one array per render, shared by every element):

```
tree = [kind, parent, firstChild, nextSibling, tag, value, startOffset, endOffset, flags, meta,
        propHead, propName, propKind, propString, propNumber, propNext, lineStarts, tagNames]
props.tree[17][props.tree[4][props.node]]   // the element's tag name
```

- React keys (`passKeys`) are `tagName-index` as upstream makes them, counted by tag id per children list without
  a map.
- `src/jsx/style.lil` ports style-to-js (with style-to-object and inline-style-parser): a layer that writes `style`
  properties (rehype-katex) installs it, so a bundle without one carries none of it.

It is compiled into lil2-react-markdown, and on its own renders the hast columns of the lil2 hast packages (below).

## Install

```bash
npm install @itslil/lil2-hast-util-to-jsx-runtime
```

TypeScript types are included. One ES module, the same in every runtime (nothing in it differs in browsers), with no dependencies: you pass
your JSX runtime.

## Use

```ts
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'
import {renderToStaticMarkup} from 'react-dom/server'
import {markdownToHast} from '@itslil/lil2-mdast-util-to-hast'
import {TAG_A} from '@itslil/lil2-mdast-util-to-hast/constants'
import {toJsxRuntime} from '@itslil/lil2-hast-util-to-jsx-runtime'

function Link(props: {href?: string, children?: unknown}) {
  return jsx('a', {...props, rel: 'nofollow'})
}

const tree = markdownToHast('# Hello\n\nRead [the docs](https://example.com).')
const element = toJsxRuntime(tree, {Fragment, jsx, jsxs, components: [TAG_A, Link]})
console.log(renderToStaticMarkup(element))
// <h1>Hello</h1>\n<p>Read <a href="https://example.com" rel="nofollow">the docs</a>.</p>
```

`toJsxRuntime(tree, options)` is hast-util-to-jsx-runtime's production `toJsxRuntime`: it renders the columns that
[lil2-mdast-util-to-hast](https://github.com/yeargun/lil2-mdast-util-to-hast), lil2-remark-gfm, lil2-remark-math and
lil2-remark-breaks return through any JSX runtime (`react/jsx-runtime`, `preact/jsx-runtime`, Solid's or Vue's). The
options are upstream's production ones: `Fragment`, `jsx` and `jsxs`, `components` as `[tag, component, …]` pairs (a
`TAG_*` id of the package that made the columns, or `tagNames.indexOf('h1')`), `passKeys` (default true),
`passNode` (default false: with it, a component gets `node`, an id, and `tree`, the columns without the root) and
`tableCellAlignToStyle` (default true). Columns carrying KaTeX's tags and properties (lil2-rehype-katex) throw: render
them with [lil2-react-markdown](https://github.com/yeargun/lil2-react-markdown)'s `/full` flavor, which this layer is
compiled into.

### Which package

| you want | package |
|---|---|
| React elements | [`@itslil/lil2-react-markdown`](https://github.com/yeargun/lil2-react-markdown) (`/gfm`, `/full` for GFM, math, KaTeX) |
| an HTML string, CommonMark | [`@itslil/lil2-micromark`](https://github.com/yeargun/lil2-micromark) |
| an HTML string with GFM, math or KaTeX | `renderToStaticMarkup` of lil2-react-markdown's `/full` flavor (below) |
| mdast (syntax tree) | [`lil2-mdast-util-from-markdown`](https://github.com/yeargun/lil2-mdast-util-from-markdown); with GFM [`lil2-remark-gfm`](https://github.com/yeargun/lil2-remark-gfm), math [`lil2-remark-math`](https://github.com/yeargun/lil2-remark-math), breaks [`lil2-remark-breaks`](https://github.com/yeargun/lil2-remark-breaks) |
| elements from hast columns through any JSX runtime | [`lil2-hast-util-to-jsx-runtime`](https://github.com/yeargun/lil2-hast-util-to-jsx-runtime) |
| hast (HTML tree) | [`lil2-mdast-util-to-hast`](https://github.com/yeargun/lil2-mdast-util-to-hast) and the same three, or [`lil2-rehype-katex`](https://github.com/yeargun/lil2-rehype-katex) with formulas rendered |

Every package is one self-contained ES module with no runtime dependencies (React and KaTeX aside), ships its
TypeScript types, and resolves to a Node build or a browser build through its `exports` conditions.
## Behaviour

`test/differential.test.mjs` renders 736 documents with upstream (`toJsxRuntime(toHast(fromMarkdown(md)))`)
and with lil2. It compares element trees (type, key, props, and the component's node as an indexed-array row)
and `renderToStaticMarkup` output, with and without custom components. All are equal.

## License

MIT; see NOTICE.md.
