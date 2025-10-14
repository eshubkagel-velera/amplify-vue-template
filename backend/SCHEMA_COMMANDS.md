# Schema Commands Reference

## Single Consolidated Command: `npm run schema`

All GraphQL schema, VTL template, and serverless mapping operations use one command:

### Basic Usage
```bash
npm run schema
```

### What it does:

1. **Reads SQL files** from `/backend/dml_scripts/individual_tables/`
2. **Auto-updates table_config.json** with new/removed SQL files
3. **Checks operation permissions** in `/config/table_config.json`
4. **Generates GraphQL schema** (`schema.graphql`) with only allowed operations
5. **Creates VTL mapping templates** (`/backend/mapping-templates/`) for allowed operations only
6. **Updates entity configurations** (`/src/config/entities/`) preserving custom settings
7. **Synchronizes serverless mappings** (`serverless.yml`) automatically

### When to run:

- After adding/modifying SQL table definitions
- When VTL templates or GraphQL schema are out of sync
- Before deploying schema changes

### Operation Permissions:

The `table_config.json` file controls which operations are available for each table:

```json
{
  "tableName": {
    "includeInGraphQL": true,
    "includeInApp": true,
    "allowQuery": true,
    "allowCreate": true,
    "allowUpdate": true,
    "allowDelete": false
  }
}
```

- **allowQuery**: Generates `listTableNameS` query and VTL templates
- **allowCreate**: Generates `createTableName` mutation and VTL templates
- **allowUpdate**: Generates `updateTableName` mutation and VTL templates
- **allowDelete**: Generates `deleteTableName` mutation and VTL templates

**Note:** The command automatically updates `table_config.json` when new SQL files are added or removed, with all operations enabled by default.

### Generated Files:

**GraphQL Schema:**
- `backend/schema.graphql` - Complete GraphQL schema with types, inputs, queries, mutations

**VTL Templates:**
- `Query.list[TABLE_NAME]S.request.vtl`
- `Query.list[TABLE_NAME]S.response.vtl`
- `Mutation.create[TABLE_NAME].request.vtl`
- `Mutation.create[TABLE_NAME].response.vtl`
- `Mutation.update[TABLE_NAME].request.vtl`
- `Mutation.update[TABLE_NAME].response.vtl`
- `Mutation.delete[TABLE_NAME].request.vtl`
- `Mutation.delete[TABLE_NAME].response.vtl`

**Entity Configurations:**
- Updates field arrays in `/src/config/entities/[TABLE_NAME].js`
- Preserves custom settings (rowActions, fieldLookups, etc.)

**Serverless Mappings:**
- Automatically updates `serverless.yml` with all VTL template mappings
- Connects GraphQL operations to VTL resolvers

### Safety Features:

- **Preserves custom settings** in entity configurations
- **Only updates field arrays** to match current database structure
- **Cleans up old files** for tables no longer in `table_config.json`
- **Removes disabled operations** - deletes VTL templates for operations set to false
- **Validates SQL parsing** before generating schema
- **Respects operation permissions** - only generates allowed operations
- **Auto-manages table config** - adds new tables, removes deleted ones
- **Syncs deployments** - removes resolvers from AppSync when operations are disabled

### Integration:

The schema command is automatically integrated into the database update workflow - when you run `npm run db [env]`, it uses the latest generated schema and templates.