import { retrieve as _retrieve } from './core/retriever';
import type { Skill } from './core/types';

export type { Skill };

export function retrieve(query: string, library = 'g2', topk = 7): Skill[] {
  return _retrieve(query, { library, topK: topk });
}
