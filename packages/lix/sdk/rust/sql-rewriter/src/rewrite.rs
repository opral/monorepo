use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlparser::ast::{
    BinaryOperator, Expr, Ident, Query, Select, SetExpr, Statement, TableAlias, TableFactor,
    TableWithJoins,
};
use sqlparser::dialect::SQLiteDialect;
use sqlparser::parser::Parser;

const TARGET_VIEW: &str = "internal_state_reader";

#[derive(Debug)]
pub enum RewriteError {
    SqlParse(String),
    ContextParse(String),
    SubqueryParse(String),
}

impl std::fmt::Display for RewriteError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RewriteError::SqlParse(message)
            | RewriteError::ContextParse(message)
            | RewriteError::SubqueryParse(message) => write!(f, "{}", message),
        }
    }
}

impl std::error::Error for RewriteError {}

#[derive(Default, Clone)]
struct RewriteContext {
    table_cache: Option<HashSet<String>>,
    views: HashMap<String, String>,
    parameters: Vec<JsonValue>,
}

#[derive(Default)]
struct RewriteAccumulator {
    internal_state_reader: Option<InternalStateReaderHint>,
}

#[derive(Default)]
struct InternalStateReaderHint {
    schema_keys: HashSet<String>,
    include_inheritance: bool,
}

#[derive(Serialize)]
pub struct RewriteOutput {
    pub sql: String,
    #[serde(rename = "expandedSql", skip_serializing_if = "Option::is_none")]
    pub expanded_sql: Option<String>,
    #[serde(rename = "cacheHints", skip_serializing_if = "Option::is_none")]
    pub cache_hints: Option<CacheHints>,
}

#[derive(Serialize, Default)]
pub struct CacheHints {
    #[serde(
        rename = "internalStateReader",
        skip_serializing_if = "Option::is_none"
    )]
    internal_state_reader: Option<InternalStateReaderHintPayload>,
}

#[derive(Serialize)]
pub struct InternalStateReaderHintPayload {
    #[serde(rename = "schemaKeys")]
    schema_keys: Vec<String>,
    #[serde(rename = "includeInheritance")]
    include_inheritance: bool,
}

#[derive(Deserialize)]
struct ContextPayload {
    #[serde(rename = "tableCache")]
    table_cache: Option<Vec<String>>,
    views: Option<HashMap<String, String>>,
    parameters: Option<Vec<JsonValue>>,
}

impl RewriteContext {
    fn from_json(json: Option<&str>) -> Result<Self, RewriteError> {
        let Some(raw) = json else {
            return Ok(Self::default());
        };

        let payload: ContextPayload = serde_json::from_str(raw).map_err(|error| {
            RewriteError::ContextParse(format!("Failed to parse rewrite context: {}", error))
        })?;

        let table_cache = payload
            .table_cache
            .map(|values| values.into_iter().collect());

        let views = payload
            .views
            .unwrap_or_default()
            .into_iter()
            .map(|(name, sql)| (name.to_ascii_lowercase(), sql.trim().to_string()))
            .filter(|(_, sql)| !sql.is_empty())
            .collect();

        let parameters = payload.parameters.unwrap_or_default();

        Ok(Self {
            table_cache,
            views,
            parameters,
        })
    }

    fn should_include_cache(&self, schema_key: &str) -> bool {
        match self.table_cache.as_ref() {
            Some(cache) => {
                let table_name = schema_key_to_cache_table_name(schema_key);
                cache.contains(&table_name)
            }
            None => true,
        }
    }

    fn should_include_inheritance(&self) -> bool {
        match self.table_cache.as_ref() {
            Some(cache) => {
                let descriptor = schema_key_to_cache_table_name("lix_version_descriptor");
                cache.contains(&descriptor)
            }
            None => true,
        }
    }

    fn cache_tables(&self) -> Vec<String> {
        self.table_cache
            .as_ref()
            .map(|set| {
                let mut tables: Vec<String> = set.iter().cloned().collect();
                tables.sort();
                tables
            })
            .unwrap_or_default()
    }

    fn view_sql(&self, table_name: &str) -> Option<&str> {
        let key = table_name.to_ascii_lowercase();
        self.views.get(&key).map(|sql| sql.as_str())
    }
}

#[derive(Default)]
struct PlaceholderResolver {
    parameters: Vec<JsonValue>,
    position: usize,
}

impl PlaceholderResolver {
    fn new(parameters: &[JsonValue]) -> Self {
        Self {
            parameters: parameters.to_vec(),
            position: 0,
        }
    }

    fn resolve_next_string(&mut self) -> Option<String> {
        if self.position >= self.parameters.len() {
            return None;
        }

        let value = self.parameters[self.position].clone();
        self.position += 1;

        match value {
            JsonValue::String(text) => Some(text),
            JsonValue::Number(number) => Some(number.to_string()),
            JsonValue::Bool(boolean) => Some(boolean.to_string()),
            _ => None,
        }
    }
}

