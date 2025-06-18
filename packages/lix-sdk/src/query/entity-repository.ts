import type { Lix } from "../lix/open-lix.js";
import { createChange } from "../change/create-change.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import { QueryBuilder } from "./query-builder.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

/**
 * Base repository class that provides common CRUD operations for entities
 * @template T Entity type
 * @template C Create input type
 * @template U Update input type
 */
export abstract class EntityRepository<T, C, U> {
  protected idField: string = "id";

  /**
   * Create a new entity repository
   */
  constructor(
    protected lix: Lix,
    protected schema: LixSchemaDefinition,
    protected viewName: string,
    protected pluginKey: string = "lix_own_entity"
  ) {}

  /**
   * Find an entity by its ID
   */
  async findOne(id: string): Promise<T | null> {
    return this.query()
      .where(this.idField as keyof T, "=", id)
      .executeTakeFirst();
  }

  /**
   * Find an entity by its ID or throw if not found
   */
  async findOneOrThrow(id: string): Promise<T> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return entity;
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<T[]> {
    return this.query().execute();
  }

  /**
   * Create a new entity
   */
  async create(data: C): Promise<T> {
    const id = (data as any)[this.idField] || this.generateId();
    const fileId = (data as any).file_id || id;
    
    // Create snapshot
    const snapshot = await createSnapshot({
      lix: this.lix,
      content: data,
    });

    // Create change
    const change = await createChange({
      lix: this.lix,
      entity_id: id,
      schema_key: this.schema["x-lix-key"],
      schema_version: this.schema["x-lix-version"],
      file_id: fileId,
      plugin_key: this.pluginKey,
      snapshot: {
        content: data,
      },
    });

    // Get active changeset
    const activeVersion = await this.lix.db
      .selectFrom("active_version")
      .select(["version_id", "change_set_id"])
      .executeTakeFirstOrThrow();

    // Create changeset with the new change
    await createChangeSet({
      lix: this.lix,
      elements: [{
        change_id: change.id,
        entity_id: id,
        schema_key: this.schema["x-lix-key"],
        file_id: fileId
      }],
      parents: [activeVersion.change_set_id],
    });

    // Return the newly created entity
    return this.findOneOrThrow(id);
  }

  /**
   * Update an existing entity
   */
  async update(id: string, data: U): Promise<T> {
    // Get current entity to verify it exists
    const currentEntity = await this.findOneOrThrow(id);
    const fileId = (currentEntity as any).file_id || id;
    
    // Merge update data with current entity data
    const updatedData = { ...currentEntity, ...data };
    
    // Create snapshot
    const snapshot = await createSnapshot({
      lix: this.lix,
      content: updatedData,
    });

    // Create change
    const change = await createChange({
      lix: this.lix,
      entity_id: id,
      schema_key: this.schema["x-lix-key"],
      schema_version: this.schema["x-lix-version"],
      file_id: fileId,
      plugin_key: this.pluginKey,
      snapshot: {
        content: updatedData,
      },
    });

    // Get active changeset
    const activeVersion = await this.lix.db
      .selectFrom("active_version")
      .select(["version_id", "change_set_id"])
      .executeTakeFirstOrThrow();

    // Create changeset with the update change
    await createChangeSet({
      lix: this.lix,
      elements: [{
        change_id: change.id,
        entity_id: id,
        schema_key: this.schema["x-lix-key"],
        file_id: fileId
      }],
      parents: [activeVersion.change_set_id],
    });

    // Return the updated entity
    return this.findOneOrThrow(id);
  }

  /**
   * Delete an entity by its ID
   */
  async delete(id: string): Promise<void> {
    // Get current entity to verify it exists
    const currentEntity = await this.findOneOrThrow(id);
    const fileId = (currentEntity as any).file_id || id;
    
    // Create change with null content (represents deletion)
    const change = await createChange({
      lix: this.lix,
      entity_id: id,
      schema_key: this.schema["x-lix-key"],
      schema_version: this.schema["x-lix-version"],
      file_id: fileId,
      plugin_key: this.pluginKey,
      snapshot: {
        content: null,
      },
    });

    // Get active changeset
    const activeVersion = await this.lix.db
      .selectFrom("active_version")
      .select(["version_id", "change_set_id"])
      .executeTakeFirstOrThrow();

    // Create changeset with the deletion change
    await createChangeSet({
      lix: this.lix,
      elements: [{
        change_id: change.id,
        entity_id: id,
        schema_key: this.schema["x-lix-key"],
        file_id: fileId
      }],
      parents: [activeVersion.change_set_id],
    });
  }

  /**
   * Create a new query builder for this entity
   */
  query(): QueryBuilder<T> {
    return new QueryBuilder<T>(this.lix, this.viewName as any);
  }

  /**
   * Generate a unique ID for a new entity
   */
  protected generateId(): string {
    // Use nanoid or a similar function
    return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}