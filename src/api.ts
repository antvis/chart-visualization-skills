export type { QueryResult, RetrieveOptions } from './types';

/**
 * Retrieve docs based on a query. Returns doc content by default.
 *
 * @example retrieve('bar chart', { library: 'g2', topK: 5 })
 */
export { retrieve } from './retriever';
