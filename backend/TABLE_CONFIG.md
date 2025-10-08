# Table Configuration Reference

## Overview

The `table_config.json` file controls which tables are included in the GraphQL schema and what operations are allowed for each table.

## Configuration Structure

```json
{
  "tables": {
    "TABLE_NAME": {
      "includeInGraphQL": true,
      "includeInApp": true,
      "allowQuery": true,
      "allowCreate": true,
      "allowUpdate": true,
      "allowDelete": false
    }
  }
}
```

## Configuration Options

### Basic Inclusion
- **`includeInGraphQL`**: Include table in GraphQL schema generation
- **`includeInApp`**: Include table in frontend application entity configs

### Operation Permissions
- **`allowQuery`**: Enable `listTableNameS` query operation
- **`allowCreate`**: Enable `createTableName` mutation operation
- **`allowUpdate`**: Enable `updateTableName` mutation operation
- **`allowDelete`**: Enable `deleteTableName` mutation operation

## Common Patterns

### Read-Only Tables (Audit/Log tables)
```json
{
  "AUDIT_LOG": {
    "includeInGraphQL": true,
    "includeInApp": true,
    "allowQuery": true,
    "allowCreate": false,
    "allowUpdate": false,
    "allowDelete": false
  }
}
```

### Reference Data (Managed externally)
```json
{
  "LOOKUP_TABLE": {
    "includeInGraphQL": true,
    "includeInApp": true,
    "allowQuery": true,
    "allowCreate": false,
    "allowUpdate": false,
    "allowDelete": false
  }
}
```

### Sensitive Data (No delete allowed)
```json
{
  "USER_DATA": {
    "includeInGraphQL": true,
    "includeInApp": true,
    "allowQuery": true,
    "allowCreate": true,
    "allowUpdate": true,
    "allowDelete": false
  }
}
```

### Excluded Tables (Internal use only)
```json
{
  "INTERNAL_TABLE": {
    "includeInGraphQL": false,
    "includeInApp": false,
    "allowQuery": false,
    "allowCreate": false,
    "allowUpdate": false,
    "allowDelete": false
  }
}
```

## Automatic Management

When you run `npm run schema`, the system automatically:

1. **Adds new tables** from SQL files with default permissions (all operations enabled)
2. **Removes tables** that no longer have corresponding SQL files
3. **Preserves existing configurations** for tables that already exist

## Impact on Generated Files

### GraphQL Schema
- Only operations with `allow*: true` are included in the schema
- Tables with `includeInGraphQL: false` are completely excluded

### VTL Templates
- Only generates templates for allowed operations
- Reduces serverless.yml mapping complexity

### Entity Configurations
- Only tables with `includeInApp: true` get entity config files
- Preserves custom settings while updating field arrays

## Best Practices

1. **Default to restrictive**: Start with minimal permissions and add as needed
2. **Document reasons**: Use comments in JSON (if supported) or separate documentation
3. **Review regularly**: Audit permissions as part of security reviews
4. **Test thoroughly**: Verify frontend behavior when operations are disabled