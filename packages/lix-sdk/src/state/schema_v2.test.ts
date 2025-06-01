import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { applyStateV2DatabaseSchema } from "./schema_v2.js";

test("lix_state_v2 virtual table provides cache-first behavior", async () => {
	const lix = await openLixInMemory({});
	
	// Apply the v2 schema with virtual table
	applyStateV2DatabaseSchema(lix.sqlite, lix.db as any);
	
	console.log("=== Testing lix_state_v2 virtual table performance ===");

	// Test 1: Cache miss scenario (first query) - measure performance
	console.log("\n🔍 === Test 1: Cache MISS Performance (materializing data) ===");
	
	const cacheMissStart = performance.now();
	const vtResults = lix.sqlite.exec({
		sql: `SELECT * FROM lix_state_v2`,
		returnValue: "resultRows"
	});
	const cacheMissEnd = performance.now();
	const cacheMissDuration = cacheMissEnd - cacheMissStart;

	console.log(`⏱️  Cache MISS query time: ${cacheMissDuration.toFixed(3)}ms`);
	console.log("   ↳ Includes: cache lookup + data materialization + cache population");
	
	expect(vtResults).toHaveLength(1);
	console.log("✅ Cache miss handled successfully - data materialized and cached");

	// Test 2: Verify cache was populated
	console.log("\n📊 === Test 2: Verify cache population ===");
	
	const cacheResults = lix.sqlite.exec({
		sql: "SELECT * FROM internal_cache_v2",
		returnValue: "resultRows"
	});

	expect(cacheResults).toHaveLength(1);
	expect(cacheResults[0]?.[0]).toBe('test-entity-v2'); // entity_id is first column
	expect(cacheResults[0]?.[1]).toBe('test-schema-v2'); // schema_key is second column
	
	console.log("✅ Cache populated with materialized data");

	// Test 3: Cache hit scenario - measure performance
	console.log("\n⚡ === Test 3: Cache HIT Performance (reading cached data) ===");
	
	const cacheHitStart = performance.now();
	const vtResults3 = lix.sqlite.exec({
		sql: `SELECT * FROM lix_state_v2`,
		returnValue: "resultRows"
	});
	const cacheHitEnd = performance.now();
	const cacheHitDuration = cacheHitEnd - cacheHitStart;

	console.log(`⏱️  Cache HIT query time: ${cacheHitDuration.toFixed(3)}ms`);
	console.log("   ↳ Includes: cache lookup only (no materialization)");
	
	expect(vtResults3).toHaveLength(1);
	expect(vtResults3[0]?.[0]).toBe('test-entity-v2'); // entity_id
	
	console.log("✅ Cache hit served data efficiently");

	// Test 4: Run multiple cache hits to get average performance
	console.log("\n📈 === Test 4: Multiple cache hits for average performance ===");
	
	const iterations = 10;
	let totalCacheHitTime = 0;
	
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		lix.sqlite.exec({
			sql: `SELECT * FROM lix_state_v2`,
			returnValue: "resultRows"
		});
		const end = performance.now();
		totalCacheHitTime += (end - start);
	}
	
	const averageCacheHitTime = totalCacheHitTime / iterations;
	console.log(`⏱️  Average cache hit time (${iterations} queries): ${averageCacheHitTime.toFixed(3)}ms`);

	// Performance comparison
	console.log("\n📊 === Performance Comparison ===");
	const speedupFactor = cacheMissDuration / averageCacheHitTime;
	const efficiencyGain = ((cacheMissDuration - averageCacheHitTime) / cacheMissDuration * 100);
	
	console.log(`🔄 Cache MISS:  ${cacheMissDuration.toFixed(3)}ms (includes materialization)`);
	console.log(`⚡ Cache HIT:   ${averageCacheHitTime.toFixed(3)}ms (cache only)`);
	console.log(`🚀 Speedup:    ${speedupFactor.toFixed(1)}x faster`);
	console.log(`📈 Efficiency: ${efficiencyGain.toFixed(1)}% improvement`);
	
	// Verify speedup is significant 
	expect(speedupFactor).toBeGreaterThan(2); // Cache hits should be at least 2x faster
	
	console.log("\n=== 🎉 lix_state_v2 virtual table performance test complete! ===");
	console.log("✨ Cache-first performance benefits verified:");
	console.log("  • Cache miss: includes expensive materialization");  
	console.log("  • Cache hit: fast cache-only lookup");
	console.log("  • Significant performance improvement demonstrated");
	console.log("  • Isolated v2 cache table working correctly");
});