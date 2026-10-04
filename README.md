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

This layer ships inside lil2-react-markdown; it has no package build of its own.

## Behaviour

`test/differential.test.mjs` renders 736 documents with upstream (`toJsxRuntime(toHast(fromMarkdown(md)))`)
and with lil2. It compares element trees (type, key, props, and the component's node as an indexed-array row)
and `renderToStaticMarkup` output, with and without custom components. All are equal.

## License

MIT; see NOTICE.md.
