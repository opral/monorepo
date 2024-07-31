export function sqlTag(queryTemplate, ...params) {
    return {
        sql: queryTemplate.join('?'),
        params,
    };
}
//# sourceMappingURL=sql-tag.js.map