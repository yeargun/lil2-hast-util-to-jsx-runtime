# lil2-hast-util-to-jsx-runtime

[hast-util-to-jsx-runtime](https://github.com/syntax-tree/hast-util-to-jsx-runtime) 2.3.6 rewritten in typed
[LilScript](https://lilscript.eddocu.com): a hast arena to React elements through `jsx`/`jsxs`, with the same
element trees as upstream. Fourth layer of the **lil2** family; it embeds the lower layers as pinned source.

## Flat data, changed API

Everything before React is typed and flat. React props are the only objects, and they're built only at the
`jsx` call. With `passNode`, a custom component does not get a node object. It gets `node`, an id, and `tree`,
the hast columns. That is one array per render, shared by every element:

```
tree = [kind, parent, firstChild, nextSibling, tagName, value, startOffset, endOffset, flags, meta,
        propHead, propName, propKind, propString, propNumber, propNext, lineStarts, kindNames]
props.tree[4][props.node]   // the element's tag name
```

Property names map to React props through tables generated from property-information
(`scripts/generate-properties.mjs`): html and svg schemas, `hastToReact`, and upstream's `data-*` and
unknown-name rules.

## Behaviour

`test/differential.test.mjs` renders 736 documents with upstream (`toJsxRuntime(toHast(fromMarkdown(md)))`)
and with lil2. It compares element trees (type, key, props, and the component's node as an indexed-array row)
and `renderToStaticMarkup` output, with and without custom components. All are equal.

## License

MIT; see NOTICE.md.
