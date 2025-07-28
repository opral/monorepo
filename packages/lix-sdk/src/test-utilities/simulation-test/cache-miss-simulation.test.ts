import { expect, test } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { nextDeterministicSequenceNumber } from "../../deterministic/sequence.js";
test("cache miss simulation test discovery", () => {});

simulationTest(
	"cache miss simulation clears cache before every select",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
				{
					key: "lix_log_levels",
					value: ["debug"],
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Insert test data
		await lix.db
			.insertInto("key_value")
			.values([{ key: "test_1", value: "value_1" }])
			.execute();

		const timeBefore = timestamp({ lix });

		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_1")
			.selectAll()
			.execute();

		const cacheMissAfter = await lix.db
			.selectFrom("log")
			.where("key", "=", "lix_state_cache_miss")
			.where("lixcol_created_at", ">", timeBefore)
			.selectAll()
			.execute();

		// greater than one because the entity view key value
		// might fire off subqueries that also trigger cache misses
		expect(cacheMissAfter.length).toBeGreaterThan(1);
	},
	{
		onlyRun: ["cache-miss"],
	}
);

simulationTest(
	"cache miss simulation produces correct query results",
	async ({ openSimulatedLix, expectDeterministic, simulation }) => {
		console.log(`\n[SIMULATION] Running: ${simulation.name}`);
		
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Check if global version exists as an entity
		const globalVersionEntity = lix.sqlite.exec({
			sql: `SELECT * FROM internal_resolved_state_all WHERE entity_id = 'global' AND schema_key = 'lix_version'`,
			returnValue: "resultRows",
		});
		console.log(
			`[${simulation.name}] Global version entity before insert:`,
			globalVersionEntity.length > 0 ? "EXISTS" : "MISSING"
		);

		// Insert data - this creates changes and change sets
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "config_a", value: "a" },
				{ key: "config_b", value: "b" },
				{ key: "config_c", value: "c" },
			])
			.execute();

		// Check what version_id was used for the changes
		const changesAfterInsert = lix.sqlite.exec({
			sql: `SELECT version_id, COUNT(*) as count FROM internal_change_in_transaction GROUP BY version_id`,
			returnValue: "resultRows",
		});
		console.log(
			`[VERIFY] Changes in transaction by version_id:`,
			changesAfterInsert
		);

		// Check cache contents right after insert
		const cacheAfterInsert = lix.sqlite.exec({
			sql: `SELECT COUNT(*) as count, version_id FROM internal_state_cache GROUP BY version_id ORDER BY version_id`,
			returnValue: "resultRows",
		});
		console.log(`[DEBUG] Cache after insert:`, cacheAfterInsert);

		// Check version roots view - this is key to ChatGPT's analysis
		const versionRoots = lix.sqlite.exec({
			sql: `SELECT * FROM internal_materialization_version_roots`,
			returnValue: "resultRows",
		});
		console.log(`[VERIFY] Version roots view:`, versionRoots);
		
		// Also check what the lineage view contains
		if (simulation.name === "cache miss") {
			const lineageView = lix.sqlite.exec({
				sql: `SELECT * FROM internal_materialization_lineage ORDER BY version_id, id`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Lineage view:`, lineageView);
		}
		
		// Debug the version roots query step by step
		if (simulation.name === "cache miss") {
			// First, check all version changes
			const allVersionChanges = lix.sqlite.exec({
				sql: `SELECT entity_id, json_extract(snapshot_content,'$.change_set_id') as cs_id
				      FROM internal_materialization_all_changes
				      WHERE schema_key = 'lix_version'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] All version changes in materialization view:`, allVersionChanges);
			
			// Check which changesets have outgoing edges
			const changesetsWithOutgoingEdges = lix.sqlite.exec({
				sql: `SELECT DISTINCT json_extract(snapshot_content,'$.parent_id') as parent_id
				      FROM internal_materialization_all_changes
				      WHERE schema_key = 'lix_change_set_edge'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Changesets with outgoing edges:`, changesetsWithOutgoingEdges);
			
			// Check all edges in the materialization view
			const allEdgesInView = lix.sqlite.exec({
				sql: `SELECT entity_id, json_extract(snapshot_content,'$.parent_id') as parent, json_extract(snapshot_content,'$.child_id') as child
				      FROM internal_materialization_all_changes
				      WHERE schema_key = 'lix_change_set_edge'
				      ORDER BY created_at`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] All edges in materialization view:`, allEdgesInView);
			
			// Check if our specific edge is in the view
			const specificEdgeInView = lix.sqlite.exec({
				sql: `SELECT COUNT(*) as count
				      FROM internal_materialization_all_changes
				      WHERE schema_key = 'lix_change_set_edge'
				        AND entity_id = 'boot_0000000003::test_0000000050'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Edge boot_0000000003::test_0000000050 in materialization view:`, specificEdgeInView[0] && specificEdgeInView[0][0] > 0);
		}
		
		// Check which changes were created early and their corresponding CSE entries
		const earlyChanges = lix.sqlite.exec({
			sql: `SELECT c.id, c.entity_id, c.schema_key, c.created_at,
			             cse.entity_id as cse_entity_id,
			             json_extract(cse.snapshot_content, '$.change_set_id') as in_changeset
			      FROM change c
			      LEFT JOIN change cse ON cse.schema_key = 'lix_change_set_element' 
			                           AND json_extract(cse.snapshot_content, '$.change_id') = c.id
			      WHERE c.schema_key IN ('lix_version', 'lix_change_set', 'lix_change_set_edge') 
			        AND c.created_at < '1970-01-01T00:00:00.020Z' 
			      ORDER BY c.created_at`,
			returnValue: "resultRows",
		});
		console.log(`[DEBUG] Early bootstrap changes:`, earlyChanges);
		
		// Look for the specific entities that are extra in cache-miss
		if (simulation.name === "cache miss") {
			const specificProblems = lix.sqlite.exec({
				sql: `SELECT c.id, c.entity_id, c.schema_key, c.created_at,
				             (SELECT GROUP_CONCAT(cse.entity_id || ':' || json_extract(cse.snapshot_content, '$.change_set_id'))
				              FROM change cse 
				              WHERE cse.schema_key = 'lix_change_set_element' 
				                AND json_extract(cse.snapshot_content, '$.change_id') = c.id) as in_changesets
				      FROM change c
				      WHERE c.entity_id IN ('boot_0000000000', 'boot_0000000001::test_0000000012', 'test_0000000012')
				        AND c.schema_key IN ('lix_version', 'lix_change_set_edge', 'lix_change_set')
				      ORDER BY c.created_at`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Specific problem entities:`, specificProblems);
			
			// Check what change set elements exist for these changes
			const changeSetElements = lix.sqlite.exec({
				sql: `SELECT entity_id, json_extract(snapshot_content, '$.change_set_id') as changeset_id,
				             json_extract(snapshot_content, '$.change_id') as change_id,
				             json_extract(snapshot_content, '$.entity_id') as target_entity,
				             json_extract(snapshot_content, '$.schema_key') as target_schema
				      FROM change 
				      WHERE schema_key = 'lix_change_set_element'
				        AND json_extract(snapshot_content, '$.change_id') IN (
				          '01920000-0000-7000-8000-00000000000e',
				          '01920000-0000-7000-8000-000000000010',
				          '01920000-0000-7000-8000-000000000012'
				        )
				      ORDER BY entity_id`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Change set elements for problem changes:`, changeSetElements);
			
			// Check what the test_0000000012 changeset contains
			const test12Elements = lix.sqlite.exec({
				sql: `SELECT json_extract(snapshot_content, '$.change_id') as change_id,
				             json_extract(snapshot_content, '$.entity_id') as entity_id,
				             json_extract(snapshot_content, '$.schema_key') as schema_key
				      FROM change 
				      WHERE schema_key = 'lix_change_set_element'
				        AND json_extract(snapshot_content, '$.change_set_id') = 'test_0000000012'
				      ORDER BY entity_id`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Elements in changeset test_0000000012:`, test12Elements);
			
			// Check what's in the global changeset
			const test50Elements = lix.sqlite.exec({
				sql: `SELECT json_extract(snapshot_content, '$.change_id') as change_id,
				             json_extract(snapshot_content, '$.entity_id') as entity_id,
				             json_extract(snapshot_content, '$.schema_key') as schema_key
				      FROM change 
				      WHERE schema_key = 'lix_change_set_element'
				        AND json_extract(snapshot_content, '$.change_set_id') = 'test_0000000050'
				      ORDER BY entity_id`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Elements in changeset test_0000000050 (global):`, test50Elements);
		}

		// Check if we have any lix_version changes for global
		const globalVersionChanges = lix.sqlite.exec({
			sql: `SELECT entity_id, json_extract(snapshot_content, '$.change_set_id') as change_set_id, created_at FROM change WHERE schema_key = 'lix_version' ORDER BY created_at`,
			returnValue: "resultRows",
		});
		console.log(
			`[VERIFY] Version changes (entity_id, change_set_id, created_at):`,
			globalVersionChanges
		);
		
		// Check what change 01920000-0000-7000-8000-00000000000e is
		const specificChange = lix.sqlite.exec({
			sql: `SELECT id, entity_id, schema_key, snapshot_content FROM change WHERE id = '01920000-0000-7000-8000-00000000000e'`,
			returnValue: "resultRows",
		});
		console.log(`[DEBUG] What is change 01920000-0000-7000-8000-00000000000e:`, specificChange);
		
		// Check how many times test_0000000012 was created
		const test12Changes = lix.sqlite.exec({
			sql: `SELECT id, entity_id, schema_key, created_at FROM change WHERE entity_id IN ('test_0000000012', 'boot_0000000001::test_0000000012') ORDER BY created_at`,
			returnValue: "resultRows",
		});
		console.log(`[VERIFY] Changes for test_0000000012 entities:`, test12Changes);

		// Check all change sets
		const allChangeSets = lix.sqlite.exec({
			sql: `SELECT entity_id, created_at FROM change WHERE schema_key = 'lix_change_set' ORDER BY created_at`,
			returnValue: "resultRows",
		});
		console.log(`[VERIFY] All change sets:`, allChangeSets);

		// Check what the materializer view produces before cache population
		if (simulation.name === "cache miss") {
			const materializerDupes = lix.sqlite.exec({
				sql: `SELECT entity_id, schema_key, file_id, version_id, COUNT(*) as cnt
				      FROM internal_state_materializer
				      GROUP BY entity_id, schema_key, file_id, version_id
				      HAVING cnt > 1`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Duplicate entries in materializer:`, materializerDupes);
			
			// Check if the missing CSE entries exist in the materializer
			const missingCSEs = lix.sqlite.exec({
				sql: `SELECT entity_id, version_id FROM internal_state_materializer WHERE entity_id LIKE 'test_0000000050::%' AND schema_key = 'lix_change_set_element'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 CSE entries in materializer:`, missingCSEs);
			
			// Check the entity_versions CTE
			const entityVersions = lix.sqlite.exec({
				sql: `WITH entity_versions AS (
					SELECT 
						entity_id,
						schema_key,
						file_id,
						COUNT(DISTINCT version_id) as version_count,
						MIN(version_id) as first_version_id
					FROM internal_materialization_leaf_snapshots
					WHERE snapshot_content IS NOT NULL
					GROUP BY entity_id, schema_key, file_id
				)
				SELECT * FROM entity_versions WHERE entity_id LIKE 'test_0000000050::%' LIMIT 5`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] entity_versions for test_0000000050::*:`, entityVersions);
			
			// Check leaf snapshots for these entities
			const leafSnapshots = lix.sqlite.exec({
				sql: `SELECT entity_id, version_id FROM internal_materialization_leaf_snapshots WHERE entity_id LIKE 'test_0000000050::%' AND schema_key = 'lix_change_set_element' LIMIT 5`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] leaf snapshots for test_0000000050::*:`, leafSnapshots);
			
			// Check all CSE leaf snapshots for version global
			const globalCSELeafSnapshots = lix.sqlite.exec({
				sql: `SELECT entity_id, schema_key, version_id, change_set_id 
				      FROM internal_materialization_leaf_snapshots 
				      WHERE schema_key = 'lix_change_set_element' 
				        AND version_id = 'global'
				      ORDER BY entity_id
				      LIMIT 10`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Global CSE leaf snapshots:`, globalCSELeafSnapshots);
			
			// Check if these changes exist at all
			const test50Changes = lix.sqlite.exec({
				sql: `SELECT id, entity_id, schema_key FROM change WHERE entity_id LIKE 'test_0000000050::%' AND schema_key = 'lix_change_set_element' LIMIT 5`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Raw changes for test_0000000050::*:`, test50Changes);
			
			// Check if they're in the CSE view
			const test50CSE = lix.sqlite.exec({
				sql: `SELECT target_entity_id, version_id FROM internal_materialization_cse WHERE target_entity_id LIKE 'test_0000000050::%' LIMIT 5`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] CSE view for test_0000000050::*:`, test50CSE);
			
			// Check if test_0000000050 is in the lineage
			const test50Lineage = lix.sqlite.exec({
				sql: `SELECT id, version_id FROM internal_materialization_lineage WHERE id = 'test_0000000050'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 in lineage:`, test50Lineage);
			
			// Check what the CSE view produces for test_0000000050
			const test50CSEDetailed = lix.sqlite.exec({
				sql: `SELECT * FROM internal_materialization_cse WHERE cse_origin_change_set_id = 'test_0000000050' LIMIT 5`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] CSE entries for changeset test_0000000050:`, test50CSEDetailed);
			
			// Check if these target changes exist
			const targetChangesExist = lix.sqlite.exec({
				sql: `SELECT 
				        cse.target_change_id,
				        cse.target_entity_id,
				        ch.entity_id as change_entity_id,
				        ch.schema_key as change_schema_key
				      FROM internal_materialization_cse cse
				      LEFT JOIN internal_materialization_all_changes ch ON cse.target_change_id = ch.id
				      WHERE cse.cse_origin_change_set_id = 'test_0000000050'
				      LIMIT 5`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Target changes for test_0000000050 CSE:`, targetChangesExist);
			
			// Check if the CSE entries are in all_changes view
			const test50AllChanges = lix.sqlite.exec({
				sql: `SELECT entity_id, json_extract(snapshot_content, '$.change_set_id') as cs_id FROM internal_materialization_all_changes WHERE entity_id LIKE 'test_0000000050::%' AND schema_key = 'lix_change_set_element' LIMIT 3`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 CSE in all_changes:`, test50AllChanges);
			
			// Check if they join with lineage correctly
			const test50CSEJoinLineage = lix.sqlite.exec({
				sql: `SELECT 
				        ias.entity_id,
				        json_extract(ias.snapshot_content,'$.change_set_id') AS cse_changeset,
				        lcs.id AS lineage_id,
				        lcs.version_id
				      FROM internal_materialization_all_changes ias
				      LEFT JOIN internal_materialization_lineage lcs 
				        ON json_extract(ias.snapshot_content,'$.change_set_id') = lcs.id
				      WHERE ias.entity_id LIKE 'test_0000000050::%' 
				        AND ias.schema_key = 'lix_change_set_element'
				      LIMIT 3`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 CSE join with lineage:`, test50CSEJoinLineage);
		}
		
		// Check if test_0000000050 exists before the query
		if (simulation.name === "cache miss") {
			const test50BeforeQuery = lix.sqlite.exec({
				sql: `SELECT COUNT(*) as count FROM change WHERE entity_id = 'test_0000000050' AND schema_key = 'lix_change_set'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 exists before query:`, test50BeforeQuery[0][0] > 0);
			
			// Check for edge between boot_0000000003 and test_0000000050
			const edgeCheck = lix.sqlite.exec({
				sql: `
					SELECT COUNT(*) as count 
					FROM change 
					WHERE schema_key = 'lix_change_set_edge'
					  AND json_extract(snapshot_content,'$.parent_id') = 'boot_0000000003'
					  AND json_extract(snapshot_content,'$.child_id') = 'test_0000000050'
				`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Edge from boot_0000000003 to test_0000000050 exists in change table:`, edgeCheck[0] && edgeCheck[0][0] > 0);
			
			// Also check internal_change table directly
			const internalEdgeCheck = lix.sqlite.exec({
				sql: `
					SELECT entity_id, created_at, snapshot_content
					FROM internal_change 
					WHERE schema_key = 'lix_change_set_edge'
					  AND entity_id = 'boot_0000000003::test_0000000050'
				`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Edge in internal_change table:`, internalEdgeCheck);
			
			// Check all edges
			const allEdges = lix.sqlite.exec({
				sql: `
					SELECT 
						entity_id,
						json_extract(snapshot_content,'$.parent_id') as parent,
						json_extract(snapshot_content,'$.child_id') as child
					FROM change 
					WHERE schema_key = 'lix_change_set_edge'
					ORDER BY created_at
				`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] All edges:`, allEdges);
		}
		
		// Debug why test_0000000050::* CSE elements are not in leaf snapshots
		if (simulation.name === "cache miss") {
			// Direct test of leaf snapshots logic for a specific CSE
			const specificCSETest = lix.sqlite.exec({
				sql: `
					SELECT 
						ias.entity_id,
						ias.schema_key,
						json_extract(ias.snapshot_content,'$.change_set_id') as cs_id,
						lcs.id as lineage_id,
						lcs.version_id
					FROM internal_materialization_all_changes ias
					JOIN internal_materialization_lineage lcs 
						ON json_extract(ias.snapshot_content,'$.change_set_id') = lcs.id
					WHERE ias.entity_id = 'test_0000000050::01920000-0000-7000-8000-00000000000e'
						AND ias.schema_key = 'lix_change_set_element'
				`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Specific CSE in CSE view logic:`, specificCSETest);
			
			// Check if ANY CSE elements are in leaf snapshots
			const anyCSEInLeafSnapshots = lix.sqlite.exec({
				sql: `
					SELECT COUNT(*) as count
					FROM internal_materialization_leaf_snapshots
					WHERE schema_key = 'lix_change_set_element'
				`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Total CSE elements in leaf snapshots:`, anyCSEInLeafSnapshots[0] && anyCSEInLeafSnapshots[0][0]);
		}
		
		// Add a marker to track when query starts
		console.log(`[TIMING] About to execute query`);
		
		// Force a query to trigger cache population if needed
		await lix.db
			.selectFrom("key_value")
			.where("key", "in", ["config_a", "config_b", "config_c"])
			.selectAll()
			.execute();
			
		console.log(`[TIMING] Query completed`);
			
		// Check if test_0000000050 exists after the query
		if (simulation.name === "cache miss") {
			const test50AfterQuery = lix.sqlite.exec({
				sql: `SELECT COUNT(*) as count FROM change WHERE entity_id = 'test_0000000050' AND schema_key = 'lix_change_set'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 exists after query:`, test50AfterQuery[0][0] > 0);
		}

		// Check cache again after the query
		const cacheAfterQuery = lix.sqlite.exec({
			sql: `SELECT COUNT(*) as count, version_id FROM internal_state_cache GROUP BY version_id ORDER BY version_id`,
			returnValue: "resultRows",
		});
		console.log(`[VERIFY] Cache after query:`, cacheAfterQuery);
		
		// Check what's in the materializer view
		if (simulation.name === "cache miss") {
			// Check what versions are in all_versions
			const allVersions = lix.sqlite.exec({
				sql: `WITH all_versions AS (
					SELECT DISTINCT entity_id as version_id 
					FROM change 
					WHERE schema_key = 'lix_version'
					UNION
					SELECT 'global' as version_id
				)
				SELECT * FROM all_versions ORDER BY version_id`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] All versions in materializer:`, allVersions);
			
			// Check prioritized entities for a specific entity
			const prioritizedSample = lix.sqlite.exec({
				sql: `SELECT entity_id, schema_key, version_id, visible_in_version, inherited_from_version_id, rn
				      FROM internal_materialization_prioritized_entities 
				      WHERE entity_id = 'boot_0000000002::01920000-0000-7000-8000-000000000003'
				      ORDER BY visible_in_version, rn`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Prioritized entities for boot_0000000002::01920000-0000-7000-8000-000000000003:`, prioritizedSample);
			
			// Check what the materializer is producing for this entity
			const materializerForEntity = lix.sqlite.exec({
				sql: `WITH all_versions AS (
					SELECT DISTINCT entity_id as version_id 
					FROM change 
					WHERE schema_key = 'lix_version'
					UNION
					SELECT 'global' as version_id
				)
				SELECT 
					pe.entity_id,
					pe.schema_key,
					av.version_id as av_version_id,
					pe.version_id as pe_version_id,
					pe.visible_in_version,
					pe.inherited_from_version_id
				FROM internal_materialization_prioritized_entities pe
				CROSS JOIN all_versions av
				WHERE pe.rn = 1 
				  AND pe.visible_in_version = av.version_id
				  AND pe.entity_id = 'boot_0000000002::01920000-0000-7000-8000-000000000003'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Materializer cross join for entity:`, materializerForEntity);
			
			const materializerSample = lix.sqlite.exec({
				sql: `SELECT entity_id, schema_key, version_id, inherited_from_version_id 
				      FROM internal_state_materializer 
				      WHERE entity_id LIKE 'boot_0000000002::%' 
				      ORDER BY version_id, entity_id 
				      LIMIT 10`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] Materializer sample for boot_0000000002::* entities:`, materializerSample);
			
			// Check if test_0000000050 CSE entries are in the materializer
			const test50InMaterializer = lix.sqlite.exec({
				sql: `SELECT COUNT(*) as count
				      FROM internal_state_materializer 
				      WHERE entity_id LIKE 'test_0000000050::%'`,
				returnValue: "resultRows",
			});
			console.log(`[DEBUG] test_0000000050 CSE entries in materializer:`, test50InMaterializer[0] && test50InMaterializer[0][0]);
		}

		// Check the state cache
		const cacheContents = lix.sqlite.exec({
			sql: `SELECT * FROM internal_state_cache ORDER BY entity_id, schema_key, version_id`,
			returnValue: "resultRows",
		});

		// Also get all changes to compare between simulations
		const allChanges = lix.sqlite.exec({
			sql: `SELECT id, entity_id, schema_key FROM change ORDER BY id`,
			returnValue: "resultRows",
		});

		expectDeterministic(cacheContents, ({ actual, expected }) => {
			console.log(
				`[CACHE DIFF] Normal cache has ${expected.length} entries, cache-miss has ${actual.length} entries`
			);

			// Find missing entries
			const actualEntityKeys = new Set(
				actual.map((row: any) => `${row[0]}|${row[1]}|${row[3]}`)
			); // entity_id|schema_key|version_id
			const expectedEntityKeys = new Set(
				expected.map((row: any) => `${row[0]}|${row[1]}|${row[3]}`)
			);

			const missingInCacheMiss = [...expectedEntityKeys].filter(
				(key) => !actualEntityKeys.has(key)
			);
			const extraInCacheMiss = [...actualEntityKeys].filter(
				(key) => !expectedEntityKeys.has(key)
			);

			console.log(
				`[CACHE DIFF] Missing in cache-miss: ${missingInCacheMiss.length} entries`
			);
			missingInCacheMiss.slice(0, 5).forEach((key) => {
				console.log(`  - ${key}`);
			});
			if (missingInCacheMiss.length > 5) {
				console.log(`  ... and ${missingInCacheMiss.length - 5} more`);
			}

			console.log(
				`[CACHE DIFF] Extra in cache-miss: ${extraInCacheMiss.length} entries`
			);
			extraInCacheMiss.slice(0, 5).forEach((key) => {
				console.log(`  - ${key}`);
			});

			// Check if we're underreporting changes
			// For missing entries, check if the corresponding changes exist in both simulations
			console.log(
				`\n[CHANGE ANALYSIS] Checking if changes exist for missing cache entries...`
			);

			// Get the normal cache entries that are missing in cache-miss
			const missingCacheEntries = expected.filter((row: any) => {
				const key = `${row[0]}|${row[1]}|${row[3]}`;
				return missingInCacheMiss.includes(key);
			});

			// Extract change_ids from missing entries
			const missingChangeIds = new Set(
				missingCacheEntries
					.map((row: any) => row[11]) // change_id is at index 11
					.filter((id: any) => id && id !== "untracked")
			);

			console.log(
				`[CHANGE ANALYSIS] Missing cache entries reference ${missingChangeIds.size} unique change IDs`
			);
			missingChangeIds.forEach((id) => console.log(`  - ${id}`));

			// Check what's in the cache for version_id=global
			console.log(
				`\n[CACHE ANALYSIS] Checking entries with version_id=global...`
			);
			const globalEntries = expected.filter((row: any) => row[3] === "global");
			const globalInCacheMiss = actual.filter(
				(row: any) => row[3] === "global"
			);
			console.log(
				`[CACHE ANALYSIS] Normal has ${globalEntries.length} entries with version_id=global`
			);
			console.log(
				`[CACHE ANALYSIS] Cache-miss has ${globalInCacheMiss.length} entries with version_id=global`
			);

			// All missing entries have version_id=global
			console.log(
				`[CACHE ANALYSIS] All ${missingInCacheMiss.length} missing entries have version_id=global`
			);

			// Note: We can't access the changes here in the diff callback
			// The allChanges comparison will be done separately
		}).toBeDefined();

		// Query state_all
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "!=", "lix_state_cache_stale")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expectDeterministic(stateAll).toBeDefined();

		// Check if changes are the same between simulations
		expectDeterministic(allChanges, ({ actual, expected }) => {
			console.log(
				`\n[CHANGES TOTAL] Normal has ${expected.length} changes, cache-miss has ${actual.length} changes`
			);
			if (actual.length !== expected.length) {
				console.log(
					`[CHANGES TOTAL] Different number of changes - we ARE underreporting changes!`
				);
			} else {
				console.log(
					`[CHANGES TOTAL] Same number of changes - not an underreporting issue`
				);
				console.log(
					`[CHANGES TOTAL] The issue is with cache population, not with change recording`
				);
			}
		}).toBeDefined();
	},
	{
		onlyRun: ["normal", "cache-miss"],
	}
);

simulationTest(
	"cache miss simulation maintains deterministic sequence equal to normal simulation",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Get initial sequence numbers
		const seq1 = nextDeterministicSequenceNumber({ lix });
		const seq2 = nextDeterministicSequenceNumber({ lix });
		const seq3 = nextDeterministicSequenceNumber({ lix });

		// These should be deterministic across simulations
		expectDeterministic(seq1).toBeDefined();
		expectDeterministic(seq2).toBe(seq1 + 1);
		expectDeterministic(seq3).toBe(seq2 + 1);

		// Get timestamps (which use sequence numbers internally)
		const ts1 = timestamp({ lix });
		const ts2 = timestamp({ lix });

		// Timestamps should also be deterministic
		expectDeterministic(ts1).toBeDefined();
		expectDeterministic(ts2).toBeDefined();

		// Perform a query that would trigger cache operations
		console.log("[TEST] Inserting test_key into key_value");
		await lix.db
			.insertInto("key_value")
			.values({ key: "test_key", value: "test_value" })
			.execute();

		// Check if data was actually inserted
		const rawCheck = lix.sqlite.exec({
			sql: "SELECT * FROM internal_resolved_state_all WHERE entity_id = 'test_key' AND schema_key = 'lix_key_value'",
			returnValue: "resultRows",
		});
		console.log(
			"[TEST] Raw check of internal_resolved_state_all:",
			JSON.stringify(rawCheck, null, 2)
		);

		// Check the active version
		const activeVersion = lix.sqlite.exec({
			sql: "SELECT * FROM active_version",
			returnValue: "resultRows",
		});
		console.log(
			"[TEST] Active version:",
			JSON.stringify(activeVersion, null, 2)
		);

		// Check what's in cache before query
		const cacheCheck = lix.sqlite.exec({
			sql: "SELECT * FROM internal_state_cache WHERE entity_id = 'test_key'",
			returnValue: "resultRows",
		});
		console.log(
			"[TEST] Cache before query:",
			JSON.stringify(cacheCheck, null, 2)
		);

		console.log("[TEST] About to query key_value table");
		const result = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_key")
			.selectAll()
			.execute();

		console.log("[TEST] Query result:", JSON.stringify(result, null, 2));

		// Check what's in the underlying tables
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		console.log("[TEST] state_all entries:", JSON.stringify(stateAll, null, 2));

		// The query result should be deterministic
		expectDeterministic(result).toHaveLength(1);
		expectDeterministic(result[0]?.value).toBe("test_value");

		// Get sequence number after operations
		const seqAfter = nextDeterministicSequenceNumber({ lix });

		// This sequence number should be deterministic across simulations
		expectDeterministic(seqAfter).toBeDefined();
		expectDeterministic(seqAfter).toBeGreaterThan(seq3);
	},
	{
		onlyRun: ["normal", "cache-miss"],
	}
);
