import type { Lix } from "../lix/open-lix.js";
import { FileRepository } from "./file-repository.js";
import { KeyValueRepository } from "./key-value-repository.js";

/**
 * QueryManager provides access to all entity queries
 */
export class QueryManager {
  public readonly files: FileRepository;
  public readonly keyValues: KeyValueRepository;
  
  /**
   * Create a new QueryManager
   */
  constructor(private lix: Lix) {
    this.files = new FileRepository(lix);
    this.keyValues = new KeyValueRepository(lix);
  }
}

/**
 * Extend the Lix interface to include the query manager
 */
declare module "../lix/open-lix.js" {
  interface Lix {
    /**
     * Query manager providing access to all entity queries
     */
    query: QueryManager;
  }
}