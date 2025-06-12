# Vue.js AppSync GraphQL Integration

This project demonstrates how to connect a Vue.js application to an AWS AppSync GraphQL API.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

3. Configure your environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     VITE_APPSYNC_API_URL=your_appsync_api_url
     VITE_APPSYNC_API_KEY=your_appsync_api_key
     VITE_APPSYNC_REGION=your_aws_region
     ```

4. Deploy the backend:
   ```
   npx amplify sandbox
   ```
   or
   ```
   npx amplify deploy
   ```

5. Run the development server:
   ```
   npm run dev
   ```

## Project Structure

- `src/api.ts` - Amplify configuration for AppSync
- `src/graphql.ts` - GraphQL operations
- `src/types.ts` - TypeScript interfaces for the data model
- `src/components/` - Vue components
- `amplify/` - Amplify backend configuration

## Adding New Entities

1. Define the entity interface in `src/types.ts`
2. Add the entity to the schema in `amplify/data/resource.ts`
3. Create GraphQL operations in `src/graphql.ts`
4. Add the entity configuration to the `entities` array in `src/App.vue`

## Authentication

This project uses API key authentication by default. To use other authentication methods:

1. Update the `authorizationModes` in `amplify/data/resource.ts`
2. Update the `defaultAuthMode` in `src/api.ts`

## Learn More

- [AWS Amplify Documentation](https://docs.amplify.aws)
- [Vue.js Documentation](https://vuejs.org/guide/introduction.html)
- [AppSync Documentation](https://docs.aws.amazon.com/appsync/latest/devguide/welcome.html)