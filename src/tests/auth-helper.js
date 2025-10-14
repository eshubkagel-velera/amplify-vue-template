import { signIn } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Configure Amplify for tests
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_iAtP0Uzh5',
      userPoolClientId: '28h9r16c1gnq9v60jc1d5uuo5b',
      loginWith: {
        oauth: {
          domain: 'velera-hazel-config.auth.us-east-2.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['http://localhost:5173/'],
          redirectSignOut: ['http://localhost:5173/'],
          responseType: 'code'
        }
      }
    }
  }
});

export async function authenticateTestUser() {
  try {
    await signIn({
      username: 'developer-user@velera.com',
      password: 'DevPass123!'
    });
    console.log('✅ Test user authenticated');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}