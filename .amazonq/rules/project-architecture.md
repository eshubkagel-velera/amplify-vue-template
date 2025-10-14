# Project Architecture Rules

## Entity Configuration Management
- **Individual Entity Files**: All entity configurations are stored in `/src/config/entities/[ENTITY_NAME].js` files, not in centralized `entityConfig.js`
- **Entity Config Structure**: Each entity file exports default object with: `name`, `idField`, `fields`, `formFields`, `preserveOnCopy`, `comparisonConfig`, `fieldsToRemove`, `keepAuditFieldsOnUpdate`, plus optional `hasRowActions`, `rowActions`, `fieldLookups`, `hasFilters`, `filterType`, `autoFillFromFilter`
- **No Centralized Config**: The main `entityConfig.js` only handles CRUD function generation and custom business logic, never hardcoded entity configurations

## Database Schema Management
- **SQL as Source of Truth**: Database structure is defined in `/backend/dml_scripts/individual_tables/*.sql` files
- **Table Configuration**: `/config/table_config.json` controls table inclusion and operation permissions (allowQuery, allowCreate, allowUpdate, allowDelete)
- **Automated Generation**: Run `npm run schema` to auto-generate `schema.graphql`, VTL templates, entity configs, and serverless mappings from SQL files
- **Operation-Level Control**: Only allowed operations generate GraphQL schema entries and VTL templates
- **VTL Template Cleanup**: Automatically removes VTL templates and serverless mappings for disabled operations
- **Schema Sync**: Always regenerate schema after database changes to keep GraphQL, VTL templates, and entity configs synchronized

## Environment Comparison & Copy Operations
- **Foreign Key Preservation**: Use `preserveOnCopy` array in entity configs to specify which fields should preserve destination environment values during cross-environment copies
- **Field Removal**: Use `fieldsToRemove` array to specify enhanced/display fields that must be removed before GraphQL mutations
- **Comparison Configuration**: Define `comparisonConfig` with `matchingFields`, `comparisonFields`, and optional `stringMatchFields`/`stringMatchThreshold` for environment comparison logic

## Backend Automation
- **Serverless Mapping Sync**: VTL mapping templates are automatically synchronized with `serverless.yml` when running schema generation
- **Database Updates**: Use `npm run db:dev` for database updates, `npm run db:dev -- --dry-run` for previews, `npm run db:dev -- --remove-extra` to remove extra columns
- **API Deployment**: Use `npm run deploy:dev` for GraphQL API deployment
- **Full Deployment**: Use `npm run full-deploy:dev` for complete deployment (schema + database + API)
- **Centralized Database Config**: All database connection details are in `/config/database-config.yml`, referenced by both serverless deployment and database update scripts

## File Organization Patterns
- **Backend Scripts**: All automation scripts in `/backend/scripts/` directory
- **VTL Templates**: Auto-generated in `/backend/mapping-templates/` following naming pattern `[Type].[operation].[request|response].vtl`
- **Entity Configs**: Individual files in `/src/config/entities/` preserve custom settings while allowing automated field updates
- **No Manual VTL/Schema Editing**: Always use generation scripts rather than manually editing GraphQL schema or VTL templates