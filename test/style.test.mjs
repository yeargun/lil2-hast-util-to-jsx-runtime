// The style parser equals style-to-js (reactCompat), as hast-util-to-jsx-runtime uses it, including its errors.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import styleToJs from 'style-to-js'
const {run} = await import(new URL(process.env.LIL2_STYLE ?? '../.dev/style/style.js', import.meta.url))

const cases = ['height:1em;', 'height:0.6833em;vertical-align:-0.0833em;', ' margin-right: 0.0278em ; ', 'color:#cc0000;',
  'border-bottom-width:0.04em;', '-ms-transform: x; -webkit-transition: y; -moz-a: b', '--custom-prop: 1; --x: 2', 'a:b;;c:d',
  '/* c */ a: b /* d */; /* e */ c : d', 'background:url(a;b); color: "x;y"', "font-family: 'a;b', serif", 'A-B: c',
  'top:-3.063em;margin-right:0.05em;', 'width: 100%', 'x: ', ': y', 'a', 'a /* q */ : b', 'a:b /*', '', '   ',
  'z-index: 2; Z-INDEX: 3', 'margin:0 auto;padding:1px 2px', 'color:red;background-color:#eee', 'min-width:0.888em']

test('style objects equal style-to-js', () => {
  for (const value of cases) {
    let expected, actual
    try { expected = styleToJs(value, {reactCompat: true}) } catch { expected = 'throws' }
    try { actual = run(value) } catch { actual = 'throws' }
    assert.deepStrictEqual(actual, expected, JSON.stringify(value))
  }
})
