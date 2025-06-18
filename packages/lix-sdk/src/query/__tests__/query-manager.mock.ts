/**
 * Mock implementation of QueryManager for testing
 */

import { MockFileRepository } from "./file-repository.mock.js";
import { MockKeyValueRepository } from "./key-value-repository.mock.js";

export class MockQueryManager {
  public readonly files: MockFileRepository;
  public readonly keyValues: MockKeyValueRepository;
  
  constructor() {
    this.files = new MockFileRepository();
    this.keyValues = new MockKeyValueRepository();
  }
}