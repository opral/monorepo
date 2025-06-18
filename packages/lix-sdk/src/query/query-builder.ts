import type { Lix } from "../lix/open-lix.js";
import type { SelectQueryBuilder, ReferenceExpression, ExpressionBuilder } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Type for supported comparison operators in the query builder
 */
export type ComparisonOperator = "=" | "!=" | "<" | "<=" | ">" | ">=" | "like" | "in" | "not in" | "startsWith" | "endsWith" | "contains";

/**
 * Type for supported sorting directions
 */
export type SortDirection = "asc" | "desc";

/**
 * QueryBuilder provides a fluent API for building database queries
 * that abstracts away the underlying SQL complexity.
 */
export class QueryBuilder<T> {
  private baseQuery: SelectQueryBuilder<any, any, any>;
  private limitValue?: number;
  private offsetValue?: number;
  private whereConditions: Array<{ field: string; operator: ComparisonOperator; value: any }> = [];
  private sortFields: Array<{ field: string; direction: SortDirection }> = [];

  /**
   * Creates a new QueryBuilder instance
   */
  constructor(
    private lix: Pick<Lix, "db">,
    private viewName: keyof LixDatabaseSchema,
    initialQuery?: SelectQueryBuilder<any, any, any>
  ) {
    this.baseQuery = initialQuery || lix.db.selectFrom(viewName as string);
  }

  /**
   * Add a where clause to filter results
   */
  where<K extends keyof T>(field: K, operator: ComparisonOperator, value: any): this {
    this.whereConditions.push({ field: field as string, operator, value });
    return this;
  }

  /**
   * Add an ordering clause
   */
  orderBy<K extends keyof T>(field: K, direction: SortDirection = "asc"): this {
    this.sortFields.push({ field: field as string, direction });
    return this;
  }

  /**
   * Set a limit on the number of results
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Set an offset for pagination
   */
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  /**
   * Execute the query and return all matching results
   */
  async execute(): Promise<T[]> {
    const query = this.buildQuery();
    return query.execute() as Promise<T[]>;
  }

  /**
   * Execute the query and return the first result or null if none found
   */
  async executeTakeFirst(): Promise<T | null> {
    const query = this.buildQuery();
    return query.executeTakeFirst() as Promise<T | null>;
  }

  /**
   * Execute the query and return the first result or throw if none found
   */
  async executeTakeFirstOrThrow(): Promise<T> {
    const query = this.buildQuery();
    return query.executeTakeFirstOrThrow() as Promise<T>;
  }

  /**
   * Execute the query and return only the count of matching records
   */
  async executeCount(): Promise<number> {
    const query = this.lix.db
      .selectFrom(this.viewName as string)
      .select((eb) => [eb.fn.count<number>("*").as("count")]);
    
    // Apply where conditions
    const finalQuery = this.applyWhereConditions(query);
    
    const result = await finalQuery.executeTakeFirstOrThrow();
    return Number(result.count);
  }

  /**
   * Build the final query with all conditions applied
   */
  private buildQuery() {
    // Start with selecting all columns
    let query = this.baseQuery.selectAll();

    // Apply where conditions
    query = this.applyWhereConditions(query);
    
    // Apply sorting
    this.sortFields.forEach(({ field, direction }) => {
      query = query.orderBy(field, direction);
    });

    // Apply limit and offset if set
    if (this.limitValue !== undefined) {
      query = query.limit(this.limitValue);
    }

    if (this.offsetValue !== undefined) {
      query = query.offset(this.offsetValue);
    }

    return query;
  }

  /**
   * Apply where conditions to a query
   */
  private applyWhereConditions<Q>(query: Q): Q {
    let result = query as any;

    this.whereConditions.forEach(({ field, operator, value }) => {
      switch (operator) {
        case "=":
          result = result.where(field, "=", value);
          break;
        case "!=":
          result = result.where(field, "!=", value);
          break;
        case "<":
          result = result.where(field, "<", value);
          break;
        case "<=":
          result = result.where(field, "<=", value);
          break;
        case ">":
          result = result.where(field, ">", value);
          break;
        case ">=":
          result = result.where(field, ">=", value);
          break;
        case "like":
          result = result.where(field, "like", value);
          break;
        case "in":
          result = result.where(field, "in", value);
          break;
        case "not in":
          result = result.where(field, "not in", value);
          break;
        case "startsWith":
          result = result.where(field, "like", `${value}%`);
          break;
        case "endsWith":
          result = result.where(field, "like", `%${value}`);
          break;
        case "contains":
          result = result.where(field, "like", `%${value}%`);
          break;
        default:
          // Default to equality for unknown operators
          result = result.where(field, "=", value);
          break;
      }
    });

    return result;
  }
}