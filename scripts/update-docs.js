#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// File patterns that trigger documentation updates
const WATCH_PATTERNS = {
  components: /src\/components\/.*\.vue$/,
  composables: /src\/composables\/.*\.(ts|js)$/,
  utils: /src\/utils\/.*\.(ts|js)$/,
  config: /src\/config\/.*\.(ts|js)$/,
  schema: /amplify\/data\/resource\.ts$/
};

// Get changed files from git
function getChangedFiles() {
  try {
    // In GitHub Actions, check files changed in the push
    if (process.env.GITHUB_ACTIONS) {
      const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    }
    // For local commits, check staged files
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Update project-docs.md rule file
function updateProjectDocs() {
  const rulePath = '.amazonq/rules/project-docs.md';
  const timestamp = new Date().toISOString().split('T')[0];
  
  const content = `# Project Documentation Context

This rule automatically loads project documentation into Amazon Q context for this Vue.js/AWS Amplify environment comparison tool.

## Architecture Overview
The application is a Vue 3 + TypeScript application with AWS Amplify backend that provides environment comparison capabilities for database entities. Key components include:

- **EnvironmentComparison.vue**: Main comparison interface between environments
- **EntityManager.vue**: Generic CRUD interface for any entity type  
- **comparisonClient.js**: Cross-environment API communication
- **unifiedGraphQLClient.js**: Centralized GraphQL client management

## Component Hierarchy
\`\`\`
App.vue
├── EnvironmentComparison.vue (Main comparison interface)
│   ├── EntityManager.vue (Primary environment data)
│   └── EntityManager.vue (Comparison environment data)
├── EntityManager.vue (Standalone entity management)
└── ThemeToggle.vue (UI theme switching)
\`\`\`

## Key Entity Types
- SERVICE: Service configurations with providers and URIs
- ORIGIN_PRODUCT: Product definitions and configurations
- REDIRECT_URL: URL redirection mappings
- SERVICE_PROVIDER: Service provider configurations
- SERVICE_PARAM: Service parameter definitions
- SERVICE_PARAM_MAPPING: Parameter mapping configurations
- STEP_SERVICE_MAPPING: Step-to-service mappings
- STEP_TYPE: Step type definitions

## Data Flow Patterns
1. **Standard CRUD**: User Action → EntityManager → GraphQL Client → AWS AppSync → DynamoDB
2. **Environment Comparison**: User Selects Comparison → EnvironmentComparison → Primary Data + Comparison Data → analyzeDifferences() → UI Updates
3. **Bulk Operations**: User Selects Records → Progress Modal → Batch Processing → Individual API Calls → Progress Updates

## Development Context
- Uses Vue 3 Composition API with TypeScript
- AWS Amplify for backend (AppSync GraphQL + DynamoDB)
- Vite for build tooling
- Authentication via AWS Cognito
- Environment-specific configurations for dev/staging/prod

## Key Files to Reference
- \`src/components/EnvironmentComparison.vue\`: Main comparison logic
- \`src/components/EntityManager.vue\`: Generic entity management
- \`src/utils/comparisonClient.js\`: Cross-environment API calls
- \`src/config/entityConfig.js\`: Entity configurations
- \`amplify/data/resource.ts\`: GraphQL schema definitions

*Last updated: ${timestamp}*`;

  fs.writeFileSync(rulePath, content);
  console.log('✓ Updated project-docs.md');
}

// Main execution
function main() {
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('No staged files to check');
    return;
  }

  const shouldUpdate = changedFiles.some(file => 
    Object.values(WATCH_PATTERNS).some(pattern => pattern.test(file))
  );

  if (shouldUpdate) {
    console.log('Code changes detected, updating documentation...');
    updateProjectDocs();
  } else {
    console.log('No documentation-relevant changes detected');
  }
}

main();