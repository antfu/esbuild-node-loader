import fs from 'node:fs'

if (typeof fs.readFileSync === 'function')
  console.log('fs imported')
