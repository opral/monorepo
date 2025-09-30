mod rewrite;

use js_sys::{Array, Object, Reflect};
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Rewrites SQL statements using the embedded Rust sqlparser.
///
/// For now this focuses on handling the `internal_state_vtable` view so that
/// raw SQL queries are routed through the materialized cache tables. The
/// behaviour will expand as more rewriters are ported from the TypeScript
/// implementation.
#[wasm_bindgen]
pub fn rewrite_sql(sql: &str, context_json: Option<String>) -> Result<JsValue, JsValue> {
    let output = rewrite::rewrite_sql(sql, context_json.as_deref())
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
    serialize_rewrite_output(&output)
}

#[wasm_bindgen]
pub fn set_rewrite_context(context_json: Option<String>) -> Result<(), JsValue> {
    rewrite::set_rewrite_context(context_json.as_deref())
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

fn serialize_rewrite_output(output: &rewrite::RewriteOutput) -> Result<JsValue, JsValue> {
    let object = Object::new();
    Reflect::set(
        &object,
        &JsValue::from_str("sql"),
        &JsValue::from_str(&output.sql),
    )?;

    if let Some(expanded_sql) = output.expanded_sql.as_ref() {
        Reflect::set(
            &object,
            &JsValue::from_str("expandedSql"),
            &JsValue::from_str(expanded_sql),
        )?;
    }

    if let Some(cache_hints) = output.cache_hints.as_ref() {
        let hints = serialize_cache_hints(cache_hints)?;
        Reflect::set(&object, &JsValue::from_str("cacheHints"), &hints)?;
    }

    Ok(object.into())
}

fn serialize_cache_hints(hints: &rewrite::CacheHints) -> Result<JsValue, JsValue> {
    let cache_obj = Object::new();

    if let Some(reader) = hints.internal_state_vtable() {
        let reader_obj = Object::new();
        let schema_keys = Array::new();
        for key in reader.schema_keys() {
            schema_keys.push(&JsValue::from_str(key));
        }
        Reflect::set(
            &reader_obj,
            &JsValue::from_str("schemaKeys"),
            &schema_keys.into(),
        )?;
        Reflect::set(
            &reader_obj,
            &JsValue::from_str("includeInheritance"),
            &JsValue::from_bool(reader.include_inheritance()),
        )?;
        Reflect::set(
            &cache_obj,
            &JsValue::from_str("internalStateVtable"),
            &reader_obj.into(),
        )?;
    }

    Ok(cache_obj.into())
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
        assert_eq!(output.sql, "SELECT 1");
        assert!(output.cache_hints.is_none());
    }

    #[test]
    fn rewrites_internal_state_vtable_with_schema_filter() {
        let context = context_json(&["internal_state_cache_mock_schema"]);
        rewrite::set_rewrite_context(Some(&context)).unwrap();

        let input = "SELECT * FROM internal_state_vtable WHERE schema_key = 'mock_schema'";
        let output = rewrite::rewrite_sql(input, None).unwrap();

        assert!(output.sql.contains("internal_state_cache_mock_schema"));
        assert!(output.sql.contains("UNION ALL"));
        let hints = output.cache_hints.expect("expected cache hints");
        let reader = hints
            .internal_state_vtable()
            .expect("expected internal_state_vtable hints");
        assert_eq!(reader.schema_keys(), ["mock_schema"]);
    }

    #[test]
    fn rewrites_internal_state_vtable_when_schema_cache_missing() {
        let context = context_json(&[]);
        rewrite::set_rewrite_context(Some(&context)).unwrap();
        let input = "SELECT * FROM internal_state_vtable WHERE schema_key = 'missing_schema'";
        let output = rewrite::rewrite_sql(input, None).unwrap();
        assert_ne!(
            output.sql,
            "SELECT * FROM internal_state_vtable WHERE schema_key = 'missing_schema'"
        );
        assert!(output.sql.contains("internal_state_all_untracked"));
        assert!(!output.sql.contains("internal_state_cache_missing_schema"));
        let hints = output.cache_hints.expect("expected cache hints");
        let reader = hints
            .internal_state_vtable()
            .expect("expected internal_state_vtable hints");
        assert_eq!(reader.schema_keys(), ["missing_schema"]);
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

        assert!(output.sql.contains("42 AS value"));
    }

    #[test]
    fn rewrites_internal_state_vtable_with_parameterised_schema_key() {
        let base_context = serde_json::json!({
            "tableCache": ["internal_state_cache_mock_schema"],
        })
        .to_string();
        rewrite::set_rewrite_context(Some(&base_context)).unwrap();

        let contextual_parameters = serde_json::json!({
            "tableCache": ["internal_state_cache_mock_schema"],
            "parameters": ["mock_schema"],
        })
        .to_string();

        let input = "SELECT * FROM internal_state_vtable WHERE schema_key = ?";
        let output = rewrite::rewrite_sql(input, Some(&contextual_parameters)).unwrap();

        assert!(output.sql.contains("internal_state_cache_mock_schema"));
        let hints = output.cache_hints.expect("expected cache hints");
        let reader = hints
            .internal_state_vtable()
            .expect("expected internal_state_vtable hints");
        assert_eq!(reader.schema_keys(), ["mock_schema"]);
    }

    #[test]
    fn records_expanded_sql_when_view_targets_internal_state_vtable() {
        let context = serde_json::json!({
            "views": {
                "state_reader_view":
                    "SELECT entity_id FROM internal_state_vtable WHERE schema_key = 'mock_schema'"
            }
        })
        .to_string();
        rewrite::set_rewrite_context(Some(&context)).unwrap();

        let input = "SELECT entity_id FROM state_reader_view";
        let output = rewrite::rewrite_sql(input, None).unwrap();

        assert!(output.expanded_sql.is_some());
        let expanded = output.expanded_sql.unwrap();
        assert!(expanded.contains("internal_state_vtable"));
    }
}
