import { URL } from 'url';

console.log(new URL(import.meta.url).search.slice(1));
