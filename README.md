# Vue Environment Comparison Tool

A Vue 3 + TypeScript application with AWS AppSync backend for comparing and managing database entities across different environments.

## Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Access to AWS AppSync and RDS resources

### Installation
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Development Commands

**Schema Management:**
```bash
cd backend
npm run schema                    # Generate GraphQL schema, VTL templates, entity configs
```

**Database Operations:**
```bash
cd backend
npm run db:dev -- --dry-run      # Preview database changes
npm run db:dev                    # Apply database changes
npm run db:dev -- --remove-extra # Apply changes and remove extra columns
```

**API Deployment:**
```bash
cd backend
npm run deploy:dev               # Deploy AppSync API
```

**Full Deployment:**
```bash
cd backend
npm run full-deploy:dev          # Schema + Database + API deployment
```

## Architecture

### Frontend (Vue 3 + TypeScript)
- **EnvironmentComparison.vue**: Main comparison interface
- **EntityManager.vue**: Generic CRUD interface for entities
- **Entity Configurations**: Individual files in `/src/config/entities/`

### Backend (AWS AppSync + RDS)
- **SQL Files**: Database structure in `/backend/dml_scripts/individual_tables/`
- **Table Config**: Operation permissions in `/config/table_config.json`
- **VTL Templates**: Auto-generated resolvers in `/backend/mapping-templates/`
- **Database Config**: Centralized in `/config/database-config.yml`

## Key Features

### Environment Comparison
- Compare data between dev/test/uat/live environments
- Bulk copy operations with foreign key preservation
- Configurable field matching and comparison logic

### Smart Schema Management
- SQL files as source of truth for database structure
- Auto-generated GraphQL schema and VTL templates
- Operation-level permissions (query/create/update/delete)
- Preserves custom entity configurations

### Data-Safe Database Updates
- Smart schema comparison and ALTER statement generation
- Preserves all existing data during schema changes
- Preview mode for all database operations
- Optional removal of orphaned columns

## Configuration

### Table Permissions (`table_config.json`)
```json
{
  "TABLE_NAME": {
    "includeInGraphQL": true,
    "includeInApp": true,
    "allowQuery": true,
    "allowCreate": true,
    "allowUpdate": true,
    "allowDelete": false
  }
}
```

### Entity Configuration (`/src/config/entities/TABLE_NAME.js`)
```javascript
export default {
  name: 'TABLE_NAME',
  idField: 'TABLE_ID',
  preserveOnCopy: ['TABLE_ID', 'FOREIGN_KEY_ID'],
  fieldsToRemove: ['DISPLAY_FIELD'],
  comparisonConfig: {
    matchingFields: ['NAME_FIELD'],
    comparisonFields: ['NAME_FIELD', 'VALUE_FIELD']
  }
  // ... other configurations
};
```

## Workflow

**Individual Steps:**
1. **Update SQL files** in `/backend/dml_scripts/individual_tables/`
2. **Run schema generation**: `npm run schema`
3. **Preview database changes**: `npm run db:dev -- --dry-run`
4. **Apply changes**: `npm run db:dev`
5. **Deploy API**: `npm run deploy:dev`

**Or Single Command:**
1. **Update SQL files** in `/backend/dml_scripts/individual_tables/`
2. **Full deployment**: `npm run full-deploy:dev`

## Documentation

- **[Database Commands](backend/DATABASE_COMMANDS.md)**: Database operation reference
- **[Schema Commands](backend/SCHEMA_COMMANDS.md)**: Schema generation reference  
- **[Table Configuration](backend/TABLE_CONFIG.md)**: Table permissions and configuration

## Security

- AWS Cognito authentication with role-based access
- Operation-level permissions per table
- Environment-specific database configurations
- Audit trail for all data changes