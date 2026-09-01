import { EgertvSource } from "./egertv.source";
import { EgriHirekSource } from "./egri-hirek.source";
import { HeolSource } from "./heol.source";
import type { NewsSource } from "./base.interface";

/**
 * Registry of all `NewsSource` implementations, in stable order.
 * `ScraperService.syncAll()` iterates this list.
 */
export const NEWS_SOURCES: Array<new (...args: never[]) => NewsSource> = [
  EgertvSource,
  EgriHirekSource,
  HeolSource,
];

export * from "./base.interface";
export { EgertvSource } from "./egertv.source";
export { EgriHirekSource } from "./egri-hirek.source";
export { HeolSource } from "./heol.source";
