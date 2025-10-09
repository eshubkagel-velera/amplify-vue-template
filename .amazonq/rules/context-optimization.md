# Context Optimization Rules

## File Reference Patterns
- **Use Specific Paths**: Reference specific files like `/src/config/entities/SERVICE.js` instead of broad directory scans
- **Avoid Large File Reads**: Don't read entire `serverless.yml` or `schema.graphql` unless necessary for the specific task
- **Focus on Changed Files**: When making updates, only read/modify the specific files being changed

## Entity Configuration Context
- **Individual Entity Focus**: When working with entity configs, only reference the specific entity file needed
- **Avoid entityConfig.js**: The main `entityConfig.js` file is now minimal - focus on individual entity files instead
- **Preserve Custom Settings**: When updating entity configs, read existing file first to preserve custom configurations

## Database Schema Context
- **Use table_config.json**: Reference `/backend/dml_scripts/table_config.json` to understand table inclusion and operation permissions (allowQuery/allowCreate/allowUpdate/allowDelete)
- **SQL File Focus**: When working with database changes, reference specific SQL files in `/backend/dml_scripts/individual_tables/`
- **Operation-Level Permissions**: Check table_config.json for which operations are enabled per table
- **Avoid Full Schema Reads**: Don't read entire `schema.graphql` unless specifically needed

## Backend Script Context
- **Script-Specific Focus**: When working with automation, reference only the specific script being modified
- **Avoid Package.json Scans**: Reference specific npm scripts by name rather than reading entire package.json
- **Use Generation Scripts**: Prefer using existing generation scripts over manual file creation

## Conversation Efficiency
- **State Current Architecture**: Always mention that entity configs are decentralized to individual files
- **Reference Automation**: Point to existing scripts (`npm run schema`) for common tasks
- **Focus on Specific Issues**: Address only the specific problem without reviewing entire project structure
- **Use Project Rules**: Reference these rules instead of re-explaining architecture patterns