#[derive(Default)]
struct RewriteStats {
    expanded: bool,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum RewritePhase {
    ExpandOnly,
    Full,
}

thread_local! {
    static CACHED_CONTEXT: RefCell<RewriteContext> = RefCell::new(RewriteContext::default());
}

pub fn set_rewrite_context(context_json: Option<&str>) -> Result<(), RewriteError> {
    let context = RewriteContext::from_json(context_json)?;
    CACHED_CONTEXT.with(|cached| {
        *cached.borrow_mut() = context;
    });
    Ok(())
}

pub fn rewrite_sql(sql: &str, context_json: Option<&str>) -> Result<RewriteOutput, RewriteError> {
    let context = if let Some(json) = context_json {
        RewriteContext::from_json(Some(json))?
    } else {
        CACHED_CONTEXT.with(|cached| cached.borrow().clone())
    };

    let dialect = SQLiteDialect {};
    let mut statements = Parser::parse_sql(&dialect, sql)
        .map_err(|error| RewriteError::SqlParse(format!("SQL parse error: {}", error)))?;
    let mut expanded_statements = statements.clone();

    let mut stats = RewriteStats::default();
    let mut noop_accumulator = RewriteAccumulator::default();
    let mut expand_resolver = PlaceholderResolver::new(&context.parameters);
    let expanded_changed = rewrite_statements(
        &mut expanded_statements,
        &context,
        RewritePhase::ExpandOnly,
        &mut noop_accumulator,
        &mut expand_resolver,
        &mut stats,
    )?;

    let expanded_sql = if expanded_changed && stats.expanded {
        Some(statements_to_string(&expanded_statements))
    } else {
        None
    };

    let mut accumulator = RewriteAccumulator::default();
    let mut resolver = PlaceholderResolver::new(&context.parameters);
    let final_changed = rewrite_statements(
        &mut statements,
        &context,
        RewritePhase::Full,
        &mut accumulator,
        &mut resolver,
        &mut stats,
    )?;

    let output_sql = if final_changed {
        statements_to_string(&statements)
    } else {
        sql.to_string()
    };

    let cache_hints = accumulator.into_cache_hints();

    Ok(RewriteOutput {
        sql: output_sql,
        expanded_sql,
        cache_hints,
    })
}

fn statements_to_string(statements: &[Statement]) -> String {
    statements
        .iter()
        .map(|statement| statement.to_string())
        .collect::<Vec<_>>()
        .join("; ")
}

fn rewrite_statements(
    statements: &mut [Statement],
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<bool, RewriteError> {
    let mut changed = false;
    for statement in statements {
        if rewrite_statement(statement, context, phase, accumulator, resolver, stats)? {
            changed = true;
        }
    }
    Ok(changed)
}

fn rewrite_statement(
    statement: &mut Statement,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<bool, RewriteError> {
    match statement {
        Statement::Query(query) => rewrite_query(query, context, phase, accumulator, resolver, stats),
        _ => Ok(false),
    }
}

fn rewrite_query(
    query: &mut Query,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<bool, RewriteError> {
    let mut changed = false;

    if let Some(with) = &mut query.with {
        for cte in &mut with.cte_tables {
            if rewrite_query(&mut cte.query, context, phase, accumulator, resolver, stats)? {
                changed = true;
            }
        }
    }

    changed |= rewrite_set_expr(
        query.body.as_mut(),
        context,
        phase,
        accumulator,
        resolver,
        stats,
    )?;

    Ok(changed)
}

fn rewrite_set_expr(
    set_expr: &mut SetExpr,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<bool, RewriteError> {
    match set_expr {
        SetExpr::Select(select) => rewrite_select(select.as_mut(), context, phase, accumulator, resolver, stats),
        SetExpr::Query(query) => rewrite_query(query.as_mut(), context, phase, accumulator, resolver, stats),
        SetExpr::SetOperation { left, right, .. } => {
            let left_changed = rewrite_set_expr(
                left.as_mut(),
                context,
                phase,
                accumulator,
                resolver,
                stats,
            )?;
            let right_changed = rewrite_set_expr(
                right.as_mut(),
                context,
                phase,
                accumulator,
                resolver,
                stats,
            )?;
            Ok(left_changed || right_changed)
        }
        SetExpr::Values(_) => Ok(false),
        _ => Ok(false),
    }
}

fn rewrite_select(
    select: &mut Select,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<bool, RewriteError> {
    let mut changed = false;

    for table_with_joins in &mut select.from {
        if rewrite_table_with_joins(
            table_with_joins,
            select.selection.as_ref(),
            context,
            phase,
            accumulator,
            resolver,
            stats,
        )? {
            changed = true;
        }
    }

    Ok(changed)
}

fn rewrite_table_with_joins(
    table_with_joins: &mut TableWithJoins,
    selection: Option<&Expr>,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<bool, RewriteError> {
    let mut changed = false;

    if let Some(new_relation) = rewrite_table_factor(
        &table_with_joins.relation,
        selection,
        context,
        phase,
        accumulator,
        resolver,
        stats,
    )? {
        table_with_joins.relation = new_relation;
        changed = true;
    }

    for join in &mut table_with_joins.joins {
        if let Some(new_relation) =
            rewrite_table_factor(
                &join.relation,
                selection,
                context,
                phase,
                accumulator,
                resolver,
                stats,
            )?
        {
            join.relation = new_relation;
            changed = true;
        }
    }

    Ok(changed)
}

fn rewrite_table_factor(
    factor: &TableFactor,
    selection: Option<&Expr>,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<Option<TableFactor>, RewriteError> {
    let Some(target) = analyze_table_factor(factor) else {
        return Ok(None);
    };

    let table_name_lower = target.table_name.to_ascii_lowercase();

    if phase == RewritePhase::ExpandOnly && table_name_lower == TARGET_VIEW {
        let schema_filters = selection
            .map(|expr| collect_schema_filters(expr, &target.alias, resolver))
            .unwrap_or_default();

        let include_inheritance = context.should_include_inheritance();

        let (schema_key_opt, cache_tables): (Option<String>, Vec<String>) =
            match schema_filters.len() {
                0 => {
                    let tables = context
                        .cache_tables()
                        .into_iter()
                        .filter(|name| {
                            name != &schema_key_to_cache_table_name("lix_version_descriptor")
                        })
                        .collect();
                    (None, tables)
                }
                1 => {
                    let schema_key = schema_filters[0].clone();
                    let include_cache = context.should_include_cache(&schema_key);
                    let tables = if include_cache {
                        vec![schema_key_to_cache_table_name(&schema_key)]
                    } else {
                        Vec::new()
                    };
                    (Some(schema_key), tables)
                }
                _ => return Ok(None),
            };

        let subquery_sql = build_internal_state_reader_subquery(
            schema_key_opt.as_deref(),
            &cache_tables,
            include_inheritance,
        );

        let mut subquery = parse_select_query(&subquery_sql)?;
        subquery.limit = None;
        subquery.offset = None;

        let alias_ident = target
            .alias_ident
            .unwrap_or_else(|| ident_from_str(&target.alias));
        let alias = TableAlias {
            name: alias_ident,
            columns: vec![],
        };

        stats.expanded = true;

        return Ok(Some(TableFactor::Derived {
            lateral: false,
            subquery: Box::new(subquery),
            alias: Some(alias),
        }));
    }

    if phase == RewritePhase::Full && table_name_lower == TARGET_VIEW {
        let schema_filters = selection
            .map(|expr| collect_schema_filters(expr, &target.alias, resolver))
            .unwrap_or_default();

        let include_inheritance = context.should_include_inheritance();

        let (schema_key_opt, cache_tables): (Option<String>, Vec<String>) =
            match schema_filters.len() {
                0 => {
                    let tables = context
                        .cache_tables()
                        .into_iter()
                        .filter(|name| {
                            name != &schema_key_to_cache_table_name("lix_version_descriptor")
                        })
                        .collect();
                    (None, tables)
                }
                1 => {
                    let schema_key = schema_filters[0].clone();
                    let include_cache = context.should_include_cache(&schema_key);
                    let tables = if include_cache {
                        vec![schema_key_to_cache_table_name(&schema_key)]
                    } else {
                        Vec::new()
                    };
                    (Some(schema_key), tables)
                }
                _ => return Ok(None),
            };

        let subquery_sql = build_internal_state_reader_subquery(
            schema_key_opt.as_deref(),
            &cache_tables,
            include_inheritance,
        );

        let mut subquery = parse_select_query(&subquery_sql)?;
        subquery.limit = None;
        subquery.offset = None;

        let alias_ident = target
            .alias_ident
            .unwrap_or_else(|| ident_from_str(&target.alias));
        let alias = TableAlias {
            name: alias_ident,
            columns: vec![],
        };

        if let Some(schema_key) = schema_key_opt.clone() {
            accumulator.touch_internal_state_reader(schema_key, include_inheritance);
        } else {
            accumulator.touch_internal_state_reader_any(include_inheritance);
        }

        return Ok(Some(TableFactor::Derived {
            lateral: false,
            subquery: Box::new(subquery),
            alias: Some(alias),
        }));
    }

    if let Some(view_sql) = context.view_sql(&target.table_name) {
        let (derived, references_internal_reader) = expand_view_table_factor(
            &target,
            view_sql,
            context,
            phase,
            accumulator,
            resolver,
            stats,
        )?;
        if phase == RewritePhase::ExpandOnly {
            stats.expanded = true;
            return Ok(Some(derived));
        } else if references_internal_reader {
            stats.expanded = true;
            return Ok(Some(derived));
        } else {
            return Ok(None);
        }
    }

    Ok(None)
}

struct TableTarget {
    alias: String,
    alias_ident: Option<Ident>,
    table_name: String,
}

fn analyze_table_factor(factor: &TableFactor) -> Option<TableTarget> {
    match factor {
        TableFactor::Table { name, alias, .. } => {
            let base_ident = name.0.last()?.value.clone();
            let (alias_name, alias_ident) = match alias {
                Some(alias) => (alias.name.value.clone(), Some(alias.name.clone())),
                None => (base_ident.clone(), None),
            };

            Some(TableTarget {
                alias: alias_name,
                alias_ident,
                table_name: base_ident,
            })
        }
        TableFactor::Derived { .. } => None,
        TableFactor::NestedJoin { .. } => None,
        TableFactor::TableFunction { .. } => None,
        TableFactor::JsonTable { .. } => None,
        TableFactor::Function { .. } => None,
        TableFactor::UNNEST { .. } => None,
        TableFactor::Pivot { .. } => None,
        TableFactor::Unpivot { .. } => None,
    }
}

fn expand_view_table_factor(
    target: &TableTarget,
    view_sql: &str,
    context: &RewriteContext,
    phase: RewritePhase,
    accumulator: &mut RewriteAccumulator,
    resolver: &mut PlaceholderResolver,
    stats: &mut RewriteStats,
) -> Result<(TableFactor, bool), RewriteError> {
    let mut subquery = parse_select_query(view_sql)?;
    let _ = rewrite_query(
        &mut subquery,
        context,
        phase,
        accumulator,
        resolver,
        stats,
    )?;
    let references_internal_reader = query_contains_internal_state_reader(&subquery);
    subquery.limit = None;
    subquery.offset = None;

    let alias_ident = target
        .alias_ident
        .clone()
        .unwrap_or_else(|| ident_from_str(&target.alias));
    let alias = TableAlias {
        name: alias_ident,
        columns: vec![],
    };

    Ok((
        TableFactor::Derived {
            lateral: false,
            subquery: Box::new(subquery),
            alias: Some(alias),
        },
        references_internal_reader,
    ))
}

fn query_contains_internal_state_reader(query: &Query) -> bool {
    if let Some(with) = &query.with {
        for cte in &with.cte_tables {
            if query_contains_internal_state_reader(&cte.query) {
                return true;
            }
        }
    }

    set_expr_contains_internal_state_reader(query.body.as_ref())
}

fn set_expr_contains_internal_state_reader(set_expr: &SetExpr) -> bool {
    match set_expr {
        SetExpr::Select(select) => select_contains_internal_state_reader(select.as_ref()),
        SetExpr::Query(query) => query_contains_internal_state_reader(query.as_ref()),
        SetExpr::SetOperation { left, right, .. } => {
            set_expr_contains_internal_state_reader(left.as_ref())
                || set_expr_contains_internal_state_reader(right.as_ref())
        }
        SetExpr::Values(_) => false,
        _ => false,
    }
}

fn select_contains_internal_state_reader(select: &Select) -> bool {
    for table_with_joins in &select.from {
        if table_with_joins_contains_internal_state_reader(table_with_joins) {
            return true;
        }
    }
    false
}

fn table_with_joins_contains_internal_state_reader(table: &TableWithJoins) -> bool {
    if table_factor_contains_internal_state_reader(&table.relation) {
        return true;
    }

    for join in &table.joins {
        if table_factor_contains_internal_state_reader(&join.relation) {
            return true;
        }
    }

    false
}

fn table_factor_contains_internal_state_reader(factor: &TableFactor) -> bool {
    match factor {
        TableFactor::Table { name, .. } => name
            .0
            .last()
            .map(|ident| ident.value.eq_ignore_ascii_case(TARGET_VIEW))
            .unwrap_or(false),
        TableFactor::Derived { subquery, .. } => query_contains_internal_state_reader(subquery),
        TableFactor::TableFunction { .. }
        | TableFactor::Function { .. }
        | TableFactor::JsonTable { .. }
        | TableFactor::UNNEST { .. }
        | TableFactor::NestedJoin { .. }
        | TableFactor::Pivot { .. }
        | TableFactor::Unpivot { .. } => false,
    }
}

fn parse_select_query(sql: &str) -> Result<Query, RewriteError> {
    let cleaned = sql.trim().trim_end_matches(';').trim();
    if cleaned.is_empty() {
        return Err(RewriteError::SubqueryParse(
            "View definition produced an empty query".to_string(),
        ));
    }

    let parsed = Parser::parse_sql(&SQLiteDialect {}, cleaned).map_err(|error| {
        RewriteError::SubqueryParse(format!("Failed to parse view query: {}", error))
    })?;

    let statement = parsed.into_iter().next().ok_or_else(|| {
        RewriteError::SubqueryParse("View definition did not contain a query".to_string())
    })?;

    match statement {
        Statement::Query(query) => Ok(*query),
        _ => Err(RewriteError::SubqueryParse(
            "View definition is not a SELECT query".to_string(),
        )),
    }
}

fn collect_schema_filters(
    expr: &Expr,
    alias: &str,
    resolver: &mut PlaceholderResolver,
) -> Vec<String> {
    let mut values = HashSet::new();
    collect_schema_filters_recursive(expr, alias, resolver, &mut values);
    values.into_iter().collect()
}

fn collect_schema_filters_recursive(
    expr: &Expr,
    alias: &str,
    resolver: &mut PlaceholderResolver,
    output: &mut HashSet<String>,
) {
    match expr {
        Expr::BinaryOp { left, op, right } => {
            if matches_schema_column(left, alias) && matches_eq_operator(op) {
                for value in extract_literal_values(right, resolver) {
                    if !value.is_empty() {
                        output.insert(value);
                    }
                }
            } else if matches_schema_column(right, alias) && matches_eq_operator(op) {
                for value in extract_literal_values(left, resolver) {
                    if !value.is_empty() {
                        output.insert(value);
                    }
                }
            } else if matches_logical_operator(op) {
                collect_schema_filters_recursive(left, alias, resolver, output);
                collect_schema_filters_recursive(right, alias, resolver, output);
            } else {
                consume_placeholders(left, resolver);
                consume_placeholders(right, resolver);
            }
        }
        Expr::Nested(expr) => collect_schema_filters_recursive(expr, alias, resolver, output),
        Expr::Between {
            low,
            high,
            expr: inner,
            ..
        } => {
            collect_schema_filters_recursive(inner, alias, resolver, output);
            collect_schema_filters_recursive(low, alias, resolver, output);
            collect_schema_filters_recursive(high, alias, resolver, output);
        }
        Expr::InList { expr, list, .. } => {
            if matches_schema_column(expr, alias) {
                for item in list {
                    for value in extract_literal_values(item, resolver) {
                        if !value.is_empty() {
                            output.insert(value);
                        }
                    }
                }
            } else {
                consume_placeholders(expr, resolver);
                for item in list {
                    consume_placeholders(item, resolver);
                }
            }
        }
        _ => consume_placeholders(expr, resolver),
    }
}

fn consume_placeholders(expr: &Expr, resolver: &mut PlaceholderResolver) {
    match expr {
        Expr::Value(sqlparser::ast::Value::Placeholder(_)) => {
            let _ = resolver.resolve_next_string();
        }
        Expr::BinaryOp { left, right, .. } => {
            consume_placeholders(left, resolver);
            consume_placeholders(right, resolver);
        }
        Expr::Nested(inner) => consume_placeholders(inner, resolver),
        Expr::Between { expr, low, high, .. } => {
            consume_placeholders(expr, resolver);
            consume_placeholders(low, resolver);
            consume_placeholders(high, resolver);
        }
        Expr::InList { expr, list, .. } => {
            consume_placeholders(expr, resolver);
            for item in list {
                consume_placeholders(item, resolver);
            }
        }
        Expr::Tuple(items) => {
            for item in items {
                consume_placeholders(item, resolver);
            }
        }
        _ => {}
    }
}

fn matches_logical_operator(op: &BinaryOperator) -> bool {
    matches!(op, BinaryOperator::And | BinaryOperator::Or)
}

fn matches_eq_operator(op: &BinaryOperator) -> bool {
    matches!(op, BinaryOperator::Eq)
}

fn matches_schema_column(expr: &Expr, alias: &str) -> bool {
    match expr {
        Expr::Identifier(ident) => ident.value.eq_ignore_ascii_case("schema_key"),
        Expr::CompoundIdentifier(idents) => {
            if idents.len() == 2 {
                let table = &idents[0].value;
                let column = &idents[1].value;
                return column.eq_ignore_ascii_case("schema_key")
                    && table.eq_ignore_ascii_case(alias);
            }
            false
        }
        _ => false,
    }
}

fn extract_literal_values(expr: &Expr, resolver: &mut PlaceholderResolver) -> Vec<String> {
    match expr {
        Expr::Value(sqlparser::ast::Value::SingleQuotedString(value)) => vec![value.clone()],
        Expr::Value(sqlparser::ast::Value::DoubleQuotedString(value)) => vec![value.clone()],
        Expr::Value(sqlparser::ast::Value::NationalStringLiteral(value)) => vec![value.clone()],
        Expr::Value(sqlparser::ast::Value::Number(value, _)) => vec![value.clone()],
        Expr::Value(sqlparser::ast::Value::Placeholder(_)) => {
            resolver.resolve_next_string().into_iter().collect()
        }
        Expr::InList { list, .. } => list
            .iter()
            .flat_map(|item| extract_literal_values(item, resolver))
            .collect(),
        Expr::Nested(expr) => extract_literal_values(expr, resolver),
        _ => vec![],
    }
}

impl RewriteAccumulator {
    fn touch_internal_state_reader(&mut self, schema_key: String, include_inheritance: bool) {
        let hint = self
            .internal_state_reader
            .get_or_insert_with(InternalStateReaderHint::default);
        hint.schema_keys.insert(schema_key);
        if include_inheritance {
            hint.include_inheritance = true;
        }
    }

    fn touch_internal_state_reader_any(&mut self, include_inheritance: bool) {
        let hint = self
            .internal_state_reader
            .get_or_insert_with(InternalStateReaderHint::default);
        if include_inheritance {
            hint.include_inheritance = true;
        }
    }

    fn into_cache_hints(self) -> Option<CacheHints> {
        self.internal_state_reader.map(|hint| {
            let mut schema_keys: Vec<String> = hint.schema_keys.into_iter().collect();
            schema_keys.sort();
            CacheHints {
                internal_state_reader: Some(InternalStateReaderHintPayload {
                    schema_keys,
                    include_inheritance: hint.include_inheritance,
                }),

            }
        })
    }
}

impl CacheHints {
    pub fn internal_state_reader(&self) -> Option<&InternalStateReaderHintPayload> {
        self.internal_state_reader.as_ref()
    }
}

impl InternalStateReaderHintPayload {
    pub fn schema_keys(&self) -> &[String] {
        &self.schema_keys
    }

    pub fn include_inheritance(&self) -> bool {
        self.include_inheritance
    }
}

fn build_internal_state_reader_subquery(
    schema_key: Option<&str>,
    cache_tables: &[String],
    include_inheritance: bool,
) -> String {
    let include_cache = !cache_tables.is_empty();

    let mut segments = vec![
        build_transaction_branch(schema_key),
        build_untracked_branch(schema_key),
    ];

    let mut cache_alias: Option<String> = None;
    let mut cache_union_cte: Option<String> = None;
    let mut cache_table_name_for_cte: Option<String> = None;

    if include_cache {
        if let Some(key) = schema_key {
            let table_name = cache_tables[0].clone();
            let cache_identifier = format_identifier(&table_name);
            segments.push(build_cache_branch(Some(key), &cache_identifier));
            if include_inheritance {
                segments.push(build_cache_inheritance_branch(Some(key), &cache_identifier));
            }
            cache_alias = Some(cache_identifier);
            cache_table_name_for_cte = Some(table_name);
        } else {
            let cache_identifier = "cache_union".to_string();
            let union_body = cache_tables
                .iter()
                .map(|name| build_cache_union(name))
                .collect::<Vec<_>>()
                .join("\nUNION ALL\n");
            segments.push(build_cache_branch(None, &cache_identifier));
            if include_inheritance {
                segments.push(build_cache_inheritance_branch(None, &cache_identifier));
            }
            cache_union_cte = Some(format!("cache_union AS ({})", union_body));
            cache_alias = Some(cache_identifier);
        }
    }

    if include_inheritance {
        segments.push(build_inherited_untracked_branch(
            schema_key,
            include_cache,
            cache_alias.as_deref(),
        ));
        segments.push(build_inherited_txn_branch(
            schema_key,
            include_cache,
            cache_alias.as_deref(),
        ));
    }

    let union = join_with_union(&segments);

    let descriptor_table = schema_key_to_cache_table_name("lix_version_descriptor");
    let descriptor = format_identifier(&descriptor_table);

    if include_inheritance {
        build_inheritance_cte(
            include_cache,
            cache_table_name_for_cte.as_deref(),
            cache_union_cte.as_deref(),
            &descriptor,
            &union,
        )
    } else if include_cache {
        if let Some(cte) = cache_union_cte {
            format!("WITH {} SELECT DISTINCT * FROM ({})", cte, union)
        } else if let Some(table_name) = cache_table_name_for_cte {
            format!(
                "WITH cache_union AS ({}) SELECT DISTINCT * FROM ({})",
                build_cache_union(&table_name),
                union
            )
        } else {
            format!("SELECT DISTINCT * FROM ({})", union)
        }
    } else {
        format!("SELECT DISTINCT * FROM ({})", union)
    }
}

fn build_inheritance_cte(
    include_cache: bool,
    cache_table: Option<&str>,
    cache_union_cte: Option<&str>,
    descriptor_table: &str,
    union_sql: &str,
) -> String {
    let mut segments = Vec::new();
    if include_cache {
        if let Some(cte) = cache_union_cte {
            segments.push(cte.to_string());
        } else if let Some(table) = cache_table {
            if let Some(cache_union) = some_cache_union(Some(table)) {
                segments.push(cache_union);
            }
        }
    }
    segments.push(format!(
		"version_descriptor_base AS (\n\tSELECT\n\t\tjson_extract(isc_v.snapshot_content, '$.id') AS version_id,\n\t\tjson_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id\n\tFROM {} AS isc_v\n\tWHERE isc_v.inheritance_delete_marker = 0\n)",
		descriptor_table
	));
    segments.push(
		"version_inheritance(version_id, ancestor_version_id) AS (\n\tSELECT\n\t\tvdb.version_id,\n\t\tvdb.inherits_from_version_id\n\tFROM version_descriptor_base vdb\n\tWHERE vdb.inherits_from_version_id IS NOT NULL\n\n\tUNION\n\n\tSELECT\n\t\tvir.version_id,\n\t\tvdb.inherits_from_version_id\n\tFROM version_inheritance vir\n\tJOIN version_descriptor_base vdb ON vdb.version_id = vir.ancestor_version_id\n\tWHERE vdb.inherits_from_version_id IS NOT NULL\n)".to_string(),
	);
    segments.push(
		"version_parent AS (\n\tSELECT\n\t\tvdb.version_id,\n\t\tvdb.inherits_from_version_id AS parent_version_id\n\tFROM version_descriptor_base vdb\n\tWHERE vdb.inherits_from_version_id IS NOT NULL\n)".to_string(),
	);

    let with_clause = format!("WITH RECURSIVE {}", segments.join(",\n\n"));
    format!("{}\nSELECT DISTINCT * FROM ({})", with_clause, union_sql)
}

fn build_cache_union(cache_table_name: &str) -> String {
    format!("SELECT * FROM {}", format_identifier(cache_table_name))
}

fn some_cache_union(cache_table: Option<&str>) -> Option<String> {
    cache_table.map(|name| format!("cache_union AS ({})", build_cache_union(name)))
}

fn join_with_union(segments: &[String]) -> String {
    segments
        .iter()
        .map(|segment| segment.trim_end())
        .collect::<Vec<_>>()
        .join("\n\nUNION ALL\n\n")
}

fn build_transaction_branch(schema_key: Option<&str>) -> String {
    let filter = schema_key
        .map(|key| format!("WHERE txn.schema_key = '{}'", escape_single_quotes(key)))
        .unwrap_or_default();

    format!(
		"SELECT\n\t'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk,\n\ttxn.entity_id,\n\ttxn.schema_key,\n\ttxn.file_id,\n\ttxn.plugin_key,\n\tjson(txn.snapshot_content) AS snapshot_content,\n\ttxn.schema_version,\n\ttxn.version_id,\n\ttxn.created_at,\n\ttxn.created_at AS updated_at,\n\tNULL AS inherited_from_version_id,\n\ttxn.id AS change_id,\n\ttxn.untracked,\n\t'pending' AS commit_id,\n\tjson(txn.metadata) AS metadata,\n\tws_txn.writer_key\nFROM internal_transaction_state txn\nLEFT JOIN internal_state_writer ws_txn ON\n\tws_txn.file_id = txn.file_id AND\n\tws_txn.entity_id = txn.entity_id AND\n\tws_txn.schema_key = txn.schema_key AND\n\tws_txn.version_id = txn.version_id\n{}",
		filter
	)
}

fn build_untracked_branch(schema_key: Option<&str>) -> String {
    let filter = schema_key
        .map(|key| format!("AND u.schema_key = '{}'", escape_single_quotes(key)))
        .unwrap_or_default();

    format!(
		"SELECT\n\t'U' || '~' || lix_encode_pk_part(u.file_id) || '~' || lix_encode_pk_part(u.entity_id) || '~' || lix_encode_pk_part(u.version_id) AS _pk,\n\tu.entity_id,\n\tu.schema_key,\n\tu.file_id,\n\tu.plugin_key,\n\tjson(u.snapshot_content) AS snapshot_content,\n\tu.schema_version,\n\tu.version_id,\n\tu.created_at,\n\tu.updated_at,\n\tNULL AS inherited_from_version_id,\n\t'untracked' AS change_id,\n\t1 AS untracked,\n\t'untracked' AS commit_id,\n\tNULL AS metadata,\n\tws_untracked.writer_key\nFROM internal_state_all_untracked u\nLEFT JOIN internal_state_writer ws_untracked ON\n\tws_untracked.file_id = u.file_id AND\n\tws_untracked.entity_id = u.entity_id AND\n\tws_untracked.schema_key = u.schema_key AND\n\tws_untracked.version_id = u.version_id\nWHERE u.inheritance_delete_marker = 0\n\tAND u.snapshot_content IS NOT NULL\n\t{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_transaction_state t\n\tWHERE t.version_id = u.version_id\n\t\tAND t.file_id = u.file_id\n\t\tAND t.schema_key = u.schema_key\n\t\tAND t.entity_id = u.entity_id\n)\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_state_all_untracked child_unt\n\tWHERE child_unt.version_id = u.version_id\n\t\tAND child_unt.file_id = u.file_id\n\t\tAND child_unt.schema_key = u.schema_key\n\t\tAND child_unt.entity_id = u.entity_id\n		AND child_unt.rowid != u.rowid\n)",
		filter
	)
}

fn build_cache_branch(schema_key: Option<&str>, cache_table: &str) -> String {
    let filter = schema_key
        .map(|key| format!("AND c.schema_key = '{}'", escape_single_quotes(key)))
        .unwrap_or_default();

    format!(
		"SELECT\n\t'C' || '~' || lix_encode_pk_part(c.file_id) || '~' || lix_encode_pk_part(c.entity_id) || '~' || lix_encode_pk_part(c.version_id) AS _pk,\n\tc.entity_id,\n\tc.schema_key,\n\tc.file_id,\n\tc.plugin_key,\n\tjson(c.snapshot_content) AS snapshot_content,\n\tc.schema_version,\n\tc.version_id,\n\tc.created_at,\n\tc.updated_at,\n\tc.inherited_from_version_id,\n\tc.change_id,\n\t0 AS untracked,\n\tc.commit_id,\n\tch.metadata AS metadata,\n\tws_cache.writer_key\nFROM {} AS c\nLEFT JOIN change ch ON ch.id = c.change_id\nLEFT JOIN internal_state_writer ws_cache ON\n\tws_cache.file_id = c.file_id AND\n\tws_cache.entity_id = c.entity_id AND\n\tws_cache.schema_key = c.schema_key AND\n\tws_cache.version_id = c.version_id\nWHERE (\n\t(c.inheritance_delete_marker = 0 AND c.snapshot_content IS NOT NULL) OR\n\t(c.inheritance_delete_marker = 1 AND c.snapshot_content IS NULL)\n)\n\t{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_transaction_state t\n\tWHERE t.version_id = c.version_id\n\t\tAND t.file_id = c.file_id\n\t\tAND t.schema_key = c.schema_key\n\t\tAND t.entity_id = c.entity_id\n)\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_state_all_untracked u\n\tWHERE u.version_id = c.version_id\n\t\tAND u.file_id = c.file_id\n\t\tAND u.schema_key = c.schema_key\n\t\tAND u.entity_id = c.entity_id\n)",
		cache_table,
		filter
	)
}

fn build_cache_inheritance_branch(schema_key: Option<&str>, cache_table: &str) -> String {
    let filter = schema_key
        .map(|key| format!("AND isc.schema_key = '{}'", escape_single_quotes(key)))
        .unwrap_or_default();

    format!(
		"SELECT\n\t'CI' || '~' || lix_encode_pk_part(isc.file_id) || '~' || lix_encode_pk_part(isc.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,\n\tisc.entity_id,\n\tisc.schema_key,\n\tisc.file_id,\n\tisc.plugin_key,\n\tjson(isc.snapshot_content) AS snapshot_content,\n\tisc.schema_version,\n\tvi.version_id,\n\tisc.created_at,\n\tisc.updated_at,\n\tisc.version_id AS inherited_from_version_id,\n\tisc.change_id,\n\t0 AS untracked,\n\tisc.commit_id,\n\tch.metadata AS metadata,\n\tCOALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key\nFROM version_inheritance vi\nJOIN {} AS isc ON isc.version_id = vi.ancestor_version_id\nLEFT JOIN change ch ON ch.id = isc.change_id\nLEFT JOIN internal_state_writer ws_child ON\n\tws_child.file_id = isc.file_id AND\n\tws_child.entity_id = isc.entity_id AND\n\tws_child.schema_key = isc.schema_key AND\n\tws_child.version_id = vi.version_id\nLEFT JOIN internal_state_writer ws_parent ON\n\tws_parent.file_id = isc.file_id AND\n\tws_parent.entity_id = isc.entity_id AND\n\tws_parent.schema_key = isc.schema_key AND\n\tws_parent.version_id = isc.version_id\nWHERE isc.inheritance_delete_marker = 0\n\tAND isc.snapshot_content IS NOT NULL\n\t{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_transaction_state t\n\tWHERE t.version_id = vi.version_id\n\t\tAND t.file_id = isc.file_id\n\t\tAND t.schema_key = isc.schema_key\n\t\tAND t.entity_id = isc.entity_id\n)\nAND NOT EXISTS (\n\tSELECT 1 FROM {} child_isc\n\tWHERE child_isc.version_id = vi.version_id\n\t\tAND child_isc.file_id = isc.file_id\n\t\tAND child_isc.schema_key = isc.schema_key\n\t\tAND child_isc.entity_id = isc.entity_id\n)\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_state_all_untracked child_unt\n\tWHERE child_unt.version_id = vi.version_id\n\t\tAND child_unt.file_id = isc.file_id\n\t\tAND child_unt.schema_key = isc.schema_key\n\t\tAND child_unt.entity_id = isc.entity_id\n)",
		cache_table,
		filter,
		cache_table
	)
}

fn build_inherited_untracked_branch(
    schema_key: Option<&str>,
    include_cache: bool,
    cache_table: Option<&str>,
) -> String {
    let filter = schema_key
        .map(|key| format!("AND unt.schema_key = '{}'", escape_single_quotes(key)))
        .unwrap_or_default();
    let cache_prune = if include_cache {
        cache_table.map(|table| {
			format!(
				"AND NOT EXISTS (\n\tSELECT 1 FROM {} child_isc\n\tWHERE child_isc.version_id = vi.version_id\n\t\tAND child_isc.file_id = unt.file_id\n\t\tAND child_isc.schema_key = unt.schema_key\n\t\tAND child_isc.entity_id = unt.entity_id\n)",
				table
			)
		})
    } else {
        None
    };

    let cache_clause = cache_prune.unwrap_or_default();

    format!(
		"SELECT\n\t'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,\n\tunt.entity_id,\n\tunt.schema_key,\n\tunt.file_id,\n\tunt.plugin_key,\n\tjson(unt.snapshot_content) AS snapshot_content,\n\tunt.schema_version,\n\tvi.version_id,\n\tunt.created_at,\n\tunt.updated_at,\n\tunt.version_id AS inherited_from_version_id,\n\t'untracked' AS change_id,\n\t1 AS untracked,\n\t'untracked' AS commit_id,\n\tNULL AS metadata,\n\tCOALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key\nFROM version_inheritance vi\nJOIN internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id\nLEFT JOIN internal_state_writer ws_child ON\n\tws_child.file_id = unt.file_id AND\n\tws_child.entity_id = unt.entity_id AND\n\tws_child.schema_key = unt.schema_key AND\n\tws_child.version_id = vi.version_id\nLEFT JOIN internal_state_writer ws_parent ON\n\tws_parent.file_id = unt.file_id AND\n\tws_parent.entity_id = unt.entity_id AND\n\tws_parent.schema_key = unt.schema_key AND\n\tws_parent.version_id = unt.version_id\nWHERE unt.inheritance_delete_marker = 0\n\tAND unt.snapshot_content IS NOT NULL\n\t{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_transaction_state t\n\tWHERE t.version_id = vi.version_id\n\t\tAND t.file_id = unt.file_id\n\t\tAND t.schema_key = unt.schema_key\n\t\tAND t.entity_id = unt.entity_id\n)\n{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_state_all_untracked child_unt\n\tWHERE child_unt.version_id = vi.version_id\n\t\tAND child_unt.file_id = unt.file_id\n\t\tAND child_unt.schema_key = unt.schema_key\n\t\tAND child_unt.entity_id = unt.entity_id\n		AND child_unt.rowid != unt.rowid\n)",
		filter,
		cache_clause
	)
}

fn build_inherited_txn_branch(
    schema_key: Option<&str>,
    include_cache: bool,
    cache_table: Option<&str>,
) -> String {
    let filter = schema_key
        .map(|key| format!("AND txn.schema_key = '{}'", escape_single_quotes(key)))
        .unwrap_or_default();
    let cache_prune = if include_cache {
        cache_table.map(|table| {
			format!(
				"AND NOT EXISTS (\n\tSELECT 1 FROM {} child_isc\n\tWHERE child_isc.version_id = vi.version_id\n\t\tAND child_isc.file_id = txn.file_id\n\t\tAND child_isc.schema_key = txn.schema_key\n\t\tAND child_isc.entity_id = txn.entity_id\n)",
				table
			)
		})
    } else {
        None
    };
    let cache_clause = cache_prune.unwrap_or_default();

    format!(
		"SELECT\n\t'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,\n\ttxn.entity_id,\n\ttxn.schema_key,\n\ttxn.file_id,\n\ttxn.plugin_key,\n\tjson(txn.snapshot_content) AS snapshot_content,\n\ttxn.schema_version,\n\tvi.version_id,\n\ttxn.created_at,\n\ttxn.created_at AS updated_at,\n\tvi.parent_version_id AS inherited_from_version_id,\n\ttxn.id AS change_id,\n\ttxn.untracked,\n\t'pending' AS commit_id,\n\tjson(txn.metadata) AS metadata,\n\tCOALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key\nFROM version_parent vi\nJOIN internal_transaction_state txn ON txn.version_id = vi.parent_version_id\nLEFT JOIN internal_state_writer ws_child ON\n\tws_child.file_id = txn.file_id AND\n\tws_child.entity_id = txn.entity_id AND\n\tws_child.schema_key = txn.schema_key AND\n\tws_child.version_id = vi.version_id\nLEFT JOIN internal_state_writer ws_parent ON\n\tws_parent.file_id = txn.file_id AND\n\tws_parent.entity_id = txn.entity_id AND\n\tws_parent.schema_key = txn.schema_key AND\n\tws_parent.version_id = vi.parent_version_id\nWHERE vi.parent_version_id IS NOT NULL\n\tAND txn.snapshot_content IS NOT NULL\n\t{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_transaction_state child_txn\n\tWHERE child_txn.version_id = vi.version_id\n\t\tAND child_txn.file_id = txn.file_id\n\t\tAND child_txn.schema_key = txn.schema_key\n\t\tAND child_txn.entity_id = txn.entity_id\n)\n{}\nAND NOT EXISTS (\n\tSELECT 1 FROM internal_state_all_untracked child_unt\n\tWHERE child_unt.version_id = vi.version_id\n\t\tAND child_unt.file_id = txn.file_id\n\t\tAND child_unt.schema_key = txn.schema_key\n\t\tAND child_unt.entity_id = txn.entity_id\n)",
		filter,
		cache_clause
	)
}

fn schema_key_to_cache_table_name(schema_key: &str) -> String {
    let sanitized = schema_key
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '_' })
        .collect::<String>();
    format!("internal_state_cache_{}", sanitized)
}

fn escape_single_quotes(value: &str) -> String {
    value.replace('\'', "''")
}

fn format_identifier(value: &str) -> String {
    if is_simple_identifier(value) {
        value.to_string()
    } else {
        format!("\"{}\"", value.replace('"', "\""))
    }
}

fn is_simple_identifier(value: &str) -> bool {
    value
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '$')
}

fn ident_from_str(value: &str) -> Ident {
    Ident::new(value)
}
