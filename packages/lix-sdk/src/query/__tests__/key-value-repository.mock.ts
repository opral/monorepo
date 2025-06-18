/**
 * Mock implementation of KeyValueRepository for testing
 */

import { MockEntityRepository } from "./entity-repository.mock.js";
import type { KeyValue, NewKeyValue, KeyValueUpdate } from "../../key-value/schema.js";

export class MockKeyValueRepository extends MockEntityRepository<KeyValue, NewKeyValue, KeyValueUpdate> {
  constructor() {
    super("key_value");
    this.idField = "key";
  }
  
  async get(key: string): Promise<any | null> {
    const entry = await this.findOne(key);
    return entry ? entry.value : null;
  }
  
  async getOrThrow(key: string): Promise<any> {
    const value = await this.get(key);
    if (value === null) {
      throw new Error(`Key ${key} not found`);
    }
    return value;
  }
  
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
  
  async findByKeyPrefix(prefix: string): Promise<KeyValue[]> {
    const entries = await this.findAll();
    return entries.filter(entry => entry.key.startsWith(prefix));
  }
  
  async deleteKey(key: string): Promise<void> {
    await this.delete(key);
  }
}