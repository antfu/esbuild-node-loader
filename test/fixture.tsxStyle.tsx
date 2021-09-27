/** @jsx jsxLog */

function jsxLog(type: string, attr: any, children: any) {
  console.log(`${type}:${children}`)
}

// @ts-ignore
<foo>bar</foo>
