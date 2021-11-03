// Even if you use a query, it will be imported.
import './fixture.query.ts?1';
// If the query is different, it will be loaded.
import './fixture.query.ts?2';
// If the query is the same, the cached result will be used.
import './fixture.query.ts?2';
