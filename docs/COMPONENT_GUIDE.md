# Component Guide

## Component Hierarchy

```
App.vue
├── EnvironmentComparison.vue (Main comparison interface)
│   ├── EntityManager.vue (Primary environment data)
│   └── EntityManager.vue (Comparison environment data)
├── EntityManager.vue (Standalone entity management)
└── ThemeToggle.vue (UI theme switching)
```

## Key Components

### EnvironmentComparison.vue
**Location**: `src/components/EnvironmentComparison.vue`

**Purpose**: Orchestrates side-by-side comparison between two environments

**Key Features**:
- Dual EntityManager instances
- Difference analysis and highlighting
- Bulk operations (copy selected records)
- Progress tracking with modal dialogs
- Field-level difference detection

**Props**:
- `primaryEnvironment`: Source environment name
- `compareEnvironment`: Target environment name
- `selectedEntity`: Entity type to compare
- `entityConfig`: Configuration object for the entity

**Key Methods**:
- `analyzeDifferences()`: Compares datasets and identifies differences
- `copySelectedRecords()`: Bulk copy operation with progress tracking
- `calculateMatch()`: Entity-specific matching algorithm

### EntityManager.vue
**Location**: `src/components/EntityManager.vue`

**Purpose**: Generic CRUD interface for any entity type

**Key Features**:
- Dynamic table rendering based on entity configuration
- Filtering and search capabilities
- Row selection (single/multiple)
- Inline editing
- Pagination support
- Export functionality

**Props**:
- `entityType`: Type of entity (SERVICE, ORIGIN_PRODUCT, etc.)
- `loadFunction`: Function to load data
- `updateFunction`: Function to update records
- `deleteFunction`: Function to delete records
- `entityConfig`: Configuration defining fields and behavior

**Key Methods**:
- `loadData()`: Fetches data using provided load function
- `handleUpdate()`: Processes record updates
- `handleDelete()`: Processes record deletions
- `applyFilters()`: Filters data based on user input

## Composables

### useAuth.ts
**Location**: `src/composables/useAuth.ts`

**Purpose**: Authentication state management

**Exports**:
- `user`: Current authenticated user
- `isAuthenticated`: Authentication status
- `signOut()`: Sign out function

### useTableOperations.ts
**Location**: `src/composables/useTableOperations.ts`

**Purpose**: Common table operations and utilities

**Exports**:
- `formatFieldValue()`: Formats field values for display
- `validateField()`: Field validation logic
- `sortData()`: Data sorting utilities

### useErrorHandler.ts
**Location**: `src/composables/useErrorHandler.ts`

**Purpose**: Centralized error handling

**Exports**:
- `handleError()`: Error processing and user notification
- `logError()`: Error logging functionality

## Utility Modules

### comparisonClient.js
**Location**: `src/utils/comparisonClient.js`

**Purpose**: Cross-environment API communication

**Key Functions**:
- `loadComparisonData()`: Load data from comparison environment
- `updateComparisonRecord()`: Update record in comparison environment
- `switchEnvironment()`: Change active environment context

### unifiedGraphQLClient.js
**Location**: `src/utils/unifiedGraphQLClient.js`

**Purpose**: Centralized GraphQL client management

**Key Functions**:
- `createClient()`: Create environment-specific GraphQL client
- `executeQuery()`: Execute GraphQL queries with error handling
- `executeUpdate()`: Execute GraphQL mutations

## Entity Configurations

Entity configurations define how each entity type behaves in the application:

```javascript
const entityConfigs = {
  SERVICE: {
    fields: ['SERVICE_PROVIDER_NAME', 'URI', 'SECRET_NAME', 'REQUEST_TYPE'],
    matchingFields: ['SERVICE_PROVIDER_NAME', 'URI'],
    displayName: 'Services',
    primaryKey: 'SERVICE_ID'
  },
  ORIGIN_PRODUCT: {
    fields: ['PRODUCT_ID', 'PRODUCT_NAME', 'DESCRIPTION'],
    matchingFields: ['PRODUCT_ID'],
    displayName: 'Origin Products',
    primaryKey: 'ORIGIN_PRODUCT_ID'
  }
  // ... other entities
}
```

## Data Flow Patterns

### 1. Standard CRUD Operations
```
User Action → EntityManager → GraphQL Client → AWS AppSync → DynamoDB
```

### 2. Environment Comparison
```
User Selects Comparison → EnvironmentComparison → 
  Primary Data (unifiedGraphQLClient) + 
  Comparison Data (comparisonClient) → 
  analyzeDifferences() → 
  UI Updates
```

### 3. Bulk Operations
```
User Selects Records → Progress Modal → 
  Batch Processing → 
  Individual API Calls → 
  Progress Updates → 
  Success/Error Handling
```

## State Management

The application uses Vue 3's Composition API with reactive references:

- **Local State**: Component-level reactive refs
- **Shared State**: Composables for cross-component state
- **Persistent State**: localStorage for user preferences
- **Authentication State**: Amplify Auth integration

## Error Handling Strategy

1. **API Errors**: Caught and displayed via error modals
2. **Validation Errors**: Inline field validation with user feedback
3. **Network Errors**: Retry mechanisms with user notification
4. **Authentication Errors**: Automatic redirect to login

## Testing Strategy

- **Unit Tests**: Individual component testing with Vitest
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user workflow testing
- **API Tests**: GraphQL operation testing

---

*This guide should be updated whenever new components are added or existing ones are significantly modified.*