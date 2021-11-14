import foo from 'foo'
import notIndex from 'foo/not-index'
import notIndex from 'foo/not-index.js'
import { a } from '../fixture.export'
import { hello } from 'with-dts/hello'

console.log(foo)
console.log(notIndex)
console.log(a)
console.log(hello)