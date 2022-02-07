import foo from 'foo'
import notIndex from 'foo/not-index'
import { hello } from 'with-dts/hello'
import { a } from '../fixture.export'

console.log(foo)
console.log(notIndex)
console.log(a)
console.log(hello)
