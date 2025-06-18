import type { Lix } from "../lix/open-lix.js";
import { EntityRepository } from "./entity-repository.js";
import { LixKeyValueSchema, type KeyValue, type NewKeyValue, type KeyValueUpdate } from "../key-value/schema.js";

/**
 * KeyValueRepository provides a simplified API for key-value operations
 */
export class KeyValueRepository extends EntityRepository<KeyValue, NewKeyValue, KeyValueUpdate> {
  constructor(lix: Lix) {
    super(lix, LixKeyValueSchema, "key_value");
    this.idField = "key";
  }

  /**
   * Get a value by its key
   */
  async get(key: string): Promise<any | null> {
    const entry = await this.query()
      .where("key", "=", key)
      .executeTakeFirst();
    
    return entry ? entry.value : null;
  }

  /**
   * Get a value by its key or throw if not found
   */
  async getOrThrow(key: string): Promise<any> {
    const value = await this.get(key);
    if (value === null) {
      throw new Error(`Key ${key} not found`);
    }
    return value;
  }

  /**
   * Set a value for a key (create or update)
   */
  async set(key: string, value: any): Promise<KeyValue> {
    const existingEntry = await this.findOne(key);
    
    if (existingEntry) {
      return this.update(key, { value });
    } else {
      return this.create({
        key,
        value,
      });
    }
  }

  /**
   * Find all entries with keys that match a prefix
   */
  async findByKeyPrefix(prefix: string): Promise<KeyValue[]> {
    return this.query()
      .where("key", "startsWith", prefix)
      .execute();
  }
  
  /**
   * Delete a key-value pair by its key
   */
  async deleteKey(key: string): Promise<void> {
    await this.delete(key);
  }
}