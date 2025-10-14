# Project Documentation Context

This rule automatically loads project documentation into Amazon Q context for this Vue.js/AWS Amplify environment comparison tool.

## Architecture Overview
The application is a Vue 3 + TypeScript application with AWS Amplify backend that provides environment comparison capabilities for database entities. Key components include:

- **EnvironmentComparison.vue**: Main comparison interface between environments
- **EntityManager.vue**: Generic CRUD interface for any entity type  
- **comparisonClient.js**: Cross-environment API communication
- **unifiedGraphQLClient.js**: Centralized GraphQL client management

## Component Hierarchy
```
App.vue
├── EnvironmentComparison.vue (Main comparison interface)
│   ├── EntityManager.vue (Primary environment data)
│   └── EntityManager.vue (Comparison environment data)
├── EntityManager.vue (Standalone entity management)
└── ThemeToggle.vue (UI theme switching)
```

## Key Entity Types
- **CONFIG_PARAM**: System configuration parameters
- **FILTER_CRITERIA**: Filtering criteria for data processing
- **LOAN_APP**: Loan application records (read-only)
- **LOAN_APP_EXECS**: Loan application executions (read-only)
- **LOAN_APP_STEP_STATUS**: Loan application step status tracking (read-only)
- **NEW_MEMBER_TOKEN**: Member authentication tokens (read-only)
- **ORIGIN_PRODUCT**: Product definitions and configurations
- **REDIRECT_URL**: URL redirection mappings
- **SERVICE**: Service configurations with providers and URIs
- **SERVICE_DOMAIN**: Service domain configurations
- **SERVICE_EXPR_MAPPING**: Service expression mappings
- **SERVICE_PARAM**: Service parameter definitions
- **SERVICE_PARAM_MAPPING**: Parameter mapping configurations
- **SERVICE_PROVIDER**: Service provider configurations
- **SORT_CRITERIA**: Sorting criteria for data processing
- **STEP_SERVICE_MAPPING**: Step-to-service mappings
- **STEP_TYPE**: Step type definitions
- **STEP_TYPE_PARAM_MAP**: Step type parameter mappings

## Data Flow Patterns
1. **Standard CRUD**: User Action → EntityManager → GraphQL Client → AWS AppSync → RDS Database
2. **Environment Comparison**: User Selects Comparison → EnvironmentComparison → Primary Data + Comparison Data → analyzeDifferences() → UI Updates
3. **Bulk Operations**: User Selects Records → Progress Modal → Batch Processing → Individual API Calls → Progress Updates
4. **Schema Generation**: SQL Files → generate-schema-from-sql.js → GraphQL Schema + VTL Templates + Entity Configs + Serverless Mappings

## Development Context
- Uses Vue 3 Composition API with TypeScript
- AWS AppSync GraphQL API with RDS Data API backend
- Serverless Framework for deployment
- Authentication via AWS Cognito
- Environment-specific configurations for dev/test/uat/live

## Current Architecture (Updated)
- **Entity Configurations**: Decentralized to individual files in `/src/config/entities/[ENTITY_NAME].js`
- **Database Schema**: SQL files in `/backend/dml_scripts/individual_tables/` are source of truth
- **GraphQL Schema**: Auto-generated from SQL files via `npm run schema`
- **VTL Templates**: Auto-generated and synchronized with serverless.yml mappings
- **Database Updates**: Via RDS Data API using `npm run db [env]`

## Key Files to Reference
- `src/config/entities/[ENTITY_NAME].js`: Individual entity configurations
- `src/config/entityConfig.js`: CRUD function generation and custom business logic only
- `config/table_config.json`: Controls which tables are included in GraphQL/App
- `backend/scripts/generate-schema-from-sql.js`: Schema generation from SQL files
- `config/database-config.yml`: Centralized database connection configuration

*Last updated: 2025-01-03*