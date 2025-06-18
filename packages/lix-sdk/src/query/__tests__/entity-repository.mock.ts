/**
 * Mock implementation of EntityRepository for testing
 */

import { QueryBuilder } from "../query-builder.js";
import type { EntityRepository } from "../entity-repository.js";

/**
 * Mock implementation of QueryBuilder for testing
 */
export class MockQueryBuilder<T> {
  private conditions: any[] = [];
  private sortCriteria: any[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private items: T[] = [];
  
  constructor(items: T[] = []) {
    this.items = [...items];
  }
  
  where(field: keyof T, operator: string, value: any): this {
    this.conditions.push({ field, operator, value });
    return this;
  }
  
  orderBy(field: keyof T, direction: "asc" | "desc" = "asc"): this {
    this.sortCriteria.push({ field, direction });
    return this;
  }
  
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }
  
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }
  
  async execute(): Promise<T[]> {
    // Apply filtering
    let result = this.items.filter(item => 
      this.conditions.every(condition => {
        const itemValue = item[condition.field];
        switch (condition.operator) {
          case "=": return itemValue === condition.value;
          case "!=": return itemValue !== condition.value;
          case "startsWith": return typeof itemValue === 'string' && itemValue.startsWith(condition.value);
          case "endsWith": return typeof itemValue === 'string' && itemValue.endsWith(condition.value);
          case "contains": return typeof itemValue === 'string' && itemValue.includes(condition.value);
          default: return true;
        }
      })
    );
    
    // Apply sorting
    if (this.sortCriteria.length > 0) {
      result.sort((a, b) => {
        for (const { field, direction } of this.sortCriteria) {
          const aValue = a[field];
          const bValue = b[field];
          if (aValue < bValue) return direction === "asc" ? -1 : 1;
          if (aValue > bValue) return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Apply pagination
    if (this.offsetValue !== undefined) {
      result = result.slice(this.offsetValue);
    }
    
    if (this.limitValue !== undefined) {
      result = result.slice(0, this.limitValue);
    }
    
    return result;
  }
  
  async executeTakeFirst(): Promise<T | null> {
    const results = await this.execute();
    return results.length > 0 ? results[0] : null;
  }
  
  async executeTakeFirstOrThrow(): Promise<T> {
    const result = await this.executeTakeFirst();
    if (!result) {
      throw new Error("No results found");
    }
    return result;
  }
  
  async executeCount(): Promise<number> {
    const results = await this.execute();
    return results.length;
  }
}

/**
 * Mock implementation of EntityRepository for testing
 */
export class MockEntityRepository<T, C, U> {
  protected entities: Map<string, T> = new Map();
  protected idCounter = 1;
  protected idField = "id";
  
  constructor(protected viewName: string = "mock_view") {}
  
  async findOne(id: string): Promise<T | null> {
    return this.entities.get(id) || null;
  }
  
  async findOneOrThrow(id: string): Promise<T> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return entity;
  }
  
  async findAll(): Promise<T[]> {
    return Array.from(this.entities.values());
  }
  
  async create(data: C): Promise<T> {
    const id = (data as any)[this.idField] || this.generateId();
    const entity = { ...data, [this.idField]: id } as unknown as T;
    this.entities.set(id, entity);
    return entity;
  }
  
  async update(id: string, data: U): Promise<T> {
    const existing = await this.findOneOrThrow(id);
    const updated = { ...existing, ...data } as T;
    this.entities.set(id, updated);
    return updated;
  }
  
  async delete(id: string): Promise<void> {
    await this.findOneOrThrow(id);
    this.entities.delete(id);
  }
  
  query(): MockQueryBuilder<T> {
    return new MockQueryBuilder<T>(Array.from(this.entities.values()));
  }
  
  protected generateId(): string {
    return `mock-${this.idCounter++}`;
  }
}