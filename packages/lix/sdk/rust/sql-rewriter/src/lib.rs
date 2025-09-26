mod rewrite;

use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Rewrites SQL statements using the embedded Rust sqlparser.
///
/// For now this focuses on handling the `internal_state_reader` view so that
/// raw SQL queries are routed through the materialized cache tables. The
/// behaviour will expand as more rewriters are ported from the TypeScript
/// implementation.
#[wasm_bindgen]
pub fn rewrite_sql(sql: &str, context_json: Option<String>) -> Result<String, JsValue> {
    rewrite::rewrite_sql(sql, context_json.as_deref())
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn set_rewrite_context(context_json: Option<String>) -> Result<(), JsValue> {
    rewrite::set_rewrite_context(context_json.as_deref())
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::rewrite;

    fn context_json(table_cache: &[&str]) -> String {
        let payload = serde_json::json!({
            "tableCache": table_cache,
        });
        payload.to_string()
    }

    #[test]
    fn leaves_unrelated_queries_untouched() {
        let input = "SELECT 1";
        let output = rewrite::rewrite_sql(input, None).unwrap();
        assert_eq!(output, "SELECT 1");
    }

	#[test]
	fn rewrites_internal_state_reader_with_schema_filter() {
		let context = context_json(&["internal_state_cache_mock_schema"]);
		rewrite::set_rewrite_context(Some(&context)).unwrap();

		let input = "SELECT * FROM internal_state_reader WHERE schema_key = 'mock_schema'";
		let output = rewrite::rewrite_sql(input, None).unwrap();

		assert!(output.contains("internal_state_cache_mock_schema"));
		assert!(output.contains("UNION ALL"));
	}

	#[test]
	fn preserves_original_query_when_schema_missing() {
		let context = context_json(&[]);
		rewrite::set_rewrite_context(Some(&context)).unwrap();
		let input = "SELECT * FROM internal_state_reader WHERE schema_key = 'missing_schema'";
		let output = rewrite::rewrite_sql(input, None).unwrap();
		assert_eq!(
			output,
			"SELECT * FROM internal_state_reader WHERE schema_key = 'missing_schema'"
		);
	}

	#[test]
	fn expands_view_definitions_when_provided() {
		let context = serde_json::json!({
			"views": {
				"example_view": "SELECT 42 AS value"
			}
		})
		.to_string();
		rewrite::set_rewrite_context(Some(&context)).unwrap();

		let input = "SELECT * FROM example_view";
		let output = rewrite::rewrite_sql(input, None).unwrap();

		assert!(output.contains("42 AS value"));
	}
}
