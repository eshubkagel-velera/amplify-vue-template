# Multi-Environment GraphQL API Setup

## Structure
```
project/
├── shared/                    # Shared code across environments
│   ├── config/environments.ts # Environment configurations
│   ├── schema/schema.graphql  # GraphQL schema
│   ├── resolvers/             # GraphQL resolvers
│   └── frontend/src/graphql/  # GraphQL queries/mutations
├── environments/              # Environment-specific configs
│   ├── dev/amplify/backend.ts
│   ├── test/amplify/backend.ts
│   ├── uat/amplify/backend.ts
│   └── prod/amplify/backend.ts
└── scripts/                   # Deployment scripts
```

## Environment Endpoints
- **DEV**: https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql
- **TEST**: https://duvqljupwfacli45hvfqoi3uni.appsync-api.us-east-2.amazonaws.com/graphql
- **UAT**: https://uat-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql
- **PROD**: https://live-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql

## Usage

### Development
```bash
npm run dev          # Run dev environment
npm run dev:test     # Run test environment
npm run dev:uat      # Run UAT environment
npm run dev:prod     # Run prod environment
```

### Deployment
```bash
npm run deploy:dev   # Deploy to dev
npm run deploy:test  # Deploy to test
npm run deploy:uat   # Deploy to UAT
npm run deploy:prod  # Deploy to prod
```

### Sync Shared Files
```bash
npm run sync         # Sync shared files to all environments
```

## Key Benefits
- ✅ Single source of truth for schema/resolvers
- ✅ Environment-specific configurations
- ✅ Separate GraphQL APIs per environment
- ✅ Minimal file duplication
- ✅ Easy deployment and updates