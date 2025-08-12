# Service Import Implementation

## Overview
A new service import page has been created that allows users to upload OpenAPI YAML or JSON files, parse them to extract service endpoints and parameters, and manage them in the database.

## Files Created/Modified

### 1. ServiceImport.vue Component
**Location:** `src/components/ServiceImport.vue`

**Features:**
- File upload for OpenAPI YAML/JSON files
- OpenAPI specification validation
- Service endpoint extraction
- Parameter extraction (request and response)
- Database integration to check existing services
- Insert/Update functionality for services and parameters
- Custom parameter addition
- Existing parameter detection and graying out

**Key Functions:**
- `parseFile()` - Parses uploaded OpenAPI files
- `extractRequestParameters()` - Extracts request parameters from OpenAPI spec
- `extractResponseParameters()` - Extracts response parameters from OpenAPI spec
- `checkServiceExists()` - Checks if service already exists in database
- `insertService()` - Inserts new service and parameters
- `updateService()` - Updates existing service with new parameters

### 2. App.vue Updates
**Location:** `src/App.vue`

**Changes:**
- Added ServiceImport component to navigation
- Changed navigation from entity-only to include "Import Services" option
- Updated reactive variables and computed properties
- Set default view to import page

### 3. Demo Page
**Location:** `demo.html`

**Purpose:**
- Standalone demonstration of OpenAPI parsing functionality
- No external dependencies required
- Shows service extraction and parameter parsing
- Can be opened directly in browser for testing

## Technical Implementation

### OpenAPI Parsing
The implementation uses industry-standard libraries:

1. **SwaggerParser** - Professional OpenAPI/Swagger parser with full validation
2. **Automatic $ref Resolution** - All schema references resolved automatically
3. **YAML/JSON Support** - Native support for both formats
4. **Validation** - Built-in OpenAPI specification validation

### Parameter Extraction
The system extracts parameters from:
- Path parameters
- Query parameters  
- Request body schemas (including nested objects)
- Response schemas
- Array types
- **Full $ref resolution** - Resolves all schema references recursively
- **Nested object expansion** - Expands all nested objects and their properties
- **Array item resolution** - Resolves array item schemas including $ref references
- **Circular reference detection** - Prevents infinite recursion in circular schemas
- **oneOf/anyOf/allOf handling** - Processes schema variants

### Database Integration
- Checks existing services in SERVICE table
- Checks existing parameters in SERVICE_PARAM table
- Grays out existing parameters to prevent editing
- Allows addition of new/custom parameters
- Provides INSERT button for new services
- Provides UPDATE button for existing services

### Features Implemented

#### ✅ File Upload
- Accepts .yaml, .yml, and .json files
- Validates file format
- Provides error handling

#### ✅ OpenAPI Validation
- Checks for openapi/swagger version
- Validates paths structure
- Provides meaningful error messages

#### ✅ Service Discovery
- Extracts all HTTP methods and paths
- Creates operation IDs automatically
- Captures summaries and descriptions

#### ✅ Parameter Extraction
- **Request Parameters:**
  - Path parameters
  - Query parameters
  - Header parameters
  - Request body properties (fully nested)
  - Array handling with item resolution
  - **Complete $ref resolution**
- **Response Parameters:**
  - Response schema properties (fully nested)
  - Nested object handling with $ref resolution
  - Array response handling with item schemas
  - **All referenced schemas expanded**

#### ✅ Database Integration
- Service existence checking
- Parameter existence checking
- Visual indication of existing parameters
- Insert/Update operations

#### ✅ User Interface
- Dropdown service selection
- Editable parameter tables
- Custom parameter addition
- Action buttons (Insert/Update)
- Error and success messaging

#### ✅ Custom Parameters
- Add new parameter button
- Remove custom parameter functionality
- Editable fields for custom parameters

## Usage Instructions

### 1. Access the Import Page
- Navigate to the application
- Select "Import Services" from the dropdown

### 2. Upload OpenAPI File
- Click "Choose File" and select your OpenAPI YAML or JSON file
- Click "Parse OpenAPI File"

### 3. Select Service
- Choose a service from the dropdown list
- View extracted parameters in the tables

### 4. Review Parameters
- **Grayed out parameters** - Already exist in database
- **Editable parameters** - New parameters that can be modified
- **Custom parameters** - Can be added using "Add Custom Parameter" button

### 5. Save to Database
- **New Service** - Click "Insert Service" to create service and all parameters
- **Existing Service** - Click "Update Parameters" to add only new parameters

## Testing

### Demo Page Testing
1. Open `demo.html` in a web browser
2. Upload the provided `KinectiveAPI/Account.yaml` file
3. Click "Parse OpenAPI File"
4. Select a service to view extracted parameters

### Expected Results for Account.yaml
- **Services Found:** 2 services
  - POST /account-number (Reserve a New Account Number)
  - POST /account-history (Search Transaction History)
- **Parameters Extracted:** All parameters including:
  - Direct properties from request/response schemas
  - **All $ref resolved schemas** (NextAccountNumberRq, AccountHistoryRq, etc.)
  - **Nested object properties** (content.accountType, content.branchNumber, etc.)
  - **Array item properties** if arrays contain object schemas
  - **Referenced type definitions** fully expanded

## Database Schema Requirements

The implementation assumes the following database tables exist:
- `SERVICE` table with fields: SERVICE_ID, SERVICE_PROVIDER_ID, URI, CREATED_BY_USER_ID, CREATED_DATE
- `SERVICE_PARAM` table with fields: SERVICE_PARAM_ID, SERVICE_ID, PARAM_NAME, CREATED_BY_USER_ID, CREATED_DATE

## GraphQL Integration

The component uses existing GraphQL queries and mutations:
- `listServices` - Get existing services
- `listServiceParams` - Get existing parameters
- `createService` - Create new service
- `createServiceParam` - Create new parameter

## Limitations and Future Enhancements

### ✅ Production-Ready Features
1. **SwaggerParser Integration** - Industry-standard OpenAPI parsing
2. **Full $ref Resolution** - External and internal references supported
3. **Automatic Validation** - Built-in OpenAPI specification validation
4. **YAML/JSON Support** - Native parsing for both formats
5. **Error Handling** - Comprehensive error reporting
6. **Circular Reference Protection** - Prevents infinite loops
7. **Schema Variant Handling** - oneOf, anyOf, allOf support

### Current Limitations
1. No authentication parameter handling
2. Basic UI error handling (can be enhanced)

### Recommended Enhancements
1. Install proper YAML parser library (`js-yaml`)
2. Add full $ref resolution
3. Add authentication parameter support
4. Add parameter validation
5. Add bulk operations
6. Add import history tracking
7. Add parameter mapping suggestions

## Dependencies

### Required
- Vue 3
- AWS Amplify (for GraphQL)
- Existing GraphQL schema
- `@apidevtools/swagger-parser` - Professional OpenAPI parsing
- `js-yaml` - YAML parsing support

### Installation

```bash
npm install @apidevtools/swagger-parser js-yaml @types/js-yaml
```

## Production Ready

The implementation now uses professional-grade libraries:
- **SwaggerParser** handles all OpenAPI parsing, validation, and $ref resolution
- **Full compatibility** with OpenAPI 3.0, 3.1, and Swagger 2.0
- **External references** supported (files, URLs)
- **Comprehensive validation** with detailed error messages