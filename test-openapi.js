// Simple test to validate OpenAPI parsing
import SwaggerParser from '@apidevtools/swagger-parser';
import fs from 'fs';

async function testOpenAPIParser() {
  try {
    // Read the Account.yaml file
    const yamlContent = fs.readFileSync('./KinectiveAPI/Account.yaml', 'utf8');
    
    // Parse the OpenAPI spec
    const api = await SwaggerParser.parse(yamlContent);
    
    console.log('OpenAPI parsing successful!');
    console.log('API Title:', api.info.title);
    console.log('API Version:', api.info.version);
    
    // Extract services
    const services = [];
    Object.entries(api.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        services.push({
          path,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          summary: operation.summary || '',
          parameters: operation.parameters || [],
          requestBody: operation.requestBody,
          responses: operation.responses
        });
      });
    });
    
    console.log('\nFound services:');
    services.forEach(service => {
      console.log(`- ${service.method} ${service.path}: ${service.summary}`);
    });
    
    // Test parameter extraction for first service
    if (services.length > 0) {
      const firstService = services[0];
      console.log('\nFirst service details:');
      console.log('Parameters:', firstService.parameters);
      console.log('Request Body:', firstService.requestBody);
      console.log('Responses:', Object.keys(firstService.responses));
    }
    
  } catch (error) {
    console.error('Error parsing OpenAPI:', error.message);
  }
}

testOpenAPIParser();