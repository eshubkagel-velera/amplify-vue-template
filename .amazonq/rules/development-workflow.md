# Development Workflow Rules

## Before Making Changes
- **Check Entity Config Location**: Entity-specific settings are in `/src/config/entities/[ENTITY_NAME].js`, not in centralized files
- **Verify Table Config**: Check `/config/table_config.json` for table inclusion and operation permissions
- **Use Generation Scripts**: Always use `npm run schema` instead of manually editing schema.graphql or VTL templates
- **Review Operation Permissions**: Ensure table_config.json has correct allowQuery/allowCreate/allowUpdate/allowDelete settings

## Database Changes Workflow
1. Update SQL files in `/backend/dml_scripts/individual_tables/`
2. Update `/config/table_config.json` if adding/removing tables
3. Run `npm run schema` to regenerate all dependent files
4. Test changes locally before deployment
5. Use `npm run db:dev -- --dry-run` to preview database changes
6. Deploy with `npm run full-deploy:dev` (or run steps individually: `npm run db:dev` + `npm run deploy:dev`)

## Entity Configuration Changes
- **Preserve Custom Settings**: When updating entity configs, only modify structural elements (fields arrays) and preserve custom business logic
- **Use Individual Files**: Never add entity configurations back to centralized `entityConfig.js`
- **Test Environment Comparison**: After entity config changes, test environment comparison and copy functionality

## Common Commands Reference
- `npm run schema`: Regenerate GraphQL schema, VTL templates, entity configs, and serverless mappings from SQL files
- `npm run db:dev -- --dry-run`: Preview database changes without applying them
- `npm run db:dev`: Apply database changes via RDS Data API
- `npm run db:dev -- --remove-extra`: Apply changes and remove extra columns not in schema
- `npm run deploy:dev`: Deploy GraphQL API to AWS AppSync
- `npm run full-deploy:dev`: Complete deployment (schema + database + API)

## Operation-Level Permissions
- **VTL Template Cleanup**: Schema generation automatically removes VTL templates for disabled operations (allowQuery/allowCreate/allowUpdate/allowDelete set to false)
- **GraphQL Operation Removal**: Only enabled operations appear in GraphQL schema
- **Serverless Mapping Sync**: Resolvers automatically removed from AppSync when operations are disabled

## Troubleshooting Guidelines
- **Missing GraphQL Operations**: Check if VTL templates exist and serverless mappings are updated
- **Entity Config Issues**: Verify individual entity file exists and has correct structure
- **Environment Copy Errors**: Check `preserveOnCopy` and `fieldsToRemove` configurations in entity files
- **Schema Sync Issues**: Regenerate schema from SQL files rather than manual fixes